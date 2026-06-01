"use client";

import React, { useEffect, useMemo, useRef } from "react";

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

const FONT_OPTIONS = [
  { label: "Be Vietnam Pro", value: "Be Vietnam Pro" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
];

const FONT_SIZE_OPTIONS = [
  { label: "13px", value: "13" },
  { label: "14px", value: "14" },
  { label: "16px", value: "16" },
  { label: "18px", value: "18" },
  { label: "20px", value: "20" },
  { label: "24px", value: "24" },
  { label: "28px", value: "28" },
];

export default function MarkdownEditor({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const minHeight = useMemo(() => Math.max(rows * 28, 160), [rows]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    savedRangeRef.current = selection.getRangeAt(0);
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const saved = savedRangeRef.current;
    if (!selection || !saved) return;
    selection.removeAllRanges();
    selection.addRange(saved);
  };

  const emitContent = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML === "<br>" ? "" : el.innerHTML;
    onChange(html);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const exec = (command: string, valueArg?: string) => {
    restoreSelection();
    focusEditor();
    document.execCommand(command, false, valueArg);
    emitContent();
    saveSelection();
  };

  const normalizeFontTags = () => {
    const el = editorRef.current;
    if (!el) return;
    const fontNodes = el.querySelectorAll("font");
    fontNodes.forEach((node) => {
      const span = document.createElement("span");
      const face = node.getAttribute("face");
      if (face) span.style.fontFamily = face.replace(/^['"]|['"]$/g, "");
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
  };

  const applyFontFamily = (fontFamily: string) => {
    if (!fontFamily) return;
    exec("fontName", fontFamily);
    normalizeFontTags();
    emitContent();
  };

  const applyFontSize = (fontSizePx: string) => {
    restoreSelection();
    focusEditor();
    document.execCommand("fontSize", false, "7");
    const el = editorRef.current;
    if (el) {
      const sizedNodes = el.querySelectorAll("font[size='7']");
      sizedNodes.forEach((node) => {
        const span = document.createElement("span");
        span.style.fontSize = `${fontSizePx}px`;
        span.innerHTML = node.innerHTML;
        node.replaceWith(span);
      });
    }
    emitContent();
    saveSelection();
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      <div
        className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700"
      >
        <div
          className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-white/3"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("bold")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Đậm"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("italic")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs italic text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Nghiêng"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("underline")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs underline text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Gạch chân"
          >
            U
          </button>
          <span className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyLeft")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Căn trái"
          >
            Trái
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyCenter")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Căn giữa"
          >
            Giữa
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyRight")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Căn phải"
          >
            Phải
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("justifyFull")}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            title="Căn đều"
          >
            Đều
          </button>
          <span className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <select
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            defaultValue=""
            onChange={(e) => {
              applyFontFamily(e.target.value);
              e.currentTarget.selectedIndex = 0;
            }}
          >
            <option value="" disabled>
              Font chữ
            </option>
            {FONT_OPTIONS.map((font) => (
              <option key={font.label} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            defaultValue=""
            onChange={(e) => {
              applyFontSize(e.target.value);
              e.currentTarget.selectedIndex = 0;
            }}
          >
            <option value="" disabled>
              Cỡ chữ
            </option>
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitContent}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={saveSelection}
          className="w-full px-3 py-2 text-sm text-gray-800 outline-none dark:text-gray-100"
          style={{ minHeight, whiteSpace: "pre-wrap" }}
          data-placeholder={placeholder ?? "Nhập nội dung..."}
        />
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        Bôi đen nội dung để đổi font, cỡ chữ và căn lề trực tiếp.
      </p>
    </div>
  );
}
