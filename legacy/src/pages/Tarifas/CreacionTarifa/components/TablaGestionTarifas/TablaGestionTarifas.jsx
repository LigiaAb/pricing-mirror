import { useState, useRef, useEffect } from "react";
import { Box, Fade, Typography } from "@mui/material";
import PropTypes from "prop-types";
import { api } from "../../../../../api";
import TablaComponent from "../../../../../components/Tabla/TablaEditableComponent";
import ActionAlertComponent from "../../../../../components/Dialog/ActionAlertComponent";
import FormularioTarifa from "../FormularioTarifa/FormularioTarifa";
import useColumnasGestionTarifas from "./hooks/useColumnasGestionTarifas";
import useObtenerOpcionesAcciones from "../../../../../hooks/useObtenerOpcionesAcciones";

const CODS_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2,
};

const COLORES_ESTADOS = {
  [CODS_ESTADOS.ACTIVO]: "green.main",
  [CODS_ESTADOS.INACTIVO]: "red.main",
};

const TablaGestionTarifas = ({ tarifas, setTarifas, tarifaSeleccionada, setTarifaSeleccionada, filtros, catalogos }) => {
  const { rubros = [], tiposServicio = [], tiposAplicacion = [], estados = [] } = catalogos;
  const { permisosArray } = useObtenerOpcionesAcciones();

  const tarifaPorAnularRef = useRef(null);
  const [isOpenConfirmacionAnulacion, setIsOpenConfirmacionAnulacion] = useState(false);
  const [isItCreating, setIsItCreating] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const opcion = permisosArray.find((o) => (o.nivel_opcion === "E" ? o.nom_opcion === "Servicios" : o.nom_opcion === "Tarifas"));
  const puedeCrear = opcion?.acciones?.some((a) => a.nom_accion === "Agregar");
  const puedeAnular = opcion?.acciones?.some((a) => a.nom_accion === "Eliminar");

  const accionesDeTabla = {
    view: true,
    delete: puedeAnular,
  };

  const tarifasConFormatoTabla = tarifas
    .filter(i => !mostrarInactivos ? i.cod_estado === CODS_ESTADOS.ACTIVO : i.cod_estado === CODS_ESTADOS.INACTIVO)
    .map((tarifa) => {
      const rubro = rubros.find((r) => r.cod_rubro === tarifa.cod_rubro);
      const tipoServicio = tiposServicio.find((t) => t.cod_tipo === tarifa.cod_tipo_servicio);
      const tipoAplicacion = tiposAplicacion.find((t) => t.cod_tipo === tarifa.cod_tipo_aplicacion);
      const estado = estados.find((e) => e.cod_estado === tarifa.cod_estado);
      return {
        ...tarifa,
        rubro: rubro?.label,
        tipoServicio: tipoServicio?.label,
        tipoAplicacion: tipoAplicacion?.label,
        estado: estado?.label,
        accionesDeTabla: { view: true, delete: estado.cod_estado !== CODS_ESTADOS.INACTIVO && puedeAnular },
        propiedadesDeTabla: {
          estado: {
            color: COLORES_ESTADOS[tarifa.cod_estado],
          },
        },
      };
    });

  useEffect(() => {
    setIsItCreating(false);
  }, [filtros]);

  const handleInicioNuevaTarifa = () => {
    setTarifaSeleccionada({
      nombre: "",
      siglas: "",
      cod_empresa: filtros?.cod_empresa,
      cod_cc: filtros?.cod_cc,
      cod_tipo_transporte: filtros?.cod_tipo_transporte,
      cod_tipo_servicio: filtros?.cod_tipo_servicio,
      cod_tipo_aplicacion: filtros?.cod_tipo_aplicacion,
      cod_tipo_calculo: filtros?.cod_tipo_calculo,
      entidad_id: filtros?.entidad_id,
      cod_tipo_carga: filtros?.cod_tipo_carga,
      cod_clasificacion_carga: filtros?.cod_clasificacion_carga,
    });
    setIsItCreating(true);
  };

  const handleLimpiezaTarifaSeleccionada = () => {
    setTarifaSeleccionada(null);
    setIsItCreating(false);
  };

  const handleSelectFila = (tarifaConFormatoTabla) => {
    setTarifaSeleccionada(tarifaConFormatoTabla);
    setIsItCreating(false);
  };

  const handleCreacionTarifa = (nuevaTarifa) => {
    setTarifaSeleccionada(nuevaTarifa);
    setTarifas((prev) => [...prev, nuevaTarifa]);
    setIsItCreating(false);
  };

  const handleEdicionTarifa = (tarifa) => {
    setTarifas((prev) => prev.map((t) => (t.cod_servicio === tarifa.cod_servicio ? tarifa : t)));
  };

  const anularTarifa = async () => {
    const tarifaPorAnular = tarifaPorAnularRef.current;
    const baseApiURL = "/api/appweb/actualizar-servicio";
    const response = await api.post(baseApiURL, { ...tarifaPorAnular, cod_estado: CODS_ESTADOS.INACTIVO });
    if (!response.data.data.success) return;
    setTarifas((prev) => prev.map((t) => (t.cod_servicio === tarifaPorAnular.cod_servicio ? { ...t, cod_estado: CODS_ESTADOS.INACTIVO } : t)));
  };

  const handleAnulacionTarifa = (tarifaPorAnular) => {
    tarifaPorAnularRef.current = tarifaPorAnular;
    setIsOpenConfirmacionAnulacion(true);
  };

  const columnasGestionTarifas = useColumnasGestionTarifas();

  const botonesDeTabla = {
    mostrarInactivos: { label: "Mostrar Inactivos", color: "primary", onClick: () => setMostrarInactivos(!mostrarInactivos) },
    limpiar: !!tarifaSeleccionada || isItCreating ? { label: "Limpiar", color: "secondary", onClick: handleLimpiezaTarifaSeleccionada } : undefined,
    add: puedeCrear ? { label: "Nuevo", color: "primary", onClick: handleInicioNuevaTarifa } : undefined,
  };

  return (
    <>
      <TablaComponent
        titulo="Gestión de Tarifas"
        rowKey="cod_servicio"
        encabezados={columnasGestionTarifas}
        data={tarifasConFormatoTabla}
        botones={botonesDeTabla}
        acciones={{ view: true, delete: true }}
        onRowView={(id, tarifa) => handleSelectFila(tarifa)}
        onRowDeleted={(id, tarifaPorAnular) => handleAnulacionTarifa(tarifaPorAnular)}
      // eventosDeTabla={{
      //   view: ({ content: tarifa }) => handleSelectFila(tarifa),
      //   delete: ({ content: tarifaPorAnular }) => handleAnulacionTarifa(tarifaPorAnular),
      // }}
      />

      <Fade in={!!tarifaSeleccionada || isItCreating} timeout={200} unmountOnExit>
        <Box mt={2}>
          <Typography variant="h6">Tarifa {tarifaSeleccionada?.cod_servicio}</Typography>
          <FormularioTarifa
            defaultValues={isItCreating ? filtros : tarifaSeleccionada}
            isItCreating={isItCreating}
            onTarifaCreada={handleCreacionTarifa}
            onTarifaEditada={handleEdicionTarifa}
            catalogos={catalogos}
          />
        </Box>
      </Fade>

      <ActionAlertComponent
        tipo="error"
        content="¿Esta seguro que desea eliminar el registro?"
        openDialog={isOpenConfirmacionAnulacion}
        aceptar={() => {
          anularTarifa();
          setIsOpenConfirmacionAnulacion(false);
        }}
        cancelar={() => {
          setIsOpenConfirmacionAnulacion(false);
          setTarifaSeleccionada(null);
        }}
        handleClose={() => {
          setIsOpenConfirmacionAnulacion(false);
          setTarifaSeleccionada(null);
        }}
      />
    </>
  );
};

TablaGestionTarifas.propTypes = {
  tarifas: PropTypes.array,
  setTarifas: PropTypes.func,
  tarifaSeleccionada: PropTypes.object,
  setTarifaSeleccionada: PropTypes.func,
  filtros: PropTypes.object,
  catalogos: PropTypes.object,
};

export default TablaGestionTarifas;
