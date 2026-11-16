import type jsPDF from "jspdf";

export type AnyRecord = Record<string, unknown>;

export interface PdfParams {
  doc: jsPDF;
  currentY: number;
  requiredSpace: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

export interface FieldParams {
  doc: jsPDF;
  label: string;
  value: unknown;
  x: number;
  y: number;
  width: number;
  secondaryColor: [number, number, number];
}

export interface MeasureParams {
  doc: jsPDF;
  value: unknown;
  width: number;
  startY: number;
}

export interface EntityBoxParams {
  doc: jsPDF;
  title: string;
  data: Record<string, string>;
  x: number;
  y: number;
  width: number;
  margins: { top: number; right: number; bottom: number; left: number };
  pageHeight: number;
  lightGray: [number, number, number];
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  /** Altura común de Shipper/Consignatario para que el par se vea parejo. */
  forcedHeight?: number | null;
}

export interface HeaderParams {
  doc: jsPDF;
  formData: AnyRecord;
  margins: { top: number; right: number; bottom: number; left: number };
  pageWidth: number;
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
}

export interface SectionTitleParams {
  doc: jsPDF;
  title: string;
  y: number;
  margins: { top: number; right: number; bottom: number; left: number };
  contentWidth: number;
  pageHeight: number;
  primaryColor: [number, number, number];
}

export interface DocumentosCropaParams {
  doc: jsPDF;
  formData: AnyRecord;
  yPos: number;
  margins: { top: number; right: number; bottom: number; left: number };
  contentWidth: number;
  pageHeight: number;
  secondaryColor: [number, number, number];
}

export interface ItemsTableParams {
  doc: jsPDF;
  formData: AnyRecord;
  margins: { top: number; right: number; bottom: number; left: number };
  contentWidth: number;
  primaryColor: [number, number, number];
  yPos: number;
}

export interface PiePaginaParams {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  secondaryColor: [number, number, number];
}

export interface WatermarkParams {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
}
