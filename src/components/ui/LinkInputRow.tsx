import { useState, useCallback } from 'react';
import Button from './Button';

export interface LinkInputRowProps {
  onAdd: (url: string, description?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showDescription?: boolean;
  className?: string;
}

export function LinkInputRow({
  onAdd,
  disabled = false,
  placeholder = "Add a link (DOI, arXiv, GitHub, URL, etc.)",
  showDescription = true,
  className = ""
}: LinkInputRowProps) {
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = useCallback(() => {
    if (!url.trim()) return;

    onAdd(url.trim(), description.trim() || undefined);

    // Reset form
    setUrl('');
    setDescription('');
    setIsExpanded(false);
  }, [url, description, onAdd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  const handleExpand = useCallback(() => {
    if (showDescription && !isExpanded) {
      setIsExpanded(true);
    }
  }, [showDescription, isExpanded]);

  const canAdd = url.trim().length > 0 && !disabled;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main URL input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleExpand}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          onClick={handleAdd}
          disabled={!canAdd}
          variant="primary"
          size="sm"
          className="px-4"
        >
          Add
        </Button>
      </div>

      {/* Optional description input (expanded state) */}
      {showDescription && isExpanded && (
        <div className="flex gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Optional description"
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            onClick={() => setIsExpanded(false)}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="px-3"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Supports DOIs, arXiv papers, GitHub repos, Overleaf projects, Zotero links, and web URLs
      </p>
    </div>
  );
}