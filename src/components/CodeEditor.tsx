'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppState } from '../contexts/AppStateContext';

interface CodeEditorProps {
  className?: string;
}

export function CodeEditor({ className = '' }: CodeEditorProps) {
  const { state, updateCode } = useAppState();
  const editorRef = useRef<any>(null);
  const lastCodeRef = useRef<string>('');

  useEffect(() => {
    if (editorRef.current && state.currentCode !== lastCodeRef.current) {
      const editor = editorRef.current;
      const currentValue = editor.getValue();
      
      if (currentValue !== state.currentCode) {
        const position = editor.getPosition();
        editor.setValue(state.currentCode);
        
        if (position && state.currentCode.length > 0) {
          try {
            editor.setPosition(position);
          } catch (error) {
            const lineCount = editor.getModel()?.getLineCount() || 1;
            const lastLineLength = editor.getModel()?.getLineLength(lineCount) || 0;
            editor.setPosition({ lineNumber: lineCount, column: lastLineLength + 1 });
          }
        }
        
        editor.focus();
      }
      
      lastCodeRef.current = state.currentCode;
    }
  }, [state.currentCode]);

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

  const handleEditorClick = useCallback((e: any) => {
    if (e && e.target && e.target.position) {
      const clickPosition = e.target.position;
      console.debug('Editor clicked at position:', {
        lineNumber: clickPosition.lineNumber,
        column: clickPosition.column
      });
    }
  }, []);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    
    monaco.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          [/^#{1,6}\s.*$/, 'markup.heading'],
          [/\*\*([^*]|\*(?!\*))*\*\*/, 'markup.bold'],
          [/\*([^*]|\*\*)*\*/, 'markup.italic'],
          [/```[\s\S]*?```/, 'markup.code'],
          [/`[^`]*`/, 'markup.code'],
          [/\[([^\]]*)\]\(([^)]*)\)/, 'markup.underline'],
          [/^\s*[-*+]\s/, 'markup.list'],
          [/^\s*\d+\.\s/, 'markup.list'],
          [/^\s*>\s.*$/, 'markup.quote'],
        ]
      }
    });

    monaco.editor.defineTheme('markdown-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'markup.heading', foreground: '2563eb', fontStyle: 'bold' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'markup.code', foreground: 'dc2626', background: 'f3f4f6' },
        { token: 'markup.underline', foreground: '7c3aed' },
        { token: 'markup.list', foreground: '059669' },
        { token: 'markup.quote', foreground: '6b7280', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#374151',
        'editor.lineHighlightBackground': '#f9fafb',
        'editor.selectionBackground': '#dbeafe',
      }
    });

    monaco.editor.setTheme('markdown-theme');
    editor.onDidChangeCursorPosition(handleCursorPositionChange);
    editor.onMouseDown(handleEditorClick);
  }, [handleCursorPositionChange, handleEditorClick]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      updateCode(value);
    }
  }, [updateCode]);

  return (
    <div className={`h-full w-full ${className}`}>
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
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          automaticLayout: true,
          theme: 'markdown-theme',
          readOnly: false,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'always',
          multiCursorModifier: 'ctrlCmd',
          wordBasedSuggestions: 'off',
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
        }}
      />
    </div>
  );
}
