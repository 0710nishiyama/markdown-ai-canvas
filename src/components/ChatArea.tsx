'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';

/**
 * ChatArea Props
 */
interface ChatAreaProps {
  className?: string;
}

/**
 * ChatArea Component
 * Requirements: 1.3, 1.5, 4.3, 1.1, 5.5
 */
export function ChatArea({ className = '' }: ChatAreaProps) {
  const { state, clearHistory, updateCode, setError, sendPromptAndUpdateCode, clearAllData } = useAppState();
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [state.chatHistory]);

  // Focus input field on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  /**
   * Handle prompt submission
   * Requirements: 1.1, 1.5, 5.5
   * 統合機能を使用してプロンプト送信とコード更新を一括処理
   */
  const handleSubmit = async () => {
    const prompt = inputValue.trim();
    if (!prompt || state.isLoading) {
      return;
    }

    // Clear input immediately
    setInputValue('');
    
    // Use integrated function for prompt submission and code update
    await sendPromptAndUpdateCode(prompt);
  };

  /**
   * Handle Enter key press
   * Requirements: 1.5
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Handle log clear
   * Requirements: 4.3
   * 統合機能を使用して全データをクリア
   */
  const handleClearHistory = () => {
    clearAllData();
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">AI Chat</h2>
          <button
            onClick={handleClearHistory}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="チャット履歴をクリア"
          >
            ログクリア
          </button>
        </div>
      </div>

      {/* Chat History Area */}
      <div 
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {state.chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>AIとチャットを開始してください</p>
            <p className="text-sm mt-2">プロンプトを入力してEnterキーまたは送信ボタンを押してください</p>
          </div>
        ) : (
          state.chatHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {state.isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-gray-600">AIが応答を生成中...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="flex-shrink-0 p-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 text-red-500">⚠</div>
              <span className="text-red-700 text-sm">{state.error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="プロンプトを入力してください... (Enterで送信、Shift+Enterで改行)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={state.isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || state.isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state.isLoading ? '送信中...' : '送信'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Enterで送信、Shift+Enterで改行
        </div>
      </div>
    </div>
  );
}