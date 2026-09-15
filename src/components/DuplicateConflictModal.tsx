import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Copy,
  FileCode,
  FileText,
  HelpCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { KudeDocumentData } from '../types/kude';

export interface DuplicateConflictItem {
  id: string; // unique conflict id
  existingDoc: KudeDocumentData;
  newDoc: KudeDocumentData;
  newXmlContent: string;
  newFileName: string;
}

interface DuplicateConflictModalProps {
  isOpen: boolean;
  conflicts: DuplicateConflictItem[];
  onKeepOld: (conflictId: string) => void;
  onUpdateWithNew: (conflictId: string) => void;
  onKeepAllOld: () => void;
  onUpdateAllWithNew: () => void;
  onClose: () => void;
}

export const DuplicateConflictModal: React.FC<DuplicateConflictModalProps> = ({
  isOpen,
  conflicts,
  onKeepOld,
  onUpdateWithNew,
  onKeepAllOld,
  onUpdateAllWithNew,
  onClose,
}) => {
  const [copiedCdc, setCopiedCdc] = useState<string | null>(null);

  if (!isOpen || conflicts.length === 0) return null;

  const handleCopyCdc = (cdc: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cdc);
      setCopiedCdc(cdc);
      setTimeout(() => setCopiedCdc(null), 2000);
    }
  };

  const formatCurrency = (val: number, moneda: string) => {
    const sym = moneda === 'PYG' ? '₲' : moneda === 'USD' ? 'US$' : '$';
    const formatted = moneda === 'PYG'
      ? Math.round(val || 0).toLocaleString('es-PY')
      : (val || 0).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${sym} ${formatted}`;
  };

  return (
    <div
      id="duplicate-conflict-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div
        id="duplicate-conflict-modal-card"
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2
                id="conflict-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"
              >
                <span>Código de Control (CDC) Duplicado Detectado</span>
                <span className="text-xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold px-2 py-0.5 rounded-full">
                  {conflicts.length} {conflicts.length === 1 ? 'conflicto' : 'conflictos'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                El comprobante XML entrante posee el mismo CDC que una factura ya cargada. ¿Deseas conservar la versión actual o actualizar con la nueva?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: list of conflicts */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {conflicts.map((conflict, idx) => {
            const { existingDoc, newDoc } = conflict;
            const cdc = existingDoc.cdc || newDoc.cdc || '';

            return (
              <div key={conflict.id} className={idx > 0 ? 'pt-5' : ''}>
                {/* CDC Badge */}
                <div className="mb-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                      CDC (Identificador Único SIFEN)
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 break-all select-all">
                      {cdc || 'Sin CDC'}
                    </span>
                  </div>
                  {cdc && (
                    <button
                      type="button"
                      onClick={() => handleCopyCdc(cdc)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
                      title="Copiar CDC"
                    >
                      {copiedCdc === cdc ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Side by Side comparison: Old vs New */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {/* EXISTING / OLD */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Factura Actual en Sesión (Old)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        Cargada previamente
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Número / Timbrado:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {existingDoc.numeroCompleto || 'S/N'}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">
                          (Timb: {existingDoc.timbradoNumero})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Emisor:</span>
                        <span className="text-slate-800 dark:text-slate-200 line-clamp-1 font-medium" title={existingDoc.emisor?.razonSocial}>
                          {existingDoc.emisor?.razonSocial || 'No especificado'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Total a Pagar:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(existingDoc.totales?.totalPagar, existingDoc.totales?.moneda || 'PYG')}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({existingDoc.items?.length || 0} ítems)
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{existingDoc.fileName}</span>
                      </div>
                    </div>
                  </div>

                  {/* INCOMING / NEW */}
                  <div className="border border-blue-200 dark:border-blue-800/80 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        Archivo XML Entrante (New)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                        Nuevo
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Número / Timbrado:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {newDoc.numeroCompleto || 'S/N'}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">
                          (Timb: {newDoc.timbradoNumero})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Emisor:</span>
                        <span className="text-slate-800 dark:text-slate-200 line-clamp-1 font-medium" title={newDoc.emisor?.razonSocial}>
                          {newDoc.emisor?.razonSocial || 'No especificado'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Total a Pagar:</span>
                        <span className="font-bold text-blue-900 dark:text-blue-300">
                          {formatCurrency(newDoc.totales?.totalPagar, newDoc.totales?.moneda || 'PYG')}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({newDoc.items?.length || 0} ítems)
                        </span>
                      </div>

                      <div className="pt-1 border-t border-blue-100 dark:border-blue-900/60 text-[10px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{conflict.newFileName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conflict specific actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onKeepOld(conflict.id)}
                    className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Conservar Actual (Keep Old)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateWithNew(conflict.id)}
                    className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualizar con el Nuevo (Update with New)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Batch Actions if more than 1 conflict */}
        <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Actualizar reemplaza los datos y XML del documento; Conservar descarta el archivo entrante.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {conflicts.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={onKeepAllOld}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition"
                >
                  Conservar Todos los Actuales
                </button>
                <button
                  type="button"
                  onClick={onUpdateAllWithNew}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-md transition"
                >
                  Actualizar Todos con los Nuevos
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
