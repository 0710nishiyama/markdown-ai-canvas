/**
 * Canvas Page Integration Tests
 * Canvas画面の統合テスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CanvasPage from '../page';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <textarea
        data-testid="monaco-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  };
});

// Mock AI Service
jest.mock('../../../services/aiService', () => ({
  getAIService: jest.fn(() => ({
    sendMessage: jest.fn().mockResolvedValue({
      content: 'Mock AI response',
      usage: { promptTokens: 10, completionTokens: 20 }
    })
  })),
  AIServiceError: class extends Error {}
}));

describe('CanvasPage', () => {
  it('should render the main layout with header and two-column content', () => {
    render(<CanvasPage />);
    
    // Check header
    expect(screen.getByText('Markdown AI Canvas')).toBeInTheDocument();
    expect(screen.getByText('トップ')).toBeInTheDocument();
    
    // Check that code editor area is present (currently using textarea)
    expect(screen.getByPlaceholderText('AIが生成したMarkdownコードがここに表示されます...')).toBeInTheDocument();
    
    // Check file operation buttons
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('コピー')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    render(<CanvasPage />);
    
    // Check main layout structure
    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex', 'h-[calc(100vh-64px)]');
  });

  it('should render file operation buttons in disabled state initially', () => {
    render(<CanvasPage />);
    
    const saveButton = screen.getByText('保存');
    const copyButton = screen.getByText('コピー');
    
    expect(saveButton).toBeDisabled();
    expect(copyButton).toBeDisabled();
  });
});