"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCompanyInfo, getCompanyInfoById, updateCompanyInfo } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  companyInfoId?: number;
}

export default function CompanyInfoForm({ mode, companyInfoId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [email, setEmail] = useState("");
  const [phoneVi, setPhoneVi] = useState("");
  const [phoneEn, setPhoneEn] = useState("");
  const [faxVi, setFaxVi] = useState("");
  const [faxEn, setFaxEn] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !companyInfoId) return;

    setFetching(true);
    getCompanyInfoById(companyInfoId)
      .then((item) => {
        setNameVi(item.nameVi);
        setNameEn(item.nameEn ?? "");
        setEmail(item.email ?? "");
        setPhoneVi(item.phoneVi ?? "");
        setPhoneEn(item.phoneEn ?? "");
        setFaxVi(item.faxVi ?? "");
        setFaxEn(item.faxEn ?? "");
        setSortOrder(item.sortOrder ?? 0);
        setIsActive(item.isActive);
      })
      .catch(() => toastError("Không thể tải thông tin"))
      .finally(() => setFetching(false));
  }, [companyInfoId, mode, toastError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nameVi: nameVi.trim(),
        nameEn: nameEn.trim() || undefined,
        email: email.trim() || undefined,
        phoneVi: phoneVi.trim() || undefined,
        phoneEn: phoneEn.trim() || undefined,
        faxVi: faxVi.trim() || undefined,
        faxEn: faxEn.trim() || undefined,
        sortOrder,
        isActive,
      };

      if (mode === "create") {
        await createCompanyInfo(payload);
      } else {
        await updateCompanyInfo(companyInfoId!, payload);
      }

      success(
        mode === "create"
          ? "Tạo thành công"
          : "Cập nhật thành công"
      );
      router.push("/company-info");
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
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/company-info"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm thông tin công ty" : "Chỉnh sửa thông tin công ty"}
        </h1>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Tên */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Tên (VI) <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={nameVi}
                onChange={(e) => setNameVi(e.target.value)}
                required
                placeholder="VD: Công ty TNHH Happy Furniture"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tên (EN)</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Company name in English"
                className={inputCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@happyfurniture.com"
              className={inputCls}
            />
          </div>

          {/* Điện thoại */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Điện thoại (VI)</label>
              <input
                type="text"
                value={phoneVi}
                onChange={(e) => setPhoneVi(e.target.value)}
                placeholder="VD: 0909 123 456"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Điện thoại (EN)</label>
              <input
                type="text"
                value={phoneEn}
                onChange={(e) => setPhoneEn(e.target.value)}
                placeholder="Phone in English"
                className={inputCls}
              />
            </div>
          </div>

          {/* Fax */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fax (VI)</label>
              <input
                type="text"
                value={faxVi}
                onChange={(e) => setFaxVi(e.target.value)}
                placeholder="VD: 028 1234 5678"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fax (EN)</label>
              <input
                type="text"
                value={faxEn}
                onChange={(e) => setFaxEn(e.target.value)}
                placeholder="Fax in English"
                className={inputCls}
              />
            </div>
          </div>

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
                  ? "Tạo mới"
                  : "Lưu thay đổi"}
            </button>
            <Link
              href="/company-info"
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
