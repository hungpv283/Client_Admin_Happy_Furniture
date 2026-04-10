import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NewsForm from "@/components/news/NewsForm";

export const metadata: Metadata = {
  title: "Chỉnh sửa tin tức | Happy Furniture Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hf_token")?.value;
  if (!token) redirect("/login");

  const { id } = await params;
  return <NewsForm mode="edit" newsId={parseInt(id, 10)} />;
}
