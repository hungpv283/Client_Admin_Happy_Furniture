import type { Metadata } from "next";
import AssemblyForm from "@/components/assemblies/AssemblyForm";

export const metadata: Metadata = {
  title: "Thêm assembly | Happy Furniture Admin",
};

export default function CreateAssemblyPage() {
  return (
    <div>
      <AssemblyForm mode="create" />
    </div>
  );
}
