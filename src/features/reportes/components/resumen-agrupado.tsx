import { formatearNumero, type Resumen } from "../lib/resumen-agrupado";
import { MensajeVacio } from "./panel";

const celda = "border-r border-border px-4 py-2 last:border-r-0";
const encabezado = "border-r border-white/20 px-4 py-2 text-left font-semibold last:border-r-0";

/** Tabla del "Resumen agrupado": niveles, columnas del pivote, total y fila TOTAL. */
export function TablaResumen({ resumen }: Readonly<{ resumen: Resumen }>) {
  if (resumen.filas.length === 0) return <MensajeVacio>No hay datos para agrupar.</MensajeVacio>;
  if (resumen.niveles.length === 0)
    return (
      <MensajeVacio>Elija en «Personaliza tu reporte» por qué agrupar las filas.</MensajeVacio>
    );

  const conPivote = resumen.tituloColumnas !== "";
  const filasEncabezado = conPivote ? 2 : 1;

  return (
    <div className="max-h-[32rem] overflow-auto rounded-md">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-primary text-primary-foreground">
          {conPivote ? (
            <tr>
              {resumen.niveles.map((nivel) => (
                <th key={nivel} rowSpan={filasEncabezado} className={encabezado}>
                  {nivel}
                </th>
              ))}
              <th colSpan={resumen.columnas.length} className={encabezado}>
                {resumen.tituloColumnas}
              </th>
              <th rowSpan={filasEncabezado} className={`${encabezado} text-right`}>
                Total
              </th>
            </tr>
          ) : null}
          <tr>
            {conPivote
              ? null
              : resumen.niveles.map((nivel) => (
                  <th key={nivel} className={encabezado}>
                    {nivel}
                  </th>
                ))}
            {resumen.columnas.map((columna) => (
              <th key={columna} className={`${encabezado} text-right`}>
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resumen.filas.map((fila) => (
            <tr key={fila.claves.join("\u0000")} className="border-b border-border">
              {fila.claves.map((clave, i) => (
                <td key={resumen.niveles[i]} className={celda}>
                  {clave}
                </td>
              ))}
              {resumen.columnas.map((columna, i) => (
                <td key={columna} className={`${celda} text-right tabular-nums`}>
                  {formatearNumero(fila.valores[i] ?? 0)}
                </td>
              ))}
              {conPivote ? (
                <td className={`${celda} text-right font-semibold tabular-nums`}>
                  {formatearNumero(fila.total)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-brand-50 font-semibold">
          <tr>
            {resumen.niveles.length > 0 ? (
              <td colSpan={resumen.niveles.length} className={celda}>
                TOTAL
              </td>
            ) : null}
            {resumen.totales.map((total, i) => (
              <td key={resumen.columnas[i]} className={`${celda} text-right tabular-nums`}>
                {formatearNumero(total)}
              </td>
            ))}
            {conPivote ? (
              <td className={`${celda} text-right tabular-nums`}>
                {formatearNumero(resumen.total)}
              </td>
            ) : null}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
