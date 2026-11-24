import moment from "moment";
import axios from "axios";
import * as EXCEL from "exceljs";
import { alignmentFormat, textFormat, borderFormat } from "./_libreria_estilos_excel";

let datos = null;

const pickFontColorFromProps = (colStyle, value, rowObj) => {
  if (!colStyle) return null;

  // 1) fn condicional: (value, rowObj) => "FFFF0000"
  if (typeof colStyle.fontColorFn === "function") {
    const c = colStyle.fontColorFn(value, rowObj);
    return c || null;
  }

  // 2) mapa por valor: { "A": "FFFF0000", "B": "FF0000FF" }
  if (colStyle.fontColorMap && value !== null && value !== undefined) {
    const k = String(value);
    const c = colStyle.fontColorMap[k];
    return c || null;
  }

  // 3) fijo
  if (colStyle.fontColor) return colStyle.fontColor;

  return null;
};

const createCell = async (row, cell, value = "", alignment = null, font = null, border = null, formato = null, fontColor = null) => {
  const cellRef = row.getCell(cell);

  if (alignment) cellRef.alignment = alignment;
  if (border) cellRef.border = border;

  if (font || fontColor) {
    cellRef.font = {
      ...(font || {}),
      ...(fontColor ? { color: { argb: fontColor } } : {}),
    };
  }

  if (formato)
    cellRef.numFmt =
      formato.tipo == "dolar"
        ? "$#,##0.00;[Red]-$#,##0.00"
        : formato.tipo == "quetzal"
          ? "Q#,##0.00;[Red]-Q#,##0.00"
          : formato.tipo == "moneda"
            ? `${formato.moneda}#,##0.00;[Red]-${formato.moneda}#,##0.00`
            : formato.tipo == "numero"
              ? formato.formato || "#"
              : cellRef.numFmt;

  cellRef.value = formato?.tipo == "date" ? moment(value, formato.formato).toDate() : value;
};

/**
 * Generador Excel
 */
const generarExcel = async (json) => {
  datos = json;

  const wb = new EXCEL.Workbook();

  json.hojas.map((hoja) => {
    const ws = wb.addWorksheet(hoja.nombre, {
      views: [{ showGridLines: false }],
      properties: { tabColor: { argb: hoja.color } },
    });

    // Título
    createCell(ws.getRow(1), 3, hoja.nombre, alignmentFormat.middleLeft, textFormat.bigLetter);

    // Encabezado (llave/valor)
    let fin_header = 1;
    Object.keys(hoja.header).map((i, ind) => {
      const row = ws.getRow(ind + 3);
      createCell(row, 3, i.toUpperCase(), alignmentFormat.middleRight, textFormat.subtitleCell);
      createCell(row, 4, hoja.header[i], alignmentFormat.middleLeft, textFormat.normalCell);
      fin_header = ind + 3;
    });
    fin_header += 2;

    // Datos
    if (hoja.datos?.[0]) {
      // columnas basadas en el primer objeto
      const headers = Object.keys(hoja.datos[0]);

      // ✅ AQUÍ VIENE TU "DE HOJA.PROPS"
      // hoja.props = { styles: { columns: { colKey: { fontColorFn/map/fontColor } } } }
      const styles = hoja.props?.styles || {};
      const colStyles = styles.columns || {};

      // Fila de encabezados de tabla
      const encabezados_datos = ws.getRow(fin_header++);
      headers.map((h, ind) => {
        createCell(encabezados_datos, ind + 3, h, alignmentFormat.middleCenter, textFormat.headerCell, borderFormat.allBordersBold);
      });

      ws.autoFilter = {
        from: encabezados_datos._cells[2]._address,
        to: encabezados_datos._cells[encabezados_datos._cells.length - 1]._address,
      };

      // ✅ EN VEZ DE body.map(...) usamos hoja.datos (rowObj) para condicionar por fila
      hoja.datos.map((rowObj) => {
        const row = ws.getRow(fin_header++);

        headers.map((key, ind) => {
          let v = rowObj[key];
          if (v === null || v === undefined) v = "";

          // Si tu transformDatos mete objetos {dato, textFormat...} seguimos soportándolo,
          // pero el color lo sacamos DE props (si no hay override)
          const isObjCell = typeof v === "object" && v !== null;
          const rawValue = isObjCell ? v.dato : v;

          // ✅ AQUÍ SE CONDICIONA EL PUTO COLOR, CELDA POR CELDA, USANDO hoja.props.styles
          const colStyle = colStyles[key];
          const fontColorFromProps = pickFontColorFromProps(colStyle, rawValue, rowObj);

          // override opcional por celda (si existiera)
          const finalColor = isObjCell && v.fontColor ? v.fontColor : fontColorFromProps;

          if (isObjCell) {
            createCell(
              row,
              ind + 3,
              v.dato ?? "",
              v.alignFormat || alignmentFormat.middleCenter,
              v.textFormat || textFormat.headerCell,
              v.borderFormat || borderFormat.allBordersThin,
              v.formato,
              finalColor,
            );
          } else {
            createCell(row, ind + 3, rawValue, alignmentFormat.middleCenter, textFormat.headerCell, borderFormat.allBordersThin, null, finalColor);
          }
        });
      });
    }

    // Auto ancho columnas
    ws.columns.forEach(function (column) {
      let dataMax = 0;
      column.eachCell({ includeEmpty: true }, function (cell) {
        if (cell._address.includes("B")) return (dataMax = 10);
        if (!cell.value) return;
        const txt = String(cell.value);
        const len = txt.length;
        if (len > dataMax) dataMax = len;
      });
      column.width = dataMax == 0 ? dataMax : dataMax < 10 ? 10 : dataMax > 90 ? 90 : dataMax;
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/xlsx" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = json.propiedades.title;
  link.click();
};

export default generarExcel;
