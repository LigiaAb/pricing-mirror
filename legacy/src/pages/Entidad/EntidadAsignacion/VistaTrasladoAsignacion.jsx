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
import TransferListsComponent from "../../../components/Lists/TransferListsComponent";
import { useFetchEmpleados } from "@/hooks/Fetch/useFetchConfiguracion";
// import VirtualizedTableComponent from "../../../components/Tabla/VirtualizedTableComponent";

const VistaTrasladoAsignacion = (props) => {
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
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
    usuario1: null,
    usuario2: null,
  });
  const [asignaciones1, setAasignaciones1] = useState([]);
  const [asignaciones2, setAasignaciones2] = useState([]);
  // const [empleados, setEmpleados] = useState([]);
  const [tipos, setTipos] = useState();

  const [open, setOpen] = useState(false);
  const empleados = useFetchEmpleados();
  const dispatch = useDispatch();

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */

  // Realizar la consulta
  const obtenerAsignaciones = useCallback(async () => {
    // const cod_cc = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto")))?.cod_cc;
    const cod_cc = currentCentroCosto?.cod_cc;

    if (data?.usuario1?.value && data?.usuario2?.value) {
      await api
        .get("api/appweb/lista-asignacion-entidad", { params: { cod_cc, cod_usuario: data?.usuario1?.value, cod_estado: 1 } })
        .then(({ data }) =>
          setAasignaciones1(
            data.data.map((asignacion) => ({
              ...asignacion,
              nombre: `${asignacion.nom_tipo} - ${asignacion.nombre_cliente}`,
            }))
          )
        )
        .catch((e) => console.error(e));

      await api
        .get("api/appweb/lista-asignacion-entidad", { params: { cod_cc, cod_usuario: data?.usuario2?.value, cod_estado: 1 } })
        .then(({ data }) =>
          setAasignaciones2(
            data.data.map((asignacion) => ({
              ...asignacion,
              nombre: `${asignacion.nom_tipo} - ${asignacion.nombre_cliente}`,
            }))
          )
        )
        .catch((e) => console.error(e));
    }
  }, [updateData, data?.usuario1, data?.usuario2]);


  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerTipos(), obtenerAsignaciones()]).then(() => dispatch(apagarCarga()));
  }, [obtenerTipos, obtenerAsignaciones, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const groupItems = (list = [], key) => {
    const uniqueItems = new Map();
    list?.forEach((item) => {
      uniqueItems.set(item[key], item);
    });
    return Array.from(uniqueItems.values()) || [];
  };

  const empleados_ = useMemo(() => {
    const cod_cc = currentCentroCosto?.cod_cc;
    if (!!cod_cc) {
      return groupItems(
        empleados.data
          ?.filter((empleado) => empleado.cod_cc == cod_cc)
          ?.map((item) => ({
            ...item,
            value: item.cod_usuario.toString(),
            label: `${item.nom_empleado} ${item.apellido_emp}`,
          })),
        "cod_empleado",
      );
    }
    return [];
  }, [data?.cenco, empleados.data]);



  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        id: "usuario1",
        val: data?.usuario1 || null,
        label: "Asesor 1",
        readonly: false,
        options: empleados_.filter((emp) => emp.value != data?.usuario2?.value),
        size: 6,
      },
      {
        tipo: "select",
        id: "usuario2",
        val: data?.usuario2 || null,
        label: "Asesor 2",
        readonly: false,
        options: empleados_.filter((emp) => emp.value != data?.usuario1?.value),
        size: 6,
      },
    ],
    [data, empleados_]
  );

  function obtenerElementosCambiados(listaInicial, listaFinal) {
    // Obtener elementos en la lista inicial que no estan en la final
    const removidos = listaInicial.filter((item) => !listaFinal.includes(item));
    // Obtener elementos en la lista final que no estan en la inicial
    const anadidos = listaFinal.filter((item) => !listaInicial.includes(item));
    return { removidos, anadidos };
  }

  const trasladarClientes = async (values) => {
    // Cambios en la lista principal
    const traslados = obtenerElementosCambiados(asignaciones1, values);

    // Hacemos una copia de las asignaciones originales que serán anuladas
    const anuladas = [...traslados.anadidos, ...traslados.removidos];

    // Las añadidas pasan de usuario2 -> usuario 1, por lo que cambiamos el cod_usuario al receptor
    const listaAnadidos = traslados.anadidos.map((asignacion) => ({
      ...asignacion,
      cod_usuario: data?.usuario1?.value,
    }));
    // Las removidas son los que pasan de usuario1 -> usuario 2, por lo que cambiamos el cod_usuario al receptor
    const listaRemovidos = traslados.removidos.map((asignacion) => ({
      ...asignacion,
      cod_usuario: data?.usuario2?.value,
    }));

    await api
      .post("api/appweb/trasladar-asignacion-entidad", { asignaciones: [...listaAnadidos, ...listaRemovidos], anuladas })
      .then(({ data }) => setUpdateData(updateData + 1))
      .catch((e) => console.error(e));
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Grid container sx={{ pt: 2 }} display="flex" justifyContent="center">
        <Grid item size={10} sx={{ pb: 1 }}>
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
              // asignar: { visible: true, texto: "Asignar", onClick: asignarClientes, color: "primary" },
            }}
          />
        </Grid>
        {data?.usuario1 && data?.usuario2 && (
          <TransferListsComponent
            listaPrincipal={asignaciones1}
            listaSecundaria={asignaciones2}
            tituloListaPrincipal={data?.usuario1?.label}
            tituloListaSecundaria={data?.usuario2?.label}
            objectLabel="nombre"
            objectValue="cod_asignacion"
            guardarListas={trasladarClientes}
            permitirPasarTodos
            size={12}
            // mostrarBotonGuardar={false}
          />
        )}
      </Grid>
    </Box>
  );
};

export default VistaTrasladoAsignacion;
