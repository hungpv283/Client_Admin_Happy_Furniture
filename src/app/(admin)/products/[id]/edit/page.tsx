import type { Metadata } from "next";
import ProductForm from "@/components/products/ProductForm";

export const metadata: Metadata = {
  title: "Sửa sản phẩm | Happy Furniture Admin",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <ProductForm mode="edit" productId={Number(id)} />
    </div>
  );
}
