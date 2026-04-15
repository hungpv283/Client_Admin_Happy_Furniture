"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getRootCategories,
  getCategoryById,
  createCategory,
  createCategoryWithImage,
  updateCategory,
  updateCategoryWithImage,
} from "@/lib/api";
import type { Category } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  categoryId?: number;
}

type ImageMode = "url" | "file";

export default function CategoryForm({ mode, categoryId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    getRootCategories()
      .then((data) => setAllCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === "edit" && categoryId) {
      setFetching(true);
      getCategoryById(categoryId)
        .then((cat) => {
          setName(cat.name);
          setNameEn(cat.nameEn || "");
          setDescription(cat.description || "");
          setDescriptionEn(cat.descriptionEn || "");
          setImageUrl(cat.imageUrl || "");
          setImagePreview(cat.imageUrl || "");
          setParentId(cat.parentId ?? "");
          setSortOrder(cat.sortOrder != null ? String(cat.sortOrder) : "");
          setIsActive(cat.isActive);
        })
        .catch(() => toastError("Không thể tải thông tin danh mục"))
        .finally(() => setFetching(false));
    }
  }, [mode, categoryId, toastError]);

  const handleImageModeSwitch = (m: ImageMode) => {
    setImageMode(m);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const isRootCategory = parentId === "";
  const resolvedSortOrder = isRootCategory && sortOrder.trim() !== ""
    ? Number(sortOrder)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "create" && imageMode === "file" && imageFile) {
        await createCategoryWithImage({
          name,
          nameEn: nameEn || undefined,
          description: description || undefined,
          descriptionEn: descriptionEn || undefined,
          parentId: parentId === "" ? null : Number(parentId),
          sortOrder: resolvedSortOrder,
          isActive,
          image: imageFile,
        });
      } else if (mode === "create") {
        await createCategory({
          name,
          nameEn: nameEn || undefined,
          description: description || undefined,
          descriptionEn: descriptionEn || undefined,
          imageUrl: imageUrl || undefined,
          parentId: parentId === "" ? null : Number(parentId),
          sortOrder: resolvedSortOrder,
          isActive,
        });
      } else if (mode === "edit" && imageFile) {
        await updateCategoryWithImage(categoryId!, {
          name,
          nameEn: nameEn || undefined,
          description: description || undefined,
          descriptionEn: descriptionEn || undefined,
          parentId: parentId === "" ? null : Number(parentId),
          sortOrder: resolvedSortOrder,
          isActive,
          image: imageFile,
        });
      } else {
        await updateCategory(categoryId!, {
          name,
          nameEn: nameEn || undefined,
          description: description || undefined,
          descriptionEn: descriptionEn || undefined,
          imageUrl: imageUrl || undefined,
          parentId: parentId === "" ? null : Number(parentId),
          sortOrder: resolvedSortOrder,
          isActive,
        });
      }

      success(mode === "create" ? "Tạo danh mục thành công!" : "Cập nhật danh mục thành công!");
      router.push("/categories");
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const parentOptions = allCategories.filter((c) => c.id !== categoryId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
        </h1>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tên danh mục (VI) <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Nhập tên danh mục"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tên danh mục (EN)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Category name in English"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mô tả (VI)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả danh mục"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Mô tả (EN)
                </label>
                <textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                  placeholder="Category description in English"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Image section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Hình ảnh
                </label>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => handleImageModeSwitch("url")}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      imageMode === "url"
                        ? "bg-brand-500 text-white"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageModeSwitch("file")}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      imageMode === "file"
                        ? "bg-brand-500 text-white"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                    }`}
                  >
                    Từ máy
                  </button>
                </div>
              </div>

              {imageMode === "url" ? (
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 transition-colors text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400"
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    {imageFile ? (
                      <span className="font-medium text-brand-500">{imageFile.name}</span>
                    ) : (
                      <span>Nhấn để chọn ảnh từ máy</span>
                    )}
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            {/* Parent category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Danh mục cha
              </label>
              <select
                value={parentId}
                onChange={(e) => {
                  const nextParentId = e.target.value === "" ? "" : Number(e.target.value);
                  setParentId(nextParentId);
                  if (nextParentId !== "") {
                    setSortOrder("");
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Không có (danh mục gốc)</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Số thứ tự
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={!isRootCategory}
                placeholder={isRootCategory ? "Nhập số thứ tự cho danh mục gốc" : "Chỉ áp dụng cho danh mục cha"}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-600"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Category gốc có thể nhập số thứ tự. Category con sẽ luôn gửi `null`.
              </p>
            </div>

            {/* Active toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  {isActive ? "Đang hoạt động" : "Ẩn"}
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                {loading
                  ? "Đang lưu..."
                  : mode === "create"
                  ? "Tạo danh mục"
                  : "Lưu thay đổi"}
              </button>
              <Link
                href="/categories"
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
