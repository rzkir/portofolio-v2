type AgentPromptCategory =
  | "programming"
  | "technology"
  | "seo"
  | "marketing"
  | "customers_services"
  | "science"
  | "translation"
  | "legal"
  | "finance"
  | "health"
  | "trivia"
  | "academia"
  | "roleplay";

type AgentHistoryRole = "user" | "assistant";

interface AgentHistoryItem {
  role: AgentHistoryRole;
  content: string;
}

interface AgentPromptRequest {
  message: string;
  category: AgentPromptCategory;
  user_id?: string;
  history?: AgentHistoryItem[];
}

interface AgentPromptResponse {
  reply: string;
  model: string;
  category: AgentPromptCategory;
}

interface AgentApiError {
  error: string;
}

interface AgentChatMessage {
  id: string;
  role: AgentHistoryRole;
  content: string;
  sentAt: string;
  model?: string;
  category?: AgentPromptCategory;
}

interface AgentCodeBlock {
  language: string;
  code: string;
}

interface AgentWebPreviewFiles {
  html: string;
  css: string;
  js: string;
}

interface AgentWebPreview {
  title: string;
  language: string;
  source: string;
  document: string;
  files: AgentWebPreviewFiles;
}

interface AgentWebBuild {
  id: string;
  threadId?: string;
  title: string;
  prompt: string;
  category: AgentPromptCategory;
  model?: string;
  createdAt: string;
  preview: AgentWebPreview;
}
