import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

// 실행 위치와 무관하게 프로젝트 루트의 .env를 읽습니다.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
const apiKey = process.env.OPENAI_API_KEY?.trim();
const client = apiKey ? new OpenAI({ apiKey, timeout: 30_000, maxRetries: 0 }) : undefined;
const port = Number(process.env.PORT || 3001);
const app = createApp({ client, model: process.env.OPENAI_MODEL || "gpt-4.1-mini" });
app.listen(port, "127.0.0.1", () => {
    console.log(`Learn Italian: http://127.0.0.1:${port}`);
    if (!client) console.warn("OPENAI_API_KEY가 없습니다. 루트 .env를 설정한 뒤 서버를 재시작해 주세요.");
}).on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? "포트가 사용 중입니다. .env의 PORT를 변경해 주세요." : "서버 시작 실패");
    process.exitCode = 1;
});
