import { adminLogoutAction } from "@/app/admin/actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return null;

  // Fetch Instructor Info
  const { data: instructor } = await supabase
    .from("instructors")
    .select("name")
    .eq("id", userData.user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header & Logout */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            مرحباً، {instructor?.name || "دكتور"}
          </h1>
          <p className="mt-2 text-sm opacity-70 font-semibold">
            لوحة التحكم الرئيسية لمنظومة حضّرني
          </p>
        </div>

        <form action={adminLogoutAction}>
          <Button type="submit" variant="destructive" className="font-bold">
            تسجيل الخروج
          </Button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold border-b border-white/10 pb-4">بيانات الحساب</h2>
          <div className="space-y-2">
            <p><span className="opacity-70">الاسم:</span> <span className="font-bold">{instructor?.name}</span></p>
            <p><span className="opacity-70">البريد الإلكتروني:</span> <span className="font-bold">{userData.user.email}</span></p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl bg-blue-600/10 border-blue-500/20 flex flex-col justify-center items-center text-center space-y-4">
          <div className="text-4xl">🚀</div>
          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">نظام حضّرني مفعل</h3>
          <p className="text-sm opacity-80">يمكنك الآن التوجه لصفحة "المواد" لإضافة مقرراتك، ثم "الطلاب" لرفع قوائم الكشوف.</p>
        </div>
      </div>
    </main>
  );
}
