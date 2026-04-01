import type { Metadata } from "next";
import MaterialForm from "@/components/materials/MaterialForm";

export const metadata: Metadata = {
  title: "Sửa chất liệu | Happy Furniture Admin",
};

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <MaterialForm mode="edit" materialId={Number(id)} />
    </div>
  );
}
