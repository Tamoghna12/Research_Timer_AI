import { describe, it, expect } from 'vitest';
import { isValidUrl, isValidDoi, isValidLink, formatLink } from '../utils/validation';

describe('validation utilities', () => {
  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com/path?query=value')).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=value#fragment')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('javascript:alert("xss")')).toBe(false);
    });

    it('should accept empty strings', () => {
      expect(isValidUrl('')).toBe(true);
      expect(isValidUrl('   ')).toBe(true);
    });
  });

  describe('isValidDoi', () => {
    it('should accept valid DOIs with prefix', () => {
      expect(isValidDoi('doi:10.1000/182')).toBe(true);
      expect(isValidDoi('DOI:10.1000/182')).toBe(true);
      expect(isValidDoi('doi:10.1038/nature12373')).toBe(true);
    });

    it('should accept valid DOIs without prefix', () => {
      expect(isValidDoi('10.1000/182')).toBe(true);
      expect(isValidDoi('10.1038/nature12373')).toBe(true);
      expect(isValidDoi('10.1109/5.771073')).toBe(true);
    });

    it('should reject invalid DOIs', () => {
      expect(isValidDoi('not-a-doi')).toBe(false);
      expect(isValidDoi('10.invalid')).toBe(false);
      expect(isValidDoi('doi:invalid')).toBe(false);
      expect(isValidDoi('10')).toBe(false);
    });

    it('should accept empty strings', () => {
      expect(isValidDoi('')).toBe(true);
      expect(isValidDoi('   ')).toBe(true);
    });
  });

  describe('isValidLink', () => {
    it('should accept valid URLs', () => {
      expect(isValidLink('https://example.com')).toBe(true);
      expect(isValidLink('http://example.com')).toBe(true);
    });

    it('should accept valid DOIs', () => {
      expect(isValidLink('doi:10.1000/182')).toBe(true);
      expect(isValidLink('10.1000/182')).toBe(true);
    });

    it('should reject invalid links', () => {
      expect(isValidLink('not-a-link')).toBe(false);
      expect(isValidLink('ftp://example.com')).toBe(false);
    });

    it('should accept empty strings', () => {
      expect(isValidLink('')).toBe(true);
      expect(isValidLink('   ')).toBe(true);
    });
  });

  describe('formatLink', () => {
    it('should add doi: prefix to bare DOIs', () => {
      expect(formatLink('10.1000/182')).toBe('doi:10.1000/182');
      expect(formatLink('10.1038/nature12373')).toBe('doi:10.1038/nature12373');
    });

    it('should not modify DOIs that already have prefix', () => {
      expect(formatLink('doi:10.1000/182')).toBe('doi:10.1000/182');
      expect(formatLink('DOI:10.1000/182')).toBe('DOI:10.1000/182');
    });

    it('should not modify URLs', () => {
      expect(formatLink('https://example.com')).toBe('https://example.com');
      expect(formatLink('http://example.com')).toBe('http://example.com');
    });

    it('should handle empty strings', () => {
      expect(formatLink('')).toBe('');
      expect(formatLink('   ')).toBe('');
    });

    it('should not modify invalid inputs', () => {
      expect(formatLink('not-a-link')).toBe('not-a-link');
      expect(formatLink('invalid-doi')).toBe('invalid-doi');
    });
  });
});