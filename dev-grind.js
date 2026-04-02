import { db } from "./firebase-client.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const STATE_KEY = "devgrind_state_v4";
const devGrindRef = ref(db, "devGrind");

const state = {
  currentPhase: 1,
  currentTab: "today",
  streak: 0,
  lastActiveDate: null,
  todayMinutes: { python: 0, fastapi: 0, rag: 0, cert: 0 },
  completedTasks: {},
  logs: [],
  sessions: [],
  heatmap: {},
  goals: { rag: 0, cert: 0, dev: 0 },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function mergeRemoteFromJson(data) {
  if (!data || typeof data !== "object") return;
  try {
    Object.assign(state, JSON.parse(JSON.stringify(data)));
  } catch {
    /* ignore */
  }
}

function applyDailyRollover() {
  const day = todayISO();
  let dayChanged = false;
  if (state.lastActiveDate !== day) {
    dayChanged = true;
    if (state.lastActiveDate) {
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (state.lastActiveDate === y && totalTodayMinutesFromState() >= 120) {
        state.streak = (state.streak || 0) + 1;
      }
    }
    state.todayMinutes = { python: 0, fastapi: 0, rag: 0, cert: 0 };
    state.completedTasks = {};
  }
  state.lastActiveDate = day;
  state.logs = state.logs || [];
  state.sessions = state.sessions || [];
  state.heatmap = state.heatmap || {};
  state.goals = { rag: 0, cert: 0, dev: 0, ...state.goals };
  state.todayMinutes = { python: 0, fastapi: 0, rag: 0, cert: 0, ...state.todayMinutes };
  return dayChanged;
}

function totalTodayMinutesFromState() {
  return Object.values(state.todayMinutes).reduce((a, b) => a + b, 0);
}

function pushDevGrindToCloud() {
  return set(devGrindRef, JSON.parse(JSON.stringify(state)))
    .then(() => {
      const el = document.getElementById("syncStatus");
      if (!el) return;
      el.hidden = true;
      el.textContent = "";
      el.classList.remove("is-error");
    })
    .catch((err) => {
      const el = document.getElementById("syncStatus");
      if (!el) return;
      el.textContent =
        err?.code === "PERMISSION_DENIED"
          ? "DB 규칙에서 devGrind 읽기·쓰기를 허용했는지 확인하세요."
          : err?.message || "클라우드 저장에 실패했어요.";
      el.hidden = false;
      el.classList.add("is-error");
    });
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  void pushDevGrindToCloud();
}

function totalTodayMinutes() {
  return Object.values(state.todayMinutes).reduce((a, b) => a + b, 0);
}

const PHASES = {
  1: {
    title: "1단계",
    name: "기초 만들기",
    subtitle: "기초 만드는 구간 · ~ 4/3",
    desc: "파이썬 · FastAPI · RAG 개념 · 하루 3시간 루틴 구축",
    color: "#7bc9a8",
    tasks: [
      {
        id: "python",
        type: "python",
        title: "🐍 파이썬 필수 기초",
        desc: "이론 30분 + 직접 코드 30분 (함수, 리스트/딕셔너리, 클래스)",
        duration: 60,
        time: "10:00 ~ 11:00",
      },
      {
        id: "fastapi",
        type: "fastapi",
        title: "⚡ 백엔드 입문 (FastAPI)",
        desc: 'API 개념 → @app.get("/") hello world',
        duration: 60,
        time: "14:00 ~ 15:00",
      },
      {
        id: "rag",
        type: "rag",
        title: "🔍 RAG 개념 + 바이브코딩",
        desc: "벡터DB · 임베딩 — 왜 필요한지",
        duration: 60,
        time: "16:00 ~ 17:00",
      },
      {
        id: "cert",
        type: "cert",
        title: "📋 정처기 기출 (선택)",
        desc: "힘 남으면 5~10문제",
        duration: 60,
        time: "퇴근 후",
        optional: true,
      },
    ],
  },
  2: {
    title: "2단계",
    name: "프로젝트 시작",
    subtitle: "프로젝트 시작 · 4/4 ~ 4/12",
    desc: "파이썬/FastAPI 복습 + RAG 본격",
    color: "#9aa8ef",
    tasks: [
      {
        id: "review",
        type: "fastapi",
        title: "📖 파이썬 + FastAPI 복습",
        desc: '"읽고 수정" — 완벽주의 금지',
        duration: 60,
        time: "10:00 ~ 11:00",
      },
      {
        id: "rag1",
        type: "rag",
        title: "✨ RAG 프로젝트 (1h)",
        desc: "텍스트 → 임베딩 → Q&A 구조",
        duration: 60,
        time: "14:00 ~ 15:00",
      },
      {
        id: "rag2",
        type: "rag",
        title: "✨ RAG 프로젝트 (2h)",
        desc: "돌아가기만 하면 성공",
        duration: 60,
        time: "15:00 ~ 16:00",
      },
      {
        id: "cert",
        type: "cert",
        title: "📋 정처기 기출",
        desc: "기출 위주",
        duration: 60,
        time: "퇴근 후",
        optional: true,
      },
    ],
  },
  3: {
    title: "3단계",
    name: "프로젝트 몰빵",
    subtitle: "프로젝트 주간 · 4/13 ~ 4/17",
    desc: "수업 3h + 집 2~3h",
    color: "#f0a088",
    tasks: [
      {
        id: "proj1",
        type: "rag",
        title: "✨ 프로젝트 (수업)",
        desc: "기능 구현",
        duration: 180,
        time: "10:00 ~ 13:00",
      },
      {
        id: "proj2",
        type: "rag",
        title: "✨ 프로젝트 (집)",
        desc: "2~3h 추가",
        duration: 120,
        time: "저녁",
        optional: true,
      },
      {
        id: "present",
        type: "python",
        title: "🎤 발표 준비",
        desc: "기능 · RAG 구조 · 데이터 이유",
        duration: 60,
        time: "수시",
      },
    ],
  },
  4: {
    title: "4단계",
    name: "정처기 실기",
    subtitle: "정처기 집중 · 4/18 이후",
    desc: "기출 반복 · 프로젝트 가볍게",
    color: "#e8c878",
    tasks: [
      {
        id: "cert1",
        type: "cert",
        title: "📋 기출 (오전)",
        desc: "자주 나오는 유형",
        duration: 90,
        time: "오전",
      },
      {
        id: "cert2",
        type: "cert",
        title: "📋 기출 (오후)",
        desc: "취약 파트",
        duration: 90,
        time: "오후",
      },
      {
        id: "proj-light",
        type: "rag",
        title: "🔧 프로젝트 유지",
        desc: "가볍게만",
        duration: 30,
        time: "짬짬이",
      },
    ],
  },
};

const GOALS_DATA = [
  { id: "rag", icon: "🤖", name: "RAG 프로젝트 완성", desc: "텍스트 → 임베딩 → Q&A", color: "#f0a088" },
  { id: "cert", icon: "📋", name: "정처기 합격", desc: "기출 반복", color: "#e8c878" },
  { id: "dev", icon: "💻", name: "개발 기초", desc: "Python · FastAPI · 벡터DB", color: "#9aa8ef" },
];

const RAG_CHECKLIST = [
  { id: "explain_func", text: "내가 만든 기능 설명 가능" },
  { id: "explain_rag", text: "RAG 구조 설명 가능" },
  { id: "explain_data", text: "왜 이 데이터 썼는지 말할 수 있음" },
];

const MOTTOS = [
  "오늘 하루 3시간을 제대로 쓰면, 프로젝트가 나온다",
  "만들면서 배워라 — 완벽하게 배우고 시작은 없다",
  '"돌아가기만 하면 성공" — 완벽주의 버려',
  "이론만 보는 건 시간 낭비 — 손가락을 움직여라",
  "주말이 진짜 승부 — 토요일 4시간 집중해",
  "강의만 듣고 코딩 안 하면 망한다 — 직접 쳐라",
  "하루 3시간 × 30일 = 취준 가능한 포폴",
];

let timerInterval = null;
let timerRunning = false;
let timerSeconds = 3600;
let timerDuration = 3600;
let timerTaskId = null;
let timerTaskType = null;
let timerElapsed = 0;

function changeTimerDuration(val) {
  if (timerRunning) return;
  timerDuration = Number(val) * 60;
  timerSeconds = timerDuration;
  const label = document.getElementById("timer-duration-label");
  if (label) label.textContent = `${val}분`;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const el = document.getElementById("timer-display");
  if (!el) return;
  el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  el.classList.toggle("red", timerSeconds < 300 && timerRunning);
}

function toggleTimer() {
  if (!timerTaskId) {
    showToast("먼저 태스크 카드를 눌러 선택!");
    return;
  }
  const btn = document.getElementById("btn-start");
  timerRunning = !timerRunning;
  if (btn) btn.textContent = timerRunning ? "⏸ PAUSE" : "▶ RESUME";

  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds--;
      timerElapsed++;
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        completeTimer();
      }
      updateTimerDisplay();
    }, 1000);
  } else {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  timerSeconds = timerDuration;
  timerElapsed = 0;
  const btn = document.getElementById("btn-start");
  if (btn) btn.textContent = "▶ START";
  updateTimerDisplay();
}

