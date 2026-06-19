const STORAGE_KEY = "guest_notes_v1";
const MAX_NOTES = 60;

export type GuestNote = {
  id: string;
  name: string;
  message: string;
  created_at: string;
};

function readNotes(): GuestNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: GuestNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, MAX_NOTES)));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function renderNotes() {
  const list = document.getElementById("guest-notes-list");
  const empty = document.getElementById("guest-notes-empty");
  const countEl = document.getElementById("guest-notes-count");
  if (!list || !empty) return;

  const notes = readNotes();

  if (countEl) countEl.textContent = `${notes.length} catatan`;

  if (notes.length === 0) {
    empty.classList.remove("hidden");
    list.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");
  list.classList.remove("hidden");
  list.innerHTML = notes
    .map(
      (n) => `
        <li data-cursor="focus" data-cursor-label="Read" class="border border-border bg-background p-5 transition-colors hover:border-accent/40">
          <p class="mb-3 font-display text-lg leading-snug italic">"${escapeHtml(n.message)}"</p>
          <div class="flex items-end justify-between border-t border-border pt-3">
            <p class="text-sm font-medium">— ${escapeHtml(n.name)}</p>
            <p class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">${formatDate(n.created_at)}</p>
          </div>
        </li>
      `,
    )
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function initGuestNotes() {
  const form = document.getElementById("guest-notes-form");
  const nameInput = document.getElementById("guest-name") as HTMLInputElement | null;
  const messageInput = document.getElementById("guest-message") as HTMLTextAreaElement | null;
  const errorEl = document.getElementById("guest-notes-error");
  const countEl = document.getElementById("guest-message-count");
  const submitBtn = form?.querySelector("button[type='submit']") as HTMLButtonElement | null;

  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  messageInput?.addEventListener("input", () => {
    if (countEl && messageInput) countEl.textContent = `${messageInput.value.length}/280`;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!nameInput || !messageInput || !errorEl) return;

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    errorEl.classList.add("hidden");
    errorEl.textContent = "";

    if (!name) {
      errorEl.textContent = "Nama wajib diisi";
      errorEl.classList.remove("hidden");
      return;
    }
    if (!message) {
      errorEl.textContent = "Pesan wajib diisi";
      errorEl.classList.remove("hidden");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    const note: GuestNote = {
      id: crypto.randomUUID(),
      name,
      message,
      created_at: new Date().toISOString(),
    };

    writeNotes([note, ...readNotes()]);
    nameInput.value = "";
    messageInput.value = "";
    if (countEl) countEl.textContent = "0/280";
    renderNotes();

    if (submitBtn) submitBtn.disabled = false;
  });

  renderNotes();
}
