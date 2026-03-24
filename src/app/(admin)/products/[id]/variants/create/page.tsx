import type { Metadata } from "next";
import ProductVariantForm from "@/components/products/ProductVariantForm";

export const metadata: Metadata = {
  title: "Thêm biến thể | Happy Furniture Admin",
};

export default async function CreateVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <ProductVariantForm mode="create" productId={Number(id)} />
    </div>
  );
}
