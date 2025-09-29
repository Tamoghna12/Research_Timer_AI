import type { LinkRef } from '../../data/types';
import { LinkChip } from './LinkChip';

export interface LinkChipListProps {
  links: LinkRef[];
  onRemove?: (linkId: string) => void;
  onEdit?: (linkId: string) => void;
  showRemove?: boolean;
  showEdit?: boolean;
  size?: 'sm' | 'md';
  maxVisible?: number;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function LinkChipList({
  links,
  onRemove,
  onEdit,
  showRemove = false,
  showEdit = false,
  size = 'md',
  maxVisible,
  direction = 'horizontal',
  className = ""
}: LinkChipListProps) {
  if (!links || links.length === 0) {
    return null;
  }

  // Sort links by addedAt (most recent first) for consistent display
  const sortedLinks = [...links].sort((a, b) => b.addedAt - a.addedAt);

  // Apply max visible limit if specified
  const visibleLinks = maxVisible ? sortedLinks.slice(0, maxVisible) : sortedLinks;
  const hiddenCount = sortedLinks.length - visibleLinks.length;

  // Direction-specific layout classes
  const containerClasses = direction === 'horizontal'
    ? 'flex flex-wrap items-center gap-2'
    : 'flex flex-col gap-2';

  return (
    <div className={`${containerClasses} ${className}`}>
      {visibleLinks.map(link => (
        <LinkChip
          key={link.id}
          link={link}
          onRemove={onRemove}
          onEdit={onEdit}
          showRemove={showRemove}
          showEdit={showEdit}
          size={size}
        />
      ))}

      {/* Show count of hidden links if there are any */}
      {hiddenCount > 0 && (
        <div
          className={`inline-flex items-center justify-center
                     ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
                     rounded-full bg-gray-100 dark:bg-gray-800
                     text-gray-500 dark:text-gray-400
                     border border-gray-200 dark:border-gray-700`}
          title={`${hiddenCount} more link${hiddenCount === 1 ? '' : 's'}`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
}

// Utility component for read-only display with titles only
export interface LinkTitleListProps {
  links: LinkRef[];
  separator?: string;
  maxVisible?: number;
  className?: string;
}

export function LinkTitleList({
  links,
  separator = ', ',
  maxVisible,
  className = ""
}: LinkTitleListProps) {
  if (!links || links.length === 0) {
    return null;
  }

  // Sort links by addedAt (most recent first)
  const sortedLinks = [...links].sort((a, b) => b.addedAt - a.addedAt);

  // Apply max visible limit if specified
  const visibleLinks = maxVisible ? sortedLinks.slice(0, maxVisible) : sortedLinks;
  const hiddenCount = sortedLinks.length - visibleLinks.length;

  // Create display text
  const linkTitles = visibleLinks.map(link => link.title || link.url);
  const displayText = linkTitles.join(separator);
  const fullText = hiddenCount > 0 ? `${displayText}${separator}+${hiddenCount} more` : displayText;

  return (
    <span className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>
      {fullText}
    </span>
  );
}