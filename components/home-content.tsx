"use client";

import React from "react";
import Link from "next/link";

export function HomeContent() {
  return (
    <div className="relative min-h-screen pb-20">
      <main className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        
        {/* Hero Section */}
        <section className="glass-panel mx-auto max-w-4xl rounded-3xl p-8 sm:p-12 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight">
              منصة <span className="text-blue-600 dark:text-blue-400">حضّرني</span>
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed opacity-80 max-w-3xl mx-auto">
              نظام إلكتروني ذكي ومحكم لإدارة حضور وانصراف الطلاب في المدرجات والسكاشن ذات الكثافة العالية، مع التركيز على سرعة التسجيل، منع الغش، والعمل تحت ظروف ضعف الإنترنت.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <Link href="/login" className="rounded-full bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/25">
                دخول المحاضر
              </Link>
              <a href="#about" className="rounded-full bg-white/10 text-soul-fg dark:text-white px-8 py-3 text-sm font-semibold hover:bg-white/20 transition">
                عن المنصة
              </a>
            </div>
          </div>
        </section>

        {/* About / Anti-Cheat Mechanisms */}
        <section id="about" className="mx-auto max-w-4xl mt-16 scroll-mt-24">
          <div className="mb-8 flex flex-col items-center text-center gap-2 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-heading font-bold">عن المنصة</h2>
            <p className="text-base opacity-60">نظام محكم يمنع تسجيل الحضور الوهمي عن بُعد</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Dynamic QR & OTP</h3>
              <p className="text-sm opacity-80 leading-relaxed">الكود يتغير كل 20 ثانية لمنع تصويره وإرساله خارج المدرج لضمان الحضور الفعلي.</p>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Device Fingerprinting</h3>
              <p className="text-sm opacity-80 leading-relaxed">ربط الكود الجامعي للطالب ببصمة جهازه الرقمية لمنع تسجيل حضور أكثر من طالب من نفس الجهاز.</p>
            </div>
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Progressive Cooldown</h3>
              <p className="text-sm opacity-80 leading-relaxed">تجميد واجهة الطالب مؤقتاً عند إدخال الرمز بشكل خاطئ، وحظره تماماً في حالة التكرار.</p>
            </div>
          </div>
        </section>

        {/* Roles and Functional Requirements */}
        <section id="roles" className="mx-auto max-w-4xl mt-16 scroll-mt-24">
          <div className="mb-8 flex flex-col items-center text-center gap-2 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-heading font-bold">الصلاحيات وإدارة المنظومة</h2>
            <p className="text-base opacity-60">أدوات متكاملة للمحاضر وتجربة سلسة للطالب</p>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">المُحاضر / المعيد</h3>
              <ul className="list-disc list-inside space-y-2 text-sm opacity-85 leading-relaxed">
                <li>رفع وإدارة قوائم الطلاب بسهولة (شيتات Excel).</li>
                <li>إنشاء وإدارة جلسات الحضور (محاضرات وسكاشن).</li>
                <li>مراقبة عداد الحضور اللحظي بلوحة تفاعلية متزامنة.</li>
                <li>إصدار التقارير النهائية وتحليلات التعلم وكشوف الغياب الرسمية.</li>
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">الطالب</h3>
              <ul className="list-disc list-inside space-y-2 text-sm opacity-85 leading-relaxed">
                <li>مسح كود الـ QR من أي متصفح دون الحاجة لتنزيل تطبيقات إضافية.</li>
                <li>إدخال الكود الجامعي لمرة واحدة فقط (في أول استخدام).</li>
                <li>اختيار الـ OTP الصحيح من الخيارات المتاحة لتسجيل الحضور بنجاح.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech" className="mx-auto max-w-4xl mt-16 scroll-mt-24">
          <div className="mb-8 flex flex-col items-center text-center gap-2 border-b border-white/10 pb-6">
            <h2 className="text-3xl font-heading font-bold">البنية التحتية والتقنية</h2>
            <p className="text-base opacity-60">منظومة قوية ومستقرة صُممت لتحمل الكثافة العالية</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-5">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">واجهة المستخدم والمحرك الأساسي</h4>
              <p className="text-xs opacity-70">Next.js (App Router), React, Tailwind CSS</p>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">قاعدة البيانات والتزامن</h4>
              <p className="text-xs opacity-70">Supabase (PostgreSQL) مع Real-time Engine</p>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">المصادقة والتشفير</h4>
              <p className="text-xs opacity-70">Supabase Auth, مكتبة TOTP للعمل Offline بأمان</p>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">هيكلة البيانات</h4>
              <p className="text-xs opacity-70">نظام قواعد بيانات علائقي محكم لربط الجلسات بالطلاب بشكل قطعي.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
