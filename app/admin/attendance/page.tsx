"use client";

import React, { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { generateSecret, generateTOTP } from "@/lib/totp";
import { QRCodeSVG } from "qrcode.react";

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [attendees, setAttendees] = useState<any[]>([]);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Fetch courses for instructor (assuming RLS or basic auth is setup)
    async function fetchCourses() {
      const { data, error } = await supabase.from("courses").select("*");
      if (data) setCourses(data);
    }
    fetchCourses();
  }, []);

  // Real-time listener for attendance
  useEffect(() => {
    if (!activeSession) return;
    
    // Fetch initial attendees
    const fetchAttendees = async () => {
      const { data } = await supabase
        .from("attendance")
        .select(`
          status,
          recorded_at,
          students (name, student_code, academic_year)
        `)
        .eq("session_id", activeSession.id);
      if (data) setAttendees(data);
    };
    fetchAttendees();

    // Subscribe to new attendees
    const channel = supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `session_id=eq.${activeSession.id}` },
        async (payload: any) => {
          // Fetch student details for the new record
          const { data } = await supabase
            .from("students")
            .select("name, student_code, academic_year")
            .eq("student_code", payload.new.student_code)
            .single();
            
          if (data) {
            setAttendees(prev => [...prev, { ...payload.new, students: data }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession]);

  // OTP Timer Loop (20s)
  useEffect(() => {
    if (!activeSession?.secret_key) return;

    const updateOTP = () => {
      const newOtp = generateTOTP(activeSession.secret_key);
      setOtp(newOtp);
    };
    
    updateOTP(); // Initial
    const interval = setInterval(updateOTP, 1000); // Check every second to sync with TOTP period
    
    return () => clearInterval(interval);
  }, [activeSession]);


  const startSession = async () => {
    if (!selectedCourse) return alert("اختر المادة أولاً");
    
    const secretKey = generateSecret();
    
    const { data, error } = await supabase
      .from("sessions")
      .insert([{ course_id: selectedCourse, secret_key: secretKey }])
      .select()
      .single();
      
    if (error) {
      console.error(error);
      alert("حدث خطأ أثناء بدء الجلسة");
      return;
    }
    
    setActiveSession(data);
  };

  const closeSession = async () => {
    if (!activeSession) return;
    await supabase.from("sessions").update({ is_active: false, closed_at: new Date().toISOString() }).eq("id", activeSession.id);
    setActiveSession(null);
    setAttendees([]);
  };


  return (
    <div className="min-h-screen p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-blue-600">إدارة الحضور (المُحاضر)</h1>
      </div>

      {!activeSession ? (
        <div className="max-w-xl mx-auto">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">بدء جلسة تحضير جديدة</h2>
            <div>
              <label className="block mb-2 text-sm font-semibold">اختر المادة / السكشن</label>
              <select 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
              >
                <option value="">-- اختر --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={startSession}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold transition"
            >
              بدء الجلسة وعرض QR
            </button>
            <p className="text-xs opacity-50 text-center">تأكد من رفع شيت الطلاب أولاً من صفحة &quot;الطلاب&quot;</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projector View (QR & OTP) */}
          <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center text-center space-y-8 bg-blue-500/5">
            <h2 className="text-2xl font-bold text-red-500 animate-pulse">الجلسة قيد التشغيل</h2>
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/attend/${activeSession.id}`} 
                size={300} 
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm opacity-70">رمز الدخول (يتغير كل 20 ثانية)</p>
              <div className="text-6xl font-mono font-bold tracking-[0.2em] text-blue-600">{otp}</div>
            </div>
            <button 
              onClick={closeSession}
              className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/25"
            >
              إنهاء الجلسة وإغلاق التحضير
            </button>
          </div>

          {/* Real-time Attendees List */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold">المحضر اللحظي</h2>
              <span className="bg-green-500/20 text-green-600 px-4 py-1 rounded-full font-bold">
                {attendees.length} طالب
              </span>
            </div>
            <div className="overflow-y-auto max-h-[500px] pr-2 space-y-3">
              {attendees.map((att, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                  <div>
                    <p className="font-bold">{att.students?.name || "طالب غير معروف"}</p>
                    <p className="text-sm opacity-70">{att.students?.student_code} | {att.students?.academic_year}</p>
                  </div>
                  <div className="text-green-500">
                    تم التحضير
                  </div>
                </div>
              ))}
              {attendees.length === 0 && (
                <p className="text-center opacity-50 py-10 italic">في انتظار تسجيل الطلاب...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
