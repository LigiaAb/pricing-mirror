import { safeString } from "@/shared/lib/text";
import type {
  AnyRecord,
  EntityBoxParams,
  FieldParams,
  MeasureParams,
  PdfParams,
  SectionTitleParams,
} from "./pdf-info-types";

/** Labels canónicos de los documentos que elabora CROPA (delta Legacy 2026-07-16). */
const CROPA_DOC_LABELS: Record<string, string> = {
  deprex: "DEPREX",
  duca_complementaria: "DUCA Complementaria",
  duca_definitiva: "DUCA Definitiva",
  duca_simplificada: "DUCA Simplificada",
  otros: "Otros",
};

export interface DocumentGroup {
  title: string;
  items: string[];
}

/**
 * Grupos de la sección "Documentos" del PDF: "CROPA" (checkboxes marcados en
 * Detalles, con label canónico) y "Cliente" (Hoja de Seguridad si la carga es
 * peligrosa, Factura Cobertura Seguro si la cobertura está activa).
 */
export const buildDocumentGroups = (formData: AnyRecord): DocumentGroup[] => {
  const documentosCropa = (formData.documentosCropa as Record<string, unknown>) || {};
  const cropaItems = Object.entries(documentosCropa)
    .filter(([, value]) => value === true || String(value).toLowerCase() === "true")
    .map(([key]) => CROPA_DOC_LABELS[key] || key.replaceAll("_", " "));

  const peligrosidad =
    formData.peligrosidad === true || String(formData.peligrosidadLabel).toLowerCase() === "sí";
  const coberturaSeguro =
    formData.coberturaSeguro === true ||
    String(formData.coberturaSeguroLabel).toLowerCase() === "sí";

  const clienteItems: string[] = [];
  if (peligrosidad) clienteItems.push("Hoja de Seguridad");
  if (coberturaSeguro) clienteItems.push("Factura Cobertura Seguro");

  const groups: DocumentGroup[] = [];
  if (cropaItems.length) groups.push({ title: "CROPA", items: cropaItems });
  if (clienteItems.length) groups.push({ title: "Cliente", items: clienteItems });

  return groups;
};

