"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createNews, getNewsById, updateNews } from "@/lib/api";
import type { ContentBlockPayload, NewsDetail, NewsPayload } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ImageUploadField from "@/components/news/ImageUploadField";
import NewsPreviewModal from "@/components/news/NewsPreviewModal";
import MarkdownEditor from "@/components/news/MarkdownEditor";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const DRAG_TYPE = "CONTENT_BLOCK";

interface Props {
  mode: "create" | "edit";
  newsId?: number;
}

type ImagePosition = "full" | "left" | "right";

const BLOCK_LAYOUT_OPTIONS: { value: ImagePosition; label: string; icon: React.ReactNode }[] = [
  {
    value: "full",
    label: "Ảnh toàn chiều rộng",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="5" width="20" height="14" rx="1" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    value: "left",
    label: "Ảnh trái, chữ phải",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="2" y="4" width="9" height="16" rx="1" />
        <path d="M14 8h8M14 12h8M14 16h5" />
      </svg>
    ),
  },
  {
    value: "right",
    label: "Chữ trái, ảnh phải",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="13" y="4" width="9" height="16" rx="1" />
        <path d="M2 8h9M2 12h9M2 16h6" />
      </svg>
    ),
  },
];

const BLOCK_TYPE_OPTIONS = [
  {
    value: "Text",
    label: "Đoạn văn",
    desc: "Tiêu đề + nội dung văn bản",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 10h18M3 14h12M3 18h8" />
      </svg>
    ),
  },
  {
    value: "Image",
    label: "Hình ảnh",
    desc: "Ảnh với bố cục tuỳ chỉnh",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
];

interface DraggableBlockWrapperProps {
  index: number;
  moveBlock: (from: number, to: number) => void;
  children: (dragHandleRef: React.Ref<HTMLDivElement>, isDragging: boolean) => React.ReactNode;
}

