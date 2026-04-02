import { app, db } from "./firebase-client.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
import { ref, push, set, onValue, remove, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

try {
  getAnalytics(app);
} catch {
  /* Analytics 미지원 환경 */
}
const todosRef = ref(db, "todos");

const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const listEl = document.getElementById("todoList");
const emptyEl = document.getElementById("emptyState");
const previewEl = document.getElementById("todoPreview");
const statusEl = document.getElementById("statusMsg");

let todos = [];

function showStatus(msg, isError = true) {
  statusEl.textContent = msg;
  statusEl.hidden = !msg;
  statusEl.classList.toggle("is-error", isError);
  statusEl.classList.toggle("is-ok", !isError);
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.textContent = "";
}

function rtdbMsg(err) {
  const c = err?.code ?? "";
  if (c === "PERMISSION_DENIED") {
    return "Realtime Database 규칙에서 읽기/쓰기가 막혀 있어요. 콘솔에서 todos 규칙을 확인하세요.";
  }
  return err?.message || "오류가 발생했어요.";
}

function render() {
  listEl.innerHTML = "";
  if (previewEl) {
    previewEl.hidden = todos.length > 0;
  }
  if (todos.length === 0) {
    emptyEl.hidden = Boolean(previewEl);
    return;
  }
  emptyEl.hidden = true;

  for (const item of todos) {
    const li = document.createElement("li");
    li.className =
      "todo-item rounded-2xl shadow-sm ring-1 ring-slate-200/80 transition motion-safe:hover:shadow-md motion-safe:hover:ring-indigo-100";
    li.dataset.id = item.id;

    const textSpan = document.createElement("span");
    textSpan.className = "todo-text";
    textSpan.textContent = item.text;

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className =
      "btn-todo btn-todo--ghost rounded-lg px-2.5 py-1 text-xs font-semibold transition hover:bg-indigo-50";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => startEdit(li, item.id));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className =
      "btn-todo btn-todo--danger rounded-lg px-2.5 py-1 text-xs font-semibold transition hover:brightness-95";
    delBtn.textContent = "삭제";
    delBtn.addEventListener("click", async () => {
      delBtn.disabled = true;
      try {
        await remove(ref(db, `todos/${item.id}`));
        clearStatus();
      } catch (e) {
        showStatus(rtdbMsg(e));
      } finally {
        delBtn.disabled = false;
      }
    });

    actions.append(editBtn, delBtn);
    li.append(textSpan, actions);
    listEl.appendChild(li);
  }
}

async function addTodo(text) {
  const t = text.trim();
  if (!t) return;
  const newRef = push(todosRef);
  await set(newRef, { text: t, createdAt: serverTimestamp() });
  clearStatus();
}

function startEdit(li, id) {
  const item = todos.find((x) => x.id === id);
  if (!item) return;

  const textEl = li.querySelector(".todo-text");
  const actions = li.querySelector(".todo-actions");
  if (!textEl || !actions) return;

  const field = document.createElement("input");
  field.type = "text";
  field.className = "todo-edit-input";
  field.value = item.text;
  field.maxLength = 200;

  const wrap = document.createElement("div");
  wrap.className = "todo-edit-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn-todo btn-todo--primary";
  saveBtn.textContent = "저장";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn-todo btn-todo--ghost";
  cancelBtn.textContent = "취소";

  async function finish(save) {
    if (save) {
      const next = field.value.trim();
      if (!next) {
        render();
        return;
      }
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      field.disabled = true;
      try {
        await update(ref(db, `todos/${id}`), { text: next });
        clearStatus();
      } catch (e) {
        showStatus(rtdbMsg(e));
      } finally {
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        field.disabled = false;
      }
    } else {
      render();
    }
  }

  saveBtn.addEventListener("click", () => void finish(true));
  cancelBtn.addEventListener("click", () => finish(false));
  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void finish(true);
    }
    if (e.key === "Escape") finish(false);
  });

  textEl.replaceWith(field);
  actions.replaceWith(wrap);
  wrap.append(saveBtn, cancelBtn);
  field.focus();
  field.select();
}

onValue(
  todosRef,
  (snap) => {
    const val = snap.val();
    if (!val) todos = [];
    else {
      todos = Object.entries(val)
        .map(([id, v]) => ({
          id,
          text: v?.text ?? "",
          ms: typeof v?.createdAt === "number" ? v.createdAt : 0,
        }))
        .sort((a, b) => a.ms - b.ms)
        .map(({ id, text }) => ({ id, text }));
    }
    render();
    if (location.protocol !== "file:") clearStatus();
  },
  (err) => showStatus(rtdbMsg(err))
);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await addTodo(input.value);
    input.value = "";
    input.focus();
  } catch (err) {
    showStatus(rtdbMsg(err));
  }
});

render();
