import type { Metadata } from "next";
import ContactsTable from "@/components/contacts/ContactsTable";

export const metadata: Metadata = {
  title: "Liên hệ | Happy Furniture Admin",
};

export default function ContactsPage() {
  return (
    <div>
      <ContactsTable />
    </div>
  );
}
