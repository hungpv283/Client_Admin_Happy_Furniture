import type { Metadata } from "next";
import ProductForm from "@/components/products/ProductForm";

export const metadata: Metadata = {
  title: "Thêm sản phẩm | Happy Furniture Admin",
};

export default function CreateProductPage() {
  return (
    <div>
      <ProductForm mode="create" />
    </div>
  );
}
