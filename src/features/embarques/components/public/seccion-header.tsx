"use client";

/**
 * Encabezado por sección del wizard de embarques (patrón ModernFormHeader del
 * legacy, D.7): resuelve icono y subtítulo según el título del paso y delega el
 * render en el primitivo compartido, para que el detalle CTS y el de gestión de
 * embarques compartan exactamente el mismo diseño.
 */

import {
  CalendarDays,
  FileText,
  Info,
  type LucideIcon,
  PackageCheck,
  Route,
  Truck,
  UserRound,
} from "lucide-react";
import { SeccionHeader as SeccionHeaderBase } from "@/shared/components/seccion-header";

const SECCION_META: Record<string, { icon: LucideIcon; subtitle: string }> = {
  Shipper: { icon: Truck, subtitle: "Datos de quien despacha y entrega la mercadería." },
  Consignatario: {
    icon: PackageCheck,
    subtitle: "Datos de quien recibe la mercadería en destino.",
  },
  Producto: { icon: PackageCheck, subtitle: "Productos que componen el embarque." },
  Facturación: { icon: FileText, subtitle: "Datos de facturación del cliente." },
  Detalles: { icon: Info, subtitle: "Condiciones y detalles de la carga." },
  Fechas: { icon: CalendarDays, subtitle: "Fecha de recolección de la mercadería." },
  Seguimiento: { icon: Route, subtitle: "Registra un nuevo seguimiento para este embarque." },
};

const META_DEFAULT = { icon: UserRound, subtitle: "Complete la información solicitada." };

export function SeccionHeader({
  titulo,
  acciones,
}: Readonly<{ titulo: string; acciones?: React.ReactNode }>) {
  const meta = SECCION_META[titulo] ?? META_DEFAULT;
  return (
    <SeccionHeaderBase
      titulo={titulo}
      icono={meta.icon}
      subtitulo={meta.subtitle}
      {...(acciones ? { acciones } : {})}
    />
  );
}
