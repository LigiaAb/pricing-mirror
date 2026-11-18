import { useState } from "react";

/**
 * Función nativa para descargar archivos
 */
function nativeSaveAs(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Hook para cargar ExcelJS dinámicamente cuando se necesita exportar a Excel
 * Reduce el bundle inicial al cargar ~750KB solo cuando es necesario
 */
export function useExcelJS() {
  const [isLoading, setIsLoading] = useState(false);

  const loadExcelJS = async () => {
    setIsLoading(true);
    try {
      const ExcelJS = await import("exceljs");
      return { ExcelJS, saveAs: nativeSaveAs };
    } finally {
      setIsLoading(false);
    }
  };

  return { loadExcelJS, isLoading };
}

/**
 * Hook para cargar jsPDF y jspdf-autotable dinámicamente cuando se necesita generar PDFs
 * Reduce el bundle inicial al cargar ~450KB solo cuando es necesario
 */
export function useJsPDF() {
  const [isLoading, setIsLoading] = useState(false);

  const loadJsPDF = async () => {
    setIsLoading(true);
    try {
      const jsPDFModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");

      const jsPDF = jsPDFModule.default || jsPDFModule;
      const autoTable = autoTableModule.default || autoTableModule;

      return { jsPDF, autoTable };
    } finally {
      setIsLoading(false);
    }
  };

  return { loadJsPDF, isLoading };
}
