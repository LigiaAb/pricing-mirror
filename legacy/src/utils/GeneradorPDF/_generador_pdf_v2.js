import jsPDF from "jspdf";
import "jspdf-autotable";
import { convert } from "html-to-text";
import image  from "../../assets/logo-cropa-dsv-1024x205.png";
// const { convert } = require("html-to-text");
// const image = require("../../assets/logo-cropa-dsv-1024x205.png");
import moment from "moment";
import "moment/locale/es";

let doc = new jsPDF("portrait", "pt", "letter");
let pageHeight = doc.internal.pageSize.height;
let pageWidth = doc.internal.pageSize.getWidth();
let margins = {
  top: 20,
  bottom: 40,
  left: 50,
  width: pageWidth - 100,
};
let left = 0;
let yPos = margins.top;
let xPos = margins.left;
let scale = doc.internal.scaleFactor;
let datos = null;
let page = 1;

let nextArea = (val = 1, heightText = 0) => {
  yPos += (doc.getLineHeight(" ") / scale) * val;
  if (pageHeight - margins.bottom - 13 <= yPos + heightText * 8) {
    doc.addPage();
    yPos = margins.top;
    addTitle();
    nextArea(4);
  }
  return yPos;
};

let bottom = () => {
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  let titulo = "- CROPA DSV 2022 -";
  doc.rect(
    xPos,
    pageHeight - margins.bottom,
    margins.width,
    doc.getLineHeight(" ") / doc.internal.scaleFactor -
      doc.splitTextToSize(titulo, margins.width).length,
    "F"
  );
  doc.setTextColor("#fff");
  doc.setFontSize(7);
  addText(
    titulo,
    "normal",
    pageWidth / 2,
    pageHeight -
      margins.bottom +
      doc.getLineHeight(" ") / doc.internal.scaleFactor +
      doc.splitTextToSize(titulo, margins.width).length,
    "center",
    7
  );
  doc.setTextColor("#000");
};

let addText = (
  texto,
  weight,
  x,
  y,
  align,
  fontSize = 15,
  enter = true,
  underline = false,
  doc_ = doc
) => {
  doc_.setFontSize(fontSize);
  doc_.setFont("Helvetica", weight);
  doc_.text(doc_.splitTextToSize(texto, margins.width), x, y, {
    align,
    maxWidth: margins.width,
  });
  if (underline) {
    doc_.setDrawColor("#000");
    if (align == "center")
      doc_.line(
        x - doc_.getTextDimensions(texto).w / scale / 2,
        y + 1,
        x + doc_.getTextDimensions(texto).w / scale / 2 + 5,
        y + 1
      );
    else
      doc_.line(
        x,
        y + 1,
        x + doc_.getTextDimensions(texto).w / scale + 5,
        y + 1
      );
  }
  enter ? nextArea(doc_.splitTextToSize(texto, margins.width).length) : null;
};
let addTitle = () => {
  // doc.addFont("Courier-Bold", "Courier-Bold", "normal");
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.addImage(image, "PNG", xPos - 7 * 2.8, margins.top, 25 * 7.8, 7 * 7.8);
  // doc.text("[ Logo ]", xPos - 7 * 2.8, margins.top);
  doc.line(
    xPos - 7 * 2.8 + 25 * 7.8,
    margins.top + 7 * 5.2,
    pageWidth - margins.left,
    margins.top + 7 * 5.2
  );

  nextArea(2);

  addText(datos.titulo, "bold", xPos - 7 * 2.8 + 25 * 7.8, yPos, "left", 15);
  addText(
    `Página ${page}`,
    "normal",
    margins.width + margins.left,
    yPos + 2,
    "right",
    10
  );
  page++;

  doc.setFont("Helvetica", "normal");
  datos.bottom ? bottom() : null;
  yPos = margins.top;
  nextArea(9);
};

/**
 *
 * EL GENERADOR DE PDF SOLICITA UN OBJETO QUE CONTENGA LO SIGUIENTE:
 * TITULO: STRING
 * BOTTOM: BOOLEAN
 * ENCABEZADO:
 *  {
 *    CAMPO1: DATO1,
 *    CAMPO2: DATO2,
 *  }
 * DATOS
 *  {
 *    HEADER1: DATO1,
 *    HEADER2: DATO2,
 *    HEADER3: DATO3,
 *  }
 *
 */
