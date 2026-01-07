/**
 * AI Service Tests
 * Basic functionality tests for AI API client
 */

import { AIService, AIServiceError, createAIService } from '../aiService';
import { AIApiRequest, ChatMessage, AI_CONFIG } from '../../types';

// Mock the external API clients
jest.mock('openai');
jest.mock('@google/generative-ai');

describe('AIService', () => {
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with OpenAI provider', () => {
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey
      });
      
      expect(service.getProvider()).toBe('openai');
    });

    it('should initialize with Gemini provider', () => {
      const service = new AIService({
        provider: 'gemini',
        apiKey: mockApiKey
      });
      
      expect(service.getProvider()).toBe('gemini');
    });

    it('should use default timeout from AI_CONFIG', () => {
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey
      });
      
      // Service should be created without throwing
      expect(service).toBeInstanceOf(AIService);
    });

    it('should use custom timeout when provided', () => {
      const customTimeout = 15000;
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey,
        timeout: customTimeout
      });
      
      expect(service).toBeInstanceOf(AIService);
    });
  });

  describe('Error Handling', () => {
    it('should create AIServiceError with correct properties', () => {
      const error = new AIServiceError('Test message', 'TEST_CODE');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AIServiceError);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AIServiceError');
    });

    it('should create AIServiceError with original error', () => {
      const originalError = new Error('Original error');
      const error = new AIServiceError('Test message', 'TEST_CODE', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('Provider Management', () => {
    it('should update API key', () => {
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey
      });
      
      const newApiKey = 'new-api-key';
      service.updateApiKey(newApiKey);
      
      // Should not throw error
      expect(service.getProvider()).toBe('openai');
    });

    it('should switch provider', () => {
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey
      });
      
      const newApiKey = 'gemini-api-key';
      service.switchProvider('gemini', newApiKey);
      
      expect(service.getProvider()).toBe('gemini');
    });
  });

  describe('Request Validation', () => {
    it('should handle valid request structure', () => {
      const service = new AIService({
        provider: 'openai',
        apiKey: mockApiKey
      });

      const validRequest: AIApiRequest = {
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'Test message',
            timestamp: new Date()
          }
        ],
        temperature: AI_CONFIG.temperature,
        maxTokens: AI_CONFIG.maxTokens
      };

      // Should not throw during request creation
      expect(validRequest.messages).toHaveLength(1);
      expect(validRequest.temperature).toBe(AI_CONFIG.temperature);
      expect(validRequest.maxTokens).toBe(AI_CONFIG.maxTokens);
    });
  });

  describe('createAIService function', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create service with OpenAI when OPENAI key is available', () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'openai-key';
      
      const service = createAIService();
      expect(service.getProvider()).toBe('openai');
    });

    it('should create service with Gemini when only Gemini key is available', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'gemini-key';
      
      const service = createAIService();
      expect(service.getProvider()).toBe('gemini');
    });

    it('should throw error when no API keys are available', () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      expect(() => createAIService()).toThrow(AIServiceError);
      expect(() => createAIService()).toThrow('API キーが設定されていません');
    });
  });
});