interface AgentChatSession {
  messages: AgentChatMessage[];
  sessionCategory?: AgentPromptCategory | null;
  updatedAt: string;
}
