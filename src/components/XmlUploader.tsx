import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCode2,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Files,
} from 'lucide-react';

interface XmlUploaderProps {
  onFilesLoaded: (files: { name: string; content: string }[]) => void;
  isLoading?: boolean;
}

export const XmlUploader: React.FC<XmlUploaderProps> = ({
  onFilesLoaded,
  isLoading = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const files = Array.from(fileList);
    const loadedFiles: { name: string; content: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        const trimmed = content.trim();
        // Permissive check: contains XML opening tag or name has .xml
        const hasXmlSignature = trimmed.includes('<') && trimmed.includes('>');
        const isXmlName = file.name.toLowerCase().endsWith('.xml');

        if (hasXmlSignature || isXmlName) {
          loadedFiles.push({ name: file.name, content: trimmed });
        }
      } catch (err) {
        console.error(`Error leyendo archivo ${file.name}:`, err);
      }
    }

    // Reset input value AFTER reading so identical or repeated files can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsProcessing(false);

    if (loadedFiles.length > 0) {
      setUploadNotice(null);
      onFilesLoaded(loadedFiles);
    } else {
      setUploadNotice('Por favor selecciona archivos con extensión .xml válidos.');
      setTimeout(() => setUploadNotice(null), 4000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Pass a detached array of files immediately
      processFiles(Array.from(e.target.files));
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setPasteError('El contenido XML no puede estar vacío.');
      return;
    }
    if (!pasteText.includes('<') || !pasteText.includes('>')) {
      setPasteError('El texto pegado no parece ser un documento XML válido.');
      return;
    }
    setPasteError('');
    onFilesLoaded([
      {
        name: 'xml_pegado.xml',
        content: pasteText.trim(),
      },
    ]);
    setShowPasteModal(false);
    setPasteText('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 transition-colors">
      {/* Hidden file input supporting multi-selection and uppercase .XML */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.XML,text/xml,application/xml"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {uploadNotice && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-lg font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{uploadNotice}</span>
        </div>
      )}

      {/* Main Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50/80 dark:bg-blue-950/50 scale-[1.008] shadow-sm'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
        }`}
      >
        <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
          {/* 1. Icon Container */}
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-700/60 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          {/* 2. Text Content */}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isProcessing
                ? 'Leyendo y procesando archivos XML seleccionados...'
                : 'Arrastra y suelta tus archivos XML de factura aquí'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center flex-wrap gap-1">
              <span>o haz clic para explorar en tu equipo</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-2">
                (selección por lote habilitada)
              </span>
            </p>
          </div>

          {/* 3. Badges / Feature Tags */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-1 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-md font-semibold shadow-2xs">
              <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>Carga por Lote (múltiples XML)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>SIFEN DTE Paraguay</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              <span>CFDI / UBL</span>
            </span>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
          <span>
            Formatos admitidos: Archivos{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
              .xml
            </code>{' '}
            individuales o múltiples comprobantes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Seleccionar uno o varios archivos XML de tu ordenador"
          >
            <Files className="w-3.5 h-3.5" />
            <span>Seleccionar varios archivos XML</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-2.5 py-1 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Pegar código XML</span>
          </button>
        </div>
      </div>

      {/* Manual XML Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pegar contenido de archivo XML
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pega aquí el código XML de tu factura electrónica SIFEN o DTE para
                procesarlo inmediatamente:
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="<?xml version='1.0' encoding='UTF-8'?>&#10;<rDE xmlns='http://ekuatia.set.gov.py/sifen/xsd'>&#10;  ...&#10;</rDE>"
                rows={10}
                className="w-full p-2.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {pasteError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pasteError}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-2xs"
              >
                Parsear y Generar KuDE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
