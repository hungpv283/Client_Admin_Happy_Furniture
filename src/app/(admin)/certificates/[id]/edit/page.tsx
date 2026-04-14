"use client";

import { useParams } from "next/navigation";
import CertificateForm from "@/components/certificates/CertificateForm";

export default function EditCertificatePage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);

  return <CertificateForm mode="edit" certificateId={id} />;
}