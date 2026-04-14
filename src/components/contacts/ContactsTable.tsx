"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { deleteContact, getContacts, markContactAsRead } from "@/lib/api";
import type { Contact, ContactsFilters } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

export default function ContactsTable() {
  const { success, error: toastError } = useToast();
  const toastErrorRef = useRef(toastError);
  toastErrorRef.current = toastError;

  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [filters, setFilters] = useState({ isRead: "" });
  const [appliedFilters, setAppliedFilters] = useState<ContactsFilters>({});

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContacts(page, pageSize, appliedFilters);
      setItems(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      toastErrorRef.current(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openDetail = async (contact: Contact) => {
    setSelectedContact(contact);
    setDetailOpen(true);
    if (!contact.isRead) {
      setMarkingRead(true);
      try {
        await markContactAsRead(contact.id);
        setItems((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, isRead: true } : c))
        );
        setSelectedContact((prev) => (prev ? { ...prev, isRead: true } : null));
      } catch {
        // ignore
      } finally {
        setMarkingRead(false);
      }
    }
  };

  const openDeleteConfirm = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContact(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      setDetailOpen(false);
      setSelectedContact(null);
      success(`Đã xóa liên hệ của "${deleteTarget.name}"`);
      await fetchContacts();
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
      isRead: filters.isRead === "" ? undefined : filters.isRead === "true",
    });
  };

  const handleClearFilters = () => {
    setFilters({ isRead: "" });
    setPage(1);
    setAppliedFilters({});
  };

  const unreadCount = items.filter((c) => !c.isRead).length;

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa liên hệ"
        message={`Bạn có chắc muốn xóa liên hệ của "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Detail Modal */}
      {detailOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">Chi tiết liên hệ</h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  #{selectedContact.id} — {new Date(selectedContact.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => { setDetailOpen(false); setSelectedContact(null); }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Họ tên</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Email</p>
                  <a href={`mailto:${selectedContact.email}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                    {selectedContact.email}
                  </a>
                </div>
                {selectedContact.phoneNumber && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Điện thoại</p>
                    <a href={`tel:${selectedContact.phoneNumber}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                      {selectedContact.phoneNumber}
                    </a>
                  </div>
                )}
                {selectedContact.address && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Địa chỉ</p>
                    <p className="text-gray-700 dark:text-white/70">{selectedContact.address}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Chủ đề</p>
                <p className="font-semibold text-gray-800 dark:text-white/90">{selectedContact.subject}</p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Nội dung</p>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/5 dark:text-white/70">
                  {selectedContact.message}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedContact.isRead
                      ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                      : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedContact.isRead ? "bg-green-500" : "bg-yellow-500"}`} />
                  {selectedContact.isRead ? "Đã đọc" : "Chưa đọc"}
                </span>
                <button
                  onClick={() => selectedContact && openDeleteConfirm(selectedContact.id, selectedContact.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Liên hệ</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng cộng {totalCount} liên hệ
            {unreadCount > 0 && <span className="ml-2 text-yellow-600 dark:text-yellow-400">({unreadCount} chưa đọc)</span>}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Bộ lọc tìm kiếm</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lọc liên hệ theo trạng thái đã đọc.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Trạng thái</label>
            <select
              value={filters.isRead}
              onChange={(e) => setFilters((prev) => ({ ...prev, isRead: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">Tất cả</option>
              <option value="false">Chưa đọc</option>
              <option value="true">Đã đọc</option>
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/2">
                <th className="w-16 px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">ID</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Họ tên</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Email</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Chủ đề</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Ngày gửi</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Trạng thái</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-600 dark:text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (

                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Chưa có liên hệ nào
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/2 ${!item.isRead ? "bg-yellow-50/40 dark:bg-yellow-500/5" : ""}`}
                  >
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">#{item.id}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openDetail(item)}
                        className="text-left font-medium text-gray-800 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400"
                      >
                        {item.name}
                      </button>
                      {item.phoneNumber && (
                        <p className="mt-0.5 text-xs text-gray-500">{item.phoneNumber}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      <a href={`mailto:${item.email}`} className="hover:text-brand-600 dark:hover:text-brand-400">
                        {item.email}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      <span className="line-clamp-1">{item.subject}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.isRead
                            ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.isRead ? "bg-green-500" : "bg-yellow-500"}`} />
                        {item.isRead ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Xem
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(item.id, item.name)}
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
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            label="liên hệ"
          />
        )}
      </div>
    </div>
  );
}
