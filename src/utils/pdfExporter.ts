import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { PaperSizeType, PAPER_SIZES } from '../types/paper';

export interface ExportPdfOptions {
  fileName?: string;
  paperSize?: PaperSizeType;
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export async function exportKudeToPdf(
  target: string | string[] | HTMLElement | HTMLElement[],
  options: ExportPdfOptions = {}
): Promise<void> {
  try {
    options.onStart?.();

    // Resolve target elements
    let elements: HTMLElement[] = [];

    if (Array.isArray(target)) {
      for (const item of target) {
        if (typeof item === 'string') {
          const el = document.getElementById(item);
          if (el) elements.push(el);
        } else if (item instanceof HTMLElement) {
          elements.push(item);
        }
      }
    } else if (typeof target === 'string') {
      const el = document.getElementById(target);
      if (el) {
        elements.push(el);
      } else {
        // Try selector fallback if id wasn't found directly
        const queryEl = document.querySelector(target) as HTMLElement | null;
        if (queryEl) {
          elements.push(queryEl);
        }
      }
    } else if (target instanceof HTMLElement) {
      elements.push(target);
    }

    // Fallback: If target was for batch duo but specific element wasn't resolved, query all duo print sheets
    if (elements.length === 0) {
      const duoSheets = Array.from(document.querySelectorAll('.duo-print-sheet')) as HTMLElement[];
      if (duoSheets.length > 0) {
        elements = duoSheets;
      } else {
        const kudeSheet = document.getElementById('kude-printable-sheet');
        if (kudeSheet) {
          elements = [kudeSheet];
        }
      }
    }

    if (elements.length === 0) {
      throw new Error(`No se encontró el documento a exportar.`);
    }

    // Paper dimensions in mm according to selected paper size (A4, Oficio 8.5x13", Folio)
    const paperKey = options.paperSize || 'a4';
    const paperConfig = PAPER_SIZES[paperKey] || PAPER_SIZES.a4;
    const pdfWidth = paperConfig.widthMm;
    const pdfHeight = paperConfig.heightMm;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Scroll into view smoothly
      element.scrollIntoView({ behavior: 'instant', block: 'start' });

      // Render with high resolution
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        onclone: (clonedDoc) => {
          const noPrintEls = clonedDoc.querySelectorAll('.no-print');
          noPrintEls.forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
          const allSheets = clonedDoc.querySelectorAll('.duo-print-sheet, #kude-printable-sheet');
          allSheets.forEach((s) => {
            (s as HTMLElement).style.boxShadow = 'none';
            (s as HTMLElement).style.margin = '0';
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      // Margen superior e inferior limpio (4mm) para evitar el espacio vacío gigante hacia arriba
      const topMarginMm = 4;
      const sideMarginMm = 4;
      const availableWidth = pdfWidth - (sideMarginMm * 2);
      const availableHeight = pdfHeight - (topMarginMm * 2);

      const rawImgHeight = (canvas.height * availableWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], 'portrait');
      }

      if (rawImgHeight <= availableHeight * 1.05) {
        const scale = rawImgHeight > availableHeight ? availableHeight / rawImgHeight : 1;
        const finalWidth = availableWidth * scale;
        const finalHeight = rawImgHeight * scale;
        const xOffset = (pdfWidth - finalWidth) / 2;
        // Para hojas duo, centrado simétrico completo en el PDF para que la línea de corte quede al 50%
        const isDuo = element.classList.contains('duo-print-sheet');
        const yOffset = isDuo ? Math.max(topMarginMm, (pdfHeight - finalHeight) / 2) : topMarginMm;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      } else {
        // Multi-page logic for long single items
        const fullImgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = fullImgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, fullImgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 12) {
          position = heightLeft - fullImgHeight;
          pdf.addPage([pdfWidth, pdfHeight], 'portrait');
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, fullImgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      }
    }

    const defaultFileName = `KuDE_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(options.fileName || defaultFileName);

    options.onSuccess?.();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}


