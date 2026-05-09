"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getSessionOptions, submitAttendance } from "@/app/actions/attendance";

export default function StudentAttendPage() {
  const { session_id } = useParams() as { session_id: string };
  
  const [studentCode, setStudentCode] = useState("");
  const [isCodeSaved, setIsCodeSaved] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  
  const [options, setOptions] = useState<string[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Anti-cheat states
  const [fails, setFails] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    // Load student code & device id from local storage
    const savedCode = localStorage.getItem("hadarni_student_code");
    if (savedCode) {
      setStudentCode(savedCode);
      setIsCodeSaved(true);
    }

    let savedDeviceId = localStorage.getItem("hadarni_device_id");
    if (!savedDeviceId) {
      // Basic fingerprint (random UUID stored in localStorage)
      savedDeviceId = crypto.randomUUID();
      localStorage.setItem("hadarni_device_id", savedDeviceId);
    }
    setDeviceId(savedDeviceId);

    const savedFails = parseInt(localStorage.getItem("hadarni_fails") || "0");
    setFails(savedFails);
    
    const savedCooldown = parseInt(localStorage.getItem("hadarni_cooldown") || "0");
    if (savedCooldown > Date.now()) {
      setCooldownTime(savedCooldown);
    }

    fetchOptions();
    
    // Refresh options every 20s
    const interval = setInterval(fetchOptions, 20000);
    return () => clearInterval(interval);
  }, [session_id]);

  useEffect(() => {
    if (cooldownTime > Date.now()) {
      const timer = setInterval(() => {
        if (Date.now() > cooldownTime) setCooldownTime(0);
        else setCooldownTime(prev => prev); // force render
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const fetchOptions = async () => {
    const res = await getSessionOptions(session_id);
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.options) {
      setOptions(res.options);
      setCourseTitle(res.courseTitle || "");
    }
  };

  const handleSaveCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;
    localStorage.setItem("hadarni_student_code", studentCode);
    setIsCodeSaved(true);
  };

  const handleSelectOTP = async (otp: string) => {
    if (fails >= 2) return;
    if (cooldownTime > Date.now()) return;

    setErrorMsg("");
    const res = await submitAttendance(session_id, studentCode, otp, deviceId);
    
    if (res.success) {
      setSuccess(true);
    } else {
      setErrorMsg(res.error || "خطأ غير معروف");
      if (res.isWrongOTP) {
        const newFails = fails + 1;
        setFails(newFails);
        localStorage.setItem("hadarni_fails", newFails.toString());
        
        if (newFails === 1) {
          const until = Date.now() + 30000; // 30s freeze
          setCooldownTime(until);
          localStorage.setItem("hadarni_cooldown", until.toString());
        } else if (newFails >= 2) {
          setErrorMsg("تم حظرك من سجل التحضير بسبب الإجابات الخاطئة المتكررة. يرجى التوجه للمحاضر.");
        }
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md bg-green-500/10 border-green-500/30">
          <h1 className="text-2xl font-bold text-green-600 mb-2">تم تسجيل الحضور بنجاح</h1>
          <p className="opacity-80">الكود: {studentCode}</p>
        </div>
      </div>
    );
  }

  if (fails >= 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md bg-red-500/10 border-red-500/30">
          <h1 className="text-2xl font-bold text-red-600 mb-2">تم الحظر من سجل التحضير</h1>
          <p className="opacity-80">لقد تجاوزت الحد المسموح من المحاولات الخاطئة. يرجى التوجه للمحاضر لتسجيل حضورك يدوياً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-blue-600 mb-1">تسجيل الحضور</h1>
          <p className="text-sm opacity-70 font-semibold">{courseTitle}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-600 border border-red-500/30 p-3 rounded-xl text-sm mb-6 font-semibold">
            {errorMsg}
          </div>
        )}

        {!isCodeSaved ? (
          <form onSubmit={handleSaveCode} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-bold">الكود الجامعي</label>
              <input 
                type="text"
                required
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3 text-center text-xl font-bold tracking-widest"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                placeholder="مثال: 20210015"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition">
              متابعة
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-sm font-bold border-b border-black/10 dark:border-white/10 pb-4">
              <span>الطالب: <span className="text-blue-500">{studentCode}</span></span>
              <button onClick={() => setIsCodeSaved(false)} className="text-red-500 underline text-xs">تغيير</button>
            </div>

            {cooldownTime > Date.now() ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-red-500 font-bold">الواجهة مجمدة مؤقتاً</p>
                <p className="font-mono text-2xl font-bold">{Math.ceil((cooldownTime - Date.now()) / 1000)} ثانية</p>
              </div>
            ) : (
              <div>
                <p className="text-center font-bold mb-4">اختر الرقم المعروض على شاشة المدرج الآن:</p>
                <div className="grid grid-cols-2 gap-3">
                  {options.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => handleSelectOTP(opt)}
                      className="bg-black/5 hover:bg-blue-500/20 dark:bg-white/5 dark:hover:bg-blue-500/20 border border-black/10 dark:border-white/10 py-6 rounded-xl font-mono text-2xl font-bold tracking-widest transition"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
