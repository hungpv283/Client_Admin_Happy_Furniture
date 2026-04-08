import type { Metadata } from "next";
import VariantImagesManager from "@/components/products/VariantImagesManager";

export const metadata: Metadata = {
  title: "Ảnh biến thể | Happy Furniture Admin",
};

export default async function VariantImagesPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id, variantId } = await params;
  return (
    <div>
      <VariantImagesManager
        productId={Number(id)}
        variantId={Number(variantId)}
      />
    </div>
  );
}
