import moment from "moment";

export const tablas = [
  {
    nombre: `Reporte Historico de actividades`,
    id: "repAct",
    headers: [
      { name: "CODIGO", label: "CODIGO DE ACTIVIDAD", campo: "cod_actividad" },
      { name: "TIPO", label: "TIPO", campo: "nom_tipo", filtrarSiMultiplesValores: true },
      // { name: "ASUNTO", label: "ASUNTO", campo: "asunto" },
      { name: "ASESOR", label: "ASESOR", campo: "asesor", filtrarSiMultiplesValores: true },
      { name: "CLIENTE", label: "CLIENTE", campo: "nombre_cliente" },
      { name: "ESTADO", label: "ESTADO.", campo: "estado_desc" },
      { name: "FECHA DE PROGRAMACION", label: "FECHA DE PROGRAMACION", campo: "fecha_creada_locale" },
      { name: "FECHA DE EJECUCION", label: "FECHA DE EJECUCION", campo: "fecha_programada_locale" },
      { name: "OBJETIVO", label: "OBJETIVO", campo: "objetivo_actividad_desc" },
      // { name: "DESCRIPCION", label: "DESCRIPCIÓN", campo: "descripcion" },
      { name: "NO RESULTADO", label: "NO RESULTADO", campo: "resultado_cod_actividad" },
      { name: "TIPO RESULTADO", label: "TIPO RESULTADO", campo: "resultado_nom_tipo" },
      { name: "COMENTARIOS", label: "COMENTARIOS", campo: "resultado_descripcion" },
      { name: "FECHA REPROGRAMACION", label: "FECHA REPROGRAMACION", campo: "resultado_fecha_programada_locale" },
    ],
    props: {
      styles: {
        columns: {
          "ESTADO.": {
            fontColorFn: (val, row) => {
              // CALCULADO BASADO EN LA FECHA EN QUE SE CREO
              const fecha = moment(row["FECHA DE PROGRAMACION"].dato, "DD/MM/YYYY");
              // BASADO EN LA FECHA DE PROGRAMACION
              // const fecha = moment(row["FECHA DE EJECUCION"].dato, "DD/MM/YYYY");
              const yaPasoSemana = moment().isAfter(fecha.clone("DD/MM/YYYY").add(7, "days"));

              if (val === "EN PROCESO" && yaPasoSemana) return "b30000";
            },
          },
        },
      },
    },
  },
  {
    nombre: `Planificacion de actividades`,
    id: "repAct",
    headers: [
      // { name: "CODIGO", label: "CODIGO DE ACTIVIDAD", campo: "cod_actividad" },
      { name: "TIPO", label: "TIPO", campo: "nom_tipo", filtrarSiMultiplesValores: true },
      // { name: "ASUNTO", label: "ASUNTO", campo: "asunto" },
      { name: "ASESOR", label: "ASESOR", campo: "asesor", filtrarSiMultiplesValores: true },
      { name: "CLIENTE", label: "CLIENTE", campo: "nombre_cliente" },
      // { name: "ESTADO", label: "ESTADO.", campo: "estado_desc" },
      { name: "FECHA DE PROGRAMACION", label: "FECHA DE PROGRAMACION", campo: "fecha_creada_locale" },
      { name: "FECHA DE EJECUCION", label: "FECHA DE EJECUCION", campo: "fecha_programada_locale" },
      { name: "OBJETIVO", label: "OBJETIVO", campo: "objetivo_actividad_desc" },
      // { name: "DESCRIPCION", label: "DESCRIPCIÓN", campo: "descripcion" },
      // { name: "NO RESULTADO", label: "NO RESULTADO", campo: "resultado_cod_actividad" },
      // { name: "TIPO RESULTADO", label: "TIPO RESULTADO", campo: "resultado_nom_tipo" },
      // { name: "COMENTARIOS", label: "COMENTARIOS", campo: "resultado_descripcion" },
      // { name: "FECHA REPROGRAMACION", label: "FECHA REPROGRAMACION", campo: "resultado_fecha_programada_locale" },
    ],
    props: {
      styles: {
        columns: {
          "ESTADO.": {
            fontColorFn: (val, row) => {
              // CALCULADO BASADO EN LA FECHA EN QUE SE CREO
              const fecha = moment(row["FECHA DE PROGRAMACION"].dato, "DD/MM/YYYY");
              // BASADO EN LA FECHA DE PROGRAMACION
              // const fecha = moment(row["FECHA DE EJECUCION"].dato, "DD/MM/YYYY");
              const yaPasoSemana = moment().isAfter(fecha.clone("DD/MM/YYYY").add(7, "days"));

              if (val === "EN PROCESO" && yaPasoSemana) return "b30000";
            },
          },
        },
      },
    },
  },
];
