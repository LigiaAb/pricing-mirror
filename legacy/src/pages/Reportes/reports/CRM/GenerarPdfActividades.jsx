import React from "react";
// import generarPDFCalendario from "../../utils/GeneradorPDF/_generador_seguimiento_actividades_calendario";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import { api } from "@/api";
import moment from "moment";
import generarPDFCalendario from "@/utils/GeneradorPDF/_generador_seguimiento_actividades_calendario";

const GenerarPdfActividades = () => {
  const informacionDeUsuario = useSelector((state) => state.auth);
  const [fechasReporte, setFechasReporte] = React.useState({ fechaInicio: "", fechaFin: "" });
  const [datos, setDatos] = React.useState([]);
  const [pdf, setPdf] = React.useState(null);

  const obtenerActividadesParaReporte = React.useCallback(async () => {
    await api
      .get("/api/appweb/lista-actividades2", { params: { cod_asesor: informacionDeUsuario?.cod_usuario } })
      .then(({ data }) => setDatos(data.data.map((i) => ({ ...i, nombre_cliente: i.nombre_cliente ?? "" }))));
  }, [informacionDeUsuario]);

  React.useEffect(() => {
    obtenerActividadesParaReporte();
  }, [obtenerActividadesParaReporte]);

  return (
    <div>
      <FormularioComponent
        inputs={[
          { id: "fechaInicio", tipo: "datetime", val: fechasReporte["fechaInicio"], label: "FECHA INICIO" },
          { id: "fechaFin", tipo: "datetime", val: fechasReporte["fechaFin"], label: "FECHA FIN" },
        ]}
        onInput={({ id, val }) => setFechasReporte((v) => ({ ...v, [id]: val }))}
        botones={{
          agregar: { visible: false },
          descargar: {
            texto: "Generar PDF",
            icono: "c-pdf",
            visible: true,
            onClick: () =>
              setPdf(
                generarPDFCalendario({
                  agente: { cod_usuario: informacionDeUsuario?.cod_usuario, usuario: informacionDeUsuario?.usuario, nombre: informacionDeUsuario?.nombre },
                  usuario: informacionDeUsuario?.nombre,
                  fechaInicio: fechasReporte["fechaInicio"],
                  fechaFin: fechasReporte["fechaFin"],
                  bottom: true,
                  datos: datos
                    // .filter((i) => {
                    //   const lista_estados = filtroEstado.filter((estado) => estado.activo).map((estado) => estado.label);
                    //   const lista_tipos = filtroActividades.filter((tipo) => tipo.activo).map((tipo) => tipo.label);

                    //   return lista_estados.includes(i.estado_desc) && lista_tipos.includes(i.nom_tipo);
                    // })
                    .filter((i) => (!fechasReporte["fechaInicio"] ? true : moment(i.fecha_programada).endOf("d").isSameOrAfter(moment(fechasReporte["fechaInicio"]).endOf("d"))))
                    .filter((i) => (!fechasReporte["fechaFin"] ? true : moment(i.fecha_programada).startOf("d").isSameOrBefore(moment(fechasReporte["fechaFin"]).startOf("d")))),
                  titulo: `Calendario de Seguimientos de actividades - ${moment().format("DDMMYYYYHHmmSS")}`,
                  descargar: false,
                }),
              ),
          },
          limpiar: { visible: pdf, texto: "Limpiar pdf", icono: "c-cancelar", color: "error", onClick: () => setPdf(null) },
        }}
      />
      {pdf && <iframe src={pdf} width="100%" height="600" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>}
    </div>
  );
};

export default GenerarPdfActividades;