function DraggableBlockWrapper({ index, moveBlock, children }: DraggableBlockWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop<{ index: number }, void, Record<string, never>>({
    accept: DRAG_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveBlock(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(handleRef);
  drop(dragPreview(ref));

  return (
    <div
      ref={ref}
      className={`transition-opacity ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      {children(handleRef, isDragging)}
    </div>
  );
}

function BlockTypeButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
        selected
          ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function NewsForm({ mode, newsId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [titleVi, setTitleVi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [metaTitleVi, setMetaTitleVi] = useState("");
  const [metaTitleEn, setMetaTitleEn] = useState("");
  const [metaDescriptionVi, setMetaDescriptionVi] = useState("");
  const [metaDescriptionEn, setMetaDescriptionEn] = useState("");
  const [excerptVi, setExcerptVi] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [type, setType] = useState("News");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");
  const [activeTab, setActiveTab] = useState<"info" | "content" | "seo">("info");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [contentBlocks, setContentBlocks] = useState<ContentBlockPayload[]>([
    { type: "Text", titleVi: "", titleEn: "", contentVi: "", contentEn: "", sortOrder: 0, isFullWidth: false },
  ]);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [confirmDeleteBlockIndex, setConfirmDeleteBlockIndex] = useState<number | null>(null);

  const toggleCollapse = (index: number) => {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  useEffect(() => {
    if (mode !== "edit" || !newsId) return;
    setFetching(true);
    getNewsById(newsId)
      .then((item) => {
        const detail = item as NewsDetail;
        setTitleVi(detail.titleVi);
        setTitleEn(detail.titleEn ?? "");
        setSlug(detail.slug);
        setMetaTitleVi(detail.metaTitleVi ?? "");
        setMetaTitleEn(detail.metaTitleEn ?? "");
        setMetaDescriptionVi(detail.metaDescriptionVi ?? "");
        setMetaDescriptionEn(detail.metaDescriptionEn ?? "");
        setExcerptVi(detail.excerptVi ?? "");
        setExcerptEn(detail.excerptEn ?? "");
        setImageUrl(detail.imageUrl ?? "");
        setBannerUrl(detail.bannerUrl ?? "");
        setType(detail.type);
        setSortOrder(typeof detail.sortOrder === "number" ? detail.sortOrder : 0);
        setIsActive(typeof detail.isActive === "boolean" ? detail.isActive : true);

        if (detail.contentBlocks && detail.contentBlocks.length > 0) {
          setContentBlocks(
            detail.contentBlocks.map((cb) => ({
              type: cb.type as "Text" | "Image",
              titleVi: cb.titleVi ?? "",
              titleEn: cb.titleEn ?? "",
              contentVi: cb.contentVi ?? "",
              contentEn: cb.contentEn ?? "",
              imageUrl: cb.imageUrl ?? "",
              imageAltVi: cb.imageAltVi ?? "",
              imageAltEn: cb.imageAltEn ?? "",
              imagePosition: (cb.imagePosition ?? "full") as "full" | "left" | "right",
              sortOrder: cb.sortOrder,
              isFullWidth: cb.isFullWidth,
            }))
          );
        } else {
          setContentBlocks([{ type: "Text", titleVi: "", titleEn: "", contentVi: "", contentEn: "", sortOrder: 0, isFullWidth: false }]);
        }
      })
      .catch(() => toastError("Không thể tải thông tin tin tức"))
      .finally(() => setFetching(false));
  }, [newsId, mode, toastError]);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleTitleViChange = (val: string) => {
    setTitleVi(val);
    if (!slug || slug === generateSlug(titleVi)) {
      setSlug(generateSlug(val));
    }
  };

  const addContentBlock = (blockType: "Text" | "Image") => {
    setContentBlocks([
      ...contentBlocks,
      {
        type: blockType,
        titleVi: "",
        titleEn: "",
        contentVi: "",
        contentEn: "",
        imageUrl: "",
        imageAltVi: "",
        imageAltEn: "",
        imagePosition: blockType === "Image" ? "full" : undefined,
        sortOrder: contentBlocks.length,
        isFullWidth: blockType === "Image",
      },
    ]);
  };

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length <= 1) return;
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
    setCollapsedBlocks((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => { if (i < index) next.add(i); else if (i > index) next.add(i - 1); });
      return next;
    });
  };

  const confirmRemoveContentBlock = () => {
    if (confirmDeleteBlockIndex === null) return;
    removeContentBlock(confirmDeleteBlockIndex);
    setConfirmDeleteBlockIndex(null);
  };

  const moveBlock = useCallback((from: number, to: number) => {
    if (to < 0 || to >= contentBlocks.length) return;
    setContentBlocks((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, [contentBlocks.length]);

  const moveBlockByDir = (index: number, dir: -1 | 1) => moveBlock(index, index + dir);

  const updateBlock = (index: number, field: keyof ContentBlockPayload, value: string | number | boolean) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "type") {
      if (value === "Image") {
        updated[index].imagePosition = updated[index].imagePosition ?? "full";
        updated[index].isFullWidth = true;
      }
    }
    if (field === "imagePosition") {
      updated[index].isFullWidth = value === "full";
    }
    setContentBlocks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: NewsPayload = {
        titleVi: titleVi.trim(),
        titleEn: titleEn.trim() || undefined,
        slug: slug.trim(),
        metaTitleVi: metaTitleVi.trim() || undefined,
        metaTitleEn: metaTitleEn.trim() || undefined,
        metaDescriptionVi: metaDescriptionVi.trim() || undefined,
        metaDescriptionEn: metaDescriptionEn.trim() || undefined,
        excerptVi: excerptVi.trim() || undefined,
        excerptEn: excerptEn.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        isActive,
        sortOrder,
        type,
        contentBlocks: contentBlocks.map((cb, index) => ({ ...cb, sortOrder: index })),
      };

      if (mode === "create") {
        await createNews(payload);
      } else {
        await updateNews(newsId!, payload);
      }

      success(mode === "create" ? "Tạo tin tức thành công" : "Cập nhật tin tức thành công");
      router.push("/news");
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";
  const textareaCls =
    "w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";
  const smallInputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";
  const smallLabelCls = "mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400";

  const pendingDeleteBlock =
    confirmDeleteBlockIndex !== null ? contentBlocks[confirmDeleteBlockIndex] : null;
  const pendingDeleteLabel =
    pendingDeleteBlock?.type === "Image"
      ? `Ảnh${pendingDeleteBlock.titleVi ? ` — ${pendingDeleteBlock.titleVi}` : ""}`
      : `Văn bản${pendingDeleteBlock?.titleVi ? ` — ${pendingDeleteBlock.titleVi}` : ""}`;

  return (
    <div>
      <ConfirmDialog
        open={confirmDeleteBlockIndex !== null}
        title="Xoá block nội dung"
        message={
          confirmDeleteBlockIndex !== null
            ? `Xoá block #${confirmDeleteBlockIndex + 1} (${pendingDeleteLabel})? Nội dung block sẽ mất và không thể hoàn tác.`
            : ""
        }
        confirmLabel="Xoá block"
        onConfirm={confirmRemoveContentBlock}
        onCancel={() => setConfirmDeleteBlockIndex(null)}
      />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {mode === "create" ? "Thêm tin tức mới" : "Chỉnh sửa tin tức"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Xem trước
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-white/[0.02]">
          {(
            [
              { key: "info", label: "Thông tin chung" },
              { key: "content", label: "Nội dung bài viết" },
              { key: "seo", label: "SEO & Meta" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Thông tin chung */}
        {activeTab === "info" && (
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Tiêu đề */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Tiêu đề (VI) <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleVi}
                  onChange={(e) => handleTitleViChange(e.target.value)}
                  required
                  placeholder="Nhập tiêu đề tiếng Việt"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tiêu đề (EN)</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="English title"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className={labelCls}>
                Slug <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                required
                placeholder="duong-dan-url"
                className={`${inputCls} font-mono`}
              />
            </div>

            {/* Loại + Thứ tự */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Loại <span className="text-error-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="News">Tin tức (News)</option>
                  <option value="CompanyActivity">Hoạt động công ty (CompanyActivity)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  min="0"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Mô tả ngắn */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Mô tả ngắn (VI)</label>
                <textarea value={excerptVi} onChange={(e) => setExcerptVi(e.target.value)} rows={3} placeholder="Tóm tắt bài viết tiếng Việt" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>Mô tả ngắn (EN)</label>
                <textarea value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} rows={3} placeholder="Short summary in English" className={textareaCls} />
              </div>
            </div>

            {/* Ảnh đại diện + Banner — full width để preview đủ lớn; có cắt ảnh */}
            <div className="grid grid-cols-1 gap-8">
              <ImageUploadField
                label="Ảnh đại diện (Thumbnail)"
                value={imageUrl}
                onChange={setImageUrl}
                placeholder="https://example.com/thumbnail.jpg"
                previewMaxHeight={300}
                folder="news"
                enableCrop
              />
              <ImageUploadField
                label="Banner (ảnh lớn trang chi tiết)"
                value={bannerUrl}
                onChange={setBannerUrl}
                placeholder="https://example.com/banner.jpg"
                previewMaxHeight={440}
                folder="news"
                enableCrop
              />
            </div>

            {/* Trạng thái */}
            <div>
              <label className="flex cursor-pointer items-center gap-3">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <div className={`h-6 w-11 rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                  <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  {isActive ? "Đang hiển thị" : "Đang ẩn"}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB: Nội dung bài viết */}
        {activeTab === "content" && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Bố cục bài viết</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thêm các block để tạo bố cục như bài báo thật</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => addContentBlock(opt.value as "Text" | "Image")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                  >
                    {opt.icon}
                    + {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocks */}
            <DndProvider backend={HTML5Backend}>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {contentBlocks.map((block, index) => (
                <DraggableBlockWrapper key={index} index={index} moveBlock={moveBlock}>
                  {(dragHandleRef, isDragging) => (
                <div className={`px-6 py-5 ${isDragging ? "bg-gray-50 dark:bg-white/[0.01]" : ""}`}>
                  {/* Block header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Drag handle */}
                      <div
                        ref={dragHandleRef}
                        className="cursor-grab active:cursor-grabbing rounded p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Kéo để sắp xếp"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="9" cy="6" r="1.5" />
                          <circle cx="15" cy="6" r="1.5" />
                          <circle cx="9" cy="12" r="1.5" />
                          <circle cx="15" cy="12" r="1.5" />
                          <circle cx="9" cy="18" r="1.5" />
                          <circle cx="15" cy="18" r="1.5" />
                        </svg>
                      </div>
                      {/* Số thứ tự */}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        {index + 1}
                      </span>
                      {/* Block type tabs */}
                      <div className="flex gap-1">
                        {BLOCK_TYPE_OPTIONS.map((opt) => (
                          <BlockTypeButton
                            key={opt.value}
                            selected={block.type === opt.value}
                            onClick={() => updateBlock(index, "type", opt.value)}
                          >
                            {opt.icon}
                            {opt.label}
                          </BlockTypeButton>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlockByDir(index, -1)}
                        disabled={index === 0}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-white/10"
                        title="Di lên"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlockByDir(index, 1)}
                        disabled={index === contentBlocks.length - 1}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-20 dark:hover:bg-white/10"
                        title="Di xuống"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {/* Divider */}
                      <span className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
                      {/* Collapse / Expand */}
                      <div className="relative group/tooltip">
                        <button
                          type="button"
                          onClick={() => toggleCollapse(index)}
                          className={`rounded-lg p-1.5 transition-colors ${
                            collapsedBlocks.has(index)
                              ? "bg-brand-50 text-brand-500 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                          }`}
                        >
                          {collapsedBlocks.has(index) ? (
                            /* Icon "mở rộng" — hai mũi tên hướng ra ngoài */
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3" />
                            </svg>
                          ) : (
                            /* Icon "thu nhỏ" — hai mũi tên hướng vào trong */
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5M9 9H5M9 9L4 4M15 9h4M15 9V5M15 9l5-5M9 15H5M9 15v4M9 15l-5 5M15 15l5 5M15 15v4M15 15h4" />
                            </svg>
                          )}
                        </button>
                        {/* Tooltip */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/tooltip:opacity-100 dark:bg-gray-700">
                          {collapsedBlocks.has(index) ? "Mở rộng" : "Thu nhỏ"}
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700" />
                        </div>
                      </div>
                      {/* Divider */}
                      <span className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteBlockIndex(index)}
                        disabled={contentBlocks.length <= 1}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-20 dark:hover:bg-red-900/20"
                        title="Xoá block"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Preview khi block đang collapsed */}
                  {collapsedBlocks.has(index) && (
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.02]">
                      {block.type === "Image" && block.imageUrl ? (
                        <div className="h-8 w-12 shrink-0 overflow-hidden rounded bg-gray-200">
                          <img src={block.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h18M3 10h18M3 14h12M3 18h8" />
                        </svg>
                      )}
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {block.titleVi || block.contentVi?.slice(0, 80) || block.imageAltVi || (block.type === "Image" ? "Ảnh chưa có tiêu đề" : "Đoạn văn trống")}
                      </span>
                    </div>
                  )}

                  {/* Block content — ẩn khi collapsed */}
                  <div className={`overflow-hidden transition-all duration-300 ${collapsedBlocks.has(index) ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[9999px] opacity-100"}`}>

                  {/* Block content: Text */}
                  {block.type === "Text" && (
                    <div className="space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className={smallLabelCls}>Tiêu đề đoạn (VI)</label>
                          <input type="text" value={block.titleVi ?? ""} onChange={(e) => updateBlock(index, "titleVi", e.target.value)} placeholder="Tiêu đề đoạn tiếng Việt (tuỳ chọn)" className={smallInputCls} />
                        </div>
                        <div>
                          <label className={smallLabelCls}>Tiêu đề đoạn (EN)</label>
                          <input type="text" value={block.titleEn ?? ""} onChange={(e) => updateBlock(index, "titleEn", e.target.value)} placeholder="Section title in English (optional)" className={smallInputCls} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MarkdownEditor
                          label="Nội dung (VI)"
                          value={block.contentVi ?? ""}
                          onChange={(v) => updateBlock(index, "contentVi", v)}
                          placeholder="Viết nội dung tiếng Việt..."
                          rows={7}
                        />
                        <MarkdownEditor
                          label="Nội dung (EN)"
                          value={block.contentEn ?? ""}
                          onChange={(v) => updateBlock(index, "contentEn", v)}
                          placeholder="Write content in English..."
                          rows={7}
                        />
                      </div>
                    </div>
                  )}

                  {/* Block content: Image */}
                  {block.type === "Image" && (
                    <div className="space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
                      {/* Layout selector */}
                      <div>
                        <label className={`${smallLabelCls} mb-2`}>Bố cục ảnh</label>
                        <div className="flex flex-wrap gap-2">
                          {BLOCK_LAYOUT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateBlock(index, "imagePosition", opt.value)}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                (block.imagePosition ?? "full") === opt.value
                                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400"
                              }`}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Image URL / Upload + Alt text */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <ImageUploadField
                          label="Ảnh"
                          value={block.imageUrl ?? ""}
                          onChange={(url) => updateBlock(index, "imageUrl", url)}
                          placeholder="https://example.com/image.jpg"
                          previewMaxHeight={360}
                          folder="news"
                          enableCrop
                        />
                        <div className="space-y-3 pt-6">
                          <div>
                            <label className={smallLabelCls}>Alt text (VI)</label>
                            <input type="text" value={block.imageAltVi ?? ""} onChange={(e) => updateBlock(index, "imageAltVi", e.target.value)} placeholder="Mô tả ảnh tiếng Việt (SEO)" className={smallInputCls} />
                          </div>
                          <div>
                            <label className={smallLabelCls}>Alt text (EN)</label>
                            <input type="text" value={block.imageAltEn ?? ""} onChange={(e) => updateBlock(index, "imageAltEn", e.target.value)} placeholder="Image alt text in English (SEO)" className={smallInputCls} />
                          </div>
                        </div>
                      </div>

                      {/* Caption / text alongside image (for left/right layout) */}
                      {(block.imagePosition === "left" || block.imagePosition === "right") && (
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Nội dung bên cạnh ảnh
                            </span>
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className={smallLabelCls}>Tiêu đề (VI)</label>
                              <input type="text" value={block.titleVi ?? ""} onChange={(e) => updateBlock(index, "titleVi", e.target.value)} placeholder="Tiêu đề" className={smallInputCls} />
                            </div>
                            <div>
                              <label className={smallLabelCls}>Tiêu đề (EN)</label>
                              <input type="text" value={block.titleEn ?? ""} onChange={(e) => updateBlock(index, "titleEn", e.target.value)} placeholder="Title" className={smallInputCls} />
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <MarkdownEditor
                              label="Nội dung bên cạnh (VI)"
                              value={block.contentVi ?? ""}
                              onChange={(v) => updateBlock(index, "contentVi", v)}
                              placeholder="Viết nội dung tiếng Việt bên cạnh ảnh..."
                              rows={5}
                            />
                            <MarkdownEditor
                              label="Nội dung bên cạnh (EN)"
                              value={block.contentEn ?? ""}
                              onChange={(v) => updateBlock(index, "contentEn", v)}
                              placeholder="Write content in English next to image..."
                              rows={5}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  </div>{/* end collapse wrapper */}
                </div>
                  )}
                </DraggableBlockWrapper>
              ))}
            </div>
            </DndProvider>

            {/* Empty state */}
            {contentBlocks.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">Chưa có block nào. Hãy thêm đoạn văn hoặc ảnh.</p>
              </div>
            )}

            {/* Live Preview */}
            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-800">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Xem trước bố cục</p>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                <div className="space-y-4">
                  {contentBlocks.map((block, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/5">
                      {block.type === "Text" ? (
                        <div>
                          {block.titleVi && <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">{block.titleVi}</p>}
                          {block.contentVi ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{block.contentVi}</p>
                          ) : (
                            <p className="text-xs italic text-gray-300">Đoạn văn trống...</p>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`flex gap-3 ${
                            block.imagePosition === "right" ? "flex-row-reverse" : block.imagePosition === "left" ? "flex-row" : "flex-col"
                          }`}
                        >
                          <div
                            className={`overflow-hidden rounded bg-gray-100 dark:bg-white/10 ${
                              block.imagePosition === "full" ? "h-16 w-full" : "h-14 w-24 flex-shrink-0"
                            } flex items-center justify-center`}
                          >
                            {block.imageUrl ? (
                              <Image src={block.imageUrl} alt="preview" width={96} height={56} className="h-full w-full object-cover" unoptimized />
                            ) : (
                              <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                              </svg>
                            )}
                          </div>
                          {(block.imagePosition === "left" || block.imagePosition === "right") && (
                            <div className="flex-1">
                              {block.titleVi && <p className="mb-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">{block.titleVi}</p>}
                              {block.contentVi ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{block.contentVi}</p>
                              ) : (
                                <p className="text-xs italic text-gray-300">Chữ bên cạnh ảnh...</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SEO & Meta */}
        {activeTab === "seo" && (
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Meta Title (VI)</label>
                <input type="text" value={metaTitleVi} onChange={(e) => setMetaTitleVi(e.target.value)} placeholder="Tiêu đề SEO tiếng Việt" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Title (EN)</label>
                <input type="text" value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} placeholder="SEO title in English" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Meta Description (VI)</label>
                <textarea value={metaDescriptionVi} onChange={(e) => setMetaDescriptionVi(e.target.value)} rows={3} placeholder="Mô tả SEO tiếng Việt" className={textareaCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Description (EN)</label>
                <textarea value={metaDescriptionEn} onChange={(e) => setMetaDescriptionEn(e.target.value)} rows={3} placeholder="SEO description in English" className={textareaCls} />
              </div>
            </div>

            {/* SEO Preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Xem trước kết quả Google</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">https://happyfurniture.vn/news/{slug || "duong-dan-bai-viet"}</p>
                <p className="text-base font-medium text-blue-600 dark:text-blue-400">{metaTitleVi || titleVi || "Tiêu đề bài viết"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {metaDescriptionVi || excerptVi || "Mô tả ngắn về bài viết sẽ hiển thị trên kết quả tìm kiếm Google..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">
            {loading ? "Đang lưu..." : mode === "create" ? "Tạo bài viết" : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Xem trước
          </button>
          <Link href="/news" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
            Hủy
          </Link>
        </div>
      </form>

      {/* Preview Modal */}
      <NewsPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          titleVi,
          titleEn,
          excerptVi,
          excerptEn,
          imageUrl,
          bannerUrl,
          type,
          contentBlocks,
        }}
      />
    </div>
  );
}
