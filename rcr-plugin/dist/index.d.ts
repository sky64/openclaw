/**
 * Configuration for the @rustyclaw/rcr OpenClaw plugin.
 *
 * Reads from the same env vars already present on all tenant VPSes:
 *   LLM_ROUTER_API_URL     — RustyClawRouter gateway base URL
 *   LLM_ROUTER_WALLET_KEY  — Base58 Solana private key for x402 payments
 */
interface RcrConfig {
    /** RustyClawRouter gateway base URL (no trailing slash). */
    gatewayUrl: string;
    /** Base58-encoded Solana private key for signing x402 payments. */
    walletKey: string;
    /**
     * Default model to route requests to.
     * "auto" lets the RCR smart router pick the cheapest capable model.
     */
    defaultModel: string;
}
declare class ConfigError extends Error {
    constructor(message: string);
}

/**
 * Core routing logic for @rustyclaw/rcr.
 *
 * Forwards OpenClaw chat requests to RustyClawRouter, handling the full
 * x402 payment flow: initial request → 402 response → sign payment → retry.
 * Supports both streaming (SSE) and non-streaming responses.
 *
 * Payment logic is inlined from the RustyClawRouter TypeScript SDK so this
 * plugin has zero runtime dependencies.
 */

interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
}
interface ChatRequest {
    model?: string;
    messages: ChatMessage[];
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
}
interface ChatChoice {
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
}
interface ChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: ChatChoice[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
declare class PaymentError extends Error {
    constructor(message: string);
}
declare class RouterError extends Error {
    readonly status?: number | undefined;
    constructor(message: string, status?: number | undefined);
}

/**
 * @rustyclaw/rcr — OpenClaw provider plugin
 *
 * Registers RustyClawRouter as an OpenClaw LLM provider by starting a local
 * HTTP proxy that handles x402 Solana micropayments transparently.
 *
 * Required env vars:
 *   LLM_ROUTER_API_URL     — RustyClawRouter gateway URL
 *   LLM_ROUTER_WALLET_KEY  — Base58 Solana private key for x402 payments
 */

/**
 * OpenClaw plugin register function.
 * Called by OpenClaw's plugin loader when the plugin is enabled.
 * Returns the proxy port on success, or null if config is missing.
 */
declare function register(api: any): Promise<{
    port: number;
} | null>;
declare const _default: {
    register: typeof register;
};

export { type ChatMessage, type ChatRequest, type ChatResponse, ConfigError, PaymentError, type RcrConfig, RouterError, _default as default, register };
