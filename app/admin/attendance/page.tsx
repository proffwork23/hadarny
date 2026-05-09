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
  const [history, setHistory] = useState<any[]>([]);
  
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Fetch courses for instructor
    async function fetchCourses() {
      const { data } = await supabase.from("courses").select("*");
      if (data) setCourses(data);
    }
    fetchCourses();

    // Fetch history
    async function fetchHistory() {
      const { data } = await supabase
        .from("sessions")
        .select(`
          id,
          opened_at,
          closed_at,
          is_active,
          courses (title, course_type)
        `)
        .order("opened_at", { ascending: false });
      if (data) setHistory(data);
    }
    fetchHistory();
  }, [supabase]);

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
  }, [activeSession, supabase]);

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
    if (!selectedCourse) return alert("اختر المادة / السكشن أولاً");
    
    const secretKey = generateSecret();
    
    const { data, error } = await supabase
      .from("sessions")
      .insert([{ course_id: selectedCourse, secret_key: secretKey }])
      .select()
      .single();
      
    if (error) {
      console.error(error);
      alert("حدث خطأ أثناء بدء سجل التحضير");
      return;
    }
    
    setActiveSession(data);
    // Add to history list immediately
    setHistory(prev => [{
      id: data.id,
      opened_at: data.opened_at,
      closed_at: null,
      is_active: true,
      courses: courses.find(c => c.id === selectedCourse)
    }, ...prev]);
  };

  const closeSession = async () => {
    if (!activeSession) return;
    await supabase.from("sessions").update({ is_active: false, closed_at: new Date().toISOString() }).eq("id", activeSession.id);
    
    // Update history state
    setHistory(prev => prev.map(s => s.id === activeSession.id ? { ...s, is_active: false, closed_at: new Date().toISOString() } : s));
    
    setActiveSession(null);
    setAttendees([]);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const dayName = d.toLocaleDateString("ar-EG", { weekday: "long" });
    const date = d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    return `${dayName}، ${date}`;
  };

  return (
    <div className="min-h-screen p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-blue-600">إدارة سجلات التحضير</h1>
      </div>

      {!activeSession ? (
        <div className="max-w-xl mx-auto space-y-8">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">بدء سجل تحضير جديد</h2>
            <div>
              <label className="block mb-2 text-sm font-semibold">اختر المادة / السكشن</label>
              <select 
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
              >
                <option value="">-- اختر --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.course_type})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={startSession}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold transition"
            >
              بدء سجل التحضير وعرض QR
            </button>
            <p className="text-xs opacity-50 text-center">تأكد من رفع شيت الطلاب أولاً من صفحة &quot;الطلاب&quot;</p>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-bold">السجلات السابقة</h2>
            {history.length === 0 ? (
              <p className="opacity-60 text-sm">لا يوجد سجلات سابقة.</p>
            ) : (
              <div className="space-y-4">
                {history.map((record) => {
                  const courseData = Array.isArray(record.courses) ? record.courses[0] : record.courses;
                  return (
                    <div key={record.id} className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{courseData?.title} <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">{courseData?.course_type || "محاضرة"}</span></h3>
                        <p className="text-xs opacity-70 mt-1">{formatDate(record.opened_at)}</p>
                      </div>
                      <div className="text-xs font-bold">
                        {record.is_active ? (
                          <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded-full">نشط الآن</span>
                        ) : (
                          <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded-full">مغلق</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          {/* Top Bar for controls */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">سجل التحضير نشط الآن</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="font-bold text-lg opacity-80">الحضور: {attendees.length}</span>
              </div>
              <button 
                onClick={closeSession}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/25"
              >
                إنهاء وإغلاق السجل
              </button>
            </div>
          </div>

          {/* Main Massive Content */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-32 w-full max-w-[90vw] h-full pt-24 pb-8">
            
            {/* Massive QR */}
            <div className="flex flex-col items-center gap-8 shrink-0">
              <div className="p-8 bg-white rounded-[3rem] shadow-2xl border-8 border-blue-500/10">
                <QRCodeSVG 
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/attend/${activeSession.id}`} 
                  size={Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400, 500)} 
                  includeMargin={false}
                />
              </div>
              <p className="text-2xl opacity-60 font-bold">امسح الكود لتسجيل الحضور</p>
            </div>

            {/* Massive OTP */}
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="text-3xl opacity-60 font-bold">رمز الدخول الآمن</p>
              <div className="text-[12vw] sm:text-[150px] leading-none font-mono font-black tracking-[0.1em] text-blue-600 drop-shadow-2xl">
                {otp}
              </div>
              <p className="text-lg opacity-40 font-semibold mt-4">يتغير الرمز تلقائياً كل 20 ثانية</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
