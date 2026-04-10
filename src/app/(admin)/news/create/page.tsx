import type { Metadata } from "next";
import NewsForm from "@/components/news/NewsForm";

export const metadata: Metadata = {
  title: "Thêm tin tức | Happy Furniture Admin",
};

export default function CreateNewsPage() {
  return <NewsForm mode="create" />;
}
