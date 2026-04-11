import type { Metadata } from "next";
import NewsForm from "@/components/news/NewsForm";

export const metadata: Metadata = {
  title: "Chỉnh sửa tin tức | Happy Furniture Admin",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditNewsPage({ params }: Props) {
  const { id } = await params;
  return <NewsForm mode="edit" newsId={parseInt(id, 10)} />;
}
