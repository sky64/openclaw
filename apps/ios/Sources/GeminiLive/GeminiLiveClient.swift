import Foundation
import OSLog

/// WebSocket client for the Gemini Live bidirectional streaming API.
/// Handles connection, audio/video frame sending, and response parsing.
actor GeminiLiveClient {

    // MARK: - Types

    enum State: Sendable {
        case disconnected
        case connecting
        case settingUp
        case ready
        case error(String)
    }

    enum Event: Sendable {
        case stateChanged(State)
        case audioReceived(Data) // PCM Int16 24kHz mono, raw bytes (not base64)
        case inputTranscription(String)
        case outputTranscription(String)
        case turnComplete
        case interrupted
        case toolCall(id: String, name: String, task: String)
        case toolCallCancellation([String])
        case goAway(timeLeftSeconds: Int)
    }

    // MARK: - Properties

    private(set) var state: State = .disconnected
    nonisolated let onEvent: @Sendable (Event) -> Void

    private var webSocket: URLSessionWebSocketTask?
    private var receiveTask: Task<Void, Never>?
    private let logger = Logger(subsystem: "ai.openclaw", category: "GeminiLiveClient")

    private static let endpoint =
        "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"

    // MARK: - Init

    init(onEvent: @escaping @Sendable (Event) -> Void) {
        self.onEvent = onEvent
    }

    // MARK: - Public

    func connect(apiKey: String, model: String, systemPrompt: String) async {
        guard case .disconnected = state else {
            logger.warning("connect called in state \(String(describing: self.state))")
            return
        }

        setState(.connecting)

        guard let url = URL(string: "\(Self.endpoint)?key=\(apiKey)") else {
            setState(.error("Invalid API key or URL"))
            return
        }

        let session = URLSession(configuration: .default)
        let task = session.webSocketTask(with: url)
        task.maximumMessageSize = 16 * 1024 * 1024 // 16 MB for large audio/video payloads
        self.webSocket = task
        task.resume()

        setState(.settingUp)

        // Send setup message
        let setup = self.buildSetupMessage(model: model, systemPrompt: systemPrompt)
        do {
            let data = try JSONSerialization.data(withJSONObject: setup)
            guard let json = String(data: data, encoding: .utf8) else {
                setState(.error("Failed to encode setup message"))
                return
            }
            try await task.send(.string(json))
        } catch {
            setState(.error("Setup send failed: \(error.localizedDescription)"))
            return
        }

        // Start receive loop (setup response will arrive here)
        startReceiveLoop()
    }

    func sendAudio(_ pcmInt16Data: Data) {
        guard case .ready = state, !pcmInt16Data.isEmpty else { return }
        let base64 = pcmInt16Data.base64EncodedString()
        let msg: [String: Any] = [
            "realtimeInput": [
                "audio": [
                    "mimeType": "audio/pcm;rate=16000",
                    "data": base64,
                ],
            ],
        ]
        sendJSON(msg)
    }

    func sendVideoFrame(_ jpegData: Data) {
        guard case .ready = state, !jpegData.isEmpty else { return }
        let base64 = jpegData.base64EncodedString()
        let msg: [String: Any] = [
            "realtimeInput": [
                "video": [
                    "mimeType": "image/jpeg",
                    "data": base64,
                ],
            ],
        ]
        sendJSON(msg)
    }

    func sendToolResponse(callId: String, name: String, result: String) {
        let msg: [String: Any] = [
            "toolResponse": [
                "functionResponses": [
                    [
                        "id": callId,
                        "name": name,
                        "response": ["result": result],
                    ],
                ],
            ],
        ]
        sendJSON(msg)
    }

    func disconnect() {
        receiveTask?.cancel()
        receiveTask = nil
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        setState(.disconnected)
    }

    // MARK: - Private: Setup

    private func buildSetupMessage(model: String, systemPrompt: String) -> [String: Any] {
        [
            "setup": [
                "model": model,
                "generationConfig": [
                    "responseModalities": ["AUDIO"],
                    "thinkingConfig": ["thinkingBudget": 0],
                ],
                "systemInstruction": [
                    "parts": [["text": systemPrompt]],
                ],
                "tools": [
                    [
                        "functionDeclarations": [
                            [
                                "name": "execute",
                                "description":
                                    "Execute a task via the user's personal assistant. Use this for ANY action: sending messages, searching the web, managing lists, setting reminders, controlling devices, etc.",
                                "parameters": [
                                    "type": "object",
                                    "properties": [
                                        "task": [
                                            "type": "string",
                                            "description": "Detailed description of what to do",
                                        ],
                                    ],
                                    "required": ["task"],
                                ],
                            ],
                        ],
                    ],
                ],
                "realtimeInputConfig": [
                    "automaticActivityDetection": [
                        "disabled": false,
                        "startOfSpeechSensitivity": "START_SENSITIVITY_HIGH",
                        "endOfSpeechSensitivity": "END_SENSITIVITY_LOW",
                        "silenceDurationMs": 500,
                        "prefixPaddingMs": 40,
                    ],
                    "activityHandling": "START_OF_ACTIVITY_INTERRUPTS",
                    "turnCoverage": "TURN_INCLUDES_ALL_INPUT",
                ],
                "inputAudioTranscription": [:] as [String: Any],
                "outputAudioTranscription": [:] as [String: Any],
            ] as [String: Any],
        ]
    }

    // MARK: - Private: Send

    private func sendJSON(_ json: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: json),
              let string = String(data: data, encoding: .utf8)
        else { return }
        let ws = self.webSocket
        Task {
            do {
                try await ws?.send(.string(string))
            } catch {
                self.logger.error("WebSocket send failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Private: Receive

    private func startReceiveLoop() {
        receiveTask = Task { [weak self] in
            while !Task.isCancelled {
                guard let self, let ws = await self.webSocket else { return }
                do {
                    let message = try await ws.receive()
                    await self.handleRawMessage(message)
                } catch {
                    if !Task.isCancelled {
                        await self.handleReceiveError(error)
                    }
                    return
                }
            }
        }
    }

    private func handleRawMessage(_ message: URLSessionWebSocketTask.Message) {
        let data: Data
        switch message {
        case let .string(text):
            guard let d = text.data(using: .utf8) else { return }
            data = d
        case let .data(d):
            data = d
        @unknown default:
            return
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            logger.warning("Failed to parse Gemini message as JSON")
            return
        }

        // setupComplete
        if json["setupComplete"] != nil {
            logger.info("Gemini Live session ready")
            setState(.ready)
            return
        }

        // serverContent
        if let serverContent = json["serverContent"] as? [String: Any] {
            parseServerContent(serverContent)
            return
        }

        // toolCall
        if let toolCall = json["toolCall"] as? [String: Any] {
            parseToolCall(toolCall)
            return
        }

        // toolCallCancellation
        if let cancellation = json["toolCallCancellation"] as? [String: Any],
           let ids = cancellation["ids"] as? [String]
        {
            onEvent(.toolCallCancellation(ids))
            return
        }

        // goAway
        if let goAway = json["goAway"] as? [String: Any],
           let timeLeft = goAway["timeLeft"] as? [String: Any],
           let seconds = timeLeft["seconds"] as? Int
        {
            logger.warning("Gemini GoAway: \(seconds)s remaining")
            onEvent(.goAway(timeLeftSeconds: seconds))
            return
        }
    }

    private func parseServerContent(_ content: [String: Any]) {
        // Audio response
        if let modelTurn = content["modelTurn"] as? [String: Any],
           let parts = modelTurn["parts"] as? [[String: Any]]
        {
            for part in parts {
                if let inlineData = part["inlineData"] as? [String: Any],
                   let base64 = inlineData["data"] as? String,
                   let audioData = Data(base64Encoded: base64)
                {
                    onEvent(.audioReceived(audioData))
                }
            }
        }

        // Input transcription
        if let inputTx = content["inputTranscription"] as? [String: Any],
           let text = inputTx["text"] as? String, !text.isEmpty
        {
            onEvent(.inputTranscription(text))
        }

        // Output transcription
        if let outputTx = content["outputTranscription"] as? [String: Any],
           let text = outputTx["text"] as? String, !text.isEmpty
        {
            onEvent(.outputTranscription(text))
        }

        // Turn complete
        if content["turnComplete"] as? Bool == true {
            onEvent(.turnComplete)
        }

        // Interrupted
        if content["interrupted"] as? Bool == true {
            onEvent(.interrupted)
        }
    }

    private func parseToolCall(_ toolCall: [String: Any]) {
        guard let calls = toolCall["functionCalls"] as? [[String: Any]] else { return }
        for call in calls {
            guard let id = call["id"] as? String,
                  let name = call["name"] as? String,
                  let args = call["args"] as? [String: Any],
                  let task = args["task"] as? String
            else { continue }
            onEvent(.toolCall(id: id, name: name, task: task))
        }
    }

    private func handleReceiveError(_ error: Error) {
        let msg = error.localizedDescription
        logger.error("WebSocket receive error: \(msg)")
        if case .disconnected = state { return }
        setState(.error("Connection lost: \(msg)"))
    }

    // MARK: - Private: State

    private func setState(_ newState: State) {
        state = newState
        onEvent(.stateChanged(newState))
    }
}
