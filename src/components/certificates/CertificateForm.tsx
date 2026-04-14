"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCertificate, getCertificateById, updateCertificate } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ImageUploadField from "@/components/news/ImageUploadField";

interface Props {
  mode: "create" | "edit";
  certificateId?: number;
}

export default function CertificateForm({ mode, certificateId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !certificateId) return;

    setFetching(true);
    getCertificateById(certificateId)
      .then((cert) => {
        setNameVi(cert.nameVi);
        setNameEn(cert.nameEn ?? "");
        setDescriptionVi(cert.descriptionVi ?? "");
        setDescriptionEn(cert.descriptionEn ?? "");
        setLogoUrl(cert.logoUrl ?? "");
        setSortOrder(cert.sortOrder ?? 0);
        setIsActive(cert.isActive);
      })
      .catch(() => toastError("Không thể tải thông tin chứng chỉ"))
      .finally(() => setFetching(false));
  }, [certificateId, mode, toastError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nameVi: nameVi.trim(),
        nameEn: nameEn.trim() || undefined,
        descriptionVi: descriptionVi.trim() || undefined,
        descriptionEn: descriptionEn.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        sortOrder,
        isActive,
      };

      if (mode === "create") {
        await createCertificate(payload);
      } else {
        await updateCertificate(certificateId!, payload);
      }

      success(
        mode === "create"
          ? "Tạo chứng chỉ thành công"
          : "Cập nhật chứng chỉ thành công"
      );
      router.push("/certificates");
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

  const inputCls =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";
  const textareaCls =
    "w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500";
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm chứng chỉ mới" : "Chỉnh sửa chứng chỉ"}
        </h1>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Tên */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Tên chứng chỉ (VI) <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={nameVi}
                onChange={(e) => setNameVi(e.target.value)}
                required
                placeholder="VD: C-TPAT, BSCI, SMETA"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tên chứng chỉ (EN)</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Certificate name in English"
                className={inputCls}
              />
            </div>
          </div>

          {/* Mô tả */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Mô tả (VI)</label>
              <textarea
                value={descriptionVi}
                onChange={(e) => setDescriptionVi(e.target.value)}
                rows={3}
                placeholder="VD: Supply chain security compliance"
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Mô tả (EN)</label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={3}
                placeholder="Description in English"
                className={textareaCls}
              />
            </div>
          </div>

          {/* Logo upload */}
          <ImageUploadField
            label="Logo chứng chỉ"
            value={logoUrl}
            onChange={setLogoUrl}
            placeholder="Dán URL hoặc upload ảnh logo"
            previewMaxHeight={120}
            folder="certificates"
            enableCrop
          />

          {/* Thứ tự + Trạng thái */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Thứ tự sắp xếp</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <div className="mt-1">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                      <input
                      type="checkbox"
                      className="sr-only"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <div
                      className={`h-6 w-11 rounded-full transition-colors ${
                        isActive ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                    <div
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {isActive ? "Đang hiển thị" : "Đang ẩn"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {loading
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo chứng chỉ"
                  : "Lưu thay đổi"}
            </button>
            <Link
              href="/certificates"
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
