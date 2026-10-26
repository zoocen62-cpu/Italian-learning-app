import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";

const lesson = { italian: "Leggo un libro a casa.", korean: "저는 집에서 책을 읽어요.", words: [
    { italian: "leggere", korean: "읽다" }, { italian: "libro", korean: "책" }, { italian: "casa", korean: "집" }
] };

async function withServer(options, run) {
    const server = createApp(options).listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    try { await run(`http://127.0.0.1:${server.address().port}`); }
    finally { await new Promise(resolve => server.close(resolve)); }
}

test("생성 결과 전달 및 비공개 파일 접근 차단", async () => {
    let calls = 0;
    const client = { responses: { parse: async request => {
        calls++;
        assert.equal(request.store, false);
        assert.equal(request.text.format.type, "json_schema");
        return { status: "completed", output_parsed: lesson };
    } } };
    await withServer({ client }, async base => {
        const response = await fetch(`${base}/generate`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), lesson);
        assert.equal(response.headers.get("cache-control"), "no-store");
        for (const file of ["/.env", "/backend/server.js", "/backend/package.json", "/node_modules/openai/package.json"]) {
            assert.equal((await fetch(base + file)).status, 404);
        }
        assert.equal((await fetch(`${base}/index.html`)).status, 200);
        assert.equal((await fetch(`${base}/style.css?v=2`)).status, 200);
        assert.equal(calls, 1);
    });
});

test("키 누락 및 불완전한 응답은 안전한 오류 반환", async () => {
    await withServer({}, async base => {
        assert.equal((await fetch(`${base}/generate`)).status, 503);
    });
    await withServer({ client: { responses: { parse: async () => ({ status: "incomplete" }) } } }, async base => {
        const response = await fetch(`${base}/generate`);
        assert.equal(response.status, 502);
        assert.ok((await response.json()).error);
    });
});

test("요청 제한 시 대기 시간 안내", async () => {
    const client = { responses: { parse: async () => ({ status: "completed", output_parsed: lesson }) } };
    await withServer({ client, generationLimit: 1 }, async base => {
        assert.equal((await fetch(`${base}/generate`)).status, 200);
        const response = await fetch(`${base}/generate`);
        assert.equal(response.status, 429);
        assert.ok(Number(response.headers.get("retry-after")) > 0);
        assert.match((await response.json()).error, /초 후/);
    });
});
