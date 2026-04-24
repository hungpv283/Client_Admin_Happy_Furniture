"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteProductVariant,
  getProductById,
  getProductVariants,
  resolveSafeVariantSlug,
} from "@/lib/api";
import type { Product, ProductVariant } from "@/lib/api";
import { useToast } from "@/components/ui/toast/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

interface Props {
  productId: number;
}

export default function ProductVariantsTable({ productId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; colorName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productData, variantData] = await Promise.all([
        getProductById(productId),
        getProductVariants(productId, page, pageSize),
      ]);

      setProduct(productData);
      setVariants(variantData.items);
      setTotalPages(variantData.totalPages);
      setTotalCount(variantData.totalCount);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Loi tai du lieu");
    } finally {
      setLoading(false);
    }
  }, [page, productId, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDeleteConfirm = (id: number, colorName: string) => {
    setDeleteTarget({ id, colorName });
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deleteProductVariant(deleteTarget.id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      success(`Da xoa bien the "${deleteTarget.colorName}"`);
      await fetchData();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : "Xoa that bai");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div>
      <ConfirmDialog
        open={confirmOpen}
        title="Xoa bien the"
        message={`Ban co chac muon xoa bien the "${deleteTarget?.colorName}"? Hanh dong nay khong the hoan tac.`}
        confirmLabel="Xoa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/products" className="transition-colors hover:text-brand-500">
          San pham
        </Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="max-w-[200px] truncate font-medium text-gray-800 dark:text-white/80">
          {product ? product.name : `#${productId}`}
        </span>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-800 dark:text-white/80">Bien the</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Bien the san pham</h1>
          {product && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {product.name} - Tong cong {totalCount} bien the
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lai
          </button>
          <Link
            href={`/products/${productId}/variants/bulk-create`}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500 transition-colors hover:bg-brand-50 dark:hover:bg-brand-500/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Thêm nhiều biến thể
          </Link>
          <Link
            href={`/products/${productId}/variants/create`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm biến thể
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
                <th className="w-16 px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">ID</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Mau sac</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Slug</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Ma mau</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Hinh anh</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">Trang thai</th>
                <th className="px-5 py-4 text-right font-semibold text-gray-600 dark:text-gray-400">Thao tac</th>
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
              ) : variants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Chua co bien the nao
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">#{variant.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 flex-shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
                          style={{ backgroundColor: `#${variant.colorCode}` }}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-800 dark:text-white/90">{variant.colorName}</span>
                          {variant.isDefault && (
                            <span className="inline-flex w-fit items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {variant.isDefault ? (
                          <span className="text-xs italic text-gray-400 dark:text-gray-500">Dùng slug sản phẩm</span>
                        ) : (
                          <>
                            <span className="font-mono text-xs text-gray-600 dark:text-gray-300">
                              {resolveSafeVariantSlug(variant.slug, variant.colorName)}
                            </span>
                            {!variant.slug?.trim() && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                Fallback tu ten mau
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        #{variant.colorCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {variant.imageUrl ? (
                        <img
                          src={variant.imageUrl}
                          alt={variant.colorName}
                          className="h-12 w-12 rounded-lg bg-gray-100 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${variant.isActive ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${variant.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                        {variant.isActive ? "Hoat dong" : "An"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${productId}/variants/${variant.id}/images`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/25"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Anh
                        </Link>
                        <Link
                          href={`/products/${productId}/variants/${variant.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sua
                        </Link>
                        {!variant.isDefault && (
                          <button
                            onClick={() => openDeleteConfirm(variant.id, variant.colorName)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Xoa
                          </button>
                        )}
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
            label="bien the"
          />
        )}
      </div>
    </div>
  );
}
