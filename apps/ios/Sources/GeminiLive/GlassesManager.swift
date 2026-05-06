import Foundation
import MWDATCamera
import MWDATCore
import Observation
import OSLog
import UIKit

@MainActor
@Observable
final class GlassesManager {

    enum ConnectionState: Sendable {
        case unregistered
        case registering
        case registered
        case streaming
        case error(String)
    }

    enum StreamState: Sendable {
        case stopped
        case waitingForDevice
        case starting
        case streaming
        case paused
        case stopping
    }

    private(set) var connectionState: ConnectionState = .unregistered
    private(set) var streamState: StreamState = .stopped
    private(set) var devices: [DeviceIdentifier] = []
    private(set) var currentFrame: UIImage?
    private(set) var errorText: String?

    var isConnected: Bool {
        if case .registered = connectionState { return true }
        if case .streaming = connectionState { return true }
        return false
    }

    var isStreaming: Bool {
        if case .streaming = streamState { return true }
        return false
    }

    var onFrameCaptured: ((UIImage) -> Void)?

    private var wearables: WearablesInterface { Wearables.shared }
    private var streamSession: StreamSession?
    private var videoFrameToken: AnyListenerToken?
    private var photoDataToken: AnyListenerToken?
    private var stateToken: AnyListenerToken?
    private var errorToken: AnyListenerToken?
    private var deviceMonitorTask: Task<Void, Never>?
    private var registrationMonitorTask: Task<Void, Never>?

    private let logger = Logger(subsystem: "ai.openclaw", category: "GlassesManager")

    func startMonitoring() {
        monitorRegistration()
        monitorDevices()
    }

    func stopMonitoring() {
        deviceMonitorTask?.cancel()
        deviceMonitorTask = nil
        registrationMonitorTask?.cancel()
        registrationMonitorTask = nil
    }

    // MARK: - Registration

    func register() async {
        connectionState = .registering
        errorText = nil
        do {
            try await wearables.startRegistration()
        } catch {
            logger.error("Registration failed: \(error.localizedDescription)")
            connectionState = .error(error.localizedDescription)
            errorText = error.localizedDescription
        }
    }

    func unregister() async {
        await stopStreaming()
        do {
            try await wearables.startUnregistration()
            connectionState = .unregistered
        } catch {
            logger.error("Unregistration failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Streaming

    func startStreaming() async {
        guard streamSession == nil else { return }
        errorText = nil

        do {
            let status = try await wearables.checkPermissionStatus(.camera)
            if status != .granted {
                let result = try await wearables.requestPermission(.camera)
                guard result == .granted else {
                    errorText = "Camera permission denied on glasses"
                    return
                }
            }
        } catch {
            errorText = "Permission check failed: \(error.localizedDescription)"
            return
        }

        let config = StreamSessionConfig(
            videoCodec: .raw,
            resolution: .low,
            frameRate: 24
        )
        let selector = AutoDeviceSelector(wearables: wearables)
        let session = StreamSession(streamSessionConfig: config, deviceSelector: selector)
        self.streamSession = session

        videoFrameToken = session.videoFramePublisher.listen { [weak self] videoFrame in
            guard let image = videoFrame.makeUIImage() else { return }
            Task { @MainActor [weak self] in
                self?.currentFrame = image
                self?.onFrameCaptured?(image)
            }
        }

        stateToken = session.statePublisher.listen { [weak self] state in
            Task { @MainActor [weak self] in
                self?.handleStreamState(state)
            }
        }

        errorToken = session.errorPublisher.listen { [weak self] error in
            Task { @MainActor [weak self] in
                self?.handleStreamError(error)
            }
        }

        await session.start()
        connectionState = .streaming
    }

    func stopStreaming() async {
        if let session = streamSession {
            await session.stop()
        }
        videoFrameToken = nil
        stateToken = nil
        errorToken = nil
        photoDataToken = nil
        streamSession = nil
        currentFrame = nil
        streamState = .stopped
        if case .streaming = connectionState {
            connectionState = .registered
        }
    }

    func capturePhoto() {
        streamSession?.capturePhoto(format: .jpeg)
    }

    // MARK: - Photo Capture with Callback

    func capturePhotoData(completion: @escaping (Data?) -> Void) {
        guard let session = streamSession else {
            completion(nil)
            return
        }
        photoDataToken = session.photoDataPublisher.listen { photoData in
            completion(photoData.data)
        }
        session.capturePhoto(format: .jpeg)
    }

    // MARK: - Private

    private func monitorDevices() {
        deviceMonitorTask = Task { [weak self] in
            guard let self else { return }
            let stream = self.wearables.devicesStream()
            for await deviceList in stream {
                if Task.isCancelled { return }
                await MainActor.run { [weak self] in
                    self?.devices = deviceList
                }
            }
        }
    }

    private func monitorRegistration() {
        registrationMonitorTask = Task { [weak self] in
            guard let self else { return }
            let stream = self.wearables.registrationStateStream()
            for await regState in stream {
                if Task.isCancelled { return }
                await MainActor.run { [weak self] in
                    self?.handleRegistrationState(regState)
                }
            }
        }
    }

    private func handleRegistrationState(_ regState: RegistrationState) {
        switch regState {
        case .unregistered:
            connectionState = .unregistered
        case .registering:
            connectionState = .registering
        case .registered:
            if case .streaming = connectionState { return }
            connectionState = .registered
        @unknown default:
            break
        }
    }

    private func handleStreamState(_ state: StreamSessionState) {
        switch state {
        case .stopped:
            streamState = .stopped
        case .waitingForDevice:
            streamState = .waitingForDevice
        case .starting:
            streamState = .starting
        case .streaming:
            streamState = .streaming
        case .paused:
            streamState = .paused
        case .stopping:
            streamState = .stopping
        @unknown default:
            break
        }
    }

    private func handleStreamError(_ error: StreamSessionError) {
        let msg: String
        switch error {
        case .deviceNotFound:
            msg = "Glasses not found"
        case .deviceNotConnected:
            msg = "Glasses disconnected"
        case .permissionDenied:
            msg = "Camera permission denied on glasses"
        case .hingesClosed:
            msg = "Glasses hinges closed"
        case .videoStreamingError:
            msg = "Video streaming error"
        case .timeout:
            msg = "Connection timeout"
        case .internalError:
            msg = "Internal SDK error"
        @unknown default:
            msg = "Unknown glasses error"
        }
        logger.error("Glasses stream error: \(msg)")
        errorText = msg
    }
}
