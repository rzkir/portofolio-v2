export type GuestNote = {
  id: string;
  name: string;
  message: string;
  provider: MessageProvider;
  createdAt: string;
};

const PROVIDER_LABELS: Record<MessageProvider, string> = {
  website: "Website",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
  other: "Lainnya",
};

type InitGuestNotesOptions = {
  apiUrl: string;
  initialNotes: GuestNote[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderNoteItem(note: GuestNote) {
  const provider = PROVIDER_LABELS[note.provider] ?? note.provider;

  return `
    <li data-cursor="focus" data-cursor-label="Read" class="border border-border bg-background p-5 transition-colors hover:border-accent/40">
      <p class="mb-3 font-display text-lg leading-snug italic">"${escapeHtml(note.message)}"</p>
      <div class="flex items-end justify-between border-t border-border pt-3">
        <div>
          <p class="text-sm font-medium">— ${escapeHtml(note.name)}</p>
          <p class="mt-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">${escapeHtml(provider)}</p>
        </div>
        <p class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">${formatDate(note.createdAt)}</p>
      </div>
    </li>
  `;
}

function createGuestNotesController(options: InitGuestNotesOptions) {
  let notes = [...options.initialNotes];

  function renderNotes() {
    const list = document.getElementById("guest-notes-list");
    const empty = document.getElementById("guest-notes-empty");
    const countEl = document.getElementById("guest-notes-count");
    if (!list || !empty) return;

    if (countEl) countEl.textContent = `${notes.length} catatan`;

    if (notes.length === 0) {
      empty.classList.remove("hidden");
      list.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    empty.classList.add("hidden");
    list.classList.remove("hidden");
    list.innerHTML = notes.map(renderNoteItem).join("");
  }

  async function submitNote(payload: {
    name: string;
    description: string;
    provider: MessageProvider;
  }): Promise<GuestNote> {
    const response = await fetch(`${options.apiUrl}/api/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as NotedMessageProps | NotedApiError;

    if (!response.ok) {
      const message = "error" in data ? data.error : "Gagal mengirim catatan";
      throw new Error(message);
    }

    const created = data as NotedMessageProps;

    return {
      id: created._id,
      name: created.name,
      message: created.description,
      provider: created.provider,
      createdAt: created.createdAt,
    };
  }

  return { renderNotes, submitNote, prependNote(note: GuestNote) {
    notes = [note, ...notes];
  } };
}

export function initGuestNotes(options: InitGuestNotesOptions) {
  const form = document.getElementById("guest-notes-form");
  const nameInput = document.getElementById("guest-name") as HTMLInputElement | null;
  const messageInput = document.getElementById("guest-message") as HTMLTextAreaElement | null;
  const providerInput = document.getElementById("guest-provider") as HTMLSelectElement | null;
  const errorEl = document.getElementById("guest-notes-error");
  const countEl = document.getElementById("guest-message-count");
  const submitBtn = form?.querySelector("button[type='submit']") as HTMLButtonElement | null;

  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const controller = createGuestNotesController(options);

  messageInput?.addEventListener("input", () => {
    if (countEl && messageInput) countEl.textContent = `${messageInput.value.length}/280`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!nameInput || !messageInput || !providerInput || !errorEl) return;

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const provider = providerInput.value as MessageProvider;

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

    try {
      const note = await controller.submitNote({
        name,
        description: message,
        provider,
      });

      controller.prependNote(note);
      nameInput.value = "";
      messageInput.value = "";
      providerInput.value = "website";
      if (countEl) countEl.textContent = "0/280";
      controller.renderNotes();
    } catch (error) {
      errorEl.textContent =
        error instanceof Error ? error.message : "Gagal mengirim catatan";
      errorEl.classList.remove("hidden");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  controller.renderNotes();
}
