import React, { useState } from 'react';

interface AuthorDisplayProps {
  authors?: string[];
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export const AuthorDisplay: React.FC<AuthorDisplayProps> = ({
  authors,
  className = 'text-[11px] text-gray-400',
  labelClassName = 'text-gray-400',
  valueClassName = 'text-gray-700 font-semibold'
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return null;
  }

  const valid = authors.map((a) => (typeof a === 'string' ? a.trim() : '')).filter(Boolean);
  if (valid.length === 0) {
    return null;
  }

  const fullList = valid.join(', ');
  const hasMore = valid.length > 3;
  const shortList = hasMore ? `${valid.slice(0, 3).join(', ')} et al.` : fullList;

  return (
    <p className={`flex flex-wrap items-center gap-1 ${className}`}>
      <span className={labelClassName}>Authors:</span>
      <span
        title={hasMore ? `Full author list: ${fullList}` : undefined}
        className={`${valueClassName} cursor-help transition-colors`}
        onClick={(e) => {
          if (hasMore) {
            e.stopPropagation();
            setExpanded(!expanded);
          }
        }}
      >
        {expanded ? fullList : shortList}
      </span>
      {hasMore && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-[10px] text-[#0B6BE6] hover:underline font-bold cursor-pointer inline-flex items-center ml-0.5"
          title={expanded ? 'Collapse author list' : 'View all authors'}
        >
          {expanded ? '(show less)' : `(${valid.length} authors)`}
        </button>
      )}
    </p>
  );
};
