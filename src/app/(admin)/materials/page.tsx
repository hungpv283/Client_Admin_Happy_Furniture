import type { Metadata } from "next";
import MaterialsTable from "@/components/materials/MaterialsTable";

export const metadata: Metadata = {
  title: "Chất liệu | Happy Furniture Admin",
};

export default function MaterialsPage() {
  return (
    <div>
      <MaterialsTable />
    </div>
  );
}
