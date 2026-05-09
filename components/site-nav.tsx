"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "#about", label: "عن المنصة" },
  { href: "#roles", label: "الصلاحيات" },
  { href: "#tech", label: "التقنيات" },
  { href: "/login", label: "دخول المحاضر" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 50) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header 
      className="sticky top-0 z-50 transition-colors duration-300"
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 glass-panel rounded-3xl px-4 py-3">
          <nav className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="font-heading text-sm sm:text-base font-extrabold tracking-tight text-soul-fg dark:text-white/95"
            >
              منصة حضّرني
            </Link>

            <div className="hidden sm:flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={[
                      "rounded-full px-3 py-2 text-sm font-semibold transition",
                      "text-soul-fg/80 hover:text-soul-fg hover:bg-black/10 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10",
                      active ? "bg-black/5 text-soul-fg dark:bg-white/10 dark:text-white" : "",
                    ].join(" ")}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="sm:hidden">
                <Link
                  href="#about"
                  className="rounded-full px-3 py-2 text-sm font-semibold text-soul-fg/85 hover:bg-black/10 dark:text-white/85 dark:hover:bg-white/10 transition"
                >
                  عن المنصة
                </Link>
              </div>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}

