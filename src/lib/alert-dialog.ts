let openAlertCount = 0;
let openHandlerBound = false;
let pageLoadBound = false;

function lockAlertScroll() {
  openAlertCount += 1;
  document.documentElement.classList.add("alert-dialog-open");
}

function unlockAlertScroll() {
  openAlertCount = Math.max(0, openAlertCount - 1);
  if (openAlertCount === 0) {
    document.documentElement.classList.remove("alert-dialog-open");
  }
}

function closeAlertDialog(dialog: HTMLDialogElement) {
  if (dialog.open) dialog.close();
}

function setAlertDialogLoading(dialog: HTMLDialogElement, loading: boolean) {
  const overlay = dialog.querySelector("[data-alert-dialog-loading]");
  const actions = dialog.querySelector("[data-alert-dialog-actions]");
  const buttons = dialog.querySelectorAll("button");

  overlay?.classList.toggle("hidden", !loading);
  overlay?.classList.toggle("flex", loading);
  overlay?.setAttribute("aria-hidden", loading ? "false" : "true");
  actions?.classList.toggle("invisible", loading);

  buttons.forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = loading;
    }
  });
}

export function initAlertDialogs() {
  document.querySelectorAll("dialog[data-alert-dialog]").forEach((el) => {
    if (!(el instanceof HTMLDialogElement)) return;
    if (el.dataset.alertDialogInit) return;
    el.dataset.alertDialogInit = "true";

    el.addEventListener("close", () => {
      setAlertDialogLoading(el, false);
      delete el.dataset.alertDialogConfirming;
      unlockAlertScroll();
    });

    el.addEventListener("click", (event) => {
      if (event.target === el) closeAlertDialog(el);
    });

    el.querySelectorAll("[data-alert-dialog-cancel]").forEach((btn) => {
      btn.addEventListener("click", () => closeAlertDialog(el));
    });
  });
}

function handleAlertDialogOpen(
  event: CustomEvent<{ id: string; onConfirm?: () => void | Promise<void> }>,
) {
  const dialog = document.getElementById(event.detail.id);
  if (!(dialog instanceof HTMLDialogElement)) return;

  const onConfirm = event.detail.onConfirm;
  const confirmBtn = dialog.querySelector("[data-alert-dialog-confirm]");

  const handleConfirm = async () => {
    if (dialog.dataset.alertDialogConfirming === "true") return;

    if (!onConfirm) {
      closeAlertDialog(dialog);
      return;
    }

    const result = onConfirm();

    if (!(result instanceof Promise)) {
      closeAlertDialog(dialog);
      return;
    }

    dialog.dataset.alertDialogConfirming = "true";
    setAlertDialogLoading(dialog, true);

    try {
      await result;
      closeAlertDialog(dialog);
    } catch {
      setAlertDialogLoading(dialog, false);
      delete dialog.dataset.alertDialogConfirming;
    }
  };

  if (confirmBtn instanceof HTMLButtonElement) {
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    const freshConfirmBtn = dialog.querySelector("[data-alert-dialog-confirm]");
    freshConfirmBtn?.addEventListener("click", handleConfirm, { once: true });
  }

  if (!dialog.open) {
    dialog.showModal();
    lockAlertScroll();
  }
}

export function registerAlertDialogSystem() {
  if (!openHandlerBound) {
    openHandlerBound = true;
    document.addEventListener(
      "alert-dialog:open",
      handleAlertDialogOpen as EventListener,
    );
  }

  if (!pageLoadBound) {
    pageLoadBound = true;
    document.addEventListener("astro:page-load", initAlertDialogs);
  }

  initAlertDialogs();
}
