"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { GraduationCap, BookOpen, User, Fingerprint, Award, FileText } from "lucide-react";

export function AboutProject() {
  const studentInfo = [
    {
      label: "Nama Mahasiswa",
      value: "Cryl Syawal",
      icon: <User className="h-4 w-4 text-sky-500" />,
    },
    {
      label: "NIM",
      value: "202243501566",
      icon: <Fingerprint className="h-4 w-4 text-sky-500" />,
    },
    {
      label: "Program Studi",
      value: "Teknik Informatika",
      icon: <GraduationCap className="h-4 w-4 text-sky-500" />,
    },
    {
      label: "Mata Kuliah",
      value: "Jaringan Saraf Tiruan (JST)",
      icon: <BookOpen className="h-4 w-4 text-sky-500" />,
    },
    {
      label: "Dosen Pengampu",
      value: "Yanto, M.M., M.Kom.",
      icon: <Award className="h-4 w-4 text-sky-500" />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-white/70 backdrop-blur-md shadow-xl border-slate-200/50 overflow-hidden">
        {/* Banner header for a premium academic look */}
        <div className="h-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
        
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Identitas Projek Laporan</CardTitle>
              <CardDescription>
                Informasi detail pengembang dan pengerjaan tugas ujian akhir mata kuliah.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <Table>
              <TableBody>
                {studentInfo.map((info, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="w-10 pl-4 pr-0">
                      <div className="p-1.5 bg-slate-50 rounded-md">
                        {info.icon}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-500 text-sm py-4 w-48">
                      {info.label}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 text-sm py-4">
                      {info.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 p-5 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl">
            <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" /> Deskripsi Projek
            </h4>
            <p className="text-xs text-indigo-800/80 leading-relaxed">
              Aplikasi ini dikembangkan untuk mengimplementasikan algoritma Jaringan Saraf Tiruan (JST) Backpropagation 
              Multilayer Perceptron (MLP) yang berfungsi mengklasifikasikan kanker payudara (Malignant / Benign) 
              berdasarkan Wisconsin Diagnostic Breast Cancer (WDBC) dataset. Model telah dioptimasi dan dievaluasi 
              secara offline menggunakan Scikit-Learn dan kemudian ditransformasikan ke dalam API web interaktif.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
