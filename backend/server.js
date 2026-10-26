import app from "./runtime.js";
const port = Number(process.env.PORT || 3001);
app.listen(port, "127.0.0.1", () => {
    console.log(`Learn Italian: http://127.0.0.1:${port}`);
    if (!process.env.OPENAI_API_KEY?.trim()) console.warn("OPENAI_API_KEY가 없습니다. 루트 .env를 설정한 뒤 서버를 재시작해 주세요.");
}).on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? "포트가 사용 중입니다. .env의 PORT를 변경해 주세요." : "서버 시작 실패");
    process.exitCode = 1;
});
