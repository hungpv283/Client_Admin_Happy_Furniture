"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createVariantImage,
  createVariantImageWithUpload,
  deleteVariantImage,
  getVariantImages,
  setVariantImagePrimary,
  bulkCreateVariantImages,
  uploadSingleImage,
  getProductById,
  getProductVariantById,
} from "@/lib/api";
import type { Product, ProductVariantImage, ProductVariant } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  productId: number;
  variantId: number;
}

type AddMode = "url" | "file";

export default function VariantImagesManager({ productId, variantId }: Props) {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [images, setImages] = useState<ProductVariantImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addMode, setAddMode] = useState<AddMode>("url");
  const [addUrl, setAddUrl] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addPreview, setAddPreview] = useState("");
  const [adding, setAdding] = useState(false);

  // Bulk upload state
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkPreviews, setBulkPreviews] = useState<string[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productData, variantData, variantImgs] = await Promise.all([
        getProductById(productId),
        getProductVariantById(variantId),
        getVariantImages(variantId),
      ]);
      setProduct(productData);
      setVariant(variantData);
      setImages(variantImgs);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, variantId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addMode === "url" && !addUrl.trim()) return;
    if (addMode === "file" && !addFile) return;

    setAdding(true);
    try {
      const isPrimary = images.length === 0;
      const sortOrder = images.length + 1;

      if (addMode === "file" && addFile) {
        await createVariantImageWithUpload(variantId, {
          image: addFile,
          isPrimary,
          sortOrder,
          altText: null,
        });
      } else {
        await createVariantImage(variantId, {
          imageUrl: addUrl.trim(),
          altText: null,
          isPrimary,
          sortOrder,
        });
      }

      success("Đã thêm ảnh");
      setAddUrl("");
      setAddFile(null);
      setAddPreview("");
      await loadData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Thêm ảnh thất bại");
    } finally {
      setAdding(false);
    }
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBulkFiles((prev) => [...prev, ...files]);
    setBulkPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
    setBulkPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkFiles.length) return;
    setBulkUploading(true);
    try {
      const uploadResults = await Promise.all(
        bulkFiles.map((f) => uploadSingleImage(f, "product-images"))
      );
      await bulkCreateVariantImages(variantId, uploadResults.map((r) => ({ imageUrl: r.imageUrl })));
      success(`Đã thêm ${uploadResults.length} ảnh`);
      setBulkFiles([]);
      setBulkPreviews([]);
      await loadData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setBulkUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await setVariantImagePrimary(imageId);
      success("Đã đặt ảnh chính");
      await loadData();
    } catch {
      toastError("Cập nhật thất bại");
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget == null) return;
    setDeleting(true);
    try {
      await deleteVariantImage(deleteTarget);
      setConfirmOpen(false);
      setDeleteTarget(null);
      success("Đã xóa ảnh");
      await loadData();
    } catch {
      toastError("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const swatchColor = variant?.colorCode
    ? `#${String(variant.colorCode).replace("#", "")}`
    : "#888";

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa ảnh"
        message="Bạn có chắc muốn xóa ảnh này?"
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!deleting) { setConfirmOpen(false); setDeleteTarget(null); } }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="transition-colors hover:text-brand-500">Sản phẩm</Link>
        <ChevronIcon />
        <Link href={`/products/${productId}/variants`} className="max-w-[160px] truncate transition-colors hover:text-brand-500">
          {product?.name ?? `#${productId}`}
        </Link>
        <ChevronIcon />
        <Link href={`/products/${productId}/variants`} className="transition-colors hover:text-brand-500">Biến thể</Link>
        <ChevronIcon />
        <span className="font-medium text-gray-800 dark:text-white/80">Ảnh biến thể</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-gray-200 shadow-sm dark:border-gray-700"
            style={{ backgroundColor: swatchColor }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              {variant?.colorName ?? "Biến thể"}
            </h1>
            {variant && (
              <p className="mt-0.5 font-mono text-xs text-gray-400">#{variant.colorCode}</p>
            )}
          </div>
        </div>
        <Link
          href={`/products/${productId}/variants`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Image list */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
              Bộ ảnh biến thể
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {images.length} ảnh
              </span>
            </h2>

            {loading ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : images.length === 0 ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-400">Chưa có ảnh nào cho biến thể này</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                      img.isPrimary
                        ? "border-brand-500 ring-2 ring-brand-200 dark:ring-brand-500/30"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText ?? ""}
                      className="aspect-square w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                    />
                    {img.isPrimary && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        Chính
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 bg-black/60 p-2 transition-transform group-hover:translate-y-0">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="flex-1 rounded-lg bg-brand-500 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                        >
                          Đặt chính
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setDeleteTarget(img.id); setConfirmOpen(true); }}
                        className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add form */}
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Thêm ảnh mới</h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Mode toggle */}
              <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setAddMode("url"); setAddFile(null); setAddPreview(""); }}
                  className={`flex-1 px-3 py-2 font-medium transition-colors ${addMode === "url" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"}`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => { setAddMode("file"); setAddUrl(""); setAddPreview(""); }}
                  className={`flex-1 px-3 py-2 font-medium transition-colors ${addMode === "file" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"}`}
                >
                  Từ máy
                </button>
              </div>

              {addMode === "url" ? (
                <input
                  type="text"
                  value={addUrl}
                  onChange={(e) => { setAddUrl(e.target.value); setAddPreview(e.target.value); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (!file) return;
                      setAddFile(file);
                      setAddPreview(URL.createObjectURL(file));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-sm text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-400"
                  >
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {addFile ? <span className="font-medium text-brand-500">{addFile.name}</span> : <span>Nhấn để chọn ảnh</span>}
                  </button>
                </div>
              )}

              {addPreview && (
                <img
                  src={addPreview}
                  alt="preview"
                  className="h-32 w-full rounded-xl border border-gray-200 object-cover dark:border-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}

              <button
                type="submit"
                disabled={adding || (addMode === "url" ? !addUrl.trim() : !addFile)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Thêm ảnh
              </button>
            </form>
          </div>

          {/* Note */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Ảnh đầu tiên được tự động đặt làm ảnh chính. Hover vào ảnh để đặt chính hoặc xóa.
            </p>
          </div>

          {/* Bulk upload panel */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Upload nhiều ảnh</h2>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={bulkFileInputRef}
              onChange={handleBulkFileSelect}
            />

            <button
              type="button"
              onClick={() => bulkFileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-5 text-sm text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-400"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Chọn nhiều ảnh cùng lúc</span>
            </button>

            {bulkPreviews.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {bulkPreviews.map((src, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                      <img src={src} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeBulkFile(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={bulkUploading}
                  onClick={handleBulkUpload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkUploading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {bulkUploading ? "Đang upload..." : `Upload ${bulkFiles.length} ảnh`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
