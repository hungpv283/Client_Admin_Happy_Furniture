"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { uploadSingleImage } from "@/lib/api";

interface Props {
  open: boolean;
  src: string;           // URL ảnh gốc cần crop
  folder?: string;
  onDone: (croppedUrl: string) => void;
  onClose: () => void;
}

/** Vẽ crop lên canvas rồi export thành Blob */
async function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.round(crop.width * scaleX);
  canvas.height = Math.round(crop.height * scaleY);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    Math.round(crop.width * scaleX),
    Math.round(crop.height * scaleY),
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.92);
  });
}

const ASPECT_OPTIONS = [
  { label: "Tự do", value: undefined },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "2:1", value: 2 },
  { label: "3:4", value: 3 / 4 },
];

export default function ImageCropModal({ open, src, folder = "news", onDone, onClose }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset khi mở lại
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setAspect(undefined);
      setError(null);
    }
  }, [open, src]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Mặc định chọn toàn bộ ảnh
    const defaultCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 100 }, aspect ?? width / height, width, height),
      width,
      height
    );
    setCrop(defaultCrop);
  }, [aspect]);

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    const newCrop = centerCrop(
      makeAspectCrop(
        { unit: "%", width: 80 },
        newAspect ?? width / height,
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  };

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const result = await uploadSingleImage(file, folder);
      onDone(result.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cắt ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 overflow-hidden max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
              <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Cắt ảnh</p>
              <p className="text-[11px] text-gray-500">Kéo để chọn vùng cần hiển thị, rồi nhấn Áp dụng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-2.5 dark:border-gray-700/50 shrink-0">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Tỉ lệ:</span>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleAspectChange(opt.value)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${
                  aspect === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-900/5 dark:bg-black/20 p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={40}
            minHeight={40}
            className="max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop source"
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {completedCrop && (
              <>
                <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  Vùng chọn: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px
                </span>
              </>
            )}
            {error && (
              <span className="text-red-500">{error}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!completedCrop || uploading}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Áp dụng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
