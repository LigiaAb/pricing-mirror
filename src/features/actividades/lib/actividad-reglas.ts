const TIPOS_ACTIVIDAD_INMEDIATA = [34, 35, 36, 37, 38, 55, 56, 57, 58, 59] as const;
const TIPOS_RESULTADO_CIERRE_COTIZACION = [67, 68, 289] as const;
const ESTADO_ACTIVIDAD_EN_PROCESO = 23;
const ESTADO_ACTIVIDAD_FINALIZADA = 24;

export function fechaActividadValida(
  fecha: string,
  diasCreacion: number,
  ahora = new Date(),
): boolean {
  const programada = new Date(fecha);
  if (Number.isNaN(programada.getTime())) return false;
  const limite = new Date(ahora);
  limite.setDate(limite.getDate() - diasCreacion);
  return programada >= limite;
}

export function estadoInicialActividad(codTipo: string | number): number {
  return TIPOS_ACTIVIDAD_INMEDIATA.includes(Number(codTipo) as never)
    ? ESTADO_ACTIVIDAD_FINALIZADA
    : ESTADO_ACTIVIDAD_EN_PROCESO;
}

export function resultadoCierraCotizacion(codTipoResultado: string | number): boolean {
  return TIPOS_RESULTADO_CIERRE_COTIZACION.includes(Number(codTipoResultado) as never);
}
