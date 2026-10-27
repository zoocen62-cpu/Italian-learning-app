import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
export const lessonSchema = z.object({
    italian: z.string().min(1),
    korean: z.string().min(1),
    words: z.array(z.object({ italian: z.string().min(1), korean: z.string().min(1) })).length(3)
});

export function createApp({ client, model = "gpt-4.1-mini", generationLimit = 30 } = {}) {
    const app = express();
    app.disable("x-powered-by");
    app.use((_req, res, next) => {
        res.set("X-Content-Type-Options", "nosniff");
        next();
    });
    const limiter = rateLimit({ windowMs: 60_000, limit: generationLimit,
        skipFailedRequests: true,
        standardHeaders: "draft-8", legacyHeaders: false,
        handler: (_req, res) => {
            const retryAfter = Math.max(1, Math.ceil((res.req.rateLimit.resetTime.getTime() - Date.now()) / 1000));
            res.set("Retry-After", String(retryAfter));
            res.status(429).json({ error: `학습 요청 제한에 도달했습니다. ${retryAfter}초 후 다시 눌러 주세요.` });
        }
    });

    app.get("/generate", limiter, async (_req, res) => {
        res.set("Cache-Control", "no-store");
        if (!client) return res.status(503).json({ error: "서버의 OPENAI_API_KEY 설정을 확인해 주세요." });
        try {
            const response = await client.responses.parse({
                model,
                store: false,
                max_output_tokens: 1000,
                input: [
                    { role: "system", content: "당신은 한국인 초급자를 위한 이탈리아어 선생님입니다. 자연스러운 A1~A2 수준 이탈리아어 문장 하나와 정확한 한국어 뜻을 만드세요. 문장에 나오는 핵심 단어를 정확히 3개 골라 이탈리아어 기본형과 한국어 뜻을 제공하세요. 일상, 여행, 음식, 취미 등 다양한 주제를 사용하세요. 단어의 뜻은 퀴즈에 사용할 짧은 표현으로 쓰세요." },
                    { role: "user", content: `새로운 학습 내용을 생성해 주세요. 변형 식별자: ${randomUUID()}` }
                ],
                text: { format: zodTextFormat(lessonSchema, "italian_lesson") }
            });
            if (response.status !== "completed" || !response.output_parsed) {
                return res.status(502).json({ error: "학습 내용을 완성하지 못했습니다. 다시 시도해 주세요." });
            }
            res.json(lessonSchema.parse(response.output_parsed));
        } catch (error) {
            // SDK 오류 전체에는 요청 정보가 포함될 수 있어 출력하지 않습니다.
            console.error("학습 생성 실패", { status: error.status ?? null, type: error.name });
            const status = error.status === 429 ? 429 : 502;
            res.status(status).json({ error: status === 429
                ? "OpenAI 사용 한도 또는 요청 제한을 확인해 주세요."
                : "문장 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
    });

    const speechLimiter = rateLimit({
        windowMs: 60_000, limit: 30, skipFailedRequests: true,
        standardHeaders: "draft-8", legacyHeaders: false,
        message: { error: "발음 요청이 많습니다. 1분 후 다시 눌러 주세요." }
    });
    app.post("/speech", speechLimiter, express.json({ limit: "4kb" }), async (req, res) => {
        res.set("Cache-Control", "no-store");
        const input = z.object({ text: z.string().trim().min(1).max(500) }).strict().safeParse(req.body);
        if (!input.success) return res.status(400).json({ error: "발음할 문장 또는 단어를 500자 이내로 입력해 주세요." });
        if (!client) return res.status(503).json({ error: "서버의 OPENAI_API_KEY 설정을 확인해 주세요." });
        try {
            const audio = await client.audio.speech.create({
                model: "tts-1", voice: "nova", input: input.data.text,
                response_format: "mp3", speed: 0.9
            });
            res.type("audio/mpeg").send(Buffer.from(await audio.arrayBuffer()));
        } catch (error) {
            console.error("발음 생성 실패", { status: error.status ?? null, type: error.name });
            res.status(error.status === 429 ? 429 : 502).json({ error: error.status === 429
                ? "음성 API 사용 한도 또는 요청 제한을 확인해 주세요."
                : "발음 생성에 실패했습니다. 잠시 후 다시 눌러 주세요." });
        }
    });
    app.use("/speech", (error, _req, res, _next) => {
        res.status(error.type === "entity.too.large" ? 413 : 400)
            .json({ error: "발음 요청 형식 또는 크기를 확인해 주세요." });
    });

    // 프로젝트 전체를 static으로 공개하면 .env와 서버 소스가 노출될 수 있습니다.
    for (const [url, file] of [["/", "index.html"], ["/index.html", "index.html"],
        ["/style.css", "style.css"], ["/script.js", "script.js"]]) {
        app.get(url, (_req, res) => res.sendFile(path.join(root, file)));
    }
    app.use((_req, res) => res.status(404).json({ error: "찾을 수 없는 경로입니다." }));
    return app;
}
