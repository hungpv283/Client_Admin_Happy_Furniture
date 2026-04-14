"use client";

import { use } from "react";
import CompanyInfoForm from "@/components/company-info/CompanyInfoForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditCompanyInfoPage({ params }: Props) {
  const { id } = use(params);
  return <CompanyInfoForm mode="edit" companyInfoId={parseInt(id, 10)} />;
}
