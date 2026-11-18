"use client";

import { useEffect, useState } from "react";
import { Check, ListChecks, RotateCcw } from "lucide-react";
import { checklist } from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ec2-lab-guide-checklist-v1";

export default function GuideChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() =>
    checklist.map(() => false),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setChecked(checklist.map((_, index) => Boolean(parsed[index])));
        }
      }
    } catch (error) {
      console.error("[guide-checklist] could not read saved progress:", error);
    } finally {
      setReady(true);
    }
  }, []);

  function toggle(index: number) {
    setChecked((current) => {
      const next = current.map((value, itemIndex) =>
        itemIndex === index ? !value : value,
      );
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("[guide-checklist] could not save progress:", error);
      }
      return next;
    });
  }

  function reset() {
    setChecked(checklist.map(() => false));
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("[guide-checklist] could not reset progress:", error);
    }
  }

  const completed = checked.filter(Boolean).length;
  const percent = Math.round((completed / checklist.length) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm">
              <ListChecks className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Kriteria selesai UTS
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Centang setelah benar-benar diverifikasi.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
            {String(completed).padStart(2, "0")} / {String(checklist.length).padStart(2, "0")}
          </span>
        </div>

        <div className="mt-5">
          <Progress
            value={percent}
            aria-label="Progres checklist panduan"
            indicatorClassName={percent === 100 ? "bg-emerald-500" : "bg-brand"}
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{percent}% selesai</span>
            <span>{ready ? "Tersimpan di browser ini" : "Memuat progres…"}</span>
          </div>
        </div>
      </div>

      <ol className="divide-y divide-border">
        {checklist.map((item, index) => {
          const isChecked = checked[index];
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(index)}
                className="group flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-6"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-all",
                    isChecked
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-background text-transparent group-hover:border-ring",
                  )}
                >
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm leading-6 transition-colors",
                      isChecked
                        ? "text-muted-foreground line-through decoration-border"
                        : "text-foreground",
                    )}
                  >
                    {item}
                  </span>
                </span>
                <span className="mt-1 hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3.5 sm:px-6">
        <p className="text-[11px] leading-5 text-muted-foreground">
          Progres panduan tersimpan lokal. Untuk menyimpan per akun, gunakan
          workspace.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={completed === 0}
          className="h-8 text-xs"
        >
          <RotateCcw />
          Reset
        </Button>
      </div>
    </div>
  );
}
