/**
 * Integration utilities for component communication
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { ChatMessage } from '../types';

/**
 * Event types for cross-component communication
 */
export type IntegrationEvent = 
  | { type: 'CODE_UPDATED'; payload: { code: string; source: 'ai' | 'user' } }
  | { type: 'CHAT_MESSAGE_SENT'; payload: { message: ChatMessage } }
  | { type: 'ERROR_OCCURRED'; payload: { error: string; component: string } }
  | { type: 'LOADING_STATE_CHANGED'; payload: { isLoading: boolean; component: string } };

/**
 * Integration event bus for component communication
 */
class IntegrationEventBus {
  private listeners: Map<string, Array<(event: IntegrationEvent) => void>> = new Map();

  /**
   * Subscribe to integration events
   */
  subscribe(eventType: IntegrationEvent['type'], callback: (event: IntegrationEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const callbacks = this.listeners.get(eventType)!;
    callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit integration event
   */
  emit(event: IntegrationEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in integration event callback:', error);
        }
      });
    }
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Global integration event bus instance
 */
export const integrationEventBus = new IntegrationEventBus();

/**
 * Integration utilities
 */
export const IntegrationUtils = {
  /**
   * Notify when code is updated
   */
  notifyCodeUpdate(code: string, source: 'ai' | 'user'): void {
    integrationEventBus.emit({
      type: 'CODE_UPDATED',
      payload: { code, source }
    });
  },

  /**
   * Notify when chat message is sent
   */
  notifyChatMessageSent(message: ChatMessage): void {
    integrationEventBus.emit({
      type: 'CHAT_MESSAGE_SENT',
      payload: { message }
    });
  },

  /**
   * Notify when error occurs
   */
  notifyError(error: string, component: string): void {
    integrationEventBus.emit({
      type: 'ERROR_OCCURRED',
      payload: { error, component }
    });
  },

  /**
   * Notify when loading state changes
   */
  notifyLoadingStateChange(isLoading: boolean, component: string): void {
    integrationEventBus.emit({
      type: 'LOADING_STATE_CHANGED',
      payload: { isLoading, component }
    });
  },

  /**
   * Subscribe to code updates
   */
  onCodeUpdate(callback: (code: string, source: 'ai' | 'user') => void): () => void {
    return integrationEventBus.subscribe('CODE_UPDATED', (event) => {
      if (event.type === 'CODE_UPDATED') {
        callback(event.payload.code, event.payload.source);
      }
    });
  },

  /**
   * Subscribe to chat messages
   */
  onChatMessage(callback: (message: ChatMessage) => void): () => void {
    return integrationEventBus.subscribe('CHAT_MESSAGE_SENT', (event) => {
      if (event.type === 'CHAT_MESSAGE_SENT') {
        callback(event.payload.message);
      }
    });
  },

  /**
   * Subscribe to errors
   */
  onError(callback: (error: string, component: string) => void): () => void {
    return integrationEventBus.subscribe('ERROR_OCCURRED', (event) => {
      if (event.type === 'ERROR_OCCURRED') {
        callback(event.payload.error, event.payload.component);
      }
    });
  },

  /**
   * Subscribe to loading state changes
   */
  onLoadingStateChange(callback: (isLoading: boolean, component: string) => void): () => void {
    return integrationEventBus.subscribe('LOADING_STATE_CHANGED', (event) => {
      if (event.type === 'LOADING_STATE_CHANGED') {
        callback(event.payload.isLoading, event.payload.component);
      }
    });
  }
};

/**
 * React hook for integration events
 */
export function useIntegrationEvents() {
  return IntegrationUtils;
}