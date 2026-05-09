import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  
  // Basic stats for MVP
  const [{ count: studentCount }, { count: courseCount }, { count: sessionCount }] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight">التحليلات والإحصائيات</h1>
        <p className="mt-2 text-sm opacity-70">نظرة عامة على أداء المنظومة وحجم البيانات المسجلة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 rounded-3xl text-center space-y-2 bg-blue-500/5">
          <div className="text-4xl">👥</div>
          <h2 className="text-xl font-bold">إجمالي الطلاب</h2>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{studentCount || 0}</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl text-center space-y-2 bg-green-500/5">
          <div className="text-4xl">📚</div>
          <h2 className="text-xl font-bold">إجمالي المواد</h2>
          <p className="text-4xl font-black text-green-600 dark:text-green-400">{courseCount || 0}</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl text-center space-y-2 bg-purple-500/5">
          <div className="text-4xl">⏱️</div>
          <h2 className="text-xl font-bold">الجلسات المكتملة</h2>
          <p className="text-4xl font-black text-purple-600 dark:text-purple-400">{sessionCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
