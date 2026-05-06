import AVFoundation
import Foundation
import Observation
import OSLog
import UIKit

private final class FrameCaptureDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate, @unchecked Sendable {
    var onFrame: (@Sendable (CMSampleBuffer) -> Void)?

    func captureOutput(
        _: AVCaptureOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from _: AVCaptureConnection
    ) {
        onFrame?(sampleBuffer)
    }
}

@MainActor
@Observable
final class GeminiLiveManager {

    enum SessionState: Sendable {
        case idle
        case starting
        case active
        case error(String)
    }

    enum VideoSource: Sendable {
        case glasses
        case iPhone
    }

    struct TranscriptEntry: Identifiable, Sendable {
        let id = UUID()
        let role: String
        let text: String
    }

    private(set) var state: SessionState = .idle
    private(set) var transcript: [TranscriptEntry] = []
    private(set) var isModelSpeaking = false
    private(set) var videoSource: VideoSource = .glasses
    var captureSession: AVCaptureSession? { _captureSession }

    let glasses = GlassesManager()

    private var client: GeminiLiveClient?
    private var eventTask: Task<Void, Never>?

    private var audioEngine: AVAudioEngine?
    private var audioConverter: AVAudioConverter?
    private let audioAccumulator = OSAllocatedUnfairLock(initialState: Data())
    private static let audioChunkSize = 3200 // 100ms at 16kHz, 16-bit = 1600 samples * 2 bytes

    private var playerNode: AVAudioPlayerNode?
    private var playerMixerNode: AVAudioMixerNode?
    private var playbackEngine: AVAudioEngine?

    private var _captureSession: AVCaptureSession?
    private let captureDelegate = FrameCaptureDelegate()
    private let captureQueue = DispatchQueue(label: "ai.openclaw.gemini.capture")
    private var lastFrameImage: UIImage?
    private var frameTimer: Timer?

    private var gatewayAddress: String?
    private var gatewayToken: String?
    private var inFlightToolCalls: [String: Task<Void, Never>] = [:]

    private let logger = Logger(subsystem: "ai.openclaw", category: "GeminiLiveManager")

    static let defaultModel = "models/gemini-2.5-flash-native-audio-latest"

    static let defaultSystemPrompt = """
        You are an AI assistant for someone wearing Meta Ray-Ban smart glasses. You can see through \
        their camera and have a voice conversation. Keep responses concise and natural.

        You have one tool: execute. It connects you to a powerful personal assistant that can do anything — \
        send messages, search the web, manage lists, set reminders, research topics, control devices, and more.

        ALWAYS use execute when the user asks you to take any action, remember anything, or look something up. \
        Be detailed in your task description. Never pretend to do these things yourself.

        Before calling execute, speak a brief acknowledgment so the user knows you heard them. \
        The tool may take several seconds, so the acknowledgment lets them know something is happening.
        """

    func start(apiKey: String, model: String, systemPrompt: String, gatewayAddress: String?, gatewayToken: String?) {
        guard case .idle = state else { return }
        guard !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            state = .error("Gemini API key required")
            return
        }

        self.gatewayAddress = gatewayAddress
        self.gatewayToken = gatewayToken
        state = .starting
        transcript = []

        videoSource = glasses.isConnected ? .glasses : .iPhone

        let client = GeminiLiveClient { [weak self] event in
            Task { @MainActor [weak self] in
                self?.handleEvent(event)
            }
        }
        self.client = client

