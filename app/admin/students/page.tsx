"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  deleteStudentAction,
  resetFingerprintAction,
  updateStudentNotesAction,
  uploadStudentsAction,
  fetchStudentsData,
} from "./actions";

type Student = {
  student_code: string;
  name: string;
  academic_year: string | null;
  device_fingerprint: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

type Course = { id: string; title: string };

type SortKey = "name" | "student_code" | "academic_year" | "created_at";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Sort & Search
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notes editing
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  // Loading
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchStudentsData();
    setStudents(data.students);
    setCourses(data.courses);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.student_code.toLowerCase().includes(q) ||
          (s.academic_year && s.academic_year.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a[sortKey] || "").toString().toLowerCase();
      const bVal = (b[sortKey] || "").toString().toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchQuery, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // ── Excel Upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) {
      setUploadMsg("يرجى اختيار المادة والملف أولاً.");
      return;
    }

    setIsUploading(true);
    setUploadMsg("");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const studentsData = data
          .map((row: any) => ({
            student_code: String(row["الكود الجامعي"] || row["student_code"] || "").trim(),
            name: String(row["اسم الطالب"] || row["name"] || "").trim(),
            academic_year: String(row["الفرقة"] || row["academic_year"] || "").trim(),
          }))
          .filter((s) => s.student_code && s.student_code !== "undefined");

        const enrollmentsData = data
          .map((row: any) => ({
            course_id: selectedCourse,
            student_code: String(row["الكود الجامعي"] || row["student_code"] || "").trim(),
            serial_number: String(row["م"] || row["م."] || row["Serial"] || "").trim(),
            section_group: String(row["المجموعة/السكشن"] || row["المجموعة"] || "").trim(),
          }))
          .filter((e) => e.student_code && e.student_code !== "undefined");

        const res = await uploadStudentsAction(selectedCourse, studentsData, enrollmentsData);
        if (res.error) {
          setUploadMsg(res.error);
        } else {
          setUploadMsg(`تم رفع ${studentsData.length} طالب بنجاح وربطهم بالمادة المختارة.`);
          await loadData();
        }
      } catch (err: any) {
        setUploadMsg("حدث خطأ أثناء معالجة الملف: " + err.message);
      } finally {
        setIsUploading(false);
        // Reset input
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // ── Export to Excel ──
  const handleExport = () => {
    if (filteredStudents.length === 0) return;
    const exportData = filteredStudents.map((s, i) => ({
      "م": i + 1,
      "الكود الجامعي": s.student_code,
      "اسم الطالب": s.name,
      "الفرقة": s.academic_year || "",
      "الحالة": s.is_active ? "نشط" : "غير نشط",
      "ملاحظات": s.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, `hadarni_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Delete Student ──
  const handleDelete = async (code: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الطالب "${name}" (${code})؟ سيتم حذف جميع بيانات حضوره أيضاً.`)) return;
    const res = await deleteStudentAction(code);
    if (res.error) {
      alert(res.error);
    } else {
      setStudents((prev) => prev.filter((s) => s.student_code !== code));
    }
  };

  // ── Reset Fingerprint ──
  const handleReset = async (code: string, name: string) => {
    if (!confirm(`هل تريد إعادة ضبط بصمة جهاز الطالب "${name}"؟ سيتمكن من التسجيل من جهاز جديد.`)) return;
    const res = await resetFingerprintAction(code);
    if (res.error) {
      alert(res.error);
    } else {
      alert(res.message);
      setStudents((prev) =>
        prev.map((s) => (s.student_code === code ? { ...s, device_fingerprint: null } : s))
      );
    }
  };

  // ── Save Notes ──
  const handleSaveNotes = async (code: string) => {
    const res = await updateStudentNotesAction(code, notesValue);
    if (res.error) {
      alert(res.error);
    } else {
      setStudents((prev) =>
        prev.map((s) => (s.student_code === code ? { ...s, notes: notesValue } : s))
      );
      setEditingNotes(null);
    }
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return null;
    return <span className="mr-1 text-blue-500">{sortAsc ? "↑" : "↓"}</span>;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight">إدارة الطلاب</h1>
        <p className="mt-2 text-sm opacity-70">رفع الشيتات، استعراض وتصدير وإدارة بيانات الطلاب.</p>
      </div>

      {/* Upload Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold">رفع شيت طلاب (Excel)</h2>
        <p className="text-sm opacity-70">
          اختر المادة ثم ارفع ملف Excel يحتوي على أعمدة: الكود الجامعي، اسم الطالب، الفرقة.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">-- اختر المادة --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={isUploading || !selectedCourse}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm disabled:opacity-50"
          />
        </div>
        {isUploading && <p className="text-blue-500 font-bold text-sm">جاري رفع ومعالجة البيانات...</p>}
        {uploadMsg && (
          <p className={`text-sm font-semibold ${uploadMsg.includes("خطأ") || uploadMsg.includes("فشل") ? "text-red-500" : "text-green-500"}`}>
            {uploadMsg}
          </p>
        )}
      </div>

      {/* Toolbar: Search + Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو الكود أو الفرقة..."
          className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          onClick={handleExport}
          disabled={filteredStudents.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap"
        >
          تصدير Excel ({filteredStudents.length})
        </button>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-2xl overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <p className="opacity-60 font-semibold">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-right">
            <thead className="text-xs uppercase bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-blue-500 select-none"
                  onClick={() => handleSort("student_code")}
                >
                  <SortIcon field="student_code" />
                  الكود الجامعي
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-blue-500 select-none"
                  onClick={() => handleSort("name")}
                >
                  <SortIcon field="name" />
                  اسم الطالب
                </th>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-blue-500 select-none"
                  onClick={() => handleSort("academic_year")}
                >
                  <SortIcon field="academic_year" />
                  الفرقة
                </th>
                <th className="px-4 py-3">بصمة الجهاز</th>
                <th className="px-4 py-3">ملاحظات</th>
                <th className="px-4 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <tr
                  key={s.student_code}
                  className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                >
                  <td className="px-4 py-3 opacity-50 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-mono font-bold">{s.student_code}</td>
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3">{s.academic_year || "-"}</td>
                  <td className="px-4 py-3">
                    {s.device_fingerprint ? (
                      <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded-md text-xs font-bold">
                        مسجل
                      </span>
                    ) : (
                      <span className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded-md text-xs font-bold">
                        غير مسجل
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {editingNotes === s.student_code ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs"
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveNotes(s.student_code)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNotes(s.student_code)}
                          className="text-green-600 text-xs font-bold hover:underline"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="text-red-500 text-xs font-bold hover:underline"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-500 text-xs block truncate"
                        title={s.notes || "اضغط لإضافة ملاحظة"}
                        onClick={() => {
                          setEditingNotes(s.student_code);
                          setNotesValue(s.notes || "");
                        }}
                      >
                        {s.notes || <span className="opacity-40 italic">إضافة ملاحظة...</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {s.device_fingerprint && (
                        <button
                          onClick={() => handleReset(s.student_code, s.name)}
                          className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          title="إعادة ضبط بصمة الجهاز"
                        >
                          ريست
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s.student_code, s.name)}
                        className="bg-red-500/10 text-red-600 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                        title="حذف الطالب"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center opacity-50">
                    {searchQuery
                      ? "لا توجد نتائج مطابقة للبحث."
                      : "لا يوجد طلاب مسجلين حتى الآن. ارفع شيت Excel لإضافة طلاب."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {!loading && students.length > 0 && (
        <div className="text-sm opacity-60 text-center">
          إجمالي الطلاب: <span className="font-bold">{students.length}</span>
          {searchQuery && (
            <span> | نتائج البحث: <span className="font-bold">{filteredStudents.length}</span></span>
          )}
        </div>
      )}
    </div>
  );
}
