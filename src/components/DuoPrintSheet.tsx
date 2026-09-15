import React from 'react';
import { DuoPrintPage, SingleSheetLayout } from '../utils/batchPacking';
import { KudeDocument } from './KudeDocument';
import { PaperSizeType, PAPER_SIZES } from '../types/paper';
import { Scissors, Copy, FileText, Split, ArrowUpDown } from 'lucide-react';

interface DuoPrintSheetProps {
  page: DuoPrintPage;
  ecoMode?: boolean;
  paperSize?: PaperSizeType;
  onSingleLayoutChange?: (pageId: string, layout: SingleSheetLayout) => void;
  onSplitPage?: (pageId: string) => void;
  onSwapPositions?: (pageId: string) => void;
}

/**
 * Calculates dynamic vertical metrics and remaining space distribution
 * for dual-invoice sheets based on paper format (A4, Oficio, Folio) and item density.
 */
function calculateDuoMetrics(paperSize: PaperSizeType, targetItemRows: number) {
  const config = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;
  const totalHeightMm = config.heightMm;
  const totalWidthMm = config.widthMm;

  // Printable margin: 3mm top + 3mm bottom
  const pageMarginYMm = 3;
  const printableHeightMm = totalHeightMm - pageMarginYMm * 2;
  const halfHeightMm = printableHeightMm / 2;

  // Approximate height of compact KuDE invoice:
  // Base fixed elements (~96mm) + table rows (~4.6mm each)
  const estimatedInvoiceHeightMm = Math.min(138, 96 + Math.max(targetItemRows, 1) * 4.6);

  // Remaining space inside each 50% half of the sheet
  const remainingHalfMm = Math.max(2, halfHeightMm - estimatedInvoiceHeightMm);

  // Dynamic vertical gap between halves and outer padding calculated from remaining space
  // A4 has ~34mm free per half, Folio ~43mm, Oficio ~51mm
  const dynamicPaddingYMm = Math.max(2, Math.min(7, remainingHalfMm * 0.16));
  const dynamicGapMm = Math.max(3, Math.min(14, remainingHalfMm * 0.28));

  return {
    totalHeightMm,
    totalWidthMm,
    printableHeightMm,
    halfHeightMm,
    estimatedInvoiceHeightMm,
    remainingHalfMm,
    dynamicPaddingYMm: Number(dynamicPaddingYMm.toFixed(2)),
    dynamicGapMm: Number(dynamicGapMm.toFixed(2)),
    aspectRatio: `${totalWidthMm} / ${totalHeightMm}`,
  };
}

