"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTOTP, generateFakeOTPs, validateTOTP } from "@/lib/totp";

export async function getSessionOptions(sessionId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data: session, error } = await supabase
    .from("sessions")
    .select("secret_key, is_active, courses(title)")
    .eq("id", sessionId)
    .single();

  if (error || !session || !session.is_active) {
    return { error: "الجلسة غير متاحة أو تم إغلاقها." };
  }

  // Generate current valid OTP and 3 fakes
  const correctOTP = generateTOTP(session.secret_key);
  const fakes = generateFakeOTPs(correctOTP, 3);
  
  // Shuffle options
  const options = [correctOTP, ...fakes].sort(() => Math.random() - 0.5);

  const coursesData = session.courses as any;
  const courseTitle = Array.isArray(coursesData) ? coursesData[0]?.title : coursesData?.title;
  return { options, courseTitle };
}

export async function submitAttendance(sessionId: string, studentCode: string, selectedOtp: string, deviceId: string) {
  const supabase = await createServerSupabaseClient();
  
  // 1. Verify Session
  const { data: session } = await supabase
    .from("sessions")
    .select("secret_key, is_active")
    .eq("id", sessionId)
    .single();

  if (!session || !session.is_active) {
    return { success: false, error: "الجلسة مغلقة." };
  }

  // 2. Validate OTP
  const isValid = validateTOTP(session.secret_key, selectedOtp);
  if (!isValid) {
    return { success: false, error: "الرمز غير صحيح.", isWrongOTP: true };
  }

  // 3. Verify Student exists & Device Fingerprint
  const { data: student } = await supabase
    .from("students")
    .select("device_fingerprint")
    .eq("student_code", studentCode)
    .single();

  if (!student) {
    return { success: false, error: "الكود الجامعي غير مسجل بالنظام." };
  }

  if (student.device_fingerprint && student.device_fingerprint !== deviceId) {
    return { success: false, error: "تم التسجيل مسبقاً من جهاز مختلف. يرجى المراجعة." };
  }

  // Update fingerprint if it's the first time
  if (!student.device_fingerprint) {
    await supabase.from("students").update({ device_fingerprint: deviceId }).eq("student_code", studentCode);
  }

  // 4. Record Attendance
  const { error: attError } = await supabase
    .from("attendance")
    .insert([{ session_id: sessionId, student_code: studentCode, status: "present" }]);

  if (attError) {
    if (attError.code === "23505") { // Unique violation
      return { success: false, error: "لقد قمت بتسجيل الحضور مسبقاً لهذه الجلسة." };
    }
    return { success: false, error: "حدث خطأ أثناء تسجيل الحضور." };
  }

  return { success: true };
}
