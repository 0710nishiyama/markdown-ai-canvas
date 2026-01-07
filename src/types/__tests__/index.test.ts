import { AI_CONFIG, validateChatMessage, validateAIApiRequest, validateAIApiResponse, validateAppState, validateChatHistoryLimit, limitChatHistory } from '../index';
import type { ChatMessage, AIApiRequest, AIApiResponse, AppState } from '../index';
import * as fc from 'fast-check';

describe('TypeScript Interfaces', () => {
  describe('AI_CONFIG', () => {
    it('should have correct configuration values', () => {
      expect(AI_CONFIG.temperature).toBe(0.3);
      expect(AI_CONFIG.maxTokens).toBe(2000);
      expect(AI_CONFIG.contextLimit).toBe(3);
      expect(AI_CONFIG.timeout).toBe(30000);
    });
  });

  describe('ChatMessage interface', () => {
    it('should accept valid ChatMessage objects', () => {
      const message: ChatMessage = {
        id: 'test-id',
        role: 'user',
        content: 'Hello, AI!',
        timestamp: new Date()
      };

      expect(message.id).toBe('test-id');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, AI!');
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('AIApiRequest interface', () => {
    it('should accept valid AIApiRequest objects', () => {
      const request: AIApiRequest = {
        messages: [{
          id: 'test-id',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }],
        temperature: 0.3,
        maxTokens: 2000
      };

      expect(request.messages).toHaveLength(1);
      expect(request.temperature).toBe(0.3);
      expect(request.maxTokens).toBe(2000);
    });
  });

  describe('AIApiResponse interface', () => {
    it('should accept valid AIApiResponse objects', () => {
      const response: AIApiResponse = {
        content: 'AI response content',
        usage: {
          promptTokens: 10,
          completionTokens: 20
        }
      };

      expect(response.content).toBe('AI response content');
      expect(response.usage?.promptTokens).toBe(10);
      expect(response.usage?.completionTokens).toBe(20);
    });

    it('should accept AIApiResponse without usage', () => {
      const response: AIApiResponse = {
        content: 'AI response content'
      };

      expect(response.content).toBe('AI response content');
      expect(response.usage).toBeUndefined();
    });
  });

  describe('AppState interface', () => {
    it('should accept valid AppState objects', () => {
      const state: AppState = {
        chatHistory: [{
          id: 'test-id',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }],
        currentCode: '# Hello World',
        isLoading: false,
        error: null
      };

      expect(state.chatHistory).toHaveLength(1);
      expect(state.currentCode).toBe('# Hello World');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // データ検証関数のテスト
  describe('Data validation functions', () => {
    describe('validateChatMessage', () => {
      it('should validate correct ChatMessage', () => {
        const validMessage: ChatMessage = {
          id: 'test-id',
          role: 'user',
          content: 'Hello',
          timestamp: new Date()
        };
        expect(validateChatMessage(validMessage)).toBe(true);
      });

      it('should reject invalid ChatMessage', () => {
        expect(validateChatMessage(null)).toBe(false);
        expect(validateChatMessage({})).toBe(false);
        expect(validateChatMessage({ id: '', role: 'user', content: 'test', timestamp: new Date() })).toBe(false);
        expect(validateChatMessage({ id: 'test', role: 'invalid', content: 'test', timestamp: new Date() })).toBe(false);
        expect(validateChatMessage({ id: 'test', role: 'user', content: 123, timestamp: new Date() })).toBe(false);
        expect(validateChatMessage({ id: 'test', role: 'user', content: 'test', timestamp: 'invalid' })).toBe(false);
      });
    });

    describe('validateAIApiRequest', () => {
      it('should validate correct AIApiRequest', () => {
        const validRequest: AIApiRequest = {
          messages: [{
            id: 'test-id',
            role: 'user',
            content: 'Hello',
            timestamp: new Date()
          }],
          temperature: 0.3,
          maxTokens: 2000
        };
        expect(validateAIApiRequest(validRequest)).toBe(true);
      });

      it('should reject invalid AIApiRequest', () => {
        expect(validateAIApiRequest(null)).toBe(false);
        expect(validateAIApiRequest({})).toBe(false);
        expect(validateAIApiRequest({ messages: [], temperature: 0.3, maxTokens: 2000 })).toBe(false);
        expect(validateAIApiRequest({ messages: [{}], temperature: 0.3, maxTokens: 2000 })).toBe(false);
        expect(validateAIApiRequest({ messages: [{ id: 'test', role: 'user', content: 'test', timestamp: new Date() }], temperature: -1, maxTokens: 2000 })).toBe(false);
        expect(validateAIApiRequest({ messages: [{ id: 'test', role: 'user', content: 'test', timestamp: new Date() }], temperature: 0.3, maxTokens: 0 })).toBe(false);
      });
    });

    describe('validateAIApiResponse', () => {
      it('should validate correct AIApiResponse', () => {
        const validResponse: AIApiResponse = {
          content: 'AI response',
          usage: {
            promptTokens: 10,
            completionTokens: 20
          }
        };
        expect(validateAIApiResponse(validResponse)).toBe(true);

        const validResponseWithoutUsage: AIApiResponse = {
          content: 'AI response'
        };
        expect(validateAIApiResponse(validResponseWithoutUsage)).toBe(true);
      });

      it('should reject invalid AIApiResponse', () => {
        expect(validateAIApiResponse(null)).toBe(false);
        expect(validateAIApiResponse({})).toBe(false);
        expect(validateAIApiResponse({ content: 123 })).toBe(false);
        expect(validateAIApiResponse({ content: 'test', usage: { promptTokens: -1, completionTokens: 20 } })).toBe(false);
        expect(validateAIApiResponse({ content: 'test', usage: { promptTokens: 10, completionTokens: 'invalid' } })).toBe(false);
      });
    });

    describe('validateAppState', () => {
      it('should validate correct AppState', () => {
        const validState: AppState = {
          chatHistory: [{
            id: 'test-id',
            role: 'user',
            content: 'Hello',
            timestamp: new Date()
          }],
          currentCode: '# Hello World',
          isLoading: false,
          error: null
        };
        expect(validateAppState(validState)).toBe(true);
      });

      it('should reject invalid AppState', () => {
        expect(validateAppState(null)).toBe(false);
        expect(validateAppState({})).toBe(false);
        expect(validateAppState({ chatHistory: 'invalid', currentCode: '', isLoading: false, error: null })).toBe(false);
        expect(validateAppState({ chatHistory: [{}], currentCode: '', isLoading: false, error: null })).toBe(false);
        expect(validateAppState({ chatHistory: [], currentCode: 123, isLoading: false, error: null })).toBe(false);
        expect(validateAppState({ chatHistory: [], currentCode: '', isLoading: 'invalid', error: null })).toBe(false);
        expect(validateAppState({ chatHistory: [], currentCode: '', isLoading: false, error: 123 })).toBe(false);
      });
    });

    describe('validateChatHistoryLimit', () => {
      it('should validate chat history within limit', () => {
        const messages: ChatMessage[] = [
          { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: '2', role: 'assistant', content: 'Hi', timestamp: new Date() }
        ];
        expect(validateChatHistoryLimit(messages)).toBe(true);
      });

      it('should reject chat history exceeding limit', () => {
        const messages: ChatMessage[] = Array.from({ length: 7 }, (_, i) => ({
          id: `${i}`,
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: `Message ${i}`,
          timestamp: new Date()
        }));
        expect(validateChatHistoryLimit(messages)).toBe(false);
      });
    });

    describe('limitChatHistory', () => {
      it('should keep messages within limit unchanged', () => {
        const messages: ChatMessage[] = [
          { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
          { id: '2', role: 'assistant', content: 'Hi', timestamp: new Date() }
        ];
        expect(limitChatHistory(messages)).toEqual(messages);
      });

      it('should trim messages exceeding limit', () => {
        const messages: ChatMessage[] = Array.from({ length: 8 }, (_, i) => ({
          id: `${i}`,
          role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
          content: `Message ${i}`,
          timestamp: new Date()
        }));
        const limited = limitChatHistory(messages);
        expect(limited).toHaveLength(6);
        expect(limited[0].id).toBe('2'); // 最初の2つのメッセージが削除される
        expect(limited[5].id).toBe('7');
      });
    });
  });

  // fast-check property-based tests
  describe('Property-based tests with fast-check', () => {
    /**
     * **Feature: markdown-ai-canvas, Property 4: 履歴管理の制限遵守**
     * **Validates: Requirements 1.4, 5.4**
     */
    it('should enforce chat history limit compliance', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          role: fc.constantFrom('user', 'assistant'),
          content: fc.string(),
          timestamp: fc.date()
        }), { minLength: 1, maxLength: 20 }), // Generate up to 20 messages to test limit enforcement
        (messages) => {
          // Test that limitChatHistory always returns at most 6 messages (3 turns)
          const limitedMessages = limitChatHistory(messages);
          expect(limitedMessages.length).toBeLessThanOrEqual(AI_CONFIG.contextLimit * 2);
          
          // Test that validateChatHistoryLimit correctly identifies when limit is exceeded
          const isWithinLimit = validateChatHistoryLimit(messages);
          const expectedWithinLimit = messages.length <= AI_CONFIG.contextLimit * 2;
          expect(isWithinLimit).toBe(expectedWithinLimit);
          
          // Test that limited messages are always within limit
          expect(validateChatHistoryLimit(limitedMessages)).toBe(true);
          
          // Test that if original was within limit, no messages are lost
          if (messages.length <= AI_CONFIG.contextLimit * 2) {
            expect(limitedMessages).toEqual(messages);
          } else {
            // Test that the most recent messages are kept
            const expectedKept = messages.slice(-AI_CONFIG.contextLimit * 2);
            expect(limitedMessages).toEqual(expectedKept);
          }
        }
      ), { numRuns: 10 });
    });
    it('should validate ChatMessage properties', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom('user', 'assistant'),
        fc.string(),
        fc.date(),
        (id, role, content, timestamp) => {
          const message: ChatMessage = { id, role, content, timestamp };
          
          expect(typeof message.id).toBe('string');
          expect(message.id.length).toBeGreaterThan(0);
          expect(['user', 'assistant']).toContain(message.role);
          expect(typeof message.content).toBe('string');
          expect(message.timestamp).toBeInstanceOf(Date);
        }
      ), { numRuns: 10 });
    });

    it('should validate AIApiRequest properties', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          role: fc.constantFrom('user', 'assistant'),
          content: fc.string(),
          timestamp: fc.date()
        }), { minLength: 1 }),
        fc.float({ min: 0, max: 2, noNaN: true }),
        fc.integer({ min: 1, max: 4000 }),
        (messages, temperature, maxTokens) => {
          const request: AIApiRequest = { messages, temperature, maxTokens };
          
          expect(Array.isArray(request.messages)).toBe(true);
          expect(request.messages.length).toBeGreaterThan(0);
          expect(typeof request.temperature).toBe('number');
          expect(Number.isFinite(request.temperature)).toBe(true);
          expect(request.temperature).toBeGreaterThanOrEqual(0);
          expect(request.temperature).toBeLessThanOrEqual(2);
          expect(typeof request.maxTokens).toBe('number');
          expect(request.maxTokens).toBeGreaterThan(0);
        }
      ), { numRuns: 10 });
    });

    it('should validate AppState properties', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          id: fc.string({ minLength: 1 }),
          role: fc.constantFrom('user', 'assistant'),
          content: fc.string(),
          timestamp: fc.date()
        })),
        fc.string(),
        fc.boolean(),
        fc.option(fc.string()),
        (chatHistory, currentCode, isLoading, error) => {
          const state: AppState = { chatHistory, currentCode, isLoading, error };
          
          expect(Array.isArray(state.chatHistory)).toBe(true);
          expect(typeof state.currentCode).toBe('string');
          expect(typeof state.isLoading).toBe('boolean');
          expect(state.error === null || typeof state.error === 'string').toBe(true);
        }
      ), { numRuns: 10 });
    });
  });
});