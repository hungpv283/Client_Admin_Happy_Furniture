"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createProduct,
  createProductWithImages,
  getActiveMaterials,
  getActiveAssemblies,
  getCategories,
  getProductById,
  getRootCategories,
  updateProduct,
} from "@/lib/api";
import type { Assembly, Category, Material } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  productId?: number;
}

type ImageMode = "url" | "file";

type ImageEntry = {
  mode: ImageMode;
  url: string;
  file: File | null;
  preview: string;
};

const newEntry = (): ImageEntry => ({ mode: "url", url: "", file: null, preview: "" });

export default function ProductForm({ mode, productId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [dimensionsHeight, setDimensionsHeight] = useState("");
  const [dimensionsWidth, setDimensionsWidth] = useState("");
  const [dimensionsDepth, setDimensionsDepth] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [detail, setDetail] = useState("");
  const [detailEn, setDetailEn] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [deliveryInfoEn, setDeliveryInfoEn] = useState("");
  const [weight, setWeight] = useState("");
  const [deliveryHeight, setDeliveryHeight] = useState("");
  const [deliveryWidth, setDeliveryWidth] = useState("");
  const [deliveryDepth, setDeliveryDepth] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [assemblyId, setAssemblyId] = useState<number | "">("");
  const [selectedParentCategoryIds, setSelectedParentCategoryIds] = useState<number[]>([]);
  const [selectedChildCategoryIds, setSelectedChildCategoryIds] = useState<number[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([newEntry()]);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allAssemblies, setAllAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    getCategories(1, 100).then((data) => setAllCategories(data.items)).catch(() => { });
    getRootCategories().then(setRootCategories).catch(() => { });
    getActiveMaterials().then(setAllMaterials).catch(() => { });
    getActiveAssemblies().then(setAllAssemblies).catch(() => { });
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    setFetching(true);
    getProductById(productId)
      .then((product) => {
        setName(product.name);
        setNameEn(product.nameEn || "");
        setSlug(product.slug);
        setDescription(product.description || "");
        setDescriptionEn(product.descriptionEn || "");
        setDimensionsHeight(product.dimensionsHeight != null ? String(product.dimensionsHeight) : "");
        setDimensionsWidth(product.dimensionsWidth != null ? String(product.dimensionsWidth) : "");
        setDimensionsDepth(product.dimensionsDepth != null ? String(product.dimensionsDepth) : "");
        setDimensionUnit(product.dimensionUnit || "cm");
        setDetail(product.detail || "");
        setDetailEn(product.detailEn || "");
        setDeliveryInfo(product.deliveryInfo || "");
        setDeliveryInfoEn(product.deliveryInfoEn || "");
        setWeight(product.weight != null ? String(product.weight) : "");
        setDeliveryHeight(product.deliveryHeight != null ? String(product.deliveryHeight) : "");
        setDeliveryWidth(product.deliveryWidth != null ? String(product.deliveryWidth) : "");
        setDeliveryDepth(product.deliveryDepth != null ? String(product.deliveryDepth) : "");
        setIsFeatured(product.isFeatured);
        setIsActive(product.isActive);
        setAssemblyId(product.assemblyId ?? "");
        setSelectedParentCategoryIds(product.categories.filter((x) => x.parentId == null).map((x) => x.id));
        setSelectedChildCategoryIds(product.categories.filter((x) => x.parentId != null).map((x) => x.id));
        setSelectedMaterialIds(product.materials?.map((x) => x.id) ?? product.materialIds ?? []);
        const urls = product.images.map((img) => img.imageUrl).filter(Boolean);
        setImages(urls.length ? urls.map((url) => ({ mode: "url", url, file: null, preview: url })) : [newEntry()]);
      })
      .catch(() => toastError("Không thể tải thông tin sản phẩm"))
      .finally(() => setFetching(false));
  }, [mode, productId, toastError]);

  const childCategories = allCategories.filter((x) => x.parentId != null);
  const categoryIds = Array.from(new Set([...selectedParentCategoryIds, ...selectedChildCategoryIds]));

  const generateSlug = (value: string) =>
    value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  const handleNameChange = (value: string) => {
    setName(value);
    if (mode === "create") setSlug(generateSlug(value));
  };

  const toggle = (id: number, values: number[], setter: React.Dispatch<React.SetStateAction<number[]>>) => {
    setter(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  };

  const updateImage = (index: number, patch: Partial<ImageEntry>) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const hasFiles = images.some((img) => img.mode === "file" && img.file);

    try {
      const resolvedAssemblyId = assemblyId === "" ? null : Number(assemblyId);
      if (mode === "create" && hasFiles) {
        await createProductWithImages({
          name,
          nameEn: nameEn || undefined,
          slug,
          description,
          descriptionEn: descriptionEn || undefined,
          dimensionsHeight: dimensionsHeight ? parseFloat(dimensionsHeight) : null,
          dimensionsWidth: dimensionsWidth ? parseFloat(dimensionsWidth) : null,
          dimensionsDepth: dimensionsDepth ? parseFloat(dimensionsDepth) : null,
          dimensionUnit,
          detail,
          detailEn: detailEn || undefined,
          deliveryInfo,
          deliveryInfoEn: deliveryInfoEn || undefined,
          weight: weight ? parseFloat(weight) : null,
          deliveryHeight: deliveryHeight ? parseFloat(deliveryHeight) : null,
          deliveryWidth: deliveryWidth ? parseFloat(deliveryWidth) : null,
          deliveryDepth: deliveryDepth ? parseFloat(deliveryDepth) : null,
          isFeatured,
          isActive,
          assemblyId: resolvedAssemblyId,
          categoryIds,
          materialIds: selectedMaterialIds,
          images: images.filter((img) => img.mode === "file" && img.file).map((img) => img.file!),
        });
      } else {
        const payload = {
          name,
          nameEn: nameEn || undefined,
          slug,
          description,
          descriptionEn: descriptionEn || undefined,
          dimensionsHeight: dimensionsHeight ? parseFloat(dimensionsHeight) : null,
          dimensionsWidth: dimensionsWidth ? parseFloat(dimensionsWidth) : null,
          dimensionsDepth: dimensionsDepth ? parseFloat(dimensionsDepth) : null,
          dimensionUnit,
          detail,
          detailEn: detailEn || undefined,
          deliveryInfo,
          deliveryInfoEn: deliveryInfoEn || undefined,
          weight: weight ? parseFloat(weight) : null,
          deliveryHeight: deliveryHeight ? parseFloat(deliveryHeight) : null,
          deliveryWidth: deliveryWidth ? parseFloat(deliveryWidth) : null,
          deliveryDepth: deliveryDepth ? parseFloat(deliveryDepth) : null,
          isFeatured,
          isActive,
          assemblyId: resolvedAssemblyId,
          categoryIds,
          materialIds: selectedMaterialIds,
          imageUrls: images.filter((img) => img.mode === "url" && img.url.trim()).map((img) => img.url.trim()),
        };
        if (mode === "create") await createProduct(payload);
        else await updateProduct(productId!, payload);
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
    return <div className="flex min-h-40 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">{mode === "create" ? "Thêm sản phẩm mới" : "Chỉnh sửa sản phẩm"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên sản phẩm (VI) <span className="text-error-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Nhập tên sản phẩm" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên sản phẩm (EN)</label>
                    <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Product name in English" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Slug <span className="text-error-500">*</span></label>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="ten-san-pham" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả ngắn (VI)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả ngắn về sản phẩm" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả ngắn (EN)</label>
                    <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={3} placeholder="Short description in English" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả chi tiết (VI)</label>
                    <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={5} placeholder="Mô tả chi tiết về sản phẩm" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mô tả chi tiết (EN)</label>
                    <textarea value={detailEn} onChange={(e) => setDetailEn(e.target.value)} rows={5} placeholder="Detailed description in English" className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Kích thước & Trọng lượng</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Chiều cao", value: dimensionsHeight, set: setDimensionsHeight },
                  { label: "Chiều rộng", value: dimensionsWidth, set: setDimensionsWidth },
                  { label: "Chiều sâu", value: dimensionsDepth, set: setDimensionsDepth },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</label>
                    <input type="number" value={value} onChange={(e) => set(e.target.value)} min="0" step="0.1" placeholder="0" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Đơn vị</label>
                  <select value={dimensionUnit} onChange={(e) => setDimensionUnit(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                    <option value="cm">cm</option><option value="m">m</option><option value="mm">mm</option><option value="inch">inch</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Trọng lượng (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" step="0.1" placeholder="0" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-1 font-semibold text-gray-800 dark:text-white/90">Hình ảnh</h2>
              <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">{mode === "create" ? <>Mỗi ảnh có thể nhập URL <em>hoặc</em> chọn file từ máy. Nếu có ít nhất 1 file từ máy, hệ thống sẽ upload qua API multipart.</> : "Chỉnh sửa URL ảnh hiện tại."}</p>
              <div className="space-y-4">
                {images.map((entry, index) => (
                  <div key={index} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ảnh #{index + 1}</span>
                      <div className="flex items-center gap-3">
                        {mode === "create" && (
                          <div className="flex overflow-hidden rounded-lg border border-gray-200 text-xs dark:border-gray-700">
                            <button type="button" onClick={() => updateImage(index, { mode: "url", url: "", file: null, preview: "" })} className={`px-3 py-1.5 font-medium transition-colors ${entry.mode === "url" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"}`}>URL</button>
                            <button type="button" onClick={() => updateImage(index, { mode: "file", url: "", file: null, preview: "" })} className={`px-3 py-1.5 font-medium transition-colors ${entry.mode === "file" ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"}`}>Từ máy</button>
                          </div>
                        )}
                        {images.length > 1 && <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg p-1.5 text-error-500 transition-colors hover:bg-error-50 dark:hover:bg-error-500/15"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                      </div>
                    </div>
                    {entry.mode === "url" ? (
                      <input type="text" value={entry.url} onChange={(e) => updateImage(index, { url: e.target.value, preview: e.target.value })} placeholder="https://example.com/image.jpg" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                    ) : (
                      <div>
                        <input type="file" accept="image/*" className="hidden" ref={(el) => { fileInputRefs.current[index] = el; }} onChange={(e) => { const file = e.target.files?.[0] ?? null; if (!file) return; updateImage(index, { file, preview: URL.createObjectURL(file) }); }} />
                        <button type="button" onClick={() => fileInputRefs.current[index]?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-6 text-sm text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"><svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{entry.file ? <span className="font-medium text-brand-500">{entry.file.name}</span> : <span>Nhấn để chọn ảnh từ máy</span>}</button>
                      </div>
                    )}
                    {entry.preview && <div className="flex items-center gap-3"><img src={entry.preview} alt="" className="h-16 w-16 rounded-lg border border-gray-200 object-cover dark:border-gray-700" /><span className="max-w-xs truncate text-xs text-gray-400">{entry.preview}</span></div>}
                  </div>
                ))}
                <button type="button" onClick={() => setImages((prev) => [...prev, newEntry()])} className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Thêm ảnh</button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Thông tin giao hàng</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Thông tin giao hàng (VI)</label>
                    <textarea value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} rows={3} placeholder="Thông tin giao hàng, thời gian, chính sách..." className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Thông tin giao hàng (EN)</label>
                    <textarea value={deliveryInfoEn} onChange={(e) => setDeliveryInfoEn(e.target.value)} rows={3} placeholder="Delivery information in English..." className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Cao khi giao", value: deliveryHeight, set: setDeliveryHeight },
                    { label: "Rộng khi giao", value: deliveryWidth, set: setDeliveryWidth },
                    { label: "Sâu khi giao", value: deliveryDepth, set: setDeliveryDepth },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</label>
                      <input type="number" value={value} onChange={(e) => set(e.target.value)} min="0" step="0.1" placeholder="0" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Trạng thái</h2>
              <div className="space-y-4">
                {[
                  { label: "Hoạt động", value: isActive, set: setIsActive },
                  { label: "Sản phẩm nổi bật", value: isFeatured, set: setIsFeatured },
                ].map(({ label, value, set }) => (
                  <label key={label} className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-400">{label}</span>
                    <div className="relative"><input type="checkbox" className="sr-only" checked={value} onChange={(e) => set(e.target.checked)} /><div className={`h-6 w-11 rounded-full transition-colors ${value ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`} /><div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} /></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Lắp ráp (Assembly)</h2>
              <select
                value={assemblyId}
                onChange={(e) => setAssemblyId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Không có</option>
                {allAssemblies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Danh mục con</h2>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {rootCategories.map((category) => (
                  <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <input type="checkbox" checked={selectedParentCategoryIds.includes(category.id)} onChange={() => toggle(category.id, selectedParentCategoryIds, setSelectedParentCategoryIds)} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-400">{category.name.trim()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Danh mục cha</h2>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {childCategories.map((category) => (
                  <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <input type="checkbox" checked={selectedChildCategoryIds.includes(category.id)} onChange={() => toggle(category.id, selectedChildCategoryIds, setSelectedChildCategoryIds)} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-400">{category.name.trim()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="mb-5 font-semibold text-gray-800 dark:text-white/90">Chất liệu</h2>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {allMaterials.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có chất liệu đang hoạt động</p> : allMaterials.map((material) => (
                  <label key={material.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                    <input type="checkbox" checked={selectedMaterialIds.includes(material.id)} onChange={() => toggle(material.id, selectedMaterialIds, setSelectedMaterialIds)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    <div className="min-w-0"><span className="block text-sm text-gray-700 dark:text-gray-400">{material.name}</span>{material.description && <span className="block truncate text-xs text-gray-500 dark:text-gray-500">{material.description}</span>}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60">{loading ? "Đang lưu..." : mode === "create" ? "Tạo sản phẩm" : "Lưu thay đổi"}</button>
              <Link href="/products" className="w-full rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">Hủy</Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
