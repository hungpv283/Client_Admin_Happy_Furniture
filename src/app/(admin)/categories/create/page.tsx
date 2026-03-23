import type { Metadata } from "next";
import CategoryForm from "@/components/categories/CategoryForm";

export const metadata: Metadata = {
  title: "Thêm danh mục | Happy Furniture Admin",
};

export default function CreateCategoryPage() {
  return (
    <div>
      <CategoryForm mode="create" />
    </div>
  );
}
