import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../AppStateContext';
import { ChatMessage } from '../../types';
import * as fc from 'fast-check';

// テスト用のラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('AppStateContext', () => {
  describe('useAppState hook', () => {
    it('should throw error when used outside provider', () => {
      // コンソールエラーを抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAppState());
      }).toThrow('useAppState must be used within an AppStateProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      expect(result.current.state).toEqual({
        chatHistory: [],
        currentCode: '',
        isLoading: false,
        error: null,
      });
    });
  });

  describe('State actions', () => {
    it('should add message to chat history', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const message: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.state.chatHistory).toHaveLength(1);
      expect(result.current.state.chatHistory[0]).toEqual(message);
      expect(result.current.state.error).toBeNull();
    });

    it('should clear chat history', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const message: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.state.chatHistory).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.state.chatHistory).toHaveLength(0);
      expect(result.current.state.error).toBeNull();
    });

    it('should update code', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const newCode = '# Hello World\n\nThis is a test.';

      act(() => {
        result.current.updateCode(newCode);
      });

      expect(result.current.state.currentCode).toBe(newCode);
      expect(result.current.state.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.state.isLoading).toBe(false);
    });

    it('should set error and stop loading', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.state.isLoading).toBe(true);

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.state.error).toBe('Test error message');
      expect(result.current.state.isLoading).toBe(false);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const message: ChatMessage = {
        id: 'test-1',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: new Date(),
      };

      act(() => {
        result.current.addMessage(message);
        result.current.updateCode('# Test Code');
        result.current.setLoading(true);
        result.current.setError('Test error');
      });

      // 状態が変更されていることを確認
      expect(result.current.state.chatHistory).toHaveLength(1);
      expect(result.current.state.currentCode).toBe('# Test Code');
      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.resetState();
      });

      // 初期状態に戻っていることを確認
      expect(result.current.state).toEqual({
        chatHistory: [],
        currentCode: '',
        isLoading: false,
        error: null,
      });
    });

    it('should limit chat history to 6 messages (3 turns)', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // 8つのメッセージを追加（制限を超える）
      for (let i = 0; i < 8; i++) {
        const message: ChatMessage = {
          id: `test-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
        };

        act(() => {
          result.current.addMessage(message);
        });
      }

      // 最新の6つのメッセージのみが保持されていることを確認
      expect(result.current.state.chatHistory).toHaveLength(6);
      expect(result.current.state.chatHistory[0].id).toBe('test-2');
      expect(result.current.state.chatHistory[5].id).toBe('test-7');
    });
  });

  describe('AppStateProvider', () => {
    it('should render children', () => {
      const TestChild = () => <div data-testid="test-child">Test Child</div>;
      
      const { getByTestId } = render(
        <AppStateProvider>
          <TestChild />
        </AppStateProvider>
      );

      expect(getByTestId('test-child')).toBeDefined();
    });
  });

  describe('Property-based tests with fast-check', () => {
    /**
     * **Feature: markdown-ai-canvas, Property 7: リアルタイム編集反映**
     * **Validates: Requirements 2.2**
     */
    it('should reflect real-time code editing changes', () => {
      fc.assert(fc.property(
        fc.string(),
        (codeContent) => {
          const { result } = renderHook(() => useAppState(), {
            wrapper: TestWrapper,
          });

          // Initial state should have empty code
          expect(result.current.state.currentCode).toBe('');

          // Update code and verify it's immediately reflected in state
          act(() => {
            result.current.updateCode(codeContent);
          });

          // The code should be immediately reflected in the application state
          expect(result.current.state.currentCode).toBe(codeContent);
          
          // Error should be cleared when code is updated
          expect(result.current.state.error).toBeNull();
          
          // Multiple updates should all be reflected immediately
          const secondContent = codeContent + '\n\n# Additional content';
          act(() => {
            result.current.updateCode(secondContent);
          });
          
          expect(result.current.state.currentCode).toBe(secondContent);
        }
      ), { numRuns: 10 });
    });
  });
});