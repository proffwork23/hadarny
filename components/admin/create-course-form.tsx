"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCourseAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCourseForm() {
  const [state, action, isPending] = useActionState(createCourseAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h2 className="text-xl font-bold font-heading mb-4">إضافة مادة جديدة</h2>
      
      <form action={action} ref={formRef} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">اسم المادة</Label>
          <Input 
            id="title" 
            name="title" 
            required 
            placeholder="مثال: مقدمة في البرمجة"
            className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">كود المادة (اختياري)</Label>
          <Input 
            id="code" 
            name="code" 
            placeholder="مثال: CS101"
            className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course_type">نوع السجل</Label>
          <select 
            id="course_type"
            name="course_type"
            className="flex h-10 w-full rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue="محاضرة"
          >
            <option value="محاضرة">محاضرة</option>
            <option value="سكشن">سكشن</option>
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-500 font-semibold">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-500 font-semibold">تم إضافة المادة بنجاح!</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
          {isPending ? "جاري الإضافة..." : "إضافة المادة"}
        </Button>
      </form>
    </div>
  );
}
