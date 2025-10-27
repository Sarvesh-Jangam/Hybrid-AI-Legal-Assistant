'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
  const normalizeMarkdown = (text) => {
    return text
      // Ensure every numbered item starts on its own line
      .replace(/(?<!\n)(\d+)\.\s*(?=\*\*|[A-Z])/g, '\n\n$1. ')

      // Normalize headings like "###" — ensure spacing
      .replace(/(?<!\n)###\s*/g, '\n\n### ')

      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')

      // Ensure "•", "*" become markdown bullets
      .replace(/^[*•+]\s+/gm, '- ')

      // Ensure "1.Item" → "1. Item"
      .replace(/(\d+)\.(?=[^\s])/g, '$1. ')

      .trim();
  };

  return (
    <div
      className="
        prose max-w-none leading-relaxed text-gray-800
        prose-h1:text-2xl prose-h1:font-bold prose-h1:text-blue-800 prose-h1:mb-3
        prose-h2:text-xl prose-h2:font-semibold prose-h2:text-blue-700 prose-h2:mt-6 prose-h2:mb-2
        prose-h3:text-lg prose-h3:font-semibold prose-h3:text-blue-600 prose-h3:mt-4 prose-h3:mb-1
        prose-p:text-[15px] prose-p:my-1 prose-p:text-gray-800
        prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-li:text-[15px]
        prose-ul:list-disc prose-ul:pl-6
      "
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
