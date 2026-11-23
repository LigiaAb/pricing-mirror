import { format } from "date-fns";
import logoCropa from "@/assets/logos/logo-cropa-dsv.png";
import type { ActividadReporte } from "../api/actividades-reporte";
import { jsonSeguro } from "./actividades-vista";

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
const DIAS_SEMANA = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const AZUL_CROPA = "#00205b";
const AZUL_CLIENTE = "#0B2967";
const AZUL_CORREO = "#4184C5";
const GRIS = "#555";
const GRIS_CLARO = "#BBB";
const VERDE = "#008000";
const VERDE_OSCURO = "#006400";
const PIE_INSTITUCIONAL = "- CROPA DSV 2025 -";
const TITULO = "Calendario de Seguimientos de actividades";

/** Datos del colaborador que encabezan cada página del calendario. */
export interface AgenteCalendario {
  nombre: string;
  correo: string;
}

export interface OpcionesPdfCalendario {
  agente: AgenteCalendario;
  /** Rango consultado; se imprime en la cabecera si viene. */
  fechaInicio?: string;
  fechaFin?: string;
}

interface Grupo {
  diaSemana: number;
  horas: Map<string, ActividadReporte[]>;
}

type Alineacion = "left" | "center" | "right";

interface OpcionesTexto {
  x: number;
  y: number;
  align: Alineacion;
  fontSize?: number;
  /** Sin peso explícito se conserva el de la escritura anterior. */
  weight?: "normal" | "bold";
  /** `false` deja el cursor vertical donde estaba (escrituras en la misma línea). */
  enter?: boolean;
}

/**
 * Agrupa por año → mes → día → hora conservando el orden cronológico.
 * Las actividades sin fecha programada válida no entran al calendario.
 */
function agrupar(actividades: ActividadReporte[]) {
  const anos = new Map<string, Map<string, Map<string, Grupo>>>();
  const ordenadas = actividades
    .map((actividad) => ({ actividad, fecha: new Date(actividad.fecha_programada) }))
    .filter(({ fecha }) => !Number.isNaN(fecha.getTime()))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  for (const { actividad, fecha } of ordenadas) {
    const ano = format(fecha, "yyyy");
    const mes = format(fecha, "M");
    const dia = format(fecha, "dd");
    const hora = format(fecha, "HH:mm");

    const meses = anos.get(ano) ?? new Map<string, Map<string, Grupo>>();
    anos.set(ano, meses);
    const dias = meses.get(mes) ?? new Map<string, Grupo>();
    meses.set(mes, dias);
    const grupo = dias.get(dia) ?? { diaSemana: fecha.getDay(), horas: new Map() };
    dias.set(dia, grupo);
    grupo.horas.set(hora, [...(grupo.horas.get(hora) ?? []), actividad]);
  }

  return anos;
}

function textoRango(fechaInicio?: string, fechaFin?: string) {
  const desde = fechaInicio ? new Date(fechaInicio) : null;
  const hasta = fechaFin ? new Date(fechaFin) : null;
  const partes = [
    desde && !Number.isNaN(desde.getTime()) ? `Del ${format(desde, "dd-MM-yyyy")}` : "",
    hasta && !Number.isNaN(hasta.getTime()) ? `Al ${format(hasta, "dd-MM-yyyy")}` : "",
  ];
  return partes.join(" ").trim();
}

/**
 * Calendario de seguimientos: una agenda por día y hora, no una tabla.
 * Crea un PDF independiente por ejecución; no conserva estado entre descargas.
 */
