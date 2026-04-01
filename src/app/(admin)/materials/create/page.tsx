import type { Metadata } from "next";
import MaterialForm from "@/components/materials/MaterialForm";

export const metadata: Metadata = {
  title: "Thêm chất liệu | Happy Furniture Admin",
};

export default function CreateMaterialPage() {
  return (
    <div>
      <MaterialForm mode="create" />
    </div>
  );
}
