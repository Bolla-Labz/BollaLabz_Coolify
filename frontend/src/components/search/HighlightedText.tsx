// Last Modified: 2025-11-24 16:54
/**
 * HighlightedText Component
 *
 * Philosophy: "Human-First Design" - Make search results scannable.
 * Highlighted matches should stand out without being jarring.
 *
 * Features:
 * - Preserves original text case
 * - Multiple term highlighting with different colors
 * - Smooth transitions
 * - Accessibility friendly (uses <mark> semantic element)
 */

import React from 'react';
import { getHighlightedSegments } from '@/lib/search/FuseSearchProvider';
import type Fuse from 'fuse.js';

interface HighlightedTextProps {
  text: string;
  matches?: Fuse.FuseResultMatch[];
  className?: string;
  highlightClassName?: string;
  maxLength?: number; // Truncate long text
}

/**
 * Render text with highlighted matched segments
 */
export function HighlightedText({
  text,
  matches,
  className = '',
  highlightClassName = '',
  maxLength,
}: HighlightedTextProps) {
  const segments = getHighlightedSegments(text, matches);

  // Truncate if needed
  let displayText = text;
  let wasTruncated = false;
  if (maxLength && text.length > maxLength) {
    displayText = text.slice(0, maxLength);
    wasTruncated = true;
  }

  return (
    <span className={`highlighted-text ${className}`}>
      {segments.map((segment, index) => {
        if (segment.highlight) {
          return (
            <mark
              key={index}
              className={`
                bg-yellow-200 dark:bg-yellow-900/40
                text-inherit
                px-0.5 rounded
                transition-colors duration-150
                ${highlightClassName}
              `}
            >
              {segment.text}
            </mark>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
      {wasTruncated && <span className="text-muted-foreground">...</span>}
    </span>
  );
}

/**
 * Multi-colored highlighting for different terms
 * Useful when showing multiple search terms
 */
interface MultiHighlightProps {
  text: string;
  terms: string[];
  className?: string;
}

const HIGHLIGHT_COLORS = [
  'bg-yellow-200 dark:bg-yellow-900/40',
  'bg-blue-200 dark:bg-blue-900/40',
  'bg-green-200 dark:bg-green-900/40',
  'bg-purple-200 dark:bg-purple-900/40',
  'bg-pink-200 dark:bg-pink-900/40',
];

export function MultiHighlight({ text, terms, className = '' }: MultiHighlightProps) {
  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Create map of position -> term index
  const highlights: Array<{
    start: number;
    end: number;
    termIndex: number;
  }> = [];

  terms.forEach((term, termIndex) => {
    const termLower = term.toLowerCase();
    const textLower = text.toLowerCase();
    let pos = 0;

    while ((pos = textLower.indexOf(termLower, pos)) !== -1) {
      highlights.push({
        start: pos,
        end: pos + term.length,
        termIndex,
      });
      pos += term.length;
    }
  });

  // Sort by position
  highlights.sort((a, b) => a.start - b.start);

  // Merge overlapping highlights
  const merged: typeof highlights = [];
  highlights.forEach((h) => {
    if (merged.length === 0) {
      merged.push(h);
    } else {
      const last = merged[merged.length - 1];
      if (h.start <= last.end) {
        // Overlapping - extend last
        last.end = Math.max(last.end, h.end);
      } else {
        merged.push(h);
      }
    }
  });

  // Build segments
  const segments: React.ReactNode[] = [];
  let lastPos = 0;

  merged.forEach((h, index) => {
    // Add text before highlight
    if (h.start > lastPos) {
      segments.push(<span key={`text-${index}`}>{text.slice(lastPos, h.start)}</span>);
    }

    // Add highlighted segment
    const colorClass = HIGHLIGHT_COLORS[h.termIndex % HIGHLIGHT_COLORS.length];
    segments.push(
      <mark
        key={`mark-${index}`}
        className={`${colorClass} text-inherit px-0.5 rounded transition-colors duration-150`}
      >
        {text.slice(h.start, h.end)}
      </mark>
    );

    lastPos = h.end;
  });

  // Add remaining text
  if (lastPos < text.length) {
    segments.push(<span key="text-final">{text.slice(lastPos)}</span>);
  }

  return <span className={className}>{segments}</span>;
}

/**
 * Highlighted snippet with context
 * Shows text around match for better context
 */
interface SnippetProps {
  text: string;
  matches?: Fuse.FuseResultMatch[];
  contextLength?: number; // Characters before/after match
  className?: string;
}

export function HighlightedSnippet({
  text,
  matches,
  contextLength = 50,
  className = '',
}: SnippetProps) {
  if (!matches || matches.length === 0) {
    // No matches - show beginning
    const snippet =
      text.length > contextLength * 2
        ? text.slice(0, contextLength * 2) + '...'
        : text;
    return <span className={className}>{snippet}</span>;
  }

  // Find first match position
  const firstMatch = matches[0];
  const indices = firstMatch.indices?.[0];
  if (!indices) {
    return <HighlightedText text={text} matches={matches} className={className} />;
  }

  const matchStart = indices[0];
  const matchEnd = indices[1];

  // Calculate snippet bounds
  const snippetStart = Math.max(0, matchStart - contextLength);
  const snippetEnd = Math.min(text.length, matchEnd + contextLength);

  const snippet = text.slice(snippetStart, snippetEnd);
  const prefix = snippetStart > 0 ? '...' : '';
  const suffix = snippetEnd < text.length ? '...' : '';

  // Adjust match indices for snippet
  const adjustedMatches = matches.map((match) => ({
    ...match,
    indices: match.indices?.map(([start, end]) => [
      Math.max(0, start - snippetStart),
      Math.min(snippet.length, end - snippetStart),
    ] as [number, number]),
  }));

  return (
    <span className={className}>
      <span className="text-muted-foreground">{prefix}</span>
      <HighlightedText text={snippet} matches={adjustedMatches} />
      <span className="text-muted-foreground">{suffix}</span>
    </span>
  );
}

export default HighlightedText;
