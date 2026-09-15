import React, { useState } from 'react';
import { Copy, Check, Download, Search, FileCode } from 'lucide-react';

interface XmlViewerProps {
  xmlString: string;
  fileName: string;
}

export const XmlViewer: React.FC<XmlViewerProps> = ({ xmlString, fileName }) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.xml') ? fileName : `${fileName}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = xmlString.split('\n');
  const filteredIndices = search.trim()
    ? lines
        .map((line, idx) =>
          line.toLowerCase().includes(search.toLowerCase()) ? idx : -1
        )
        .filter((idx) => idx !== -1)
    : [];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[680px]">
      {/* Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="font-mono font-semibold text-slate-300">
            {fileName}
          </span>
          <span className="text-[10px] text-slate-500">
            ({lines.length} líneas, {(xmlString.length / 1024).toFixed(1)} KB)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tag o texto..."
              className="pl-7 pr-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar XML</span>
          </button>
        </div>
      </div>

      {/* Code viewer with line numbers */}
      <div className="flex-1 overflow-auto font-mono text-xs p-3 leading-relaxed select-text">
        <pre className="text-slate-300">
          {lines.map((line, idx) => {
            const isMatch =
              search.trim() &&
              line.toLowerCase().includes(search.toLowerCase());
            return (
              <div
                key={idx}
                className={`flex hover:bg-slate-800/60 px-1 py-0.5 rounded ${
                  isMatch ? 'bg-amber-950/60 text-amber-200 font-semibold' : ''
                }`}
              >
                <span className="w-12 shrink-0 text-slate-600 select-none text-right pr-3">
                  {idx + 1}
                </span>
                <span className="break-all whitespace-pre-wrap">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};
