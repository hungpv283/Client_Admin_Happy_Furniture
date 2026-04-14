"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deleteCompanyInfo, getCompanyInfos } from "@/lib/api";
import type { CompanyInfoType, CompanyInfoFilters } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function CompanyInfoTable() {
  const { success, error: toastError } = useToast();
  const toastErrorRef = useRef(toastError);
  toastErrorRef.current = toastError;
  const [items, setItems] = useState<CompanyInfoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [filters, setFilters] = useState({ name: "", isActive: "" });
  const [appliedFilters, setAppliedFilters] = useState<CompanyInfoFilters>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nameVi: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyInfos(page, pageSize, appliedFilters);
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (err: unknown) {
      toastErrorRef.current(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteConfirm = (id: number, nameVi: string) => {
    setDeleteTarget({ id, nameVi });
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompanyInfo(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      success(`Đã xóa "${deleteTarget.nameVi}"`);
      await fetchData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters({
      name: filters.name.trim() || undefined,
      isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
    });
  };

  const handleClearFilters = () => {
    setFilters({ name: "", isActive: "" });
    setPage(1);
    setAppliedFilters({});
  };

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa thông tin công ty"
        message={`Bạn có chắc muốn xóa "${deleteTarget?.nameVi}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Thông tin công ty</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng cộng {total} mục
          </p>
        </div>
        <Link
          href="/company-info/create"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm mới
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Bộ lọc tìm kiếm</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lọc theo tên và trạng thái.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tên</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Trạng thái</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Tất cả</option>
              <option value="true">Hoạt động</option>
              <option value="false">Ẩn</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Lọc
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Xóa lọc
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                <th className="w-16 px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">ID</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Tên (VI)</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Tên (EN)</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Email</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Điện thoại</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Fax</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Trạng thái</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-600 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    Chưa có thông tin công ty nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">#{item.id}</td>
                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">{item.nameVi}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.nameEn || "-"}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{item.email || "-"}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {item.phoneVi && <div>VI: {item.phoneVi}</div>}
                      {item.phoneEn && <div>EN: {item.phoneEn}</div>}
                      {!item.phoneVi && !item.phoneEn && "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {item.faxVi && <div>VI: {item.faxVi}</div>}
                      {item.faxEn && <div>EN: {item.faxEn}</div>}
                      {!item.faxVi && !item.faxEn && "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.isActive
                            ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                        {item.isActive ? "Hoạt động" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/company-info/${item.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </Link>
                        <button
                          onClick={() => openDeleteConfirm(item.id, item.nameVi)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