const generarPDF = (datos_l) => {
  datos = datos_l;
  doc = new jsPDF(
    datos.horizontal ? "l" : "p",
    "pt",
    datos.tamaño ? datos.tamaño : "letter"
  );
  pageHeight = doc.internal.pageSize.height;
  pageWidth = doc.internal.pageSize.getWidth();
  margins = {
    top: 20,
    bottom: 40,
    left: 50,
    width: pageWidth - 100,
  };
  left = 0;
  yPos = margins.top;
  xPos = margins.left;
  scale = doc.internal.scaleFactor;
  page = 1;

  doc.setProperties(datos.propiedades);

  pageHeight = doc.internal.pageSize.height;
  pageWidth = doc.internal.pageSize.width;
  yPos = margins.top;
  xPos = margins.left;
  let titulo = "";
  let xPos_temp = xPos;
  let yPos_temp = yPos;

  doc.setLineHeightFactor(1.15);

  datos.titulo ? addTitle() : addTitle("");

  yPos_temp = yPos;
  Object.keys(datos.header).map((i) => {
    let obj = datos.header[i];
    addText(i.toUpperCase(), "bold", xPos, yPos, "left", 10);
    let xPos_temp_1 = doc.getTextDimensions(i.toUpperCase()).w + 6 + xPos;
    xPos_temp = xPos_temp > xPos_temp_1 ? xPos_temp : xPos_temp_1;
    nextArea(0.25);
  });
  yPos = yPos_temp;
  Object.keys(datos.header).map((i) => {
    let obj = datos.header[i];
    let nombre = obj.nombre
      ? obj.nombre
      : obj.label
      ? obj.label
      : obj.title
      ? obj.title
      : obj;
    addText(nombre, "normal", xPos_temp, yPos, "left", 10);
    nextArea(0.25);
  });

  if (datos.datos.length > 0) {
    let headers = Object.keys(datos.datos[0]).map((i) => ({
      content: i,
      styles: { cellWidth: "auto", halign: "center", valign: "middle" },
    }));
    let body = [];
    datos.datos.map((d) => {
      body.push(
        Object.keys(d).map((i) =>
          typeof d[i] === "object"
            ? {
                ...d[i],
                content: d[i].dato,
                styles: {
                  cellWidth: d[i].formato
                    ? doc.getTextDimensions(d[i].dato).w / scale + 5
                    : "wrap",
                  halign: d[i].alignFormat?.horizontal,
                  valign: d[i].alignFormat?.vertical,
                  cellPadding: 3,
                  textColor: d[i].textFormat?.color?.argb
                    ? `#${d[i].textFormat?.color?.argb?.toUpperCase()}`
                    : "#000",
                },
              }
            : {
                content: d[i],
                styles: {
                  cellWidth: "wrap",
                  halign: "left",
                  cellPadding: 3,
                  textColor: "#000",
                },
              }
        )
      );
    });

    // addText(JSON.stringify(headers), "normal", xPos, yPos, "left");
    // addText(JSON.stringify(body), "normal", xPos, yPos, "left");

    doc.autoTable({
      head: [headers],
      columns: headers.map((i) => ({ header: i, dataKey: i })),
      body,
      headStyles: { fillColor: "#aaa", textColor: "#000", fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      startY: yPos,
      margin: { left: margins.left, right: margins.left },
      didDrawCell: function (data) {
        // console.log(data);
        let { section, cell, doc } = data;

        if (section !== "head") {
          let alignFormat = {};
          let formato = {};
          if (typeof data.cell.raw === "object" && data.cell.raw.alignFormat)
            alignFormat = data.cell.raw.alignFormat;
          if (typeof data.cell.raw === "object" && data.cell.raw.formato)
            formato = data.cell.raw.formato;
          let y = cell.y + cell.height / 2;
          if (formato.tipo)
            if (formato.tipo === "dolar") {
              addText(
                "$",
                "normal",
                cell.x + 5,
                y + cell.styles.cellPadding / 2,
                "left",
                8,
                false,
                false,
                doc
              );
            } else if (formato.tipo === "quetzal") {
              addText(
                "Q",
                "normal",
                cell.x + 5,
                y + cell.styles.cellPadding / 2,
                "left",
                8,
                false,
                false,
                doc
              );
            } else if (formato.tipo === "moneda") {
              addText(
                formato.moneda,
                "normal",
                cell.x + 5,
                y + cell.styles.cellPadding / 2,
                "left",
                8,
                false,
                false,
                doc
              );
            }
          // addText(
          //   cell.raw.content,
          //   cell.raw?.textFormat?.bold ? "bold" : "normal",
          //   alignFormat?.horizontal === "center"
          //     ? cell.x + cell.width / 2
          //     : alignFormat?.horizontal === "right"
          //     ? cell.x + cell.width
          //     : cell.x + 5,
          //   y,
          //   alignFormat?.horizontal,
          //   9,
          //   false,
          //   false,
          //   doc
          // );
        }
      },
      didParseCell: function (data) {},
      didDrawPage: (data) => {
        if (data.pageNumber == 1) {
          yPos = margins.top;
          nextArea(6);
          data.settings.margin.top = yPos;
        } else {
          yPos = margins.top;
          data.settings.margin.top = yPos;
          addTitle();
          yPos = margins.top;
          data.settings.margin.top = nextArea(9);
          // console.log(data, yPos);
        }
      },
    });
  }

  if (datos.descargar) {
    doc.save(datos.propiedades.title);
  } else {
    return doc.output("datauristring");
  }
};

export default generarPDF;
