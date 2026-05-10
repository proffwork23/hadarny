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
  
  // Filters
  const [filterCourse, setFilterCourse] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterDay, setFilterDay] = useState("");

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
          courses (id, title, course_type)
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

  // Filter & Group Logic
  const filteredHistory = history.filter(record => {
    const courseData = Array.isArray(record.courses) ? record.courses[0] : record.courses;
    if (filterCourse && courseData?.id !== filterCourse) return false;
    
    const recordDate = new Date(record.opened_at);
    
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      if (recordDate.toDateString() !== selectedDate.toDateString()) return false;
    }
    
    if (filterDay) {
      const dayName = recordDate.toLocaleDateString("ar-EG", { weekday: "long" });
      if (dayName !== filterDay) return false;
    }
    
    return true;
  });

  const groupedHistory = filteredHistory.reduce((acc, record) => {
    const courseData = Array.isArray(record.courses) ? record.courses[0] : record.courses;
    const key = courseData?.id || "unknown";
    if (!acc[key]) {
      acc[key] = { course: courseData, records: [] };
    }
    acc[key].records.push(record);
    return acc;
  }, {} as Record<string, { course: any, records: any[] }>);

  const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  return (
    <div className="min-h-screen p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-blue-600">إدارة سجلات التحضير</h1>
      </div>

      {!activeSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            {/* Start Session Block */}
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              <h2 className="text-xl font-bold">بدء سجل تحضير جديد</h2>
              <div>
                <label className="block mb-2 text-sm font-semibold">اختر المادة / السكشن</label>
                <select 
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold transition shadow-lg"
              >
                بدء السجل وعرض QR
              </button>
            </div>
            
            {/* Filter Block */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-bold flex items-center justify-between">
                فلاتر البحث
                {(filterCourse || filterDate || filterDay) && (
                  <button onClick={() => {setFilterCourse(''); setFilterDate(''); setFilterDay('');}} className="text-xs text-red-500 hover:underline">
                    مسح الفلاتر
                  </button>
                )}
              </h2>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold opacity-70">المادة</label>
                  <select 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm"
                    value={filterCourse}
                    onChange={e => setFilterCourse(e.target.value)}
                  >
                    <option value="">الكل</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold opacity-70">التاريخ</label>
                  <input 
                    type="date"
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold opacity-70">اليوم</label>
                  <select 
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm"
                    value={filterDay}
                    onChange={e => setFilterDay(e.target.value)}
                  >
                    <option value="">الكل</option>
                    {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-4">السجلات السابقة</h2>
            
            {Object.keys(groupedHistory).length === 0 ? (
              <div className="text-center p-12 border border-dashed border-black/20 dark:border-white/20 rounded-3xl">
                <p className="opacity-60 font-semibold">لا يوجد سجلات تطابق بحثك.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.values(groupedHistory).map((group: any, idx) => (
                  <div key={idx} className="glass-panel p-6 rounded-3xl space-y-4">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                      {group.course?.title || "مادة غير معروفة"}
                      <span className="bg-blue-500/10 text-blue-600 text-xs px-3 py-1 rounded-full">{group.course?.course_type || "محاضرة"}</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {group.records.map((record: any) => (
                        <div key={record.id} className="p-4 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex justify-between items-center hover:bg-black/10 transition">
                          <div>
                            <p className="font-bold text-sm">{formatDate(record.opened_at)}</p>
                            <p className="text-xs opacity-60 mt-1 flex items-center gap-2">
                              {record.is_active ? (
                                <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                              ) : (
                                <span className="flex h-2 w-2 rounded-full bg-slate-400"></span>
                              )}
                              <span>{new Date(record.opened_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                            </p>
                          </div>
                          <div className="text-xs font-bold">
                            {record.is_active ? (
                              <span className="text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg">نشط الآن</span>
                            ) : (
                              <span className="text-slate-500 bg-slate-500/10 px-3 py-1.5 rounded-lg">مغلق</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
