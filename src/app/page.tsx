"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiagnosisForm } from "@/components/diagnosis-form";
import { PerformanceDashboard } from "@/components/performance-dashboard";
import { AboutProject } from "@/components/about-project";
import { Stethoscope, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);

  // Perform backend health check on load
  const checkBackendHealth = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setBackendConnected(data.status === "healthy");
      } else {
        setBackendConnected(false);
      }
    } catch {
      setBackendConnected(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/30 to-indigo-50/20 text-slate-800 antialiased">
      {/* Background soft blobs for a premium visual aesthetic */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-sky-200/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[35rem] h-[35rem] bg-indigo-200/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2" />

      {/* Main container */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Sleek Clinical Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-8 border-b border-slate-200/60">
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 bg-clip-text">
                OncoPredict
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Clinical Decision Support System (CDSS) • JST MLP
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/50 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status API:</span>
            {checkingStatus ? (
              <span className="flex items-center text-xs font-semibold text-slate-500">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin text-slate-400" />
                Mengecek...
              </span>
            ) : backendConnected ? (
              <span className="flex items-center text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500 fill-emerald-50" />
                Terhubung (Port 8000)
              </span>
            ) : (
              <button 
                onClick={checkBackendHealth}
                className="flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5 text-rose-500 fill-rose-50" />
                Terputus (Klik Ulang)
              </button>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <Tabs defaultValue="diagnosis" className="w-full space-y-8">
          <div className="flex justify-center">
            <TabsList className="bg-slate-200/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-300/40 w-full h-full sm:w-auto grid grid-cols-3 gap-1">
              <TabsTrigger 
                value="diagnosis" 
                className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-md"
              >
                Form Diagnosis
              </TabsTrigger>
              <TabsTrigger 
                value="performance"
                className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-md"
              >
                Performa Model
              </TabsTrigger>
              <TabsTrigger 
                value="about"
                className="rounded-xl px-6 py-2.5 text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-md"
              >
                Tentang Projek
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="diagnosis" className="outline-none focus-visible:outline-none">
            <DiagnosisForm />
          </TabsContent>

          <TabsContent value="performance" className="outline-none focus-visible:outline-none">
            <PerformanceDashboard />
          </TabsContent>

          <TabsContent value="about" className="outline-none focus-visible:outline-none">
            <AboutProject />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-20 pt-6 border-t border-slate-200/50 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} OncoPredict CDSS. Developed for Informatics Medical Computing Thesis.</p>
        </footer>
        
      </div>
    </div>
  );
}
