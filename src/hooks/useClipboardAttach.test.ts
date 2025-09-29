import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboardAttach } from './useClipboardAttach';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123'
  }
});

// Mock navigator.clipboard
const mockReadText = vi.fn();
const mockClipboard = {
  readText: mockReadText
};

Object.defineProperty(global.navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true
});

describe('useClipboardAttach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(123456789);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attachFromClipboard', () => {
    it('should attach DOI from clipboard', async () => {
      mockReadText.mockResolvedValue('doi:10.1000/example');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toEqual({
        id: 'test-uuid-123',
        type: 'doi',
        url: 'doi:10.1000/example',
        title: 'doi:10.1000/example',
        description: undefined,
        addedAt: 123456789
      });
      expect(result.current.lastChecked).toBe(123456789);
    });

    it('should attach GitHub URL from clipboard', async () => {
      mockReadText.mockResolvedValue('https://github.com/user/repo');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef?.type).toBe('github');
      expect(linkRef?.url).toBe('https://github.com/user/repo');
    });

    it('should attach arXiv URL from clipboard', async () => {
      mockReadText.mockResolvedValue('https://arxiv.org/abs/2301.12345');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef?.type).toBe('arxiv');
      expect(linkRef?.title).toBe('arXiv:2301.12345');
    });

    it('should handle URLs without protocol', async () => {
      mockReadText.mockResolvedValue('example.com/path/page');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef?.type).toBe('url');
      expect(linkRef?.url).toBe('example.com/path/page');
    });

    it('should return null for empty clipboard', async () => {
      mockReadText.mockResolvedValue('');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBe('Clipboard is empty');
    });

    it('should return null for whitespace-only clipboard', async () => {
      mockReadText.mockResolvedValue('   \n  \t  ');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBe('Clipboard is empty');
    });

    it('should return null for non-URL content', async () => {
      mockReadText.mockResolvedValue('Just some regular text that is not a URL');
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBe('Clipboard content does not appear to be a link');
    });

    it('should handle clipboard API not available', async () => {
      // Temporarily remove clipboard API
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBe('Clipboard access not available');

      // Restore clipboard API
      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    });

    it('should handle clipboard read permission denied', async () => {
      mockReadText.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should set loading state during clipboard check', async () => {
      let resolveClipboard: (value: string) => void;
      const clipboardPromise = new Promise<string>((resolve) => {
        resolveClipboard = resolve;
      });
      mockReadText.mockReturnValue(clipboardPromise);

      const { result } = renderHook(() => useClipboardAttach());

      expect(result.current.isChecking).toBe(false);

      act(() => {
        result.current.attachFromClipboard();
      });

      // Should be loading
      expect(result.current.isChecking).toBe(true);

      // Resolve the clipboard promise and wait
      resolveClipboard!('https://example.com');

      await act(async () => {
        // Wait for state updates to complete
      });

      expect(result.current.isChecking).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => useClipboardAttach());

      // First, cause an error
      mockReadText.mockResolvedValue('');
      await act(async () => {
        await result.current.attachFromClipboard();
      });
      expect(result.current.error).toBeTruthy();

      // Then, perform successful operation
      mockReadText.mockResolvedValue('https://example.com');
      await act(async () => {
        await result.current.attachFromClipboard();
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle generic errors', async () => {
      mockReadText.mockRejectedValue(new Error('Generic error'));
      const { result } = renderHook(() => useClipboardAttach());

      let linkRef;
      await act(async () => {
        linkRef = await result.current.attachFromClipboard();
      });

      expect(linkRef).toBeNull();
      expect(result.current.error).toBe('Generic error');
    });
  });

  describe('isValidUrl helper function', () => {
    // Test the private isValidUrl function indirectly through attachFromClipboard

    it('should accept valid URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'example.com',
        'sub.domain.example.com',
        'example.co.uk',
        'localhost:3000'
      ];

      for (const url of validUrls) {
        mockReadText.mockResolvedValue(url);
        const { result } = renderHook(() => useClipboardAttach());

        let linkRef;
        await act(async () => {
          linkRef = await result.current.attachFromClipboard();
        });

        expect(linkRef).not.toBeNull();
      }
    });

    it('should reject invalid text', async () => {
      const invalidTexts = [
        'just text',
        '123456',
        'invalid..domain',  // Double dots are invalid
        'no-dots-here'      // No TLD
      ];

      for (const text of invalidTexts) {
        mockReadText.mockResolvedValue(text);
        const { result } = renderHook(() => useClipboardAttach());

        let linkRef;
        await act(async () => {
          linkRef = await result.current.attachFromClipboard();
        });

        expect(linkRef).toBeNull();
      }
    });
  });
});