import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Dashboard Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-heading text-lg font-bold text-blue-600 dark:text-blue-400">
              حضّرني | لوحة التحكم
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/admin" className="text-sm font-semibold hover:text-blue-500">الرئيسية</Link>
              <Link href="/admin/courses" className="text-sm font-semibold hover:text-blue-500">المواد الدراسية</Link>
              <Link href="/admin/students" className="text-sm font-semibold hover:text-blue-500">الطلاب</Link>
              <Link href="/admin/attendance" className="text-sm font-semibold hover:text-blue-500">الجلسات (التحضير)</Link>
              <Link href="/admin/analytics" className="text-sm font-semibold hover:text-blue-500">التحليلات</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
