import {
  getProviderLabel,
  MESSAGE_PROVIDERS,
} from "@/lib/guest-note-providers";
import { toast } from "@/lib/notifications";
import {
  clearOwnedNoteId,
  createNotedMessageClient,
  deleteNotedMessageClient,
  fetchNotedMessagesClient,
  getOwnedNoteId,
  mapNotedMessage,
  setOwnedNoteId,
  sortNotedMessages,
  updateNotedMessageClient,
} from "@/utils/FetchNoted.client";

const EDIT_DIALOG_ID = "noted-edit-dialog";
const DELETE_DIALOG_ID = "guest-note-delete-dialog";
const GUEST_NOTES_LIST_ID = "guest-notes-list";

let notes: GuestNote[] = [];
let pageLoadBound = false;
let refreshInFlight: Promise<void> | null = null;
let labels: GuestNotesLabels = {
  notesCount: "{count} catatan",
  archiveNo: "N° {count}",
  edit: "Edit",
  delete: "Hapus",
};

type GuestNotesLabels = {
  notesCount: string;
  archiveNo: string;
  edit: string;
  delete: string;
};

function openDialog(id: string) {
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement && !dialog.open) {
    dialog.showModal();
    document.documentElement.classList.add("dialog-open");
  }
}

function closeDialog(id: string) {
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    dialog.close();
  }
}

function isGuestNotesPage() {
  return Boolean(document.getElementById(GUEST_NOTES_LIST_ID));
}

