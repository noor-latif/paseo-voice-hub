import type { PluginContext } from "@getpaseo/plugin";
import { createServer, type Server } from "node:http";
import { MainSurface } from "./main.client";

const PROXY_PORT = 8789;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENAI_TTS_API_KEY || "";
const GROQ_BASE = "https://api.groq.com/openai/v1";

const ORPHEUS_VOICES: Record<string, true> = {
  autumn: true,
  diana: true,
  hannah: true,
  austin: true,
  daniel: true,
  troy: true,
};

const OPENAI_VOICES: Record<string, true> = {
  alloy: true,
  echo: true,
  fable: true,
  onyx: true,
  nova: true,
  shimmer: true,
};

function mapVoice(inputVoice?: string): string {
  const v = (inputVoice || "troy").toLowerCase();
  if (ORPHEUS_VOICES[v]) return v;
  if (OPENAI_VOICES[v]) return "troy";
  return "troy";
}

export default function contribute(plugin: PluginContext) {
  plugin.addSurface("main", MainSurface);

  let server: Server | null = null;

  const start = () => {
    server = createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, proxy: "orpheus", port: PROXY_PORT }));
        return;
      }
      if (req.method !== "POST" || !req.url?.startsWith("/v1/audio/speech")) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: "Not found", type: "invalid_request_error" } }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body || "{}");
          const input: string = parsed.input || parsed.text || "";
          if (!input || input.trim().length === 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: { message: "input is required", type: "invalid_request_error" } }));
            return;
          }
          const voice = mapVoice(parsed.voice);
          const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY || GROQ_API_KEY;
          if (!apiKey) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: { message: "GROQ_API_KEY not configured in plugin env", type: "server_error" } }));
            return;
          }

          const groqRes = await fetch(`${GROQ_BASE}/audio/speech`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "canopylabs/orpheus-v1-english",
              input,
              voice,
              response_format: "wav",
            }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error(`[orpheus-proxy] Groq error ${groqRes.status}: ${errText}`);
            res.writeHead(groqRes.status, { "Content-Type": "application/json" });
            res.end(errText);
            return;
          }

          const wav = Buffer.from(await groqRes.arrayBuffer());
          console.log(`[orpheus-proxy] ${input.slice(0, 60)} -> ${wav.length} bytes voice=${voice}`);
          res.writeHead(200, {
            "Content-Type": "audio/wav",
            "Content-Length": wav.length,
          });
          res.end(wav);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[orpheus-proxy] error: ${msg}`);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: msg, type: "server_error" } }));
        }
      });
    });

    server.listen(PROXY_PORT, "127.0.0.1", () => {
      console.log(`[orpheus-proxy] listening on http://127.0.0.1:${PROXY_PORT}/v1/audio/speech -> Groq canopylabs/orpheus-v1-english`);
    });

    server.on("error", (err) => {
      console.error(`[orpheus-proxy] server error: ${err}`);
    });
  };

  start();

  return async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      console.log("[orpheus-proxy] stopped");
    }
  };
}
