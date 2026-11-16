import { asText } from "@/shared/lib/text";
import { type DatosPdf, MAX_BARCODE_LENGTH } from "./pdf-awb-types";

export const sanitizeBarcodeValue = (rawValue: unknown): string => {
  if (rawValue === undefined || rawValue === null) {
    return "";
  }
  const stringified = asText(rawValue).toUpperCase();
  const filtered = stringified.replaceAll(/[^0-9A-Z\-.$+% /]/g, "").trim();
  if (!filtered) {
    return "";
  }
  return filtered.slice(0, MAX_BARCODE_LENGTH);
};

export const formatDateForPdf = (value: unknown): string => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(asText(value));
  if (Number.isNaN(date.getTime())) {
    return asText(value);
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()] || "";
  const year = date.getFullYear();

  return `${month} ${day} ${year}`;
};

export const resolveBarcodeValue = (datos: DatosPdf = {}): string => {
  const candidates = [datos.mawbNumber, datos.guiaMaster, datos.correlativoGuiaMaster];

  for (const candidate of candidates) {
    const sanitized = sanitizeBarcodeValue(candidate);
    if (sanitized) {
      return sanitized;
    }
  }
  return "";
};

export function parseToNumber(value: unknown): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = asText(value).replaceAll(",", "").trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

export const formatNumber = (value: unknown): string => {
  const num = parseToNumber(value);
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};
