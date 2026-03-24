"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProductById,
  getProductVariantById,
  createProductVariant,
  updateProductVariant,
} from "@/lib/api";
import type { Product } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  productId: number;
  variantId?: number;
}

export default function ProductVariantForm({ mode, productId, variantId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("FFFFFF");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const productData = await getProductById(productId);
        setProduct(productData);

        if (mode === "edit" && variantId) {
          const variantData = await getProductVariantById(variantId);
          setColorName(variantData.colorName);
          setColorCode(variantData.colorCode);
          setPrice(String(variantData.price));
          setIsActive(variantData.isActive);
        }
      } catch (err: unknown) {
        toastError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [mode, productId, variantId, toastError]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!colorName.trim()) newErrors.colorName = "Vui lòng nhập tên màu";
    if (!colorCode.trim()) newErrors.colorCode = "Vui lòng nhập mã màu";
    else if (!/^[0-9A-Fa-f]{6}$/.test(colorCode.trim()))
      newErrors.colorCode = "Mã màu phải gồm 6 ký tự HEX (VD: FF5733)";
    if (!price) newErrors.price = "Vui lòng nhập giá";
    else if (isNaN(Number(price)) || Number(price) < 0)
      newErrors.price = "Giá không hợp lệ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === "create") {
        await createProductVariant({
          productId,
          colorName: colorName.trim(),
          colorCode: colorCode.trim().toUpperCase(),
          price: Number(price),
          isActive,
        });
        success("Thêm biến thể thành công");
      } else if (variantId) {
        await updateProductVariant(variantId, {
          colorName: colorName.trim(),
          colorCode: colorCode.trim().toUpperCase(),
          price: Number(price),
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/products" className="hover:text-brand-500 transition-colors">
          Sản phẩm
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/products/${productId}/variants`}
          className="hover:text-brand-500 transition-colors truncate max-w-[180px]"
        >
          {product ? product.name : `#${productId}`}
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/products/${productId}/variants`}
          className="hover:text-brand-500 transition-colors"
        >
          Biến thể
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-800 dark:text-white/80 font-medium">
          {mode === "create" ? "Thêm mới" : "Chỉnh sửa"}
        </span>
      </nav>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm biến thể" : "Chỉnh sửa biến thể"}
        </h1>
        {product && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sản phẩm: <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-5">
                Thông tin biến thể
              </h2>

              {/* Color Name */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên màu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="VD: Xám nhạt, Xanh navy, ..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-white/5 dark:text-white/90 outline-none transition-colors
                    ${errors.colorName
                      ? "border-red-400 dark:border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500"
                    }`}
                />
                {errors.colorName && (
                  <p className="mt-1 text-xs text-red-500">{errors.colorName}</p>
                )}
              </div>

              {/* Color Code */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mã màu HEX <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center flex-1 gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/5 focus-within:border-brand-500 dark:focus-within:border-brand-500 transition-colors">
                    <span className="text-sm text-gray-500 dark:text-gray-400 select-none">#</span>
                    <input
                      type="text"
                      value={colorCode}
                      onChange={(e) => setColorCode(e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6))}
                      placeholder="FFFFFF"
                      maxLength={6}
                      className={`flex-1 text-sm bg-transparent dark:text-white/90 outline-none uppercase tracking-widest
                        ${errors.colorCode ? "placeholder:text-red-300" : ""}`}
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
                      className="w-11 h-11 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer block shadow-sm hover:scale-105 transition-transform"
                      style={{ backgroundColor: `#${colorCode.length === 6 ? colorCode : "FFFFFF"}` }}
                    />
                  </div>
                </div>
                {errors.colorCode && (
                  <p className="mt-1 text-xs text-red-500">{errors.colorCode}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  Nhập 6 ký tự HEX hoặc chọn màu bằng bộ chọn màu bên phải
                </p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Giá biến thể (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min={0}
                  step="0.01"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white dark:bg-white/5 dark:text-white/90 outline-none transition-colors
                    ${errors.price
                      ? "border-red-400 dark:border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500"
                    }`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-500">{errors.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Xem trước
              </h2>
              <div className="flex flex-col items-center gap-3 py-4">
                <div
                  className="w-20 h-20 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-md transition-all"
                  style={{ backgroundColor: `#${colorCode.length === 6 ? colorCode : "FFFFFF"}` }}
                />
                <div className="text-center">
                  <p className="font-medium text-gray-800 dark:text-white/90 text-sm">
                    {colorName || "Tên màu"}
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    #{colorCode.toUpperCase() || "FFFFFF"}
                  </p>
                  {price && (
                    <p className="text-sm font-semibold text-brand-500 mt-1">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(price) || 0)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
                Trạng thái
              </h2>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      isActive ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isActive ? "Hoạt động" : "Ẩn"}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {mode === "create" ? "Thêm biến thể" : "Lưu thay đổi"}
              </button>
              <Link
                href={`/products/${productId}/variants`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
