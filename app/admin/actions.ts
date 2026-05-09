"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function adminLogoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createCourseAction(prevState: any, formData: FormData) {
  const title = formData.get("title")?.toString().trim();
  const code = formData.get("code")?.toString().trim();
  const courseType = formData.get("course_type")?.toString().trim() || "محاضرة";

  if (!title) {
    return { error: "يرجى إدخال اسم المادة" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) {
    return { error: "غير مصرح لك بإجراء هذه العملية" };
  }

  const { error } = await supabase.from("courses").insert([{
    instructor_id: userData.user.id,
    title,
    code: code || null,
    course_type: courseType,
  }]);

  if (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء إضافة المادة" };
  }

  revalidatePath("/admin");
  return { success: true };
}

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";

export async function updateProfileNameAction(prevState: any, formData: FormData) {
  const newName = formData.get("name")?.toString().trim();
  
  if (!newName) {
    return { error: "يرجى إدخال الاسم الجديد." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "غير مصرح." };
  }

  // Use service role key to bypass RLS for instructors table
  const supabaseAdmin = createClient(
    supabaseUrl, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabaseAdmin.from("instructors").upsert({
    id: userData.user.id,
    name: newName,
  });

  if (error) {
    console.error("Failed to update name:", error);
    return { error: "حدث خطأ أثناء تحديث الاسم." };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function editCourseAction(prevState: any, formData: FormData) {
  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const code = formData.get("code")?.toString().trim();
  const courseType = formData.get("course_type")?.toString().trim() || "محاضرة";

  if (!id || !title) {
    return { error: "يرجى إدخال اسم المادة" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "غير مصرح" };
  }

  const { error } = await supabase
    .from("courses")
    .update({
      title,
      code: code || null,
      course_type: courseType,
    })
    .eq("id", id)
    .eq("instructor_id", userData.user.id);

  if (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء تعديل المادة" };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function deleteCourseAction(prevState: any, formData: FormData) {
  const id = formData.get("id")?.toString();

  if (!id) return { error: "معرف المادة غير موجود" };

  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "غير مصرح" };
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("instructor_id", userData.user.id);

  if (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء الحذف" };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/attendance");
  return { success: true };
}