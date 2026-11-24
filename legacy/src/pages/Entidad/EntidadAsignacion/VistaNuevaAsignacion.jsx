import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api";
import { decryptId } from "../../../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import FormularioEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/FormularioEntidadAsignacion";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import LoaderComponent from "@/components/Loader/LoaderComponent";
// import VirtualizedTableComponent from "../../../components/Tabla/VirtualizedTableComponent";

const VistaNuevaAsignacion = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE NAVIGATE                                 #
   * # ---------------------------------------------------------------------------- #
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  let { updateData, setUpdateData } = props;
  const [data, setData] = useState({
    fecha_inicio: null,
    fecha_fin: null,
    tipo: null,
  });
  const [empleados, setEmpleados] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [tipos, setTipos] = useState();
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [entidadesSeleccionadas, setEntidadesSeleccionadas] = useState([]);
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const dispatch = useDispatch();
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const [isLoading, setIsLoading] = useState(false);

  const encabezadosEmpleados = [
    // { name: "cod_empleado", label: "Código", campo: "cod_empleado" },
    { name: "nom_empleado", label: "Nombre", campo: "nom_empleado", formato: (val, row) => `${row.content.nom_empleado} ${row.content.apellido_emp}` },
  ];

  const encabezadosClientes = [
    // { name: "cod_empleado", label: "Código", campo: "cod_empleado" },
    { name: "entidad_nombre", label: "Nombre", campo: "entidad_nombre" },
  ];

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */

  // Realizar la consulta
  const obtenerEntidades = useCallback(async () => {
    if (!data?.tipo?.value) return;

    const cod_empresa = currentEmpresa?.cod_empresa;
    const cod_cc = currentCentroCosto?.cod_cc;

    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE"];
    setIsLoading(true)
    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidades-sin-asignacion", { params: { tipo_entidad: tipos_entidades[tipo], datosxpagina: 20000, cod_cc, cod_tipo: data?.tipo.value } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }
    setIsLoading(false)
    setEntidades(lista_entidades);
  }, [updateData, data?.tipo]);
  
  const obtenerEmpleados = useCallback(async () => {

    const cod_empresa = currentEmpresa?.cod_empresa;
    const cod_cc = currentCentroCosto?.cod_cc;
    console.log(cod_empresa, cod_cc)

    await api
      .get("api/appweb/listaemp-usu-puesto", { params: { cod_cc, cod_empresa } })
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEntidades(), obtenerEmpleados(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerEntidades, obtenerEmpleados, obtenerTipos, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const tipos_ = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "ASIGNACION_ENTIDAD")
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo,
          label: tipo.nom_tipo,
        })),
    [data?.cenco, tipos]
  );

  const inputs = useMemo(
    () => [
      {
        tipo: "date",
        id: "fecha_inicio",
        val: data.fecha_inicio || null,
        label: "Fecha Inicio",
        readonly: false,
        requerido: true,
      },
      {
        tipo: "date",
        id: "fecha_fin",
        val: data?.fecha_fin || null,
        label: "Fecha Fin",
        readonly: false,
        requerido: true,
      },
    ],
    [data, tipos_]
  );

  const inputs2 = useMemo(
    () => [
      {
        tipo: "select",
        id: "tipo",
        val: data?.tipo || null,
        label: "Tipo de Asignacion",
        readonly: false,
        options: tipos_,
        size: 12,
      },
    ],
    [data, tipos_]
  );

  const asignarClientes = async () => {
    if (!data?.fecha_fin || !data?.fecha_inicio) {
      setOpen2(true);
      return;
    }

    const cod_emp = currentEmpresa?.cod_empresa;
    const cod_cc = currentCentroCosto?.cod_cc;

    for (let i in entidadesSeleccionadas) {
      try {
        const sendData = {
          cod_usuario: empleadosSeleccionados.cod_usuario,
          cod_cliente: entidadesSeleccionadas[i].entidad_id,
          fecha_final: new Date(data?.fecha_fin),
          fecha_inicial: new Date(data?.fecha_inicio),
          cod_emp,
          cod_cc,
          cod_estado: 1,
          cod_tipo: data?.tipo.value,
        };

        await api
          .post("api/appweb/insertar-asignacion-entidad", sendData)
          .then(({ data }) => setUpdateData(updateData + 1))
          .catch((e) => console.error(e));
      } catch (e) {
        console.error(e);
      }
    }
    setOpen(false);
  };

  return (
    <Box sx={{ p: 1, m: 0 }} position={"relative"}>
      <LoaderComponent open={isLoading} />
      <Grid sx={{ display: "flex", justifyContent: "right", alignContent: "center" }}>
        <Grid item size={6}>
          <FormularioComponent
            inputs={inputs2}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
              // asignar: { visible: true, texto: "Asignar", onClick: asignarClientes, color: "primary" },
            }}
          />
        </Grid>
        <Grid item size={1} sx={{ display: "flex", justifyContent: "center", alignContent: "center", pt: 3, pb: 1 }}>
          <Button variant="contained" onClick={() => setOpen(true)}>
            Asignar
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item size={5}>
          <TablaComponent
            id="cod_empleado"
            titulo={"Empleados"}
            encabezado={encabezadosEmpleados}
            datos={empleados}
            onFilaSeleccionada={(seleccion) => setEmpleadosSeleccionados(seleccion)}
            select={true}
            eventosDeTabla={{}}
            botones={{}}
            // multipleSelect
          />
        </Grid>
        <Grid item size={7}>
          <TablaComponent
            id="entidad_id"
            titulo={"Clientes"}
            encabezado={encabezadosClientes}
            datos={entidades}
            onFilaSeleccionada={(seleccion) => setEntidadesSeleccionadas(seleccion)}
            select={true}
            eventosDeTabla={{}}
            botones={{}}
            multipleSelect
          />
        </Grid>
      </Grid>

      <DialogComponent
        openDialog={open}
        handleClose={() => setOpen()}
        titulo="Asignación de cliente"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "50vw", maxHeight: "50vh" }}>
            <Typography>Seleccione el periodo de asignacion:</Typography>
            <FormularioComponent
              inputs={inputs}
              onInput={({ id, val }) => {
                setData((inp) => ({ ...inp, [id]: val }));
              }}
              botones={{
                agregar: { visible: false, onClick: null },
                cancelar: { visible: false, onClick: null },
                guardar: { visible: false, onClick: null },
                filtrar: { visible: false, onClick: null },
                asignar: { visible: true, texto: "Asignar", onClick: asignarClientes, color: "primary" },
              }}
            />
          </Grid>
        }
      />

      <ActionAlertComponent
        aceptar={() => setOpen2(false)}
        cancelar={() => setOpen2(false)}
        openDialog={open2}
        tipo="warning"
        activarCanecelar={false}
        handleClose={() => setOpen2(false)}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>
              <Typography>{`Es necesario ingresar una fecha de inicio y una de finalización`}</Typography>
            </Grid>
          </Grid>
        }
      />
    </Box>
  );
};

export default VistaNuevaAsignacion;
