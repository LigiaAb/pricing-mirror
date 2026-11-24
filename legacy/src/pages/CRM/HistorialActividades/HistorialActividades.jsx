import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import { api } from "@/api";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { useFetchEmpUsuPuesto } from "@/hooks/Fetch/useFetchConfiguracion";
import { useFetchCentrosCosto, useFetchEmpresas } from "@/hooks/Fetch/useFetchCatalog";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "Fecha inválida";

  return d.toLocaleString("es-GT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function ordenarActividades(lista) {
  return [...lista].sort((a, b) => {
    const nivelA = Number(a.nivel) || 0;
    const nivelB = Number(b.nivel) || 0;

    if (nivelA !== nivelB) return nivelA - nivelB;

    const fechaA = new Date(a.fecha_programada || a.fecha_creada || 0).getTime();
    const fechaB = new Date(b.fecha_programada || b.fecha_creada || 0).getTime();

    return fechaA - fechaB;
  });
}

function prepararArbolActividades(actividades) {
  const lista = Array.isArray(actividades) ? actividades : [];

  const actual = lista.find((item) => Number(item.nivel) === 0) || null;
  const pasado = ordenarActividades(lista.filter((item) => Number(item.nivel) < 0));
  const futuro = ordenarActividades(lista.filter((item) => Number(item.nivel) > 0));

  const hijosPorPadre = futuro.reduce((acc, item) => {
    const padreId = item.actividad_padre_id;

    if (padreId == null) return acc;

    if (!acc[padreId]) acc[padreId] = [];
    acc[padreId].push(item);

    return acc;
  }, {});

  Object.keys(hijosPorPadre).forEach((padreId) => {
    hijosPorPadre[padreId] = ordenarActividades(hijosPorPadre[padreId]);
  });

  return {
    actual,
    pasado,
    hijosPorPadre,
  };
}

