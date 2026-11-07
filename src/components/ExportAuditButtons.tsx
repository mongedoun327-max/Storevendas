"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileText, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { exportBreakageToExcel } from "../utils/exportBreakageToExcel";
import { exportBreakageToPdf } from "../utils/exportBreakageToPdf";
import { OperatorPerformance } from "../types/analytics";

interface ExportButtonsProps {
  data: OperatorPerformance[];
  periodLabel?: string;
}

export function ExportAuditButtons({ data, periodLabel = "Últimos 30 dias" }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");

  const handleExportExcel = () => {
    setExporting(true);
    try {
      exportBreakageToExcel(data);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = () => {
    setExporting(true);
    try {
      exportBreakageToPdf(data, periodLabel);
    } finally {
      setExporting(false);
    }
  };

  const handleSendSupervisorEmail = async () => {
    if (data.length === 0) return;

    setEmailStatus("sending");
    setStatusMessage("");

    try {
      const totalSales = data.reduce((acc, d) => acc + d.totalSales, 0);
      const totalBreakage = data.reduce((acc, d) => acc + d.totalBreakage, 0);
      const totalSurplus = data.reduce((acc, d) => acc + d.totalSurplus, 0);
      const averageAccuracy = Number(
        (data.reduce((acc, d) => acc + d.accuracyRate, 0) / data.length).toFixed(1)
      );

      const response = await fetch("/api/email/audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          operators: data,
          summary: {
            totalSales,
            totalBreakage,
            totalSurplus,
            averageAccuracy,
          },
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error || "Falha ao enviar e-mail ao supervisor.");
      }

      setEmailStatus("success");
      setStatusMessage(`Enviado com sucesso para ${resJson.recipient || "supervisor"}!`);
      setTimeout(() => {
        setEmailStatus("idle");
        setStatusMessage("");
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setEmailStatus("error");
      setStatusMessage(err.message || "Erro no envio de e-mail.");
      setTimeout(() => {
        setEmailStatus("idle");
      }, 6000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={exporting || data.length === 0}
        className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
        title="Descarregar ficheiro Excel formatado"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        Exportar Excel
      </button>

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={exporting || data.length === 0}
        className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
        title="Gerar documento PDF com auditoria"
      >
        <FileText className="w-4 h-4 text-rose-400" />
        Exportar PDF
      </button>

      <button
        type="button"
        onClick={handleSendSupervisorEmail}
        disabled={emailStatus === "sending" || data.length === 0}
        className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-3.5 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
        title="Enviar relatório por e-mail via Resend ao supervisor"
      >
        {emailStatus === "sending" ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        ) : (
          <Mail className="w-4 h-4 text-indigo-400" />
        )}
        {emailStatus === "sending" ? "A enviar..." : "Enviar ao Supervisor"}
      </button>

      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border animate-fade-in ${
            emailStatus === "success"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border-rose-800"
          }`}
        >
          {emailStatus === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

export default ExportAuditButtons;
