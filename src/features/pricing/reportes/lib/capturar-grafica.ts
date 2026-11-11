export type ImagenGrafica = {
  dataUrl: string;
  ancho: number;
  alto: number;
};

/** Captura el SVG de una gráfica ya renderizada. No captura HTML alrededor. */
export function capturarGrafica(
  elemento: HTMLElement | null,
  completado: (imagen: ImagenGrafica) => void,
  fallido: (error: Error) => void,
  escala = 3,
): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      try {
        if (!elemento) throw new Error("No se encontró el contenedor de la gráfica.");

        // Recharts también dibuja los símbolos de la leyenda con pequeños SVG.
        const original = Array.from(
          elemento.querySelectorAll<SVGSVGElement>("svg.recharts-surface"),
        ).find((svg) => !svg.closest(".recharts-legend-wrapper"));
        if (!original) throw new Error("La gráfica no tiene un SVG renderizado.");

        const { width: ancho, height: alto } = original.getBoundingClientRect();
        if (ancho <= 0 || alto <= 0) {
          throw new Error("La gráfica no tiene dimensiones. Debe estar visible antes de exportar.");
        }

        const copia = original.cloneNode(true) as SVGSVGElement;
        const nodosOriginales = [original, ...original.querySelectorAll("*")];
        const nodosCopia = [copia, ...copia.querySelectorAll("*")];
        const propiedades = [
          "color",
          "fill",
          "fill-opacity",
          "stroke",
          "stroke-width",
          "stroke-opacity",
          "stroke-dasharray",
          "stroke-dashoffset",
          "stroke-linecap",
          "stroke-linejoin",
          "opacity",
          "font-family",
          "font-size",
          "font-weight",
          "font-style",
          "letter-spacing",
          "text-anchor",
          "dominant-baseline",
          "visibility",
          "display",
          "paint-order",
          "clip-path",
          "clip-rule",
          "fill-rule",
        ];

        nodosOriginales.forEach((nodo, indice) => {
          const destino = nodosCopia[indice];
          if (!(destino instanceof SVGElement)) return;
          const estilo = getComputedStyle(nodo);
          propiedades.forEach((propiedad) => {
            const valor = estilo.getPropertyValue(propiedad);
            if (valor) {
              // Los clipPath de Recharts deben seguir apuntando al SVG clonado.
              destino.style.setProperty(
                propiedad,
                valor.replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g, "url(#$1)"),
              );
            }
          });
        });

        copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        copia.setAttribute("width", String(ancho));
        copia.setAttribute("height", String(alto));
        copia.setAttribute("viewBox", original.getAttribute("viewBox") ?? `0 0 ${ancho} ${alto}`);
        copia.style.width = `${ancho}px`;
        copia.style.height = `${alto}px`;

        const svg = new XMLSerializer().serializeToString(copia);
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

        const imagen = new Image();
        imagen.onload = () => {
          let resultado: ImagenGrafica;
          try {
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(ancho * escala);
            canvas.height = Math.ceil(alto * escala);
            const contexto = canvas.getContext("2d");
            if (!contexto) throw new Error("No se pudo crear la imagen de la gráfica.");
            contexto.fillStyle = "#ffffff";
            contexto.fillRect(0, 0, canvas.width, canvas.height);
            contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
            resultado = { dataUrl: canvas.toDataURL("image/png"), ancho, alto };
          } catch (error) {
            fallido(error instanceof Error ? error : new Error(String(error)));
            return;
          } finally {
            URL.revokeObjectURL(url);
          }
          completado(resultado);
        };
        imagen.onerror = () => {
          URL.revokeObjectURL(url);
          fallido(new Error("No se pudo convertir la gráfica a imagen."));
        };
        imagen.src = url;
      } catch (error) {
        fallido(error instanceof Error ? error : new Error(String(error)));
      }
    }),
  );
}
