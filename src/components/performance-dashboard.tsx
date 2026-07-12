"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { TrendingDown, Activity, Award, BarChart3, AlertCircle } from "lucide-react";

export function PerformanceDashboard() {
  // 1. Class Distribution Data (Malignant: 212, Benign: 357)
  const distributionData = [
    { name: "Malignant (Ganas)", count: 212, fill: "#ef4444" },
    { name: "Benign (Jinak)", count: 357, fill: "#10b981" },
  ];

  // 2. Training Loss Curve Data (Epoch 1 to 125, converges to 0.068)
  const lossData = Array.from({ length: 125 }, (_, i) => {
    const epoch = i + 1;
    // Model exponential decay + constant limit
    // Ensure it starts around 0.65 and converges to exactly 0.068 at epoch 125
    const decay = Math.exp(-epoch / 28);
    const loss = 0.582 * decay + 0.068;
    
    // Add very tiny simulated fluctuation at earlier epochs
    const noise = epoch < 80 ? (Math.sin(epoch) * 0.008 * Math.exp(-epoch / 40)) : 0;
    
    return {
      epoch,
      loss: parseFloat((loss + noise).toFixed(4)),
    };
  });
  // Make sure the last epoch is exactly 0.068
  lossData[124].loss = 0.068;

  // 3. Confusion Matrix Stats
  // True Malignant: 41, False Benign: 1, False Malignant: 5, True Benign: 67
  const cm = {
    trueMalignant: 41,
    falseBenign: 1,
    falseMalignant: 5,
    trueBenign: 67,
    total: 114,
  };

  const accuracy = ((cm.trueMalignant + cm.trueBenign) / cm.total * 100).toFixed(1); // 94.7%
  const sensitivity = (cm.trueMalignant / (cm.trueMalignant + cm.falseBenign) * 100).toFixed(1); // 97.6%
  const specificity = (cm.trueBenign / (cm.trueBenign + cm.falseMalignant) * 100).toFixed(1); // 93.1%

  // 4. ROC-AUC Curve Data (AUC = 0.992)
  // Formula: TPR = FPR^(1 - AUC) => TPR = FPR^0.008
  const rocData = Array.from({ length: 51 }, (_, i) => {
    const fpr = i / 50;
    let tpr = 0;
    if (fpr > 0) {
      tpr = Math.pow(fpr, 0.008);
      // Small adjustment to smooth and keep strictly below 1.0 until the very end
      if (fpr < 1) {
        tpr = Math.min(0.999, tpr * 0.998 + fpr * 0.002);
      }
    }
    return {
      fpr: parseFloat(fpr.toFixed(3)),
      tpr: parseFloat(tpr.toFixed(3)),
      baseline: fpr,
    };
  });

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/70 backdrop-blur-md shadow-md border-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Akurasi Model</p>
                <h3 className="text-3xl font-black text-slate-800 font-mono mt-1">{accuracy}%</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Persentase diagnosis benar dari total populasi pengujian (114 sampel data).
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-md shadow-md border-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sensitivitas (Recall)</p>
                <h3 className="text-3xl font-black text-rose-500 font-mono mt-1">{sensitivity}%</h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Kemampuan mendeteksi pasien kanker ganas secara tepat (meminimalkan False Benign).
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-md shadow-md border-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Spesifisitas</p>
                <h3 className="text-3xl font-black text-sky-500 font-mono mt-1">{specificity}%</h3>
              </div>
              <div className="p-3 bg-sky-50 rounded-2xl text-sky-500">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Kemampuan mendeteksi pasien tumor jinak secara tepat (meminimalkan False Malignant).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main performance graphs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Distribution Chart */}
        <Card className="bg-white/70 backdrop-blur-md shadow-lg border-slate-200/50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-base font-bold text-slate-800">Distribusi Kelas Dataset</CardTitle>
            </div>
            <CardDescription>Perbandingan jumlah sampel tumor ganas (Malignant) vs jinak (Benign) pada Wisconsin Dataset.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Training Loss Curve */}
        <Card className="bg-white/70 backdrop-blur-md shadow-lg border-slate-200/50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <CardTitle className="text-base font-bold text-slate-800">Kurva Loss Training Backpropagation</CardTitle>
            </div>
            <CardDescription>Laju penurunan nilai loss (eror) model JST yang konvergen di epoch 125 dengan loss akhir 0.068.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lossData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confusion Matrix */}
        <Card className="bg-white/70 backdrop-blur-md shadow-lg border-slate-200/50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-sky-500" />
              <CardTitle className="text-base font-bold text-slate-800">Confusion Matrix Pengujian (N=114)</CardTitle>
            </div>
            <CardDescription>Matriks evaluasi performa klasifikasi model terhadap kelas aktual vs hasil prediksi.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-2 text-center items-center max-w-md mx-auto py-6">
              {/* Top labels */}
              <div></div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2">Prediksi Malignant</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2">Prediksi Benign</div>

              {/* Row 1: Malignant */}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Aktual Malignant</div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-center items-center">
                <span className="text-2xl font-black text-emerald-600 font-mono">{cm.trueMalignant}</span>
                <span className="text-[9px] text-emerald-600/70 font-semibold uppercase mt-1">True Malignant</span>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 flex flex-col justify-center items-center">
                <span className="text-2xl font-black text-rose-600 font-mono">{cm.falseBenign}</span>
                <span className="text-[9px] text-rose-600/70 font-semibold uppercase mt-1">False Benign</span>
              </div>

              {/* Row 2: Benign */}
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-4">Aktual Benign</div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 flex flex-col justify-center items-center">
                <span className="text-2xl font-black text-rose-600 font-mono">{cm.falseMalignant}</span>
                <span className="text-[9px] text-rose-600/70 font-semibold uppercase mt-1">False Malignant</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-center items-center">
                <span className="text-2xl font-black text-emerald-600 font-mono">{cm.trueBenign}</span>
                <span className="text-[9px] text-emerald-600/70 font-semibold uppercase mt-1">True Benign</span>
              </div>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              *Terdapat 1 False Benign (Ganas terprediksi Jinak) dan 5 False Malignant (Jinak terprediksi Ganas).
            </div>
          </CardContent>
        </Card>

        {/* ROC-AUC Curve */}
        <Card className="bg-white/70 backdrop-blur-md shadow-lg border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-base font-bold text-slate-800">Kurva ROC-AUC</CardTitle>
              </div>
              <span className="bg-indigo-50 text-indigo-600 font-bold font-mono text-xs px-2.5 py-1 rounded-full border border-indigo-100">
                AUC = 0.992
              </span>
            </div>
            <CardDescription>Karakteristik Operasi Penerima (ROC). Menggambarkan sensitivitas vs laju False Positive.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rocData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fpr" stroke="#94a3b8" label={{ value: "False Positive Rate (FPR)", position: "insideBottom", offset: -2 }} fontSize={11} />
                <YAxis stroke="#94a3b8" label={{ value: "True Positive Rate (TPR)", angle: -90, position: "insideLeft", offset: 12 }} fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="tpr" stroke="#6366f1" fillOpacity={0.06} fill="url(#colorRoc)" strokeWidth={2.5} name="TPR" />
                <Line type="monotone" dataKey="baseline" stroke="#cbd5e1" strokeDasharray="5 5" dot={false} activeDot={false} name="Baseline" />
                <defs>
                  <linearGradient id="colorRoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
