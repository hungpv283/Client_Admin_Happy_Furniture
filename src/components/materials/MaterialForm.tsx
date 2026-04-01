"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMaterial, getMaterialById, updateMaterial } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";

interface Props {
  mode: "create" | "edit";
  materialId?: number;
}

export default function MaterialForm({ mode, materialId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !materialId) return;

    setFetching(true);
    getMaterialById(materialId)
      .then((material) => {
        setName(material.name);
        setDescription(material.description ?? "");
        setIsActive(material.isActive);
      })
      .catch(() => toastError("Không thể tải thông tin chất liệu"))
      .finally(() => setFetching(false));
  }, [materialId, mode, toastError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (mode === "create") {
        await createMaterial(payload);
      } else {
        await updateMaterial(materialId!, payload);
      }

      success(
        mode === "create"
          ? "Tạo chất liệu thành công"
          : "Cập nhật chất liệu thành công"
      );
      router.push("/materials");
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

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/materials"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>
        <span className="text-gray-300 dark:text-gray-700">/</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Thêm chất liệu mới" : "Chỉnh sửa chất liệu"}
        </h1>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tên chất liệu <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nhập tên chất liệu"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Nhập mô tả chất liệu"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white/90 dark:placeholder-gray-500"
              />
            </div>

            <div>
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
                  {isActive ? "Đang hoạt động" : "Đang ẩn"}
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {loading
                  ? "Đang lưu..."
                  : mode === "create"
                    ? "Tạo chất liệu"
                    : "Lưu thay đổi"}
              </button>
              <Link
                href="/materials"
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
