# Learn Italian

Node.js 22 이상이 필요합니다. OpenAI 호출은 Express 서버에서만 실행합니다.

## 실행

1. 현재 프로젝트 루트의 `.env`에 `OPENAI_API_KEY=발급받은키`를 설정합니다. 기존 `.env`는 유지됩니다. 필요한 설정은 `.env.example`을 참고하세요.
2. 프로젝트 루트에서 실행합니다.

```powershell
npm.cmd --prefix backend install
npm.cmd --prefix backend start
```

3. **http://127.0.0.1:3001** 을 엽니다. 기존 VS Code Live Preview의 3000번 주소 대신 Express 주소를 사용해야 `fetch('/generate')`가 작동합니다.

‘다음 문장’을 누르면 OpenAI가 문장, 한국어 번역, 핵심 단어 3개를 생성합니다. 성공했을 때만 진도를 올리고 단어 목록을 갱신합니다. 생성 단어는 단어 학습과 퀴즈 목록에도 추가됩니다. 처음 화면과 기존 단어/퀴즈는 API 호출 없이 사용할 수 있습니다.

`.env` 변경 후 서버를 재시작하세요. `OPENAI_MODEL`로 모델을 바꿀 수 있으며 기본값은 `gpt-4.1-mini`입니다. Responses API와 Structured Outputs를 지원하고 계정에서 사용 가능한 모델이어야 합니다. 생성 결과가 매번 고유하다는 보장은 없습니다. API 사용에는 별도 비용이 발생합니다.

## 보안과 확인

- 키는 루트 `.env`에서만 읽고 브라우저 응답과 로그에 포함하지 않습니다.
- Express는 HTML/CSS/프론트엔드 JS만 공개합니다. `.env`, backend, node_modules는 공개하지 않습니다.
- 서버는 로컬 주소에만 바인딩하며 분당 30회로 생성 요청을 제한합니다. 실패한 요청은 횟수에서 제외하고, 제한 시 남은 대기 시간을 안내합니다. 외부 배포 시 인증과 사용자별 사용량 제한을 추가해야 합니다.
- 프로젝트 루트를 Live Preview 같은 별도 정적 서버로 공개하지 마세요.
- 검증: `npm.cmd --prefix backend test`
- 공식 문서: https://developers.openai.com/api/docs/guides/structured-outputs
