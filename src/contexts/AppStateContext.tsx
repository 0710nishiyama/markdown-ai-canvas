'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, ChatMessage, limitChatHistory } from '../types';

/**
 * 状態更新のアクション定義
 */
export type AppStateAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_CODE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

/**
 * 初期状態
 */
const initialState: AppState = {
  chatHistory: [],
  currentCode: '',
  isLoading: false,
  error: null,
};

/**
 * 状態更新のReducer
 */
function appStateReducer(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      const newHistory = [...state.chatHistory, action.payload];
      return {
        ...state,
        chatHistory: limitChatHistory(newHistory), // 履歴制限を適用
        error: null, // メッセージ追加時にエラーをクリア
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        chatHistory: [],
        error: null,
      };

    case 'UPDATE_CODE':
      return {
        ...state,
        currentCode: action.payload,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false, // エラー時はローディングを停止
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

/**
 * Context型定義
 */
interface AppStateContextType {
  state: AppState;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
  updateCode: (code: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  // 統合機能の追加
  sendPromptAndUpdateCode: (prompt: string) => Promise<void>;
  clearAllData: () => void;
}

/**
 * AppStateContext作成
 */
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

/**
 * AppStateProvider Props
 */
interface AppStateProviderProps {
  children: ReactNode;
}

/**
 * AppStateProvider コンポーネント
 */
export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // アクション関数
  const addMessage = (message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const updateCode = (code: string) => {
    dispatch({ type: 'UPDATE_CODE', payload: code });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // 統合機能: プロンプト送信とコード更新を一括処理
  const sendPromptAndUpdateCode = async (prompt: string) => {
    if (!prompt.trim() || state.isLoading) {
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Import AI service dynamically to avoid circular dependencies
      const { getAIService, AIServiceError, resetAIService } = await import('../services/aiService');
      const { AI_CONFIG } = await import('../types');

      // AI Serviceインスタンスをリセット（最新の設定を反映）
      resetAIService();

      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      };

      // Add user message to history
      addMessage(userMessage);

      // Prepare AI request with context limit
      const aiService = getAIService();
      const contextMessages = [...state.chatHistory, userMessage].slice(-AI_CONFIG.contextLimit * 2);
      
      const aiRequest = {
        messages: contextMessages,
        temperature: AI_CONFIG.temperature,
        maxTokens: AI_CONFIG.maxTokens,
      };

      // Send request to AI API
      const response = await aiService.sendRequest(aiRequest);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      // Add assistant message to history
      addMessage(assistantMessage);

      // Update code editor with the response
      updateCode(response.content);

    } catch (error) {
      console.error('AI request failed:', error);
      
      // Dynamic import to avoid circular dependency
      const { AIServiceError } = await import('../services/aiService');
      
      let errorMessage = '予期しないエラーが発生しました。再試行してください。';
      
      if (error instanceof AIServiceError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 統合機能: 全データクリア
  const clearAllData = () => {
    clearHistory();
    updateCode('');
    setError(null);
    setLoading(false);
  };

  const contextValue: AppStateContextType = {
    state,
    addMessage,
    clearHistory,
    updateCode,
    setLoading,
    setError,
    resetState,
    sendPromptAndUpdateCode,
    clearAllData,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * AppStateContextを使用するためのカスタムフック
 */
export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}