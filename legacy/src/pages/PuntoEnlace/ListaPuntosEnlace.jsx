import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import TablaComponent from "../../components/Tabla/TablaComponent";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";

const COD_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2,
};

const COLORES_ESTADOS = {
  [COD_ESTADOS.ACTIVO]: "green.main",
  [COD_ESTADOS.INACTIVO]: "red.main",
};

const ListaPuntosEnlaces = ({ nombreTipo }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();

  let item = permisosArray.find((i) => i.nom_opcion === "Lista");
  const accionesDeTabla = {
    view: item?.acciones.some((i) => i.cod_accion === 1),
    edit: item?.acciones.some((i) => i.cod_accion === 2),
    delete: item?.acciones.some((i) => i.cod_accion === 5),
  };

  const botonesDeTabla = {};
  if (item?.acciones.some((i) => i.cod_accion === 3)) {
    botonesDeTabla.add = { label: "nuevo", color: "primary", onClick: () => navigate("crear") };
  }

  const [puntosEnlaces, setPuntosEnlaces] = useState([]);
  const [puntoEnlaceSeleccionado, setPuntoEnlaceSeleccionado] = useState(null);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [isOpenConfirmacionBorrado, setIsOpenConfirmacionBorrado] = useState(false);

  const puntosEnlacesConFomatoTabla = puntosEnlaces.map((puntoEnlace) => {
    const pais = paises.find((pais) => pais.cod_pais === puntoEnlace.cod_pais);
    const estado = estados.find((estado) => estado.cod_estado === puntoEnlace.cod_estado);
    return {
      ...puntoEnlace,
      nombrePais: pais?.nombre_pais,
      nombreEstado: estado?.estado_desc,
      accionesDeTabla,
      propiedadesDeTabla: {
        nombreEstado: {
          color: COLORES_ESTADOS[puntoEnlace.cod_estado],
        },
      },
    };
  });

  const columnas = [
    {
      label: "Nombre",
      campo: "nombre",
      name: "nombre",
    },

    {
      label: "Siglas",
      campo: "codigo",
      name: "codigo",
    },
    {
      label: "Pais",
      campo: "nombrePais",
      name: "nombrePais",
    },
    {
      label: "Estado",
      campo: "nombreEstado",
      name: "nombreEstado",
    },
  ];

  const obtenerPuntosEnlaces = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-punto_enlace";
    const response = await api.get(baseApiURL, { params: { cod_estado: 1 } });
    let puntosEnlaces = response.data.data;
    puntosEnlaces = puntosEnlaces.filter((pe) => pe.tipo_descripcion === nombreTipo);
    setPuntosEnlaces(puntosEnlaces);
  }, [nombreTipo]);

  const obtenerPises = useCallback(async () => {
    const baseApiURL = "api/appweb/listapaises";
    const response = await api.get(baseApiURL);
    const paises = response.data.data;
    setPaises(paises);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const baseApiURL = "/api/appweb/listaestados";
    const response = await api.get(baseApiURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);

  useEffect(() => {
    dispatch(encenderCarga());
    Promise.all([obtenerPuntosEnlaces(), obtenerPises(), obtenerEstados()]).then(() => {
      dispatch(apagarCarga());
    });
  }, [obtenerPuntosEnlaces, obtenerPises, obtenerEstados, dispatch]);

  const borrarPuntoEnlace = async () => {
    const COD_ESTADO_INACTIVO = 2;
    const baseApiURL = "/api/appweb/actualizar-punto_enlace";
    const response = await api.post(baseApiURL, { ...puntoEnlaceSeleccionado, cod_estado: COD_ESTADO_INACTIVO });
    if (!response.data.data.success) return;
    setPuntosEnlaces((prev) => prev.map((pe) => (pe.cod_puntoenlace === puntoEnlaceSeleccionado.cod_puntoenlace ? { ...pe, cod_estado: COD_ESTADO_INACTIVO } : pe)));
  };

  const handleBorrarPuntoEnlace = (puntoEnlace) => {
    setPuntoEnlaceSeleccionado(puntoEnlace);
    setIsOpenConfirmacionBorrado(true);
  };

  return (
    <Box display="flex" flexDirection="column" p={1} m={0} gap={2}>
      <TablaComponent
        titulo={`${nombreTipo}S`}
        id="cod_puntoenlace"
        encabezado={columnas}
        datos={puntosEnlacesConFomatoTabla}
        botones={botonesDeTabla}
        eventosDeTabla={{
          view: ({ id: cod_puntoenlace }) => navigate(encryptId(cod_puntoenlace)),
          edit: ({ id: cod_puntoenlace }) => navigate(`editar/${encryptId(cod_puntoenlace)}`),
          delete: ({ content: puntoEnlace }) => handleBorrarPuntoEnlace(puntoEnlace),
        }}
      />

      <ActionAlertComponent
        tipo="error"
        content="¿Esta seguro que desea eliminar el registro?"
        openDialog={isOpenConfirmacionBorrado}
        aceptar={() => {
          borrarPuntoEnlace();
          setIsOpenConfirmacionBorrado(false);
        }}
        cancelar={() => {
          setIsOpenConfirmacionBorrado(false);
          setPuntoEnlaceSeleccionado(null);
        }}
        handleClose={() => {
          setIsOpenConfirmacionBorrado(false);
          setPuntoEnlaceSeleccionado(null);
        }}
      />
    </Box>
  );
};

ListaPuntosEnlaces.propTypes = {
  nombreTipo: PropTypes.string.isRequired,
};

export default ListaPuntosEnlaces;
