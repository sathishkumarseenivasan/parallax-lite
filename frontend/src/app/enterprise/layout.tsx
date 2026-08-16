import React from "react";
import { ShieldAlert, LogOut, Settings, Activity } from "lucide-react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";
import { cookies } from "next/headers";

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the mock admin cookie server-side
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token");
  const adminName = token ? "Admin User" : "Unauthenticated";

  return (
    <QueryProvider>
      <div className="min-h-screen bg-stone-50 font-sans flex flex-col">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-md flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-stone-50" />
            </div>
            <span className="font-semibold text-stone-900 tracking-tight">Parallax Protocol</span>
            <span className="text-stone-400 mx-2">/</span>
            <span className="text-stone-600 font-medium text-sm">Enterprise Command Center</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-stone-600">System Nominal</span>
            </div>
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Activity className="w-5 h-5" />
            </button>
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1"></div>
            <button className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
              {adminName}
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" richColors theme="light" />
    </QueryProvider>
  );
}