async function refreshGuestNotes() {
  if (!isGuestNotesPage()) return;

  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = (async () => {
    const messages = sortNotedMessages(await fetchNotedMessagesClient());
    notes = messages.map(mapNotedMessage);
    renderNotes();
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
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

  if (countEl) {
    countEl.textContent = labels.notesCount.replace("{count}", String(notes.length));
  }
  if (heroIndex) heroIndex.textContent = pad2(notes.length);
  if (archiveCount) {
    archiveCount.textContent = labels.archiveNo.replace("{count}", pad3(notes.length));
  }
}

function renderNoteActions(note: GuestNote) {
  const ownedId = getOwnedNoteId();
  if (!ownedId || ownedId !== note.id) return "";

  return `
    <div class="mt-4 flex flex-wrap gap-4">
      <button
        type="button"
        data-note-action="edit"
        data-note-id="${escapeHtml(note.id)}"
        class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        ${escapeHtml(labels.edit)}
      </button>
      <button
        type="button"
        data-note-action="delete"
        data-note-id="${escapeHtml(note.id)}"
        class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-destructive"
      >
        ${escapeHtml(labels.delete)}
      </button>
    </div>
  `;
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
        <li class="grid grid-cols-12 gap-6 py-10 transition-colors hover:bg-background/60" data-note-id="${escapeHtml(note.id)}">
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
            ${renderNoteActions(note)}
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

function readBootstrap(): { notes: GuestNote[]; labels: GuestNotesLabels } {
  const bootstrap = document.getElementById("guest-notes-bootstrap");
  let parsedNotes: GuestNote[] = [];
  let parsedLabels = labels;

  if (bootstrap?.textContent) {
    try {
      const parsed = JSON.parse(bootstrap.textContent) as {
        notes?: GuestNote[];
        labels?: GuestNotesLabels;
      };

      parsedNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
      if (parsed.labels) parsedLabels = parsed.labels;
    } catch {
      parsedNotes = [];
    }
  }

  return { notes: parsedNotes, labels: parsedLabels };
}

function populateEditDialog(note: GuestNote) {
  const idInput = document.getElementById("noted-edit-id") as HTMLInputElement | null;
  const nameInput = document.getElementById("noted-edit-name") as HTMLInputElement | null;
  const providerInput = document.getElementById("noted-edit-provider") as HTMLSelectElement | null;
  const messageInput = document.getElementById("noted-edit-message") as HTMLTextAreaElement | null;
  const countEl = document.getElementById("noted-edit-message-count");
  const errorEl = document.getElementById("noted-edit-error");

  if (!idInput || !nameInput || !providerInput || !messageInput) return;

  idInput.value = note.id;
  nameInput.value = note.name;
  providerInput.value = note.provider;
  messageInput.value = note.message;
  if (countEl) countEl.textContent = `${note.message.length}/280`;
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
}

function bindEditDialog() {
  const form = document.getElementById("noted-edit-form");
  if (!form || form.dataset.bound === "true") return;

  const messageInput = document.getElementById("noted-edit-message") as HTMLTextAreaElement | null;
  const countEl = document.getElementById("noted-edit-message-count");
  const errorEl = document.getElementById("noted-edit-error");
  const submitBtn = document.getElementById("noted-edit-submit") as HTMLButtonElement | null;

  form.dataset.bound = "true";

  messageInput?.addEventListener("input", () => {
    if (countEl && messageInput) {
      countEl.textContent = `${messageInput.value.length}/280`;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idInput = document.getElementById("noted-edit-id") as HTMLInputElement | null;
    const nameInput = document.getElementById("noted-edit-name") as HTMLInputElement | null;
    const providerInput = document.getElementById("noted-edit-provider") as HTMLSelectElement | null;

    if (!idInput || !nameInput || !providerInput || !messageInput || !errorEl) return;

    const id = idInput.value.trim();
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
      const updated = await updateNotedMessageClient({
        _id: id,
        name,
        description: message,
        provider,
      });
      const mapped = mapNotedMessage(updated);

      notes = notes.map((note) => (note.id === mapped.id ? mapped : note));
      renderNotes();
      closeDialog(EDIT_DIALOG_ID);
      toast.success("Catatan diperbarui");
      void refreshGuestNotes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui catatan. Coba lagi.";
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
      toast.error("Gagal memperbarui", message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function bindNoteActions() {
  const list = document.getElementById("guest-notes-list");
  if (!list || list.dataset.actionsBound === "true") return;

  list.dataset.actionsBound = "true";

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest<HTMLButtonElement>("[data-note-action]");
    if (!button) return;

    const noteId = button.dataset.noteId;
    const action = button.dataset.noteAction;
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;

    if (action === "edit") {
      populateEditDialog(note);
      openDialog(EDIT_DIALOG_ID);
      return;
    }

    if (action === "delete") {
      document.dispatchEvent(
        new CustomEvent("alert-dialog:open", {
          detail: {
            id: DELETE_DIALOG_ID,
            onConfirm: async () => {
              try {
                await deleteNotedMessageClient(note.id);
                notes = notes.filter((item) => item.id !== note.id);
                clearOwnedNoteId();
                renderNotes();
                toast.success("Catatan dihapus");
                void refreshGuestNotes();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Gagal menghapus catatan. Coba lagi.";
                toast.error("Gagal menghapus", message);
                throw error;
              }
            },
          },
        }),
      );
    }
  });
}

export function bootGuestNotes() {
  if (!isGuestNotesPage()) return;

  const bootstrap = readBootstrap();
  initGuestNotes(bootstrap.notes, bootstrap.labels);
}

export function registerGuestNotesBoot() {
  if (!pageLoadBound) {
    pageLoadBound = true;
    document.addEventListener("astro:page-load", bootGuestNotes);
  }

  bootGuestNotes();
}

export function initGuestNotes(
  initialNotes: GuestNote[] = [],
  initialLabels: GuestNotesLabels = labels,
) {
  const form = document.getElementById("guest-notes-form");

  labels = initialLabels;
  bindEditDialog();
  bindNoteActions();

  if (!form || form.dataset.bound === "true") {
    if (notes.length === 0) notes = initialNotes;
    renderNotes();
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
      const created = await createNotedMessageClient({
        name,
        description: message,
        provider,
      });
      const mapped = mapNotedMessage(created);

      setOwnedNoteId(mapped.id);
      notes = [mapped, ...notes];
      nameInput.value = "";
      providerInput.value = "website";
      messageInput.value = "";
      if (countEl) countEl.textContent = "0/280";
      renderNotes();
      toast.success("Catatan terkirim", "Terima kasih sudah meninggalkan pesan.");
      void refreshGuestNotes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal mengirim catatan. Coba lagi.";
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
      toast.error("Gagal mengirim", message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  renderNotes();
}
