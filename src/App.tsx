import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Leaf,
} from 'lucide-react';
import { KudeDocumentData } from './types/kude';
import { PaperSizeType, PAPER_SIZES } from './types/paper';
import { parseXmlToKude, parseXmlToKudeMultiple } from './utils/xmlParser';
import { exportKudeToPdf } from './utils/pdfExporter';
import { Navbar, ActiveTab } from './components/Navbar';
import { XmlUploader } from './components/XmlUploader';
import { KudeDocument } from './components/KudeDocument';
import { DataVisualizer } from './components/DataVisualizer';
import { KudeLiveEditor } from './components/KudeLiveEditor';
import { XmlViewer } from './components/XmlViewer';
import { DocumentList } from './components/DocumentList';
import { BatchDuoPrintManager } from './components/BatchDuoPrintManager';
import { PrintAssistantModal } from './components/PrintAssistantModal';
import {
  DuplicateConflictModal,
  DuplicateConflictItem,
} from './components/DuplicateConflictModal';

export default function App() {
  const [documents, setDocuments] = useState<KudeDocumentData[]>([]);
  const [originalXmlMap, setOriginalXmlMap] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('kude');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrintAssistantOpen, setIsPrintAssistantOpen] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<DuplicateConflictItem[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [ecoMode, setEcoMode] = useState<boolean>(true);
  const [paperSize, setPaperSize] = useState<PaperSizeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kude_paper_size');
      if (saved === 'oficio' || saved === 'a4' || saved === 'folio') return saved as PaperSizeType;
    }
    return 'oficio';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kude_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [statusNotification, setStatusNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Sync dark mode class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kude_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kude_dark_mode', 'false');
    }
  }, [darkMode]);

  // Sync print page size with CSS custom property for native browser printing and persist
  useEffect(() => {
    const config = PAPER_SIZES[paperSize] || PAPER_SIZES.oficio;
    document.documentElement.style.setProperty('--print-page-size', config.cssPageSize);
    localStorage.setItem('kude_paper_size', paperSize);
  }, [paperSize]);

  const activeDoc = documents.find((d) => d.id === selectedId) || documents[0] || null;

  const showNotification = (
    text: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 3500
  ) => {
    setStatusNotification({ text, type });
    setTimeout(() => {
      setStatusNotification((prev) => (prev?.text === text ? null : prev));
    }, duration);
  };

  // Handle uploaded XML files (single or batch) with duplicate CDC prompt
  const handleFilesLoaded = (files: { name: string; content: string }[]) => {
    const brandNewDocs: KudeDocumentData[] = [];
    const newXmlMap: Record<string, string> = { ...originalXmlMap };
    const conflicts: DuplicateConflictItem[] = [];

    // Mapeo de CDC a documento existente en el estado
    const existingCdcMap = new Map<string, KudeDocumentData>();
    for (const doc of documents) {
      if (doc.cdc && doc.cdc.trim()) {
        existingCdcMap.set(doc.cdc.trim(), doc);
      }
    }

    // Para controlar duplicados dentro del mismo lote entrante
    const batchSeenCdc = new Map<string, KudeDocumentData>();

    for (const f of files) {
      try {
        const parsedDocs = parseXmlToKudeMultiple(f.content, f.name);
        for (const parsed of parsedDocs) {
          // Guarantee unique internal React key / document id
          if (!parsed.id) {
            parsed.id = `kude-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          }
          const cdc = parsed.cdc ? parsed.cdc.trim() : '';

          // If CDC already exists in previously loaded session documents (and not in current upload batch)
          if (cdc && existingCdcMap.has(cdc) && files.length === 1) {
            const existing = existingCdcMap.get(cdc)!;
            conflicts.push({
              id: `conflict-${existing.id}-${parsed.id}-${Date.now()}-${Math.random()}`,
              existingDoc: existing,
              newDoc: parsed,
              newXmlContent: parsed.xmlRaw || f.content,
              newFileName: f.name,
            });
            continue;
          }

          // In batch selection, if same CDC appears again, assign a distinct clone ID so both are visible for printing
          if (cdc && batchSeenCdc.has(cdc)) {
            parsed.id = `${parsed.id}-dup-${Math.random().toString(36).substring(2, 5)}`;
          }

          if (cdc) {
            batchSeenCdc.set(cdc, parsed);
          }

          brandNewDocs.push(parsed);
          newXmlMap[parsed.id] = parsed.xmlRaw || f.content;
        }
      } catch (err) {
        console.error(`Error parseando ${f.name}:`, err);
      }
    }

    // 1. Incorporar todos los documentos nuevos procesados
    if (brandNewDocs.length > 0) {
      setDocuments((prev) => [...brandNewDocs, ...prev]);
      setOriginalXmlMap((prev) => ({ ...prev, ...newXmlMap }));
      setSelectedId(brandNewDocs[0].id);
    }

    // 2. Si se detectan conflictos de CDC, abrir automáticamente el diálogo para elegir 'Keep Old' o 'Update with New'
    if (conflicts.length > 0) {
      setPendingConflicts(conflicts);
      setIsConflictModalOpen(true);

      if (brandNewDocs.length > 0) {
        showNotification(
          `Se incorporaron ${brandNewDocs.length} factura(s). Se detectó CDC duplicado en ${conflicts.length} documento(s) — elige 'Conservar Actual' o 'Actualizar con Nuevo'.`,
          'info',
          6000
        );
      } else {
        showNotification(
          `CDC duplicado detectado: Elige si deseas 'Conservar Actual (Keep Old)' o 'Actualizar con el Nuevo (Update with New)'.`,
          'info',
          5000
        );
      }
    } else if (brandNewDocs.length > 0) {
      if (brandNewDocs.length >= 2) {
        setActiveTab('batch-duo');
        showNotification(
          `Se procesaron ${brandNewDocs.length} facturas. Se activó la vista "Impresión Dúo (2 por Hoja)".`,
          'success',
          5000
        );
      } else {
        showNotification(
          `Factura procesada con éxito: ${brandNewDocs[0].numeroCompleto || brandNewDocs[0].fileName}`,
          'success'
        );
      }
    } else {
      showNotification('No se pudieron extraer datos válidos del XML.', 'error');
    }
  };

  // Resuelve un conflicto individual conservando el documento actual (Keep Old)
  const handleKeepOldConflict = (conflictId: string) => {
    const item = pendingConflicts.find((c) => c.id === conflictId);
    const remaining = pendingConflicts.filter((c) => c.id !== conflictId);
    setPendingConflicts(remaining);
    if (remaining.length === 0) {
      setIsConflictModalOpen(false);
    }
    const num = item?.existingDoc.numeroCompleto || 'Factura';
    showNotification(`Se conservó la versión actual de ${num} (Keep Old). Archivo entrante descartado.`, 'info');
  };

  // Resuelve un conflicto individual actualizando con el nuevo archivo XML (Update with New)
  const handleUpdateWithNewConflict = (conflictId: string) => {
    const item = pendingConflicts.find((c) => c.id === conflictId);
    if (!item) return;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === item.existingDoc.id || (d.cdc && item.newDoc.cdc && d.cdc === item.newDoc.cdc)) {
          return {
            ...item.newDoc,
            id: d.id, // mantenemos el id para preservar estabilidad en la interfaz
          };
        }
        return d;
      })
    );

    setOriginalXmlMap((prev) => ({
      ...prev,
      [item.existingDoc.id]: item.newXmlContent,
      [item.newDoc.id]: item.newXmlContent,
    }));

    setSelectedId(item.existingDoc.id);

    const remaining = pendingConflicts.filter((c) => c.id !== conflictId);
    setPendingConflicts(remaining);
    if (remaining.length === 0) {
      setIsConflictModalOpen(false);
    }

    const num = item.newDoc.numeroCompleto || item.newFileName;
    showNotification(`Factura ${num} actualizada con los datos del nuevo archivo XML (Update with New).`, 'success');
  };

  // Conservar todos los documentos actuales (Keep All Old)
  const handleKeepAllOldConflicts = () => {
    setPendingConflicts([]);
    setIsConflictModalOpen(false);
    showNotification('Se conservaron todas las facturas existentes (Keep Old). Archivos entrantes descartados.', 'info');
  };

  // Actualizar todos los que tengan conflicto con sus nuevas versiones XML (Update All with New)
  const handleUpdateAllWithNewConflicts = () => {
    if (pendingConflicts.length === 0) return;

    const newXmls: Record<string, string> = {};
    const conflictMapByCdc = new Map<string, DuplicateConflictItem>();
    const conflictMapById = new Map<string, DuplicateConflictItem>();

    for (const c of pendingConflicts) {
      if (c.newDoc.cdc) {
        conflictMapByCdc.set(c.newDoc.cdc.trim(), c);
      }
      conflictMapById.set(c.existingDoc.id, c);
      newXmls[c.existingDoc.id] = c.newXmlContent;
      newXmls[c.newDoc.id] = c.newXmlContent;
    }

    setDocuments((prev) =>
      prev.map((d) => {
        const byId = conflictMapById.get(d.id);
        if (byId) {
          return { ...byId.newDoc, id: d.id };
        }
        if (d.cdc && conflictMapByCdc.has(d.cdc.trim())) {
          const byCdc = conflictMapByCdc.get(d.cdc.trim())!;
          return { ...byCdc.newDoc, id: d.id };
        }
        return d;
      })
    );

    setOriginalXmlMap((prev) => ({ ...prev, ...newXmls }));
    const count = pendingConflicts.length;
    setPendingConflicts([]);
    setIsConflictModalOpen(false);
    showNotification(`Se actualizaron ${count} factura(s) con las nuevas versiones XML (Update with New).`, 'success');
  };

  // Live document modification
  const handleUpdateActiveDoc = (updated: KudeDocumentData) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  // Reset to original XML
  const handleResetOriginal = () => {
    if (!activeDoc) return;
    const rawXml = originalXmlMap[activeDoc.id];
    if (rawXml) {
      const fresh = parseXmlToKude(rawXml, activeDoc.fileName);
      fresh.id = activeDoc.id; // preserve ID
      handleUpdateActiveDoc(fresh);
      showNotification('Documento restablecido a su XML original.', 'info');
    }
  };

  // Remove document from batch
  const handleRemoveDocument = (id: string) => {
    if (documents.length <= 1) return;
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
    showNotification('Documento eliminado de la sesión.', 'info');
  };

  // Trigger browser print or open Print Assistant
  const handlePrint = () => {
    if (!activeDoc && documents.length === 0) return;
    if (activeTab !== 'kude' && activeTab !== 'batch-duo') {
      setActiveTab(documents.length > 1 ? 'batch-duo' : 'kude');
    }

    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (isInIframe) {
      // Browsers restrict native print dialogs inside cross-origin/sandboxed iframes
      // Open the Print Assistant modal providing 1-click PDF download or open in new tab
      setIsPrintAssistantOpen(true);
      try {
        window.print();
      } catch {
        // Silently handled by modal
      }
    } else {
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.warn('Error al invocar window.print():', err);
          setIsPrintAssistantOpen(true);
        }
      }, 150);
    }
  };

  // Trigger PDF export
  const handleExportPdf = async () => {
    if (!activeDoc && documents.length === 0) return;

    let target: string | HTMLElement[] = 'kude-printable-sheet';
    let fileName = `KuDE_${activeDoc?.numeroCompleto || activeDoc?.timbradoNumero || 'documento'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    if (activeTab === 'batch-duo') {
      const duoSheets = Array.from(
        document.querySelectorAll('.duo-print-sheet, .single-print-sheet')
      ) as HTMLElement[];
      if (duoSheets.length > 0) {
        target = duoSheets;
        fileName = `KuDE_Lote_${documents.length}_facturas_${new Date().toISOString().slice(0, 10)}.pdf`;
      }
    }

    await exportKudeToPdf(target, {
      fileName,
      paperSize,
      onStart: () => setIsExportingPdf(true),
      onSuccess: () => {
        setIsExportingPdf(false);
        setIsPrintAssistantOpen(false);
        showNotification(`PDF descargado con éxito: ${fileName}`, 'success');
      },
      onError: (err) => {
        setIsExportingPdf(false);
        showNotification(`Error al exportar PDF: ${err.message}`, 'error');
      },
    });
  };

  // Export structured JSON
  const handleExportJson = () => {
    if (!activeDoc) return;
    const blob = new Blob([JSON.stringify(activeDoc, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KuDE_datos_${activeDoc.numeroCompleto}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Datos exportados a JSON.', 'success');
  };

  // Export CSV of items
  const handleExportCsv = () => {
    if (!activeDoc) return;
    const headers = [
      'Codigo',
      'Descripcion',
      'Unidad',
      'Cantidad',
      'PrecioUnitario',
      'Descuento',
      'TasaIVA',
      'TotalItem',
      'ValorExento',
      'ValorIVA5',
      'ValorIVA10',
    ];
    const rows = activeDoc.items.map((it) => [
      `"${it.codigo}"`,
      `"${it.descripcion.replace(/"/g, '""')}"`,
      `"${it.unidadMedida}"`,
      it.cantidad,
      it.precioUnitario,
      it.descuento,
      it.tasaIva,
      it.totalItem,
      it.valorExento,
      it.valorIva5,
      it.valorIva10,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Items_${activeDoc.numeroCompleto || 'kude'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Ítems exportados a CSV.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. TOP NAVBAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        isExportingPdf={isExportingPdf}
        activeDoc={activeDoc}
        docsCount={documents.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* 2. NOTIFICATION TOAST */}
      {statusNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold ${
              statusNotification.type === 'success'
                ? 'bg-emerald-800 text-white'
                : statusNotification.type === 'error'
                ? 'bg-rose-800 text-white'
                : 'bg-slate-900 dark:bg-slate-800 text-white'
            }`}
          >
            {statusNotification.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            )}
            {statusNotification.type === 'error' && (
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            )}
            {statusNotification.type === 'info' && (
              <Info className="w-4 h-4 text-blue-300" />
            )}
            <span>{statusNotification.text}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Upload Zone (Hidden in print) */}
        <div className="no-print">
          <XmlUploader onFilesLoaded={handleFilesLoaded} />
        </div>

        {/* Batch documents bar if multiple loaded */}
        <DocumentList
          documents={documents}
          selectedId={selectedId}
          onSelectDocument={setSelectedId}
          onRemoveDocument={handleRemoveDocument}
          onGoToBatchDuo={() => setActiveTab('batch-duo')}
        />

        {!activeDoc && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center max-w-md mx-auto shadow-2xs my-6 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              Esperando comprobante electrónico
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Carga tus archivos XML o pega el código XML en el panel superior para visualizar el formato KuDE oficial, optimizar la impresión dúo y exportar a PDF.
            </p>
          </div>
        )}

        {activeDoc && (
          <>
            {/* TAB 0: IMPRESIÓN DÚO (2 POR HOJA A4) */}
            {activeTab === 'batch-duo' && (
              <BatchDuoPrintManager
                documents={documents}
                ecoMode={ecoMode}
                paperSize={paperSize}
                onPaperSizeChange={setPaperSize}
                onEcoModeToggle={() => {
                  const next = !ecoMode;
                  setEcoMode(next);
                  showNotification(
                    next
                      ? 'Ahorro de Tinta activado para impresión dúo.'
                      : 'Modo Clásico activado.',
                    'info'
                  );
                }}
                onSelectDocument={(doc) => {
                  setSelectedId(doc.id);
                  setActiveTab('kude');
                }}
                onPrint={handlePrint}
                onExportPdf={handleExportPdf}
                isExportingPdf={isExportingPdf}
              />
            )}

            {/* TAB 1: KuDE GRÁFICO OFICIAL */}
            {activeTab === 'kude' && (
              <div className="space-y-4">
                {/* Secondary action toolbar above KuDE */}
                <div className="no-print bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Vista previa de KuDE
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {activeDoc.numeroCompleto} ({activeDoc.totales.moneda})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Selector de Papel */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">Papel:</span>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as PaperSizeType)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
                      >
                        <option value="a4">A4 (210 × 297 mm)</option>
                        <option value="oficio">8,5 × 13" u Oficio (216 × 330 mm)</option>
                        <option value="folio">Folio (215 × 315 mm)</option>
                      </select>
                    </div>

                    {/* Zoom controls */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => setZoomScale((s) => Math.max(0.7, s - 0.1))}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                        title="Reducir zoom"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomScale((s) => Math.min(1.3, s + 0.1))}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                        title="Aumentar zoom"
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

                    {/* Modo Ahorro de Tinta Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !ecoMode;
                        setEcoMode(next);
                        showNotification(
                          next
                            ? 'Ahorro de Tinta activado: Sin fondos oscuros ni sombreados pesados.'
                            : 'Modo Clásico activado.',
                          'info'
                        );
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors border ${
                        ecoMode
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 font-semibold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title="Ahorro de tinta para impresión: elimina fondos oscuros, barras negras y sombreados grises"
                    >
                      <Leaf className={`w-3.5 h-3.5 ${ecoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span>Ahorro de Tinta: {ecoMode ? 'Activado' : 'Desactivado'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-medium transition-colors"
                      title="Exportar tabla de ítems a formato CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                {/* Live interactive editor for real-time recalculation */}
                <KudeLiveEditor
                  document={activeDoc}
                  onUpdateDocument={handleUpdateActiveDoc}
                  onResetOriginal={handleResetOriginal}
                />

                {/* Printable Graphical KuDE Sheet */}
                <div className="overflow-x-auto pb-6 p-4 rounded-xl bg-slate-200/40 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 transition-colors">
                  <div
                    style={{
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <KudeDocument document={activeDoc} ecoMode={ecoMode} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VISUALIZACIÓN DE DATOS EN TIEMPO REAL */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Panel de Métricas y Análisis Fiscal en Tiempo Real
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cálculos automáticos de base imponible, tasas del IVA y concentración de ingresos
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kude')}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    Volver a ver KuDE →
                  </button>
                </div>

                <DataVisualizer
                  document={activeDoc}
                  allDocuments={documents}
                />

                {/* Real-time editor also accessible here for dynamic experimentation */}
                <KudeLiveEditor
                  document={activeDoc}
                  onUpdateDocument={handleUpdateActiveDoc}
                  onResetOriginal={handleResetOriginal}
                />
              </div>
            )}

            {/* TAB 3: XML FUENTE */}
            {activeTab === 'xml' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Visor del Código XML Original
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Estructura sintáctica del documento tributario electrónico
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                    >
                      Exportar JSON
                    </button>
                  </div>
                </div>

                <XmlViewer
                  xmlString={activeDoc.xmlRaw || originalXmlMap[activeDoc.id] || ''}
                  fileName={activeDoc.fileName}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. FOOTER (Hidden in print) */}
      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700 dark:text-slate-200">Visor KuDE &amp; Analizador XML</strong> — Compatible con SIFEN (DNIT / SET Paraguay), CFDI y UBL.
          </div>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
            <span>Parseo seguro del lado del cliente</span>
            <span>•</span>
            <span>Impresión directa A4</span>
            <span>•</span>
            <span>Exportación PDF de alta definición</span>
          </div>
        </div>
      </footer>

      {/* 5. PRINT ASSISTANT MODAL (Guidance & 1-Click Fallbacks for iFrame Sandbox) */}
      <PrintAssistantModal
        isOpen={isPrintAssistantOpen}
        onClose={() => setIsPrintAssistantOpen(false)}
        onDownloadPdf={handleExportPdf}
        onNativePrintRetry={() => {
          try {
            window.print();
          } catch (e) {
            console.warn(e);
          }
        }}
        isExportingPdf={isExportingPdf}
        activeTab={activeTab}
        paperSize={paperSize}
        onPaperSizeChange={setPaperSize}
        totalSheetsCount={
          activeTab === 'batch-duo'
            ? typeof document !== 'undefined'
              ? document.querySelectorAll('.duo-print-sheet').length || Math.ceil(documents.length / 2)
              : 1
            : 1
        }
      />

      {/* 6. DUPLICATE CDC CONFLICT MODAL */}
      <DuplicateConflictModal
        isOpen={isConflictModalOpen}
        conflicts={pendingConflicts}
        onKeepOld={handleKeepOldConflict}
        onUpdateWithNew={handleUpdateWithNewConflict}
        onKeepAllOld={handleKeepAllOldConflicts}
        onUpdateAllWithNew={handleUpdateAllWithNewConflicts}
        onClose={() => {
          setIsConflictModalOpen(false);
          setPendingConflicts([]);
        }}
      />
    </div>
  );
}
