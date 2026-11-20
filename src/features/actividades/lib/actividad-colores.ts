const COLORES_ACTIVIDAD = ["blue", "emerald", "violet", "amber", "rose", "cyan"] as const;

export function colorActividad(
  codTipoActividad: string | number,
  colorBackend?: string | null,
): string {
  if (colorBackend?.trim()) return colorBackend;
  const codigo = Math.abs(Number(codTipoActividad) || 0);
  return COLORES_ACTIVIDAD[codigo % COLORES_ACTIVIDAD.length] ?? "blue";
}