function recordSessionMinutes(mins) {
  if (mins <= 0 || !timerTaskType) return;
  state.todayMinutes[timerTaskType] = (state.todayMinutes[timerTaskType] || 0) + mins;
  state.sessions.push({
    date: todayISO(),
    minutes: mins,
    type: timerTaskType,
  });
  updateHeatmap();
  saveState();
  updateStats();
}

function skipTimer() {
  if (timerElapsed > 60) {
    const mins = Math.round(timerElapsed / 60);
    recordSessionMinutes(mins);
    showToast(`+${mins}분 기록`);
  }
  resetTimer();
}

function completeTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;

  const mins = Math.round(timerDuration / 60);
  if (timerTaskType) {
    state.todayMinutes[timerTaskType] = (state.todayMinutes[timerTaskType] || 0) + mins;
    state.sessions.push({ date: todayISO(), minutes: mins, type: timerTaskType });
  }
  if (timerTaskId) state.completedTasks[timerTaskId] = true;
  updateHeatmap();
  saveState();
  updateStats();
  renderTasks();
  timerElapsed = 0;
  const btn = document.getElementById("btn-start");
  if (btn) btn.textContent = "▶ START";
  showToast(`🎉 세션 완료! ${mins}분`);
  resetTimer();
}

function selectTimerTask(id, type, name, duration) {
  timerTaskId = id;
  timerTaskType = type;
  const nameEl = document.getElementById("timer-task-name");
  const subEl = document.getElementById("timer-subject-label");
  if (nameEl) nameEl.textContent = name;
  if (subEl) subEl.textContent = `${type.toUpperCase()} 세션`;
  if (!timerRunning) {
    timerDuration = duration * 60;
    timerSeconds = timerDuration;
    const slider = document.getElementById("timer-slider");
    if (slider) slider.value = String(duration);
    const label = document.getElementById("timer-duration-label");
    if (label) label.textContent = `${duration}분`;
    updateTimerDisplay();
  }
}

