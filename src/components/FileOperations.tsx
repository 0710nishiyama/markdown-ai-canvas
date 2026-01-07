'use client';

import React, { useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useErrorHandling } from '../contexts/ErrorHandlingContext';
import { downloadMarkdownFile, copyToClipboard } from '../utils/fileOperations';

/**
 * FileOperations Props
 */
interface FileOperationsProps {
  className?: string;
}

/**
 * FileOperations Component
 * ファイル保存とクリップボードコピー機能を提供
 * 要件: 3.1, 3.2, 3.3
 */
export function FileOperations({ className = '' }: FileOperationsProps) {
  const { state } = useAppState();
  const { showFileSuccess, showFileError } = useErrorHandling();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  /**
   * ファイル保存処理
   * 要件: 3.1, 3.2 - .mdファイルダウンロード機能、タイムスタンプ付きファイル名生成
   */
  const handleSaveFile = useCallback(async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const success = downloadMarkdownFile(state.currentCode);
      
      if (success) {
        showFileSuccess('保存', 'ファイルが正常に保存されました');
      } else {
        showFileError('保存', 'ファイルの保存に失敗しました');
      }
    } catch (error) {
      console.error('Save file error:', error);
      showFileError('保存', error instanceof Error ? error.message : 'ファイルの保存に失敗しました');
    } finally {
      setIsDownloading(false);
    }
  }, [state.currentCode, isDownloading, showFileSuccess, showFileError]);

  /**
   * クリップボードコピー処理
   * 要件: 3.3 - コード内容のクリップボードコピー、コピー成功/失敗の通知
   */
  const handleCopyToClipboard = useCallback(async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    
    try {
      const success = await copyToClipboard(state.currentCode);
      
      if (success) {
        showFileSuccess('コピー', 'クリップボードにコピーしました');
      } else {
        showFileError('コピー', 'クリップボードへのコピーに失敗しました');
      }
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      showFileError('コピー', error instanceof Error ? error.message : 'クリップボードへのコピーに失敗しました');
    } finally {
      setIsCopying(false);
    }
  }, [state.currentCode, isCopying, showFileSuccess, showFileError]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ファイル操作ボタン */}
      <div className="flex gap-2">
        {/* 保存ボタン */}
        <button
          onClick={handleSaveFile}
          disabled={isDownloading || !state.currentCode.trim()}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors duration-200
            ${isDownloading || !state.currentCode.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
          title="Markdownファイルとして保存"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              保存
            </>
          )}
        </button>

        {/* コピーボタン */}
        <button
          onClick={handleCopyToClipboard}
          disabled={isCopying || !state.currentCode.trim()}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors duration-200
            ${isCopying || !state.currentCode.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
            }
          `}
          title="クリップボードにコピー"
        >
          {isCopying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              コピー中...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              コピー
            </>
          )}
        </button>
      </div>
    </div>
  );
}