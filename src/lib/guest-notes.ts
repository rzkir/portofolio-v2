import {
  getProviderLabel,
  MESSAGE_PROVIDERS,
} from "@/lib/guest-note-providers";

const GUEST_NOTES_PATH = "/api/guest-notes";

let notes: GuestNote[] = [];

function mapNotedMessage(item: NotedMessageProps): GuestNote {
  return {
    id: item._id,
    name: item.name,
    message: item.description,
    provider: item.provider,
    createdAt: item.createdAt,
  };
}

async function fetchGuestNotes(): Promise<GuestNote[]> {
  try {
    const response = await fetch(GUEST_NOTES_PATH, { cache: "no-store" });
    if (!response.ok) return [];

    const data = (await response.json()) as NotedMessageProps[];
    if (!Array.isArray(data)) return [];

    return data
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map(mapNotedMessage);
  } catch {
    return [];
  }
}

async function refreshGuestNotes() {
  notes = await fetchGuestNotes();
  renderNotes();
}

async function createMessage(
  payload: CreateNotedPayload,
): Promise<GuestNote> {
  const response = await fetch(GUEST_NOTES_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Gagal mengirim catatan. Coba lagi.";
    try {
      const body = (await response.json()) as NotedApiError;
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const created = (await response.json()) as NotedMessageProps;
  return mapNotedMessage(created);
}

function formatDateFull(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function pad3(value: number) {
  return String(value).padStart(3, "0");
}

function updateCounts() {
  const countEl = document.getElementById("guest-notes-count");
  const heroIndex = document.getElementById("guest-notes-hero-index");
  const archiveCount = document.getElementById("guest-notes-archive-count");

  if (countEl) countEl.textContent = `${notes.length} catatan`;
  if (heroIndex) heroIndex.textContent = pad2(notes.length);
  if (archiveCount) archiveCount.textContent = `N° ${pad3(notes.length)}`;
}

function renderNotes() {
  const list = document.getElementById("guest-notes-list");
  const empty = document.getElementById("guest-notes-empty");
  if (!list || !empty) return;

  updateCounts();

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
      (note, index) => `
        <li class="grid grid-cols-12 gap-6 py-10 transition-colors hover:bg-background/60">
          <div class="col-span-12 md:col-span-1">
            <span class="font-mono text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
              ${pad2(index + 1)}
            </span>
          </div>
          <blockquote class="col-span-12 md:col-span-8">
            <p class="font-display text-2xl leading-snug text-foreground md:text-[1.75rem]">
              <span class="mr-1 text-accent">“</span>${escapeHtml(note.message)}<span class="ml-1 text-accent">”</span>
            </p>
            <footer class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              <span class="text-foreground/80">— ${escapeHtml(note.name)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(getProviderLabel(note.provider))}</span>
            </footer>
          </blockquote>
          <div class="col-span-12 md:col-span-3 md:text-right">
            <time class="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              ${formatDateFull(note.createdAt)}
            </time>
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

function readBootstrap(): GuestNote[] {
  const bootstrap = document.getElementById("guest-notes-bootstrap");
  let notes: GuestNote[] = [];

  if (bootstrap?.textContent) {
    try {
      const parsed = JSON.parse(bootstrap.textContent) as GuestNote[];
      notes = Array.isArray(parsed) ? parsed : [];
    } catch {
      notes = [];
    }
  }

  return notes;
}

export function bootGuestNotes() {
  initGuestNotes(readBootstrap());
}

export function initGuestNotes(initialNotes: GuestNote[] = []) {
  const form = document.getElementById("guest-notes-form");

  if (!form || form.dataset.bound === "true") {
    void refreshGuestNotes();
    return;
  }

  notes = initialNotes;

  const nameInput = document.getElementById("guest-name") as HTMLInputElement | null;
  const providerInput = document.getElementById("guest-provider") as HTMLSelectElement | null;
  const messageInput = document.getElementById("guest-message") as HTMLTextAreaElement | null;
  const errorEl = document.getElementById("guest-notes-error");
  const countEl = document.getElementById("guest-message-count");
  const submitBtn = form?.querySelector("button[type='submit']") as HTMLButtonElement | null;

  form.dataset.bound = "true";

  messageInput?.addEventListener("input", () => {
    if (countEl && messageInput) countEl.textContent = `${messageInput.value.length}/280`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!nameInput || !providerInput || !messageInput || !errorEl) return;

    const name = nameInput.value.trim();
    const provider = providerInput.value as MessageProvider;
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
    if (!MESSAGE_PROVIDERS.includes(provider)) {
      errorEl.textContent = "Pilih sumber yang valid";
      errorEl.classList.remove("hidden");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const created = await createMessage({
        name,
        description: message,
        provider,
      });

      notes = [created, ...notes];
      nameInput.value = "";
      providerInput.value = "website";
      messageInput.value = "";
      if (countEl) countEl.textContent = "0/280";
      renderNotes();
      void refreshGuestNotes();
    } catch (error) {
      errorEl.textContent =
        error instanceof Error ? error.message : "Gagal mengirim catatan. Coba lagi.";
      errorEl.classList.remove("hidden");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  renderNotes();
  void refreshGuestNotes();
}