function ActividadCard({ actividad, destacada = false, onSeleccionar }) {
  const asesorNombre = actividad?.asesor ? `${actividad.asesor.nom_empleado || ""} ${actividad.asesor.apellido_emp || ""}`.trim() : "";

  const handleClick = () => {
    if (!actividad?.cod_actividad) return;
    onSeleccionar?.(actividad.cod_actividad, actividad);
  };

  const renderizarItem = (title, text) => (
    <Grid size={1} container wrap="nowrap" columnSpacing={1}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {title}:
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          // whiteSpace: "nowrap",
        }}
      >
        {text ?? "—"}
      </Typography>
    </Grid>
  );

  return (
    <Card
      elevation={destacada ? 5 : 1}
      onClick={handleClick}
      sx={{
        minWidth: 260,
        maxWidth: 360,
        borderRadius: 3,
        border: "1px solid",
        borderColor: destacada ? "primary.main" : "divider",
        backgroundColor: destacada ? "action.hover" : "background.paper",
        cursor: "pointer",
        transition: "all 0.18s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" useFlexGap flexWrap="wrap">
            <Typography
              variant={destacada ? "h6" : "subtitle1"}
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                flex: 1,
                minWidth: 0,
                wordBreak: "break-word",
              }}
            >
              {actividad.asunto || "Sin asunto"}
            </Typography>

            <Chip label={actividad.estado_desc || "Sin estado"} size="small" color={destacada ? "primary" : "default"} variant={destacada ? "filled" : "outlined"} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {actividad.descripcion || "Sin descripción"}
          </Typography>

          <Grid container columns={2} columnSpacing={3} rowSpacing={0.5}>
            {renderizarItem("Código", actividad.cod_actividad)}
            {renderizarItem("Tipo", actividad.nom_tipo || "—")}
            {renderizarItem("Cliente", actividad.nombre_cliente)}
            {renderizarItem("Asesor", asesorNombre)}
            {renderizarItem("Creada", formatearFecha(actividad.fecha_creada))}
            {renderizarItem("Programada", formatearFecha(actividad.fecha_programada))}
            {renderizarItem("Padre", actividad.actividad_padre_id || "—")}
            {/* {renderizarItem("Comentario", actividad.comentario || "—")} */}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PasadoLineal({ items, onSeleccionar }) {
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No hay historial anterior.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} alignItems="center">
      {items.map((actividad, index) => (
        <React.Fragment key={actividad.cod_actividad}>
          <ActividadCard actividad={actividad} onSeleccionar={onSeleccionar} />

          {index < items.length - 1 && (
            <Box
              sx={{
                width: 28,
                height: 2,
                bgcolor: "divider",
                borderRadius: 99,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Stack>
  );
}

function NodoFuturo({ actividad, hijosPorPadre, onSeleccionar }) {
  const hijos = hijosPorPadre[actividad.cod_actividad] || [];

  return (
    <Stack spacing={2} alignItems="center">
      <ActividadCard actividad={actividad} onSeleccionar={onSeleccionar} />

      {hijos.length > 0 && (
        <>
          <Box
            sx={{
              width: 2,
              height: 28,
              bgcolor: "divider",
              borderRadius: 99,
            }}
          />

          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" justifyContent="center" alignItems="flex-start">
            {hijos.map((hijo) => (
              <Box
                key={hijo.cod_actividad}
                sx={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <NodoFuturo actividad={hijo} hijosPorPadre={hijosPorPadre} onSeleccionar={onSeleccionar} />
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

function FuturoArbol({ actual, hijosPorPadre, onSeleccionar }) {
  if (!actual) {
    return (
      <Typography variant="body2" color="text.secondary">
        No se encontró la actividad base.
      </Typography>
    );
  }

  const hijosRaiz = hijosPorPadre[actual.cod_actividad] || [];

  if (!hijosRaiz.length) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No hay actividades futuras relacionadas.
      </Typography>
    );
  }

  return (
    <Stack spacing={2} alignItems="center">
      <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" justifyContent="center" alignItems="flex-start">
        {hijosRaiz.map((hijo) => (
          <NodoFuturo key={hijo.cod_actividad} actividad={hijo} hijosPorPadre={hijosPorPadre} onSeleccionar={onSeleccionar} />
        ))}
      </Stack>
    </Stack>
  );
}

export function CronologiaActividades({ actividades = [], onSeleccionar }) {
  const { actual, pasado, hijosPorPadre } = React.useMemo(() => {
    return prepararArbolActividades(actividades);
  }, [actividades]);

  const totalSiguientes = actividades.filter((actividad) => actividad.nivel > 0).length;
  const totalPasados = actividades.filter((actividad) => actividad.nivel < 0).length;

  return (
    <Box sx={{ width: "100%", overflowX: "auto", p: 2 }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={4} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="center">
        <Box sx={{ minWidth: 320, flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontWeight: 700 }}>
            Anteriores ({totalPasados})
          </Typography>

          <PasadoLineal items={pasado} onSeleccionar={onSeleccionar} />
        </Box>

        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            width: 36,
            height: 2,
            bgcolor: "primary.main",
            borderRadius: 99,
          }}
        />

        <Box
          sx={{
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ textAlign: "center", fontWeight: 700 }}>
            Actividad actual
          </Typography>

          {actual ? (
            <ActividadCard actividad={actual} destacada onSeleccionar={onSeleccionar} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No se encontró la actividad consultada.
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: { xs: "none", lg: "block" },
            width: 36,
            height: 2,
            bgcolor: "primary.main",
            borderRadius: 99,
          }}
        />

        <Box sx={{ minWidth: 320, flex: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontWeight: 700 }}>
            Siguientes ({totalSiguientes})
          </Typography>

          <FuturoArbol actual={actual} hijosPorPadre={hijosPorPadre} onSeleccionar={onSeleccionar} />
        </Box>
      </Stack>
    </Box>
  );
}

const HistorialActividades = () => {
  const [cod_actividad_input, setCodActividadInput] = React.useState(null);
  const [cod_actividad, setCodActividad] = React.useState(cod_actividad_input);
  const [datos, setDatos] = React.useState([]);
  const [cargando, setCargando] = React.useState(false);
  const [verTree, setVerTree] = React.useState(false);

  const empleadosFetch = useFetchEmpUsuPuesto();
  useFetchEmpresas();
  const centroCostoFetch = useFetchCentrosCosto();

  const data = React.useMemo(
    () =>
      datos
        .map((actividad) => ({
          ...actividad,
          asesor: empleadosFetch.data.find((e) => e.cod_usuario === actividad.cod_asesor) || {},
          centro_costo: centroCostoFetch.data.find((e) => e.cod_centro_costo === actividad.cod_centro_costo) || {},
          accionesDeTabla: { view: actividad.cod_actividad !== cod_actividad },
        }))
        .reduce((acc, actividad, ind, arr) => {
          const unHijo = arr.find((a) => a.actividad_padre_id === actividad.cod_actividad);

          if (unHijo) {
            const acct = { ...actividad, comentario: unHijo.descripcion };
            acc.push(acct);
          } else acc.push(actividad);

          return acc;
        }, [])
        .sort((a, b) => b.cod_actividad - a.cod_actividad),
    [datos, empleadosFetch.data, centroCostoFetch.data, cod_actividad],
  );

  const obtenerActividadesRelacionadas = React.useCallback(
    async (codigo = cod_actividad) => {
      try {
        setCargando(true);

        const { data } = await api.get("/api/appweb/lista-actividades-historico", {
          params: { cod_actividad: codigo },
        });

        setDatos(data?.data || []);
      } finally {
        setCargando(false);
      }
    },
    [cod_actividad],
  );

  const handleInputChange = (datosInput) => {
    setCodActividadInput(datosInput.val ? Number(datosInput.val) : 0);
  };

  const handleBuscar = React.useCallback(() => {
    setCodActividad(cod_actividad_input);
    obtenerActividadesRelacionadas(cod_actividad_input);
  }, [cod_actividad_input, obtenerActividadesRelacionadas]);

  const handleSeleccionarActividad = React.useCallback(
    async (codigoSeleccionado) => {
      if (!codigoSeleccionado) return;

      setCodActividad(codigoSeleccionado);
      setCodActividadInput(codigoSeleccionado);
      await obtenerActividadesRelacionadas(codigoSeleccionado);
    },
    [obtenerActividadesRelacionadas],
  );

  const encabezados = [
    { id: "cod_actividad", label: "Actividad" },
    { id: "nom_tipo", label: "Tipo" },
    { id: "asunto", label: "Asunto", multilinea: false },
    { id: "asesor", label: "Asesor", multilinea: false, formato: (val) => `${val.nom_empleado} ${val.apellido_emp}` },
    { id: "nombre_cliente", label: "Cliente", multilinea: false },
    { id: "descripcion", label: "Descripcion" },
    { id: "actividad_padre_id", label: "Padre" },
    { id: "estado_desc", label: "Estado" },
    { id: "fecha_programada", label: "Fecha programada", formato: (val) => formatearFecha(val) },
  ];

  return (
    <Box sx={{ px: 2, m: 0, padding: { xs: 1, md: 2 } }}>
      <FormularioComponent
        data={{ inputs: [{ id: "cod_actividad", label: "Actividad", tipo: "number", val: cod_actividad_input }] }}
        onInput={handleInputChange}
        botonesIzquierda
        botonesDerecha={false}
        botones={{ agregar: { texto: cargando ? "Buscando..." : "Buscar", icono: "c-lupa", onClick: handleBuscar } }}
      />
      <TablaEditableComponent
        rowKey="cod_actividad"
        data={data}
        encabezados={encabezados}
        onRowView={(id) => {
          handleSeleccionarActividad(id);
        }}
        acciones={{ view: verTree }}
        botones={{ verArbol: { label: verTree ? "Ocultar Arbol de Actividades" : "Ver Arbol de Actividades", onClick: () => setVerTree((v) => !v) } }}
      />
      {verTree ? <CronologiaActividades actividades={data} onSeleccionar={handleSeleccionarActividad} /> : null}

      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
    </Box>
  );
};

export default HistorialActividades;

ActividadCard.propTypes = {
  actividad: PropTypes.shape({
    cod_actividad: PropTypes.number.isRequired,
    asunto: PropTypes.string,
    descripcion: PropTypes.string,
    fecha_creada: PropTypes.string,
    fecha_programada: PropTypes.string,
    cod_tipo: PropTypes.number,
    nom_tipo: PropTypes.string,
    cod_cliente: PropTypes.number,
    nombre_cliente: PropTypes.string,
    cod_emp: PropTypes.number,
    cod_cc: PropTypes.number,
    cod_estado: PropTypes.number,
    estado_desc: PropTypes.string,
    cod_asesor: PropTypes.number,
    cod_campana: PropTypes.number,
    cod_documento: PropTypes.number,
    cod_objetivo_actividad: PropTypes.number,
    objetivo_actividad_desc: PropTypes.string,
    actividad_padre_id: PropTypes.number,
    nivel: PropTypes.number,
    comentario: PropTypes.string,

    asesor: PropTypes.shape({
      cod_puesto: PropTypes.number,
      cod_empleado: PropTypes.number,
      nom_empleado: PropTypes.string,
      apellido_emp: PropTypes.string,
      sexo_emp: PropTypes.string,
      dpi_emp: PropTypes.string,
      cod_usuario: PropTypes.number,
      usuario: PropTypes.string,
      cod_estado: PropTypes.number,
      estado_desc: PropTypes.string,
      puesto_desc: PropTypes.string,
      cod_emp: PropTypes.number,
      cod_cc: PropTypes.number,
      nombre_emp: PropTypes.string,
      nombre_cc: PropTypes.string,
      usuemppue_default: PropTypes.string,
    }),

    centro_costo: PropTypes.shape({
      cod_cc: PropTypes.number,
      cod_empresa_cc: PropTypes.number,
      nombre_cc: PropTypes.string,
      nombre_emp: PropTypes.string,
      cod_cropa: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.number,
    }),
  }).isRequired,
  destacada: PropTypes.bool,
  onSeleccionar: PropTypes.func,
};

PasadoLineal.propTypes = {
  items: PropTypes.arrayOf(ActividadCard.propTypes.actividad).isRequired,
  onSeleccionar: PropTypes.func,
};

NodoFuturo.propTypes = {
  actividad: ActividadCard.propTypes.actividad,
  hijosPorPadre: PropTypes.objectOf(PropTypes.arrayOf(ActividadCard.propTypes.actividad)).isRequired,
  onSeleccionar: PropTypes.func,
};

FuturoArbol.propTypes = {
  actual: ActividadCard.propTypes.actividad,
  hijosPorPadre: PropTypes.objectOf(PropTypes.arrayOf(ActividadCard.propTypes.actividad)).isRequired,
  onSeleccionar: PropTypes.func,
};

CronologiaActividades.propTypes = {
  actividades: PropTypes.arrayOf(ActividadCard.propTypes.actividad),
  onSeleccionar: PropTypes.func,
};