        Task {
            do {
                try self.configureAudioSession()
                try self.setupCapture()
                try self.setupPlayback()
            } catch {
                self.state = .error("Audio/camera setup failed: \(error.localizedDescription)")
                return
            }

            await client.connect(apiKey: apiKey, model: model, systemPrompt: systemPrompt)
        }
    }

    func setVideoSource(_ source: VideoSource) {
        guard state != .idle else { videoSource = source; return }
        let wasActive = state == .active
        videoSource = source
        frameTimer?.invalidate()
        frameTimer = nil
        if source == .iPhone {
            glasses.onFrameCaptured = nil
            setupCameraCapture()
        } else {
            _captureSession?.stopRunning()
            _captureSession = nil
        }
        if wasActive { startFrameTimer() }
    }

    func stop() {
        frameTimer?.invalidate()
        frameTimer = nil
        stopMicCapture()
        stopPlayback()
        _captureSession?.stopRunning()
        _captureSession = nil
        glasses.onFrameCaptured = nil
        Task { await glasses.stopStreaming() }
        for (_, task) in inFlightToolCalls { task.cancel() }
        inFlightToolCalls.removeAll()

        Task {
            await client?.disconnect()
            client = nil
        }

        deactivateAudioSession()
        state = .idle
    }

    // MARK: - Event Handling

    private func handleEvent(_ event: GeminiLiveClient.Event) {
        switch event {
        case let .stateChanged(clientState):
            switch clientState {
            case .ready:
                state = .active
                startMicCapture()
                startFrameTimer()
            case let .error(msg):
                state = .error(msg)
                stop()
            case .disconnected where state != .idle:
                state = .idle
            default:
                break
            }

        case let .audioReceived(data):
            isModelSpeaking = true
            playAudio(data)

        case let .inputTranscription(text):
            appendTranscript(role: "You", text: text)

        case let .outputTranscription(text):
            appendTranscript(role: "Gemini", text: text)

        case .turnComplete:
            isModelSpeaking = false

        case .interrupted:
            isModelSpeaking = false
            flushPlayback()

        case let .toolCall(id, name, task):
            handleToolCall(id: id, name: name, task: task)

        case let .toolCallCancellation(ids):
            for id in ids {
                inFlightToolCalls[id]?.cancel()
                inFlightToolCalls.removeValue(forKey: id)
            }

        case let .goAway(seconds):
            logger.warning("Session ending in \(seconds)s")
            appendTranscript(role: "System", text: "Session ending in \(seconds)s")
        }
    }

    // MARK: - Mic Capture (16kHz PCM Int16)

    private func setupCapture() throws {
        let engine = AVAudioEngine()
        let inputFormat = engine.inputNode.outputFormat(forBus: 0)
        guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
            throw NSError(domain: "GeminiLive", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "No audio input available",
            ])
        }

        let targetFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16000, channels: 1, interleaved: false)!
        if inputFormat.sampleRate != 16000 || inputFormat.channelCount != 1 {
            guard let converter = AVAudioConverter(from: inputFormat, to: targetFormat) else {
                throw NSError(domain: "GeminiLive", code: 2, userInfo: [
                    NSLocalizedDescriptionKey: "Cannot create audio converter from \(inputFormat) to \(targetFormat)",
                ])
            }
            self.audioConverter = converter
        }

        self.audioEngine = engine
    }

    private func startMicCapture() {
        guard let engine = audioEngine else { return }
        let inputFormat = engine.inputNode.outputFormat(forBus: 0)
        let converter = self.audioConverter
        let accumulator = self.audioAccumulator
        let chunkSize = Self.audioChunkSize
        let client = self.client

        engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { buffer, _ in
            let int16Data: Data
            if let converter {
                let ratio = 16000.0 / inputFormat.sampleRate
                let outputCapacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1
                guard let outputBuffer = AVAudioPCMBuffer(
                    pcmFormat: AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 16000, channels: 1, interleaved: false)!,
                    frameCapacity: outputCapacity
                ) else { return }

                var convError: NSError?
                var consumed = false
                converter.convert(to: outputBuffer, error: &convError) { _, status in
                    if consumed { status.pointee = .noDataNow; return nil }
                    consumed = true
                    status.pointee = .haveData
                    return buffer
                }
                if convError != nil { return }
                int16Data = Self.float32ToInt16(outputBuffer)
            } else {
                int16Data = Self.float32ToInt16(buffer)
            }

            guard !int16Data.isEmpty else { return }

            var chunksToSend: [Data] = []
            accumulator.withLock { acc in
                acc.append(int16Data)
                while acc.count >= chunkSize {
                    chunksToSend.append(Data(acc.prefix(chunkSize)))
                    acc = Data(acc.dropFirst(chunkSize))
                }
            }

            for chunk in chunksToSend {
                Task { await client?.sendAudio(chunk) }
            }
        }

        do {
            try engine.start()
        } catch {
            logger.error("Audio engine start failed: \(error.localizedDescription)")
        }
    }

    private func stopMicCapture() {
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        audioConverter = nil
        audioAccumulator.withLock { $0 = Data() }
    }

    private static func float32ToInt16(_ buffer: AVAudioPCMBuffer) -> Data {
        guard let floatData = buffer.floatChannelData?[0] else { return Data() }
        let count = Int(buffer.frameLength)
        var result = Data(count: count * 2)
        result.withUnsafeMutableBytes { ptr in
            let int16 = ptr.bindMemory(to: Int16.self)
            for i in 0 ..< count {
                let clamped = max(-1.0, min(1.0, floatData[i]))
                int16[i] = Int16(clamped * Float(Int16.max))
            }
        }
        return result
    }

    // MARK: - Audio Playback (24kHz PCM Int16)

    private func setupPlayback() throws {
        let engine = AVAudioEngine()
        let player = AVAudioPlayerNode()
        let mixer = AVAudioMixerNode()
        engine.attach(player)
        engine.attach(mixer)
        let playbackFormat = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 24000, channels: 1, interleaved: false)!
        engine.connect(player, to: mixer, format: playbackFormat)
        engine.connect(mixer, to: engine.mainMixerNode, format: nil)
        try engine.start()
        player.play()
        self.playbackEngine = engine
        self.playerNode = player
        self.playerMixerNode = mixer
    }

    private func playAudio(_ data: Data) {
        guard let playerNode, data.count >= 2 else { return }
        let format = AVAudioFormat(commonFormat: .pcmFormatFloat32, sampleRate: 24000, channels: 1, interleaved: false)!
        let frameCount = data.count / 2
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(frameCount)) else { return }
        buffer.frameLength = AVAudioFrameCount(frameCount)
        data.withUnsafeBytes { raw in
            let int16 = raw.bindMemory(to: Int16.self)
            guard let floatChannel = buffer.floatChannelData?[0] else { return }
            for i in 0 ..< frameCount {
                floatChannel[i] = Float(int16[i]) / Float(Int16.max)
            }
        }
        playerNode.scheduleBuffer(buffer)
    }

    private func flushPlayback() {
        playerNode?.stop()
        playerNode?.play()
    }

    private func stopPlayback() {
        playerNode?.stop()
        playbackEngine?.stop()
        playbackEngine = nil
        playerNode = nil
        playerMixerNode = nil
    }

    // MARK: - Camera (iPhone back camera, 1fps to Gemini)

    private func setupCameraCapture() {
        let session = AVCaptureSession()
        session.sessionPreset = .medium
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device)
        else {
            logger.warning("No back camera available — running audio-only")
            return
        }
        session.addInput(input)

        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        output.setSampleBufferDelegate(captureDelegate, queue: captureQueue)
        if let connection = output.connection(with: .video) {
            connection.videoRotationAngle = 90
        }
        session.addOutput(output)

        captureDelegate.onFrame = { [weak self] sampleBuffer in
            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            let context = CIContext()
            guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return }
            let image = UIImage(cgImage: cgImage)
            Task { @MainActor [weak self] in
                self?.lastFrameImage = image
            }
        }

        session.startRunning()
        self._captureSession = session
    }

    private func startFrameTimer() {
        if videoSource == .glasses {
            glasses.onFrameCaptured = { [weak self] image in
                Task { @MainActor [weak self] in
                    self?.lastFrameImage = image
                }
            }
            Task { await glasses.startStreaming() }
        } else {
            setupCameraCapture()
        }

        frameTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.sendCurrentFrame()
            }
        }
    }

    private func sendCurrentFrame() {
        guard let image = lastFrameImage else { return }
        // Resize to max 768px and compress to JPEG
        let maxDim: CGFloat = 768
        let scale = min(maxDim / image.size.width, maxDim / image.size.height, 1.0)
        let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        let resized = renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
        guard let jpegData = resized.jpegData(compressionQuality: 0.5) else { return }

        Task { await client?.sendVideoFrame(jpegData) }
    }

    // MARK: - Tool Call Routing

    private func handleToolCall(id: String, name: String, task: String) {
        appendTranscript(role: "Tool", text: task)

        let address = self.gatewayAddress
        let token = self.gatewayToken
        let client = self.client

        let callTask = Task.detached { [weak self] in
            let result = await Self.executeViaGateway(task: task, address: address, token: token)
            await client?.sendToolResponse(callId: id, name: name, result: result)
            await MainActor.run { [weak self] in
                self?.inFlightToolCalls.removeValue(forKey: id)
                self?.appendTranscript(role: "Result", text: result)
            }
        }
        inFlightToolCalls[id] = callTask
    }

    private static func executeViaGateway(task: String, address: String?, token: String?) async -> String {
        guard let address, !address.isEmpty else {
            return "Gateway not connected — cannot execute task"
        }

        let scheme = address.contains("443") ? "https" : "http"
        guard let url = URL(string: "\(scheme)://\(address)/v1/chat/completions") else {
            return "Invalid gateway address"
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
        if let token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: Any] = [
            "model": "openclaw",
            "messages": [["role": "user", "content": task]],
            "stream": false,
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let choices = json["choices"] as? [[String: Any]],
                  let first = choices.first,
                  let message = first["message"] as? [String: Any],
                  let content = message["content"] as? String
            else {
                return "Gateway returned an unexpected response"
            }
            return content
        } catch {
            return "Gateway request failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Audio Session

    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        let mode: AVAudioSession.Mode = videoSource == .glasses ? .videoChat : .voiceChat
        try session.setCategory(.playAndRecord, mode: mode, options: [.defaultToSpeaker, .allowBluetooth])
        try session.setPreferredSampleRate(16000)
        try session.setPreferredIOBufferDuration(0.064)
        try session.setActive(true)
    }

    private func deactivateAudioSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    // MARK: - Helpers

    private func appendTranscript(role: String, text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if let last = transcript.last, last.role == role {
            var updated = transcript
            updated[updated.count - 1] = TranscriptEntry(role: role, text: last.text + " " + trimmed)
            transcript = updated
        } else {
            transcript.append(TranscriptEntry(role: role, text: trimmed))
        }
    }
}
