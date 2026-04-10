import type { Metadata } from "next";
import NewsTable from "@/components/news/NewsTable";

export const metadata: Metadata = {
  title: "Tin tức | Happy Furniture Admin",
};

export default function NewsPage() {
  return (
    <div>
      <NewsTable />
    </div>
  );
}
