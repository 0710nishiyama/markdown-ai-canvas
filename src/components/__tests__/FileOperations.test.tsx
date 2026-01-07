/**
 * FileOperations Component Tests
 * ファイル操作コンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileOperations } from '../FileOperations';
import { AppStateProvider } from '../../contexts/AppStateContext';
import { ErrorHandlingProvider } from '../../contexts/ErrorHandlingContext';

// Mock file operations
jest.mock('../../utils/fileOperations', () => ({
  downloadMarkdownFile: jest.fn(),
  copyToClipboard: jest.fn(),
}));

// Test wrapper with context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorHandlingProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </ErrorHandlingProvider>
);

describe('FileOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render save and copy buttons', () => {
    render(
      <TestWrapper>
        <FileOperations />
      </TestWrapper>
    );
    
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('コピー')).toBeInTheDocument();
  });

  it('should disable buttons when no content is available', () => {
    render(
      <TestWrapper>
        <FileOperations />
      </TestWrapper>
    );
    
    const saveButton = screen.getByText('保存');
    const copyButton = screen.getByText('コピー');
    
    expect(saveButton).toBeDisabled();
    expect(copyButton).toBeDisabled();
  });

  it('should have proper button styling and icons', () => {
    const { container } = render(
      <TestWrapper>
        <FileOperations />
      </TestWrapper>
    );
    
    const saveButton = screen.getByText('保存');
    const copyButton = screen.getByText('コピー');
    
    // Check that buttons have proper titles
    expect(saveButton).toHaveAttribute('title', 'Markdownファイルとして保存');
    expect(copyButton).toHaveAttribute('title', 'クリップボードにコピー');
    
    // Check that SVG icons are present
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements).toHaveLength(2); // One for each button
  });

  it('should render with custom className', () => {
    const { container } = render(
      <TestWrapper>
        <FileOperations className="custom-class" />
      </TestWrapper>
    );
    
    const fileOperationsDiv = container.firstChild as HTMLElement;
    expect(fileOperationsDiv).toHaveClass('custom-class');
  });
});