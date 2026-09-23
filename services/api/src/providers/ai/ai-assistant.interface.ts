/**
 * Conversational travel assistant. A real implementation would call an LLM
 * (e.g. Claude via the Anthropic Messages API) with the marketplace context
 * and tool access to site/guide search.
 */
export const AI_ASSISTANT = Symbol('AI_ASSISTANT');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Marketplace data the assistant may ground its answer in. */
export interface AssistantContext {
  userName?: string;
  city?: { id: string; name: string; country: string } | null;
  sites: Array<{ id: string; name: string; category: string; city: string; description: string }>;
  guides: Array<{ id: string; name: string; rating: number; languages: string[]; cities: string[] }>;
}

export interface Suggestion {
  type: 'site' | 'guide';
  id: string;
  title: string;
}

export interface AssistantReply {
  reply: string;
  suggestions: Suggestion[];
  provider: string;
}

export interface AiAssistant {
  readonly name: string;
  chat(messages: ChatMessage[], context: AssistantContext): Promise<AssistantReply>;
}
