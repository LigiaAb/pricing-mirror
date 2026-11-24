import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography, List, ListItem, ListItemText, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import EditableDataGridComponent from "../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

const TablaEditableCampanas = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */

  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  const { campana, lista = [], reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, currentDate = null, updateData, setUpdateData } = props;
  const {
    tipos = [],
    cencos = [],
    paises = [],
    configs = [],
    estados = [],
    ciudades = [],
    empresas = [],
    empleados = [],
    entidades = [],
    industrias = [],
    tratamientos = [],
    temperamentos = [],
    identificaciones = [],
  } = catalogos;

  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [listaAProcesar, setListaAProcesar] = useState(lista || []);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const permisosBase = {
    ver: false,
    editar: false,
    eliminar: false,
    guardar: false,
  };
  const { permisosArray } = useObtenerOpcionesAcciones();
  const [contactos, setContactos] = useState([]);
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
  const [mensajeCamposFaltantes, setMensajeCamposFaltantes] = useState("Los campos requeridos para registrar una fila no se han llenado");

  const [data, setData] = useState(null);

  const encabezados = useMemo(
    () => [
      {
        field: "entidad_nombre",
        headerName: "Cliente",
        editable: false,
        type: "text",
        minWidth: 110,
      },
      {
        field: "pais_codigo",
        headerName: "Pais",
        editable: false,
        type: "text",
        // minWidth: 110,
      },
      {
        field: "encargado",
        headerName: "Encargado",
        editable: true,
        type: "select",
        labelOption: "label",
        valueOption: "value",
        valueOptions: [],
        getValueOptions: ({ id, field, row }) => {
          const empleados_entidad = row?.empleados ? JSON.parse(row.empleados) : [];
          // console.log(empleados_entidad)
          return empleados_entidad.map((empleado) => ({
            ...empleado,
            value: empleado.USUARIO_ID,
            label: `${empleado.EMPLEADO_NOMBRES} ${empleado.EMPLEADO_APELLIDOS}`,
          }));
        },
        minWidth: 130,
      },
      {
        field: "seleccionar",
        headerName: "Seleccionar",
        editable: true,
        type: "boolean",
        // width: 120
      },
    ],
    [filaSeleccionada, lista, configs, empleados, entidades, contactos]
  );

  const datos = useMemo(() => {
    return listaAProcesar.map((i) => {
      return {
        ...i,
      };
    });
  }, [listaAProcesar, filaSeleccionada, identificaciones, entidades, contactos]);

  const obtenerAccionesSegunPermisos = () => {
    return {
      ...permisosBase,
      editar: true,
      guardar: true,
      eliminar: true,
    };
  };

  const objetoBase = useMemo(() => ({}), []);

  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

  const eliminarFila = useCallback(
    async (row) => {
      console.log(row);
      setListaAProcesar((lista) => lista.filter((fila) => fila.entidad_id != row.entidad_id));
    },
    [reConsultar]
  );
  const guardar = useCallback(
    async (row) => {
      setFilaSeleccionada((val) => ({
        ...val,
        row,
      }));
      setListaAProcesar((lista) =>
        lista.map((old_row) => {
          return old_row.entidad_id !== row.id ? old_row : row;
        })
      );
    },
    [reConsultar, configs, currentDate]
  );
  const agregar = useCallback(
    async (row) => {
      console.log("agregar", row);
    },
    [reConsultar, configs, currentDate]
  );
  const crearActividades = useCallback(
    async (row) => {
      for (let i in listaAProcesar) {
        if (!listaAProcesar[i].seleccionar) {
          continue;
        }

        const sendData = {
          fecha_programada: new Date(campana.fecha_fin),
          asunto: `ACTIVIDAD ${new Date(campana.fecha_fin).toLocaleDateString()} - ${listaAProcesar[i].entidad_nombre} (CAMPAÑA #${campana.cod_campana})`,
          descripcion: `ACTIVIDAD ${new Date(campana.fecha_fin).toLocaleDateString()} - ${listaAProcesar[i].entidad_nombre} (CAMPAÑA #${campana.cod_campana})`,
          cod_tipo: campana.tipo_actividad,
          cod_cliente: listaAProcesar[i].entidad_id,
          cod_emp: campana.cod_emp,
          cod_cc: campana.cod_cc,
          cod_asesor: listaAProcesar[i].encargado?.USUARIO_ID || null,
          contactos: [],
          cod_estado: 23,
          cod_campana: campana.cod_campana,
        };

        api.post("api/appweb/insertar-actividad", sendData).then(({ data }) => {
          if (data.data.mensaje == "Actividad creada correctamente") {
            console.log(data.data);
          }
        });
      }
      setUpdateData((updateData) => updateData + 1);
    },
    [data, listaAProcesar]
  );

  const onInput = async (row) => {
    const { field, id, value } = row;
    console.log(field, id, value);
  };

  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Grid container sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button variant="contained" onClick={crearActividades}>
          Asignar actividades
          <Typography className="c-asignacion" sx={{ ml: 1 }} />
        </Button>
      </Grid>

      <EditableDataGridComponent
        alwaysSave
        encabezados={encabezados}
        datos={datos}
        idKey="unique_id"
        onAddRow={(row) => {
          setListaAProcesar((lista) => [
            ...lista,
            {
              ...row,
              ...objetoBase,
              cod_actividad: row.id,
              id: row.id,
              cod_estado: 1,
            },
          ]);
          setFilaSeleccionada((val) => ({
            ...(val || {}),
            row: { ...objetoBase, ...row },
          }));
        }}
        onDeleteRow={(row) => {
          if (listaAProcesar.some((i) => i.entidad_id === row.id)) eliminarFila(row.row);
        }}
        onInput={onInput}
        onEdditRow={(row) => setFilaSeleccionada(row)}
        onRowSave={async (row) => {
          if (lista.some((i) => i.entidad_id === row.id)) {
            await guardar({
              ...row.row,
            });
          }
        }}
        columnasAExtender={[0]}
        objetoBase={objetoBase}
        acciones={obtenerAccionesSegunPermisos()}
        filaSeleccionada={verAFila} // BOTON DE OJO
        textoAlertaEliminacion="¿Desea remover esta entidad?"
        alertaEliminar={false}
        // botones={{
        //   asignar: { label: "Asignar", color: "primary", onClick: null},
        // }}
      />

      <ActionAlertComponent
        aceptar={() => {
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"Para registrar un resultado es necesario ingresar por lo menos una descripción y una fecha de seguimiento."}
      />

      <ActionAlertComponent
        aceptar={() => {
          setMostrarFaltantes(false);
        }}
        cancelar={() => {
          setMostrarFaltantes(false);
        }}
        openDialog={mostrarFaltantes}
        tipo="warning"
        activarCanecelar={false}
        handleClose={() => {
          setMostrarFaltantes(false);
        }}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>
              <Typography>{`Para registrar un resultado se necesitan los siguientes campos:`}</Typography>
            </Grid>
            <List dense sx={{ my: 0, p: 0 }}>
              {mensajeCamposFaltantes}
            </List>
          </Grid>
        }
      />
    </Box>
  );
};
TablaEditableCampanas.propTypes = {
  //   tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   // LISTA DE DATOS
  //   lista: PropTypes.array,
  //   // CATALOGOS
  //   estados: PropTypes.array,
  //   // EVENTOS
  //   reConsultar: PropTypes.func,
  //   //CATALOGOS
  //   catalogos: PropTypes.object,
  //   obtenerFilaSeleccionada: PropTypes.func,
};
export default TablaEditableCampanas;
