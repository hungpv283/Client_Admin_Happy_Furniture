import type { Metadata } from "next";
import AssemblyForm from "@/components/assemblies/AssemblyForm";

export const metadata: Metadata = {
  title: "Sửa assembly | Happy Furniture Admin",
};

export default async function EditAssemblyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <AssemblyForm mode="edit" assemblyId={Number(id)} />
    </div>
  );
}
