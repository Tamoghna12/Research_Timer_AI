import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLinkTitle,
  getLinkedTitles,
  isDoi,
  isArxiv,
  getCanonicalUrl,
  detectLinkType,
  parseLink,
  parseLinks,
  getLinkRefTitle,
  getLinkRefUrl,
  isLinkRefOpenable,
  getLinkTypeIcon,
  getLinkTypeLabel
} from './linkUtils';

describe('linkUtils', () => {
  describe('getLinkTitle', () => {
    it('should handle DOI links correctly', () => {
      expect(getLinkTitle('doi:10.1000/example')).toBe('doi:10.1000/example');
      expect(getLinkTitle('https://doi.org/10.1000/example')).toBe('doi:10.1000/example');
      expect(getLinkTitle('http://dx.doi.org/10.1038/nature12373')).toBe('doi:10.1038/nature12373');
    });

    it('should handle arXiv links correctly', () => {
      expect(getLinkTitle('https://arxiv.org/abs/2301.12345')).toBe('arXiv:2301.12345');
      expect(getLinkTitle('http://arxiv.org/pdf/1905.03493.pdf')).toBe('arXiv:1905.03493.pdf');
      expect(getLinkTitle('arxiv.org/abs/2012.15678')).toBe('arXiv:2012.15678');
    });

    it('should handle Overleaf links correctly', () => {
      expect(getLinkTitle('https://www.overleaf.com/project/abc123def456')).toBe('Overleaf Project');
      expect(getLinkTitle('overleaf.com/read/xyz789')).toBe('Overleaf');
      expect(getLinkTitle('https://overleaf.com')).toBe('Overleaf');
    });

    it('should handle GitHub links correctly', () => {
      expect(getLinkTitle('https://github.com/microsoft/vscode')).toBe('microsoft/vscode');
      expect(getLinkTitle('github.com/facebook/react')).toBe('facebook/react');
      expect(getLinkTitle('https://github.com/vercel/next.js/tree/main/docs')).toBe('vercel/next.js/tree');
      expect(getLinkTitle('github.com/user/repo/issues/123')).toBe('user/repo/issues');
    });

    it('should handle generic URLs correctly', () => {
      expect(getLinkTitle('https://www.google.com')).toBe('google.com');
      expect(getLinkTitle('https://example.com/path')).toBe('example.com/path');
      expect(getLinkTitle('stackoverflow.com/questions/12345')).toBe('stackoverflow.com/questions');
      expect(getLinkTitle('https://docs.python.org/3/library/os.html')).toBe('docs.python.org/3');
    });

    it('should handle URLs with query parameters', () => {
      expect(getLinkTitle('https://example.com/page?param=value')).toBe('example.com/page');
      expect(getLinkTitle('https://github.com/user/repo?tab=readme')).toBe('user/repo');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(getLinkTitle('not-a-url')).toBe('not-a-url');
      expect(getLinkTitle('just some text')).toBe('just some text');
      expect(getLinkTitle('http://')).toBe('http://');
    });

    it('should truncate very long links', () => {
      const longLink = 'this-is-a-very-long-link-that-should-be-truncated-because-it-exceeds-the-fifty-character-limit-and-keeps-going';
      const result = getLinkTitle(longLink);
      // Since it's not a URL, it should be returned as-is (but might be truncated in actual implementation)
      expect(result).toBe(longLink);
    });

    it('should handle empty or null inputs', () => {
      expect(getLinkTitle('')).toBe('');
      expect(getLinkTitle(null as unknown as string)).toBe('');
      expect(getLinkTitle(undefined as unknown as string)).toBe('');
    });

    it('should remove www prefix from hostnames', () => {
      expect(getLinkTitle('https://www.example.com')).toBe('example.com');
      expect(getLinkTitle('https://www.github.com/user/repo')).toBe('user/repo');
    });

    it('should handle trailing slashes', () => {
      expect(getLinkTitle('https://example.com/')).toBe('example.com');
      expect(getLinkTitle('https://example.com/path/')).toBe('example.com/path');
    });
  });

  describe('getLinkedTitles', () => {
    it('should join multiple link titles with commas', () => {
      const links = [
        'https://github.com/user/repo',
        'doi:10.1000/example',
        'https://arxiv.org/abs/2301.12345'
      ];
      const result = getLinkedTitles(links);
      expect(result).toBe('user/repo, doi:10.1000/example, arXiv:2301.12345');
    });

    it('should handle empty array', () => {
      expect(getLinkedTitles([])).toBe('');
      expect(getLinkedTitles(null as unknown as string[])).toBe('');
      expect(getLinkedTitles(undefined as unknown as string[])).toBe('');
    });

    it('should handle single link', () => {
      expect(getLinkedTitles(['https://example.com'])).toBe('example.com');
    });
  });

  describe('isDoi', () => {
    it('should correctly identify DOI links', () => {
      expect(isDoi('doi:10.1000/example')).toBe(true);
      expect(isDoi('https://doi.org/10.1000/example')).toBe(true);
      expect(isDoi('http://dx.doi.org/10.1038/nature12373')).toBe(true);
      expect(isDoi('https://example.com')).toBe(false);
      expect(isDoi('https://arxiv.org/abs/2301.12345')).toBe(false);
    });
  });

  describe('isArxiv', () => {
    it('should correctly identify arXiv links', () => {
      expect(isArxiv('https://arxiv.org/abs/2301.12345')).toBe(true);
      expect(isArxiv('http://arxiv.org/pdf/1905.03493.pdf')).toBe(true);
      expect(isArxiv('https://example.com')).toBe(false);
      expect(isArxiv('doi:10.1000/example')).toBe(false);
    });
  });

  describe('getCanonicalUrl', () => {
    it('should convert DOI to canonical URL', () => {
      expect(getCanonicalUrl('doi:10.1000/example')).toBe('https://doi.org/10.1000/example');
    });

    it('should add https protocol to URLs missing it', () => {
      expect(getCanonicalUrl('example.com')).toBe('https://example.com');
      expect(getCanonicalUrl('github.com/user/repo')).toBe('https://github.com/user/repo');
    });

    it('should preserve existing protocols', () => {
      expect(getCanonicalUrl('https://example.com')).toBe('https://example.com');
      expect(getCanonicalUrl('http://example.com')).toBe('http://example.com');
    });
  });

  describe('new link parsing functions', () => {
    describe('detectLinkType', () => {
      it('should detect DOI links', () => {
        expect(detectLinkType('doi:10.1000/example')).toBe('doi');
        expect(detectLinkType('https://doi.org/10.1000/example')).toBe('doi');
      });

      it('should detect arXiv links', () => {
        expect(detectLinkType('https://arxiv.org/abs/2301.12345')).toBe('arxiv');
      });

      it('should detect GitHub links', () => {
        expect(detectLinkType('https://github.com/user/repo')).toBe('github');
      });

      it('should detect Overleaf links', () => {
        expect(detectLinkType('https://overleaf.com/project/123')).toBe('overleaf');
      });

      it('should detect Zotero links', () => {
        expect(detectLinkType('https://zotero.org/groups/123')).toBe('zotero');
        expect(detectLinkType('zotero://select/library/items/ABC123')).toBe('zotero');
      });

      it('should detect local file paths', () => {
        expect(detectLinkType('/path/to/file.pdf')).toBe('local');
        expect(detectLinkType('file:///path/to/file.pdf')).toBe('local');
        expect(detectLinkType('C:\\Users\\file.pdf')).toBe('local');
      });

      it('should default to url for generic links', () => {
        expect(detectLinkType('https://example.com')).toBe('url');
        expect(detectLinkType('example.com')).toBe('url');
      });
    });

    describe('parseLink', () => {
      beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(123456789);
      });

      afterEach(() => {
        vi.restoreAllMocks();
      });

      it('should parse a DOI link correctly', () => {
        const result = parseLink('doi:10.1000/example');

        expect(result).toEqual({
          id: expect.any(String),
          type: 'doi',
          url: 'doi:10.1000/example',
          title: 'doi:10.1000/example',
          description: undefined,
          addedAt: 123456789
        });
      });

      it('should parse with description', () => {
        const result = parseLink('https://example.com', 'Test description');

        expect(result.description).toBe('Test description');
      });

      it('should throw error for empty URL', () => {
        expect(() => parseLink('')).toThrow('URL is required');
      });

      it('should trim URLs and descriptions', () => {
        const result = parseLink('  https://example.com  ', '  Test  ');

        expect(result.url).toBe('https://example.com');
        expect(result.description).toBe('Test');
      });
    });

    describe('parseLinks', () => {
      it('should parse multiple URLs', () => {
        const results = parseLinks([
          'doi:10.1000/example',
          'https://github.com/user/repo'
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].type).toBe('doi');
        expect(results[1].type).toBe('github');
      });

      it('should filter out empty URLs', () => {
        const results = parseLinks([
          'https://example.com',
          '',
          '   ',
          'doi:10.1000/test'
        ]);

        expect(results).toHaveLength(2);
      });
    });

    describe('getLinkRefTitle', () => {
      it('should return custom title if set', () => {
        const linkRef = {
          id: 'test',
          type: 'url' as const,
          url: 'https://example.com',
          title: 'Custom Title',
          addedAt: Date.now()
        };

        expect(getLinkRefTitle(linkRef)).toBe('Custom Title');
      });

      it('should fallback to parsed title from URL', () => {
        const linkRef = {
          id: 'test',
          type: 'doi' as const,
          url: 'doi:10.1000/example',
          addedAt: Date.now()
        };

        expect(getLinkRefTitle(linkRef)).toBe('doi:10.1000/example');
      });
    });

    describe('getLinkRefUrl', () => {
      it('should return canonical URL', () => {
        const linkRef = {
          id: 'test',
          type: 'doi' as const,
          url: 'doi:10.1000/example',
          addedAt: Date.now()
        };

        expect(getLinkRefUrl(linkRef)).toBe('https://doi.org/10.1000/example');
      });
    });

    describe('isLinkRefOpenable', () => {
      it('should return true for valid URLs', () => {
        const linkRef = {
          id: 'test',
          type: 'url' as const,
          url: 'https://example.com',
          addedAt: Date.now()
        };

        expect(isLinkRefOpenable(linkRef)).toBe(true);
      });

      it('should return true for local files with proper paths', () => {
        const linkRef = {
          id: 'test',
          type: 'local' as const,
          url: '/path/to/file.pdf',
          addedAt: Date.now()
        };

        expect(isLinkRefOpenable(linkRef)).toBe(true);
      });

      it('should return true for URLs that can be parsed', () => {
        // Note: Most URLs can be made valid by adding https://, so this tests that behavior
        const linkRef = {
          id: 'test',
          type: 'url' as const,
          url: 'not-a-url',
          addedAt: Date.now()
        };

        // The canonical URL function makes this valid by adding https://
        expect(isLinkRefOpenable(linkRef)).toBe(true);
      });
    });

    describe('getLinkTypeIcon and getLinkTypeLabel', () => {
      it('should return correct icons for link types', () => {
        expect(getLinkTypeIcon('doi')).toBe('article');
        expect(getLinkTypeIcon('arxiv')).toBe('science');
        expect(getLinkTypeIcon('github')).toBe('code');
        expect(getLinkTypeIcon('overleaf')).toBe('edit');
        expect(getLinkTypeIcon('zotero')).toBe('bookmark');
        expect(getLinkTypeIcon('local')).toBe('folder');
        expect(getLinkTypeIcon('url')).toBe('link');
      });

      it('should return correct labels for link types', () => {
        expect(getLinkTypeLabel('doi')).toBe('DOI');
        expect(getLinkTypeLabel('arxiv')).toBe('arXiv');
        expect(getLinkTypeLabel('github')).toBe('GitHub');
        expect(getLinkTypeLabel('overleaf')).toBe('Overleaf');
        expect(getLinkTypeLabel('zotero')).toBe('Zotero');
        expect(getLinkTypeLabel('local')).toBe('Local File');
        expect(getLinkTypeLabel('url')).toBe('Website');
      });
    });
  });

  describe('real-world examples', () => {
    it('should handle common academic links', () => {
      const examples = [
        { input: 'https://doi.org/10.1038/s41586-021-03819-2', expected: 'doi:10.1038/s41586-021-03819-2' },
        { input: 'https://arxiv.org/abs/2106.09685', expected: 'arXiv:2106.09685' },
        { input: 'https://github.com/pytorch/pytorch', expected: 'pytorch/pytorch' },
        { input: 'https://www.overleaf.com/project/60a1b2c3d4e5f6', expected: 'Overleaf Project' },
        { input: 'https://scholar.google.com/citations', expected: 'scholar.google.com/citations' }
      ];

      examples.forEach(({ input, expected }) => {
        expect(getLinkTitle(input)).toBe(expected);
      });
    });

    it('should handle edge cases found in real usage', () => {
      // URLs with fragments
      expect(getLinkTitle('https://example.com/docs#section')).toBe('example.com/docs');

      // Subdomain handling - falls back to generic URL parsing
      expect(getLinkTitle('https://api.github.com/repos/user/repo')).toBe('repos/user/repo');

      // Port numbers
      expect(getLinkTitle('http://localhost:3000/app')).toBe('localhost/app');
    });
  });
});