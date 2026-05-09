"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loginAction(prevState: any, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return { error: error?.message || "فشل تسجيل الدخول. تأكد من صحة البيانات." };
  }

  redirect("/admin");
}

export async function signupAction(prevState: any, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "يرجى إدخال جميع البيانات المطلوبة." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: error?.message || "فشل إنشاء الحساب." };
  }

  // Insert instructor profile
  const { error: profileError } = await supabase.from("instructors").insert({
    id: data.user.id,
    name,
  });

  if (profileError) {
    console.error("Failed to create profile", profileError);
    // Ignore profile creation error for now, ideally we should retry or handle it
  }

  redirect("/admin");
}
