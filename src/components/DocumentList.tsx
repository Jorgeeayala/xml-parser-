import React from 'react';
import { FileText, CheckCircle, Trash2, Layers } from 'lucide-react';
import { KudeDocumentData } from '../types/kude';

interface DocumentListProps {
  documents: KudeDocumentData[];
  selectedId: string;
  onSelectDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  onGoToBatchDuo?: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedId,
  onSelectDocument,
  onRemoveDocument,
  onGoToBatchDuo,
}) => {
  if (documents.length <= 1) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs no-print transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Lote de Documentos Cargados ({documents.length})</span>
          </div>

          {onGoToBatchDuo && (
            <button
              type="button"
              onClick={onGoToBatchDuo}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold rounded-full transition-colors"
              title="Optimizar e imprimir 2 facturas por hoja A4"
            >
              ✂ Ahorrar papel: Ver Impresión Dúo (2 por Hoja)
            </button>
          )}
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
          Haz clic en cualquiera para visualizar su KuDE
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {documents.map((doc) => {
          const isSelected = doc.id === selectedId;
          const isGuarani = doc.totales.moneda === 'PYG';
          const symbol = isGuarani ? '₲' : '$';

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer shrink-0 transition-all ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 shadow-2xs text-blue-950 dark:text-blue-100'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <FileText
                className={`w-4 h-4 shrink-0 ${
                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                }`}
              />

              <div className="text-left">
                <div className="text-xs font-bold truncate max-w-[140px]">
                  {doc.numeroCompleto || doc.fileName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {doc.receptor.razonSocial || doc.emisor.razonSocial}
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {symbol}{' '}
                  {isGuarani
                    ? Math.round(doc.totales.totalPagar).toLocaleString('es-PY')
                    : doc.totales.totalPagar.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                </div>
              </div>

              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDocument(doc.id);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                  title="Quitar este documento del lote"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
