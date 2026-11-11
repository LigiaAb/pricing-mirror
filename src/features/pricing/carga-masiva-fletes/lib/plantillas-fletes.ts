import type { MetodoCargaFlete } from "../api/carga-masiva-fletes";

const ENCABEZADO_AEREO = [
  "NUMERO",
  "TIPO DE TRANSPORTE",
  "LINEA AEREA",
  "TIPO DE CARGA",
  "CLASIFICACION DE CARGA",
  "VIGENCIA INICIAL",
  "VIGENCIA FINAL",
  "SIGLAS",
  "ORIGEN CODIGO IATA",
  "DESTINO CODIGO IATA",
  "MINIMO",
  "<45",
  ">45",
  ">100",
  ">300",
  ">500",
  ">1000",
  ">1300 ",
  "TIPO TARIFA",
  "TIPO AVION",
] as const;

const ENCABEZADO_TERRESTRE = [
  "NUMERO",
  "TIPO DE CARGA",
  "CLASIFICACION DE CARGA",
  "VIGENCIA INICIAL",
  "VIGENCIA FINAL",
  "CODIGO PAIS",
  "CODIGO CIUDAD",
  "MINIMO",
  "<1000",
  ">1000",
  ">3000",
  ">5000",
] as const;

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = nombre;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function descargarPlantillaFletes(metodo: MetodoCargaFlete) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Datos");
  const encabezado = metodo === "AIRFREIGTH" ? ENCABEZADO_AEREO : ENCABEZADO_TERRESTRE;

  worksheet.addRow([...encabezado]);
  worksheet.columns.forEach((column, index) => {
    const titulo = encabezado[index] ?? "";
    column.width = Math.max(20, titulo.length);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const nombreMetodo = metodo === "AIRFREIGTH" ? "AIRFREIGTH" : "LANDFREIGTH";

  descargarBlob(blob, `Plantilla Carga de Fletes ${nombreMetodo}.xlsx`);
}

export async function descargarReporteFletes({
  encabezado,
  filas,
  nombre,
}: {
  encabezado: string;
  filas: string[];
  nombre: string;
}) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resultados");

  worksheet.addRow([encabezado]);
  filas.forEach((fila) => {
    worksheet.addRow([fila]);
  });
  worksheet.getColumn(1).width = Math.max(
    30,
    encabezado.length,
    ...filas.map((fila) => Math.min(fila.length, 120)),
  );

  const buffer = await workbook.xlsx.writeBuffer();
  descargarBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${nombre}.xlsx`,
  );
}
