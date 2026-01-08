'use client';

import React, { useState, useEffect } from 'react';

/**
 * APIキー設定コンポーネント
 */
interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini'>('openai');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ローカルストレージからAPIキーを読み込み
  useEffect(() => {
    if (isOpen) {
      const savedOpenaiKey = localStorage.getItem('openai_api_key') || '';
      const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
      const savedProvider = localStorage.getItem('ai_provider') as 'openai' | 'gemini' || 'openai';
      
      console.log('Loading settings:', {
        hasOpenAI: !!savedOpenaiKey,
        hasGemini: !!savedGeminiKey,
        provider: savedProvider
      });
      
      setOpenaiKey(savedOpenaiKey);
      setGeminiKey(savedGeminiKey);
      setSelectedProvider(savedProvider);
      setMessage(null);
    }
  }, [isOpen]);

  // APIキーを保存
  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // 選択されたプロバイダーのキーが入力されているかチェック
      if (selectedProvider === 'openai' && !openaiKey.trim()) {
        throw new Error('OpenAI APIキーを入力してください');
      }
      if (selectedProvider === 'gemini' && !geminiKey.trim()) {
        throw new Error('Gemini APIキーを入力してください');
      }

      // APIキーの形式チェック
      if (selectedProvider === 'openai' && !openaiKey.trim().startsWith('sk-')) {
        throw new Error('OpenAI APIキーは "sk-" で始まる必要があります');
      }
      if (selectedProvider === 'gemini' && !geminiKey.trim().startsWith('AI')) {
        throw new Error('Gemini APIキーは "AI" で始まる必要があります');
      }

      // ローカルストレージに保存
      if (openaiKey.trim()) {
        localStorage.setItem('openai_api_key', openaiKey.trim());
      } else {
        localStorage.removeItem('openai_api_key');
      }

      if (geminiKey.trim()) {
        localStorage.setItem('gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('gemini_api_key');
      }

      localStorage.setItem('ai_provider', selectedProvider);

      // 環境変数を動的に設定（Next.jsのクライアントサイド用）
      if (selectedProvider === 'openai' && openaiKey.trim()) {
        (window as any).__NEXT_PUBLIC_OPENAI_API_KEY = openaiKey.trim();
      }
      if (selectedProvider === 'gemini' && geminiKey.trim()) {
        (window as any).__NEXT_PUBLIC_GEMINI_API_KEY = geminiKey.trim();
      }

      // AI Serviceインスタンスをリセット（次回使用時に新しい設定で作成される）
      try {
        // Dynamic import to avoid circular dependency
        const { resetAIService } = await import('../services/aiService');
        resetAIService();
        console.log('AI Service instance reset');
      } catch (error) {
        console.warn('Failed to reset AI service:', error);
      }

      setMessage({ type: 'success', text: 'APIキーが保存されました' });
      
      // 2秒後に自動で閉じる
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'APIキーの保存に失敗しました' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // APIキーをマスク表示
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">API設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* プロバイダー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              AIプロバイダー
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={selectedProvider === 'openai'}
                  onChange={(e) => setSelectedProvider(e.target.value as 'openai')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">OpenAI (GPT-4, GPT-3.5) - 推奨</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={selectedProvider === 'gemini'}
                  onChange={(e) => setSelectedProvider(e.target.value as 'gemini')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Google Gemini - 実験的</span>
              </label>
            </div>
          </div>

          {/* OpenAI APIキー */}
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI APIキー
              {selectedProvider === 'openai' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id="openai-key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {openaiKey && (
              <p className="mt-1 text-xs text-gray-500">
                保存済み: {maskApiKey(openaiKey)}
              </p>
            )}
          </div>

          {/* Gemini APIキー */}
          <div>
            <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-2">
              Gemini APIキー
              {selectedProvider === 'gemini' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id="gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AI..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {geminiKey && (
              <p className="mt-1 text-xs text-gray-500">
                保存済み: {maskApiKey(geminiKey)}
              </p>
            )}
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* 説明 */}
          <div className="text-xs text-gray-500 space-y-2">
            <p>• APIキーはブラウザのローカルストレージに保存されます</p>
            <p>• <strong>OpenAI推奨</strong>: より安定した動作が期待できます</p>
            <p>• OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://platform.openai.com/api-keys</a></p>
            <p>• Gemini: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://makersuite.google.com/app/apikey</a></p>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}