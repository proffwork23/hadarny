import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-6 left-6">
        <ThemeToggle />
      </div>
      
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        <h1 className="text-6xl sm:text-8xl font-heading font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          حضّرني
        </h1>
        
        <p className="text-xl sm:text-2xl leading-relaxed opacity-80">
          نظام متكامل لإدارة حضور وانصراف الطلاب الذكي.
          <br />
          دقة، سرعة، وموثوقية في كل محاضرة.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            href="/login" 
            className="w-full sm:w-auto rounded-full bg-blue-600 text-white px-10 py-4 text-lg font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-500/25"
          >
            تسجيل الدخول
          </Link>
          <Link 
            href="/signup" 
            className="w-full sm:w-auto rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground px-10 py-4 text-lg font-bold hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            إنشاء حساب جديد
          </Link>
        </div>
      </div>
    </main>
  );
}