export const DuoPrintSheet: React.FC<DuoPrintSheetProps> = ({
  page,
  ecoMode = true,
  paperSize = 'a4',
  onSingleLayoutChange,
  onSplitPage,
  onSwapPositions,
}) => {
  const paperConfig = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;

  // CASO 1: HOJA DÚO (2 Facturas distintas por hoja)
  if (page.type === 'duo' && page.docBottom) {
    const topItemCount = page.docTop?.items?.length || 0;
    const bottomItemCount = page.docBottom?.items?.length || 0;
    // Harmonize table rows so both invoices have the EXACT same height and vertical rhythm
    const targetItemRows = Math.max(topItemCount, bottomItemCount, 3);
    const metrics = calculateDuoMetrics(paperSize, targetItemRows);

    return (
      <div className="relative group/sheet">
        {/* Controles de Hoja Dúo (No-Print) */}
        {(onSplitPage || onSwapPositions) && (
          <div className="no-print mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-mono">
                HOJA {page.pageIndex}
              </span>
              <span>Dúo: {page.docTop.numeroCompleto} + {page.docBottom.numeroCompleto}</span>
              {page.fitnessScore !== undefined && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-200 dark:border-emerald-800 rounded">
                  Afinidad: {page.fitnessScore} pts
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {onSwapPositions && (
                <button
                  type="button"
                  onClick={() => onSwapPositions(page.id)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors shadow-2xs"
                  title="Intercambiar orden: factura superior pasa abajo y viceversa"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Invertir (Arriba ⇄ Abajo)</span>
                </button>
              )}
              {onSplitPage && (
                <button
                  type="button"
                  onClick={() => onSplitPage(page.id)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors shadow-2xs"
                  title="Desacoplar en 2 hojas separadas individuales"
                >
                  <Split className="w-3 h-3" />
                  <span>Separar en 2 hojas</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div
          id={page.id}
          className="duo-print-sheet bg-white border border-slate-300 dark:border-slate-700 shadow-xs mx-auto my-3 print:my-0 print:border-none print:shadow-none transition-all flex flex-col justify-between overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '800px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            aspectRatio: metrics.aspectRatio,
            minHeight: `calc(800px * (${metrics.totalHeightMm} / ${metrics.totalWidthMm}))`,
            paddingTop: `${metrics.dynamicPaddingYMm}mm`,
            paddingBottom: `${metrics.dynamicPaddingYMm}mm`,
            paddingLeft: '4px',
            paddingRight: '4px',
            gap: `${metrics.dynamicGapMm}mm`,
            // Dynamic CSS custom properties for print & pdf styling
            ['--duo-paper-height' as string]: `${metrics.totalHeightMm}mm`,
            ['--duo-paper-width' as string]: `${metrics.totalWidthMm}mm`,
            ['--duo-printable-height' as string]: `${metrics.printableHeightMm}mm`,
            ['--duo-half-height' as string]: `${metrics.halfHeightMm}mm`,
            ['--duo-dynamic-gap' as string]: `${metrics.dynamicGapMm}mm`,
            ['--duo-dynamic-padding-y' as string]: `${metrics.dynamicPaddingYMm}mm`,
            ['--duo-aspect-ratio' as string]: metrics.aspectRatio,
          }}
          data-papersize={paperConfig.id}
          data-rows={targetItemRows}
          data-remaining-half={`${metrics.remainingHalfMm.toFixed(1)}mm`}
        >
          {/* Factura Superior: Centrada verticalmente de forma simétrica en el primer 50% de la hoja */}
          <div
            className="duo-half duo-half-top flex-1 flex flex-col justify-center items-stretch min-h-0 overflow-hidden"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <KudeDocument
              id={`${page.id}-top`}
              document={page.docTop}
              ecoMode={ecoMode}
              compact={true}
              targetItemRows={targetItemRows}
              copyTag={page.copyTags?.top}
            />
          </div>

          {/* Línea de corte central simétrica al 50% exacto de la página */}
          <div
            className="duo-cut-divider select-none relative flex items-center justify-center shrink-0 w-full"
            style={{
              margin: `${metrics.dynamicGapMm / 2}mm 0`,
            }}
          >
            <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-600 print:border-slate-400" />
          </div>

          {/* Factura Inferior: Centrada verticalmente de forma simétrica en el segundo 50% de la hoja */}
          <div
            className="duo-half duo-half-bottom flex-1 flex flex-col justify-center items-stretch min-h-0 overflow-hidden"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <KudeDocument
              id={`${page.id}-bottom`}
              document={page.docBottom}
              ecoMode={ecoMode}
              compact={true}
              targetItemRows={targetItemRows}
              copyTag={page.copyTags?.bottom}
            />
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: HOJA INDIVIDUAL (Factura huérfana, larga, o separada)
  const singleLayout = page.singleLayout || 'half-top';
  const topItemCount = page.docTop?.items?.length || 0;
  const targetItemRows = Math.max(topItemCount, 3);
  const metrics = calculateDuoMetrics(paperSize, targetItemRows);

  return (
    <div className="relative group/sheet">
      {/* Controles de Disposición de Hoja Individual (No-Print) */}
      <div className="no-print mb-2 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 gap-2">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-mono">
            HOJA {page.pageIndex}
          </span>
          <span>Factura individual: {page.docTop.numeroCompleto}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
            ({page.docTop.items.length} {page.docTop.items.length === 1 ? 'ítem' : 'ítems'})
          </span>
        </span>

        {onSingleLayoutChange && (
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mr-1 hidden sm:inline">
              Disposición:
            </span>
            <button
              type="button"
              onClick={() => onSingleLayoutChange(page.id, 'half-top')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                singleLayout === 'half-top'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Media Hoja Superior: ocupa el 50% superior simétrico, dejando la mitad inferior libre para corte"
            >
              <Scissors className="w-3 h-3" />
              <span>Media Hoja (50%)</span>
            </button>
            <button
              type="button"
              onClick={() => onSingleLayoutChange(page.id, 'duplicate')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                singleLayout === 'duplicate'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Duplicado Automático: Original arriba y Duplicado abajo para aprovechar el 100% de la hoja"
            >
              <Copy className="w-3 h-3" />
              <span>Original + Copia</span>
            </button>
            <button
              type="button"
              onClick={() => onSingleLayoutChange(page.id, 'full')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                singleLayout === 'full'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Hoja Completa Estándar: formato KuDE tradicional centrado en toda la página"
            >
              <FileText className="w-3 h-3" />
              <span>Hoja Completa</span>
            </button>
          </div>
        )}
      </div>

      {/* RENDERIZADO SEGÚN LA DISPOSICIÓN ELEGIDA */}
      {singleLayout === 'half-top' && (
        <div
          id={page.id}
          className="duo-print-sheet bg-white border border-slate-300 dark:border-slate-700 shadow-xs mx-auto my-3 print:my-0 print:border-none print:shadow-none transition-all flex flex-col justify-between overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '800px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            aspectRatio: metrics.aspectRatio,
            minHeight: `calc(800px * (${metrics.totalHeightMm} / ${metrics.totalWidthMm}))`,
            paddingTop: `${metrics.dynamicPaddingYMm}mm`,
            paddingBottom: `${metrics.dynamicPaddingYMm}mm`,
            paddingLeft: '4px',
            paddingRight: '4px',
            gap: `${metrics.dynamicGapMm}mm`,
            ['--duo-paper-height' as string]: `${metrics.totalHeightMm}mm`,
            ['--duo-paper-width' as string]: `${metrics.totalWidthMm}mm`,
            ['--duo-printable-height' as string]: `${metrics.printableHeightMm}mm`,
            ['--duo-half-height' as string]: `${metrics.halfHeightMm}mm`,
            ['--duo-dynamic-gap' as string]: `${metrics.dynamicGapMm}mm`,
            ['--duo-dynamic-padding-y' as string]: `${metrics.dynamicPaddingYMm}mm`,
            ['--duo-aspect-ratio' as string]: metrics.aspectRatio,
          }}
          data-papersize={paperConfig.id}
        >
          {/* Factura Superior (50% de la hoja) */}
          <div
            className="duo-half duo-half-top flex-1 flex flex-col justify-center items-stretch min-h-0 overflow-hidden"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <KudeDocument
              id={`${page.id}-top`}
              document={page.docTop}
              ecoMode={ecoMode}
              compact={true}
              targetItemRows={targetItemRows}
            />
          </div>

          {/* Línea de corte central para guillotina */}
          <div
            className="duo-cut-divider select-none relative flex items-center justify-center shrink-0 w-full"
            style={{
              margin: `${metrics.dynamicGapMm / 2}mm 0`,
            }}
          >
            <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-600 print:border-slate-400" />
          </div>

          {/* Mitad Inferior Limpia para Corte */}
          <div
            className="duo-half duo-half-bottom flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden text-slate-400 dark:text-slate-500"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <div className="no-print flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-[11px] font-medium">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>Mitad inferior libre para corte con guillotina ({paperConfig.shortLabel})</span>
            </div>
          </div>
        </div>
      )}

      {singleLayout === 'duplicate' && (
        <div
          id={page.id}
          className="duo-print-sheet bg-white border border-slate-300 dark:border-slate-700 shadow-xs mx-auto my-3 print:my-0 print:border-none print:shadow-none transition-all flex flex-col justify-between overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '800px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            aspectRatio: metrics.aspectRatio,
            minHeight: `calc(800px * (${metrics.totalHeightMm} / ${metrics.totalWidthMm}))`,
            paddingTop: `${metrics.dynamicPaddingYMm}mm`,
            paddingBottom: `${metrics.dynamicPaddingYMm}mm`,
            paddingLeft: '4px',
            paddingRight: '4px',
            gap: `${metrics.dynamicGapMm}mm`,
            ['--duo-paper-height' as string]: `${metrics.totalHeightMm}mm`,
            ['--duo-paper-width' as string]: `${metrics.totalWidthMm}mm`,
            ['--duo-printable-height' as string]: `${metrics.printableHeightMm}mm`,
            ['--duo-half-height' as string]: `${metrics.halfHeightMm}mm`,
            ['--duo-dynamic-gap' as string]: `${metrics.dynamicGapMm}mm`,
            ['--duo-dynamic-padding-y' as string]: `${metrics.dynamicPaddingYMm}mm`,
            ['--duo-aspect-ratio' as string]: metrics.aspectRatio,
          }}
          data-papersize={paperConfig.id}
        >
          {/* Factura Superior: ORIGINAL */}
          <div
            className="duo-half duo-half-top flex-1 flex flex-col justify-center items-stretch min-h-0 overflow-hidden"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <KudeDocument
              id={`${page.id}-top`}
              document={page.docTop}
              ecoMode={ecoMode}
              compact={true}
              targetItemRows={targetItemRows}
              copyTag="ORIGINAL"
            />
          </div>

          {/* Línea de corte central */}
          <div
            className="duo-cut-divider select-none relative flex items-center justify-center shrink-0 w-full"
            style={{
              margin: `${metrics.dynamicGapMm / 2}mm 0`,
            }}
          >
            <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-600 print:border-slate-400" />
          </div>

          {/* Factura Inferior: DUPLICADO */}
          <div
            className="duo-half duo-half-bottom flex-1 flex flex-col justify-center items-stretch min-h-0 overflow-hidden"
            style={{
              maxHeight: `${metrics.halfHeightMm}mm`,
              overflow: 'hidden',
            }}
          >
            <KudeDocument
              id={`${page.id}-bottom`}
              document={page.docTop}
              ecoMode={ecoMode}
              compact={true}
              targetItemRows={targetItemRows}
              copyTag="DUPLICADO"
            />
          </div>
        </div>
      )}

      {singleLayout === 'full' && (
        <div
          id={page.id}
          className="single-print-sheet bg-white border border-slate-300 dark:border-slate-700 shadow-xs mx-auto my-3 print:my-0 print:border-none print:shadow-none transition-all overflow-hidden flex flex-col justify-start"
          style={{
            width: '100%',
            maxWidth: '800px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pageBreakAfter: 'always',
            breakAfter: 'page',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
            padding: '8px 12px',
            aspectRatio: `${paperConfig.widthMm} / ${paperConfig.heightMm}`,
            minHeight: `calc(800px * (${paperConfig.heightMm} / ${paperConfig.widthMm}))`,
            ['--duo-paper-height' as string]: `${paperConfig.heightMm}mm`,
            ['--duo-paper-width' as string]: `${paperConfig.widthMm}mm`,
          }}
          data-papersize={paperConfig.id}
        >
          <div className="w-full">
            <KudeDocument
              id={`${page.id}-single`}
              document={page.docTop}
              ecoMode={ecoMode}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};


