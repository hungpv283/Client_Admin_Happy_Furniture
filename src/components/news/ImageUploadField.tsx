"use client";

import React, { useRef, useState } from "react";
import { uploadSingleImage } from "@/lib/api";
import ImageCropModal from "@/components/news/ImageCropModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /**
   * Chiều cao tối đa của vùng xem trước (px). Ảnh giữ tỉ lệ, không bị cắt méo (object-contain).
   */
  previewMaxHeight?: number;
  /** @deprecated dùng previewMaxHeight */
  previewHeight?: number;
  folder?: string;
  required?: boolean;
  /** Hiện nút cắt ảnh */
  enableCrop?: boolean;
  /** Hỏi xác nhận trước khi xoá ảnh (nút X trên preview) */
  confirmBeforeRemove?: boolean;
}

type InputMode = "url" | "upload";

export default function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  previewMaxHeight,
  previewHeight,
  folder = "news",
  required = false,
  enableCrop = false,
  confirmBeforeRemove = true,
}: Props) {
  const maxH = previewMaxHeight ?? previewHeight ?? 320;
  const [mode, setMode] = useState<InputMode>("url");
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Chỉ hỗ trợ file ảnh (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File quá lớn. Tối đa 10MB");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadSingleImage(file, folder);
      onChange(result.imageUrl);
      setPreviewError(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";

  const clearImage = () => {
    onChange("");
    setPreviewError(false);
    setRemoveConfirmOpen(false);
  };

  const requestRemoveImage = () => {
    if (confirmBeforeRemove && value) setRemoveConfirmOpen(true);
    else clearImage();
  };

  return (
    <div>
      <ConfirmDialog
        open={removeConfirmOpen}
        title="Xoá ảnh"
        message={`Gỡ ảnh khỏi trường "${label}"? Bạn có thể chọn ảnh khác sau đó.`}
        confirmLabel="Gỡ ảnh"
        onConfirm={clearImage}
        onCancel={() => setRemoveConfirmOpen(false)}
      />
      {/* Label + mode toggle */}
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              mode === "url"
                ? "bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Nhập URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              mode === "upload"
                ? "bg-white text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Tải lên
          </button>
        </div>
      </div>

      {/* URL mode */}
      {mode === "url" && (
        <input
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPreviewError(false); }}
          placeholder={placeholder}
          required={required}
          className={inputCls}
        />
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileInputChange}
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition-all ${
              dragOver
                ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/10"
                : uploading
                ? "cursor-not-allowed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5"
                : "border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:bg-white/5 dark:hover:border-brand-500 dark:hover:bg-brand-900/10"
            }`}
          >
            {uploading ? (
              <>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Đang tải lên...</p>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm0 0v.008H13.5V12zM3.75 20.25h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Kéo thả hoặc <span className="text-brand-500">chọn file</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">JPG, PNG, WebP, GIF — tối đa 10MB</p>
                </div>
              </>
            )}
          </div>
          {uploadError && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Preview — khung co theo tỉ lệ ảnh (crop xong vẫn thấy trọn vẹn) */}
      <div className="mt-2">
        {value && !previewError ? (
          <div>
            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Preview"
                className="mx-auto block h-auto w-full max-w-full object-contain"
                style={{ maxHeight: maxH }}
                onError={() => setPreviewError(true)}
              />
              {/* Nút xoá */}
              <button
                type="button"
                onClick={requestRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                title="Xoá ảnh"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Nút cắt ảnh */}
              {enableCrop && (
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-black/70"
                  title="Cắt ảnh"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14" />
                  </svg>
                  Cắt ảnh
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-full min-h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
            <span className="text-xs text-gray-400">Chưa có ảnh</span>
          </div>
        )}
      </div>

      {/* Crop modal */}
      {enableCrop && cropOpen && value && (
        <ImageCropModal
          open={cropOpen}
          src={value}
          folder={folder}
          onDone={(croppedUrl) => {
            onChange(croppedUrl);
            setCropOpen(false);
          }}
          onClose={() => setCropOpen(false)}
        />
      )}
    </div>
  );
}
