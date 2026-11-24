import React, { useEffect, useMemo, useState, useCallback  } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import { api } from "../../../api";
import { encryptId, decryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import SubirArchivoComponent from "../../../components/Formulario/SubirArchivoComponent";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import FormularioEntidadAsignacion from "./FormularioEntidadAsignacion";
import { useFetchEmpleados } from "@/hooks/Fetch/useFetchConfiguracion";
import { 
  useFetchEmpresas,
  useFetchCentrosCosto,
  useFetchTipos,
  useFetchEstados
 } from "@/hooks/Fetch/useFetchCatalog";

const TablaEntidadAsignacion = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, codTipo, permiteCrear = false, updateData, setUpdateData } = props;
  // const { estados = [] } = catalogos;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados

  const estados = useFetchEstados();
  const tipos = useFetchTipos();
  const empresas = useFetchEmpresas();
  const cencos = useFetchCentrosCosto();
  const empleados = useFetchEmpleados();

  const [entidades, setEntidades] = useState([]);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [open, setOpen] = useState(false);
  const [mostrarLoader, setMostrarLoader] = useState(false);
  const permisosBase = {
    add: false,
    view: false,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  };
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState();
  const [filtro, setFiltro] = useState({});
  const { permisosArray, catalogoArray, catalogoObj, permisosObj } = useObtenerOpcionesAcciones();
  const encabezados = [
    // { name: "entidad_id", label: "Id", campo: "entidad_id" },
    { name: "cod_asignacion", label: "Código", campo: "cod_asignacion" },
    { name: "empleado", label: "Empleado", campo: "empleado" },
    { name: "nombre_cliente", label: "Cliente", campo: "nombre_cliente" },
    { name: "nom_tipo", label: "Tipo Asignacion", campo: "nom_tipo" },
    { name: "fecha_inicial", label: "Fecha Inicio", campo: "fecha_inicial", formato: (val, row) => (row.content.fecha_inicial ? new Date(row.content.fecha_inicial).toLocaleDateString() : "") },
    { name: "fecha_final", label: "Fecha Final", campo: "fecha_final", formato: (val, row) => (row.content.fecha_final ? new Date(row.content.fecha_final).toLocaleDateString() : "") },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val, row) => row.content.estado_desc },
  ];
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Lista");
    return {
      ...permisosBase,
      view: item.acciones.find((i) => i.cod_accion === 1) || item.acciones.find((i) => i.cod_accion === 2),
      delete: item.acciones.find((i) => i.cod_accion === 5),
    };
  };
  const datos = useMemo(() => {
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach(
        (d) =>
          (o[d] = {
            color: d === "cod_estado" ? (i.cod_estado === 1 ? "green.main" : i.cod_estado === 5 ? "orange.main" : "red.main") : undefined,
            bold: undefined,
          })
      );
      return {
        ...i,
        accionesDeTabla: { ...obtenerAccionesSegunPermisos() },
        propiedadesDeTabla: o,
      };
    })
    .filter(i => {
      if(!!filtro.cod_entidad && filtro.cod_entidad != i.cod_entidad) return false
      if(!!filtro.cod_empresa && filtro.cod_empresa != i.cod_empresa) return false
      if(!!filtro.cod_cc && filtro.cod_cc != i.cod_entcod_ccidad) return false
      if(!!filtro.cod_usuario && filtro.cod_usuario != i.cod_usuario) return false
      if(!!filtro.cod_estado && filtro.cod_estado != i.cod_estado) return false
      if(!!filtro.cod_tipo && filtro.cod_tipo != i.cod_tipo) return false
      return true
    });
  }, [lista, filtro]);


  const obtenerEntidades = useCallback(async () => {
      let lista_entidades = [];
      let tipos_entidades = ["CLIENTE"];
  
      for (let tipo in tipos_entidades) {
        await api
          .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo], datosxpagina: 100 } })
          .then(({ data }) => {
            lista_entidades = lista_entidades.concat(data.data.data);
          })
          .catch((e) => console.error(e));
      }
      setEntidades(lista_entidades);
    }, []);
  
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([ obtenerEntidades() ]).then(() => dispatch(apagarCarga()));
  }, [obtenerEntidades, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const eliminarFila = (fila) => api.post("/api/appweb/eliminar-entidad", { ...fila.content, estado: undefined }).then((i) => reConsultar());
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Cliente en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        "/api/appweb/orquestador-recupera-formatos",
        { cod_metodo: "ASIGNACIONES" },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = "downloaded_file";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) fileName = match[1];
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);

      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uploadFile = async () => {
      if (archivo) {
        setMostrarLoader(true);

        const cenco = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto")));
        const empresa = JSON.parse(decryptId(localStorage.getItem("currentEmpresa")));

        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("cod_metodo", "ASIGNACIONES");
        formData.append("cod_empresa", Number(empresa?.cod_empresa));
        formData.append("cod_cc", Number(cenco?.cod_cc));

        await api.post("/api/appweb/orquestador-cargas-masivas", formData).then(({ data }) => data.data.message);

        setArchivo(null);
        setUpdateData(updateData + 1);
        setMostrarLoader(false);
        setOpen(false);
      }
    };
    uploadFile().catch(console.error);
  }, [archivo]);

  const query = (valores) => {
    const {cliente, empresa, cenco, empleado, tipo, estado} = valores
    console.log(tipo)
    setFiltro({
      cod_entidad:  !!cliente ? cliente.entidad_id : undefined,
      cod_empresa:  !!empresa ? empresa.cod_empresa : undefined,
      cod_cc:       !!cenco ? cenco.cod_cc : undefined,
      cod_usuario: !!empleado ? empleado.cod_usuario : undefined,
      cod_estado: !!estado ? estado.cod_estado : undefined,
      cod_tipo: !!tipo ? tipo.cod_tipo : undefined 
    })
  }

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}

      <FormularioEntidadAsignacion 
        asignacion={null} 
        busqueda={true}
        query={query}
        catalogos={{ 
          empresas: empresas.data || [], 
          cencos: cencos.data || [], 
          empleados: empleados.data || [], 
          tipos: tipos.data || [], 
          estados: estados.data || [], 
          entidades,
        }} 
      />

      <TablaComponent
        id="cod_asignacion"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(seleccion) => console.log(seleccion)}
        select={false}
        // expandible
        eventosDeTabla={{
          // add: (fila) => console.log("add", fila),
          // go: (fila) => console.log("view", fila),
          view: verAFila,
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          // auth: reactivarFila,
          // edit: editarAFila,
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={{
          // nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" },
          cargar: {
            label: (
              <>
                Cargar <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-cargar" />
              </>
            ),
            onClick: () => setOpen(true),
            color: "excel",
          },
        }}
        multipleSelect
      />
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="warning"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />

      <DialogComponent
        openDialog={open}
        handleClose={() => setOpen(false)}
        titulo="Carga Masiva"
        children={
          <Grid container sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "20vw", maxHeight: "50vh" }} spacing={1}>
            <Button href="#" onClick={handleDownload} disabled={loading} variant="outlined">
              {loading ? "Descargando..." : "Descargar plantilla"}
            </Button>
            <SubirArchivoComponent
              input={{
                tipo: "archivo",
                label: "Archivo Excel",
                id: "archivo",
                size: 12,
                val: archivo,
                acceptedFiles: ".xls,.xlsx",
              }}
              onInput={(val) => {
                // setValores((v) => ({ ...v, [id]: val }))
                setArchivo(val);
              }}
            />
            {/* <pre>{JSON.stringify(archivo?.name)}</pre> */}
          </Grid>
        }
      />
      <LoaderComponent open={mostrarLoader} texto="CARGANDO ARCHIVO" />
    </Box>
  );
};
TablaEntidadAsignacion.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,

  codTipo: PropTypes.number,

  permiteCrear: PropTypes.bool,

  catalogos: PropTypes.object,
};
export default TablaEntidadAsignacion;
