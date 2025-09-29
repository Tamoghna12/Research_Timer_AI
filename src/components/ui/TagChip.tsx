import React from 'react'

interface TagChipProps {
  tag: string
  onRemove: (tag: string) => void
  className?: string
}

const TagChip: React.FC<TagChipProps> = ({
  tag,
  onRemove,
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-600 ${className}`}
    >
      {tag}
      <button
        type="button"
        onClick={() => onRemove(tag)}
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-600/20 focus:outline-none focus:ring-1 focus:ring-blue-600"
        aria-label={`Remove ${tag}`}
      >
        <span className="material-icons text-xs">
          close
        </span>
      </button>
    </span>
  )
}

export default TagChip