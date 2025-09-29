import { useCallback } from 'react';
import type { LinkRef } from '../../data/types';
import {
  getLinkRefTitle,
  getLinkRefUrl,
  getLinkTypeIcon,
  getLinkTypeLabel,
  isLinkRefOpenable
} from '../../utils/linkUtils';

export interface LinkChipProps {
  link: LinkRef;
  onRemove?: (linkId: string) => void;
  onEdit?: (linkId: string) => void;
  showRemove?: boolean;
  showEdit?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function LinkChip({
  link,
  onRemove,
  onEdit,
  showRemove = false,
  showEdit = false,
  size = 'md',
  className = ""
}: LinkChipProps) {
  const title = getLinkRefTitle(link);
  const url = getLinkRefUrl(link);
  const isOpenable = isLinkRefOpenable(link);
  const typeIcon = getLinkTypeIcon(link.type);
  const typeLabel = getLinkTypeLabel(link.type);

  const handleOpen = useCallback(() => {
    if (isOpenable) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url, isOpenable]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(link.id);
  }, [link.id, onRemove]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(link.id);
  }, [link.id, onEdit]);

  // Size-specific styles
  const sizeStyles = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizeStyles} rounded-full
                  bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-200 dark:border-gray-700
                  ${isOpenable ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
                  transition-colors ${className}`}
      onClick={isOpenable ? handleOpen : undefined}
      title={link.description || `${typeLabel}: ${title}\n${url}`}
    >
      {/* Type icon */}
      <div className={`${iconSize} flex-shrink-0 flex items-center justify-center`}>
        {getIconComponent(typeIcon, iconSize)}
      </div>

      {/* Link title */}
      <span className="flex-1 truncate font-medium">
        {title}
      </span>

      {/* Description (if present and space allows) */}
      {link.description && size === 'md' && (
        <>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span className="text-gray-500 dark:text-gray-400 truncate">
            {link.description}
          </span>
        </>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 ml-1">
        {showEdit && onEdit && (
          <button
            onClick={handleEdit}
            className={`${buttonSize} flex items-center justify-center
                       text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                       rounded-full hover:bg-gray-200 dark:hover:bg-gray-600
                       transition-colors`}
            title="Edit link"
            type="button"
          >
            <EditIcon className={buttonSize} />
          </button>
        )}

        {showRemove && onRemove && (
          <button
            onClick={handleRemove}
            className={`${buttonSize} flex items-center justify-center
                       text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
                       rounded-full hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors`}
            title="Remove link"
            type="button"
          >
            <XIcon className={buttonSize} />
          </button>
        )}
      </div>
    </div>
  );
}

// Icon components
function getIconComponent(iconName: string, className: string) {
  switch (iconName) {
    case 'article':
      return <ArticleIcon className={className} />;
    case 'science':
      return <ScienceIcon className={className} />;
    case 'code':
      return <CodeIcon className={className} />;
    case 'edit':
      return <EditDocIcon className={className} />;
    case 'bookmark':
      return <BookmarkIcon className={className} />;
    case 'folder':
      return <FolderIcon className={className} />;
    case 'link':
    default:
      return <LinkIcon className={className} />;
  }
}

function ArticleIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
}

function ScienceIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 3a1 1 0 011-1h2a1 1 0 011 1v1h3a1 1 0 110 2H7a1 1 0 110-2h1V3zM6 8a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-1 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm0 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function CodeIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function EditDocIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>
  );
}

function FolderIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function LinkIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    </svg>
  );
}

function EditIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function XIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}