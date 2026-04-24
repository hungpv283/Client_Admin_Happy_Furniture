import type { Metadata } from "next";
import BulkVariantForm from "@/components/products/BulkVariantForm";

export const metadata: Metadata = {
  title: "Thêm nhiều biến thể | Happy Furniture Admin",
};

export default async function BulkCreateVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <BulkVariantForm productId={Number(id)} />
    </div>
  );
}
