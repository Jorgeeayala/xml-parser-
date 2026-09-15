import React from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  X,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { PaperSizeType, PAPER_SIZES } from '../types/paper';

interface PrintAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  onNativePrintRetry: () => void;
  isExportingPdf: boolean;
  activeTab: 'kude' | 'batch-duo' | 'analytics' | 'xml';
  totalSheetsCount?: number;
  paperSize?: PaperSizeType;
  onPaperSizeChange?: (size: PaperSizeType) => void;
}

export const PrintAssistantModal: React.FC<PrintAssistantModalProps> = ({
  isOpen,
  onClose,
  onDownloadPdf,
  onNativePrintRetry,
  isExportingPdf,
  activeTab,
  totalSheetsCount = 1,
  paperSize = 'a4',
  onPaperSizeChange,
}) => {
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const paperConfig = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Opciones de Impresión del KuDE
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'batch-duo'
                  ? `Impresión Dúo optimizada (${totalSheetsCount} ${
                      totalSheetsCount === 1 ? `hoja ${paperConfig.shortLabel}` : `hojas ${paperConfig.shortLabel}`
                    })`
                  : `Documento KuDE oficial (${paperConfig.shortLabel})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size selector inside modal */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Tamaño de papel de salida:</span>
          </div>
          <select
            value={paperSize}
            onChange={(e) => onPaperSizeChange?.(e.target.value as PaperSizeType)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
          >
            <option value="a4">A4 (210 × 297 mm)</option>
            <option value="oficio">8,5 × 13" u Oficio (216 × 330 mm)</option>
            <option value="folio">Folio (215 × 315 mm)</option>
          </select>
        </div>

        {/* Informative Explanation Banner */}
        <div className="px-6 pt-4">
          <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                ¿Por qué el navegador no abrió la ventana de impresión?
              </p>
              <p className="mt-1 text-amber-800 dark:text-amber-300 leading-relaxed">
                Al previsualizar dentro de un visor o marco embebido (iframe), la
                política de seguridad de los navegadores (Chrome, Edge, Firefox)
                bloquea la orden nativa <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px]">window.print()</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Immediate Action Choices */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Soluciones inmediatas para imprimir:
          </p>

          {/* Solution 1: Download PDF (Recommended) */}
          <button
            type="button"
            onClick={() => {
              onDownloadPdf();
            }}
            disabled={isExportingPdf}
            className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-xs transition-all group disabled:opacity-60"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-2.5 bg-white/10 rounded-lg group-hover:scale-105 transition-transform">
                {isExportingPdf ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Descargar PDF en {paperConfig.shortLabel}</span>
                  <span className="px-2 py-0.5 bg-blue-500/80 text-[10px] font-bold uppercase tracking-wider rounded-full text-blue-50">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Genera el archivo en tamaño {paperConfig.label} ({paperConfig.dimensionsMm}) idéntico al oficial, listo para la impresora.
                </p>
              </div>
            </div>
            <FileCheck className="w-5 h-5 opacity-70 shrink-0 hidden sm:block" />
          </button>

          {/* Solution 2: Open in New Tab */}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform shadow-2xs">
                <ExternalLink className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Abrir en Nueva Pestaña (Fuera del visor)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  En pantalla completa sin iframe, el botón de imprimir y <kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.2 rounded text-[11px] text-slate-700 dark:text-slate-300">Ctrl + P</kbd> abren el diálogo nativo directo.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:inline">
              Abrir ↗
            </span>
          </a>

          {/* Solution 3: Direct Retry */}
          <button
            type="button"
            onClick={onNativePrintRetry}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Reintentar diálogo nativo en esta ventana</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Formato {paperConfig.shortLabel} homologado para SIFEN / SET
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

