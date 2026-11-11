"use client";

import React from "react";

import {
  generarPdfCotizacionDetalle,
  type IdiomaPdfCotizacion,
  recuperarArchivoPdf,
  type TipoDocumentoPdfCotizacion,
} from "../api/cotizacion-detalle";

import type { Id } from "../lib/tipos";
import { COD_TIPO_SERVICIO_ESTACION } from "../lib/constantes";

type VersionPdf = {
  cod_cotizaciondetalle: Id;
  version?: string | number | null;
};

type TipoPdf = 1 | 2;

type Props = {
  codCotizacionCabecera: Id;
  codTipoServicio?: Id | null;
};

const MAX_INTENTOS = 5;
const DELAY_BASE_MS = 1000;

function esperar(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function obtenerIdiomaDesdeUrl(url: string): IdiomaPdfCotizacion {
  const nombreSinExtension = url.split("?")[0]?.split(".")[0] ?? "";
  const ultimoSegmento = nombreSinExtension.split("_").at(-1)?.toLowerCase();

  return ultimoSegmento === "en" ? "en" : "es";
}

function obtenerTipoDocumento(
  codTipoServicio: Id | null | undefined,
  tipo: TipoPdf,
): TipoDocumentoPdfCotizacion {
  if (Number(codTipoServicio) !== COD_TIPO_SERVICIO_ESTACION) {
    return null;
  }

  return tipo === 2 ? "collect" : "prepaid";
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible generar el PDF.";
}

async function recuperarConReintentos(rutaArchivo: string) {
  let ultimoError: unknown = null;

  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    try {
      return await recuperarArchivoPdf(rutaArchivo);
    } catch (errorActual) {
      ultimoError = errorActual;

      if (intento < MAX_INTENTOS) {
        await esperar(DELAY_BASE_MS * intento);
      }
    }
  }

  throw ultimoError ?? new Error("No fue posible recuperar el PDF.");
}

export function usePdfCotizacion({ codCotizacionCabecera, codTipoServicio }: Props) {
  const [open, setOpen] = React.useState(false);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = React.useState("cotizacion.pdf");
  const [idioma, setIdioma] = React.useState<IdiomaPdfCotizacion>("es");
  const [pdfActual, setPdfActual] = React.useState<{ version: VersionPdf; tipo: TipoPdf } | null>(
    null,
  );

  const reemplazarPdfUrl = React.useCallback((next: string | null) => {
    setPdfUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }

      return next;
    });
  }, []);

  React.useEffect(
    () => () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    },
    [pdfUrl],
  );

  const generar = React.useCallback(
    async (
      version: VersionPdf,
      tipo: TipoPdf,
      options: { forzar?: boolean; idioma?: IdiomaPdfCotizacion } = {},
    ) => {
      setOpen(true);
      setCargando(true);
      setError(null);
      reemplazarPdfUrl(null);

      try {
        const resultado = await generarPdfCotizacionDetalle(version.cod_cotizaciondetalle, {
          forzar: true,
          ...(options.idioma === undefined ? {} : { idioma: options.idioma }),
          tipoDocumento: obtenerTipoDocumento(codTipoServicio, tipo),
        });

        const rutaArchivo =
          (tipo === 1 ? resultado.url_documento_prepaid : resultado.url_documento_collect) ??
          resultado.url_documento;

        if (!rutaArchivo) {
          throw new Error("El backend no devolvió la URL del PDF.");
        }

        const blob = await recuperarConReintentos(rutaArchivo);
        const nextUrl = URL.createObjectURL(blob);
        const idiomaArchivo = options.idioma ?? obtenerIdiomaDesdeUrl(rutaArchivo);
        const versionNombre = version.version ?? version.cod_cotizaciondetalle;

        reemplazarPdfUrl(nextUrl);
        setNombreArchivo(`cotizacion-${codCotizacionCabecera}_${versionNombre}.pdf`);
        setIdioma(idiomaArchivo);
        setPdfActual({ version, tipo });
        setOpen(true);
      } catch (errorActual) {
        setError(obtenerMensajeError(errorActual));
      } finally {
        setCargando(false);
      }
    },
    [codCotizacionCabecera, codTipoServicio, reemplazarPdfUrl],
  );

  const cambiarIdioma = React.useCallback(
    async (next: IdiomaPdfCotizacion) => {
      if (!pdfActual || next === idioma) {
        return;
      }

      await generar(pdfActual.version, pdfActual.tipo, {
        forzar: true,
        idioma: next,
      });
    },
    [pdfActual, idioma, generar],
  );

  const descargar = React.useCallback(() => {
    if (!pdfUrl) {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = pdfUrl;
    anchor.download = nombreArchivo;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [pdfUrl, nombreArchivo]);

  const cerrar = React.useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    cargando,
    error,
    pdfUrl,
    nombreArchivo,
    idioma,
    generar,
    cambiarIdioma,
    descargar,
    cerrar,
    setOpen,
  };
}
