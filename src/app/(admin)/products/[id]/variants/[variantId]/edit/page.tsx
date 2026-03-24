import type { Metadata } from "next";
import ProductVariantForm from "@/components/products/ProductVariantForm";

export const metadata: Metadata = {
  title: "Sửa biến thể | Happy Furniture Admin",
};

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;
  return (
    <div>
      <ProductVariantForm
        mode="edit"
        productId={Number(id)}
        variantId={Number(variantId)}
      />
    </div>
  );
}
