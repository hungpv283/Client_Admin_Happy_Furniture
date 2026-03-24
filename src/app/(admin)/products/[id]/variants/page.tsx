import type { Metadata } from "next";
import ProductVariantsTable from "@/components/products/ProductVariantsTable";

export const metadata: Metadata = {
  title: "Biến thể sản phẩm | Happy Furniture Admin",
};

export default async function ProductVariantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <ProductVariantsTable productId={Number(id)} />
    </div>
  );
}
