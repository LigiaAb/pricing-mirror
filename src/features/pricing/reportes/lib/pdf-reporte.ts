import { jsPDF } from "jspdf";
import { autoTable, type CellInput } from "jspdf-autotable";
import { capturarGrafica } from "./capturar-grafica";

// Recurso público insertado directamente por jsPDF; no se importa ni se carga con Promise.
const LOGO_URL = "/images/logo-cropa-dsv-1024x205.png";
type ValorTexto = string | number | boolean | null | undefined;
/** Formato de celdas del legacy: conserva dato, moneda, alineación y color ARGB. */
export type CeldaReporte = {
  dato: ValorTexto;
  formato?: { tipo?: "dolar" | "quetzal" | "moneda"; moneda?: string; [key: string]: unknown };
  alignFormat?: {
    horizontal?: "left" | "center" | "right" | "justify";
    vertical?: "top" | "middle" | "bottom";
  };
  textFormat?: { color?: { argb?: string } };
  colSpan?: number;
  rowSpan?: number;
};
export type Celda = ValorTexto | CeldaReporte;
type ValorEncabezado = ValorTexto | { nombre?: ValorTexto; label?: ValorTexto; title?: ValorTexto };
/** Admite la matriz nueva o los objetos de datos de una tabla del legacy. */
type TablaPdf = { nombre?: string } & (
  | { columnas: string[]; filas: Celda[][]; datos?: never }
  | { datos: Record<string, Celda>[]; columnas?: never; filas?: never }
);
const texto = (valor: ValorTexto): string => (valor == null ? "" : String(valor));
function celdaFormateada(valor: Celda): valor is CeldaReporte {
  return valor !== null && typeof valor === "object";
}
function simboloMoneda(celda: Celda): string {
  if (!celdaFormateada(celda)) return "";
  if (celda.formato?.tipo === "dolar") return "$";
  if (celda.formato?.tipo === "quetzal") return "Q";
  if (celda.formato?.tipo === "moneda") return celda.formato.moneda ?? "";
  return "";
}
/**
 * Elementos que se pueden imprimir solos o dentro de una columna de una fila.
 * - titulo: texto ajustado al ancho disponible.
 * - tabla: acepta columnas/filas o datos del legacy; conserva formato por celda.
 * - texto: recupera peso, alineación, tamaño, subrayado y enter de addText.
 * - grafica: SVG de Recharts convertido a imagen. ancho es un porcentaje del
 *   espacio disponible (100 por defecto); altoMaximo está expresado en puntos.
 * - leyenda: cuadros de color y textos, distribuidos horizontalmente.
 */
type BloqueSimple =
  | { tipo: "titulo"; texto: string }
  | ({ tipo: "tabla" } & TablaPdf)
  | {
      tipo: "texto";
      texto: string;
      weight?: "normal" | "bold" | "italic" | "bolditalic";
      align?: "left" | "center" | "right";
      fontSize?: number;
      underline?: boolean;
      enter?: boolean;
    }
  | { tipo: "grafica"; elemento: HTMLElement | null; ancho?: number; altoMaximo?: number }
  | { tipo: "leyenda"; entradas: Array<{ texto: string; color: string }> };

/**
 * El array contenido define el orden de impresión: basta mover los bloques.
 * fila coloca bloques simples al lado, con anchos iguales o porcentajes que
 * sumen 100. No admite filas anidadas. espacio y pagina controlan la separación.
 */
export type BloquePdf =
  | BloqueSimple
  | { tipo: "fila"; columnas: Array<BloqueSimple | BloqueSimple[]>; anchos?: number[] }
  | { tipo: "espacio"; alto: number }
  | { tipo: "pagina" };

