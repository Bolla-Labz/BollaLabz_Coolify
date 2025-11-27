// Last Modified: 2025-11-23 17:30
/**
 * SimpleMarkdown Component
 * Lightweight markdown renderer with XSS protection
 */

import React from 'react';
import { sanitizeHTML } from '@/lib/security/xss';

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content, className }) => {
  // Basic markdown parsing
  const parseMarkdown = (text: string) => {
    // Split by code blocks first
    const parts = text.split(/```(\w*)\n([\s\S]*?)```/g);

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Regular text
        if (parts[i]) {
          // Process markdown and sanitize the HTML
          const processedHtml = (parts[i] || '')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">$1</code>')
            // Headers
            .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
            // Lists
            .replace(/^- (.*?)$/gm, '<li class="ml-4">• $1</li>')
            .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4">$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p class="mb-2">')
            .replace(/\n/g, '<br />');

          // Sanitize the HTML before rendering
          const sanitizedHtml = sanitizeHTML(processedHtml, {
            ALLOWED_TAGS: [
              'p', 'br', 'span', 'div', 'a', 'strong', 'em', 'u', 's',
              'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2',
              'h3', 'h4', 'h5', 'h6'
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
            KEEP_CONTENT: true,
          });

          elements.push(
            <div key={i} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
          );
        }
      } else if (i % 3 === 1) {
        // Language identifier (skip)
        continue;
      } else if (i % 3 === 2) {
        // Code block
        const language = parts[i - 1] || 'text';
        elements.push(
          <pre key={i} className="my-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono">
              {parts[i]}
            </code>
          </pre>
        );
      }
    }

    return elements;
  };

  return (
    <div className={className}>
      {parseMarkdown(content)}
    </div>
  );
};

export default SimpleMarkdown;