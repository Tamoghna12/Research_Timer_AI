export function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // empty is valid

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidDoi(input: string): boolean {
  if (!input.trim()) return true; // empty is valid

  // Basic DOI pattern: starts with "doi:" or "10."
  const doiPattern = /^(doi:|DOI:)?10\.\d{4,}\/\S+$/i;
  return doiPattern.test(input);
}

export function isValidLink(input: string): boolean {
  if (!input.trim()) return true;

  return isValidUrl(input) || isValidDoi(input);
}

export function formatLink(input: string): string {
  if (!input.trim()) return '';

  // If it looks like a DOI but doesn't have the doi: prefix, add it
  if (/^10\.\d{4,}\/\S+$/.test(input)) {
    return `doi:${input}`;
  }

  return input;
}