function updateHeatmap() {
  const total = totalTodayMinutes();
  let level = 0;
  if (total >= 180) level = 4;
  else if (total >= 120) level = 3;
  else if (total >= 60) level = 2;
  else if (total >= 20) level = 1;
  state.heatmap[todayISO()] = level;
}

function renderTasks() {
  const phase = PHASES[state.currentPhase];
  const list = document.getElementById("task-list");
  const secLabel = document.getElementById("tasks-section-label");
  if (secLabel) secLabel.textContent = `${state.currentPhase}단계 · 오늘의 루틴`;
  if (!list) return;
  list.innerHTML = "";

  phase.tasks.forEach((t, i) => {
    const done = !!state.completedTasks[t.id];
    const card = document.createElement("div");
    card.className = `task-card ${t.type}${done ? " done" : ""}`;
    card.style.animationDelay = `${i * 0.06}s`;

    const opt = t.optional
      ? ' <span style="font-size:0.65rem;color:var(--text-muted);font-weight:400">(선택)</span>'
      : "";

    card.innerHTML = `
      <div class="task-check">${done ? "✓" : ""}</div>
      <div class="task-info">
        <div class="task-title">${t.title}${opt}</div>
        <div class="task-desc">${t.desc}</div>
      </div>
      <div class="task-time">
        <div class="task-duration">${t.duration}분</div>
        <div>${t.time}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (!done) {
        selectTimerTask(t.id, t.type, t.title, t.duration);
        showToast("타이머 세팅됨 → START");
      } else {
        state.completedTasks[t.id] = false;
        saveState();
        renderTasks();
        updateStats();
        updateDailyProgress();
        updateRingProgress();
      }
    });

    card.addEventListener("dblclick", (e) => {
      e.preventDefault();
      state.completedTasks[t.id] = !state.completedTasks[t.id];
      if (state.completedTasks[t.id]) {
        state.todayMinutes[t.type] = (state.todayMinutes[t.type] || 0) + t.duration;
        updateHeatmap();
        showToast(`✅ 완료 처리 +${t.duration}분`);
      }
      saveState();
      renderTasks();
      updateStats();
      updateDailyProgress();
      updateRingProgress();
    });

    list.appendChild(card);
  });
}

function renderWeekGrid() {
  const grid = document.getElementById("week-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const isToday = ds === todayISO();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const level = state.heatmap[ds] || 0;

    const cell = document.createElement("div");
    cell.className = `day-cell${isToday ? " today" : ""}${isWeekend ? " weekend" : ""}`;
    cell.innerHTML = `
      <div class="day-name">${days[d.getDay()]}</div>
      <div class="day-num">${d.getDate()}</div>
      <div class="day-dots">
        ${level > 0 ? '<div class="dot rag"></div>' : ""}
        ${level > 1 ? '<div class="dot python"></div>' : ""}
        ${level > 2 ? '<div class="dot fastapi"></div>' : ""}
        ${level === 0 ? '<div class="dot empty"></div>' : ""}
      </div>
    `;
    grid.appendChild(cell);
  }
}

function renderHeatmap() {
  const grid = document.getElementById("heatmap-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 27);

  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    const level = Math.min(state.heatmap[ds] || 0, 4);
    const cell = document.createElement("div");
    cell.className = "hmap-cell";
    cell.dataset.level = level > 0 ? String(level) : "0";
    cell.dataset.date = ds;
    grid.appendChild(cell);
  }
}

function renderGoals() {
  const grid = document.getElementById("goals-grid");
  if (!grid) return;
  grid.innerHTML = "";
  GOALS_DATA.forEach((g) => {
    const pct = state.goals[g.id] || 0;
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `
      <div class="goal-icon">${g.icon}</div>
      <div class="goal-name">${g.name}</div>
      <div class="goal-progress-text">${g.desc}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <input type="range" min="0" max="100" value="${pct}" data-goal="${g.id}" class="goal-range" style="flex:1" />
        <span style="font-family:var(--font-mono);font-size:0.75rem;font-weight:700;color:${g.color};min-width:40px">${pct}%</span>
      </div>
      <div class="goal-bar">
        <div class="goal-fill" style="width:${pct}%;background:${g.color}"></div>
      </div>
    `;
    const range = card.querySelector(".goal-range");
    range.addEventListener("input", (e) => {
      state.goals[g.id] = parseInt(e.target.value, 10);
      saveState();
      renderGoals();
    });
    grid.appendChild(card);
  });
}

function renderRagChecklist() {
  const el = document.getElementById("rag-checklist");
  if (!el) return;
  el.innerHTML = "";
  RAG_CHECKLIST.forEach((item) => {
    const key = `rag_${item.id}`;
    const checked = !!state.completedTasks[key];
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer";
    div.innerHTML = `
      <div style="width:22px;height:22px;border-radius:8px;border:2px solid ${checked ? "var(--accent)" : "var(--border)"};background:${checked ? "var(--accent)" : "none"};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.75rem;color:${checked ? "#fff" : "transparent"};font-weight:700">${checked ? "✓" : ""}</div>
      <span style="font-size:0.9rem;font-weight:700;${checked ? "text-decoration:line-through;opacity:0.5" : ""}">${item.text}</span>
    `;
    div.addEventListener("click", () => {
      state.completedTasks[key] = !state.completedTasks[key];
      saveState();
      renderRagChecklist();
      showToast(state.completedTasks[key] ? "✅ 체크" : "↩ 해제");
    });
    el.appendChild(div);
  });
}

function renderRoadmap() {
  const el = document.getElementById("roadmap");
  if (!el) return;
  const items = [
    { phase: 1, label: "~ 4/3", title: "기초 구축", desc: "파이썬 · FastAPI · RAG 개념", color: "#7bc9a8" },
    { phase: 2, label: "4/4 ~ 4/12", title: "프로젝트 시작", desc: "텍스트 → 임베딩 → Q&A", color: "#9aa8ef" },
    { phase: 3, label: "4/13 ~ 4/17", title: "프로젝트 완성", desc: "발표 준비", color: "#f0a088" },
    { phase: 4, label: "4/18 ~", title: "정처기 실기", desc: "기출 반복", color: "#e8c878" },
  ];

  el.innerHTML =
    '<div style="position:absolute;left:10px;top:8px;bottom:8px;width:2px;background:var(--border)"></div>';

  items.forEach((item) => {
    const done = state.currentPhase > item.phase;
    const current = state.currentPhase === item.phase;
    const div = document.createElement("div");
    div.style.cssText =
      "display:flex;align-items:flex-start;gap:16px;margin-bottom:24px;position:relative;cursor:pointer";
    div.innerHTML = `
      <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${current ? item.color : done ? item.color : "var(--border)"};background:${current ? item.color : done ? item.color : "var(--surface)"};display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1;font-size:0.7rem;font-weight:700;color:${done || current ? "#fff" : "transparent"}">${done ? "✓" : current ? "◉" : ""}</div>
      <div style="flex:1;background:var(--surface);border:1px solid ${current ? item.color : "var(--border)"};border-radius:8px;padding:14px 16px;${current ? `box-shadow:0 0 14px ${item.color}33` : ""}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-weight:700;font-size:0.9rem">${item.title}</span>
          <span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted)">${item.label}</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${item.desc}</div>
        ${current ? `<div style="font-family:var(--font-mono);font-size:0.6rem;color:${item.color};margin-top:6px;letter-spacing:1px">◀ 현재</div>` : ""}
      </div>
    `;
    div.addEventListener("click", () => switchPhase(item.phase));
    el.appendChild(div);
  });
}

function renderLogs() {
  const el = document.getElementById("log-entries");
  if (!el) return;
  const todayLogs = (state.logs || []).filter((l) => l.date === todayISO());
  if (todayLogs.length === 0) {
    el.innerHTML =
      '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem;font-family:var(--font-mono)">아직 기록이 없어 💬</div>';
    return;
  }
  el.innerHTML = "";
  todayLogs
    .slice()
    .reverse()
    .forEach((log) => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = `
      <span class="log-time">${log.time}</span>
      <span class="log-text"></span>
      <button type="button" class="log-delete" aria-label="삭제">✕</button>
    `;
      div.querySelector(".log-text").textContent = log.text;
      div.querySelector(".log-delete").addEventListener("click", () => {
        state.logs = state.logs.filter((l) => l.id !== log.id);
        saveState();
        renderLogs();
      });
      el.appendChild(div);
    });
}

function renderSubjectBreakdown() {
  const el = document.getElementById("subject-breakdown");
  if (!el) return;
  const subjects = [
    { key: "python", label: "🐍 파이썬", color: "var(--accent)" },
    { key: "fastapi", label: "⚡ FastAPI", color: "var(--accent3)" },
    { key: "rag", label: "🔍 RAG/프로젝트", color: "var(--accent2)" },
    { key: "cert", label: "📋 정처기", color: "var(--yellow)" },
  ];
  const total = totalTodayMinutes() || 1;

  el.innerHTML =
    '<div style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);letter-spacing:2px;margin-bottom:16px">오늘 과목별</div>';

  subjects.forEach((s) => {
    const mins = state.todayMinutes[s.key] || 0;
    const pct = Math.round((mins / total) * 100);
    const row = document.createElement("div");
    row.style.marginBottom = "12px";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:0.8rem">${s.label}</span>
        <span style="font-family:var(--font-mono);font-size:0.75rem;color:${s.color}">${mins}분</span>
      </div>
      <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${s.color};border-radius:3px;transition:width 0.6s"></div>
      </div>
    `;
    el.appendChild(row);
  });
}