/** "2026-07-18" / "2026-07-18T10:00:00" → "18 07 2026"; otros valores tal cual. */
export const formatFechaRecoleccion = (rawFecha: string): string => {
  if (!rawFecha || rawFecha === "N/A") return "N/A";
  const parts = rawFecha.includes("T")
    ? (rawFecha.split("T")[0] ?? "").split("-")
    : rawFecha.split("-");
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd} ${mm} ${yyyy}`;
  }
  return rawFecha;
};

/**
 * Modo de transporte como dato del payload (no despacha a generadores
 * distintos — el legacy unificó sus variantes de PDF).
 */
export const detectTransportMode = (raw: unknown): "aereo" | "maritimo" | "terrestre" => {
  const texto = safeString(raw, "aereo").toLowerCase();
  if (texto.includes("marit")) return "maritimo";
  if (texto.includes("terrest") || texto.includes("road")) return "terrestre";
  return "aereo";
};

export const checkNewPage = ({
  doc,
  currentY,
  requiredSpace,
  pageHeight,
  margins,
}: PdfParams): number => {
  if (currentY + requiredSpace > pageHeight - margins.bottom) {
    doc.addPage();
    return margins.top;
  }
  return currentY;
};

export const drawSectionTitle = ({
  doc,
  title,
  y,
  margins,
  contentWidth,
  pageHeight,
  primaryColor,
}: SectionTitleParams): number => {
  y = checkNewPage({ doc, currentY: y, requiredSpace: 15, pageHeight, margins });
  doc.setFillColor(...primaryColor);
  doc.rect(margins.left, y, contentWidth, 7, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), margins.left + 3, y + 5);

  return y + 11;
};

export const drawField = ({
  doc,
  label,
  value,
  x,
  y,
  width,
  secondaryColor,
}: FieldParams): number => {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...secondaryColor);
  doc.text(`${label}:`, x, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const textValue = safeString(value, "N/A");
  const splitText = doc.splitTextToSize(textValue, width - 2);
  doc.text(splitText, x, y + 4);

  return y + 4 + splitText.length * 3.5;
};

export const measureField = ({ doc, value, width, startY }: MeasureParams): number => {
  const textValue = safeString(value, "N/A");
  const splitText = doc.splitTextToSize(textValue, width - 2);
  return startY + 4 + splitText.length * 3.5;
};

/**
 * Altura que necesitaría la caja sin dibujar nada: permite que Shipper y
 * Consignatario compartan una altura uniforme.
 */
export const measureEntityBoxHeight = ({
  doc,
  data,
  width,
}: {
  doc: EntityBoxParams["doc"];
  data: Record<string, string>;
  width: number;
}): number => {
  const innerWidth = width - 6;
  const colWidth = innerWidth / 2;
  let tempY = 12;

  tempY = measureField({ doc, value: data.nombre, width: innerWidth, startY: tempY });
  tempY = measureField({ doc, value: data.nit, width: innerWidth, startY: tempY });
  tempY = measureField({ doc, value: data.direccion, width: innerWidth, startY: tempY });

  const contactY = tempY;
  const afterContacto = measureField({
    doc,
    value: data.contacto,
    width: colWidth,
    startY: contactY,
  });
  const afterTelefono = measureField({
    doc,
    value: data.telefono,
    width: colWidth,
    startY: contactY,
  });
  tempY = Math.max(afterContacto, afterTelefono);

  tempY += 8;
  tempY = measureField({ doc, value: data.email, width: innerWidth, startY: tempY });

  const reduction = 3 * 3.5;
  const minHeight = 45 - reduction;
  return Math.max(minHeight, tempY + 5 - reduction);
};

export const drawEntityBox = ({
  doc,
  title,
  data,
  x,
  y,
  width,
  margins,
  pageHeight,
  lightGray,
  primaryColor,
  secondaryColor,
  forcedHeight = null,
}: EntityBoxParams): number => {
  const innerWidth = width - 6;
  const colWidth = innerWidth / 2;
  const naturalHeight = measureEntityBoxHeight({ doc, data, width });
  const boxHeight = forcedHeight != null ? Math.max(forcedHeight, naturalHeight) : naturalHeight;

  y = checkNewPage({ doc, currentY: y, requiredSpace: boxHeight + 5, pageHeight, margins });

  doc.setFillColor(...lightGray);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, boxHeight, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(title, x + 3, y + 5);

  doc.setDrawColor(220, 220, 220);
  doc.line(x + 2, y + 7, x + width - 2, y + 7);

  let currentY = y + 12;
  const innerX = x + 3;

  currentY = drawField({
    doc,
    label: "Nombre",
    value: data.nombre,
    x: innerX,
    y: currentY,
    width: innerWidth,
    secondaryColor,
  });
  currentY = drawField({
    doc,
    label: "NIT:",
    value: data.nit,
    x: innerX,
    y: currentY,
    width: innerWidth,
    secondaryColor,
  });
  currentY = drawField({
    doc,
    label: "Dirección",
    value: data.direccion,
    x: innerX,
    y: currentY,
    width: innerWidth,
    secondaryColor,
  });

  const drawContactY = currentY;
  const drawnAfterContacto = drawField({
    doc,
    label: "Contacto",
    value: data.contacto,
    x: innerX,
    y: drawContactY,
    width: colWidth,
    secondaryColor,
  });
  const drawnAfterTelefono = drawField({
    doc,
    label: "Teléfono",
    value: data.telefono,
    x: innerX + colWidth,
    y: drawContactY,
    width: colWidth,
    secondaryColor,
  });

  // Los datos de contacto se distribuyen en dos columnas y cualquiera puede
  // ocupar varias líneas. El email debe empezar tras la columna más alta;
  // usar una posición fija hacía que se superpusiera sobre contactos largos.
  currentY = Math.max(drawnAfterContacto, drawnAfterTelefono) + 0.5;
  drawField({
    doc,
    label: "Email",
    value: data.email,
    x: innerX,
    y: currentY,
    width: innerWidth,
    secondaryColor,
  });

  return y + boxHeight + 5;
};
