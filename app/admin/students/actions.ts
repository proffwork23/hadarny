"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function deleteStudentAction(studentCode: string) {
  const supabase = await createServerSupabaseClient();
  
  // Delete enrollments first (cascade should handle it but just in case)
  await supabase.from("course_enrollments").delete().eq("student_code", studentCode);
  await supabase.from("attendance").delete().eq("student_code", studentCode);
  
  const { error } = await supabase.from("students").delete().eq("student_code", studentCode);
  
  if (error) {
    return { error: "فشل حذف الطالب: " + error.message };
  }
  
  revalidatePath("/admin/students");
  return { success: true };
}

export async function resetFingerprintAction(studentCode: string) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from("students")
    .update({ device_fingerprint: null })
    .eq("student_code", studentCode);
  
  if (error) {
    return { error: "فشل إعادة ضبط بصمة الجهاز: " + error.message };
  }
  
  revalidatePath("/admin/students");
  return { success: true, message: "تم مسح بصمة الجهاز بنجاح. يمكن للطالب التسجيل من جهاز جديد." };
}

export async function updateStudentNotesAction(studentCode: string, notes: string) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from("students")
    .update({ notes })
    .eq("student_code", studentCode);
  
  if (error) {
    return { error: "فشل تحديث الملاحظات: " + error.message };
  }
  
  revalidatePath("/admin/students");
  return { success: true };
}

export async function uploadStudentsAction(courseId: string, studentsData: any[], enrollmentsData: any[]) {
  const supabase = await createServerSupabaseClient();
  
  // Upsert students
  const { error: stuError } = await supabase
    .from("students")
    .upsert(studentsData, { onConflict: "student_code" });
    
  if (stuError) {
    return { error: "فشل رفع بيانات الطلاب: " + stuError.message };
  }
  
  // Upsert enrollments
  const { error: enrError } = await supabase
    .from("course_enrollments")
    .upsert(enrollmentsData, { onConflict: "course_id,student_code" });
    
  if (enrError) {
    return { error: "فشل ربط الطلاب بالمادة: " + enrError.message };
  }
  
  revalidatePath("/admin/students");
  return { success: true };
}

export async function fetchStudentsData() {
  const supabase = await createServerSupabaseClient();
  
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title");
  
  return { students: students || [], courses: courses || [] };
}
