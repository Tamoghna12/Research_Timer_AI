import type { LinkType, LinkRef } from '../data/types';

/**
 * Extract a display title from a URL or link string
 * Handles common academic and development links
 */
export function getLinkTitle(link: string): string {
  if (!link) return '';

  // Handle DOI links
  if (link.startsWith('doi:') || link.includes('doi.org')) {
    const doiMatch = link.match(/(?:doi:|doi\.org\/)(.+)/);
    if (doiMatch) {
      return `doi:${doiMatch[1]}`;
    }
  }

  // Handle arXiv links
  if (link.includes('arxiv.org')) {
    const arxivMatch = link.match(/arxiv\.org\/(?:abs|pdf)\/([^/?\s]+)/);
    if (arxivMatch) {
      return `arXiv:${arxivMatch[1]}`;
    }
  }

  // Handle Overleaf links
  if (link.includes('overleaf.com')) {
    const overleafMatch = link.match(/overleaf\.com\/project\/([^/?\s]+)/);
    if (overleafMatch) {
      return `Overleaf Project`;
    }
    return 'Overleaf';
  }

  // Handle GitHub links
  if (link.includes('github.com')) {
    const githubMatch = link.match(/github\.com\/([^/\s?]+)\/([^/\s?]+)(?:\/([^?\s]+))?/);
    if (githubMatch) {
      const [, owner, repo, path] = githubMatch;
      if (path && !path.startsWith('?')) {
        return `${owner}/${repo}/${path.split('/')[0]}`;
      }
      return `${owner}/${repo}`;
    }
  }

  // Handle generic URLs
  try {
    const url = new URL(link.startsWith('http') ? link : `https://${link}`);
    const hostname = url.hostname.replace(/^www\./, '');
    const pathname = url.pathname.replace(/\/$/, '');

    if (pathname && pathname !== '/') {
      // Take first path segment for brevity
      const firstSegment = pathname.split('/')[1];
      return `${hostname}/${firstSegment}`;
    }

    return hostname;
  } catch {
    // If URL parsing fails, return the original string truncated
    return link.length > 50 ? `${link.substring(0, 47)}...` : link;
  }
}

/**
 * Get multiple link titles, joined with commas
 */
export function getLinkedTitles(links: string[]): string {
  if (!links || links.length === 0) return '';
  return links.map(getLinkTitle).join(', ');
}

/**
 * Check if a link is a DOI
 */
export function isDoi(link: string): boolean {
  return link.startsWith('doi:') || link.includes('doi.org');
}

/**
 * Check if a link is an arXiv paper
 */
export function isArxiv(link: string): boolean {
  return link.includes('arxiv.org');
}

/**
 * Convert a link to its canonical URL form
 */
export function getCanonicalUrl(link: string): string {
  // Handle DOI
  if (link.startsWith('doi:')) {
    return `https://doi.org/${link.replace('doi:', '')}`;
  }

  // Handle URLs that might be missing protocol
  if (!link.startsWith('http://') && !link.startsWith('https://')) {
    return `https://${link}`;
  }

  return link;
}

/**
 * Determine the type of a link/URL
 */
export function detectLinkType(url: string): LinkType {
  if (!url) return 'url';

  // DOI detection
  if (url.startsWith('doi:') || url.includes('doi.org')) {
    return 'doi';
  }

  // arXiv detection
  if (url.includes('arxiv.org')) {
    return 'arxiv';
  }

  // GitHub detection
  if (url.includes('github.com')) {
    return 'github';
  }

  // Overleaf detection
  if (url.includes('overleaf.com')) {
    return 'overleaf';
  }

  // Zotero detection
  if (url.includes('zotero.org') || url.startsWith('zotero://')) {
    return 'zotero';
  }

  // Local file detection (starts with file:// or looks like a local path)
  if (url.startsWith('file://') || url.startsWith('/') || url.match(/^[A-Za-z]:\\/)) {
    return 'local';
  }

  // Default to generic URL
  return 'url';
}

/**
 * Parse a URL string into a LinkRef object
 */
export function parseLink(url: string, description?: string): LinkRef {
  if (!url) {
    throw new Error('URL is required');
  }

  const type = detectLinkType(url);
  const title = getLinkTitle(url);

  return {
    id: crypto.randomUUID(),
    type,
    url: url.trim(),
    title: title || undefined,
    description: description?.trim() || undefined,
    addedAt: Date.now()
  };
}

/**
 * Parse multiple URLs into LinkRef objects
 */
export function parseLinks(urls: string[], description?: string): LinkRef[] {
  return urls
    .filter(url => url.trim())
    .map(url => parseLink(url.trim(), description));
}

/**
 * Get display title from a LinkRef object
 */
export function getLinkRefTitle(linkRef: LinkRef): string {
  return linkRef.title || getLinkTitle(linkRef.url);
}

/**
 * Get canonical URL from a LinkRef object
 */
export function getLinkRefUrl(linkRef: LinkRef): string {
  return getCanonicalUrl(linkRef.url);
}

/**
 * Check if a LinkRef is openable (has a valid URL)
 */
export function isLinkRefOpenable(linkRef: LinkRef): boolean {
  if (linkRef.type === 'local') {
    return linkRef.url.startsWith('file://') || linkRef.url.startsWith('/');
  }

  try {
    new URL(getLinkRefUrl(linkRef));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get icon identifier for a link type
 */
export function getLinkTypeIcon(type: LinkType): string {
  switch (type) {
    case 'doi': return 'article';
    case 'arxiv': return 'science';
    case 'github': return 'code';
    case 'overleaf': return 'edit';
    case 'zotero': return 'bookmark';
    case 'local': return 'folder';
    case 'url':
    default: return 'link';
  }
}

/**
 * Get human-readable label for a link type
 */
export function getLinkTypeLabel(type: LinkType): string {
  switch (type) {
    case 'doi': return 'DOI';
    case 'arxiv': return 'arXiv';
    case 'github': return 'GitHub';
    case 'overleaf': return 'Overleaf';
    case 'zotero': return 'Zotero';
    case 'local': return 'Local File';
    case 'url':
    default: return 'Website';
  }
}