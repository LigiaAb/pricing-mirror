import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
const TablaEmpleado = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos } = props;
  const { estados = [] } = catalogos;
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const encabezados = [
    { name: "cod_empleado", label: "Código", campo: "cod_empleado" },
    { name: "dpi_emp", label: "DPI", campo: "dpi_emp" },
    { name: "nom_empleado", label: "Nombre", campo: "nom_empleado" },
    { name: "apellido_emp", label: "Apellido", campo: "apellido_emp" },
    { name: "sexo_emp", label: "Genero", campo: "sexo_emp", formato: (v) => (v === "M" ? "Maculino" : "Femenino") },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val) => estados.find((e) => val === e.cod_estado)?.estado_desc },
  ];
  const datos = useMemo(() => {
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach((d) => {
        o[d] = {
          color: d === "cod_estado" ? (i.cod_estado === 4 || i.cod_estado === 2 ? "red.main" : "green.main") : undefined,
          bold: d === "cod_estado" ? true : undefined,
        };
      });
      // Refactorizacion de Arreglo segun catalogos
      return {
        /**
         * FORMATO DE ELEMENTO
         */
        ...i,
        url: `${pathname}/${encryptId(i.cod_empleado)}`,
        /**
         * MANEJO DE CATALOGOS POR ELEMENTO
         */
        // Buscar el estado
        estado: estados.find((e) => i.cod_estado === e.cod_estado),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
        accionesDeTabla: {
          add: false,
          view: true,
          go: false,
          copy: false,
          paste: false,
          auth: i.cod_estado == 4,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: i.cod_estado !== 4,
        },
        /**
         * ACCIONES DEL ELEMENTO
         */
        propiedadesDeTabla: o,
      };
    });
  }, [estados, lista]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  const reactivarFila = (fila) => api.post("/api/appweb/actualizar-empleado", { ...fila.content, estado: undefined, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/actualizar-empleado", { ...fila.content, estado: undefined, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de Empleado en modo vista
  const verAFila = (fila, e) => {
    if (fila) {
      if (e.ctrlKey || e.metaKey) {
        // window.open(to, '_blank');
        // Permitir comportamiento nativo (abrir en nueva pestaña)
        return;
      }
      navigate(`${encryptId(`${fila?.id}`)}`);
    }
  };
  // Ir a la vista de Empleado en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_empleado"
        encabezado={encabezados}
        datos={datos}
        // onFilaSeleccionada={(fila) => console.log("select", fila)}
        select={false}
        eventosDeTabla={{
          // add: (fila) => console.log("add", fila),
          // go: (fila) => console.log("view", fila),
          view: verAFila,
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          auth: reactivarFila,
          // edit: editarAFila,
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={{ nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } }}
        multipleSelect
      />
      {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaEmpleado.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  catalogos: PropTypes.object,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaEmpleado;
