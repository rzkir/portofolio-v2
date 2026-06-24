export const GUEST_NOTES_POST_URL = "/api/guest-notes";

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

type GuestNotesLayout = "card" | "editorial";

type InitGuestNotesOptions = {
  initialNotes: GuestNote[];
  layout?: GuestNotesLayout;
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

function renderCardNoteItem(note: GuestNote) {
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

function renderEditorialNoteItem(note: GuestNote, index: number) {
  const provider = PROVIDER_LABELS[note.provider] ?? note.provider;

  return `
    <li class="grid grid-cols-12 gap-6 py-10 transition-colors hover:bg-background/60">
      <div class="col-span-12 md:col-span-1">
        <span class="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          ${String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <blockquote class="col-span-12 md:col-span-8">
        <p class="font-display text-2xl leading-snug text-foreground md:text-[1.75rem]">
          <span class="mr-1 text-accent">"</span>${escapeHtml(note.message)}<span class="ml-1 text-accent">"</span>
        </p>
        <footer class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span class="text-foreground/80">- ${escapeHtml(note.name)}</span>
          <span aria-hidden>·</span>
          <span>${escapeHtml(provider)}</span>
        </footer>
      </blockquote>
      <div class="col-span-12 md:col-span-3 md:text-right">
        <time class="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">${formatEditorialDate(note.createdAt)}</time>
      </div>
    </li>
  `;
}

function formatEditorialDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createGuestNotesController(options: InitGuestNotesOptions) {
  let notes = [...options.initialNotes];
  const layout = options.layout ?? "card";

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
    list.innerHTML =
      layout === "editorial"
        ? notes.map((note, index) => renderEditorialNoteItem(note, index)).join("")
        : notes.map(renderCardNoteItem).join("");
  }

  async function submitNote(payload: {
    name: string;
    description: string;
    provider: MessageProvider;
  }): Promise<GuestNote> {
    const response = await fetch(GUEST_NOTES_POST_URL, {
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

  return {
    renderNotes,
    submitNote,
    prependNote(note: GuestNote) {
      notes = [note, ...notes];
    },
  };
}

function bindGuestNotesForm(form: HTMLFormElement, options: InitGuestNotesOptions) {
  if (form.dataset.guestNotesBound === "true") return;
  form.dataset.guestNotesBound = "true";

  const controller = createGuestNotesController(options);
  const countEl = document.getElementById("guest-message-count");
  const errorEl = document.getElementById("guest-notes-error");
  const submitBtn = form.querySelector("button[type='submit']") as HTMLButtonElement | null;
  const messageInput = form.querySelector<HTMLTextAreaElement>("#guest-message");
  const providerInput = form.querySelector<HTMLSelectElement>("#guest-provider");

  messageInput?.addEventListener("input", () => {
    if (!countEl) return;
    countEl.textContent = `${messageInput.value.length}/280`;
    countEl.className =
      messageInput.value.length >= 280
        ? "font-mono text-[11px] text-destructive"
        : "font-mono text-[11px] text-muted-foreground";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = form.querySelector<HTMLInputElement>("#guest-name");

    if (!nameInput || !messageInput || !providerInput || !errorEl) {
      console.error("[guest-notes] Form elements missing");
      return;
    }

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

    if (!provider) {
      errorEl.textContent = "Sumber wajib dipilih";
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

      controller.prependNote({ ...note, name });

      nameInput.value = "";
      messageInput.value = "";
      providerInput.value = "website";

      if (countEl) {
        countEl.textContent = "0/280";
        countEl.className = "font-mono text-[11px] text-muted-foreground";
      }

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

export function initGuestNotes(options: InitGuestNotesOptions) {
  const bind = () => {
    const form = document.getElementById("guest-notes-form");
    if (form instanceof HTMLFormElement) {
      bindGuestNotesForm(form, options);
    }
  };

  bind();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  }

  document.addEventListener("astro:page-load", bind);
}
