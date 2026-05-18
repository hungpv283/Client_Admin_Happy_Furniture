"use client";

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ContentBlockPayload } from "@/lib/api";

interface PreviewData {
  titleVi: string;
  titleEn?: string;
  excerptVi?: string;
  excerptEn?: string;
  imageUrl?: string;
  bannerUrl?: string;
  type: string;
  contentBlocks: ContentBlockPayload[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: PreviewData;
}

// ─── Content block renderers — clone 1:1 từ NewsDetail.tsx ───────────────────

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800&h=500";

function BlockText({ block }: { block: ContentBlockPayload }) {
  const title = block.titleVi;
  const content = block.contentVi;
  if (!title && !content) return null;
  return (
    <div className="mb-6">
      {title && (
        <h2
          style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif", color: "#3c4a28" }}
          className="font-bold text-lg md:text-xl leading-[1.3] tracking-[0.03em] mb-3"
        >
          {title}
        </h2>
      )}
      {content && (
        <div className="prose prose-sm max-w-none text-gray-600 leading-[1.88] text-justify hyphens-auto">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function BlockImageFull({ block }: { block: ContentBlockPayload }) {
  if (!block.imageUrl) return null;
  return (
    <div className="w-full bg-gray-200 overflow-hidden mb-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt={block.imageAltVi ?? ""}
        className="w-full object-cover h-[300px] md:h-[420px]"
        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
      />
    </div>
  );
}

function BlockImageSide({ block, reverse }: { block: ContentBlockPayload; reverse: boolean }) {
  const title = block.titleVi;
  const content = block.contentVi;
  return (
    <div className={`flex flex-col gap-5 mb-6 ${reverse ? "sm:flex-row-reverse" : "sm:flex-row"} sm:items-start`}>
      {block.imageUrl && (
        <div className="sm:w-[45%] shrink-0 overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.imageUrl}
            alt={block.imageAltVi ?? ""}
            className="w-full h-auto max-h-[360px] object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
        </div>
      )}
      {(title || content) && (
        <div className="flex flex-col flex-1">
          {title && (
            <h2
              className="font-bold text-lg leading-[1.3] tracking-[0.03em] mb-3"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif", color: "#3c4a28" }}
            >
              {title}
            </h2>
          )}
          {content && (
            <div className="prose prose-sm max-w-none text-gray-600 leading-[1.88] text-justify hyphens-auto">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BlockTextColumns({ block }: { block: ContentBlockPayload }) {
  const hasLeft = block.titleVi || block.contentVi;
  const hasRight = block.title2Vi || block.content2Vi;
  if (!hasLeft && !hasRight) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-6">
      {/* Cột trái */}
      <div className="flex-1">
        {block.titleVi && (
          <h2
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif", color: "#3c4a28" }}
            className="font-bold text-lg leading-[1.3] tracking-[0.03em] mb-3"
          >
            {block.titleVi}
          </h2>
        )}
        {block.contentVi && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-[1.88] text-justify hyphens-auto">
            <ReactMarkdown>{block.contentVi}</ReactMarkdown>
          </div>
        )}
      </div>
      {/* Đường kẻ giữa */}
      <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
      {/* Cột phải */}
      <div className="flex-1">
        {block.title2Vi && (
          <h2
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif", color: "#3c4a28" }}
            className="font-bold text-lg leading-[1.3] tracking-[0.03em] mb-3"
          >
            {block.title2Vi}
          </h2>
        )}
        {block.content2Vi && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-[1.88] text-justify hyphens-auto">
            <ReactMarkdown>{block.content2Vi}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockImageColumns({ block }: { block: ContentBlockPayload }) {
  const hasLeft = block.imageUrl;
  const hasRight = block.image2Url;
  if (!hasLeft && !hasRight) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Ảnh trái */}
      <div className="flex-1">
        {block.imageUrl ? (
          <div className="overflow-hidden rounded-sm bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.imageUrl}
              alt={block.imageAltVi ?? block.titleVi ?? ""}
              className="w-full h-auto max-h-[360px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>
          </div>
        )}
        {block.titleVi && (
          <p className="mt-2 text-xs text-gray-500 text-center italic">{block.titleVi}</p>
        )}
      </div>
      {/* Ảnh phải */}
      <div className="flex-1">
        {block.image2Url ? (
          <div className="overflow-hidden rounded-sm bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.image2Url}
              alt={block.image2AltVi ?? block.title2Vi ?? ""}
              className="w-full h-auto max-h-[360px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
            />
          </div>
        ) : (
          <div className="h-40 bg-gray-100 rounded flex items-center justify-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>
          </div>
        )}
        {block.title2Vi && (
          <p className="mt-2 text-xs text-gray-500 text-center italic">{block.title2Vi}</p>
        )}
      </div>
    </div>
  );
}

function renderBlock(block: ContentBlockPayload, index: number) {
  if (block.type === "Text") return <BlockText key={index} block={block} />;
  if (block.type === "TextColumns") return <BlockTextColumns key={index} block={block} />;
  if (block.type === "ImageColumns") return <BlockImageColumns key={index} block={block} />;
  if (block.type === "Image") {
    const pos = block.imagePosition ?? "full";
    if (pos === "left") return <BlockImageSide key={index} block={block} reverse={false} />;
    if (pos === "right") return <BlockImageSide key={index} block={block} reverse={true} />;
    return <BlockImageFull key={index} block={block} />;
  }
  return null;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function NewsPreviewModal({ open, onClose, data }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayImage = data.bannerUrl || data.imageUrl;

  const today = new Date().toLocaleDateString("vi-VN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Wrapper giả lập viewport user — max-w khớp với max-w-[1650px] của site */}
      <div className="relative mx-auto my-6 w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* ── Modal chrome: header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-700">Xem trước bài viết</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Draft</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Article body — clone 1:1 từ NewsDetail.tsx ── */}
        <div
          className="bg-white font-sans px-5 py-5 md:px-10 md:py-6"
          style={{ fontFamily: "'Be Vietnam Pro', 'Avenir Next', 'Montserrat', sans-serif" }}
        >
          {/* Tiêu đề */}
          <h1
            className="font-bold text-black text-xl md:text-[22px] leading-[1.22] tracking-[0.03em] mb-2 normal-case"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            {data.titleVi || <span className="italic text-gray-300">Chưa có tiêu đề...</span>}
          </h1>

          {/* Ngày đăng */}
          <p className="text-xs text-gray-400 mb-5 tracking-wide">{today}</p>

          {/* Banner / Hero Image */}
          {displayImage && (
            <div className="w-full h-[240px] md:h-[340px] bg-gray-200 overflow-hidden mb-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={data.titleVi}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
              />
            </div>
          )}

          {/* Content blocks */}
          {data.contentBlocks.length > 0 ? (
            <div className="space-y-2">
              {data.contentBlocks.map((block, i) => renderBlock(block, i))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">Chưa có nội dung. Hãy thêm block vào tab "Nội dung bài viết".</p>
            </div>
          )}
        </div>

        {/* ── Modal chrome: footer ── */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-center text-xs text-gray-400">
            Xem trước bài viết — sidebar tin liên quan không hiển thị ở đây
          </p>
        </div>
      </div>
    </div>
  );
}
