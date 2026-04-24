"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkCreateProductVariants,
  getProductById,
  uploadSingleImage,
} from "@/lib/api";
import type { Product } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  productId: number;
}

interface VariantRow {
  id: string;
  colorName: string;
  colorNameEn: string;
  slug: string;
  colorCode: string;
  imageMode: "url" | "file";
  imageUrl: string;
  imageFile: File | null;
  imagePreview: string;
  isActive: boolean;
  error: string;
}

function makeRow(): VariantRow {
  return {
    id: Math.random().toString(36).slice(2),
    colorName: "",
    colorNameEn: "",
    slug: "",
    colorCode: "FFFFFF",
    imageMode: "url",
    imageUrl: "",
    imageFile: null,
    imagePreview: "",
    isActive: true,
    error: "",
  };
}

export default function BulkVariantForm({ productId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<VariantRow[]>([makeRow(), makeRow()]);

  useEffect(() => {
    getProductById(productId)
      .then(setProduct)
      .catch((err: unknown) =>
        toastError(err instanceof Error ? err.message : "Lỗi tải sản phẩm")
      )
      .finally(() => setFetching(false));
  }, [productId, toastError]);

  const updateRow = (id: string, patch: Partial<VariantRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, error: "" } : r))
    );
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (!file) return;
    updateRow(id, {
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    });
  };

  const validate = (): boolean => {
    let valid = true;
    setRows((prev) =>
      prev.map((r) => {
        if (!r.colorName.trim()) {
          valid = false;
          return { ...r, error: "Vui lòng nhập tên màu (VI)" };
        }
        if (!/^[0-9A-Fa-f]{6}$/.test(r.colorCode.trim())) {
          valid = false;
          return { ...r, error: "Mã màu phải đúng 6 ký tự HEX" };
        }
        if (r.imageMode === "url" && r.imageUrl.trim().length > 500) {
          valid = false;
          return { ...r, error: "URL ảnh không vượt quá 500 ký tự" };
        }
        return { ...r, error: "" };
      })
    );
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Pre-upload file images in parallel
      const uploadedUrls: Record<string, string> = {};
      const fileRows = rows.filter((r) => r.imageMode === "file" && r.imageFile);
      await Promise.all(
        fileRows.map(async (r) => {
          const result = await uploadSingleImage(r.imageFile!, "product-variants");
          uploadedUrls[r.id] = result.imageUrl;
        })
      );

      await bulkCreateProductVariants({
        productId,
        variants: rows.map((r) => ({
          colorName: r.colorName.trim(),
          colorNameEn: r.colorNameEn.trim() || null,
          slug: r.slug.trim() || null,
          colorCode: r.colorCode.trim().toUpperCase(),
          imageUrl:
            r.imageMode === "file"
              ? (uploadedUrls[r.id] ?? null)
              : r.imageUrl.trim() || null,
          isActive: r.isActive,
        })),
      });

      success(`Đã thêm ${rows.length} biến thể thành công`);
      router.push(`/products/${productId}/variants`);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="transition-colors hover:text-brand-500">
          Sản phẩm
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/products/${productId}/variants`}
          className="max-w-[180px] truncate transition-colors hover:text-brand-500"
        >
          {product ? product.name : `#${productId}`}
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/products/${productId}/variants`}
          className="transition-colors hover:text-brand-500"
        >
          Biến thể
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-800 dark:text-white/80">Thêm nhiều biến thể</span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Thêm nhiều biến thể
          </h1>
          {product && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sản phẩm:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <VariantRowCard
              key={row.id}
              row={row}
              index={index}
              fileInputRef={(el) => el}
              onUpdate={(patch) => updateRow(row.id, patch)}
              onRemove={() => removeRow(row.id)}
              onFileChange={(file) => handleFileChange(row.id, file)}
              canRemove={rows.length > 1}
            />
          ))}
        </div>

        {/* Add row */}
        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm hàng mới
        </button>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-white/90">{rows.length}</span> biến thể sẽ được tạo
          </p>
          <div className="flex gap-3">
            <Link
              href={`/products/${productId}/variants`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {submitting ? "Đang lưu..." : `Lưu ${rows.length} biến thể`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Single row card ────────────────────────────────────────────── */
interface RowCardProps {
  row: VariantRow;
  index: number;
  fileInputRef: React.RefCallback<HTMLInputElement>;
  onUpdate: (patch: Partial<VariantRow>) => void;
  onRemove: () => void;
  onFileChange: (file: File | null) => void;
  canRemove: boolean;
}

function VariantRowCard({
  row,
  index,
  fileInputRef,
  onUpdate,
  onRemove,
  onFileChange,
  canRemove,
}: RowCardProps) {
  const localFileRef = useRef<HTMLInputElement | null>(null);
  const setRef = (el: HTMLInputElement | null) => {
    localFileRef.current = el;
    fileInputRef(el);
  };
  return (
    <div
      className={`rounded-2xl border bg-white p-4 dark:bg-white/[0.03] ${
        row.error
          ? "border-red-300 dark:border-red-500/50"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      {/* Row header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Biến thể #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            title="Xóa hàng này"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Color name VI */}
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Tên màu (VI) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={row.colorName}
            onChange={(e) => onUpdate({ colorName: e.target.value })}
            placeholder="VD: Xám nhạt"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
          />
        </div>

        {/* Color name EN */}
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Tên màu (EN)
          </label>
          <input
            type="text"
            value={row.colorNameEn}
            onChange={(e) => onUpdate({ colorNameEn: e.target.value })}
            placeholder="VD: Light Gray"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
          />
        </div>

        {/* HEX color */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Mã HEX <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-brand-500 dark:border-gray-700 dark:bg-white/5">
            <div
              className="h-5 w-5 shrink-0 rounded-md border border-gray-200 dark:border-gray-600"
              style={{ backgroundColor: `#${row.colorCode.length === 6 ? row.colorCode : "FFFFFF"}` }}
            />
            <span className="text-xs text-gray-400">#</span>
            <input
              type="text"
              value={row.colorCode}
              onChange={(e) =>
                onUpdate({
                  colorCode: e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6).toUpperCase(),
                })
              }
              placeholder="FFFFFF"
              maxLength={6}
              className="w-full bg-transparent text-xs uppercase tracking-widest outline-none dark:text-white/90"
            />
            <input
              type="color"
              value={`#${row.colorCode.length === 6 ? row.colorCode : "FFFFFF"}`}
              onChange={(e) => onUpdate({ colorCode: e.target.value.slice(1).toUpperCase() })}
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 opacity-0"
              style={{ marginLeft: "-20px" }}
              title="Chọn màu"
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Slug
          </label>
          <input
            type="text"
            value={row.slug}
            onChange={(e) => onUpdate({ slug: e.target.value })}
            placeholder="Tự tạo từ tên"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
          />
        </div>
      </div>

      {/* Image + Status row */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        {/* Image */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Ảnh biến thể</label>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs dark:border-gray-700">
              <button
                type="button"
                onClick={() => onUpdate({ imageMode: "url" })}
                className={`px-3 py-1 font-medium transition-colors ${
                  row.imageMode === "url"
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ imageMode: "file", imageFile: null })}
                className={`px-3 py-1 font-medium transition-colors ${
                  row.imageMode === "file"
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                Từ máy
              </button>
            </div>
          </div>

          {row.imageMode === "url" ? (
            <input
              type="text"
              value={row.imageUrl}
              onChange={(e) => onUpdate({ imageUrl: e.target.value, imagePreview: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
            />
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={setRef}
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => localFileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-2 text-xs text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {row.imageFile ? (
                  <span className="max-w-[160px] truncate font-medium text-brand-500">{row.imageFile.name}</span>
                ) : (
                  "Chọn ảnh từ máy"
                )}
              </button>
              {row.imagePreview && (
                <img
                  src={row.imagePreview}
                  alt="preview"
                  className="h-9 w-9 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                />
              )}
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2">
            <div className="relative">
              <input
                type="checkbox"
                checked={row.isActive}
                onChange={(e) => onUpdate({ isActive: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`h-5 w-9 rounded-full transition-colors ${
                  row.isActive ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  row.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {row.isActive ? "Hiển thị" : "Ẩn"}
            </span>
          </label>
        </div>
      </div>

      {/* Error */}
      {row.error && (
        <p className="mt-2 text-xs text-red-500">{row.error}</p>
      )}
    </div>
  );
}