export type ReportePdf = {
  /** Título común que se repite en el encabezado de las páginas. */
  titulo: string;
  /** Nombre del documento; este generador lo registra como título del PDF. */
  archivo: string;
  /** true: carta horizontal. Por defecto: carta vertical. */
  horizontal?: boolean;
  /** Campos bajo el encabezado inicial: período, empresa, centro de costo, etc. */
  header?: Record<string, ValorEncabezado>;
  /** Bloques del reporte, en el orden en que deben dibujarse. */
  contenido?: BloquePdf[];
  /** Tablas del legacy: se imprimen antes de contenido. Para intercalarlas, usa bloques tabla. */
  tablas?: TablaPdf[];
  /** Opciones del legacy para tamaño, propiedades y pie. El hook conserva la salida del documento. */
  tamaño?: string | [number, number];
  propiedades?: Parameters<jsPDF["setProperties"]>[0];
  bottom?: boolean;
  /** Margen lateral en puntos (50 por defecto); no modifica los márgenes verticales. */
  margen?: number;
  /** La utiliza usePdfReporte para descargar o abrir el documento; aquí no se procesa. */
  salida?: "descargar" | "visualizar";
};

/**
 * Construye el PDF y entrega la instancia de jsPDF mediante completado.
 * No descarga ni abre ventanas: esas acciones corresponden a usePdfReporte.
 *
 * @param opciones Formato común y lista de bloques del reporte.
 * @param completado Se ejecuta cuando todos los bloques, incluidas las gráficas,
 * están dibujados. Recibe el documento listo para guardar o convertir a Blob.
 * @param fallido Recibe los errores de creación, captura o dibujo.
 *
 * Todas las coordenadas y alturas están en puntos (72 puntos = 1 pulgada).
 * El ancho de una gráfica y los anchos de una fila son porcentajes.
 * La función devuelve void: la captura de imágenes termina por eventos del
 * navegador, por lo que el documento está disponible dentro de completado.
 */
