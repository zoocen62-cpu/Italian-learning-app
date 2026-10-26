import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

// Vercel에서는 대시보드의 서버 환경 변수를 사용합니다.
if (!process.env.VERCEL) {
    dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
}
const apiKey = process.env.OPENAI_API_KEY?.trim();
const client = apiKey ? new OpenAI({ apiKey, timeout: 30_000, maxRetries: 0 }) : undefined;
export default createApp({ client, model: process.env.OPENAI_MODEL || "gpt-4.1-mini" });
