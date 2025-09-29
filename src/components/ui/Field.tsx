import React from 'react'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  hint,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {hint}
        </p>
      )}
    </div>
  )
}

export default Field