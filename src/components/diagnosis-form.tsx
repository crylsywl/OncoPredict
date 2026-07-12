"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Loader2, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, HelpCircle, Activity, Sparkles } from "lucide-react";

interface PredictionResult {
  status: string;
  diagnosis: "Malignant" | "Benign";
  probability_benign: number;
  probability_malignant: number;
}

interface CSVPredictionRow {
  id: number;
  diagnosis: "Malignant" | "Benign";
  probability_benign: number;
  probability_malignant: number;
  features: {
    "mean radius": number;
    "mean texture": number;
    "mean perimeter": number;
    "mean area": number;
    "mean smoothness": number;
  };
}

interface CSVPredictionResult {
  status: string;
  summary: {
    total: number;
    malignant: number;
    benign: number;
  };
  predictions: CSVPredictionRow[];
}

export function DiagnosisForm() {
  // Manual form values
  const [meanRadius, setMeanRadius] = useState<number>(14.12);
  const [meanTexture, setMeanTexture] = useState<number>(19.29);
  const [meanPerimeter, setMeanPerimeter] = useState<number>(91.96);
  const [meanArea, setMeanArea] = useState<number>(654.89);
  const [meanSmoothness, setMeanSmoothness] = useState<number>(0.096);

  // States
  const [activeInputType, setActiveInputType] = useState<"manual" | "csv">("manual");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [csvResult, setCsvResult] = useState<CSVPredictionResult | null>(null);
  
  // CSV File drag & drop
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);
    setCsvResult(null);

    try {
      const response = await fetch(`/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mean_radius: meanRadius,
          mean_texture: meanTexture,
          mean_perimeter: meanPerimeter,
          mean_area: meanArea,
          mean_smoothness: meanSmoothness,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Terjadi kesalahan pada backend server.");
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke backend server.");
    } finally {
      setLoading(false);
    }
  };

  // CSV Drag and drop handers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        setError("Format file tidak didukung. Harap unggah file .csv");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        setError("Format file tidak didukung. Harap unggah file .csv");
      }
    }
  };

  const handleCSVSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    setCsvResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`/api/predict_csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Gagal memproses file CSV.");
      }

      const data = await response.json();
      setCsvResult(data);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah atau memproses CSV.");
    } finally {
      setLoading(false);
    }
  };

  // Recharts Pie Chart data construction
  const donutData = prediction
    ? [
        { name: "Benign", value: prediction.probability_benign, color: "#10b981" },
        { name: "Malignant", value: prediction.probability_malignant, color: "#ef4444" },
      ]
    : [];

  const activeDiagnosis = prediction ? prediction.diagnosis : null;
  const activeConfidence = prediction
    ? activeDiagnosis === "Malignant"
      ? prediction.probability_malignant
      : prediction.probability_benign
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Input Panel */}
      <Card className="lg:col-span-7 bg-white/70 backdrop-blur-md shadow-xl border-slate-200/50">
        <CardHeader className="border-b border-slate-100/80 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Metode Diagnosis</CardTitle>
              <CardDescription>Pilih antara manual input parameter medis atau upload dokumen CSV.</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 mt-6 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => {
                setActiveInputType("manual");
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeInputType === "manual"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Manual Input (5 Fitur)
            </button>
            <button
              onClick={() => {
                setActiveInputType("csv");
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeInputType === "csv"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Upload Massal (.CSV)
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {activeInputType === "manual" ? (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              {/* Radius */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Mean Radius (6.9 - 28.1)</label>
                  <Input
                    type="number"
                    min={6.9}
                    max={28.1}
                    step={0.01}
                    value={meanRadius}
                    onChange={(e) => setMeanRadius(Math.max(6.9, Math.min(28.1, parseFloat(e.target.value) || 6.9)))}
                    className="w-24 h-8 text-right font-mono"
                  />
                </div>
                <Slider
                  min={6.9}
                  max={28.1}
                  step={0.1}
                  value={meanRadius}
                  onValueChange={(val) => setMeanRadius(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              {/* Texture */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Mean Texture (9.7 - 39.2)</label>
                  <Input
                    type="number"
                    min={9.7}
                    max={39.2}
                    step={0.01}
                    value={meanTexture}
                    onChange={(e) => setMeanTexture(Math.max(9.7, Math.min(39.2, parseFloat(e.target.value) || 9.7)))}
                    className="w-24 h-8 text-right font-mono"
                  />
                </div>
                <Slider
                  min={9.7}
                  max={39.2}
                  step={0.1}
                  value={meanTexture}
                  onValueChange={(val) => setMeanTexture(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              {/* Perimeter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Mean Perimeter (43.7 - 188.5)</label>
                  <Input
                    type="number"
                    min={43.7}
                    max={188.5}
                    step={0.01}
                    value={meanPerimeter}
                    onChange={(e) => setMeanPerimeter(Math.max(43.7, Math.min(188.5, parseFloat(e.target.value) || 43.7)))}
                    className="w-24 h-8 text-right font-mono"
                  />
                </div>
                <Slider
                  min={43.7}
                  max={188.5}
                  step={0.1}
                  value={meanPerimeter}
                  onValueChange={(val) => setMeanPerimeter(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Mean Area (143.5 - 2501.0)</label>
                  <Input
                    type="number"
                    min={143.5}
                    max={2501.0}
                    step={0.1}
                    value={meanArea}
                    onChange={(e) => setMeanArea(Math.max(143.5, Math.min(2501.0, parseFloat(e.target.value) || 143.5)))}
                    className="w-24 h-8 text-right font-mono"
                  />
                </div>
                <Slider
                  min={143.5}
                  max={2501.0}
                  step={1}
                  value={meanArea}
                  onValueChange={(val) => setMeanArea(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              {/* Smoothness */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Mean Smoothness (0.05 - 0.16)</label>
                  <Input
                    type="number"
                    min={0.05}
                    max={0.16}
                    step={0.001}
                    value={meanSmoothness}
                    onChange={(e) => setMeanSmoothness(Math.max(0.05, Math.min(0.16, parseFloat(e.target.value) || 0.05)))}
                    className="w-24 h-8 text-right font-mono"
                  />
                </div>
                <Slider
                  min={0.05}
                  max={0.16}
                  step={0.001}
                  value={meanSmoothness}
                  onValueChange={(val) => setMeanSmoothness(Array.isArray(val) ? val[0] : val)}
                  className="py-2"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Menghitung Prediksi JST...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analisis Diagnosis Payudara
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-sky-500 bg-sky-50/50"
                    : selectedFile
                    ? "border-emerald-500 bg-emerald-50/20"
                    : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className={`p-4 rounded-full mb-4 ${selectedFile ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {selectedFile ? <FileSpreadsheet className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Drag & Drop file CSV di sini</p>
                    <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih dari komputer Anda</p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setCsvResult(null);
                    }}
                    className="flex-1 py-5 rounded-xl text-slate-600"
                  >
                    Hapus File
                  </Button>
                  <Button
                    disabled={loading}
                    onClick={handleCSVSubmit}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 rounded-xl shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Mengklasifikasi CSV...
                      </>
                    ) : (
                      "Proses Prediksi Massal"
                    )}
                  </Button>
                </div>
              )}
              
              <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl text-xs text-sky-700 leading-relaxed">
                <p className="font-semibold mb-1 flex items-center">
                  <HelpCircle className="h-4 w-4 mr-1.5" /> Panduan Struktur CSV
                </p>
                Pastikan file CSV memiliki 30 fitur klinis lengkap atau diatur urutannya sesuai dataset Wisconsin. Minimal mengandung kolom nama parameter yang valid (seperti <code>mean radius</code>, <code>mean texture</code>, dsb). Jika kolom nama tidak cocok, program akan membaca urutan 30 kolom pertama secara berurutan.
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Error Operasional</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card className="lg:col-span-5 bg-white/70 backdrop-blur-md shadow-xl border-slate-200/50 min-h-[500px] flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100/80 pb-6">
          <CardTitle className="text-xl font-bold text-slate-800">Hasil Prediksi JST</CardTitle>
          <CardDescription>Keputusan klasifikasi jaringan saraf tiruan (Multilayer Perceptron).</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-center items-center py-10">
          {!prediction && !csvResult && !loading && (
            <div className="text-center max-w-sm px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Activity className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-700 text-base">Menunggu Data Input</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Gunakan form di sebelah kiri untuk mengisi data pasien medis dan menekan tombol analisis untuk memulai evaluasi klinis.
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-sky-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 text-sm font-medium">Melakukan komputasi Backpropagation...</p>
              <p className="text-slate-400 text-xs mt-1">Mengukur bobot JST terhadap parameter input</p>
            </div>
          )}

          {/* Single Prediction Result */}
          {prediction && !loading && (
            <div className="w-full flex flex-col items-center">
              {/* Radial Probability gauge */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800 font-mono">
                    {(activeConfidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-400 text-[10px] tracking-wider uppercase mt-1">Keyakinan</span>
                </div>
              </div>

              {/* Diagnosis Badge */}
              <div className="mt-4 flex flex-col items-center space-y-2">
                <span className="text-slate-400 text-xs">Diagnosis Akhir:</span>
                {activeDiagnosis === "Malignant" ? (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg px-6 py-2.5 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                    Malignant (Ganas)
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg px-6 py-2.5 rounded-full shadow-lg shadow-emerald-500/20">
                    Benign (Jinak)
                  </Badge>
                )}
              </div>

              {/* Detail Metrics */}
              <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Prob. Jinak</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono mt-1">
                    {(prediction.probability_benign * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Prob. Ganas</span>
                  <span className="text-lg font-bold text-red-600 font-mono mt-1">
                    {(prediction.probability_malignant * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CSV Bulk Prediction Result */}
          {csvResult && !loading && (
            <div className="w-full space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-around">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-800 font-mono">{csvResult.summary.total}</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Total Data</div>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{csvResult.summary.benign}</div>
                  <div className="text-[10px] text-emerald-600/80 font-bold uppercase mt-0.5">Benign (Jinak)</div>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-500 font-mono">{csvResult.summary.malignant}</div>
                  <div className="text-[10px] text-red-500/80 font-bold uppercase mt-0.5">Malignant (Ganas)</div>
                </div>
              </div>

              {/* Scrollable results list */}
              <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-xl">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-16 font-semibold text-slate-600 text-xs">No</TableHead>
                      <TableHead className="font-semibold text-slate-600 text-xs">Hasil Diagnosis</TableHead>
                      <TableHead className="text-right font-semibold text-slate-600 text-xs">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvResult.predictions.map((row) => (
                      <TableRow key={row.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs text-slate-500">{row.id}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.diagnosis === "Malignant"
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {row.diagnosis}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {(
                            (row.diagnosis === "Malignant" ? row.probability_malignant : row.probability_benign) * 100
                          ).toFixed(1)}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>

        {/* Disclaimer section */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/30 rounded-b-2xl">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            *Medical Disclaimer: Aplikasi ini merupakan alat bantu pendukung keputusan medis untuk keperluan akademis, bukan pengganti diagnosis final dari dokter spesialis.
          </p>
        </div>
      </Card>
    </div>
  );
}
