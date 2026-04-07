import type { Metadata } from "next";
import AssembliesTable from "@/components/assemblies/AssembliesTable";

export const metadata: Metadata = {
  title: "Assemblies | Happy Furniture Admin",
};

export default function AssembliesPage() {
  return (
    <div>
      <AssembliesTable />
    </div>
  );
}
