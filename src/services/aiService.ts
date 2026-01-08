/**
 * AI API Service
 * Handles communication with OpenAI API and Gemini API
 * Requirements: 1.1, 5.1, 5.2, 5.3
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIApiRequest, AIApiResponse, ChatMessage, AI_CONFIG } from '../types';

/**
 * AI API Provider types
 */
export type AIProvider = 'openai' | 'gemini';

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  timeout?: number;
}

/**
 * Custom error types for AI API
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * AI API Service class
 */
export class AIService {
  private openaiClient?: OpenAI;
  private geminiClient?: GoogleGenerativeAI;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || AI_CONFIG.timeout
    };

    this.initializeClients();
  }

  /**
   * Initialize API clients based on provider
   */
  private initializeClients(): void {
    try {
      if (this.config.provider === 'openai') {
        this.openaiClient = new OpenAI({
          apiKey: this.config.apiKey,
          dangerouslyAllowBrowser: true // For client-side usage
        });
      } else if (this.config.provider === 'gemini') {
        this.geminiClient = new GoogleGenerativeAI(this.config.apiKey);
      }
    } catch (error) {
      throw new AIServiceError(
        'API認証に失敗しました。設定を確認してください。',
        'AUTH_ERROR',
        error as Error
      );
    }
  }

  /**
   * Send request to AI API via Next.js API route
   * Requirements: 1.1, 5.1, 5.3
   */
  async sendRequest(request: AIApiRequest): Promise<AIApiResponse> {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AIServiceError(
            'リクエストがタイムアウトしました。再試行してください。',
            'TIMEOUT_ERROR'
          ));
        }, this.config.timeout);
      });

      // Create API request promise via Next.js API route
      const apiPromise = this.sendAPIRouteRequest(request);

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);
      return response;

    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send request via Next.js API route
   */
  private async sendAPIRouteRequest(request: AIApiRequest): Promise<AIApiResponse> {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages,
        provider: this.config.provider,
        apiKey: this.config.apiKey,
        temperature: request.temperature,
        maxTokens: request.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      
      // 開発環境では詳細なエラー情報をログ出力
      if (process.env.NODE_ENV === 'development') {
        console.error('AI API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
      }
      
      if (response.status === 401) {
        throw new AIServiceError(errorMessage, 'AUTH_ERROR');
      } else if (response.status === 429) {
        throw new AIServiceError(errorMessage, 'RATE_LIMIT');
      } else if (response.status === 402) {
        throw new AIServiceError(errorMessage, 'QUOTA_EXCEEDED');
      } else if (response.status >= 500) {
        throw new AIServiceError(errorMessage, 'SERVER_ERROR');
      } else {
        throw new AIServiceError(errorMessage, 'API_ERROR');
      }
    }

    const data = await response.json();
    return data;
  }

  /*
  // 以下のメソッドは直接API呼び出し用（現在は使用されていません）
  // API Routeを使用するため、コメントアウト

  /**
   * Send request to OpenAI API
   */
  /*
  private async sendOpenAIRequest(request: AIApiRequest): Promise<AIApiResponse> {
    if (!this.openaiClient) {
      throw new AIServiceError(
        'OpenAI クライアントが初期化されていません。',
        'CLIENT_ERROR'
      );
    }

    try {
      const messages = request.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: request.temperature,
        max_tokens: request.maxTokens
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new AIServiceError(
          'AI APIから有効な応答を受信できませんでした。',
          'INVALID_RESPONSE'
        );
      }

      return {
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens
        } : undefined
      };

    } catch (error: any) {
      if (error.status === 429) {
        throw new AIServiceError(
          'リクエスト制限に達しました。しばらく待ってから再試行してください。',
          'RATE_LIMIT_ERROR',
          error
        );
      }
      throw error;
    }
  }
  */

  /**
   * Send request to Gemini API
   */
  /*
  private async sendGeminiRequest(request: AIApiRequest): Promise<AIApiResponse> {
    if (!this.geminiClient) {
      throw new AIServiceError(
        'Gemini クライアントが初期化されていません。',
        'CLIENT_ERROR'
      );
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens
        }
      });

      // Convert chat history to Gemini format
      const history = request.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = request.messages[request.messages.length - 1];
      
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      
      const content = response.text();
      if (!content) {
        throw new AIServiceError(
          'AI APIから有効な応答を受信できませんでした。',
          'INVALID_RESPONSE'
        );
      }

      return {
        content,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0
        } : undefined
      };

    } catch (error: any) {
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new AIServiceError(
          'リクエスト制限に達しました。しばらく待ってから再試行してください。',
          'RATE_LIMIT_ERROR',
          error
        );
      }
      throw error;
    }
  }
  */

  /**
   * Handle and transform errors
   * Requirements: 5.2
   */
  private handleError(error: any): AIServiceError {
    // 開発環境では詳細なエラー情報をログ出力
    console.error('AI Service Error Details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      stack: error.stack,
      originalError: error
    });

    if (error instanceof AIServiceError) {
      return error;
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
        error.message?.includes('network') || error.message?.includes('fetch')) {
      return new AIServiceError(
        '接続に失敗しました。ネットワーク接続を確認してください。',
        'NETWORK_ERROR',
        error
      );
    }

    // Authentication errors
    if (error.status === 401 || error.message?.includes('authentication') || 
        error.message?.includes('api key')) {
      return new AIServiceError(
        'API認証に失敗しました。設定を確認してください。',
        'AUTH_ERROR',
        error
      );
    }

    // Rate limit errors
    if (error.status === 429 || error.message?.includes('rate limit') || 
        error.message?.includes('quota')) {
      return new AIServiceError(
        'リクエスト制限に達しました。しばらく待ってから再試行してください。',
        'RATE_LIMIT_ERROR',
        error
      );
    }

    // 開発環境では元のエラーメッセージを含める
    const errorMessage = process.env.NODE_ENV === 'development' && error.message
      ? `AI APIエラー: ${error.message}`
      : 'AI APIでエラーが発生しました。再試行してください。';

    // Generic error
    return new AIServiceError(
      errorMessage,
      'API_ERROR',
      error
    );
  }

  /**
   * Get current provider
   */
  getProvider(): AIProvider {
    return this.config.provider;
  }

  /**
   * Update API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.initializeClients();
  }

  /**
   * Switch provider
   */
  switchProvider(provider: AIProvider, apiKey: string): void {
    this.config.provider = provider;
    this.config.apiKey = apiKey;
    this.initializeClients();
  }
}

