'use client';

import React, { useRef, useCallback, useEffect } from 'react';
// import Editor from '@monaco-editor/react'; // 一時的にコメントアウト
import { useAppState } from '../contexts/AppStateContext';

/**
 * CodeEditor Props
 */
interface CodeEditorProps {
  className?: string;
}

/**
 * CodeEditor Component
 * Monaco Editorを統合したMarkdownコードエディタ
 * 要件: 2.1, 2.3, 1.2, 2.2
 */
export function CodeEditor({ className = '' }: CodeEditorProps) {
  const { state, updateCode } = useAppState();
  const editorRef = useRef<any>(null);
  const lastCodeRef = useRef<string>('');
  /**
   * AI応答の自動反映処理（要件1.2, 2.2対応）
   * コード内容の状態同期
   */
  useEffect(() => {
    if (editorRef.current && state.currentCode !== lastCodeRef.current) {
      const editor = editorRef.current;
      const currentValue = editor.getValue();
      
      // エディタの値と状態が異なる場合のみ更新
      if (currentValue !== state.currentCode) {
        // カーソル位置を保存
        const position = editor.getPosition();
        
        // エディタの値を更新
        editor.setValue(state.currentCode);
        
        // カーソル位置を復元（可能な場合）
        if (position && state.currentCode.length > 0) {
          try {
            editor.setPosition(position);
          } catch (error) {
            // カーソル位置の復元に失敗した場合は末尾に設定
            const lineCount = editor.getModel()?.getLineCount() || 1;
            const lastLineLength = editor.getModel()?.getLineLength(lineCount) || 0;
            editor.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
          }
        }
        
        // フォーカスを設定
        editor.focus();
      }
      
      lastCodeRef.current = state.currentCode;
    }
  }, [state.currentCode]);
  /**
   * カーソル位置変更時の処理（要件2.4対応）
   */
  const handleCursorPositionChange = useCallback((e: any) => {
    if (e && e.position) {
      const position = e.position;
      console.debug('Cursor position changed:', {
        lineNumber: position.lineNumber,
        column: position.column,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  /**
   * エディタクリック時の処理（要件2.4対応）
   */
  const handleEditorClick = useCallback((e: any) => {
    if (e && e.target && e.target.position) {
      const clickPosition = e.target.position;
      console.debug('Editor clicked at position:', {
        lineNumber: clickPosition.lineNumber,
        column: clickPosition.column
      });
    }
  }, []);
  /**
   * エディタのマウント時の処理（簡素化版）
   */
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // 基本的なイベントリスナーのみ追加
    editor.onDidChangeCursorPosition(handleCursorPositionChange);
    editor.onMouseDown(handleEditorClick);
  }, [handleCursorPositionChange, handleEditorClick]);
  /**
   * エディタの値変更時の処理
   */
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      updateCode(value);
    }
  }, [updateCode]);

  /**
   * プログラム的にカーソル位置を設定するメソッド（要件2.4対応）
   */
  const setCursorPosition = useCallback((lineNumber: number, column: number) => {
    if (editorRef.current) {
      try {
        const position = { lineNumber, column };
        editorRef.current.setPosition(position);
        editorRef.current.focus();
        console.debug('Cursor position set programmatically:', position);
        return true;
      } catch (error) {
        console.warn('Failed to set cursor position programmatically:', error);
        return false;
      }
    }
    return false;
  }, []);

  /**
   * 現在のカーソル位置を取得するメソッド
   */
  const getCursorPosition = useCallback(() => {
    if (editorRef.current) {
      try {
        const position = editorRef.current.getPosition();
        return position ? {
          lineNumber: position.lineNumber,
          column: position.column
        } : null;
      } catch (error) {
        console.warn('Failed to get cursor position:', error);
        return null;
      }
    }
    return null;
  }, []);
  // 外部からアクセス可能にするため、refに関数を設定
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setCursorPosition = setCursorPosition;
      editorRef.current.getCursorPosition = getCursorPosition;
    }
  }, [setCursorPosition, getCursorPosition]);

  return (
    <div className={`h-full w-full ${className}`}>
      {/* 一時的にtextareaを使用 */}
      <textarea
        className="w-full h-full p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={state.currentCode}
        onChange={(e) => updateCode(e.target.value)}
        placeholder="AIが生成したMarkdownコードがここに表示されます..."
        style={{
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      />
      {/* Monaco Editorは一時的にコメントアウト
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={state.currentCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          fontSize: 14,
          automaticLayout: true,
          readOnly: false,
        }}
      />
      */}
    </div>
  );
}