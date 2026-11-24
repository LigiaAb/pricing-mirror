import jsPDF from "jspdf";
import moment from "moment";
import image from "../../assets/logo-cropa-dsv-1024x205.png";

let doc = new jsPDF("portrait", "pt", "letter");
let pageHeight = doc.internal.pageSize.height;
let pageWidth = doc.internal.pageSize.getWidth();
let margins = {
  top: 20,
  bottom: 50,
  left: 50,
  width: pageWidth - 100,
};
let left = 0;
let yPos = margins.top;
let xPos = margins.left;
let scale = doc.internal.scaleFactor;
let datos = null;
let page = 1;

let addPage = () => {
  doc.addPage();
  yPos = margins.top;
};

const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const diasDeLaSemana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

let nextArea = (val = 1, heightText = 0) => {
  yPos += (doc.getLineHeight(" ") / scale) * val;
  if (pageHeight - margins.bottom - 13 <= yPos + heightText * 8) {
    addPage();
    addTitle();
    nextArea(4);
  }
  return yPos;
};

let bottom = () => {
  doc.setTextColor("#555");
  addText(`Generado el ${moment().format("DD-MM-YYYY HH:mm:ss")}`, "normal", xPos, pageHeight - margins.bottom + 15, "left", 7);
  addText(`Generado por [${datos.usuario}] en ERPWEB`, "normal", margins.width + margins.left, pageHeight - margins.bottom + 15, "right", 7);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  let titulo = "- CROPA DSV 2025 -";
  doc.rect(xPos, pageHeight - margins.bottom, margins.width, doc.getLineHeight(" ") / doc.internal.scaleFactor - doc.splitTextToSize(titulo, margins.width).length + 2, "F");
  doc.setTextColor("#fff");
  doc.setFontSize(7);
  addText(titulo, "normal", pageWidth / 2, pageHeight - margins.bottom + doc.getLineHeight(" ") / doc.internal.scaleFactor + doc.splitTextToSize(titulo, margins.width).length - 2, "center", 7);
  doc.setTextColor("#000");
};

let addText = (texto, weight, x, y, align, fontSize = 15, enter = true, underline = false, doc_ = doc, width) => {
  doc_.setFontSize(fontSize);
  doc_.setFont("Helvetica", weight);
  doc_.text(doc_.splitTextToSize(texto, align === "left" ? margins.width - x : margins.width), x, y, {
    align,
    maxWidth: align === "left" ? margins.width - x : margins.width,
  });
  if (underline) {
    doc_.setDrawColor("#000");
    if (align == "center") doc_.line(x - doc_.getTextDimensions(texto).w / scale / 2, y + 1, x + doc_.getTextDimensions(texto).w / scale / 2 + 5, y + 1);
    else doc_.line(x, y + 1, x + doc_.getTextDimensions(texto).w / scale + 5, y + 1);
  }
  enter ? nextArea(doc_.splitTextToSize(texto, align === "left" ? margins.width - x : margins.width).length) : null;
};

let addTitle = () => {
  doc.setFont("Helvetica", "bold");
  doc.addImage(image, "PNG", xPos, margins.top + 5, 25 * 6.5, 5 * 6.5);
  nextArea(1);
  xPos = margins.left + 20;
  doc.setTextColor("#BBB");
  addText(
    `${datos?.fechaInicio ? `Del ${moment(datos?.fechaInicio, "DDMMYY").format("DD-MM-YYYY")}` : ""} ${datos?.fechaFin ? `Al ${moment(datos?.fechaFin, "DDMMYY").format("DD-MM-YYYY")}` : ""}`,
    "bold",
    xPos - 7 * 2.8 + 25 * 7.8,
    yPos,
    "left",
    10,
    false
  );
  doc.setTextColor("#000");
  addText(`Página ${page}`, "normal", margins.width + margins.left, yPos + 2, "right", 10);
  nextArea(0.5);
  addText(`${datos?.agente?.nombre}`, "normal", xPos - 7 * 2.8 + 25 * 7.8, yPos, "left", 10);
  if (page === 1) {
    nextArea(0.5);
    addText(`Calendario de Seguimientos de actividades`, "bold", xPos, yPos, "left", 15);
    addText(`Datos Colaborador:`, "normal", xPos, yPos, "left", 10);
    addText(`\u2022 Correo: `, "normal", xPos, yPos, "left", 8, false);
    doc.setTextColor("#4184C5");
    addText(`${datos?.agente?.usuario}`, "normal", xPos + 40, yPos, "left", 8, false);
    nextArea(0.5);
  }
  xPos = margins.left;
  doc.setDrawColor("#000");
  doc.line(xPos, yPos, xPos + margins.width, yPos);
  nextArea(1);

  doc.setFont("Helvetica", "normal");
  datos.bottom ? bottom() : null;
  yPos = margins.top;
  if (page === 1) nextArea(12.5);
  else nextArea(3);
  page++;
};

