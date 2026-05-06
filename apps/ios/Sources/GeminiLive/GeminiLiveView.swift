import AVFoundation
import SwiftUI

struct GeminiLiveView: View {
    @Environment(NodeAppModel.self) private var appModel
    @State private var manager = GeminiLiveManager()
    @AppStorage("gemini.apiKey") private var apiKey = ""
    @AppStorage("gemini.model") private var model = GeminiLiveManager.defaultModel

    var body: some View {
        Form {
            glassesSection
            geminiAPISection
            sessionSection
            videoPreviewSection
            transcriptSection
        }
        .navigationTitle("Gemini Live")
        .onAppear { manager.glasses.startMonitoring() }
        .onDisappear {
            manager.glasses.stopMonitoring()
            if isActive { manager.stop() }
        }
    }

    @ViewBuilder
    private var glassesSection: some View {
        Section("Meta Ray-Ban Glasses") {
            HStack {
                Image(systemName: glassesIcon)
                    .foregroundStyle(glassesColor)
                Text(glassesStatusText)
            }

            if !manager.glasses.isConnected {
                Button("Connect Glasses") {
                    Task { await manager.glasses.register() }
                }
            } else {
                Button("Disconnect Glasses", role: .destructive) {
                    Task { await manager.glasses.unregister() }
                }
            }

            if let error = manager.glasses.errorText {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            if manager.glasses.isConnected {
                Picker("Video Source", selection: Binding(
                    get: { manager.videoSource },
                    set: { manager.setVideoSource($0) }
                )) {
                    Text("Glasses").tag(GeminiLiveManager.VideoSource.glasses)
                    Text("iPhone Camera").tag(GeminiLiveManager.VideoSource.iPhone)
                }
                .pickerStyle(.segmented)
            }

            if !manager.glasses.devices.isEmpty {
                LabeledContent("Devices", value: "\(manager.glasses.devices.count) found")
            }
        }
    }

    @ViewBuilder
    private var geminiAPISection: some View {
        Section("Gemini API") {
            SecureField("API Key", text: $apiKey)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            TextField("Model", text: $model)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.footnote.monospaced())
        }
    }

    @ViewBuilder
    private var sessionSection: some View {
        Section("Session") {
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)
                Text(statusText)
            }

            Button(action: toggleSession) {
                Label(
                    isActive ? "Stop Session" : "Start Session",
                    systemImage: isActive ? "stop.circle.fill" : "play.circle.fill"
                )
            }
            .disabled(apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .tint(isActive ? .red : .green)

            if !appModel.gatewayConnected {
                Label("Gateway not connected \u{2014} tool calls will fail", systemImage: "exclamationmark.triangle")
                    .font(.footnote)
                    .foregroundStyle(.orange)
            }

            if manager.glasses.isStreaming {
                Label("Streaming from glasses", systemImage: "eyeglasses")
                    .font(.footnote)
                    .foregroundStyle(.green)
            }
        }
    }

    @ViewBuilder
    private var videoPreviewSection: some View {
        if manager.captureSession != nil {
            Section("Camera") {
                CameraPreviewView(session: manager.captureSession!)
                    .frame(height: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        } else if manager.glasses.currentFrame != nil {
            Section("Glasses View") {
                if let frame = manager.glasses.currentFrame {
                    Image(uiImage: frame)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
    }

    @ViewBuilder
    private var transcriptSection: some View {
        if !manager.transcript.isEmpty {
            Section("Transcript") {
                ForEach(manager.transcript) { entry in
                    HStack(alignment: .top, spacing: 8) {
                        Text(entry.role)
                            .font(.caption.bold())
                            .foregroundStyle(roleColor(entry.role))
                            .frame(width: 50, alignment: .trailing)
                        Text(entry.text)
                            .font(.callout)
                    }
                }
            }
        }
    }

    private var isActive: Bool {
        if case .active = manager.state { return true }
        if case .starting = manager.state { return true }
        return false
    }

    private var statusText: String {
        switch manager.state {
        case .idle: "Ready"
        case .starting: "Connecting..."
        case .active: manager.isModelSpeaking ? "Speaking..." : "Listening"
        case let .error(msg): msg
        }
    }

    private var statusColor: Color {
        switch manager.state {
        case .idle: .secondary
        case .starting: .orange
        case .active: manager.isModelSpeaking ? .blue : .green
        case .error: .red
        }
    }

    private var glassesStatusText: String {
        switch manager.glasses.connectionState {
        case .unregistered: "Not connected"
        case .registering: "Pairing..."
        case .registered: "Connected"
        case .streaming: "Streaming"
        case .error: "Error"
        }
    }

    private var glassesIcon: String {
        switch manager.glasses.connectionState {
        case .unregistered: "eyeglasses"
        case .registering: "arrow.triangle.2.circlepath"
        case .registered, .streaming: "checkmark.circle.fill"
        case .error: "exclamationmark.triangle.fill"
        }
    }

    private var glassesColor: Color {
        switch manager.glasses.connectionState {
        case .unregistered: .secondary
        case .registering: .orange
        case .registered: .green
        case .streaming: .blue
        case .error: .red
        }
    }

    private func toggleSession() {
        if isActive {
            manager.stop()
        } else {
            manager.start(
                apiKey: apiKey.trimmingCharacters(in: .whitespacesAndNewlines),
                model: model.trimmingCharacters(in: .whitespacesAndNewlines),
                systemPrompt: GeminiLiveManager.defaultSystemPrompt,
                gatewayAddress: appModel.gatewayRemoteAddress,
                gatewayToken: gatewayToken
            )
        }
    }

    private var gatewayToken: String? {
        let instanceId = UserDefaults.standard.string(forKey: "node.instanceId") ?? ""
        guard !instanceId.isEmpty else { return nil }
        return GatewaySettingsStore.loadGatewayToken(instanceId: instanceId)
    }

    private func roleColor(_ role: String) -> Color {
        switch role {
        case "You": .blue
        case "Gemini": .green
        case "Tool": .orange
        case "Result": .purple
        case "System": .secondary
        default: .primary
        }
    }
}

private struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context _: Context) -> UIView {
        let view = UIView()
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        return view
    }

    func updateUIView(_ uiView: UIView, context _: Context) {
        if let layer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
            layer.frame = uiView.bounds
        }
    }
}
