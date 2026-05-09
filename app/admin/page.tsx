import { adminLogoutAction } from "@/app/admin/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from "lucide-react";
import { EditProfileName } from "@/components/admin/edit-profile-name";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return null;

  // Use admin client to bypass RLS since public.instructors has no SELECT policy
  const supabaseAdmin = createClient(
    supabaseUrl, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch Instructor Info
  const { data: instructor } = await supabaseAdmin
    .from("instructors")
    .select("name")
    .eq("id", userData.user.id)
    .single();

  const displayName = instructor?.name || userData.user.email?.split('@')[0] || "المستخدم";

  // Fetch real stats for this instructor
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, code")
    .eq("instructor_id", userData.user.id);

  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header & Logout */}
  <section className="glass-panel rounded-3xl p-6 md:p-8 flex items-center justify-between">
    <div className="flex items-center gap-5">
      {/* Profile Picture Circle */}
      <div className="relative group shrink-0">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-blue-600/50 shadow-inner">
          <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg transform transition-transform group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
      </div>

      <div>
        <EditProfileName initialName={displayName} />
        <p className="mt-2 text-sm opacity-70 font-semibold">
          لوحة التحكم الرئيسية لمنظومة حضّرني
        </p>
      </div>
    </div>

    <form action={adminLogoutAction}>
      <Button type="submit" variant="destructive" className="font-bold rounded-xl px-6">
        تسجيل الخروج
      </Button>
    </form>
  </section>

      {/* Profile & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold border-b border-black/10 dark:border-white/10 pb-3">بيانات الحساب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="opacity-60">الاسم</span>
              <span className="font-bold">{displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">البريد الإلكتروني</span>
              <span className="font-bold text-xs">{userData.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">عدد المواد</span>
              <span className="font-bold">{courses?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">إجمالي الطلاب</span>
              <span className="font-bold">{studentCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">سجلات التحضير</span>
              <span className="font-bold">{sessionCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Quick Actions */}
          <h2 className="text-lg font-bold">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/attendance" className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-blue-500/5 transition group">
              <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 group-hover:underline">بدء سجل تحضير</h3>
              <p className="text-xs opacity-60">افتح سجل جديد واعرض QR Code للطلاب لتسجيل الحضور.</p>
            </Link>
            <Link href="/admin/students" className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-blue-500/5 transition group">
              <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 group-hover:underline">إدارة الطلاب</h3>
              <p className="text-xs opacity-60">رفع شيتات Excel، تصدير البيانات، أو تعديل بيانات الطلاب.</p>
            </Link>
            <Link href="/admin/courses" className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-blue-500/5 transition group">
              <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 group-hover:underline">إدارة المواد</h3>
              <p className="text-xs opacity-60">إضافة مواد دراسية جديدة أو استعراض الموجود.</p>
            </Link>
            <Link href="/admin/analytics" className="glass-panel p-5 rounded-2xl flex flex-col gap-2 hover:bg-blue-500/5 transition group">
              <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 group-hover:underline">التحليلات والإحصائيات</h3>
              <p className="text-xs opacity-60">نظرة عامة على أداء المنظومة وحجم البيانات.</p>
            </Link>
          </div>

          {/* Courses Summary */}
          {courses && courses.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3">موادك الدراسية</h2>
              <div className="flex flex-wrap gap-3">
                {courses.map((c) => (
                  <div key={c.id} className="glass-panel px-4 py-3 rounded-xl flex items-center gap-3">
                    <span className="font-bold text-sm">{c.title}</span>
                    {c.code && <span className="bg-blue-500/10 text-blue-600 text-xs px-2 py-0.5 rounded font-bold">{c.code}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
