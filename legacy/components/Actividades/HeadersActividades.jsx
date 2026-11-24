import { Grid, Typography } from "@mui/material";
import { colores_actividad, colores_estados, iconos_actividad } from "../../theme/colores_actividad";

export const tabla_actividades = {
  titulo: "Actividades",
  id: "cod_actividad",
  headers: [
    { multiline: false, name: "cod_actividad", label: "Codigo", campo: "cod_actividad" },
    { multiline: false, name: "nom_tipo", label: "Tipo", campo: "nom_tipo" },
    { multiline: false, name: "asunto", label: "Asunto", campo: "asunto" },
    { multiline: false, name: "asesor", label: "Asesor", campo: "asesor" },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    { multiline: false, name: "fecha_programada_locale", label: "Fecha Programada", campo: "fecha_programada_locale" },
  ],
};

export const tabla_actividades_delegadas = {
  titulo: "Actividades",
  id: "cod_actividad",
  headers: [
    { multiline: false, name: "cod_actividad", label: "Codigo", campo: "cod_actividad" },
    { multiline: false, name: "nom_tipo", label: "Tipo", campo: "nom_tipo" },
    { multiline: false, name: "asunto", label: "Asunto", campo: "asunto" },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    { multiline: false, name: "fecha_programada_locale", label: "Fecha Programada", campo: "fecha_programada_locale" },
  ],
};

export const tabla_actividades_oportunidades = {
  titulo: "Actividades",
  id: "actividad_id",
  headers: [
    { multiline: false, name: "actividad_id", label: "Id", campo: "actividad_id" },
    { multiline: false, name: "desc_actividad", label: "Actividad", campo: "desc_actividad" },
    // { multiline:false,name: "pais.nombre_pais", label: "Pais", campo: "pais.nombre_pais", },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    { multiline: false, name: "asesor", label: "Asesor", campo: "asesor" },
    { multiline: false, name: "estado", label: "Estado", campo: "estado" },
    { multiline: false, name: "fecha", label: "Fecha", campo: "fecha" },
  ],
};

export const tabla_actividades_reporte = {
  titulo: "Actividades",
  id: "actividad_id",
  headers: [
    // { multiline: false, name: "cod_actividad", label: "Codigo", campo: "cod_actividad" },
    { multiline: false, name: "nom_tipo", label: "Tipo", campo: "nom_tipo" },
    // { multiline: false, name: "asunto", label: "Asunto", campo: "asunto" },
    { multiline: false, name: "asesor", label: "Asesor", campo: "asesor" },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    // { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    // { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    { multiline: false, name: "fecha_creada_locale", label: "Fecha de Programacion", campo: "fecha_programada_locale" },
    { multiline: false, name: "fecha_programada_locale", label: "Fecha de Ejecucion", campo: "fecha_programada_locale" },
    { multiline: false, name: "objetivo_actividad_desc", label: "Objetivo", campo: "objetivo_actividad_desc" },
    // {
    //   name: "resultado_cod_actividad",
    //   label: "No. Resultado",
    //   campo: "resultado_cod_actividad",
    //   formato: (v, content) => (content?.resultado ? (v ? v : "Resultado Final") : ""),
    // },
    // { multiline: false, name: "resultado_nom_tipo", label: "Tipo de Resultado", campo: "resultado_nom_tipo", multilinea: true },
    // { multiline: false, name: "resultado_descripcion", label: "Comentarios", campo: "resultado_descripcion", multilinea: true },
    // { multiline: false, name: "resultado_fecha_programada_locale", label: "Fecha de Reprogramacion", campo: "resultado_fecha_programada_locale", multilinea: true },
  ],
};

export const tabla_actividades_reporte_2 = {
  titulo: "Actividades",
  id: "actividad_id",
  headers: [
    { multiline: false, name: "cod_actividad", label: "Codigo", campo: "cod_actividad" },
    { multiline: false, name: "nom_tipo", label: "Tipo", campo: "nom_tipo" },
    // { multiline: false, name: "asunto", label: "Asunto", campo: "asunto" },
    { multiline: false, name: "asesor", label: "Asesor", campo: "asesor" },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    // { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    { multiline: false, name: "fecha_creada_locale", label: "Fecha de Programacion", campo: "fecha_programada_locale" },
    { multiline: false, name: "fecha_programada_locale", label: "Fecha de Ejecucion", campo: "fecha_programada_locale" },
    { multiline: false, name: "objetivo_actividad_desc", label: "Objetivo", campo: "objetivo_actividad_desc" },
    {
      name: "resultado_cod_actividad",
      label: "No. Resultado",
      campo: "resultado_cod_actividad",
      formato: (v, content) => (content?.resultado ? (v ? v : "Resultado Final") : ""),
    },
    { multiline: false, name: "resultado_nom_tipo", label: "Tipo de Resultado", campo: "resultado_nom_tipo", multilinea: true },
    { multiline: false, name: "resultado_descripcion", label: "Comentarios", campo: "resultado_descripcion", multilinea: true },
    { multiline: false, name: "resultado_fecha_programada_locale", label: "Fecha de Reprogramacion", campo: "resultado_fecha_programada_locale", multilinea: true },
  ],
};

export const tabla_campanas = {
  titulo: "Actividades",
  id: "cod_actividad",
  headers: [
    { multiline: false, name: "cod_actividad", label: "Id", campo: "cod_actividad" },
    // { multiline:false,name: "descripcion", label: "Actividad", campo: "descripcion", },
    { multiline: false, name: "nombre_cliente", label: "Cliente", campo: "nombre_cliente" },
    { multiline: false, name: "nombre_asesor", label: "Asesor", campo: "nombre_asesor" },
    { multiline: false, name: "estado_res", label: "Estado", campo: "estado_res" },
  ],
};

export const tabla_calendario = {
  titulo: "",
  id: "cod_actividad",
  headers: [
    { multiline: false, name: "cod_actividad", label: "#", campo: "cod_actividad" },
    {
      multiline: false,
      name: "estado_desc",
      label: " ",
      campo: "estado_desc",
      formato: (i, row) => {
        return (
          <Grid container direction="row" alignItems="center" gap={2} justifyContent="center" wrap="nowrap">
            <Typography variant="span" className={iconos_actividad[row.nom_tipo]} sx={{ color: colores_actividad[row.nom_tipo], p: 0, m: 0, fontSize: "1vw !important" }} />
            <Typography variant="span" className="c-radio-button" sx={{ color: colores_estados[row.estado_desc], p: 0, m: 0, fontSize: "1vw !important" }} />
          </Grid>
        );
      },
    },
    { multiline: true, name: "asunto", label: "Asunto", campo: "asunto" },
    { multiline: false, name: "cliente_desc", label: "Cliente", campo: "cliente_desc" },
    // { multiline: false, name: "fecha_programada_locale", label: "Fecha", campo: "fecha_programada_locale" },
  ],
};
