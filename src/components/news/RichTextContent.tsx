"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";

interface RichTextContentProps {
  content?: string | null;
  className?: string;
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export default function RichTextContent({ content, className }: RichTextContentProps) {
  const value = content ?? "";
  const hasHtml = HTML_TAG_PATTERN.test(value);

  const sanitizedHtml = useMemo(() => {
    if (!hasHtml) return "";
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u", "span", "div", "blockquote",
        "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "a",
      ],
      ALLOWED_ATTR: ["style", "href", "target", "rel"],
    });
  }, [hasHtml, value]);

  if (!value) return null;

  if (hasHtml) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }

  return (
    <div className={className}>
      <ReactMarkdown>{value}</ReactMarkdown>
    </div>
  );
}
