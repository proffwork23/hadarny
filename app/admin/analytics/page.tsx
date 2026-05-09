import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  // Stats scoped to this instructor
  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("instructor_id", userData.user.id);

  const courseIds = courses?.map(c => c.id) || [];

  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .in("course_id", courseIds.length > 0 ? courseIds : ["none"]);

  const { count: attendanceCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight">التحليلات والإحصائيات</h1>
        <p className="mt-2 text-sm opacity-70">نظرة عامة على أداء المنظومة وحجم البيانات المسجلة.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
          <p className="text-sm opacity-60 font-semibold">إجمالي الطلاب</p>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{studentCount || 0}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
          <p className="text-sm opacity-60 font-semibold">المواد الدراسية</p>
          <p className="text-4xl font-black text-green-600 dark:text-green-400">{courseIds.length}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
          <p className="text-sm opacity-60 font-semibold">الجلسات المنعقدة</p>
          <p className="text-4xl font-black text-purple-600 dark:text-purple-400">{sessionCount || 0}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl text-center space-y-2">
          <p className="text-sm opacity-60 font-semibold">إجمالي سجلات الحضور</p>
          <p className="text-4xl font-black text-amber-600 dark:text-amber-400">{attendanceCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