export function generarPdfReporte(
  opciones: ReportePdf,
  completado: (doc: jsPDF) => void,
  fallido: (error: Error) => void,
): void {
  try {
    const doc = new jsPDF({
      orientation: opciones.horizontal ? "landscape" : "portrait",
      unit: "pt",
      format: opciones.tamaño ?? "letter",
    });
    doc.setProperties({ title: opciones.archivo, ...opciones.propiedades });
    doc.setLineHeightFactor(1.15);
    const margen = opciones.margen ?? 50;
    const anchoPagina = doc.internal.pageSize.getWidth();
    // Reserva inferior: 40 puntos para el pie y 13 de separación con el contenido.
    const limite = doc.internal.pageSize.getHeight() - 53;
    const anchoUtil = anchoPagina - margen * 2;
    // Separación horizontal entre columnas; se descuenta antes de repartir sus anchos.
    const separacion = 14;
    // Evita dibujar dos veces el encabezado/pie cuando AutoTable vuelve a visitar una página.
    const paginas = new Set<number>();
    // Normaliza cualquier excepción para que fallido siempre reciba una instancia de Error.
    const error = (causa: unknown) =>
      fallido(causa instanceof Error ? causa : new Error(String(causa)));

    /**
     * Dibuja el formato común una sola vez por página y restaura la fuente base.
     * Devuelve la coordenada Y donde puede empezar el cuerpo de esa página.
     * Aquí se modifica el diseño compartido del logo, título, número y pie.
     */
    function encabezado(): number {
      const numero = doc.getCurrentPageInfo().pageNumber;
      if (!paginas.has(numero)) {
        paginas.add(numero);
        doc.setTextColor("#000000");
        doc.setDrawColor("#000000");
        // Logo de 195 x 39 puntos; las coordenadas siguientes pertenecen a esta plantilla.
        doc.addImage(LOGO_URL, "PNG", margen - 19.6, 20, 195, 39);
        const xTitulo = margen - 19.6 + 202.8;
        doc.line(xTitulo, 56.4, anchoPagina - margen, 56.4);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(15);
        doc.text(
          doc.splitTextToSize(opciones.titulo, anchoPagina - margen - xTitulo),
          xTitulo,
          47.6,
        );
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Página ${numero}`, anchoPagina - margen, 49.6, { align: "right" });
        // bottom permite desactivar el pie. El formato actual lo mantiene por defecto.
        if (opciones.bottom !== false) {
          doc.setFontSize(7);
          doc.setFillColor("#00205b");
          doc.rect(
            margen,
            doc.internal.pageSize.getHeight() - 40,
            anchoUtil,
            doc.getLineHeight() + 6,
            "F",
          );
          doc.setTextColor("#ffffff");
          doc.text(
            "- CROPA DSV 2024 -",
            anchoPagina / 2,
            doc.internal.pageSize.getHeight() - 40 + doc.getLineHeight(),
            { align: "center" },
          );
        }
      }
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#000000");
      return 59 + doc.getLineHeight() * 2;
    }

    // Inicio vertical reutilizado por las páginas de continuación de las tablas.
    const inicioPagina = encabezado();
    // Cursor vertical del cuerpo: cada bloque indica en qué posición termina.
    let y = inicioPagina;
    /** Agrega una página con el formato común y devuelve su posición inicial. */
    function nuevaPagina(): number {
      doc.addPage();
      return encabezado();
    }
    /**
     * Si la altura solicitada no cabe desde posicion, inicia otra página.
     * Devuelve la posición a usar; no modifica por sí misma el cursor global y.
     * No divide el elemento ni comprueba que su altura quepa en una página vacía.
     */
    function espacio(posicion: number, alto: number): number {
      return posicion + alto > limite ? nuevaPagina() : posicion;
    }
    // Captura también errores ocurridos después, dentro de los callbacks de imagen.
    // El try exterior solo cubre la ejecución inmediata de generarPdfReporte.
    function continuar(accion: () => void): void {
      try {
        accion();
      } catch (causa) {
        error(causa);
      }
    }

    // Campos informativos iniciales. Se calcula la etiqueta más ancha para alinear
    // todos los valores en una segunda columna; los textos largos ocupan varias líneas.
    const campos = Object.entries(opciones.header ?? {});
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    const anchoEtiquetas = Math.max(
      0,
      ...campos.map(([campo]) => doc.getTextWidth(campo.toUpperCase())),
    );
    for (const [campo, valor] of campos) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      const contenido =
        valor !== null && typeof valor === "object"
          ? (valor.nombre ?? valor.label ?? valor.title)
          : valor;
      const lineas = doc.splitTextToSize(
        texto(contenido),
        anchoUtil - anchoEtiquetas - 6,
      ) as string[];
      const alto = Math.max(1, lineas.length) * doc.getLineHeight() + doc.getLineHeight() / 2;
      y = espacio(y, alto);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(campo.toUpperCase(), margen, y);
      doc.setFont("Helvetica", "normal");
      doc.text(lineas, margen + anchoEtiquetas + 6, y);
      y += alto;
    }

    /**
     * Dibuja un bloque simple dentro del rectángulo disponible.
     * x y posicion son su esquina inicial; ancho es el espacio horizontal asignado.
     * listo(finalY) permite continuar justo debajo del bloque, incluso si una tabla
     * cambió de página o una gráfica terminó de capturarse más tarde.
     */
    function dibujar(
      bloque: BloqueSimple | BloqueSimple[],
      x: number,
      posicion: number,
      ancho: number,
      listo: (finalY: number) => void,
    ): void {
      if (Array.isArray(bloque)) {
        const miniBloques: BloqueSimple[] = bloque;
        function siguienteMiniBloque(indice: number, finalY: number): void {
          const miniBloque = miniBloques[indice];
          if (!miniBloque) {
            listo(finalY);
            return;
          }
          dibujar(miniBloque, x, finalY, ancho, (siguienteY) =>
            continuar(() => siguienteMiniBloque(indice + 1, siguienteY)),
          );
        }
        siguienteMiniBloque(0, posicion);
        return;
      }
      doc.setTextColor("#000000");
      doc.setFont("Helvetica", "normal");
      // Título de sección: ajusta el texto y reserva la altura de todas sus líneas.
      if (bloque.tipo === "titulo") {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        const lineas = doc.splitTextToSize(bloque.texto, ancho) as string[];
        const alto = lineas.length * doc.getLineHeight() + 8;
        posicion = espacio(posicion, alto);
        // espacio() puede haber creado una página y restaurado la fuente base.
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.text(lineas, x, posicion + 12);
        listo(posicion + alto);
        return;
      }
      // Texto del legacy: peso, alineación, tamaño, subrayado y avance opcional.
      // Cada línea puede continuar en otra página sin cambiar el orden de los bloques.
      if (bloque.tipo === "texto") {
        const size = bloque.fontSize ?? 15;
        const align = bloque.align ?? "left";
        doc.setFont("Helvetica", bloque.weight ?? "normal");
        doc.setFontSize(size);
        const lineas = doc.splitTextToSize(bloque.texto, ancho) as string[];
        const altoLinea = doc.getLineHeight();
        const yInicial = posicion;
        const paginaInicial = doc.getCurrentPageInfo().pageNumber;
        for (const linea of lineas) {
          posicion = espacio(posicion, altoLinea);
          doc.setFont("Helvetica", bloque.weight ?? "normal");
          doc.setFontSize(size);
          const origen = align === "center" ? x + ancho / 2 : align === "right" ? x + ancho : x;
          doc.text(linea, origen, posicion, { align });
          if (bloque.underline) {
            const longitud = doc.getTextWidth(linea);
            const inicio =
              align === "center"
                ? origen - longitud / 2
                : align === "right"
                  ? origen - longitud
                  : origen;
            doc.setDrawColor("#000000");
            doc.line(inicio, posicion + 1, inicio + longitud, posicion + 1);
          }
          posicion += altoLinea;
        }
        // enter:false conserva la Y inicial, igual que addText(..., enter=false).
        listo(
          bloque.enter === false
            ? doc.getCurrentPageInfo().pageNumber === paginaInicial
              ? yInicial
              : inicioPagina
            : posicion,
        );
        return;
      }
      // AutoTable administra el alto real y los saltos internos de la tabla.
      if (bloque.tipo === "tabla") {
        // La tabla puede llegar como objetos del legacy o como columnas y filas explícitas.
        const primera = bloque.datos?.[0];
        const columnas = bloque.columnas ?? Object.keys(primera ?? {});
        const filas =
          bloque.filas ?? (bloque.datos ?? []).map((fila) => columnas.map((campo) => fila[campo]));
        if (!filas.length) {
          listo(posicion);
          return;
        }
        if (bloque.nombre) {
          posicion = espacio(posicion, 24);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          const lineas = doc.splitTextToSize(bloque.nombre.toUpperCase(), ancho) as string[];
          doc.text(lineas, x, posicion);
          posicion += lineas.length * doc.getLineHeight() + 5;
        }
        posicion = espacio(posicion, 35);
        let finalY = posicion;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        const monedas = new WeakMap<object, string>();
        const body: CellInput[][] = filas.map((fila) =>
          fila.map((valor): CellInput => {
            if (!celdaFormateada(valor))
              return {
                content: texto(valor),
                styles: { halign: "left", cellPadding: 3, textColor: "#000000" },
              };
            const contenido = texto(valor.dato);
            const moneda = simboloMoneda(valor);
            const argb = valor.textFormat?.color?.argb?.replace(/^#/, "");
            // ARGB usa 8 dígitos; jsPDF recibe RGB, sin el canal alfa inicial.
            const color = argb ? `#${argb.length === 8 ? argb.slice(2) : argb}` : "#000000";
            const entrada: CellInput = {
              content: contenido,
              ...(valor.colSpan !== undefined ? { colSpan: valor.colSpan } : {}),
              ...(valor.rowSpan !== undefined ? { rowSpan: valor.rowSpan } : {}),
              styles: {
                halign: valor.alignFormat?.horizontal ?? "left",
                valign: valor.alignFormat?.vertical ?? "top",
                textColor: color,
                cellWidth: valor.formato
                  ? doc.getTextWidth(contenido) + 5 + (moneda ? doc.getTextWidth(moneda) + 8 : 0)
                  : "wrap",
                cellPadding: moneda
                  ? { top: 3, right: 3, bottom: 3, left: doc.getTextWidth(moneda) + 8 }
                  : 3,
              },
            };
            if (moneda) monedas.set(entrada, moneda);
            return entrada;
          }),
        );
        autoTable(doc, {
          startY: posicion,
          tableWidth: ancho,
          head: [columnas],
          body,
          margin: { left: x, right: anchoPagina - x - ancho, top: inicioPagina, bottom: 53 },
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
          headStyles: { fillColor: "#aaaaaa", textColor: "#000000", fontSize: 9 },
          // Repite la plantilla en las páginas nuevas sin duplicarla en las existentes.
          willDrawPage: () => {
            encabezado();
          },
          // Conserva el símbolo a la izquierda y el dato con su alineación original.
          // La celda original de AutoTable conserva su símbolo aunque tenga colSpan/rowSpan.
          didDrawCell: ({ section, cell }) => {
            if (section !== "body" || cell.raw === null || typeof cell.raw !== "object") return;
            const moneda = monedas.get(cell.raw);
            if (!moneda) return;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.text(moneda, cell.x + 5, cell.getTextPos().y);
          },
          // Conserva la Y final de la última página de la tabla.
          didDrawPage: ({ cursor }) => {
            if (cursor) finalY = cursor.y;
          },
        });
        listo(finalY + 10);
        return;
      }
      // Leyenda horizontal: avanza en X, salta de fila al llenarse y de página si hace falta.
      if (bloque.tipo === "leyenda") {
        // cursorX marca el siguiente elemento; altoFila guarda el más alto de la fila actual.
        let cursorX = x;
        let altoFila = 0;
        for (const entrada of bloque.entradas) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          // Reserva 16 puntos para el cuadro y la separación; admite textos de varias líneas.
          const lineas = doc.splitTextToSize(entrada.texto, ancho - 16) as string[];
          const anchoEntrada = Math.min(
            ancho,
            Math.max(...lineas.map((linea) => doc.getTextWidth(linea)), 0) + 16,
          );
          const altoEntrada = Math.max(9, lineas.length * doc.getLineHeight());
          // La entrada no cabe al lado: continúa debajo de la fila anterior.
          if (cursorX > x && cursorX + anchoEntrada > x + ancho) {
            posicion += altoFila + 6;
            cursorX = x;
            altoFila = 0;
          }
          // La entrada tampoco cabe verticalmente: continúa en una página nueva.
          if (posicion + altoEntrada > limite) {
            posicion = nuevaPagina();
            cursorX = x;
            altoFila = 0;
          }
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor("#000000");
          doc.setFillColor(entrada.color);
          doc.rect(cursorX, posicion, 8, 8, "F");
          doc.text(lineas, cursorX + 16, posicion + 8);
          // Separa esta entrada de la siguiente y conserva la altura máxima de la fila.
          cursorX += anchoEntrada + 14;
          altoFila = Math.max(altoFila, altoEntrada);
        }
        listo(posicion + altoFila + 8);
        return;
      }

      // Las otras variantes ya retornaron: el bloque restante es una gráfica.
      // capturarGrafica obtiene solo el SVG; título y leyenda son bloques separados.
      // La captura termina mediante callback, sin exigir async/await al reporte.
      capturarGrafica(
        bloque.elemento,
        (imagen) =>
          continuar(() => {
            const porcentaje = bloque.ancho ?? 100;
            if (porcentaje <= 0 || porcentaje > 100)
              throw new Error("El ancho de la gráfica debe estar entre 0 y 100.");
            // Calcula el tamaño dentro de la página o columna conservando la proporción original.
            let anchoImagen = (ancho * porcentaje) / 100;
            let altoImagen = (anchoImagen * imagen.alto) / imagen.ancho;
            // El alto máximo reduce ambas dimensiones; no estira ni recorta la gráfica.
            if (bloque.altoMaximo !== undefined) {
              if (bloque.altoMaximo <= 0)
                throw new Error("El alto máximo debe ser mayor que cero.");
              const escala = Math.min(1, bloque.altoMaximo / altoImagen);
              anchoImagen *= escala;
              altoImagen *= escala;
            }
            posicion = espacio(posicion, altoImagen + 10);
            // Una gráfica indivisible que supera una página completa requiere un tamaño menor.
            if (altoImagen > limite - inicioPagina - 10) {
              throw new Error(
                "La gráfica supera el alto útil de una página. Usa altoMaximo o una gráfica más ancha en pantalla.",
              );
            }
            // Centra horizontalmente la imagen dentro del ancho asignado al bloque.
            doc.addImage(
              imagen.dataUrl,
              "PNG",
              x + (ancho - anchoImagen) / 2,
              posicion,
              anchoImagen,
              altoImagen,
            );
            listo(posicion + altoImagen + 10);
          }),
        error,
      );
    }

    /**
     * Procesa contenido secuencialmente. No avanza hasta que el bloque actual
     * llame a listo; así se respeta el orden aunque haya capturas por eventos.
     */
    // La propiedad tablas conserva el formato de entrada del legacy.
    // Los bloques nuevos siguen permitiendo intercalar libremente texto, tablas y gráficas.
    const contenido: BloquePdf[] = [
      ...(opciones.tablas ?? []).map((tabla): BloquePdf => ({ tipo: "tabla", ...tabla })),
      ...(opciones.contenido ?? []),
    ];
    function siguiente(indice: number): void {
      const bloque = contenido[indice];
      if (!bloque) {
        // No quedan bloques: entrega el documento al consumidor o al hook.
        completado(doc);
        return;
      }
      // Salto solicitado explícitamente por el reporte.
      if (bloque.tipo === "pagina") {
        y = nuevaPagina();
        siguiente(indice + 1);
        return;
      }
      // Separación solicitada en puntos; puede provocar un salto de página.
      if (bloque.tipo === "espacio") {
        y = espacio(y, bloque.alto) + bloque.alto;
        siguiente(indice + 1);
        return;
      }
      // Un bloque fuera de una fila dispone de todo el ancho útil de la página.
      if (bloque.tipo !== "fila") {
        dibujar(bloque, margen, y, anchoUtil, (finalY) =>
          continuar(() => {
            y = finalY;
            siguiente(indice + 1);
          }),
        );
        return;
      }
      // La fila distribuye bloques independientes desde la misma página y posición Y.
      const columnas = bloque.columnas;
      if (!columnas.length) {
        siguiente(indice + 1);
        return;
      }
      // Sin anchos explícitos, reparte el espacio equitativamente entre las columnas.
      const porcentajes = bloque.anchos ?? columnas.map(() => 100 / columnas.length);
      if (
        porcentajes.length !== columnas.length ||
        porcentajes.some((valor) => !Number.isFinite(valor) || valor <= 0) ||
        Math.abs(porcentajes.reduce((total, valor) => total + valor, 0) - 100) > 0.001
      ) {
        throw new Error("Los anchos de la fila deben ser positivos y sumar 100.");
      }
      // Los porcentajes se aplican después de descontar las separaciones entre columnas.
      const disponible = anchoUtil - separacion * (columnas.length - 1);
      if (disponible <= 0) throw new Error("La fila contiene demasiadas columnas.");
      y = espacio(y, 35);
      // Guarda el origen común y el extremo más lejano alcanzado por cualquier columna.
      const paginaInicio = doc.getCurrentPageInfo().pageNumber;
      const yInicio = y;
      let paginaFinal = paginaInicio;
      let yFinal = y;
      /**
       * Dibuja las columnas una a una, restaurando su origen común.
       * Al terminar la fila, el siguiente bloque continúa en la página más avanzada
       * y debajo de la columna más larga que haya terminado en esa página.
       */
      function columna(indiceColumna: number): void {
        const actual = columnas[indiceColumna];
        if (!actual) {
          doc.setPage(paginaFinal);
          y = yFinal;
          siguiente(indice + 1);
          return;
        }
        // Una tabla anterior pudo añadir páginas; la siguiente columna vuelve al origen de la fila.
        doc.setPage(paginaInicio);
        const ancho = (disponible * (porcentajes[indiceColumna] ?? 0)) / 100;
        // La posición X depende del espacio consumido por las columnas anteriores y sus separaciones.
        const anteriores = porcentajes
          .slice(0, indiceColumna)
          .reduce((total, valor) => total + valor, 0);
        const x = margen + (disponible * anteriores) / 100 + indiceColumna * separacion;
        dibujar(actual, x, yInicio, ancho, (finalY) =>
          continuar(() => {
            // Compara primero la página y después la Y: coordenadas de páginas distintas no son comparables.
            const pagina = doc.getCurrentPageInfo().pageNumber;
            if (pagina > paginaFinal) {
              paginaFinal = pagina;
              yFinal = finalY;
            } else if (pagina === paginaFinal) yFinal = Math.max(yFinal, finalY);
            columna(indiceColumna + 1);
          }),
        );
      }
      columna(0);
    }
    // Inicia el recorrido una vez creado el encabezado y los campos informativos.
    siguiente(0);
  } catch (causa) {
    fallido(causa instanceof Error ? causa : new Error(String(causa)));
  }
}
