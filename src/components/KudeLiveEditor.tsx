import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Edit3,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { KudeDocumentData, KudeItem } from '../types/kude';
import { recalculateKude } from '../utils/xmlParser';

interface KudeLiveEditorProps {
  document: KudeDocumentData;
  onUpdateDocument: (updated: KudeDocumentData) => void;
  onResetOriginal?: () => void;
}

export const KudeLiveEditor: React.FC<KudeLiveEditorProps> = ({
  document: doc,
  onUpdateDocument,
  onResetOriginal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 3000);
  };

  const handleItemChange = (
    itemId: string,
    field: keyof KudeItem,
    value: any
  ) => {
    const updatedItems = doc.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          [field]: value,
        };
      }
      return it;
    });

    const recalculated = recalculateKude({
      ...doc,
      items: updatedItems,
    });
    onUpdateDocument(recalculated);
  };

  const handleAddItem = () => {
    const isGuarani = doc.totales.moneda === 'PYG';
    const newItem: KudeItem = {
      id: `new-${Date.now()}`,
      codigo: `ITM-${doc.items.length + 1}`,
      descripcion: 'Nuevo Producto / Servicio',
      unidadMedida: 'UNI',
      cantidad: 1,
      precioUnitario: isGuarani ? 100000 : 25,
      descuento: 0,
      tasaIva: 10,
      totalItem: isGuarani ? 100000 : 25,
      valorExento: 0,
      valorIva5: 0,
      valorIva10: isGuarani ? 100000 : 25,
      baseGravada5: 0,
      baseGravada10: isGuarani ? 90909 : 22.73,
      liquidacionIva5: 0,
      liquidacionIva10: isGuarani ? 9091 : 2.27,
    };

    const recalculated = recalculateKude({
      ...doc,
      items: [...doc.items, newItem],
    });
    onUpdateDocument(recalculated);
  };

  const handleRemoveItem = (itemId: string) => {
    if (doc.items.length <= 1) {
      triggerWarning('El documento debe contener al menos 1 ítem.');
      return;
    }
    const filtered = doc.items.filter((it) => it.id !== itemId);
    const recalculated = recalculateKude({
      ...doc,
      items: filtered,
    });
    onUpdateDocument(recalculated);
  };

  const handleHeaderChange = (field: string, subField: string, value: string) => {
    let updated: any = { ...doc };
    if (field === 'receptor') {
      updated.receptor = { ...doc.receptor, [subField]: value };
    } else if (field === 'emisor') {
      updated.emisor = { ...doc.emisor, [subField]: value };
    } else if (field === 'general') {
      updated[subField] = value;
    }
    onUpdateDocument(recalculateKude(updated));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden no-print transition-colors">
      {/* Toggle header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Simulador y Editor Dinámico en Tiempo Real
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
            Recalcula KuDE en vivo
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onResetOriginal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResetOriginal();
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded transition-colors"
              title="Restaurar valores originales del XML"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer XML</span>
            </button>
          )}
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {isOpen ? 'Ocultar controles ▲' : 'Modificar valores ▼'}
          </span>
        </div>
      </div>

      {/* Editor Body */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {warningMessage && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-md font-medium flex items-center justify-between">
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Quick Receptor info editing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razón Social Receptor
              </label>
              <input
                type="text"
                value={doc.receptor.razonSocial}
                onChange={(e) =>
                  handleHeaderChange('receptor', 'razonSocial', e.target.value)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                RUC / Doc Receptor
              </label>
              <input
                type="text"
                value={doc.receptor.ruc}
                onChange={(e) =>
                  handleHeaderChange('receptor', 'ruc', e.target.value)
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condición de Venta
              </label>
              <select
                value={doc.condicionVenta}
                onChange={(e) =>
                  handleHeaderChange(
                    'general',
                    'condicionVenta',
                    e.target.value as 'Contado' | 'Crédito'
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>

          {/* Items Editor Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Líneas de Detalle / Ítems ({doc.items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Ítem</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    <th className="p-2 w-20">Cód.</th>
                    <th className="p-2">Descripción</th>
                    <th className="p-2 w-16 text-center">Cant.</th>
                    <th className="p-2 w-28 text-right">P. Unitario</th>
                    <th className="p-2 w-20 text-right">Desc.</th>
                    <th className="p-2 w-24 text-center">Tasa IVA</th>
                    <th className="p-2 w-24 text-right">Total Ítem</th>
                    <th className="p-2 w-10 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {doc.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.codigo}
                          onChange={(e) =>
                            handleItemChange(item.id, 'codigo', e.target.value)
                          }
                          className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'descripcion',
                              e.target.value
                            )
                          }
                          className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'cantidad',
                              parseFloat(e.target.value) || 1
                            )
                          }
                          className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-center font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.precioUnitario}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'precioUnitario',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.descuento}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'descuento',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-1.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-right font-mono text-slate-600 dark:text-slate-400"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <select
                          value={item.tasaIva}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'tasaIva',
                              parseInt(e.target.value, 10) as 0 | 5 | 10
                            )
                          }
                          className="w-full px-1 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded text-center font-medium"
                        >
                          <option value="10">IVA 10%</option>
                          <option value="5">IVA 5%</option>
                          <option value="0">Exenta (0%)</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {item.totalItem.toLocaleString('es-PY')}
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
