import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileCheck2,
  Scissors,
  Layers,
  FileText,
  Copy,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Loader2,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Split,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { KudeDocumentData } from '../types/kude';
import {
  packDocumentsForPrinting,
  PackingOptions,
  DuoPrintPage,
  BatchDistributionMode,
  SingleSheetLayout,
} from '../utils/batchPacking';
import { DuoPrintSheet } from './DuoPrintSheet';
import { PaperSizeType, PAPER_SIZES } from '../types/paper';

interface BatchDuoPrintManagerProps {
  documents: KudeDocumentData[];
  ecoMode: boolean;
  paperSize?: PaperSizeType;
  onPaperSizeChange?: (size: PaperSizeType) => void;
  onEcoModeToggle?: () => void;
  onSelectDocument?: (doc: KudeDocumentData) => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

export const BatchDuoPrintManager: React.FC<BatchDuoPrintManagerProps> = ({
  documents,
  ecoMode,
  paperSize = 'a4',
  onPaperSizeChange,
  onEcoModeToggle,
  onSelectDocument,
  onPrint,
  onExportPdf,
  isExportingPdf = false,
}) => {
  const [distributionMode, setDistributionMode] = useState<BatchDistributionMode>('duo-auto');
  const [singleLayoutDefault, setSingleLayoutDefault] = useState<SingleSheetLayout>('half-top');
  const [groupBy, setGroupBy] = useState<'affinity' | 'date' | 'sequence' | 'order'>('affinity');
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [customPages, setCustomPages] = useState<DuoPrintPage[] | null>(null);
  const [pairingSourcePageId, setPairingSourcePageId] = useState<string | null>(null);

  const paperConfig = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;

  const packingOptions: PackingOptions = useMemo(
    () => ({
      distributionMode,
      singleLayoutDefault,
      groupBy,
      maxItemsForShort: 5,
    }),
    [distributionMode, singleLayoutDefault, groupBy]
  );

  const autoPackingResult = useMemo(
    () => packDocumentsForPrinting(documents, packingOptions),
    [documents, packingOptions]
  );

  // Use custom pages if user manually modified them, otherwise use auto packing
  const activePages = customPages || autoPackingResult.pages;
  const isCustomized = customPages !== null;

  const totalDocs = autoPackingResult.totalDocs;
  const shortDocs = autoPackingResult.shortDocs;
  const longDocs = autoPackingResult.longDocs;
  const normalPagesCount = autoPackingResult.normalPagesCount;
  const optimizedPagesCount = activePages.length;
  const savedSheetsCount = Math.max(0, normalPagesCount - optimizedPagesCount);
  const percentageSaved =
    normalPagesCount > 0 ? Math.round((savedSheetsCount / normalPagesCount) * 100) : 0;

  // Change distribution mode (resets custom pages)
  const handleDistributionModeChange = (mode: BatchDistributionMode) => {
    setDistributionMode(mode);
    setCustomPages(null);
    setPairingSourcePageId(null);
    setSelectedSheetIndex(null);
  };

  // Change default single layout
  const handleSingleLayoutDefaultChange = (layout: SingleSheetLayout) => {
    setSingleLayoutDefault(layout);
    if (customPages) {
      setCustomPages((prev) =>
        prev
          ? prev.map((p) =>
              p.type === 'single' ? { ...p, singleLayout: layout } : p
            )
          : null
      );
    }
  };

  // Split a duo page into two single pages
  const handleSplitPage = (pageId: string) => {
    const current = [...activePages];
    const targetIdx = current.findIndex((p) => p.id === pageId);
    if (targetIdx === -1) return;

    const targetPage = current[targetIdx];
    if (targetPage.type !== 'duo' || !targetPage.docBottom) return;

    const pageA: DuoPrintPage = {
      id: `page-single-${targetPage.docTop.id}-${Date.now()}-a`,
      pageIndex: 0,
      type: 'single',
      docTop: targetPage.docTop,
      singleLayout: singleLayoutDefault,
      reason: `Factura ${targetPage.docTop.numeroCompleto || ''} (Separada manualmente)`,
      dateLabel: targetPage.dateLabel,
    };

    const pageB: DuoPrintPage = {
      id: `page-single-${targetPage.docBottom.id}-${Date.now()}-b`,
      pageIndex: 0,
      type: 'single',
      docTop: targetPage.docBottom,
      singleLayout: singleLayoutDefault,
      reason: `Factura ${targetPage.docBottom.numeroCompleto || ''} (Separada manualmente)`,
      dateLabel: targetPage.dateLabel,
    };

    current.splice(targetIdx, 1, pageA, pageB);
    const reindexed = current.map((p, idx) => ({ ...p, pageIndex: idx + 1 }));
    setCustomPages(reindexed);
    setSelectedSheetIndex(null);
  };

  // Swap top and bottom documents in a duo page
  const handleSwapPositions = (pageId: string) => {
    const current = activePages.map((p) => {
      if (p.id === pageId && p.type === 'duo' && p.docBottom) {
        return {
          ...p,
          docTop: p.docBottom,
          docBottom: p.docTop,
          copyTags: p.copyTags
            ? { top: p.copyTags.bottom, bottom: p.copyTags.top }
            : undefined,
        };
      }
      return p;
    });
    setCustomPages(current);
  };

  // Change single layout for a specific page
  const handleSingleLayoutChange = (pageId: string, layout: SingleSheetLayout) => {
    const current = activePages.map((p) => {
      if (p.id === pageId) {
        return { ...p, singleLayout: layout };
      }
      return p;
    });
    setCustomPages(current);
  };

  // Combine two single pages into one duo page
  const handlePairSinglePages = (pageIdA: string, pageIdB: string) => {
    const current = [...activePages];
    const idxA = current.findIndex((p) => p.id === pageIdA);
    const idxB = current.findIndex((p) => p.id === pageIdB);
    if (idxA === -1 || idxB === -1 || idxA === idxB) return;

    const pageA = current[idxA];
    const pageB = current[idxB];
    if (pageA.type !== 'single' || pageB.type !== 'single') return;

    const combinedPage: DuoPrintPage = {
      id: `page-duo-${pageA.docTop.id}-${pageB.docTop.id}`,
      pageIndex: 0,
      type: 'duo',
      docTop: pageA.docTop,
      docBottom: pageB.docTop,
      reason: '2 facturas asociadas manualmente en 1 hoja',
      dateLabel: `${pageA.dateLabel || ''} / ${pageB.dateLabel || ''}`,
    };

    const filtered = current.filter((_, idx) => idx !== idxA && idx !== idxB);
    const insertIdx = Math.min(idxA, idxB);
    filtered.splice(insertIdx, 0, combinedPage);

    const reindexed = filtered.map((p, idx) => ({ ...p, pageIndex: idx + 1 }));
    setCustomPages(reindexed);
    setPairingSourcePageId(null);
    setSelectedSheetIndex(null);
  };

  // Reset all custom manual modifications back to automatic
  const handleResetToAuto = () => {
    setCustomPages(null);
    setPairingSourcePageId(null);
    setSelectedSheetIndex(null);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      try {
        window.print();
      } catch {
        // Handled
      }
    }
  };

