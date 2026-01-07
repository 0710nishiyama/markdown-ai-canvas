/**
 * Core TypeScript interfaces for Markdown AI Canvas
 * Based on design document specifications
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIApiRequest {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
}

export interface AIApiResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AppState {
  chatHistory: ChatMessage[];
  currentCode: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * AI Configuration constants
 */
export const AI_CONFIG = {
  temperature: 0.3,
  maxTokens: 2000,
  contextLimit: 3, // ターン数
  timeout: 30000 // 30秒
} as const;

/**
 * Data validation functions
 */

/**
 * ChatMessageの検証
 */
export function validateChatMessage(message: any): message is ChatMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.id === 'string' &&
    message.id.length > 0 &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.timestamp instanceof Date
  );
}

/**
 * AIApiRequestの検証
 */
export function validateAIApiRequest(request: any): request is AIApiRequest {
  return (
    typeof request === 'object' &&
    request !== null &&
    Array.isArray(request.messages) &&
    request.messages.length > 0 &&
    request.messages.every(validateChatMessage) &&
    typeof request.temperature === 'number' &&
    Number.isFinite(request.temperature) &&
    request.temperature >= 0 &&
    request.temperature <= 2 &&
    typeof request.maxTokens === 'number' &&
    Number.isInteger(request.maxTokens) &&
    request.maxTokens > 0
  );
}

/**
 * AIApiResponseの検証
 */
export function validateAIApiResponse(response: any): response is AIApiResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const hasValidUsage = !response.usage || (
    typeof response.usage === 'object' &&
    response.usage !== null &&
    typeof response.usage.promptTokens === 'number' &&
    Number.isInteger(response.usage.promptTokens) &&
    response.usage.promptTokens >= 0 &&
    typeof response.usage.completionTokens === 'number' &&
    Number.isInteger(response.usage.completionTokens) &&
    response.usage.completionTokens >= 0
  );

  return (
    typeof response.content === 'string' &&
    hasValidUsage
  );
}

/**
 * AppStateの検証
 */
export function validateAppState(state: any): state is AppState {
  return (
    typeof state === 'object' &&
    state !== null &&
    Array.isArray(state.chatHistory) &&
    state.chatHistory.every(validateChatMessage) &&
    typeof state.currentCode === 'string' &&
    typeof state.isLoading === 'boolean' &&
    (state.error === null || typeof state.error === 'string')
  );
}

/**
 * チャット履歴の制限チェック（要件1.4, 5.4対応）
 */
export function validateChatHistoryLimit(chatHistory: ChatMessage[]): boolean {
  return chatHistory.length <= AI_CONFIG.contextLimit * 2; // 3ターン = 6メッセージ
}

/**
 * チャット履歴を制限内に収める
 */
export function limitChatHistory(chatHistory: ChatMessage[]): ChatMessage[] {
  const maxMessages = AI_CONFIG.contextLimit * 2; // 3ターン = 6メッセージ
  if (chatHistory.length <= maxMessages) {
    return chatHistory;
  }
  return chatHistory.slice(-maxMessages);
}