export async function generarPdfCalendarioActividades(
  actividades: ActividadReporte[],
  { agente, fechaInicio, fechaFin }: OpcionesPdfCalendario,
): Promise<Blob> {
  const { default: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ orientation: "portrait", unit: "pt", format: "a4" });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margins = { top: 20, bottom: 50, left: 50, width: pageWidth - 100 };
  const scale = doc.internal.scaleFactor;
  // Sangría de la cabecera: el bloque de agente arranca a la derecha del logo.
  const xCabecera = margins.left + 20 - 7 * 2.8 + 25 * 7.8;
  let yPos = margins.top;
  let xPos = margins.left;
  let page = 1;

  doc.setProperties({
    author: agente.nombre,
    creator: "ERPWEB",
    title: `${TITULO} - ${format(new Date(), "ddMMyyyyHHmmss")}`,
  });
  doc.setLineHeightFactor(1.15);

  const altoLinea = () => doc.getLineHeight() / scale;

  function nextArea(val = 1) {
    yPos += altoLinea() * val;
    if (pageHeight - margins.bottom - 13 <= yPos) {
      doc.addPage();
      yPos = margins.top;
      addTitle();
      nextArea(4);
    }
    return yPos;
  }

  function addText(
    texto: string,
    { x, y, align, fontSize = 15, weight, enter = true }: OpcionesTexto,
  ) {
    doc.setFontSize(fontSize);
    if (weight) {
      doc.setFont("Helvetica", weight);
    } else {
      doc.setFont("Helvetica");
    }
    const ancho = align === "left" ? margins.width - x : margins.width;
    const lineas: string[] = doc.splitTextToSize(texto, ancho);
    doc.text(lineas, x, y, { align, maxWidth: ancho });
    if (enter) {
      nextArea(lineas.length);
    }
  }

  function addBottom() {
    const yPie = pageHeight - margins.bottom;
    doc.setTextColor(GRIS);
    addText(`Generado el ${format(new Date(), "dd-MM-yyyy HH:mm:ss")}`, {
      x: xPos,
      y: yPie + 15,
      align: "left",
      fontSize: 7,
      weight: "normal",
      enter: false,
    });
    addText(`Generado por [${agente.nombre}] en ERPWEB`, {
      x: margins.width + margins.left,
      y: yPie + 15,
      align: "right",
      fontSize: 7,
      weight: "normal",
      enter: false,
    });
    doc.setDrawColor(AZUL_CROPA);
    doc.setFillColor(AZUL_CROPA);
    const lineasPie: string[] = doc.splitTextToSize(PIE_INSTITUCIONAL, margins.width);
    doc.rect(xPos, yPie, margins.width, altoLinea() - lineasPie.length + 2, "F");
    doc.setTextColor("#fff");
    doc.setFontSize(7);
    addText(PIE_INSTITUCIONAL, {
      x: pageWidth / 2,
      y: yPie + altoLinea() + lineasPie.length - 2,
      align: "center",
      fontSize: 7,
      weight: "normal",
      enter: false,
    });
    doc.setTextColor("#000");
  }

  function addTitle() {
    doc.setFont("Helvetica", "bold");
    doc.addImage(logoCropa.src, "PNG", xPos, margins.top + 5, 25 * 6.5, 5 * 6.5);
    nextArea(1);
    xPos = margins.left + 20;

    doc.setTextColor(GRIS_CLARO);
    addText(textoRango(fechaInicio, fechaFin), {
      x: xCabecera,
      y: yPos,
      align: "left",
      fontSize: 10,
      weight: "bold",
      enter: false,
    });
    doc.setTextColor("#000");
    addText(`Página ${page}`, {
      x: margins.width + margins.left,
      y: yPos + 2,
      align: "right",
      fontSize: 10,
      weight: "normal",
    });
    nextArea(0.5);
    addText(agente.nombre, {
      x: xCabecera,
      y: yPos,
      align: "left",
      fontSize: 10,
      weight: "normal",
    });

    if (page === 1) {
      nextArea(0.5);
      addText(TITULO, { x: xPos, y: yPos, align: "left", fontSize: 15, weight: "bold" });
      addText("Datos Colaborador:", {
        x: xPos,
        y: yPos,
        align: "left",
        fontSize: 10,
        weight: "normal",
      });
      addText("• Correo: ", {
        x: xPos,
        y: yPos,
        align: "left",
        fontSize: 8,
        weight: "normal",
        enter: false,
      });
      doc.setTextColor(AZUL_CORREO);
      addText(agente.correo, {
        x: xPos + 40,
        y: yPos,
        align: "left",
        fontSize: 8,
        weight: "normal",
        enter: false,
      });
      nextArea(0.5);
    }

    xPos = margins.left;
    doc.setDrawColor("#000");
    doc.line(xPos, yPos, xPos + margins.width, yPos);
    nextArea(1);
    doc.setFont("Helvetica", "normal");
    addBottom();
    // La cabecera se dibuja en coordenadas propias: el cuerpo arranca bajo ella.
    yPos = margins.top;
    nextArea(page === 1 ? 12.5 : 3);
    page++;
  }

  function addActividad(hora: string, actividad: ActividadReporte) {
    nextArea(0.5);
    doc.setTextColor(GRIS);
    addText(hora, {
      x: xPos + 20,
      y: yPos,
      align: "left",
      fontSize: 8,
      weight: "normal",
      enter: false,
    });
    doc.setTextColor(AZUL_CLIENTE);
    addText(actividad.nombre_cliente.toUpperCase(), {
      x: xPos + 80,
      y: yPos,
      align: "left",
      fontSize: 8,
    });

    nextArea(-0.2);
    doc.setTextColor(GRIS);
    addText("Asunto:", { x: xPos + 80, y: yPos, align: "left", fontSize: 6, enter: false });
    addText(actividad.asunto, { x: xPos + 140, y: yPos, align: "left", fontSize: 6 });

    nextArea(0.2);
    doc.setTextColor(GRIS);
    addText("Descripcion:", { x: xPos + 80, y: yPos, align: "left", fontSize: 6, enter: false });
    addText(actividad.descripcion, { x: xPos + 140, y: yPos, align: "left", fontSize: 6 });

    nextArea(0.2);
    const resultados = jsonSeguro<{ NOM_TIPO?: string }>(actividad.resultado);
    if (resultados.length) {
      for (const resultado of resultados) {
        doc.setTextColor(VERDE);
        addText("Resultado:", { x: xPos + 80, y: yPos, align: "left", fontSize: 6, enter: false });
        addText(resultado.NOM_TIPO ?? "", { x: xPos + 140, y: yPos, align: "left", fontSize: 6 });
      }
    } else {
      doc.setTextColor(VERDE_OSCURO);
      addText("Resultado:", { x: xPos + 80, y: yPos, align: "left", fontSize: 6, enter: false });
      addText("Sin Resultados", { x: xPos + 140, y: yPos, align: "left", fontSize: 6 });
    }
    doc.setTextColor("#000");
    nextArea(0.5);
  }

  addTitle();

  for (const [ano, meses] of agrupar(actividades)) {
    for (const [mes, dias] of meses) {
      for (const [dia, grupo] of dias) {
        addText(`${DIAS_SEMANA[grupo.diaSemana]}, ${dia} de ${MESES[Number(mes) - 1]}, ${ano}`, {
          x: xPos + 20,
          y: yPos,
          align: "left",
          fontSize: 8,
          weight: "bold",
        });
        for (const [hora, lista] of grupo.horas) {
          for (const actividad of lista) {
            addActividad(hora, actividad);
          }
          nextArea(1);
        }
      }
    }
  }

  return doc.output("blob");
}
