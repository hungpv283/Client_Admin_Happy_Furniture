import type { Metadata } from "next";
import React from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";

export const metadata: Metadata = {
  title: "Dashboard | Happy Furniture Admin",
  description: "Happy Furniture Admin Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Chào mừng đến với Happy Furniture Admin
        </p>
      </div>
      <DashboardStats />
    </div>
  );
}
