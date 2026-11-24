import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment/moment";
import TablaComponent from "../../components/Tabla/TablaComponent";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";

const CODS_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2,
};

const COLORES_ESTADOS = {
  [CODS_ESTADOS.ACTIVO]: "green.main",
  [CODS_ESTADOS.INACTIVO]: "red.main",
};

const TablaRubros = ({ catalogos }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { estados } = catalogos;

  let item = permisosArray.find((i) => i.nom_opcion === "Lista");
  const accionesDeTabla = {
    view: item?.acciones.some((i) => i.cod_accion === 1),
    delete: item?.acciones.some((i) => i.cod_accion === 5),
  };

  const botonesDeTabla = {};
  if (item?.acciones.some((i) => i.cod_accion === 3)) {
    botonesDeTabla.add = { label: "nuevo", color: "primary", onClick: () => navigate(encryptId("new")) };
  }

  const [rubros, setRubros] = useState([]);
  const rubroPorAnularRef = useRef(null);
  const [isOpenConfirmacionAnulacion, setIsOpenConfirmacionAnulacion] = useState(false);

  const rubrosConFomatoTabla = rubros.map(
    (rubro) => {
      const estado = estados.find((e) => e.cod_estado === rubro.cod_estado);
      return {
        ...rubro,
        fechaInicio: moment(rubro.fecha_inicio).format("DD-MM-YYYY HH:mm:ss"),
        fechaFin: rubro.fecha_final ? moment(rubro.fecha_final).format("DD-MM-YYYY HH:mm:ss") : "N/A",
        nombreEstado: estado?.estado_desc,
        accionesDeTabla,
        propiedadesDeTabla: {
          nombreEstado: {
            color: COLORES_ESTADOS[rubro.cod_estado],
          },
        },
      };
    },
    [rubros, estados],
  );

  const columnas = useMemo(
    () => [
      { label: "Rubro", campo: "cod_rubro" },
      { label: "Nombre", campo: "nombre", name: "nombre" },
      { label: "Fecha Inicial", campo: "fechaInicio", name: "fechaInicio" },
      { label: "Fecha Final", campo: "fechaFin", name: "fechaFin" },
      { label: "Estado", campo: "nombreEstado", name: "nombreEstado" },
    ],
    [],
  );

  const obtenerRubros = useCallback(async () => {
    const baseApiURL = "/api/appweb/lista-rubros";
    const response = await api.get(baseApiURL);
    const rubros = response.data.data;
    setRubros(rubros);
  }, []);

  useEffect(() => {
    dispatch(encenderCarga());
    Promise.all([obtenerRubros()]).then(() => {
      dispatch(apagarCarga());
    });
  }, [dispatch, obtenerRubros]);

  const anularRubro = async () => {
    const fecha_final = new Date();

    let baseApiURL = "/api/appweb/actualizar-rubros";
    const rubroPorAnular = rubroPorAnularRef.current;

    const response = await api.post(baseApiURL, {
      ...rubroPorAnular,
      fecha_final: rubroPorAnular.fecha_final || fecha_final,
      cod_estado: CODS_ESTADOS.INACTIVO,
    });
    if (!response.data.data.success) return;

    baseApiURL = "/api/appweb/lista-rubros";
    const responseRubros = await api.get(baseApiURL, { params: { cod_rubro: rubroPorAnular.cod_rubro } });
    const rubro = responseRubros.data.data[0];

    setRubros((prev) => prev.map((r) => (r.cod_rubro === rubro.cod_rubro ? rubro : r)));
  };

  const handleAnulacionRubro = (rubro) => {
    rubroPorAnularRef.current = rubro;
    setIsOpenConfirmacionAnulacion(true);
  };

  return (
    <Box display="flex" flexDirection="column" p={1} m={0} gap={2}>
      <TablaComponent
        titulo="Rubros"
        id="cod_rubro"
        encabezado={columnas}
        datos={rubrosConFomatoTabla}
        botones={botonesDeTabla}
        eventosDeTabla={{
          view: ({ id: cod_rubro }) => navigate(encryptId(cod_rubro)),
          delete: ({ content: rubro }) => handleAnulacionRubro(rubro),
        }}
      />

      <ActionAlertComponent
        tipo="error"
        content="¿Esta seguro que desea eliminar el registro?"
        openDialog={isOpenConfirmacionAnulacion}
        aceptar={() => {
          anularRubro();
          setIsOpenConfirmacionAnulacion(false);
        }}
        cancelar={() => {
          setIsOpenConfirmacionAnulacion(false);
          rubroPorAnularRef.current = null;
        }}
        handleClose={() => {
          setIsOpenConfirmacionAnulacion(false);
          rubroPorAnularRef.current = null;
        }}
      />
    </Box>
  );
};

TablaRubros.propTypes = {
  catalogos: PropTypes.object.isRequired,
};

export default TablaRubros;
