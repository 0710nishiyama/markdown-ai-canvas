'use client';

import React, { useState, useEffect } from 'react';
import { AppStateProvider, useAppState } from '../../contexts/AppStateContext';
import { ErrorHandlingProvider, globalErrorHandler } from '../../contexts/ErrorHandlingContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ChatArea, CodeEditor, FileOperations } from '../../components';

/**
 * Canvas Page Content Component
 * 内部コンポーネント（AppStateProvider内で使用）
 */
function CanvasPageContent() {
  const { resetState, clearAllData, updateCode } = useAppState();
  const [leftWidth, setLeftWidth] = useState(50); // 左側エリアの幅（%）
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState<'chat' | 'editor'>('chat'); // モバイル用

  /**
   * レスポンシブデザイン対応
   * 要件: 4.4 - 画面サイズ変更時の適切な調整
   */
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile && leftWidth !== 50) {
        setLeftWidth(50); // モバイルでは50/50に戻す
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [leftWidth]);

  /**
   * トップボタンクリック処理
   * 要件: 4.2 - 画面リセット機能
   */
  const handleTopClick = () => {
    resetState();
    window.location.href = '/';
  };

  /**
   * ログクリアボタンクリック処理
   * 要件: 4.3 - チャット履歴削除機能
   * 統合機能を使用して全データをクリア
   */
  const handleLogClear = () => {
    clearAllData();
  };

  /**
   * リサイザーのドラッグ処理
   * 要件: 4.1, 4.4 - 左右エリアのサイズ管理
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // モバイルではリサイズ無効
    
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = leftWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));
      setLeftWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  /**
   * モバイル用パネル切り替え
   */
  const handlePanelSwitch = (panel: 'chat' | 'editor') => {
    setActivePanel(panel);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Markdown AI Canvas
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogClear}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="ログクリア"
            >
              ログクリア
            </button>
            <button
              onClick={handleTopClick}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="トップページに戻る"
            >
              トップ
            </button>
          </div>
        </div>
      </header>

      {/* モバイル用タブナビゲーション */}
      {isMobile && (
        <div className="bg-white border-b border-gray-200 flex">
          <button
            onClick={() => handlePanelSwitch('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activePanel === 'chat'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            チャット
          </button>
          <button
            onClick={() => handlePanelSwitch('editor')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activePanel === 'editor'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            エディタ
          </button>
        </div>
      )}

      {/* メインコンテンツ - 2カラムレイアウト */}
      <main className={`${isMobile ? 'block' : 'flex'} h-[calc(100vh-${isMobile ? '112px' : '64px'})] relative`}>
        {/* デスクトップ用レイアウト */}
        {!isMobile ? (
          <>
            {/* 左側: チャットエリア */}
            <div 
              className="bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-200 ease-in-out"
              style={{ width: `${leftWidth}%` }}
            >
              <ChatArea className="h-full" />
            </div>

            {/* リサイザー */}
            <div
              className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0 transition-colors duration-150"
              onMouseDown={handleMouseDown}
              title="ドラッグして左右のサイズを調整"
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
              </div>
            </div>

            {/* 右側: コードエディタエリア */}
            <div 
              className="bg-white flex flex-col flex-shrink-0 transition-all duration-200 ease-in-out"
              style={{ width: `${100 - leftWidth - 0.1}%` }}
            >
              {/* ファイル操作ボタン */}
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <FileOperations />
              </div>
              
              {/* コードエディタ */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor className="h-full w-full" />
              </div>
            </div>
          </>
        ) : (
          /* モバイル用レイアウト */
          <>
            {/* チャットパネル */}
            <div className={`${activePanel === 'chat' ? 'block' : 'hidden'} h-full bg-white`}>
              <ChatArea className="h-full" />
            </div>

            {/* エディタパネル */}
            <div className={`${activePanel === 'editor' ? 'flex flex-col' : 'hidden'} h-full bg-white`}>
              {/* ファイル操作ボタン */}
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <FileOperations />
              </div>
              
              {/* コードエディタ */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor className="h-full w-full" />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Canvas Page Component
 * AIとのチャットとMarkdownコード編集を行うメイン画面
 * 要件: 4.1, 4.4 - 2カラムレイアウト、レスポンシブデザイン
 * 要件: 4.2, 4.3 - ナビゲーション機能
 * 要件: 5.2 - エラーハンドリングシステム
 */
export default function CanvasPage() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        globalErrorHandler.handleError(error, 'Canvas Page');
      }}
    >
      <ErrorHandlingProvider>
        <AppStateProvider>
          <CanvasPageContent />
        </AppStateProvider>
      </ErrorHandlingProvider>
    </ErrorBoundary>
  );
}