  // List of available single pages for pairing
  const availableSinglePages = activePages.filter((p) => p.type === 'single');

  if (documents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto shadow-xs my-8 transition-colors">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-600 dark:text-slate-400">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          No hay facturas cargadas para empaquetar
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sube tus archivos XML SIFEN en el panel superior para ver la asociación flexible de facturas por hoja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Metric Savings Bar (No-Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-800">
                <Scissors className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Distribución y Disposición de Impresión por Hoja
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Distribución ultra flexible: asocia las 2 facturas más aptas por hoja ({paperConfig.shortLabel}), imprime en hojas separadas o duplica con control total sobre la factura individual.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isCustomized && (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                title="Deshacer ajustes manuales y volver al algoritmo automático"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Automático</span>
              </button>
            )}

            <button
              id="btn-batch-print"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir Lote ({optimizedPagesCount} {optimizedPagesCount === 1 ? 'Hoja' : 'Hojas'})
            </button>

            {onExportPdf && (
              <button
                id="btn-batch-export-pdf"
                type="button"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                title={`Descargar las hojas ${paperConfig.shortLabel} del lote en formato PDF para enviar a la impresora`}
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF ({paperConfig.shortLabel})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Facturas Cargadas
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{totalDocs}</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                ({shortDocs} cortas, {longDocs} {longDocs === 1 ? 'larga' : 'largas'})
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Hojas en Impresión Tradicional
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-slate-500 dark:text-slate-400 line-through">
                {normalPagesCount}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">hojas (1x1)</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Hojas a Imprimir
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-200">
                {optimizedPagesCount}
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                {optimizedPagesCount === 1 ? `hoja ${paperConfig.shortLabel}` : `hojas ${paperConfig.shortLabel}`}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3">
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Ahorro de Papel
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold font-mono text-amber-950 dark:text-amber-200">
                {percentageSaved}%
              </span>
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                ({savedSheetsCount} {savedSheetsCount === 1 ? 'hoja menos' : 'hojas menos'})
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Controls Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Selector de Distribución General */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Distribución:</span>
              <select
                id="select-distribution-mode"
                value={distributionMode}
                onChange={(e) => handleDistributionModeChange(e.target.value as BatchDistributionMode)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              >
                <option value="duo-auto">Dúo Inteligente (Asociar 2 más aptas)</option>
                <option value="separate">Hojas Separadas (1 factura por hoja / 100% individual)</option>
                <option value="duplicate">Modo Duplicado (Original + Copia por hoja)</option>
              </select>
            </div>

            {/* 2. Selector de Disposición de Facturas Solas (Huérfanas / Individuales) */}
            {distributionMode !== 'duplicate' && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <Scissors className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Factura sola va en:</span>
                <select
                  id="select-single-layout"
                  value={singleLayoutDefault}
                  onChange={(e) => handleSingleLayoutDefaultChange(e.target.value as SingleSheetLayout)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                  title="Define cómo se dispone la 3ra factura o comprobantes que van solos en su hoja"
                >
                  <option value="half-top">Media Hoja Superior (50% - Con guía de corte)</option>
                  <option value="duplicate">Original + Duplicado (Aprovecha 100% de la hoja)</option>
                  <option value="full">Hoja Completa (Estándar KuDE tradicional)</option>
                </select>
              </div>
            )}

            {/* 3. Paper Size Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Tamaño:</span>
              <select
                id="select-paper-size"
                value={paperSize}
                onChange={(e) => onPaperSizeChange?.(e.target.value as PaperSizeType)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              >
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="oficio">8,5 × 13" u Oficio (216 × 330 mm)</option>
                <option value="folio">Folio (215 × 315 mm)</option>
              </select>
            </div>

            {/* 4. Packing grouping criteria */}
            {distributionMode === 'duo-auto' && (
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Criterio:</span>
                <select
                  value={groupBy}
                  onChange={(e) => {
                    setGroupBy(e.target.value as any);
                    setCustomPages(null);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
                >
                  <option value="affinity">Mayor Aptitud y Armonía (Recomendado)</option>
                  <option value="date">Misma Fecha de Emisión</option>
                  <option value="sequence">Secuencia Numérica Consecutiva</option>
                  <option value="order">Orden de Carga</option>
                </select>
              </div>
            )}

            {/* Controles de Zoom para vista previa */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-0.5">
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(0.6, Math.round((s - 0.1) * 10) / 10))}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="Reducir zoom de vista previa"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(1.3, Math.round((s + 0.1) * 10) / 10))}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="Aumentar zoom de vista previa"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 ml-1 border-l border-slate-200 dark:border-slate-700"
                title="Restablecer tamaño 100%"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {onEcoModeToggle && (
            <button
              type="button"
              onClick={onEcoModeToggle}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                ecoMode
                  ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {ecoMode ? 'Ahorro de Tinta Activado' : 'Ahorro de Tinta Desactivado'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Page Breakdown & Flexible Association (No-Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>
              Hojas a Imprimir ({activePages.length}) — {paperConfig.label}
            </span>
            {isCustomized && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded text-[10px] font-semibold border border-blue-200 dark:border-blue-700">
                Personalizado manualmente
              </span>
            )}
          </h3>

          <div className="flex items-center gap-2">
            {selectedSheetIndex !== null && (
              <button
                type="button"
                onClick={() => setSelectedSheetIndex(null)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Ver todas las hojas ({activePages.length})
              </button>
            )}
          </div>
        </div>

        {/* Pairing Assistant Notice */}
        {pairingSourcePageId && (
          <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Selecciona otra factura individual a continuación para asociarla en la misma hoja con esta factura.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPairingSourcePageId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="space-y-2">
          {activePages.map((page, idx) => {
            const isSelected = selectedSheetIndex === idx;
            const isPairingSource = pairingSourcePageId === page.id;
            const canBePairedWithSource =
              pairingSourcePageId &&
              page.type === 'single' &&
              page.id !== pairingSourcePageId;

            return (
              <div
                key={page.id}
                className={`p-2.5 rounded-lg border text-xs transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600 dark:ring-blue-500 shadow-2xs'
                    : isPairingSource
                    ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : canBePairedWithSource
                    ? 'border-dashed border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/50'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {/* Left info: Page index, badges & Document details */}
                <div
                  onClick={() => setSelectedSheetIndex(isSelected ? null : idx)}
                  className="flex flex-wrap items-center gap-2.5 cursor-pointer flex-1"
                >
                  <span className="px-2 py-0.5 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 text-[10px] font-mono font-bold rounded-xs">
                    HOJA {idx + 1}
                  </span>

                  {page.type === 'duo' ? (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-semibold rounded-full text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/80">
                      <Scissors className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Dúo (2 en 1)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-full text-[11px] border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Individual ({page.singleLayout === 'half-top' ? 'Media Hoja 50%' : page.singleLayout === 'duplicate' ? 'Original + Copia' : 'Hoja Completa'})
                    </span>
                  )}

                  {page.fitnessScore !== undefined && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 border border-emerald-200 dark:border-emerald-800 rounded">
                      Afinidad: {page.fitnessScore} pts
                    </span>
                  )}

                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {page.type === 'duo' && page.docBottom ? (
                      <>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">
                          {page.docTop.numeroCompleto}
                        </strong>{' '}
                        ({page.docTop.items.length} ítems) +{' '}
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">
                          {page.docBottom.numeroCompleto}
                        </strong>{' '}
                        ({page.docBottom.items.length} ítems)
                      </>
                    ) : (
                      <>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">
                          {page.docTop.numeroCompleto}
                        </strong>{' '}
                        ({page.docTop.items.length} {page.docTop.items.length === 1 ? 'ítem' : 'ítems'})
                      </>
                    )}
                  </span>
                </div>

                {/* Right controls: Split, Swap, Pair & Layout */}
                <div className="flex flex-wrap items-center gap-1.5 self-end md:self-center">
                  {/* If Page is Duo: Options to Invert or Split */}
                  {page.type === 'duo' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSwapPositions(page.id)}
                        className="p-1 px-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[11px] transition-colors"
                        title="Invertir factura superior con inferior"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span className="hidden sm:inline">Invertir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSplitPage(page.id)}
                        className="p-1 px-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[11px] transition-colors"
                        title="Separar estas 2 facturas en dos hojas individuales independientes"
                      >
                        <Split className="w-3 h-3" />
                        <span>Separar en 2 hojas</span>
                      </button>
                    </>
                  )}

                  {/* If Page is Single: Option to combine with another single or change disposition */}
                  {page.type === 'single' && (
                    <>
                      {canBePairedWithSource ? (
                        <button
                          type="button"
                          onClick={() => handlePairSinglePages(pairingSourcePageId!, page.id)}
                          className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 text-[11px] shadow-2xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Asociar con esta hoja</span>
                        </button>
                      ) : availableSinglePages.length > 1 && !pairingSourcePageId ? (
                        <button
                          type="button"
                          onClick={() => setPairingSourcePageId(page.id)}
                          className="p-1 px-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1 text-[11px] transition-colors"
                          title="Asociar esta factura con otra factura individual del lote en 1 sola hoja"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Unir con otra...</span>
                        </button>
                      ) : null}

                      {/* Disposición rápida de la factura individual */}
                      <select
                        value={page.singleLayout || 'half-top'}
                        onChange={(e) =>
                          handleSingleLayoutChange(page.id, e.target.value as SingleSheetLayout)
                        }
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <option value="half-top">Media Hoja (50%)</option>
                        <option value="duplicate">Original + Duplicado</option>
                        <option value="full">Hoja Completa</option>
                      </select>
                    </>
                  )}

                  {/* Toggle Preview Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedSheetIndex(isSelected ? null : idx)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                    title="Ver solo esta hoja"
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. The Print & Preview Document Sheets */}
      <div className="overflow-x-auto pb-6">
        <div
          id="duo-printable-container"
          className="print:m-0 space-y-8 print:space-y-0"
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {activePages
            .filter((_, idx) => selectedSheetIndex === null || selectedSheetIndex === idx)
            .map((page) => (
              <DuoPrintSheet
                key={page.id}
                page={page}
                ecoMode={ecoMode}
                paperSize={paperSize}
                onSingleLayoutChange={handleSingleLayoutChange}
                onSplitPage={handleSplitPage}
                onSwapPositions={handleSwapPositions}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

