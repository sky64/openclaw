var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
import { createServer } from "http";

// src/config.ts
var ConfigError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
};
function loadConfig(overrides = {}) {
  const gatewayUrl = (overrides.gatewayUrl || process.env.LLM_ROUTER_API_URL || "").replace(/\/$/, "");
  const walletKey = overrides.walletKey || process.env.LLM_ROUTER_WALLET_KEY || "";
  const defaultModel = overrides.defaultModel || "auto";
  if (!gatewayUrl) {
    throw new ConfigError(
      "LLM_ROUTER_API_URL is required. Set it to your RustyClawRouter gateway URL."
    );
  }
  if (!walletKey) {
    throw new ConfigError(
      "LLM_ROUTER_WALLET_KEY is required. Set it to your base58-encoded Solana private key."
    );
  }
  return { gatewayUrl, walletKey, defaultModel };
}

// src/router.ts
var PaymentError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PaymentError";
  }
};
var RouterError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "RouterError";
  }
};
var X402_VERSION = 2;
async function createPaymentHeader(paymentInfo, resourceUrl, walletKey) {
  if (!paymentInfo.accepts || paymentInfo.accepts.length === 0) {
    throw new PaymentError("No payment accept options in 402 response");
  }
  const accept = paymentInfo.accepts[0];
  let transaction = "STUB_BASE64_TX";
  if (walletKey) {
    const solanaAvailable = isSolanaAvailable();
    if (solanaAvailable) {
      transaction = await buildSolanaTransferChecked(accept.pay_to, accept.amount, walletKey);
    }
  }
  const payload = {
    x402_version: X402_VERSION,
    resource: { url: resourceUrl, method: "POST" },
    accepted: accept,
    payload: { transaction }
  };
  const json = JSON.stringify(payload);
  return typeof Buffer !== "undefined" ? Buffer.from(json, "utf-8").toString("base64") : btoa(json);
}
function isSolanaAvailable() {
  try {
    __require.resolve("@solana/web3.js");
    return true;
  } catch {
    return false;
  }
}
async function buildSolanaTransferChecked(payTo, amountStr, privateKey) {
  const solanaWeb3 = __require("@solana/web3.js");
  const splToken = __require("@solana/spl-token");
  const bs58 = __require("bs58");
  const {
    Connection,
    Keypair,
    PublicKey,
    TransactionMessage,
    VersionedTransaction
  } = solanaWeb3;
  const { createTransferCheckedInstruction, getAssociatedTokenAddress } = splToken;
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const USDC_DECIMALS = 6;
  const amount = BigInt(amountStr);
  if (amount <= 0n) {
    throw new PaymentError(`Payment amount must be positive, got: ${amountStr}`);
  }
  let secretKey = null;
  try {
    secretKey = bs58.decode(privateKey);
    const payer = Keypair.fromSecretKey(secretKey);
    const recipientPubkey = new PublicKey(payTo);
    const senderAta = await getAssociatedTokenAddress(USDC_MINT, payer.publicKey);
    const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new PaymentError(
        "SOLANA_RPC_URL is required for on-chain signing. Set it to your Solana RPC endpoint (e.g. https://api.mainnet-beta.solana.com)."
      );
    }
    const connection = new Connection(rpcUrl, "confirmed");
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const ix = createTransferCheckedInstruction(
      senderAta,
      USDC_MINT,
      recipientAta,
      payer.publicKey,
      amount,
      USDC_DECIMALS
    );
    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix]
    }).compileToV0Message();
    const tx = new VersionedTransaction(message);
    tx.sign([payer]);
    const serialized = tx.serialize();
    return typeof Buffer !== "undefined" ? Buffer.from(serialized).toString("base64") : btoa(String.fromCharCode(...serialized));
  } catch (err) {
    if (err instanceof PaymentError) throw err;
    throw new PaymentError(
      `Failed to build Solana payment transaction: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (secretKey) secretKey.fill(0);
  }
}
async function parse402(resp) {
  try {
    const body = await resp.json();
    const errorMsg = body?.error?.message;
    if (typeof errorMsg === "string") {
      return JSON.parse(errorMsg);
    }
    if (body?.x402_version && body?.accepts) {
      return body;
    }
    return null;
  } catch {
    return null;
  }
}
var DEFAULT_TIMEOUT_MS = 12e4;
async function fetchWithTimeout(url, init, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
async function routeRequest(request, config) {
  const body = {
    model: request.model ?? config.defaultModel,
    messages: request.messages,
    max_tokens: request.max_tokens,
    temperature: request.temperature,
    top_p: request.top_p,
    stream: false
  };
  const url = `${config.gatewayUrl}/v1/chat/completions`;
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
  let resp = await fetchWithTimeout(url, init);
  if (resp.status === 402) {
    const paymentInfo = await parse402(resp);
    if (!paymentInfo) {
      throw new PaymentError("Received 402 but could not parse payment details from response");
    }
    const paymentHeader = await createPaymentHeader(paymentInfo, url, config.walletKey);
    resp = await fetchWithTimeout(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        "payment-signature": paymentHeader
      }
    });
  }
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    throw new RouterError(
      `Gateway returned ${resp.status} ${resp.statusText}${errorText ? ` \u2014 ${errorText}` : ""}`,
      resp.status
    );
  }
  return resp.json();
}
async function routeStreamingRequest(request, config) {
  const body = {
    model: request.model ?? config.defaultModel,
    messages: request.messages,
    max_tokens: request.max_tokens,
    temperature: request.temperature,
    top_p: request.top_p,
    stream: true
  };
  const url = `${config.gatewayUrl}/v1/chat/completions`;
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
  let resp = await fetchWithTimeout(url, init);
  if (resp.status === 402) {
    const paymentInfo = await parse402(resp);
    if (!paymentInfo) {
      throw new PaymentError("Received 402 but could not parse payment details from response");
    }
    const paymentHeader = await createPaymentHeader(paymentInfo, url, config.walletKey);
    resp = await fetchWithTimeout(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        "payment-signature": paymentHeader
      }
    });
  }
  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "");
    throw new RouterError(
      `Gateway returned ${resp.status} ${resp.statusText}${errorText ? ` \u2014 ${errorText}` : ""}`,
      resp.status
    );
  }
  return resp;
}

// src/index.ts
var PROXY_PORT = parseInt(process.env.RCR_PROXY_PORT ?? "8402", 10);
var RCR_MODELS = [
  { id: "auto", name: "RCR Auto Router", contextWindow: 128e3, maxTokens: 8192 },
  { id: "eco", name: "RCR Eco (cheapest)", contextWindow: 128e3, maxTokens: 8192 },
  { id: "premium", name: "RCR Premium (best)", contextWindow: 2e5, maxTokens: 8192 }
];
var proxyServer = null;
function startProxy(config) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok", provider: "rcr" }));
        return;
      }
      if (req.url !== "/v1/chat/completions" || req.method !== "POST") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        const isStream = body.stream === true;
        if (isStream) {
          const streamResp = await routeStreamingRequest(body, config);
          res.writeHead(200, {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            "connection": "keep-alive"
          });
          if (streamResp.body) {
            const reader = streamResp.body.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            } finally {
              reader.releaseLock();
            }
          }
          res.end();
        } else {
          const result = await routeRequest(body, config);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(result));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[rcr-proxy] Error:", message);
        res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { message: `RCR proxy error: ${message}` } }));
      }
    });
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        server.listen(0, "127.0.0.1", () => {
          proxyServer = server;
          const actualPort = server.address().port;
          console.log(`[rcr] Local proxy listening on http://127.0.0.1:${actualPort} (preferred port ${PROXY_PORT} in use)`);
          resolve(actualPort);
        });
      } else {
        reject(err);
      }
    });
    server.listen(PROXY_PORT, "127.0.0.1", () => {
      proxyServer = server;
      const actualPort = server.address().port;
      console.log(`[rcr] Local proxy listening on http://127.0.0.1:${actualPort}`);
      resolve(actualPort);
    });
  });
}
async function register(api) {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error("[rcr] Config error:", err.message);
    return null;
  }
  const port = await startProxy(config);
  const baseUrl = `http://127.0.0.1:${port}/v1`;
  api.registerProvider({
    id: "rcr",
    label: "RustyClawRouter",
    aliases: ["rustyclaw"],
    envVars: ["LLM_ROUTER_WALLET_KEY"],
    get models() {
      return {
        baseUrl,
        api: "openai-completions",
        apiKey: "x402-proxy-handles-auth",
        models: RCR_MODELS.map((m) => ({
          id: m.id,
          name: m.name,
          reasoning: false,
          input: ["text"],
          contextWindow: m.contextWindow,
          maxTokens: m.maxTokens
        }))
      };
    },
    auth: []
  });
  if (api.config?.models) {
    api.config.models.providers = api.config.models.providers ?? {};
  } else {
    api.config.models = { providers: {} };
  }
  api.config.models.providers.rcr = {
    baseUrl,
    api: "openai-completions",
    apiKey: "x402-proxy-handles-auth",
    models: RCR_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      reasoning: false,
      input: ["text"],
      contextWindow: m.contextWindow,
      maxTokens: m.maxTokens
    }))
  };
  if (api.config?.agents?.defaults?.model) {
    api.config.agents.defaults.model.primary = "rcr/auto";
  }
  console.log(`[rcr] Registered as OpenClaw provider (proxy at ${baseUrl})`);
  return { port };
}
var index_default = { register };
export {
  ConfigError,
  PaymentError,
  RouterError,
  index_default as default,
  register
};
