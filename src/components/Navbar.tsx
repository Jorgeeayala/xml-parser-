import React from 'react';
import {
  FileText,
  Printer,
  Download,
  BarChart2,
  Code2,
  Eye,
  Loader2,
  FileSpreadsheet,
  Scissors,
  ExternalLink,
  Moon,
  Sun,
} from 'lucide-react';
import { KudeDocumentData } from '../types/kude';

export type ActiveTab = 'kude' | 'batch-duo' | 'analytics' | 'xml';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  isExportingPdf: boolean;
  activeDoc: KudeDocumentData | null;
  docsCount?: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onExportPdf,
  onExportJson,
  isExportingPdf,
  activeDoc,
  docsCount = 1,
  darkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. Logo & App Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-blue-400 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">
                  Visor KuDE &amp; Analizador XML
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  SIFEN DTE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Representación gráfica y optimización de impresión A4
              </p>
            </div>
          </div>

          {/* 2. Desktop Navigation Tabs */}
          <nav aria-label="Secciones principales" className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveTab('kude')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'kude'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>KuDE Individual</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('batch-duo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative ${
                activeTab === 'batch-duo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Impresión Dúo (2 por Hoja)</span>
              {docsCount > 1 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 rounded-full text-[10px] font-mono font-bold">
                  {docsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Visualización</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'xml'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>XML Fuente</span>
            </button>
          </nav>

          {/* 3. Action Buttons Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Utility Group: Theme Toggle & New Tab */}
            <div className="flex items-center gap-1.5">
              {onToggleDarkMode && (
                <button
                  id="btn-toggle-dark-mode"
                  type="button"
                  onClick={onToggleDarkMode}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
                  title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                  aria-label="Cambiar tema de color"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
                  )}
                </button>
              )}

              <a
                id="btn-open-new-tab"
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
                title="Abrir en pestaña completa fuera del visor de previsualización (permite impresión directa Ctrl+P sin bloqueo de iframe)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="hidden lg:inline">Pestaña Completa</span>
              </a>
            </div>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

            {/* Primary Actions: Print & PDF */}
            <div className="flex items-center gap-2">
              <button
                id="btn-navbar-print"
                type="button"
                onClick={onPrint}
                disabled={!activeDoc}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Opciones de impresión o diálogo nativo"
              >
                <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="hidden sm:inline">
                  {activeTab === 'batch-duo' ? 'Imprimir Dúo' : 'Imprimir'}
                </span>
              </button>

              <button
                id="btn-navbar-export-pdf"
                type="button"
                onClick={onExportPdf}
                disabled={!activeDoc || isExportingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descargar en formato PDF oficial para imprimir"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Exportar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('kude')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
              activeTab === 'kude'
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>KuDE</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch-duo')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
              activeTab === 'batch-duo'
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Dúo 2x1</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
              activeTab === 'analytics'
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Gráficos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xml')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
              activeTab === 'xml'
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>XML</span>
          </button>
        </div>
      </div>
    </header>
  );
};

