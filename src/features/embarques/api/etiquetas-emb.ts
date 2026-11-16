import z from "zod";
import { http } from "@/shared/api/client";

const etiquetasEmbarquesSchema = z.object({
  EMP_CODIGO: z.number().nullable().catch(0),
  DEPORG_CODIGO: z.string().nullable().catch(""),
  ETIQ_HAWB: z.string().nullable().catch(""),
  ETIQ_MAWB: z.string().nullable().catch(""),
  ETIQ_DESTINO: z.string().nullable().catch(""),
  ETIQ_ORIGEN: z.string().nullable().catch(""),
  ETIQ_BULTOS: z.number().nullable().catch(0),
  ETIQ_ETS: z.string().nullable().catch(""),
  ETIQ_FECHA: z.string().nullable().catch(""),
  ETIQ_CSGNEE: z.string().nullable().catch(""),
});

export type ListaEtiquetasEmbarques = z.infer<typeof etiquetasEmbarquesSchema>;

export async function fetchEtiquetasEmbarques(): Promise<ListaEtiquetasEmbarques[]> {
  const res = await http.get<{ data?: unknown[] }>("api/appweb/recupera-etiquetas-oracle", {
    skipNormalization: true,
  });

  const lista = res?.data ?? [];

  return z.array(etiquetasEmbarquesSchema).parse(lista);
}

export interface GenerarEtiquetasPayload {
  etiq_hawb: string;
  etiq_mawb: string;
  etiq_destino: string;
  etiq_origen: string;
  etiq_bultos: number;
  etiq_csgnee: string;
  inicio: number;
  final: number;
}

const generarEtiquetasRespuestaSchema = z.object({
  success: z.boolean(),
  mensaje: z.string().optional(),
  url_documento: z.string().optional(),
});

/** Genera el PDF de etiquetas en el backend (Oracle) y devuelve la ruta del archivo. */
export async function generarEtiquetasOracle(
  payload: GenerarEtiquetasPayload,
): Promise<{ url_documento: string }> {
  const res = await http.post<{ data: unknown }>("api/appweb/generar-etiquetas-oracle", payload);
  const parsed = generarEtiquetasRespuestaSchema.parse(res.data);

  if (!parsed.success || !parsed.url_documento) {
    throw new Error(parsed.mensaje || "No se pudo generar el PDF de etiquetas.");
  }

  return { url_documento: parsed.url_documento };
}
