import {
  BookOpen,
  CalendarDays,
  CarFront,
  CircleCheck,
  CircleX,
  Folder,
  type LucideIcon,
  Mail,
  Package,
  PackageCheck,
  Phone,
} from "lucide-react";

const ICONOS_POR_TIPO: Record<string, LucideIcon> = {
  CORREO: Mail,
  LLAMADA: Phone,
  VISITA: CarFront,
  "SALES LEAD": Package,
  SL: Package,
  "CALENDARIZAR COTIZACION": CalendarDays,
  "CALENDARIZAR CTS": CalendarDays,
  "SEGUIMIENTO COTIZACION": CalendarDays,
  "SEGUIMIENTO CTS": CalendarDays,
  "COTIZACION REALIZADA": PackageCheck,
  COT: PackageCheck,
  "CTS REALIZADO": PackageCheck,
  CTS: BookOpen,
  "FILE REALIZADO": Folder,
  "FINALIZAR SIN RESULTADOS": CircleX,
  "CONFIRMAR COTIZACION": CircleCheck,
};

const ICONOS_LEGACY: Record<string, LucideIcon> = {
  "c-mail": Mail,
  "c-telefono": Phone,
  "c-carro": CarFront,
  "c-entregar": Package,
  "c-calendario-agenda": CalendarDays,
  "c-calendario1": CalendarDays,
  "c-tarifa": PackageCheck,
  "c-cuaderno": BookOpen,
  "c-carpeta": Folder,
  "c-circulo-x": CircleX,
  "c-circulo-cheque": CircleCheck,
};

/** Resuelve los íconos históricos sin acoplar la UI al set de fuentes legacy. */
export function iconoActividad(nombre: string, iconoLegacy?: string | null): LucideIcon {
  return (
    (iconoLegacy ? ICONOS_LEGACY[iconoLegacy] : undefined) ??
    ICONOS_POR_TIPO[nombre.trim().toUpperCase()] ??
    CalendarDays
  );
}
