import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { api } from "@/api";
import FormularioAlternativo from "@/components/bpm/Formularios/FormularioAlternativo";
import {
  useFetchPaises,
  useFetchEmpresas,
  useFetchEstados,
  useFetchPaisesPublico,
  useFetchCiudadesPublico,
  useFetchIndustriasPublico,
} from "@/hooks/Bpm";
import { useFetchCiudades, useFetchIndustrias } from "@/hooks/Fetch/useFetchCatalog";
import { useFetchEntidadPaises } from "@/hooks/Fetch/useFetchEntidades";

const PAIS_RELACION_ESTADO_ACTIVO = 11;
const PAIS_RELACION_ESTADO_INACTIVO = 2;

const NuevaEntidad = (props) => {
  const { tipo, onCreate, mode = "create", initialData = null, hidePaisesAsociados = false, apiMode = "private" } = props;
  const isPublic = apiMode === "public";

  // Catálogos privados (requieren sesión autenticada).
  const { data: paisesPrivado = [] } = useFetchPaises();
  const { data: ciudadesPrivado = [] } = useFetchCiudades();
  const { data: industriasPrivado = [] } = useFetchIndustrias();
  const { data: empresas = [] } = useFetchEmpresas();
  const { data: estados = [] } = useFetchEstados();

  // Catálogos públicos (vista cliente sin sesión): usan el token público en
  // vez del token de sesión, por lo que los privados de arriba siempre
  // devuelven vacío en ese contexto y dejaban los selectores sin opciones.
  const { data: paisesPublico = [] } = useFetchPaisesPublico();
  const { data: industriasPublico = [] } = useFetchIndustriasPublico();

  const [valores, setValores] = useState({
    entidad_nombre: "",
    cod_ciudad: "",
    cod_pais: "",
    cod_industria: "",
    cod_estado: "",
    paises_asociados: [],
  });

  const [mensaje, setMensaje] = useState("");

  const { data: ciudadesPublico = [] } = useFetchCiudadesPublico(valores.cod_pais || undefined);

  const paises = isPublic ? paisesPublico : paisesPrivado;
  const industrias = isPublic ? industriasPublico : industriasPrivado;

  const entidadPaisesQuery = useFetchEntidadPaises(
    { entidad_id: initialData?.entidad_id },
    { enabled: mode === "edit" && Boolean(initialData?.entidad_id) }
  );

  const entidadPaisesActivos = useMemo(
    () => (entidadPaisesQuery.data?.data?.data || []).filter((i) => i.cod_estado === PAIS_RELACION_ESTADO_ACTIVO),
    [entidadPaisesQuery.data]
  );

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setValores((prev) => ({
        ...prev,
        entidad_nombre: initialData.entidad_nombre || "",
        cod_pais: initialData.cod_pais ? String(initialData.cod_pais) : "",
        cod_ciudad: initialData.cod_ciudad ? String(initialData.cod_ciudad) : "",
        cod_industria: initialData.cod_industria ? String(initialData.cod_industria) : "",
      }));
    }
  }, [mode, initialData]);

  useEffect(() => {
    if (mode === "edit" && entidadPaisesActivos.length > 0) {
      setValores((prev) => ({
        ...prev,
        paises_asociados: entidadPaisesActivos.map((i) => String(i.cod_pais)),
      }));
    }
  }, [mode, entidadPaisesActivos]);

  const paisesAsociadosOptions = useMemo(() => {
    return empresas
      .filter((obj, index, self) => index === self.findIndex((t) => t.paisEmp === obj.paisEmp))
      .map((i) => {
        const pais = paises.find((p) => String(p.cod_pais) === String(i.paisEmp));
        return { value: i.paisEmp, label: pais ? pais.nombre_pais : "" };
      })
      .filter((i) => i.label);
  }, [empresas, paises]);

  const fields = useMemo(() => {
    const baseFields = [
      { key: "entidad_nombre", label: "Nombre", type: "text", required: true },
      {
        key: "cod_pais",
        label: "País",
        type: "select",
        required: true,
        options: paises.map((i) => ({ label: i.nombre_pais, value: i.cod_pais })),
      },
      {
        key: "cod_ciudad",
        label: "Ciudad",
        type: "select",
        required: true,
        options: isPublic
          ? ciudadesPublico.map((i) => ({ label: i.nombre_ciudad, value: i.cod_ciudad }))
          : ciudadesPrivado
              .filter((c) => (valores.cod_pais ? String(c.cod_pais) === String(valores.cod_pais) : false))
              .map((i) => ({ label: i.nombre_ciudad, value: i.cod_ciudad })),
      },
      {
        key: "cod_industria",
        label: "Industria",
        type: "select",
        required: true,
        options: industrias.map((i) => ({ label: i.NOM_INDUSTRIA_ES || i.nom_industria_es, value: i.COD_INDUSTRIA || i.cod_industria })),
      },
    ];

    if (!hidePaisesAsociados) {
      baseFields.push({
        key: "paises_asociados",
        label: "El cliente se relacionará con:",
        type: "checkbox",
        required: mode !== "edit",
        options: paisesAsociadosOptions,
      });
    }

    return baseFields;
  }, [paises, ciudadesPrivado, ciudadesPublico, industrias, estados, paisesAsociadosOptions, valores.cod_pais, mode, hidePaisesAsociados, isPublic]);

  const validate = (vals) => {
    const base = vals.entidad_nombre && vals.cod_pais && vals.cod_ciudad && vals.cod_industria;
    if (mode === "edit" || hidePaisesAsociados) return Boolean(base);
    return Boolean(base && vals.paises_asociados && vals.paises_asociados.length > 0);
  };

  const handleSubmit = async (vals) => {
    try {
      if (mode === "edit" && initialData?.entidad_id) {
        const entidad_id = Number(initialData.entidad_id);

        await api.post("api/appweb/actualizar-entidad", {
          entidad_id,
          entidad_nombre: vals.entidad_nombre,
          cod_ciudad: Number(vals.cod_ciudad),
          cod_pais: Number(vals.cod_pais),
          cod_industria: Number(vals.cod_industria),
          cod_estado: initialData.cod_estado ?? 1,
        });

        const paisesSeleccionados = (vals.paises_asociados || []).map(String);
        const paisesActuales = entidadPaisesActivos.map((i) => String(i.cod_pais));

        const paisesAAgregar = paisesSeleccionados.filter((cod_pais) => !paisesActuales.includes(cod_pais));
        const paisesAEliminar = entidadPaisesActivos.filter((i) => !paisesSeleccionados.includes(String(i.cod_pais)));

        await Promise.all([
          ...paisesAAgregar.map(async (cod_pais) => {
            await api.post("api/appweb/insertar-entidad-nombres", {
              entidad_id,
              cod_pais: Number(cod_pais),
              cod_estado: 1,
              entidadnombre_nombre: vals.entidad_nombre,
              cod_tipo: 26,
            });
            await api.post("api/appweb/insertar-entidad-paises", {
              entidad_id,
              cod_pais: Number(cod_pais),
              cod_estado: PAIS_RELACION_ESTADO_ACTIVO,
            });
          }),
          ...paisesAEliminar.map((i) =>
            api.post("api/appweb/actualizar-entidad-paises", {
              entidad_id,
              entidadpais_id: i.entidadpais_id,
              cod_pais: i.cod_pais,
              cod_estado: PAIS_RELACION_ESTADO_INACTIVO,
            })
          ),
        ]);

        if (onCreate) {
          onCreate({ ...initialData, entidad_nombre: vals.entidad_nombre });
        }
        return;
      }

      const dataAEnviar = {
        entidad_nombre: vals.entidad_nombre,
        cod_ciudad: Number(vals.cod_ciudad),
        cod_pais: Number(vals.cod_pais),
        cod_industria: Number(vals.cod_industria),
        limite_credito: 0,
        cod_moneda: null,
        credito_utilizado: 0,
        cod_estado: 1,
        cod_tipo: tipo,
      };

      // No se crea la entidad de inmediato (ni en público ni en privado):
      // "Nuevo" en shipper/consignatario/cliente siempre viaja sin entidad_id
      // dentro del formulario de la carta. En público el backend la crea al
      // procesar actualizar-json-link (recuperar-datos-entidad-relacionada);
      // en privado (CTS) la crea useCommitPendingChanges al confirmar "Crear
      // Coordinación" (createEntidadConSubrecords), para que quede reflejada
      // en la fila de la carta en vez de una entidad huérfana creada al vuelo.
      if (onCreate) {
        onCreate({ ...dataAEnviar, entidad_id: null, _esNueva: true });
      }
    } catch (err) {
      console.error(err);
      setMensaje("Error al guardar la entidad.");
    }
  };

  return (
    <FormularioAlternativo
      hideHeader
      title={mode === "edit" ? "Editar Entidad" : "Crear Entidad"}
      initialValues={valores}
      fields={fields}
      validate={validate}
      onValuesChange={setValores}
      onSubmit={handleSubmit}
      mensaje={mensaje}
    />
  );
};

NuevaEntidad.propTypes = {
  tipo: PropTypes.number,
  onCreate: PropTypes.func,
  mode: PropTypes.oneOf(["create", "edit"]),
  initialData: PropTypes.object,
  hidePaisesAsociados: PropTypes.bool,
  apiMode: PropTypes.oneOf(["public", "private"]),
};

export default NuevaEntidad;