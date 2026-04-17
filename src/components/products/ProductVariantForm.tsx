"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  createProductVariant,
  createProductVariantWithImage,
  getProductById,
  getProductVariantById,
  updateProductVariant,
} from "@/lib/api";
import type { Product } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  productId: number;
  variantId?: number;
}

type ImageMode = "url" | "file";

export default function ProductVariantForm({ mode, productId, variantId }: Props) {
  const router = useRouter();
  const params = useParams<{ variantId?: string }>();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const routeVariantId = params?.variantId ? Number(params.variantId) : undefined;
  const resolvedVariantId =
    typeof variantId === "number" && Number.isFinite(variantId)
      ? variantId
      : typeof routeVariantId === "number" && Number.isFinite(routeVariantId)
        ? routeVariantId
        : undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [colorName, setColorName] = useState("");
  const [colorNameEn, setColorNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [initialSlugCode, setInitialSlugCode] = useState("");
  const [colorCode, setColorCode] = useState("FFFFFF");
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const productData = await getProductById(productId);
        setProduct(productData);

        if (mode === "edit" && resolvedVariantId) {
          const variantData = await getProductVariantById(resolvedVariantId);
          setColorName(variantData.colorName || "");
          const rawSlug = variantData.slug || "";
          setSlug(rawSlug);
          setInitialSlugCode(rawSlug);

          setColorNameEn(variantData.colorNameEn || "");
          setSlug(variantData.slug || "");
          setColorCode((variantData.colorCode || "FFFFFF").replace("#", "").toUpperCase());
          setImageUrl(variantData.imageUrl || "");
          setImagePreview(variantData.imageUrl || "");
          setIsActive(variantData.isActive);
        }
      } catch (err: unknown) {
        toastError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [mode, productId, resolvedVariantId, toastError]);

  const generateSlug = (value: string) =>
    value.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-");

  const handleColorNameChange = (value: string) => {
    setColorName(value);
    if (mode === "create") setSlug(generateSlug(value));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!colorName.trim()) newErrors.colorName = "Vui lòng nhập tên màu";
    if (!colorCode.trim()) newErrors.colorCode = "Vui lòng nhập mã màu";
    else if (!/^[0-9A-Fa-f]{6}$/.test(colorCode.trim())) {
      newErrors.colorCode = "Mã màu phải gồm 6 ký tự HEX (VD: FF5733)";
    }

    if (imageMode === "url" && imageUrl.trim() && imageUrl.trim().length > 500) {
      newErrors.imageUrl = "URL ảnh không được vượt quá 500 ký tự";
    }

    if (imageMode === "file" && !imageFile) {
      newErrors.imageFile = "Vui lòng chọn ảnh từ máy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageModeSwitch = (modeValue: ImageMode) => {
    setImageMode(modeValue);
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.imageUrl;
      delete next.imageFile;
      return next;
    });
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === "create") {
        if (imageMode === "file" && imageFile) {
          await createProductVariantWithImage({
            productId,
            colorName: colorName.trim(),
            colorNameEn: colorNameEn.trim() || undefined,
            slug: slug.trim() || undefined,
            colorCode: colorCode.trim().toUpperCase(),
            isActive,
            image: imageFile,
          });
        } else {
          await createProductVariant({
            productId,
            colorName: colorName.trim(),
            colorNameEn: colorNameEn.trim() || undefined,
            slug: slug.trim() || undefined,
            colorCode: colorCode.trim().toUpperCase(),
            imageUrl: imageUrl.trim() || undefined,
            isActive,
          });
        }
        success("Thêm biến thể thành công");
      } else if (resolvedVariantId) {
        const slugChanged = slug.trim() !== initialSlugCode;
        await updateProductVariant(resolvedVariantId, {
          colorName: colorName.trim(),
          colorNameEn: colorNameEn.trim() || undefined,
          slug: slugChanged ? (slug.trim() || undefined) : undefined,
          colorCode: colorCode.trim().toUpperCase(),
          imageUrl: imageMode === "url" ? imageUrl.trim() || undefined : undefined,
          isActive,
        });
        success("Cập nhật biến thể thành công");
      }

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
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="transition-colors hover:text-brand-500">
          Sản phẩm
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/products/${productId}/variants`} className="max-w-[180px] truncate transition-colors hover:text-brand-500">
          {product ? product.name : `#${productId}`}
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/products/${productId}/variants`} className="transition-colors hover:text-brand-500">
          Biến thể
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-800 dark:text-white/80">
          {mode === "create" ? "Thêm mới" : "Chỉnh sửa"}
        </span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm biến thể" : "Chỉnh sửa biến thể"}
        </h1>
        {product && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sản phẩm: <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
                Thông tin biến thể
              </h2>

              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên màu (VI) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={colorName}
                    onChange={(e) => handleColorNameChange(e.target.value)}
                    placeholder="VD: Xám nhạt, Xanh navy, ..."
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors dark:bg-white/5 dark:text-white/90 ${errors.colorName
                        ? "border-red-400 dark:border-red-500 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500"
                      }`}
                  />
                  {errors.colorName && <p className="mt-1 text-xs text-red-500">{errors.colorName}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên màu (EN)
                  </label>
                  <input
                    type="text"
                    value={colorNameEn}
                    onChange={(e) => setColorNameEn(e.target.value)}
                    placeholder="VD: Light Gray, Navy Blue, ..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Slug màu</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="VD: mau-trang, xanh-navy, ..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90"
                />
                <p className="mt-1 text-xs text-gray-400">Tự động tạo từ tên màu. Dùng để nối URL khi chọn màu.</p>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mã màu HEX <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 transition-colors focus-within:border-brand-500 dark:border-gray-700 dark:bg-white/5 dark:focus-within:border-brand-500">
                    <span className="select-none text-sm text-gray-500 dark:text-gray-400">#</span>
                    <input
                      type="text"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6).toUpperCase())}
                      placeholder="FFFFFF"
                      maxLength={6}
                      className={`flex-1 bg-transparent text-sm uppercase tracking-widest outline-none dark:text-white/90 ${errors.colorCode ? "placeholder:text-red-300" : ""}`}
                    />
                  </div>
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={`#${colorCode.length === 6 ? colorCode : "FFFFFF"}`}
                      onChange={(e) => setColorCode(e.target.value.slice(1).toUpperCase())}
                      className="sr-only"
                      id="colorPicker"
                    />
                    <label
                      htmlFor="colorPicker"
                      className="block h-11 w-11 cursor-pointer rounded-xl border-2 border-gray-200 shadow-sm transition-transform hover:scale-105 dark:border-gray-700"
                      style={{ backgroundColor: `#${colorCode.length === 6 ? colorCode : "FFFFFF"}` }}
                    />
                  </div>
                </div>
                {errors.colorCode && <p className="mt-1 text-xs text-red-500">{errors.colorCode}</p>}
                <p className="mt-1.5 text-xs text-gray-400">Nhập 6 ký tự HEX hoặc chọn màu bên phải</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh biến thể</label>
                  <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => handleImageModeSwitch("url")}
                      className={`px-3 py-1.5 font-medium transition-colors ${imageMode === "url"
                          ? "bg-brand-500 text-white"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                        }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageModeSwitch("file")}
                      className={`px-3 py-1.5 font-medium transition-colors ${imageMode === "file"
                          ? "bg-brand-500 text-white"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                        }`}
                    >
                      Từ máy
                    </button>
                  </div>
                </div>

                {imageMode === "url" ? (
                  <div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/variant.jpg"
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors dark:bg-white/5 dark:text-white/90 ${errors.imageUrl
                          ? "border-red-400 dark:border-red-500 focus:border-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500"
                        }`}
                    />
                    {errors.imageUrl && <p className="mt-1 text-xs text-red-500">{errors.imageUrl}</p>}
                  </div>
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
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
                    >
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {imageFile ? <span className="font-medium text-brand-500">{imageFile.name}</span> : <span>Nhấn để chọn ảnh từ máy</span>}
                    </button>
                    {mode === "edit" && (
                      <p className="mt-1 text-xs text-amber-500">
                        Chế độ sửa hiện đang cập nhật bằng `imageUrl`. Upload file chỉ dùng cho tạo mới.
                      </p>
                    )}
                    {errors.imageFile && <p className="mt-1 text-xs text-red-500">{errors.imageFile}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Xem trước</h2>
              <div className="flex flex-col items-center gap-3 py-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="h-24 w-24 rounded-2xl border border-gray-200 object-cover shadow-md dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="h-20 w-20 rounded-2xl border-2 border-gray-200 shadow-md transition-all dark:border-gray-700"
                    style={{ backgroundColor: `#${colorCode.length === 6 ? colorCode : "FFFFFF"}` }}
                  />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{colorName || "Tên màu"}</p>
                  {colorNameEn && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{colorNameEn}</p>
                  )}
                  <p className="mt-0.5 font-mono text-xs text-gray-400">#{colorCode.toUpperCase() || "FFFFFF"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Trạng thái</h2>
              <label className="flex cursor-pointer select-none items-center gap-3">
                <div className="relative">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only" />
                  <div className={`h-6 w-11 rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                  <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{isActive ? "Hoạt động" : "Ẩn"}</span>
              </label>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {mode === "create" ? "Thêm biến thể" : "Lưu thay đổi"}
              </button>
              <Link
                href={`/products/${productId}/variants`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Hủy
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
