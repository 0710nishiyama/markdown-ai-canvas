'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ToastNotification';

/**
 * Error handling context type
 */
interface ErrorHandlingContextType {
  showError: (title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => string;
  showSuccess: (title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => string;
  showWarning: (title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => string;
  showInfo: (title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => string;
  showAIError: (error: string, code?: string) => string;
  showFileError: (operation: string, error: string) => string;
  showFileSuccess: (operation: string, message: string) => string;
  clearToasts: () => void;
}

/**
 * Error handling context
 */
const ErrorHandlingContext = createContext<ErrorHandlingContextType | undefined>(undefined);

/**
 * Error handling provider props
 */
interface ErrorHandlingProviderProps {
  children: ReactNode;
}

/**
 * Error Handling Provider Component
 * Requirements: 5.2 - トースト通知システム、エラーメッセージ表示・自動消去
 */
export function ErrorHandlingProvider({ children }: ErrorHandlingProviderProps) {
  const {
    toasts,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showAIError,
    showFileError,
    showFileSuccess,
    clearToasts,
  } = useToast();

  const contextValue: ErrorHandlingContextType = {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showAIError,
    showFileError,
    showFileSuccess,
    clearToasts,
  };

  return (
    <ErrorHandlingContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        position="top-right"
      />
    </ErrorHandlingContext.Provider>
  );
}

/**
 * Hook to use error handling context
 */
export function useErrorHandling(): ErrorHandlingContextType {
  const context = useContext(ErrorHandlingContext);
  if (context === undefined) {
    throw new Error('useErrorHandling must be used within an ErrorHandlingProvider');
  }
  return context;
}

/**
 * Global error handler utility
 * Requirements: 5.2 - 分かりやすいエラーメッセージ表示
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorHandling: ErrorHandlingContextType | null = null;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  setErrorHandling(errorHandling: ErrorHandlingContextType): void {
    this.errorHandling = errorHandling;
  }

  /**
   * Handle unhandled errors globally
   */
  handleError(error: Error, context?: string): void {
    console.error('Global error:', error, context);
    
    if (this.errorHandling) {
      this.errorHandling.showError(
        'システムエラー',
        context ? `${context}: ${error.message}` : error.message
      );
    }
  }

  /**
   * Handle AI API errors specifically
   */
  handleAIError(error: any, context?: string): void {
    console.error('AI API error:', error, context);
    
    if (this.errorHandling) {
      // Check if it's an AIServiceError with a code
      if (error.code) {
        this.errorHandling.showAIError(error.message, error.code);
      } else {
        this.errorHandling.showAIError(
          error.message || 'AI APIでエラーが発生しました。'
        );
      }
    }
  }

  /**
   * Handle file operation errors
   */
  handleFileError(operation: string, error: any): void {
    console.error('File operation error:', operation, error);
    
    if (this.errorHandling) {
      this.errorHandling.showFileError(
        operation,
        error.message || `${operation}中にエラーが発生しました。`
      );
    }
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: any, context?: string): void {
    console.error('Network error:', error, context);
    
    if (this.errorHandling) {
      this.errorHandling.showError(
        'ネットワークエラー',
        '接続に失敗しました。ネットワーク接続を確認してください。'
      );
    }
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = GlobalErrorHandler.getInstance();