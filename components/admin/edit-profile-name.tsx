"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, Check, X } from "lucide-react";
import { updateProfileNameAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EditProfileName({ initialName }: { initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, isPending] = useActionState(updateProfileNameAction, undefined);

  useEffect(() => {
    if (state?.success) {
      setIsEditing(false);
    }
  }, [state]);

  if (isEditing) {
    return (
      <form action={action} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-heading font-extrabold text-blue-600 dark:text-blue-400">مرحباً،</span>
          <Input 
            name="name" 
            defaultValue={initialName} 
            className="text-2xl font-bold h-10 min-w-[200px]"
            autoFocus
            required
            placeholder="أدخل اسمك"
          />
          <Button type="submit" size="icon" variant="default" className="h-10 w-10 shrink-0" disabled={isPending}>
            <Check className="h-5 w-5" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={() => setIsEditing(false)} disabled={isPending}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {state?.error && <p className="text-sm text-red-500 font-bold">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-heading font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
        مرحباً، {initialName}
      </h1>
      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
        title="تغيير الاسم"
      >
        <Edit2 className="w-5 h-5" />
      </button>
    </div>
  );
}
