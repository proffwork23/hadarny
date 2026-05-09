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
  }]);

  if (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء إضافة المادة" };
  }

  revalidatePath("/admin");
  return { success: true };
}