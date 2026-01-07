'use client';

import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/ToastNotification';

/**
 * Toast management hook
 * Requirements: 5.2 - エラーメッセージ表示・自動消去
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Add a new toast notification
   */
  const addToast = useCallback((
    type: ToastType,
    title: string,
    message: string,
    options?: {
      autoClose?: boolean;
      duration?: number;
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      autoClose: options?.autoClose,
      duration: options?.duration,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Convenience methods for different toast types
   */
  const showError = useCallback((title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return addToast('error', title, message, { 
      autoClose: options?.autoClose !== false, // Default to true for errors
      duration: options?.duration || 5000, // 5 seconds for errors
      ...options 
    });
  }, [addToast]);

  const showSuccess = useCallback((title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return addToast('success', title, message, { 
      autoClose: options?.autoClose !== false, // Default to true
      duration: options?.duration || 3000, // 3 seconds for success
      ...options 
    });
  }, [addToast]);

  const showWarning = useCallback((title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return addToast('warning', title, message, { 
      autoClose: options?.autoClose !== false, // Default to true
      duration: options?.duration || 4000, // 4 seconds for warnings
      ...options 
    });
  }, [addToast]);

  const showInfo = useCallback((title: string, message: string, options?: { autoClose?: boolean; duration?: number }) => {
    return addToast('info', title, message, { 
      autoClose: options?.autoClose !== false, // Default to true
      duration: options?.duration || 3000, // 3 seconds for info
      ...options 
    });
  }, [addToast]);

  /**
   * Show AI API specific errors with appropriate messages
   * Requirements: 5.2 - 分かりやすいエラーメッセージ表示
   */
  const showAIError = useCallback((error: string, code?: string) => {
    let title = 'AI APIエラー';
    let message = error;

    // Customize error messages based on error codes
    switch (code) {
      case 'NETWORK_ERROR':
        title = '接続エラー';
        break;
      case 'AUTH_ERROR':
        title = '認証エラー';
        break;
      case 'RATE_LIMIT_ERROR':
        title = 'レート制限エラー';
        break;
      case 'TIMEOUT_ERROR':
        title = 'タイムアウトエラー';
        break;
      case 'INVALID_RESPONSE':
        title = '応答エラー';
        break;
      default:
        title = 'AI APIエラー';
    }

    return showError(title, message, { duration: 5000 });
  }, [showError]);

  /**
   * Show file operation errors
   */
  const showFileError = useCallback((operation: string, error: string) => {
    const title = `ファイル${operation}エラー`;
    return showError(title, error, { duration: 4000 });
  }, [showError]);

  /**
   * Show file operation success
   */
  const showFileSuccess = useCallback((operation: string, message: string) => {
    const title = `ファイル${operation}完了`;
    return showSuccess(title, message, { duration: 2000 });
  }, [showSuccess]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showAIError,
    showFileError,
    showFileSuccess,
  };
}