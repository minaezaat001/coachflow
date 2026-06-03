"use client";

import React from "react";
import { FileSpreadsheet } from "lucide-react";
import ImportWizard from "@/components/ImportWizard";

export default function ImportPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="w-5.5 h-5.5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">استيراد العملاء</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">قم باستيراد العملاء بشكل مجمّع من ملف Excel أو CSV</p>
        </div>
      </div>
      <ImportWizard />
    </div>
  );
}
