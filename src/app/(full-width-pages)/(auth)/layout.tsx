import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-sm px-4">
                <Link
                  href="/"
                  className="mb-6 block w-full rounded-2xl bg-white px-5 py-6 shadow-xl shadow-black/20 ring-1 ring-black/5 dark:bg-stone-50 dark:ring-white/10"
                >
                  <Image
                    src="/images/logo-brown.png"
                    alt="Happy Furniture"
                    width={320}
                    height={90}
                    className="mx-auto h-auto w-full max-w-[280px] object-contain"
                    priority
                  />
                </Link>
                <p className="text-center text-sm leading-relaxed text-gray-400 dark:text-white/70">
                  <span className="font-semibold text-white/90">Happy Furniture</span> — nội thất cho cuộc sống tiện nghi hơn. Trang quản trị giúp bạn đồng bộ nội dung và sản phẩm với website thương hiệu.
                </p>
                <p className="mt-3 text-center text-xs italic text-gray-500 dark:text-white/45">
                  Make life more convenient
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