/**
 * Create AI service instance with dynamic API key support
 */
export function createAIService(): AIService {
  // Try to get API keys from localStorage first (client-side)
  let openaiKey: string | undefined;
  let geminiKey: string | undefined;
  let savedProvider: AIProvider | undefined;

  if (typeof window !== 'undefined') {
    // Client-side: check localStorage
    try {
      openaiKey = localStorage.getItem('openai_api_key') || undefined;
      geminiKey = localStorage.getItem('gemini_api_key') || undefined;
      savedProvider = (localStorage.getItem('ai_provider') as AIProvider) || undefined;
      
      console.log('Loading API keys from localStorage:', {
        hasOpenAI: !!openaiKey,
        hasGemini: !!geminiKey,
        savedProvider,
        openaiPrefix: openaiKey ? openaiKey.substring(0, 8) + '...' : 'none',
        geminiPrefix: geminiKey ? geminiKey.substring(0, 8) + '...' : 'none'
      });
      
      // Also check dynamic window variables (set by ApiKeySettings)
      openaiKey = openaiKey || (window as any).__NEXT_PUBLIC_OPENAI_API_KEY;
      geminiKey = geminiKey || (window as any).__NEXT_PUBLIC_GEMINI_API_KEY;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
  }

  // Fallback to environment variables
  openaiKey = openaiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  geminiKey = geminiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Determine which provider to use
  let provider: AIProvider;
  let apiKey: string;

  if (savedProvider && 
      ((savedProvider === 'openai' && openaiKey) || 
       (savedProvider === 'gemini' && geminiKey))) {
    // Use saved provider if available
    provider = savedProvider;
    apiKey = savedProvider === 'openai' ? openaiKey! : geminiKey!;
    console.log(`Using saved provider: ${provider}`);
  } else if (openaiKey) {
    // Default to OpenAI if available
    provider = 'openai';
    apiKey = openaiKey;
    console.log('Using OpenAI as default provider');
  } else if (geminiKey) {
    // Use Gemini as fallback
    provider = 'gemini';
    apiKey = geminiKey;
    console.log('Using Gemini as fallback provider');
  } else {
    console.error('No API keys found');
    throw new AIServiceError(
      'API キーが設定されていません。設定画面からAPIキーを入力してください。',
      'CONFIG_ERROR'
    );
  }

  console.log(`Creating AI service with provider: ${provider}`);
  return new AIService({ provider, apiKey });
}

/**
 * Default AI service instance
 */
let defaultAIService: AIService | null = null;

/**
 * Get or create default AI service instance
 */
export function getAIService(): AIService {
  // 毎回新しいインスタンスを作成（ローカルストレージの最新値を反映）
  try {
    defaultAIService = createAIService();
    return defaultAIService;
  } catch (error) {
    console.error('Failed to create AI service:', error);
    throw error;
  }
}

/**
 * Reset AI service instance (for API key changes)
 */
export function resetAIService(): void {
  defaultAIService = null;
}