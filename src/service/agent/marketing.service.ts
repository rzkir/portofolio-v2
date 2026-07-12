
import {
    buildPromptHistory,
    sendAgentPrompt,
} from "@/service/agent.service";
import { setAgentBusy } from "@/lib/agent-busy";
import { createAgentChatHistoryController } from "@/service/agent/chat-history.controller";
import {
  getAgentErrorMessage,
  renderAgentAssistantMessage,
  renderAgentLoading,
  renderAgentUserMessage,
} from "@/lib/agent-chat-ui";

export const MARKETING_AGENT_CATEGORY: AgentPromptCategory = "marketing";
const CHAT_STORAGE_KEY = "marketing";


function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function createMarketingAgentController(root: ParentNode): () => void {
    const form = root.querySelector<HTMLFormElement>("#agent-prompt-form");
    const input = root.querySelector<HTMLInputElement>("#main-prompt-input");
    const sendBtn = root.querySelector<HTMLButtonElement>("#main-prompt-input-send");
    const categoryInput = form?.elements.namedItem("category") as
        | HTMLInputElement
        | null;
    const thread = root.querySelector<HTMLElement>("#agent-thread");
    const messagesViewport = root.querySelector<HTMLElement>("#agent-messages");
    const emptyState = root.querySelector<HTMLElement>("#agent-empty-state");
    const errorEl = root.querySelector<HTMLElement>("#agent-error");

    const chatMessages: AgentChatMessage[] = [];
    let isSubmitting = false;
    let sessionCategory: AgentPromptCategory | null = MARKETING_AGENT_CATEGORY;

    function scrollToBottom() {
        if (!messagesViewport) return;
        messagesViewport.scrollTop = messagesViewport.scrollHeight;
    }

    function setLoading(loading: boolean) {
        isSubmitting = loading;
        setAgentBusy(loading);
        if (input) input.disabled = loading;
        if (sendBtn) sendBtn.disabled = loading;
    }

    function showError(message: string) {
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
    }

    function clearError() {
        if (!errorEl) return;
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
    }

    function applyCategoryPreset(prompt: string) {
        if (categoryInput) categoryInput.value = MARKETING_AGENT_CATEGORY;
        if (!input) return;

        input.value = prompt;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        clearError();
    }

    function onCategoryCardClick(event: Event) {
        const trigger = event.currentTarget as HTMLButtonElement | null;
        if (!trigger) return;

        const prompt = trigger.dataset.agentPrompt?.trim();
        if (!prompt) return;

        applyCategoryPreset(prompt);
    }




    function appendDivider() {
        if (!thread) return null;
        const divider = document.createElement("div");
        divider.className = "agent-gradient-divider";
        divider.dataset.messageDivider = "true";
        thread.appendChild(divider);
        return divider;
    }

    function appendMessageNode(node: HTMLElement) {
        if (!thread) return;
        emptyState?.classList.add("hidden");
        thread.appendChild(node);
        scrollToBottom();
    }

    function removeLoading() {
        root.querySelector("#agent-loading")?.remove();
    }

    function clearThreadUi() {
        if (!thread) return;

        thread
            .querySelectorAll(
                "[data-message-role], [data-message-divider], #agent-loading",
            )
            .forEach((node) => node.remove());
        emptyState?.classList.remove("hidden");
        clearError();
    }

    function renderStoredMessages() {
        if (chatMessages.length === 0) return;

        chatMessages.forEach((message, index) => {
            if (message.role === "user") {
                appendMessageNode(renderAgentUserMessage(message));
                const next = chatMessages[index + 1];
                if (next?.role === "assistant") {
                    appendDivider();
                }
                return;
            }

            if (message.role === "assistant") {
                appendMessageNode(renderAssistantMessage(message));
            }
        });
    }

    const chatHistory = createAgentChatHistoryController({
        storageKey: CHAT_STORAGE_KEY,
        defaultCategory: MARKETING_AGENT_CATEGORY,
        chatMessages,
        getSessionCategory: () => sessionCategory,
        setSessionCategory: (category) => {
            sessionCategory = category;
        },
        setCategoryInputValue: (category) => {
            if (categoryInput) categoryInput.value = category;
        },
        clearThreadUi,
        renderStoredMessages,
        scrollToBottom,
        focusInput: () => input?.focus(),
    });

    function persistChat() {
        chatHistory.persist();
    }

    async function onFormSubmit(event: Event) {
        event.preventDefault();
        if (isSubmitting || !input?.value.trim() || !thread) return;

        clearError();

        const message = input.value.trim();
        if (categoryInput) categoryInput.value = MARKETING_AGENT_CATEGORY;

        const userMessage: AgentChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: message,
            sentAt: new Date().toISOString(),
        };

        chatMessages.push(userMessage);
        persistChat();
        const userNode = renderAgentUserMessage(userMessage);
        appendMessageNode(userNode);
        const divider = appendDivider();
        const loadingNode = renderAgentLoading();
        appendMessageNode(loadingNode);

        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        setLoading(true);

        try {
            const history = buildPromptHistory(chatMessages.slice(0, -1));
            const response = await sendAgentPrompt({
                message,
                category: MARKETING_AGENT_CATEGORY,
                history: history.length > 0 ? history : undefined,
            });

            removeLoading();

            const assistantMessage: AgentChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: response.reply,
                sentAt: new Date().toISOString(),
                model: response.model,
                category: response.category,
            };

            chatMessages.push(assistantMessage);
            sessionCategory = response.category;
            persistChat();
            appendMessageNode(renderAgentAssistantMessage(assistantMessage));
        } catch (error) {
            removeLoading();
            chatMessages.pop();
            persistChat();
            userNode.remove();
            divider?.remove();
            input.value = message;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            if (chatMessages.length === 0) {
                emptyState?.classList.remove("hidden");
            }
            showError(getAgentErrorMessage(error));
        } finally {
            setLoading(false);
            input.focus();
        }
    }

    renderStoredMessages();
    const cleanupHistory = chatHistory.bind();

    const categoryCards = root.querySelectorAll<HTMLButtonElement>(
        "[data-agent-category]",
    );
    categoryCards.forEach((card) => {
        card.addEventListener("click", onCategoryCardClick);
    });

    form?.addEventListener("submit", onFormSubmit);

    return () => {
        cleanupHistory();
        categoryCards.forEach((card) => {
            card.removeEventListener("click", onCategoryCardClick);
        });
        form?.removeEventListener("submit", onFormSubmit);
    };
}

function mountMarketingAgent(root: ParentNode = document): void {
    const shell = root.querySelector<HTMLElement>(".agent-shell");
    if (!shell || shell.dataset.bound === "true") return;

    shell.dataset.bound = "true";

    const cleanup = createMarketingAgentController(root);

    document.addEventListener(
        "astro:before-preparation",
        () => {
            cleanup();
            shell.dataset.bound = "false";
        },
        { once: true },
    );
}

export function bindMarketingAgent(root: ParentNode = document): void {
    mountMarketingAgent(root);
    document.addEventListener("astro:page-load", () =>
        mountMarketingAgent(document),
    );
}
