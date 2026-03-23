"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCategories,
  getProductById,
  createProduct,
  createProductWithImages,
  updateProduct,
} from "@/lib/api";
import type { Category } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  productId?: number;
}

type ImageMode = "url" | "file";

interface ImageEntry {
  mode: ImageMode;
  url: string;
  file: File | null;
  preview: string;
}

function newEntry(): ImageEntry {
  return { mode: "url", url: "", file: null, preview: "" };
}

export default function ProductForm({ mode, productId }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [dimensionsHeight, setDimensionsHeight] = useState("");
  const [dimensionsWidth, setDimensionsWidth] = useState("");
  const [dimensionsDepth, setDimensionsDepth] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [detail, setDetail] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [weight, setWeight] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([newEntry()]);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    getCategories(1, 100)
      .then((data) => setAllCategories(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === "edit" && productId) {
      setFetching(true);
      getProductById(productId)
        .then((p) => {
          setName(p.name);
          setSlug(p.slug);
          setDescription(p.description || "");
          setPrice(String(p.price));
          setOldPrice(p.oldPrice != null ? String(p.oldPrice) : "");
          setDimensionsHeight(p.dimensionsHeight != null ? String(p.dimensionsHeight) : "");
          setDimensionsWidth(p.dimensionsWidth != null ? String(p.dimensionsWidth) : "");
          setDimensionsDepth(p.dimensionsDepth != null ? String(p.dimensionsDepth) : "");
          setDimensionUnit(p.dimensionUnit || "cm");
          setDetail(p.detail || "");
          setDeliveryInfo(p.deliveryInfo || "");
          setWeight(p.weight != null ? String(p.weight) : "");
          setIsFeatured(p.isFeatured);
          setIsActive(p.isActive);
          setSelectedCategoryIds(p.categories.map((c) => c.id));
          const urls = p.images.map((img) => img.imageUrl).filter(Boolean);
          setImages(
            urls.length > 0
              ? urls.map((u) => ({ mode: "url" as ImageMode, url: u, file: null, preview: u }))
              : [newEntry()]
          );
        })
        .catch(() => toastError("Không thể tải thông tin sản phẩm"))
        .finally(() => setFetching(false));
    }
  }, [mode, productId]);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create") setSlug(generateSlug(value));
  };

  const toggleCategory = (id: number) =>
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const updateImage = (index: number, patch: Partial<ImageEntry>) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleModeSwitch = (index: number, m: ImageMode) => {
    updateImage(index, { mode: m, url: "", file: null, preview: "" });
  };

  const handleUrlChange = (index: number, url: string) => {
    updateImage(index, { url, preview: url });
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateImage(index, { file, preview });
  };

  const addImage = () => setImages((prev) => [...prev, newEntry()]);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const entry = prev[index];
      if (entry.file && entry.preview.startsWith("blob:")) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const hasFiles = images.some((img) => img.mode === "file" && img.file);

    try {
      if (mode === "create" && hasFiles) {
        // Use multipart endpoint if any image is a file
        const files = images
          .filter((img) => img.mode === "file" && img.file)
          .map((img) => img.file!);

        await createProductWithImages({
          name,
          slug,
          description,
          price: parseFloat(price),
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          dimensionsHeight: dimensionsHeight ? parseFloat(dimensionsHeight) : null,
          dimensionsWidth: dimensionsWidth ? parseFloat(dimensionsWidth) : null,
          dimensionsDepth: dimensionsDepth ? parseFloat(dimensionsDepth) : null,
          dimensionUnit,
          detail,
          deliveryInfo,
          weight: weight ? parseFloat(weight) : null,
          isFeatured,
          isActive,
          categoryIds: selectedCategoryIds,
          images: files,
        });
      } else {
        const imageUrls = images
          .filter((img) => img.mode === "url" && img.url.trim())
          .map((img) => img.url.trim());

        const payload = {
          name,
          slug,
          description,
          price: parseFloat(price),
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          dimensionsHeight: dimensionsHeight ? parseFloat(dimensionsHeight) : null,
          dimensionsWidth: dimensionsWidth ? parseFloat(dimensionsWidth) : null,
          dimensionsDepth: dimensionsDepth ? parseFloat(dimensionsDepth) : null,
          dimensionUnit,
          detail,
          deliveryInfo,
          weight: weight ? parseFloat(weight) : null,
          isFeatured,
          isActive,
          categoryIds: selectedCategoryIds,
          imageUrls,
        };

        if (mode === "create") {
          await createProduct(payload);
        } else {
          await updateProduct(productId!, payload);
        }
      }

      success(mode === "create" ? "Tạo sản phẩm thành công!" : "Cập nhật sản phẩm thành công!");
      router.push("/products");
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic info */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Tên sản phẩm <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Nhập tên sản phẩm"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Slug <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="ten-san-pham"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả ngắn</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Mô tả ngắn về sản phẩm"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500 resize-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả chi tiết</label>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={5}
                    placeholder="Mô tả chi tiết về sản phẩm"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Giá</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Giá bán <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Giá gốc (tùy chọn)</label>
                  <input
                    type="number"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Kích thước & Trọng lượng</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Chiều cao", value: dimensionsHeight, set: setDimensionsHeight },
                  { label: "Chiều rộng", value: dimensionsWidth, set: setDimensionsWidth },
                  { label: "Chiều sâu", value: dimensionsDepth, set: setDimensionsDepth },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Đơn vị</label>
                  <select
                    value={dimensionUnit}
                    onChange={(e) => setDimensionUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  >
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="mm">mm</option>
                    <option value="inch">inch</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Trọng lượng (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0"
                  step="0.1"
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                />
              </div>
            </div>

            {/* Images */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-1">Hình ảnh</h2>
              {mode === "create" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  Mỗi ảnh có thể nhập URL <em>hoặc</em> chọn file từ máy.
                  Nếu có ít nhất 1 file từ máy, hệ thống sẽ upload qua API multipart.
                </p>
              )}
              {mode === "edit" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                  Chỉnh sửa URL ảnh hiện tại.
                </p>
              )}

              <div className="space-y-4">
                {images.map((entry, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Ảnh #{index + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        {/* Mode toggle — only in create mode */}
                        {mode === "create" && (
                          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => handleModeSwitch(index, "url")}
                              className={`px-3 py-1.5 font-medium transition-colors ${
                                entry.mode === "url"
                                  ? "bg-brand-500 text-white"
                                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                              }`}
                            >
                              URL
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeSwitch(index, "file")}
                              className={`px-3 py-1.5 font-medium transition-colors ${
                                entry.mode === "file"
                                  ? "bg-brand-500 text-white"
                                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
                              }`}
                            >
                              Từ máy
                            </button>
                          </div>
                        )}
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/15 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {entry.mode === "url" ? (
                      <input
                        type="text"
                        value={entry.url}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
                      />
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[index] = el; }}
                          onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 transition-colors text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400"
                        >
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          {entry.file ? (
                            <span className="font-medium text-brand-500">{entry.file.name}</span>
                          ) : (
                            <span>Nhấn để chọn ảnh từ máy</span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Preview */}
                    {entry.preview && (
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.preview}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <span className="text-xs text-gray-400 truncate max-w-xs">{entry.preview}</span>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm ảnh
                </button>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Thông tin giao hàng</h2>
              <textarea
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                rows={3}
                placeholder="Thông tin giao hàng, thời gian, chính sách..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500 resize-none"
              />
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Trạng thái</h2>
              <div className="space-y-4">
                {[
                  { label: "Hoạt động", value: isActive, set: setIsActive },
                  { label: "Sản phẩm nổi bật", value: isFeatured, set: setIsFeatured },
                ].map(({ label, value, set }) => (
                  <label key={label} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700 dark:text-gray-400">{label}</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={value} onChange={(e) => set(e.target.checked)} />
                      <div className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h2 className="font-semibold text-gray-800 dark:text-white/90 mb-5">Danh mục</h2>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {allCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                      {cat.parentId ? `↳ ${cat.name}` : cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                {loading
                  ? "Đang lưu..."
                  : mode === "create"
                  ? "Tạo sản phẩm"
                  : "Lưu thay đổi"}
              </button>
              <Link
                href="/products"
                className="w-full px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
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
