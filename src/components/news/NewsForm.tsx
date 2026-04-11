"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createNews, getNewsById, updateNews } from "@/lib/api";
import type { ContentBlockPayload, NewsDetail, NewsPayload } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  newsId?: number;
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
  const [imageError, setImageError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [type, setType] = useState("News");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  // Content Blocks state
  const [contentBlocks, setContentBlocks] = useState<ContentBlockPayload[]>([
    { type: "Text", titleVi: "", titleEn: "", contentVi: "", contentEn: "", sortOrder: 0, isFullWidth: false }
  ]);

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
        setImageError(false);
        setBannerError(false);
        setType(detail.type);
        setSortOrder(detail.sortOrder);
        setIsActive(detail.isActive);

        // Load content blocks
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

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleViChange = (val: string) => {
    setTitleVi(val);
    if (!slug || slug === generateSlug(titleVi)) {
      setSlug(generateSlug(val));
    }
  };

  const addContentBlock = () => {
    setContentBlocks([
      ...contentBlocks,
      { type: "Text", titleVi: "", titleEn: "", contentVi: "", contentEn: "", sortOrder: contentBlocks.length, isFullWidth: false }
    ]);
  };

  const removeContentBlock = (index: number) => {
    if (contentBlocks.length <= 1) return;
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const updateContentBlock = (index: number, field: keyof ContentBlockPayload, value: string | number | boolean) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], [field]: value };
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

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tiêu đề */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tiêu đề (VI) <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={titleVi}
                onChange={(e) => handleTitleViChange(e.target.value)}
                required
                placeholder="Nhập tiêu đề tiếng Việt"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tiêu đề (EN)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English title"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Slug <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              required
              placeholder="duong-dan-url"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
            />
          </div>

          {/* Loại + Thứ tự */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Thứ tự sắp xếp
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Meta Title */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Meta Title (VI)
              </label>
              <input
                type="text"
                value={metaTitleVi}
                onChange={(e) => setMetaTitleVi(e.target.value)}
                placeholder="Tiêu đề SEO tiếng Việt"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Meta Title (EN)
              </label>
              <input
                type="text"
                value={metaTitleEn}
                onChange={(e) => setMetaTitleEn(e.target.value)}
                placeholder="SEO title in English"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Meta Description */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Meta Description (VI)
              </label>
              <textarea
                value={metaDescriptionVi}
                onChange={(e) => setMetaDescriptionVi(e.target.value)}
                rows={2}
                placeholder="Mô tả SEO tiếng Việt"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Meta Description (EN)
              </label>
              <textarea
                value={metaDescriptionEn}
                onChange={(e) => setMetaDescriptionEn(e.target.value)}
                rows={2}
                placeholder="SEO description in English"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Image URL + Banner URL */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Banner URL (Ảnh lớn trang chi tiết)
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => { setBannerUrl(e.target.value); setBannerError(false); }}
                placeholder="https://example.com/banner.jpg"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Image Preview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Xem trước Thumbnail
              </label>
              {imageUrl && !imageError ? (
                <div className="relative h-[120px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                  <span className="text-xs text-gray-400">Nhập URL để xem trước</span>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Xem trước Banner
              </label>
              {bannerUrl && !bannerError ? (
                <div className="relative h-[120px] w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <Image
                    src={bannerUrl}
                    alt="Banner Preview"
                    fill
                    className="object-cover"
                    onError={() => setBannerError(true)}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                  <span className="text-xs text-gray-400">Nhập URL để xem trước</span>
                </div>
              )}
            </div>
          </div>

          {/* Mô tả ngắn */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mô tả ngắn (VI)
              </label>
              <textarea
                value={excerptVi}
                onChange={(e) => setExcerptVi(e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn tiếng Việt"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mô tả ngắn (EN)
              </label>
              <textarea
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                rows={3}
                placeholder="Short description in English"
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Content Blocks */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Nội dung (Content Blocks)
              </label>
              <button
                type="button"
                onClick={addContentBlock}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm Block
              </button>
            </div>

            <div className="space-y-4">
              {contentBlocks.map((block, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Block #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={block.type}
                        onChange={(e) => updateContentBlock(index, "type", e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="Text">Text</option>
                        <option value="Image">Image</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeContentBlock(index)}
                        disabled={contentBlocks.length <= 1}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {block.type === "Text" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Tiêu đề (VI)
                          </label>
                          <input
                            type="text"
                            value={block.titleVi}
                            onChange={(e) => updateContentBlock(index, "titleVi", e.target.value)}
                            placeholder="Tiêu đề đoạn này"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Tiêu đề (EN)
                          </label>
                          <input
                            type="text"
                            value={block.titleEn}
                            onChange={(e) => updateContentBlock(index, "titleEn", e.target.value)}
                            placeholder="Section title in English"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Nội dung (VI)
                          </label>
                          <textarea
                            value={block.contentVi}
                            onChange={(e) => updateContentBlock(index, "contentVi", e.target.value)}
                            rows={4}
                            placeholder="Nội dung tiếng Việt"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Nội dung (EN)
                          </label>
                          <textarea
                            value={block.contentEn}
                            onChange={(e) => updateContentBlock(index, "contentEn", e.target.value)}
                            rows={4}
                            placeholder="Content in English"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={block.imageUrl}
                          onChange={(e) => updateContentBlock(index, "imageUrl", e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Alt Text (VI)
                          </label>
                          <input
                            type="text"
                            value={block.imageAltVi}
                            onChange={(e) => updateContentBlock(index, "imageAltVi", e.target.value)}
                            placeholder="Mô tả ảnh tiếng Việt"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Alt Text (EN)
                          </label>
                          <input
                            type="text"
                            value={block.imageAltEn}
                            onChange={(e) => updateContentBlock(index, "imageAltEn", e.target.value)}
                            placeholder="Image alt in English"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={block.isFullWidth}
                          onChange={(e) => updateContentBlock(index, "isFullWidth", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Hiển thị full width (chiếm toàn bộ chiều rộng)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className={`h-6 w-11 rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                {isActive ? "Đang hoạt động" : "Đang ẩn"}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : mode === "create" ? "Tạo tin tức" : "Lưu thay đổi"}
            </button>
            <Link
              href="/news"
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
