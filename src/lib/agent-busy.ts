export function setAgentBusy(busy: boolean): void {
  document.dispatchEvent(
    new CustomEvent("agent:busy", {
      detail: { busy },
    }),
  );
}

export function isAgentBusy(): boolean {
  return document.documentElement.classList.contains("agent-is-busy");
}
