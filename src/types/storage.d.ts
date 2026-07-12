interface AgentChatSession {
  messages: AgentChatMessage[];
  sessionCategory?: AgentPromptCategory | null;
  updatedAt: string;
}

interface AgentChatThread {
  id: string;
  title: string;
  messages: AgentChatMessage[];
  sessionCategory?: AgentPromptCategory | null;
  createdAt: string;
  updatedAt: string;
}
