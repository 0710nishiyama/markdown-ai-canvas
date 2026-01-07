/**
 * File Operations Tests
 * ファイル操作機能のテスト
 */

import { generateTimestampedFilename, copyToClipboard } from '../fileOperations';

// Mock DOM APIs for testing
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

describe('fileOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTimestampedFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = generateTimestampedFilename();
      
      // Should match pattern: markdown_YYYYMMDD_HHMMSS.md
      expect(filename).toMatch(/^markdown_\d{8}_\d{6}\.md$/);
    });

    it('should use custom prefix and extension', () => {
      const filename = generateTimestampedFilename('test', 'txt');
      
      // Should match pattern: test_YYYYMMDD_HHMMSS.txt
      expect(filename).toMatch(/^test_\d{8}_\d{6}\.txt$/);
    });

    it('should generate unique filenames for different timestamps', async () => {
      const filename1 = generateTimestampedFilename();
      
      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const filename2 = generateTimestampedFilename();
      
      // Filenames should be different (due to timestamp)
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('copyToClipboard', () => {
    it('should handle basic copy operation', async () => {
      // Mock navigator.clipboard
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        configurable: true,
      });

      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
      });
      
      const result = await copyToClipboard('test content');
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('test content');
    });

    it('should handle clipboard errors gracefully', async () => {
      // Mock navigator.clipboard with error
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard error'));
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        configurable: true,
      });

      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
      });
      
      const result = await copyToClipboard('test content');
      
      expect(result).toBe(false);
    });
  });
});