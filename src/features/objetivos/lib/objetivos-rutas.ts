export const RUTA_OBJETIVOS = {
  objetivos: "/objetivos/objetivos/objetivos",
} as const;

export function rutaDetalle(rutaBase: string, id: string) {
  return `${rutaBase}/${id}`;
}
