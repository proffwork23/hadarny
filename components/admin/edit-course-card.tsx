"use client";

import { useState, useActionState, useEffect } from "react";
import { editCourseAction, deleteCourseAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Edit2, Trash2, X, Check } from "lucide-react";

type Course = {
  id: string;
  title: string;
  code: string | null;
  course_type?: string;
  course_enrollments: { count: number }[];
};

export function EditCourseCard({ course }: { course: Course }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editState, editAction, isEditPending] = useActionState(editCourseAction, undefined);
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteCourseAction, undefined);

  useEffect(() => {
    if (editState?.success) {
      setIsEditing(false);
    }
  }, [editState]);

  if (isDeleting) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 border-red-500/50">
        <h3 className="text-lg font-bold text-red-500">هل أنت متأكد من الحذف؟</h3>
        <p className="text-xs opacity-70">سيتم حذف المادة وكل ما يتعلق بها من طلاب وسجلات حضور بشكل نهائي!</p>
        
        <form action={deleteAction} className="w-full flex gap-3 mt-4">
          <input type="hidden" name="id" value={course.id} />
          <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDeleting(false)} disabled={isDeletePending}>
            إلغاء
          </Button>
          <Button type="submit" variant="destructive" className="flex-1" disabled={isDeletePending}>
            {isDeletePending ? "جاري الحذف..." : "نعم، احذف"}
          </Button>
        </form>
        {deleteState?.error && <p className="text-red-500 text-sm font-bold">{deleteState.error}</p>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="glass-panel p-6 rounded-2xl flex flex-col space-y-4 border-blue-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-blue-600 dark:text-blue-400">تعديل المادة</h3>
          <button onClick={() => setIsEditing(false)} className="opacity-70 hover:opacity-100 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={course.id} />
          
          <div className="space-y-2">
            <Label className="text-xs">اسم المادة</Label>
            <Input name="title" defaultValue={course.title} required className="h-9" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">كود المادة (اختياري)</Label>
            <Input name="code" defaultValue={course.code || ""} className="h-9" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">النوع</Label>
            <select 
              name="course_type"
              defaultValue={course.course_type || "محاضرة"}
              className="flex h-9 w-full rounded-md border border-black/10 dark:border-white/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="محاضرة">محاضرة</option>
              <option value="سكشن">سكشن</option>
            </select>
          </div>

          {editState?.error && <p className="text-red-500 text-sm font-bold">{editState.error}</p>}

          <Button type="submit" className="w-full h-9 bg-blue-600 hover:bg-blue-700" disabled={isEditPending}>
            {isEditPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 group relative">
      <div className="absolute top-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition"
          title="تعديل المادة"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsDeleting(true)}
          className="p-1.5 rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 transition"
          title="حذف المادة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 pl-16">
          <h3 className="text-lg font-bold">{course.title}</h3>
          <div className="flex gap-2">
            {course.code && <span className="bg-blue-500/10 text-blue-600 text-xs px-2 py-1 rounded-md font-bold">{course.code}</span>}
            <span className="bg-purple-500/10 text-purple-600 text-xs px-2 py-1 rounded-md font-bold">{course.course_type || "محاضرة"}</span>
          </div>
        </div>
        <p className="text-sm opacity-70">
          عدد الطلاب المسجلين: <span className="font-bold">{course.course_enrollments[0]?.count || 0}</span> طالب
        </p>
      </div>
      
      <Link 
        href="/admin/attendance"
        className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-bold transition"
      >
        إدارة التحضير &rarr;
      </Link>
    </div>
  );
}
