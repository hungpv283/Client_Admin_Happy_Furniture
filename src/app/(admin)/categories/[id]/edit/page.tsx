import type { Metadata } from "next";
import CategoryForm from "@/components/categories/CategoryForm";

export const metadata: Metadata = {
  title: "Sửa danh mục | Happy Furniture Admin",
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <CategoryForm mode="edit" categoryId={Number(id)} />
    </div>
  );
}