function updateStats() {
  const total = totalTodayMinutes();
  const h = Math.floor(total / 60);
  const m = total % 60;
  const remain = Math.max(0, 180 - total);
  const rh = Math.floor(remain / 60);
  const rm = remain % 60;
  const phase = PHASES[state.currentPhase];
  const completed = phase.tasks.filter((t) => state.completedTasks[t.id]).length;

  const set = (id, text) => {
    const n = document.getElementById(id);
    if (n) n.textContent = text;
  };

  set("stat-today", `${h}h ${m}m`);
  set("stat-remain", `${rh}h ${rm}m`);
  set("stat-tasks", `${completed} / ${phase.tasks.length}`);
  set("stat-streak", `${state.streak}일`);
  set("streak-badge", `🌸 ${state.streak}일 연속`);

  const allMins = (state.sessions || []).reduce((a, s) => a + (s.minutes || 0), 0);
  const th = Math.floor(allMins / 60);
  const tm = allMins % 60;
  set("stat-total-time", `${th}H ${tm}M`);
  set("stat-sessions", String((state.sessions || []).length));
}

function updateDailyProgress() {
  const total = totalTodayMinutes();
  const goal = 180;
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const gh = Math.floor(goal / 60);

  const bar = document.getElementById("daily-bar");
  const pctEl = document.getElementById("daily-pct");
  const segs = document.getElementById("progress-segs");

  if (bar) bar.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}% · ${h}h ${m}m / ${gh}h`;

  if (segs) {
    segs.innerHTML = "";
    const types = ["python", "fastapi", "rag"];
    types.forEach((t) => {
      const mins = state.todayMinutes[t] || 0;
      const blocks = Math.ceil(mins / 15);
      for (let i = 0; i < Math.min(blocks, 4); i++) {
        const s = document.createElement("div");
        s.className = `seg filled ${t}`;
        segs.appendChild(s);
      }
    });
    const filled = total;
    const empty = Math.max(0, 12 - Math.ceil(filled / 15));
    for (let i = 0; i < empty; i++) {
      const s = document.createElement("div");
      s.className = "seg";
      segs.appendChild(s);
    }
  }
}

function updateRingProgress() {
  const circle = document.getElementById("ring-circle");
  const text = document.getElementById("ring-text");
  if (!circle) return;

  const phase = PHASES[state.currentPhase];
  const completed = phase.tasks.filter((t) => state.completedTasks[t.id]).length;
  const pct = phase.tasks.length > 0 ? Math.round((completed / phase.tasks.length) * 100) : 0;
  const circumference = 213.6;
  const offset = circumference - (pct / 100) * circumference;

  circle.style.strokeDashoffset = String(offset);
  circle.style.stroke = phase.color;
  if (text) {
    text.textContent = `${pct}%`;
    text.style.color = phase.color;
  }
}

function updateDateDisplay() {
  const now = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d1 = document.getElementById("current-date");
  const d2 = document.getElementById("current-day");
  if (d1) d1.textContent = now.toISOString().slice(0, 10).replace(/-/g, ".");
  if (d2) d2.textContent = days[now.getDay()];
}

function switchPhase(n) {
  state.currentPhase = n;
  saveState();

  document.querySelectorAll(".phase-btn").forEach((b) => {
    b.classList.toggle("active", Number(b.dataset.phase) === n);
  });

  const phase = PHASES[n];
  const content = document.getElementById("main-content");
  if (content) content.className = `content phase-${n}`;

  const h1 = document.getElementById("phase-title-h1");
  if (h1) {
    h1.textContent = phase.title;
    h1.style.color = phase.color;
  }
  const sub = document.getElementById("phase-subtitle");
  if (sub) sub.textContent = phase.subtitle;
  const desc = document.getElementById("phase-desc");
  if (desc) desc.textContent = phase.desc;

  renderTasks();
  renderGoals();
  renderRoadmap();
  updateStats();
  updateRingProgress();
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tab);
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === `view-${tab}`);
  });

  if (tab === "week") {
    renderWeekGrid();
    renderHeatmap();
  }
  if (tab === "goals") {
    renderGoals();
    renderRagChecklist();
    renderRoadmap();
  }
  if (tab === "log") {
    renderLogs();
    renderSubjectBreakdown();
  }
}

function addLog() {
  const input = document.getElementById("log-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const now = new Date();
  const log = {
    id: `${Date.now()}`,
    text,
    date: todayISO(),
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
  state.logs = [...(state.logs || []), log];
  saveState();
  input.value = "";
  renderLogs();
  showToast("기록 완료 ✅");
}

function refreshMotto() {
  const el = document.getElementById("motto-text");
  if (!el) return;
  const current = el.textContent;
  let next;
  do {
    next = MOTTOS[Math.floor(Math.random() * MOTTOS.length)];
  } while (next === current && MOTTOS.length > 1);
  el.style.opacity = "0";
  el.style.transition = "opacity 0.2s";
  setTimeout(() => {
    el.textContent = next;
    el.style.opacity = "1";
  }, 200);
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

function renderAll() {
  updateDateDisplay();
  renderTasks();
  renderWeekGrid();
  renderHeatmap();
  renderGoals();
  renderRagChecklist();
  renderRoadmap();
  renderLogs();
  updateStats();
  updateDailyProgress();
  updateRingProgress();
  renderSubjectBreakdown();
}

/* init — Realtime DB + 로컬 캐시 */
let devGrindUiWired = false;
let devGrindEmptyHandled = false;

function wireDevGrindDom() {
  if (devGrindUiWired) return;
  devGrindUiWired = true;

  document.querySelectorAll(".phase-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchPhase(Number(btn.dataset.phase)));
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  document.getElementById("btn-start")?.addEventListener("click", toggleTimer);
  document.getElementById("btn-reset-timer")?.addEventListener("click", resetTimer);
  document.getElementById("btn-skip-timer")?.addEventListener("click", skipTimer);
  document.getElementById("timer-slider")?.addEventListener("input", (e) => changeTimerDuration(e.target.value));
  document.getElementById("btn-refresh-motto")?.addEventListener("click", refreshMotto);
  document.getElementById("btn-add-log")?.addEventListener("click", addLog);
  document.getElementById("log-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addLog();
  });

  setInterval(updateDateDisplay, 60000);
}

function bootstrapDevGrindUi() {
  wireDevGrindDom();
  renderAll();
  switchPhase(state.currentPhase);
  switchTab(state.currentTab);
  refreshMotto();
}

onValue(
  devGrindRef,
  (snap) => {
    if (snap.exists()) {
      mergeRemoteFromJson(snap.val());
      const rolled = applyDailyRollover();
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      if (rolled) {
        void pushDevGrindToCloud();
      }
      bootstrapDevGrindUi();
      return;
    }
    if (!devGrindEmptyHandled) {
      devGrindEmptyHandled = true;
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        try {
          mergeRemoteFromJson(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
      applyDailyRollover();
      saveState();
    }
    bootstrapDevGrindUi();
  },
  (err) => {
    const el = document.getElementById("syncStatus");
    if (el) {
      el.textContent =
        err?.code === "PERMISSION_DENIED"
          ? "DB 규칙에서 devGrind 읽기·쓰기를 허용했는지 확인하세요."
          : err?.message || "불러오기 실패";
      el.hidden = false;
      el.classList.add("is-error");
    }
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      try {
        mergeRemoteFromJson(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    applyDailyRollover();
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    bootstrapDevGrindUi();
  }
);
