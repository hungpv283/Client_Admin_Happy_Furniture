"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[160px] w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
  ),
});

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const minHeight = rows * 28;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <div
        data-color-mode="light"
        className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 [&_.w-md-editor]:border-0! [&_.w-md-editor]:shadow-none! [&_.w-md-editor-toolbar]:border-b! [&_.w-md-editor-toolbar]:border-gray-200! [&_.w-md-editor-toolbar]:dark:border-gray-700! [&_.w-md-editor-toolbar]:bg-gray-50! [&_.w-md-editor-toolbar]:dark:bg-white/3!"
      >
        {mounted ? (
          <MDEditor
            value={value}
            onChange={(v) => onChange(v ?? "")}
            preview="edit"
            hideToolbar={false}
            visibleDragbar={false}
            textareaProps={{ placeholder: placeholder ?? "Nhập nội dung..." }}
            height={minHeight}
            style={{ fontSize: 13 }}
          />
        ) : (
          <div
            className="h-[160px] w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"
          />
        )}
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        Hỗ trợ Markdown: **đậm**, *nghiêng*, # Tiêu đề, ## Tiêu đề nhỏ, - danh sách
      </p>
    </div>
  );
}
