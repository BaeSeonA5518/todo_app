import { db } from "./firebase-client.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const STORAGE_KEY = "job-prep-ai-it-v2";
const jobPrepRef = ref(db, "jobPrep");

const DEFAULT_SECTIONS = [
  {
    id: "urgent-apr",
    title: "4월 핵심 일정",
    meta: "프로젝트 4/13 · 정처기 실기 4/18",
    tasks: [
      "RAG 프로젝트: 데이터 수집·청킹·임베딩 파이프라인을 한 장 다이어그램으로 그려두기",
      "RAG: 검색(Top-k) → 프롬프트 조립 → LLM 호출 흐름을 말로 2분 설명 연습",
      "프로젝트 README에 '왜 RAG인지, 어떤 한계를 어떻게 완화했는지' 5줄 이상 쓰기",
      "정처기 실기: C/Java/SQL 중 약한 과목만 골라 매일 1시간 (4/18까지)",
      "정처기 이론 틀린 문제만 모아 주말에 한 번 더 풀기",
    ],
  },
  {
    id: "target-plan-i",
    title: "㈜플랜아이 — AI·Python (AI 서비스 엔지니어)",
    meta: "공고 스킬과 훈련 과정 직결 · 잡코리아에서 마감일 재확인",
    tasks: [
      "지원 전: 공고문 다시 읽고 'AI 서비스 엔지니어'에 맞춰 자소서 첫 문장 3안 쓰기",
      "Python 기초(상수·변수·함수·제어문·반복문) — 내가 짠 코드 1개 골라 한 줄씩 설명 녹음",
      "객체지향: class·인스턴스·상속 중 이번 과제에 쓴 것만 말로 1분 설명",
      "Pandas/NumPy 전처리: 이번 주 과제에서 '결측·형변환·필터' 중 실제로 한 것 표로 정리",
      "ML: 지도 vs 비지도 예시를 내 데이터/과제 예로 각각 1개",
      "학습·검증·추론(inference) 차이를 내 모델 실습으로 연결해 말하기",
      "CNN / RNN / LSTM — 각각 '어떤 입력에 어울리는지' 한 줄씩 면접 카드에 적기",
      "LangChain·RAG: 체인(또는 그래프)에서 내가 붙인 컴포넌트 이름·역할 나열",
      "최종 프로젝트: 외부 데이터 → 검색 → 프롬프트 → 응답 흐름을 면접용 2분 스크립트로",
      "GitHub 또는 PDF: README에 기술스택·실행법·데모 스크린샷 1장 이상",
    ],
  },
  {
    id: "target-ijera",
    title: "㈜아이제라 — 식품제조 AX 플랫폼 기술영업(신입)",
    meta: "개발직 아님 → 도메인·커뮤니케이션·AX 이해 · 가산",
    tasks: [
      "직무 정리: '기술영업' = 고객(식품사) 니즈 파악 + 사내 제품/엔지니어와 연결 — 한 문장으로",
      "AX(디지털 전환)를 식품 제조 맥락(품질·이력·설비·데이터)에 붙여 30초 스피치",
      "영양사 경력 → 식품·안전·규정·현장 커뮤니케이션 스토리 STAR 1개",
      "공고 우대: 통계·리서치·문서작성·리더십 중 본인 경험 증거(숫자·결과) 적어두기",
      "회사 홈페이지/사업분야 10분 훑고 질문 3개 (제품·고객·AX 프로젝트)",
      "기술 깊이보다 '왜 이 회사·이 산업인지' 진정성 + 학습 의지 한 단락",
    ],
  },
  {
    id: "curriculum-ai-human",
    title: "AI 휴먼 훈련 과정 — 스스로 점검",
    meta: "수료 전에 면접에서 말할 수 있을지 체크 · 11/27 ~ 4/30",
    tasks: [
      "과제 제출 전: 요구사항 체크리스트 직접 써서 전부 만족하는지 확인",
      "팀/페어 활동 있으면 내 역할 한 줄로 정리해 포트폴리오용 메모",
      "[Python] 함수·제어문·반복문으로 짠 코드 직접 설명 가능한가",
      "[Python] 객체지향: 캡슐화·상속을 과제에서 어떻게 썼는지",
      "[데이터] Pandas/NumPy 전처리 단계를 순서대로 말하기",
      "[시각화] Matplotlib/Seaborn으로 어떤 인사이트를 냈는지 한 가지",
      "[ML] 지도·비지도 학습 예측/분류 문제 예시",
      "[ML] 모델 학습 → 평가 지표(정확도 등) 해석 경험 정리",
      "[DL] RNN·CNN·LSTM 중 실습한 것과 입력 데이터 타입 연결",
      "[NLP·음성] 텍스트/음성 전처리가 왜 다른지 한 문장",
      "[멀티모달] 정의 + 수업에서 본 예시 1개",
      "[LLM] Llama 실습: 프롬프트 바꿨을 때 출력 차이 메모 있는지",
      "[LLM] Transformer·어텐션을 비전공자에게 비유로 설명해보기",
      "[프로젝트] 음성+LLM 응답: 파이프라인 다이어그램 그려보기",
      "[SDK] PERSO Live Chat API 연동 시 내가 한 역할·에러 해결 1건",
      "[LangChain] DB 통합·RAG 시 외부 소스 연동 방식 설명",
      "[RAG 최종] 청킹·임베딩·검색기·프롬프트 — 병목/한계와 개선 시도",
      "[네트워크] OSI 또는 TCP/IP에서 면접용으로 알아둘 한 가지 (수업 범위에 맞춰)",
    ],
  },
  {
    id: "vibe-mar-apr",
    title: "바이브 코딩 (3/29 ~ 4/17)",
    meta: "AI가 짠 코드 검수하는 눈 기르기",
    tasks: [
      "강의에서 나온 코드마다 '이 변수는 뭐고, 이 함수는 언제 호출되지?' 주석으로 따라가기",
      "AI 생성 코드 1개 골라 직접 실행·에러 나면 스택 트레이스부터 읽기",
      "같은 기능을 'AI 없이' 의사코드만으로 순서 적어보기 (10분)",
    ],
  },
  {
    id: "base-code",
    title: "코드 기초 (Python → 백엔드 확장)",
    meta: "함수·OOP·API",
    tasks: [
      "Python: 함수(def), 인자, return 예제 3개 직접 타이핑 (복붙 X)",
      "Python: class 하나 만들기 (속성 2개 + 메서드 1개)",
      "HTTP: GET vs POST 차이, status 200/404/500이 뭔지 한 문장씩",
      "JSON이 뭔지, dict와 어떻게 닮았는지 예제로 설명해보기",
      "Java는 '백엔드 채용 공고 많음' 쪽 언어 — 문법은 Python이랑 비교하며 30분씩 (변수·타입·if·for·class)",
      "스프링은 나중에 — 먼저 Java로 클래스·리스트·예외 처리까지",
    ],
  },
  {
    id: "backend-ai",
    title: "AI + 백엔드 방향",
    meta: "포지션 정리",
    tasks: [
      "원하는 직무 3가지 키워드로 잡코리아/원티드 검색해 공통 요구 스킬 목록 만들기",
      "FastAPI 또는 Flask 튜토리얼으로 'Hello API' 하나 배포까지 (로컬만 OK)",
      "RAG 프로젝트에서 쓴 라이브러리 이름·역할 표로 정리 (면접용)",
    ],
  },
  {
    id: "job-hunt",
    title: "취준 병행 (강사님 조언 반영)",
    meta: "면접 가면서 공부",
    tasks: [
      "이번 주 지원 1~3곳 (작은 회사·스타트업 포함 OK)",
      "면접/과제에서 못 말한 질문은 노트에만 적기 → 그날 저녁 20분 조사",
      "자소서/포폴에 '영양사 경력 → 데이터·규정·커뮤니케이션' 연결 문장 초안",
      "스터디·과제 말할 때 STAR 한 덩어리씩 연습 (상황-과제-행동-결과)",
    ],
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultState() {
  const sections = [];
  for (const sec of DEFAULT_SECTIONS) {
    const tasks = sec.tasks.map((text) => ({
      id: uid(),
      text,
      done: false,
      custom: false,
    }));
    sections.push({
      id: sec.id,
      title: sec.title,
      meta: sec.meta,
      tasks,
    });
  }
  return { sections, version: 2 };
}

function loadStateFromLocalOnly() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.sections || !Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  set(jobPrepRef, next).catch((err) => showSyncStatus(syncErrMsg(err), true));
}

function syncErrMsg(err) {
  const c = err?.code ?? "";
  if (c === "PERMISSION_DENIED") {
    return "DB 규칙에서 jobPrep 읽기·쓰기를 허용했는지 확인하세요.";
  }
  return err?.message || "클라우드 저장에 실패했어요.";
}

function showSyncStatus(msg, isError) {
  const el = document.getElementById("syncStatus");
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
  el.classList.toggle("is-error", !!msg && !!isError);
  el.classList.toggle("is-ok", !!msg && !isError);
}

let state = defaultState();
let jobPrepInitialSync = false;

const root = document.getElementById("sectionsRoot");
const progressBar = document.getElementById("progressBar");
const progressLabel = document.getElementById("progressLabel");
const progressPct = document.getElementById("progressPct");

function totalAndDone() {
  let t = 0;
  let d = 0;
  for (const sec of state.sections) {
    for (const task of sec.tasks) {
      t += 1;
      if (task.done) d += 1;
    }
  }
  return { t, d };
}

function updateProgress() {
  const { t, d } = totalAndDone();
  const pct = t === 0 ? 0 : Math.round((d / t) * 100);
  progressBar.style.width = `${pct}%`;
  if (progressPct) progressPct.textContent = `${pct}%`;
  progressLabel.textContent = t === 0 ? "할 일이 없거나 아직 불러오는 중이에요" : `완료 ${d}개 · 남은 ${t - d}개`;
}

function render() {
  root.innerHTML = "";
  for (const sec of state.sections) {
    const block = document.createElement("div");
    block.className = "section-block section-card";
    block.dataset.sectionId = sec.id;

    const head = document.createElement("div");
    head.className = "section-head";
    head.innerHTML = `<h2 class="section-title">${escapeHtml(sec.title)}</h2><span class="section-meta">${escapeHtml(sec.meta)}</span>`;
    block.appendChild(head);

    for (const task of sec.tasks) {
      block.appendChild(taskRowEl(sec.id, task));
    }

    const addWrap = document.createElement("div");
    addWrap.className = "add-row";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = "이 섹션에 할 일 추가";
    inp.maxLength = 300;
    inp.setAttribute("aria-label", `${sec.title}에 할 일 추가`);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "추가";
    btn.addEventListener("click", () => {
      const text = inp.value.trim();
      if (!text) return;
      const section = state.sections.find((s) => s.id === sec.id);
      if (!section) return;
      section.tasks.push({ id: uid(), text, done: false, custom: true });
      inp.value = "";
      saveState(state);
      render();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
    addWrap.append(inp, btn);
    block.appendChild(addWrap);

    root.appendChild(block);
  }
  updateProgress();
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function taskRowEl(sectionId, task) {
  const row = document.createElement("div");
  row.className = "task-row" + (task.done ? " done" : "");

  const rowLabel = document.createElement("label");
  rowLabel.className = "task-row-label";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "task-cb";
  cb.checked = task.done;
  cb.id = `task-${task.id}`;
  cb.addEventListener("change", () => {
    task.done = cb.checked;
    row.classList.toggle("done", task.done);
    saveState(state);
    updateProgress();
  });

  const face = document.createElement("span");
  face.className = "task-cb-face";
  face.setAttribute("aria-hidden", "true");

  const textSpan = document.createElement("span");
  textSpan.className = "task-label";
  textSpan.textContent = task.text;

  rowLabel.append(cb, face, textSpan);
  row.appendChild(rowLabel);

  if (task.custom) {
    const del = document.createElement("button");
    del.type = "button";
    del.className = "task-delete";
    del.textContent = "삭제";
    del.setAttribute("aria-label", "할 일 삭제");
    del.addEventListener("click", () => {
      const section = state.sections.find((s) => s.id === sectionId);
      if (!section) return;
      section.tasks = section.tasks.filter((t) => t.id !== task.id);
      saveState(state);
      render();
    });
    row.appendChild(del);
  }

  return row;
}

document.getElementById("btnReset").addEventListener("click", () => {
  if (!confirm("저장된 체크·추가한 할 일이 모두 초기화됩니다. 계속할까요?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  saveState(state);
  render();
});

document.getElementById("btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `job-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

render();
updateProgress();

onValue(
  jobPrepRef,
  (snap) => {
    const remote = snap.val();
    if (snap.exists() && remote?.sections && Array.isArray(remote.sections)) {
      state = remote;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showSyncStatus("", false);
      render();
      updateProgress();
      return;
    }
    if (!jobPrepInitialSync) {
      jobPrepInitialSync = true;
      const local = loadStateFromLocalOnly();
      state = local || defaultState();
      render();
      updateProgress();
      saveState(state);
    }
  },
  (err) => showSyncStatus(syncErrMsg(err), true)
);