const generarPDFCalendario = (datos_l) => {
  datos = datos_l;
  doc = new jsPDF(datos.horizontal ? "l" : "p", "pt", datos.tamaño ? datos.tamaño : "a4");
  pageHeight = doc.internal.pageSize.height;
  pageWidth = doc.internal.pageSize.getWidth();
  margins = {
    top: 20,
    bottom: 50,
    left: 50,
    width: pageWidth - 100,
  };
  left = 0;
  yPos = margins.top;
  xPos = margins.left;
  scale = doc.internal.scaleFactor;
  page = 1;

  doc.setProperties({ author: datos.usuario, creator: "ERPWEB", title: datos.titulo || datos.title });

  pageHeight = doc.internal.pageSize.height;
  pageWidth = doc.internal.pageSize.width;
  yPos = margins.top;
  xPos = margins.left;
  let titulo = "";
  let xPos_temp = xPos;
  let yPos_temp = yPos;

  doc.setLineHeightFactor(1.15);

  addTitle();

  const anos = {};

  datos?.datos
    ?.sort(function (a, b) {
      return moment(a.fecha_programada).diff(moment(b.fecha_programada)); //moment(b.fecha_programada).format("X") - moment(a.fecha_programada).format("X");
    })
    .map((i) => {
      if (!anos[moment(i.fecha_programada).format("YYYY")]) anos[moment(i.fecha_programada).format("YYYY")] = { meses: {} };

      const ano = anos[moment(i.fecha_programada).format("YYYY")];

      if (!ano?.meses[moment(i.fecha_programada).format("M")]) ano.meses[moment(i.fecha_programada).format("M")] = { dias: {} };

      const mes = ano?.meses[moment(i.fecha_programada).format("M")];

      if (!mes?.dias[moment(i.fecha_programada).format("DD")]) mes.dias[moment(i.fecha_programada).format("DD")] = { horas: {}, dia: moment(i.fecha_programada).day() };

      const dia = mes?.dias[moment(i.fecha_programada).format("DD")];

      if (!dia?.horas[moment(i.fecha_programada).format("HH:mm")]) dia.horas[moment(i.fecha_programada).format("HH:mm")] = [];

      dia.horas[moment(i.fecha_programada).format("HH:mm")] = [...dia.horas[moment(i.fecha_programada).format("HH:mm")], i];
    });

  Object.keys(anos).map((ano) => {
    // addText(`${ano}`, "bold", xPos, yPos, "left", 19, true, undefined, doc);
    Object.keys(anos[ano].meses).map((mes) => {
      // nextArea(0.5);
      // addText(`${meses[mes - 1]}`, "bold", xPos, yPos, "left", 15, true, undefined, doc);
      Object.keys(anos[ano].meses[mes].dias).map((dia) => {
        addText(`${diasDeLaSemana[anos[ano].meses[mes].dias[dia].dia]}, ${dia} de ${meses[mes - 1]}, ${ano}`, "bold", xPos + 20, yPos, "left", 8, true, undefined, doc);
        Object.keys(anos[ano].meses[mes].dias[dia].horas).map((hora) => {
          // nextArea(0.5);
          anos[ano].meses[mes].dias[dia].horas[hora].map((actividad) => {
            nextArea(0.5);
            doc.setTextColor("#555");
            addText(`${hora}`, "normal", xPos + 20, yPos, "left", 8, false, undefined, doc);
            doc.setTextColor("#0B2967");
            addText(`${actividad.nombre_cliente.toUpperCase()}`, undefined, xPos + 80, yPos, "left", 8, true, undefined, doc);
            nextArea(-0.2);
            doc.setTextColor("#555");
            addText(`Asunto:`, undefined, xPos + 80, yPos, "left", 6, false, undefined, doc);
            addText(`${actividad.asunto}`, undefined, xPos + 80 + 60, yPos, "left", 6, true, undefined, doc);
            nextArea(0.2);
            doc.setTextColor("#555");
            addText(`Descripcion:`, undefined, xPos + 80, yPos, "left", 6, false, undefined, doc);
            addText(`${actividad.descripcion}`, undefined, xPos + 80 + 60, yPos, "left", 6, true, undefined, doc);
            nextArea(0.2);
            doc.setTextColor("#555");
            const resultados = JSON.parse(actividad.resultado);
            if (resultados)
              resultados.map((res) => {
                doc.setTextColor("green");
                addText(`Resultado:`, undefined, xPos + 80, yPos, "left", 6, false, undefined, doc);
                addText(`${res.NOM_TIPO}`, undefined, xPos + 80 + 60, yPos, "left", 6, true, undefined, doc);
              });
            else {
              doc.setTextColor("darkgreen");
              addText(`Resultado:`, undefined, xPos + 80, yPos, "left", 6, false, undefined, doc);
              addText(`Sin Resultados`, undefined, xPos + 80 + 60, yPos, "left", 6, true, undefined, doc);
            }
            doc.setTextColor("#000");
            nextArea(0.5);
            // addText(`actividad ${JSON.stringify(actividad)}`, undefined, xPos, yPos, "left", 12, true, undefined, doc);
          });
          nextArea(1);
        });
      });
    });
  });

  if (datos.descargar) {
    doc.save(datos.title || datos.titulo);
    return doc.output("datauristring");
  } else {
    return doc.output("datauristring");
  }
};

export default generarPDFCalendario;
