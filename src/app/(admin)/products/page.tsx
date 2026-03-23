import type { Metadata } from "next";
import ProductsTable from "@/components/products/ProductsTable";

export const metadata: Metadata = {
  title: "Sản phẩm | Happy Furniture Admin",
};

export default function ProductsPage() {
  return (
    <div>
      <ProductsTable />
    </div>
  );
}
