function initializeLearningApp() {
    const sentences = [
        { italian: "Buongiorno!", korean: "안녕하세요!" },
        { italian: "Ciao!", korean: "안녕!" },
        { italian: "Grazie!", korean: "감사합니다!" },
        { italian: "Prego!", korean: "천만에요!" },
        { italian: "Come stai?", korean: "어떻게 지내?" },
        { italian: "Sto bene.", korean: "잘 지내요." },
        { italian: "Come ti chiami?", korean: "이름이 뭐야?" },
        { italian: "Mi chiamo Anna.", korean: "제 이름은 안나예요." },
        { italian: "Piacere!", korean: "만나서 반가워요!" },
        { italian: "Arrivederci!", korean: "안녕히 가세요!" },
        { italian: "A domani!", korean: "내일 봐요!" },
        { italian: "Buonanotte!", korean: "안녕히 주무세요!" },
        { italian: "Scusa!", korean: "미안해!" },
        { italian: "Non capisco.", korean: "이해하지 못하겠어요." },
        { italian: "Puoi ripetere?", korean: "다시 말해 줄 수 있어?" },
        { italian: "Parli inglese?", korean: "영어 할 줄 알아?" },
        { italian: "Quanto costa?", korean: "얼마인가요?" },
        { italian: "Vorrei un caffè.", korean: "커피 한 잔 주세요." },
        { italian: "Dov'è il bagno?", korean: "화장실은 어디인가요?" },
        { italian: "Buon appetito!", korean: "맛있게 드세요!" }
    ];

    const words = [
        ["ciao", "안녕"], ["grazie", "감사합니다"], ["acqua", "물"],
        ["pane", "빵"], ["latte", "우유"], ["caffè", "커피"],
        ["mela", "사과"], ["libro", "책"], ["casa", "집"],
        ["scuola", "학교"], ["amico", "친구"], ["famiglia", "가족"],
        ["gatto", "고양이"], ["cane", "개"], ["sole", "태양"],
        ["luna", "달"], ["mare", "바다"], ["montagna", "산"],
        ["treno", "기차"], ["stazione", "역"], ["biglietto", "표"],
        ["strada", "길"], ["piazza", "광장"], ["negozio", "가게"],
        ["ristorante", "식당"], ["tavolo", "탁자"], ["sedia", "의자"],
        ["porta", "문"], ["finestra", "창문"], ["giorno", "날"],
        ["notte", "밤"], ["oggi", "오늘"], ["domani", "내일"],
        ["ieri", "어제"], ["rosso", "빨간색"], ["blu", "파란색"],
        ["verde", "초록색"], ["bianco", "흰색"], ["nero", "검은색"],
        ["grande", "큰"], ["piccolo", "작은"], ["bello", "아름다운"],
        ["caldo", "더운"], ["freddo", "추운"], ["felice", "행복한"],
        ["mangiare", "먹다"], ["bere", "마시다"], ["leggere", "읽다"],
        ["scrivere", "쓰다"], ["parlare", "말하다"], ["ascoltare", "듣다"],
        ["camminare", "걷다"], ["dormire", "자다"], ["studiare", "공부하다"]
    ];
    const sections = document.querySelectorAll("section");
    const sentenceSection = sections[0];
    const quizSection = sections[2];
    const sentenceText = sentenceSection.querySelector('p[lang="it"]');
    const translationText = sentenceSection.querySelectorAll("p")[1];
    const progressText = sentenceSection.querySelectorAll("p")[2];
    const nextButton = sentenceSection.querySelector("button");
    const generationStatus = document.createElement("p");
    generationStatus.setAttribute("role", "status");
    nextButton.after(generationStatus);
    const answerInput = quizSection.querySelector("input");
    const checkButton = quizSection.querySelector("button");
    const resultText = document.createElement("p");
    resultText.setAttribute("role", "status");
    quizSection.appendChild(resultText);

    let currentIndex = 0n;
    let wordIndex = 0;
    let quizIndex = 1;
    const wordList = sections[1].querySelector("ul");
    const quizQuestion = quizSection.querySelector("p");

    function addNextButton(section, label, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", onClick);
        section.appendChild(button);
    }

    function showWords() {
        wordList.replaceChildren();
        for (let offset = 0; offset < 3; offset++) {
            const [italian, korean] = words[(wordIndex + offset) % words.length];
            const item = document.createElement("li");
            const word = document.createElement("span");
            word.lang = "it";
            word.textContent = italian;
            item.append(word, ` — ${korean}`);
            wordList.appendChild(item);
        }
    }

    addNextButton(sections[1], "다음 단어", () => {
        wordIndex = (wordIndex + 3) % words.length;
        showWords();
    });

    addNextButton(quizSection, "다음 퀴즈", () => {
        quizIndex = (quizIndex + 1) % words.length;
        const korean = words[quizIndex][1];
        const lastCharacter = korean.charCodeAt(korean.length - 1);
        const hasFinalConsonant = lastCharacter >= 0xac00
            && lastCharacter <= 0xd7a3
            && (lastCharacter - 0xac00) % 28 !== 0;
        const particle = hasFinalConsonant ? "을" : "를";
        quizQuestion.textContent = `‘${korean}’${particle} 이탈리아어로 어떻게 말할까요?`;
        answerInput.value = "";
        resultText.textContent = "";
        answerInput.focus();
    });

    function showSentence() {
        const sentence = sentences[0];
        sentenceText.textContent = sentence.italian;
        translationText.textContent = sentence.korean;
        progressText.textContent = `학습 진도: ${currentIndex + 1n}`;
    }

    nextButton.addEventListener("click", async () => {
        if (nextButton.disabled) return;
        nextButton.disabled = true;
        nextButton.textContent = "생성 중…";
        generationStatus.textContent = "새로운 학습 문장을 만들고 있어요.";
        try {
            const response = await fetch('/generate', {
                cache: "no-store",
                signal: AbortSignal.timeout(45_000)
            });
            const data = await response.json().catch(() => null);
            if (!response.ok) throw new Error(data?.error || "Express 서버 주소(http://127.0.0.1:3001)에서 접속해 주세요.");
            if (!data || typeof data.italian !== "string" || typeof data.korean !== "string"
                || !Array.isArray(data.words) || data.words.length !== 3
                || !data.words.every(word => typeof word.italian === "string" && typeof word.korean === "string")) {
                throw new Error("응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
            }
            const newWords = data.words.map(word => [word.italian, word.korean]);
            wordIndex = words.length;
            words.push(...newWords);
            showWords();
            currentIndex += 1n;
            sentenceText.textContent = data.italian;
            translationText.textContent = data.korean;
            progressText.textContent = `학습 진도: ${currentIndex + 1n}`;
            generationStatus.textContent = "";
        } catch (error) {
            generationStatus.textContent = error.name === "TimeoutError"
                ? "응답 시간이 초과되었습니다. 다시 시도해 주세요."
                : error instanceof TypeError
                    ? "서버에 연결할 수 없습니다. Express 서버 실행과 접속 주소를 확인해 주세요."
                    : error.message;
        } finally {
            nextButton.disabled = false;
            nextButton.textContent = "다음 문장";
        }
    });

    function checkAnswer() {
        const answer = answerInput.value.normalize("NFC").trim().toLocaleLowerCase("it");

        if (!answer) {
            resultText.textContent = "정답을 입력해 주세요.";
        } else if (answer === words[quizIndex][0].normalize("NFC").trim().toLocaleLowerCase("it")) {
            resultText.textContent = "정답입니다! 잘했어요! 🎉";
        } else {
            resultText.textContent = `다시 도전해 보세요! ‘${words[quizIndex][1]}’는 이탈리아어로 ${words[quizIndex][0]}예요.`;
        }
    }

    checkButton.addEventListener("click", checkAnswer);
    answerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            checkAnswer();
        }
    });

    showWords();
    showSentence();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLearningApp, { once: true });
} else {
    initializeLearningApp();
}
