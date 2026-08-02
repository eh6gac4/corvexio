"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { StatusBanner } from "@/components/StatusBanner";

export default function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEditRoute = pathname?.startsWith("/edit/") ?? false;

  return (
    <div className="flex h-full flex-col">
      <StatusBanner />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`w-full shrink-0 overflow-hidden border-zinc-200 dark:border-zinc-800 md:flex md:w-72 md:border-r ${
            isEditRoute ? "hidden md:flex" : "flex"
          }`}
        >
          <Sidebar />
        </aside>
        <div className={`flex-1 overflow-hidden ${isEditRoute ? "flex" : "hidden md:flex"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
