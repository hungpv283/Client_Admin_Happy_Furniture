import type { Metadata } from "next";
import CategoriesTable from "@/components/categories/CategoriesTable";

export const metadata: Metadata = {
  title: "Danh mục | Happy Furniture Admin",
};

export default function CategoriesPage() {
  return (
    <div>
      <CategoriesTable />
    </div>
  );
}
