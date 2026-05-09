import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreateCourseForm } from "@/components/admin/create-course-form";
import { EditCourseCard } from "@/components/admin/edit-course-card";

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return null;

  // Fetch Courses with Enrollment Counts
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      code,
      course_type,
      course_enrollments (count)
    `)
    .eq("instructor_id", userData.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight">المواد الدراسية</h1>
        <p className="mt-2 text-sm opacity-70">إدارة موادك وإضافة مواد جديدة للمنظومة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CreateCourseForm />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses?.map((course) => (
              <EditCourseCard key={course.id} course={course} />
            ))}

            {(!courses || courses.length === 0) && (
              <div className="md:col-span-2 text-center p-12 border border-dashed border-white/20 rounded-2xl">
                <p className="opacity-60 font-semibold">لا يوجد مواد حالياً. أضف مادتك الأولى للبدء.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
