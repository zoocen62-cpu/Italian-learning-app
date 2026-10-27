# Learn Italian

## Vercel 배포

1. 프로젝트 Settings에서 Root Directory를 저장소 루트(빈 값 또는 `.`)로 설정합니다. `backend`로 설정하지 마세요.
2. Framework Preset은 **Other**로 설정하고 Build Command와 Output Directory의 수동 설정은 해제합니다. Install Command는 기본값 또는 `npm ci`를 사용합니다.
3. Settings → Environment Variables에 `OPENAI_API_KEY`를 등록합니다. Production과 Preview 중 사용할 환경을 선택합니다. 키는 코드나 GitHub에 올리지 않습니다.
4. 선택 사항: `OPENAI_MODEL=gpt-4.1-mini`. Vercel에는 `PORT`를 설정할 필요가 없습니다.
5. 수정된 커밋으로 Redeploy합니다. 환경 변수 변경도 재배포 후 적용됩니다.

`api/index.js`는 Express 앱을 함수로 내보내고 `vercel.json`은 모든 요청을 해당 함수로 전달합니다. 화면 파일 3개는 함수에 포함하며, 기존 Express의 허용 경로만 공개합니다. 로컬 실행은 기존처럼 `npm.cmd --prefix backend start` 또는 루트에서 `npm.cmd start`를 사용합니다.

500 오류가 계속되면 Vercel의 해당 Deployment → Logs에서 첫 오류의 메시지를 확인하세요. 비밀 키가 포함된 로그는 공유하지 마세요. 메모리 기반 요청 제한은 함수 인스턴스별로 동작하므로 외부 공개 서비스에는 인증 및 공유 저장소 기반 사용량 제한이 필요합니다.

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

### 발음 듣기

문장과 각 단어 옆의 발음 듣기 버튼은 이탈리아어 기기 음성을 우선 사용합니다. 음성이 없거나 재생에 실패하면 `POST /speech`가 OpenAI `tts-1` 모델로 MP3를 생성합니다. 방문자는 음성 파일을 설치할 필요가 없으며 서버의 기존 `OPENAI_API_KEY`를 사용합니다. 이 경우 별도의 음성 API 비용과 인터넷 연결이 필요합니다. AI 합성 음성 사용 안내를 화면에 표시합니다.

음성은 페이지 메모리에 최근 30개까지 임시 저장하며 새로고침하면 사라집니다. 발음 API는 최대 500자, 인스턴스별 분당 30회로 제한합니다. 수정된 서버를 재시작해야 `/speech`가 동작합니다. 로컬 변경은 GitHub에 올리고 재배포하기 전까지 Vercel 사이트에 반영되지 않습니다.

### 서버 보안

- 키는 루트 `.env`에서만 읽고 브라우저 응답과 로그에 포함하지 않습니다.
- Express는 HTML/CSS/프론트엔드 JS만 공개합니다. `.env`, backend, node_modules는 공개하지 않습니다.
- 서버는 로컬 주소에만 바인딩하며 분당 30회로 생성 요청을 제한합니다. 실패한 요청은 횟수에서 제외하고, 제한 시 남은 대기 시간을 안내합니다. 외부 배포 시 인증과 사용자별 사용량 제한을 추가해야 합니다.
- 프로젝트 루트를 Live Preview 같은 별도 정적 서버로 공개하지 마세요.
- 검증: `npm.cmd --prefix backend test`
- 공식 문서: https://developers.openai.com/api/docs/guides/structured-outputs
