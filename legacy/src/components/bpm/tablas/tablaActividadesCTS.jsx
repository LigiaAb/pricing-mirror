import React, { useEffect, useMemo } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import TablaEditableMod from "./tablaEditableMod";
import { useFetchActividades, getCodUsuarioFromLocalStorage } from "@/hooks/Bpm";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCategoria, setCurrentMenu, setCurrentModulo } from "@/store/slices/menu/menuSlice";
import { encryptId } from "@/api/encryptDecrypt";

const TablaActividadesCTS = ({ embarqueData = null, codAsesor = null, codTipo = 332, lineasVisibles = 6, filtrarPorAsunto = false, onLoadingChange = null }) => {
  const cod_usuario = codAsesor ?? (typeof getCodUsuarioFromLocalStorage === "function" ? getCodUsuarioFromLocalStorage() : null);

  // navegación para ver detalles de la actividad
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCentroCosto } = useSelector((state) => state.menu);

  // Esta tabla se usa dentro de Embarques (CTS/gestion-embarques) pero el "Ver"
  // salta al módulo CRM (actividad). El sidebar de destino lee currentModulo/
  // currentMenu/currentCategoria de Redux (no la URL), así que sin despachar
  // ese contexto aquí el sidebar se queda mostrando las categorías de Embarques
  // sobre la vista de Actividades recién cargada (mismo caso que el botón
  // "Ver documento CTS" en VistaActividadCreada.jsx).
  const navegarAActividad = (cod) => {
    const igual = (a, b) => `${a || ""}`.toLowerCase() === `${b || ""}`.toLowerCase();
    const modulo = (currentCentroCosto?.modulos || []).find((m) => igual(m.modulo_ruta, "/crm"));
    const menu = modulo?.menus?.find((m) => igual(m.menu_ruta, "calendario"));
    const categoria = menu?.categorias?.find((c) => igual(c.ruta_cat, "actividad"));

    if (modulo) dispatch(setCurrentModulo({ modulo }));
    if (menu) dispatch(setCurrentMenu({ menu }));
    if (categoria) dispatch(setCurrentCategoria({ categoria }));

    navigate(`/crm/calendario/actividad/${encryptId(cod)}`);
  };

  const embarqueId = useMemo(
    () => embarqueData?.EMBARQUE_ID || embarqueData?.embarque_id || embarqueData?.id || embarqueData?.embarqueId || null,
    [embarqueData],
  );

  const entidadIdCliente = useMemo(
    () => embarqueData?.ENTIDAD_ID_CLI || embarqueData?.entidad_id_cli || embarqueData?.entidadIdCli || null,
    [embarqueData],
  );

  const { data: actividades = [], isLoading, refetch } = useFetchActividades(
    { cod_asesor: cod_usuario, cod_tipo: codTipo },
    { enabled: Boolean(cod_usuario) },
  );

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const listaFiltrada = useMemo(() => {
    if (!actividades || actividades.length === 0) return [];

    return actividades.filter((a) => {
      // Si existe embarqueId, intentar coincidir con el asunto ([ID]) o con campos compatibles
      if (embarqueId) {
        const asunto = String(a.asunto || a.ASUNTO || "");
        const matchAsuntoOrId = asunto.includes(`[${embarqueId}]`) || String(a.embarque_id || a.EMBARQUE_ID || a.embarqueId || "") === String(embarqueId);
        // Si pedimos filtrar sólo por asunto/embarque_id, devolvemos sólo coincidencias exactas aquí
        if (filtrarPorAsunto) return matchAsuntoOrId;
        if (matchAsuntoOrId) return true;
      }

      // Si existe cliente en el embarque, coincidir por cod_cliente / cliente.entidad_id
      if (entidadIdCliente) {
        if (String(a.cod_cliente || a.COD_CLIENTE || "") === String(entidadIdCliente)) return true;
        const clienteObj = a.cliente || a.CLIENTE || null;
        if (clienteObj && (String(clienteObj.entidad_id || clienteObj.ENTIDAD_ID || clienteObj.entidadId || "") === String(entidadIdCliente))) return true;
      }

      // Si no hay filtro relevante, mantener la actividad (mostrar todas del asesor)
      return !embarqueId && !entidadIdCliente;
    });
  }, [actividades, embarqueId, entidadIdCliente, filtrarPorAsunto]);

  // Normalizar/derivar campos que la UI espera (aseguramos que `asesor`, `cliente_desc` y `fecha_programada_locale` existan)
  const listaParaTabla = useMemo(() => {
    return (listaFiltrada || []).map((a) => {
      const clienteObj = a.cliente || a.CLIENTE || null;
      const clienteDesc =
        a.cliente_desc ||
        a.CLIENTE_DESC ||
        a.nombre_cliente ||
        a.NOMBRE_CLIENTE ||
        clienteObj?.entidad_nombre ||
        clienteObj?.ENTIDAD_NOMBRE ||
        "";

      const asesorNombre =
        a.asesor ||
        a.ASESOR ||
        a.usuario ||
        a.USUARIO ||
        a.nom_empleado ||
        a.NOM_EMPLEADO ||
        "";

      const fechaProgramadaRaw = a.fecha_programada || a.FECHA_PROGRAMADA;
      const fechaProgramada =
        a.fecha_programada_locale ||
        a.FECHA_PROGRAMADA_LOCALE ||
        (fechaProgramadaRaw ? new Date(fechaProgramadaRaw).toLocaleString() : "");

      return {
        ...a,
        asesor: asesorNombre,
        cliente_desc: clienteDesc,
        fecha_programada_locale: fechaProgramada,
        // Asegurar que el botón "Ver" esté disponible (requiere canView=true en TablaComponent)
        accionesDeTabla: {
          ...(a.accionesDeTabla || {}),
          view: true,
        },
      };
    });
  }, [listaFiltrada]);

  // Handler para refrescar manualmente la lista de actividades
  const handleRefresh = async () => {
    if (typeof refetch === "function") await refetch();
  };

  const handleViewActividad = (idOrData, maybeRow) => {
    // TablaEditableComponent llama a eventosDeTabla.view(id, row)
    // Pero desde TablaComponent (no editable) podría pasar directamente el objeto de la fila.
    const actividad = typeof idOrData === "object" ? idOrData : maybeRow || null;
    const cod = typeof idOrData === "string" || typeof idOrData === "number" ? idOrData : actividad?.cod_actividad || actividad?.COD_ACTIVIDAD || actividad?.id;

    if (!cod) {
      console.warn("handleViewActividad: no cod_actividad encontrado en:", idOrData, maybeRow);
      return;
    }

    console.debug("handleViewActividad -> navegando a actividad:", cod);
    navegarAActividad(cod);
  };

  const encabezados = [
    { multiline: false, name: "estado_desc", label: "Estado", campo: "estado_desc" },
    { multiline: false, name: "fecha_programada_locale", label: "Fecha Programada", campo: "fecha_programada_locale" },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Historial</Typography>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
        <TablaEditableMod
          encabezados={encabezados}
          data={listaParaTabla || []}
          rowsPerPage={lineasVisibles}
          idKey="cod_actividad"
          acciones={{ view: true }}
          eventosDeTabla={{ view: handleViewActividad }}
          onRefresh={handleRefresh}
          onRowClick={(id, fila) => {
            const cod = fila?.cod_actividad || fila?.COD_ACTIVIDAD || fila?.id || id;
            if (cod) navegarAActividad(cod);
          }}
        />
      )}
    </Box>
  );
};
export default TablaActividadesCTS;