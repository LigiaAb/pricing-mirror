"use client";

/**
 * Bloque "Instrucciones · {paso}" del header sticky del wizard público y del
 * detalle CTS (D.7): texto de ayuda dependiente de la sección activa.
 */

import { Info } from "lucide-react";

export const INSTRUCCIONES_POR_PASO: Record<string, string> = {
  Shipper:
    "Selecciona el shipper a utilizar. No olvides guardar tus cambios al final del formulario.",
  Consignatario:
    "Selecciona un consignatario de tu lista o crea uno nuevo. No olvides guardar tus cambios.",
  Notificacion: "Ingresa los datos de contacto. No olvides guardar tus cambios.",
  Producto: 'En la tabla, da clic en "Ver" y completa la información del producto.',
  Facturacion:
    "Tus datos de facturación ya están ingresados. Verifica que la información sea correcta.",
  Detalles: "Completa los detalles de pago, tipo de carga e incoterm de tu embarque.",
  Documentos: "Adjunta los documentos requeridos para continuar con el proceso.",
  Fechas: "Indica la fecha y hora en que se realizará la recolección de tu carga.",
};

export const INSTRUCCION_DEFAULT = "Complete el formulario y guarde los cambios en cada sección.";

export function InstruccionesPaso({ pasoActivo }: { readonly pasoActivo: string }) {
  const instruccion = INSTRUCCIONES_POR_PASO[pasoActivo] || INSTRUCCION_DEFAULT;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 md:gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground md:size-8">
        <Info className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="hidden text-xs font-semibold uppercase tracking-wide text-section-accent md:block">
          Instrucciones · {pasoActivo}
        </p>
        <p className="line-clamp-2 text-sm font-medium text-muted-foreground md:line-clamp-none">
          {instruccion}
        </p>
      </div>
    </div>
  );
}
