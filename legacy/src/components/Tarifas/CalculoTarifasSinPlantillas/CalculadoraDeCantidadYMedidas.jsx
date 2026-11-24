/**
 * @file CalculadoraDeCantidadYMedidas.jsx
 * @description Calculadora de volumen y peso para cotizaciones. Permite ingresar dimensiones
 * (largo, ancho, alto), unidades de medida/peso, y calcula totales volumétricos y en kg.
 * Soporta múltiples ítems en una tabla y determina el valor facturable (mayor entre peso y volumen).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import DialogComponent from "../../Dialog/DialogComponent";
import { Button, Card, CardContent, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from "@mui/material";
import FormularioComponent from "../../Formulario/FormularioComponent";
import TextComponent from "../../Formulario/TextComponent";
import { useFetchRelacionTipo } from "../../../hooks/Fetch/useFetchCatalog";
import { useSelector } from "react-redux";
import { VolumenIconTexto } from "@/components/volumenComponent/volumenComponent";

// -----------------------------------------------------------------------------
// Constantes
// -----------------------------------------------------------------------------

/** Unidad base para conversión de volumen (todos los volúmenes se llevan a cm³). */
const UNIDAD_BASE_VOLUMEN = "CENTIMETROS";

const TIPOS_TRANSPORTE = {
  49: "AEREO",
  50: "MARITIMO",
  51: "TERRESTRE",
};

// -----------------------------------------------------------------------------
// Utilidades
// -----------------------------------------------------------------------------

/**
 * Formatea un valor numérico con decimales fijos.
 * @param {number|null|undefined} valor - Valor a formatear
 * @param {number} decimales - Número de decimales (default 3)
 * @returns {string} Valor formateado o string vacío si no es número válido
 */
const redondear = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) return "";
  return Math.ceil(Number(valor));
};

// -----------------------------------------------------------------------------
// Componente ResumenItem (presentacional)
// -----------------------------------------------------------------------------

/**
 * Muestra una etiqueta y un valor en formato resumen (ej. "Cantidad: 5").
 * Usa `sx` para el color para soportar rutas del tema (ej. "primary.main").
 */
const ResumenItem = ({ label, valor, sufijo, highlight = false, color, labelColor, textAlign = "right" }) => {
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  return (
    <Box textAlign={textAlign} m={0} p={0}>
      <Typography border="none" variant="caption" color={labelColor || "text.secondary"} noWrap>
        {label}
      </Typography>
      <Typography
        border="none"
        sx={{
          fontFamily: "monospace",
          fontWeight: highlight ? "bold" : 500,
          color: color || (highlight ? "success.main" : "text.primary"),
        }}
        noWrap
      >
        {valor != null && valor !== "" ? (typeof valor === "number" ? redondear(valor) : valor) : "-"} {sufijo ?? ""}
      </Typography>
    </Box>
  );
};

const CustomInput = ({ value, label, id, onInput, readonly }) => {
  return (
    <>
      <Grid width="100%" p={0}>
        <Typography>{label}</Typography>
      </Grid>
      <Grid width="100%" p={0}>
        <input
          type="number"
          id="alto"
          value={value}
          onInput={onInput}
          style={{ width: "100%", borderRadius: 5, borderWidth: 1, outline: "none", borderColor: "#c1c1c1", borderStyle: "solid", padding: 5 }}
          readOnly={readonly}
          disabled={readonly}
        />
      </Grid>
    </>
  );
};

// -----------------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------------

/**
 * Calculadora de cantidad y medidas para cotizaciones.
 * - Formulario de dimensiones (largo, ancho, alto) y unidades
 * - Tabla de ítems agregados con totales
 * - Totales calculados (kilos volumétricos, kilos, valor facturable)
 * - Diálogo de detalles al hacer doble clic en una fila
 */
const CalculadoraDeCantidadYMedidas = (props) => {
  const { agregar = () => {}, valoresDefault, open, setOpen, readonly = false, oneLine = false, tipoTransporte = 49 } = props;
  const { colors, themeMode, opositeMode } = useSelector((state) => state.theme);
  const unidadesMedidaPrivadas = useFetchRelacionTipo({
    tipo_tabla: "COORDINACION_CARGA",
    tipo_padre_tabla: "TIPO_MEDIDA",
  });

  // --- Estado: formulario de carga ---
  const [datosControlCarga, setDatosControlCarga] = useState({
    unidadMedida: null,
    largo: "",
    ancho: "",
    alto: "",
    unidadPeso: null,
    pesoUnitario: null,
    cantidad: 1,
    pesoKgResultado: 0,
    volumenResultado: 0,
    pesoKgTotal: null,
    volumetricoKgTotal: null,
    facturableKg: 0,
    cantidadTotal: 0,
    cantidadResultado: 0,
    volumenResultadoTotal: null,
    unidadMedida_radio: null,
    unidadPeso_radio: null,
  });

  // --- Estado: catálogos y lista de ítems ---
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [unidadesPeso, setUnidadesPeso] = useState([]);
  const [isLoadingUnidadesMedida, setIsLoadingUnidadesMedida] = useState(false);
  const [volumenes, setVolumenes] = useState([]);
  const [pesos, setPesos] = useState([]);
  const [valores, setValores] = useState([]);

  // --- Estado: diálogo de detalles ---
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  // --- Estado: errores de conversión ---
  const [errorCalculo, setErrorCalculo] = useState([]);

  // --- Efectos: cargar unidades de medida y peso ---
  const handleUnidadesMedida = useCallback(() => {
    setIsLoadingUnidadesMedida(true);
    setUnidadesMedida(unidadesMedidaPrivadas.data?.filter((i) => i.tipo_padre_desc === "VOLUMEN") ?? []);
    setIsLoadingUnidadesMedida(false);
  }, [unidadesMedidaPrivadas.data]);

  const handleUnidadesPeso = useCallback(() => {
    setUnidadesPeso(unidadesMedidaPrivadas.data?.filter((i) => i.tipo_padre_desc === "PESO") ?? []);
  }, [unidadesMedidaPrivadas.data]);

  const transporteActual = TIPOS_TRANSPORTE[tipoTransporte] ?? "AEREO";

  useEffect(() => {
    handleUnidadesMedida();
    handleUnidadesPeso();
  }, [handleUnidadesMedida, handleUnidadesPeso]);

  /** Limpia solo los campos de dimensiones/cantidad tras agregar un ítem. */
  const limpiarInputsCarga = () => {
    setDatosControlCarga((prev) => ({
      ...prev,
      largo: "",
      ancho: "",
      alto: "",
      pesoUnitario: "",
      cantidad: 1,
    }));
  };

  /** Inicializa valores y totales solo al abrir (evita reset por re-render). */
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;
    if (!valoresDefault) return;
    setValores(valoresDefault.items ?? []);
    setDatosControlCarga((prev) => ({
      ...prev,
      largo: "",
      ancho: "",
      alto: "",
      pesoUnitario: "",
      cantidad: 1,
      cantidadResultado: valoresDefault.totales?.cantidadResultado ?? "",
      pesoKgResultado: valoresDefault.totales?.pesoKgResultado ?? "",
      volumenResultado: valoresDefault.totales?.volumenResultado ?? "",
    }));
  }, [open, valoresDefault]);

  // --- Reglas de conversión (longitud, peso, volumétrico aéreo) ---
  const conversiones = useMemo(
    () => ({
      longitud: [
        { from: "METROS", to: "PIES", factor: 3.2808 },
        { from: "METROS", to: "CENTIMETROS", factor: 100 },
        { from: "METROS", to: "PULGADAS", factor: 39.3701 },
        { from: "PULGADAS", to: "METROS", factor: 0.0254 },
        { from: "PIES", to: "CENTIMETROS", factor: 30.48 },
        { from: "PIES", to: "PULGADAS", factor: 12 },
        { from: "PULGADAS", to: "CENTIMETROS", factor: 2.54 },
      ],
      peso: [
        { from: "TONELADAS", to: "KILOGRAMOS", factor: 1000 },
        { from: "KILOGRAMOS", to: "LIBRAS", factor: 2.20462 },
        { from: "LIBRAS", to: "KILOGRAMOS", factor: 0.453592909 },
      ],
      totales: [
        { transporte: "AEREO", from: "CENTIMETROS", to: "KILOS_VOLUMETRICOS", divisor: 6000 },
        { transporte: "AEREO", from: "METROS", to: "KILOS_VOLUMETRICOS", divisor: 0.006 },
        { transporte: "AEREO", from: "PULGADAS", to: "KILOS_VOLUMETRICOS", divisor: 366 },
        { transporte: "AEREO", from: "TONELADAS", to: "KILOGRAMOS", divisor: 1000 },
        { transporte: "AEREO", from: "LIBRAS", to: "KILOGRAMOS", divisor: 0.453592909 },

        { transporte: "MARITIMO", from: "PULGADAS", to: "PIES", divisor: 1728 },
        { transporte: "MARITIMO", from: "PIES", to: "METROS", divisor: 35.3145 },

        { transporte: "TERRESTRE", from: "PIES", to: "PULGADAS", multiplicador: 1728 },
        { transporte: "TERRESTRE", from: "METROS", to: "PIES", multiplicador: 35.3145 },
        { transporte: "TERRESTRE", from: "PULGADAS", to: "METROS_CUBICOS", divisor: 66000 },
        { transporte: "TERRESTRE", from: "METROS", to: "KILOS_VOLUMETRICOS", multiplicador: 333 },
      ],
    }),
    [],
  );

  // --- Funciones de cálculo y conversión ---

  /** Volumen = largo × ancho × alto (usa estado si no se pasan args). */
  const calcularVolumen = (largo, ancho, alto) => {
    const L = largo ?? datosControlCarga.largo;
    const A = ancho ?? datosControlCarga.ancho;
    const H = alto ?? datosControlCarga.alto;
    return Number(L) * Number(A) * Number(H);
  };

  /** Convierte un valor de longitud entre unidades (metros, pies, cm, pulgadas). */
  const convertirLongitud = (valor, desde, hacia) => {
    if (desde === hacia) return valor;
    const regla = conversiones.longitud.find((r) => r.from === desde && r.to === hacia);
    if (regla) return valor * regla.factor;
    const inversa = conversiones.longitud.find((r) => r.from === hacia && r.to === desde);
    if (inversa) return valor / inversa.factor;
    return 0;
  };

  /** Convierte volumen a cm³ según la unidad (base = CENTIMETROS). */
  const volumenACentimetrosCubicos = (volumenUnitario, unidad) => {
    if (unidad === UNIDAD_BASE_VOLUMEN) return volumenUnitario;
    const ladoEnCm = convertirLongitud(1, unidad, UNIDAD_BASE_VOLUMEN);
    return volumenUnitario * Math.pow(ladoEnCm, 3);
  };

  /** Convierte peso a kilogramos según la unidad (reglas aéreas). */
  const convertirPesoAKg = useCallback((valor, unidad) => {
    if (!valor || !unidad) return 0;

    const peso = Number(valor);

    // ya está en KG
    if (unidad === "KILOGRAMOS") return peso;

    // buscar regla directa o inversa
    const regla = conversiones.totales.find((r) => r.transporte === "AEREO" && r.from === unidad && r.to === "KILOGRAMOS");

    if (regla) return peso * regla.divisor;

    const inversa = conversiones.totales.find((r) => r.transporte === "AEREO" && r.from === "KILOGRAMOS" && r.to === unidad);

    if (inversa) return peso / inversa.divisor;

    setErrorCalculo((v) => [...v, `No se puede convertir ${unidad} a KG`]);
    return 0;
  }, []);

  /** Convierte volumen unitario a kilos volumétricos (regla aérea: cm³ / 6000). */
  const convertirVolumetricoUnitario = useCallback(
    (volumenUnitario, unidad) => {
      if (!volumenUnitario || !unidad) return 0;

      // MARITIMO -> resultado en m³
      if (transporteActual === "MARITIMO") {
        const volumenCm3 = volumenACentimetrosCubicos(volumenUnitario, unidad);

        return volumenCm3 / 1_000_000;
      }

      // AEREO / TERRESTRE -> kilos volumétricos
      const regla = conversiones.totales.find((r) => r.transporte === transporteActual && r.to === "KILOS_VOLUMETRICOS");

      console.log({ regla });
      if (!regla) return 0;

      let volumenConvertido;

      if (regla.from === "CENTIMETROS") {
        volumenConvertido = volumenACentimetrosCubicos(volumenUnitario, unidad);
      } else {
        const ladoConvertido = convertirLongitud(1, unidad, regla.from);

        console.log({ ladoConvertido, unidad, from: regla.from });

        if (!ladoConvertido) return 0;

        volumenConvertido = volumenUnitario * Math.pow(ladoConvertido, 3);
      }

      console.log({ volumenConvertido });

      if (regla.divisor) {
        return volumenConvertido / regla.divisor;
      }

      if (regla.multiplicador) {
        return volumenConvertido * regla.multiplicador;
      }

      return 0;
    },
    [conversiones, transporteActual],
  );

  useEffect(() => {
    const pesoKg = valores.reduce((acc, v) => {
      if (v.pesoTotalKg != null) return acc + Number(v.pesoTotalKg || 0);
      const pesoUnitarioKg = convertirPesoAKg(v.pesoUnitario, v.unidadPeso?.tipo_desc);
      return acc + pesoUnitarioKg * Number(v.cantidad || 0);
    }, 0);

    const volumenVolumetrico = valores.reduce((acc, v) => {
      if (v.volumenTotalKg != null) return acc + Number(v.volumenTotalKg || 0);
      const kgVolUnitario = convertirVolumetricoUnitario(v.volumenUnitario, v.unidadMedida?.tipo_desc);
      return acc + kgVolUnitario * Number(v.cantidad || 0);
    }, 0);

    const cantidadCalculada = valores.reduce((acc, v) => {
      return acc + Number(v.cantidad);
    }, 0);

    setDatosControlCarga((v) => ({ ...v, pesoKgTotal: redondear(pesoKg), volumetricoKgTotal: redondear(volumenVolumetrico), cantidadTotal: cantidadCalculada }));
  }, [valores, convertirPesoAKg, convertirVolumetricoUnitario]);

  const facturableKg = useMemo(() => {
    // const volumen = Number(datosControlCarga.volumenResultado) || Number(datosControlCarga.volumetricoKgTotal) || 0;
    const volumen = Number(datosControlCarga.volumetricoKgTotal) > 0 ? Number(datosControlCarga.volumetricoKgTotal) : Number(datosControlCarga.volumenResultado);

    // const peso = Number(datosControlCarga.pesoKgResultado) || Number(datosControlCarga.pesoKgTotal) || 0;
    const peso = Number(datosControlCarga.pesoKgTotal) > 0 ? Number(datosControlCarga.pesoKgTotal) : Number(datosControlCarga.pesoKgResultado);

    const cantidad = Number(datosControlCarga.cantidadResultado) || Number(datosControlCarga.cantidadTotal) || 0;

    if (peso === 0 && volumen === 0) {
      return {
        valor: 0,
        tipo: "AUN NO SE HA CALCULADO",
        cantidad,
        mostrar: false,
      };
    }

    if (peso >= volumen) {
      return {
        valor: peso,
        tipo: "KILOGRAMOS",
        cantidad,
        mostrar: true,
      };
    }

    return {
      valor: volumen,
      tipo: "KILOS VOLUMETRICOS",
      cantidad,
      mostrar: true,
    };
  }, [
    datosControlCarga.cantidadResultado,
    datosControlCarga.cantidadTotal,
    datosControlCarga.pesoKgResultado,
    datosControlCarga.pesoKgTotal,
    datosControlCarga.volumenResultado,
    datosControlCarga.volumetricoKgTotal,
  ]);

  // --- Configuración del formulario (FormularioComponent) ---
  const data = useMemo(() => {
    const grupos = [
      { id: "volumen", label: "", dividerColor: "primary", variant: "span", mostrarTitulo: false, size: 6, p: 0 },
      { id: "peso", label: "", dividerColor: "primary", variant: "span", mostrarTitulo: false, size: 6, p: 0 },
      { id: "general", label: "", dividerColor: "primary", variant: "span", mostrarTitulo: false, size: 12, p: 0 },
    ];
    const readonlyVolumen = readonly || !datosControlCarga.unidadMedida;
    const readonlyPeso = readonly || !datosControlCarga.unidadPeso;

    const inputs = [
      // {
      //   grupoId: "volumen",
      //   tipo: "radio",
      //   label: "Unidad de Medida",
      //   id: "unidadMedida_radio",
      //   val: datosControlCarga.unidadMedida_radio,
      //   options: unidadesMedida,
      //   labelOption: "tipo_desc",
      //   valueOption: "value",
      //   size: 12,
      //   readonly: readonly || volumenes.length > 0,
      // },
      {
        grupoId: "volumen",
        tipo: "select",
        label: "Unidad de Medida",
        id: "unidadMedida_radio",
        val: datosControlCarga.unidadMedida_radio,
        options: unidadesMedida,
        labelOption: "tipo_desc",
        valueOption: "value",
        size: 12,
        readonly: readonly || volumenes.length > 0,
      },
      { grupoId: "volumen", tipo: "number", step: 0.01, label: "Alto", id: "alto", readonly: readonlyVolumen, val: datosControlCarga.alto, name: "alto", size: 6 },
      { grupoId: "volumen", tipo: "number", step: 0.01, label: "Ancho", id: "ancho", readonly: readonlyVolumen, val: datosControlCarga.ancho, name: "ancho", size: 6 },
      { grupoId: "volumen", tipo: "number", step: 0.01, label: "Largo", id: "largo", readonly: readonlyVolumen, val: datosControlCarga.largo, name: "largo", size: 12 },

      // {
      //   grupoId: "peso",
      //   tipo: "radio",
      //   label: "Unidad de Peso",
      //   id: "unidadPeso_radio",
      //   val: datosControlCarga.unidadPeso_radio,
      //   options: unidadesPeso,
      //   labelOption: "tipo_desc",
      //   valueOption: "value",
      //   size: 12,
      //   readonly: readonly || pesos.length > 0,
      // },
      {
        grupoId: "peso",
        tipo: "select",
        label: "Unidad de Peso",
        id: "unidadPeso_radio",
        val: datosControlCarga.unidadPeso_radio,
        options: unidadesPeso,
        labelOption: "tipo_desc",
        valueOption: "value",
        size: 12,
        readonly: readonly || pesos.length > 0,
      },
      { grupoId: "peso", tipo: "number", step: 0.01, label: "Peso Unitario", id: "pesoUnitario", readonly: readonlyPeso, val: datosControlCarga.pesoUnitario, name: "pesoUnitario", size: 12 },

      { grupoId: "general", tipo: "number", step: 0.01, label: "Cantidad", id: "cantidad", readonly, val: datosControlCarga.cantidad, name: "cantidad", size: 12 },
      { grupoId: "general", tipo: "numberSpinner", step: 0.01, label: "Cantidad", id: "cantidad", readonly, val: datosControlCarga.cantidad, name: "cantidad", size: 12 },
    ];

    return { grupos, inputs };
  }, [
    datosControlCarga.alto,
    datosControlCarga.ancho,
    datosControlCarga.cantidad,
    datosControlCarga.largo,
    datosControlCarga.pesoUnitario,
    datosControlCarga.unidadMedida,
    datosControlCarga.unidadPeso,
    pesos.length,
    unidadesMedida,
    unidadesPeso,
    volumenes.length,
    readonly,
  ]);

  // --- Handlers: botones de la tabla y acciones principales ---

  /** Botón para eliminar un ítem de la lista (índice `ind`). */
  const renderizarBotonLimpiar = useCallback(
    (_tipo, ind) => {
      return (
        <Typography
          sx={{
            cursor: readonly ? "not-allowed" : "pointer",
            "&:hover": readonly ? {} : { color: "white.main", bgcolor: "error.main" },
            opacity: readonly ? 0.5 : 1,
            p: 0,
            m: 0,
            borderRadius: 100,
            fontSize: 10,
            textAlign: "center",
          }}
          className="c-x1"
          color="error"
          onClick={() => {
            if (readonly) return;
            setValores((prev) => prev.filter((_, i) => i !== ind));
          }}
        />
      );
    },
    [readonly],
  );

  /** Limpia todos los datos: formulario de carga y lista de ítems. */
  const limpiarTodo = () => {
    setDatosControlCarga((prev) => ({
      ...prev,
      largo: "",
      ancho: "",
      alto: "",
      pesoUnitario: "",
      cantidad: 1,
      pesoKgResultado: "",
      volumenResultado: "",
    }));
    setValores([]);
  };

  /** Envía el valor facturable y la lista de ítems al padre (ej. para cotización). */
  const agregarATabla = () => {
    if (typeof agregar === "function") {
      agregar(
        {
          ...facturableKg,
          valor: Math.ceil(Number(facturableKg?.valor || 0)),
        },
        {
          volumenTotal: Number(datosControlCarga.volumetricoKgTotal) > 0 ? Number(datosControlCarga.volumetricoKgTotal) : Number(datosControlCarga.volumenResultado),

          pesoTotal: Number(datosControlCarga.pesoKgTotal) > 0 ? Number(datosControlCarga.pesoKgTotal) : Number(datosControlCarga.pesoKgResultado),

          cantidadTotal: Number(datosControlCarga.cantidadTotal) > 0 ? Number(datosControlCarga.cantidadTotal) : Number(datosControlCarga.cantidadResultado),
        },
        valores,
      );
    }
  };

  const grupoMedidas = [datosControlCarga.largo, datosControlCarga.ancho, datosControlCarga.alto];
  const medidasLlenas = grupoMedidas.filter(Boolean).length;
  const medidasCompletas = medidasLlenas === grupoMedidas.length;
  const medidasParciales = medidasLlenas > 0 && !medidasCompletas;

  const pesoCompleto = Boolean(datosControlCarga.pesoUnitario);
  const pesoParcial = Boolean(datosControlCarga.pesoUnitario) && !datosControlCarga.unidadPeso;

  const medidasValidas = medidasCompletas && Boolean(datosControlCarga.unidadMedida);
  const pesoValido = pesoCompleto && Boolean(datosControlCarga.unidadPeso);

  const tieneTotalDirecto = (Number(datosControlCarga.pesoKgResultado) || 0) > 0 || (Number(datosControlCarga.volumenResultado) || 0) > 0;

  const puedeAgregar = valores.length > 0 || tieneTotalDirecto;

  useEffect(() => {
    if (!unidadesMedida.length) return;
    setDatosControlCarga((v) => ({
      ...v,
      unidadMedida: unidadesMedida.find((i) => i.value === 165),
      unidadMedida_radio: 165,
      unidadPeso: unidadesPeso.find((i) => i.value === 162),
      unidadPeso_radio: 162,
    }));
  }, [unidadesMedida.length, unidadesMedida, unidadesPeso]);

  // --- Render ---
  return (
    <DialogComponent openDialog={open} handleClose={() => setOpen(false)} titulo="CALCULADORA DE VOLUMEN Y PESO" width="70vw">
      <Grid container direction="row">
        <Grid container spacing={0.5}>
          {oneLine && valores.length > 0 ? null : (
            <Grid container direction="row" spacing={1}>
              <Grid width="100%" container>
                <Grid size={7} p={1}>
                  <Grid width="100%" container>
                    <Grid size={12} p={0} columnSpacing={0.5} rowSpacing={0.5} container>
                      <Grid size={6} container sx={{ boxShadow: "1px 2px 5px rgba(0, 0, 0, 0.2)", borderRadius: "16px", p: 1 }}>
                        <Grid size={12} p={0} m={0}>
                          <Grid width="100%" p={0}>
                            <Typography>Unidad de Medida</Typography>
                          </Grid>
                          <Grid width="100%" p={0} container>
                            {unidadesMedida.map((i) => {
                              return (
                                <Grid key={i.value} size={6} flexWrap="nowrap" container>
                                  <input
                                    name="medida"
                                    type="radio"
                                    id={`[${i.value}]${i.label}`}
                                    value={i.value}
                                    checked={datosControlCarga.unidadMedida_radio === i.value}
                                    onChange={(ev) =>
                                      setDatosControlCarga((prev) => ({
                                        ...prev,
                                        unidadMedida_radio: Number(ev.target.value),
                                        unidadMedida: unidadesMedida.find((u) => u.value === Number(ev.target.value)),
                                      }))
                                    }
                                    readOnly={readonly}
                                    disabled={readonly}
                                  />
                                  <label htmlFor={`[${i.value}]${i.label}`} style={{ textWrap: "nowrap" }}>
                                    <Typography variant="caption">{i.label}</Typography>
                                  </label>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </Grid>
                        <Grid size={6} p={0} m={0}>
                          <CustomInput
                            label="Largo"
                            value={datosControlCarga.largo}
                            id="largo"
                            onInput={(ev) => setDatosControlCarga((v) => ({ ...v, largo: ev.target.value ?? 0 }))}
                            readonly={readonly}
                          />
                        </Grid>
                        <Grid size={6} p={0} m={0}>
                          <CustomInput
                            label="Ancho"
                            value={datosControlCarga.ancho}
                            id="ancho"
                            onInput={(ev) => setDatosControlCarga((v) => ({ ...v, ancho: ev.target.value ?? 0 }))}
                            readonly={readonly}
                          />
                        </Grid>
                        <Grid size={6} p={0} m={0}>
                          <CustomInput
                            label="Alto"
                            value={datosControlCarga.alto}
                            id="alto"
                            onInput={(ev) => setDatosControlCarga((v) => ({ ...v, alto: ev.target.value ?? 0 }))}
                            readonly={readonly}
                          />
                        </Grid>
                      </Grid>
                      <Grid size={6} container>
                        <Grid size={12} container sx={{ boxShadow: "1px 2px 5px rgba(0, 0, 0, 0.2)", borderRadius: "16px", p: 1 }}>
                          <Grid size={12} p={0} m={0}>
                            <Grid width="100%" p={0}>
                              <Typography>Unidad de Peso</Typography>
                            </Grid>
                            <Grid width="100%" p={0} container>
                              {unidadesPeso.map((i) => {
                                return (
                                  <Grid key={i.value} size={6} flexWrap="nowrap" container>
                                    <input
                                      name="peso"
                                      type="radio"
                                      id={`[${i.value}]${i.label}`}
                                      value={i.value}
                                      checked={datosControlCarga.unidadPeso_radio === i.value}
                                      onChange={(ev) =>
                                        setDatosControlCarga((prev) => ({
                                          ...prev,
                                          unidadPeso_radio: Number(ev.target.value),
                                          unidadPeso: unidadesPeso.find((u) => u.value === Number(ev.target.value)),
                                        }))
                                      }
                                      readOnly={readonly}
                                      disabled={readonly}
                                    />
                                    <label htmlFor={`[${i.value}]${i.label}`} style={{ textWrap: "nowrap" }}>
                                      <Typography variant="caption">{i.label}</Typography>
                                    </label>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Grid>
                          <Grid size={6} p={0} m={0}>
                            <CustomInput
                              label="Peso"
                              value={datosControlCarga.pesoUnitario}
                              id="pesoUnitario"
                              onInput={(ev) => setDatosControlCarga((v) => ({ ...v, pesoUnitario: ev.target.value ?? 0 }))}
                              readonly={readonly}
                            />
                          </Grid>
                        </Grid>
                        <Grid size={12} container sx={{ boxShadow: "1px 2px 5px rgba(0, 0, 0, 0.2)", borderRadius: "16px", p: 1 }}>
                          <Grid size={"auto"} p={0}>
                            <Typography>Cantidad</Typography>
                          </Grid>
                          <Grid size={"grow"} p={0} container>
                            <Grid size={4} p={0} container justifyContent="end">
                              <button
                                style={{ background: readonly ? "#5c5c5c" : "#0B2967", borderWidth: 1, borderRadius: 5, color: "#fff", borderColor: readonly ? "#5c5c5c" : "#0B2967" }}
                                onClick={() => setDatosControlCarga((v) => ({ ...v, cantidad: --v.cantidad }))}
                                disabled={readonly}
                              >
                                -1
                              </button>
                            </Grid>
                            <Grid size={4} p={0} container>
                              <input
                                type="number"
                                id="cantidad"
                                value={datosControlCarga.cantidad}
                                onInput={(ev) => setDatosControlCarga((v) => ({ ...v, cantidad: ev.target.value ?? 0 }))}
                                style={{ width: "100%", borderRadius: 5, borderWidth: 1, boxShadow: "none", borderColor: "lightgray" }}
                                readOnly={readonly}
                                disabled={readonly}
                              />
                            </Grid>
                            <Grid size={4} p={0} container justifyContent="start">
                              <button
                                style={{ background: readonly ? "#5c5c5c" : "#0B2967", borderWidth: 1, borderRadius: 5, color: "#fff", borderColor: readonly ? "#5c5c5c" : "#0B2967" }}
                                onClick={() => setDatosControlCarga((v) => ({ ...v, cantidad: ++v.cantidad }))}
                                disabled={readonly}
                              >
                                +1
                              </button>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                    {/* <Grid size={12} p={0}>
                        <FormularioComponent
                          botonesCentro
                          p={0}
                          data={data}
                          onInput={({ id, val }) => {
                            if (readonly) return;
                            setDatosControlCarga((prev) => {
                              if (id === "unidadMedida_radio") {
                                if (val) {
                                  const unidad = val;
                                  // const unidad = unidadesMedida.find((u) => u.value === Number(val));
                                  return { ...prev, [id]: val, unidadMedida: unidad };
                                } else {
                                  const unidad = null;
                                  // const unidad = unidadesMedida.find((u) => u.value === Number(val));
                                  return { ...prev, [id]: null, unidadMedida: null, largo: "", alto: "", ancho: "" };
                                }
                              } else if (id === "unidadPeso_radio") {
                                if (val) {
                                  const unidad = val;
                                  // const unidad = unidadesPeso.find((u) => u.value === Number(val));
                                  return { ...prev, [id]: val, unidadPeso: unidad };
                                } else {
                                  const unidad = val;
                                  // const unidad = unidadesPeso.find((u) => u.value === Number(val));
                                  return { ...prev, [id]: null, unidadPeso: null, pesoUnitario: "" };
                                }
                              } else return { ...prev, [id]: val };
                            });
                          }}
                          botones={{ agregar: { visible: false } }}
                        />
                      </Grid> */}
                  </Grid>
                  <Grid size={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      disabled={readonly || medidasParciales || pesoParcial || (!medidasValidas && !pesoValido)}
                      onClick={() => {
                        if (readonly) return;
                        const cantidad = Number(datosControlCarga.cantidad || 1);

                        const volumenUnitario = calcularVolumen(datosControlCarga.largo || 0, datosControlCarga.ancho || 0, datosControlCarga.alto || 0) || 0;
                        const volumenTotal = volumenUnitario * cantidad;
                        const volumenUnitarioKg = convertirVolumetricoUnitario(volumenUnitario, datosControlCarga.unidadMedida?.tipo_desc);
                        const volumenTotalKg = volumenUnitarioKg * cantidad;
                        const pesoUnitario = Number(datosControlCarga.pesoUnitario || 0) || 0;
                        const pesoTotal = pesoUnitario * cantidad;
                        const pesoUnitarioKg = convertirPesoAKg(pesoUnitario, datosControlCarga.unidadPeso?.tipo_desc);
                        const pesoTotalKg = pesoUnitarioKg * cantidad;

                        setValores((prev) => [
                          ...prev,
                          {
                            id: prev.length + 1,
                            unidadMedida: datosControlCarga.largo && datosControlCarga.ancho && datosControlCarga.alto ? datosControlCarga.unidadMedida : null,
                            unidadPeso: datosControlCarga.pesoUnitario ? datosControlCarga.unidadPeso : null,

                            formulaVolumen: `${datosControlCarga.largo}x${datosControlCarga.ancho}x${datosControlCarga.alto}`,

                            cantidad,
                            largo: Number(datosControlCarga.largo) || 0,
                            ancho: Number(datosControlCarga.ancho) || 0,
                            alto: Number(datosControlCarga.alto) || 0,

                            volumenUnitario,
                            volumenTotal,
                            volumenTotalKg,

                            pesoUnitario,
                            pesoTotal,
                            pesoTotalKg,
                          },
                        ]);
                        limpiarInputsCarga();
                      }}
                    >
                      <Grid container direction="row" wrap="nowrap" columnSpacing={1} fontSize={25}>
                        <Typography className="c-suma" my="auto" />
                        <Typography my="auto">AGREGAR A CALCULO</Typography>
                      </Grid>
                    </Button>
                  </Grid>
                </Grid>

                <Grid size={5}>
                  <Grid size={12} container>
                    <Grid size={12} height="fit-content">
                      <VolumenIconTexto
                        width="100%"
                        height={125}
                        // style={{ backgroundColor: "#0B2967" }}
                        fill="#0B2967"
                        alto={`${datosControlCarga.alto || 0}`}
                        ancho={`${datosControlCarga.ancho || 0}`}
                        largo={`${datosControlCarga.largo || 0}`}
                        volumen={`${redondear(calcularVolumen(datosControlCarga.largo || 0, datosControlCarga.ancho || 0, datosControlCarga.alto || 0) || 0, datosControlCarga.unidadMedida?.tipo_desc)} ${datosControlCarga.unidadMedida?.tipo_desc}`}
                        cantidad={datosControlCarga.cantidad || 0}
                      />
                    </Grid>
                    <Box width="100%" height="fit-content">
                      {datosControlCarga.volumenVolumetrico}
                      <Grid size={12} p={1} container sx={{ boxShadow: "2.5px 5px 10px rgba(0, 0, 0, 0.2)", borderRadius: "16px" }}>
                        <Grid size={4} sx={{ "&:hover": { bgcolor: "primary.main_10" }, px: 1, borderRadius: 2 }}>
                          <ResumenItem
                            label="Volumen Total"
                            valor={`${redondear(
                              convertirVolumetricoUnitario(
                                calcularVolumen(datosControlCarga.largo || 0, datosControlCarga.ancho || 0, datosControlCarga.alto || 0) || 0,
                                datosControlCarga.unidadMedida?.tipo_desc,
                              ) * datosControlCarga.cantidad,
                            )} KILOS`}
                            color="primary.main"
                            labelColor="text.main"
                          />
                        </Grid>
                        <Grid size={4} sx={{ "&:hover": { bgcolor: "primary.main_10" }, px: 1, borderRadius: 2 }}>
                          <ResumenItem
                            label="Peso Unitario"
                            valor={`${redondear(convertirPesoAKg(Number(datosControlCarga.pesoUnitario || 0) || 0, datosControlCarga.unidadPeso?.tipo_desc))} KILOS`}
                            color="primary.main"
                            labelColor="text.main"
                          />
                        </Grid>
                        <Grid size={4} sx={{ "&:hover": { bgcolor: "primary.main_10" }, px: 1, borderRadius: 2 }}>
                          <ResumenItem
                            label="Peso Total"
                            valor={`${redondear(convertirPesoAKg(Number(datosControlCarga.pesoUnitario || 0) || 0, datosControlCarga.unidadPeso?.tipo_desc)) * datosControlCarga.cantidad} KILOS`}
                            color="primary.main"
                            labelColor="text.main"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          <Grid container direction="row" spacing={2}>
            <Grid size={7} p={1} sx={{ boxShadow: "2.5px 5px 10px rgba(0, 0, 0, 0.2)", borderRadius: "16px" }}>
              <Typography variant="caption" color="primary.main">
                * Dar doble click en una fila para ver los detalles
              </Typography>
              <TableContainer sx={{ height: 200, maxHeight: 200, borderRadius: 2, overflowX: "auto" }} component={Grid}>
                <Table
                  aria-label="a sticky dense table"
                  sx={{
                    width: "100%",
                    "& .MuiTableCell-root": { "&:last-child": { borderRight: "none" } },
                    "& th.MuiTableCell-root:last-child": { bgcolor: colors["primary"]?.["main"], width: "1%", p: 0, m: 0, zIndex: 2 },
                    "& .MuiTableCell-root:last-child": {
                      position: "sticky",
                      right: 0,
                      zIndex: 1,
                      backgroundColor: "background.main_50",
                    },
                  }}
                  size="small"
                  stickyHeader
                >
                  <TableHead stickyHeader>
                    <TableRow sx={{ bgcolor: "primary.main", "&:hover": { bgcolor: "primary.400" }, "& .MuiTableCell-root": { bgcolor: "primary.main", color: "white.main" } }}>
                      <TableCell>
                        <Typography>Unidad Volumetrica</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>Unidad Peso</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography align="center">Cantidad</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography align="right">Volumen</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography align="right">Volumen Total (KG³)</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography align="right">Peso Total (KG)</Typography>
                      </TableCell>
                      <TableCell width="1%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!valores.length ? (
                      <TableRow hover>
                        <TableCell colSpan="100%">No se a agregado ningun Volumen o Peso</TableCell>
                      </TableRow>
                    ) : (
                      valores.map((fila, ind) => (
                        <TableRow
                          hover
                          key={fila.id}
                          sx={{
                            bgcolor: fila.id === detalleSeleccionado?.id ? "primary.main_10" : colors["background"]?.["main_50"],
                            "&:hover": { cursor: "pointer" },
                          }}
                        >
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ ...(!fila.unidadMedida?.tipo_desc && { textAlign: "center", fontWeight: "bold" }) }}
                              color={fila.unidadMedida?.tipo_desc ? "text" : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {fila.unidadMedida?.tipo_desc || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ ...(!fila.unidadPeso?.tipo_desc && { textAlign: "center", fontWeight: "bold" }) }}
                              color={fila.unidadPeso?.tipo_desc ? "text" : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {fila.unidadPeso?.tipo_desc || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ fontFamily: "monospace" }}
                              textAlign="center"
                              fontWeight="bold"
                              color={fila.cantidad ? (themeMode === "light" ? "primary" : "accent") : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {fila.cantidad || 1}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ fontFamily: "monospace" }}
                              textAlign="right"
                              fontWeight="bold"
                              color={fila.formulaVolumen ? (themeMode === "light" ? "primary" : "accent") : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {fila.formulaVolumen}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ fontFamily: "monospace" }}
                              textAlign="right"
                              fontWeight="bold"
                              color={fila.volumenTotal ? (themeMode === "light" ? "primary" : "accent") : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {redondear(
                                fila.volumenTotalKg != null
                                  ? Number(fila.volumenTotalKg || 0)
                                  : convertirVolumetricoUnitario(fila.volumenUnitario, fila.unidadMedida?.tipo_desc) * Number(fila.cantidad || 0),
                              ) || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onDoubleClick={() => {
                              setMostrarDetalles(true);
                              setDetalleSeleccionado(valores[ind]);
                            }}
                          >
                            <Typography
                              sx={{ fontFamily: "monospace" }}
                              textAlign="right"
                              fontWeight="bold"
                              color={fila.pesoTotal ? (themeMode === "light" ? "primary" : "accent") : themeMode === "light" ? "error" : colors["white"]?.["main"]}
                            >
                              {redondear(fila.pesoTotalKg != null ? Number(fila.pesoTotalKg || 0) : convertirPesoAKg(fila.pesoUnitario, fila.unidadPeso?.tipo_desc) * Number(fila.cantidad || 0)) ||
                                "-"}
                            </Typography>
                          </TableCell>
                          <TableCell width="1%">{renderizarBotonLimpiar(fila.tipo, ind)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Grid bgcolor="gray.100_40" borderRadius={2} container direction="row" spacing={1} justifyContent="space-around">
                <Grid size={6}>
                  <Button variant="outlined" color="error" fullWidth onClick={limpiarTodo} disabled={readonly || !valores.length}>
                    Limpiar
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button variant="contained" color="primary" fullWidth onClick={agregarATabla} disabled={readonly || !puedeAgregar}>
                    Guardar medidas
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid size={5}>
              <Grid container spacing={1} columns={12} rowGap={1}>
                <Grid size={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      m: 0,
                      bgcolor: themeMode === "light" ? colors["background"]?.["main_50"] : "whtie.main_70",
                      borderRadius: "16px",
                      boxShadow: "2.5px 5px 10px rgba(0, 0, 0, 0.2)",
                      zIndex: 2,
                      overflow: "hidden",
                      border: "none",
                    }}
                  >
                    <CardContent sx={{ "&:last-child": { pb: 1.5 }, pt: 1.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Grid size={11}>
                          <Typography variant="subtitle2" color="text">
                            Totales Calculados
                          </Typography>
                        </Grid>
                        <Chip label="Totales" size="small" color="primary" />
                      </Stack>
                      <Grid container spacing={0}>
                        <Grid size={12} sx={{ "&:hover": { bgcolor: "primary.main_10" }, py: 0.2, px: 0.5, borderRadius: 2 }}>
                          <ResumenItem label="CANTIDAD TOTAL" valor={`${datosControlCarga.cantidadTotal ?? 0}`} color="primary.main" labelColor="text.main" />
                        </Grid>
                        <Grid size={12} sx={{ "&:hover": { bgcolor: "primary.main_10" }, py: 0.2, px: 0.5, borderRadius: 2 }}>
                          <ResumenItem
                            label="KILOS VOLUMETRICOS"
                            valor={
                              datosControlCarga.volumetricoKgTotal > 0 ? (
                                <Typography sx={{ fontFamily: "monospace" }} textAlign="right" fontWeight="bold" color={"primary"}>
                                  {datosControlCarga.volumetricoKgTotal}
                                </Typography>
                              ) : (
                                <TextComponent
                                  input={{
                                    grupoId: "total",
                                    tipo: "text",
                                    label: ` `,
                                    id: "volumetricoKgTotal",
                                    val: datosControlCarga.volumenResultado,
                                    readonly: readonly || datosControlCarga.volumetricoKgTotal > 0,
                                    size: 12,
                                  }}
                                  onInput={(val) => {
                                    if (readonly) return;
                                    setDatosControlCarga((prev) => ({ ...prev, volumenResultado: val }));
                                  }}
                                />
                              )
                            }
                            color="primary.main"
                            labelColor="text.main"
                          />
                        </Grid>
                        <Grid size={12} sx={{ "&:hover": { bgcolor: "primary.main_10" }, py: 0.2, px: 0.5, borderRadius: 2 }}>
                          <ResumenItem
                            label="KILOS"
                            valor={
                              datosControlCarga.pesoKgTotal > 0 ? (
                                <Typography sx={{ fontFamily: "monospace" }} textAlign="right" fontWeight="bold" color={"primary"}>
                                  {datosControlCarga.pesoKgTotal}
                                </Typography>
                              ) : (
                                <TextComponent
                                  input={{
                                    grupoId: "total",
                                    tipo: "text",
                                    label: ` `,
                                    id: "pesoKgResultado",
                                    val: datosControlCarga.pesoKgResultado,
                                    readonly: readonly || datosControlCarga.pesoKgTotal > 0,
                                    size: 12,
                                  }}
                                  onInput={(val) => {
                                    if (readonly) return;
                                    setDatosControlCarga((prev) => ({ ...prev, pesoKgResultado: val }));
                                  }}
                                />
                              )
                            }
                            color="primary.main"
                            labelColor="text.main"
                          />
                        </Grid>

                        <Grid size={12}>
                          <Divider sx={{ borderBottomWidth: 2, borderColor: "primary.300" }} />
                        </Grid>

                        <Grid container spacing={2} size={12} sx={{ "&:hover": { bgcolor: "primary.main_10" }, py: 0.2, px: 0.5, borderRadius: 2 }}>
                          <Grid size="auto" my="auto">
                            TOTAL en {facturableKg.mostrar ? facturableKg?.tipo : "-"}
                          </Grid>
                          <Grid size={"grow"}>
                            <Typography sx={{ fontFamily: "monospace" }} textAlign="right" fontWeight="bold" color={facturableKg?.valor <= 0 ? "error" : "primary"}>
                              {redondear(facturableKg?.valor)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <DialogComponent
        openDialog={mostrarDetalles}
        handleClose={() => {
          setMostrarDetalles(false);
          setDetalleSeleccionado(null);
        }}
        titulo="DETALLES DEL VOLUMEN O PESO"
        width="50vw"
        sx={{ container: { p: 1 } }}
      >
        {detalleSeleccionado && (
          <Card variant="outlined" sx={{ m: 0, bgcolor: "grey.50_10", borderColor: "transparent", borderRadius: 3, boxShadow: "2.5px 5px 10px rgba(0, 0, 0, 0.2)" }}>
            <CardContent sx={{ "&:last-child": { pb: 1.5 }, pt: 1.5 }}>
              <Grid container direction="row">
                <Grid size={9}>
                  <Typography variant="subtitle2" color="primary">
                    Resumen de dimensiones seleccionadas
                  </Typography>
                </Grid>
                <Grid size={3} textAlign="right">
                  <Chip label="Resumen" size="small" color="primary" />
                </Grid>
              </Grid>
              <Grid container spacing={2} wrap="nowrap" sx={{ p: 0.5, "&:hover": { bgcolor: "primary.main_10" }, borderRadius: 2, px: 1 }}>
                <Grid size={3}>
                  <Typography variant="subtitle2" color="primary">
                    Cantidad
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <ResumenItem label="" valor={`${detalleSeleccionado.cantidad}`} />
                </Grid>
              </Grid>
              <Divider />
              <Grid container spacing={2} wrap="nowrap" sx={{ p: 0.5, "&:hover": { bgcolor: "primary.main_10" }, borderRadius: 2, px: 1 }}>
                <Grid size={3}>
                  <Typography variant="subtitle2" color="primary">
                    Volumen
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <ResumenItem label="Unidad" valor={detalleSeleccionado.unidadMedida?.tipo_desc} color="primary.main" />
                </Grid>
                <Grid wrap="nowrap" container>
                  <ResumenItem label="Largo" valor={detalleSeleccionado.largo || 0} />
                </Grid>
                <Grid wrap="nowrap" container>
                  <ResumenItem label="Ancho" valor={detalleSeleccionado.ancho || 0} />
                </Grid>
                <Grid wrap="nowrap" container>
                  <ResumenItem label="Alto" valor={detalleSeleccionado.alto || 0} />
                </Grid>
                <Grid wrap="nowrap" container>
                  <ResumenItem label="Volumen Unitario" valor={detalleSeleccionado.volumenUnitario || 0} />
                </Grid>
              </Grid>
              <Divider />
              <Grid container spacing={2} sx={{ p: 0.5, "&:hover": { bgcolor: "primary.main_10" }, borderRadius: 2, px: 1 }}>
                <Grid size={3}>
                  <Typography variant="subtitle2" color="primary">
                    Peso
                  </Typography>
                </Grid>
                <Grid size={3}>
                  <ResumenItem label="Unidad" valor={detalleSeleccionado.unidadPeso?.tipo_desc} color="primary.main" />
                </Grid>
                <Grid xs={3}>
                  <ResumenItem label="Peso Unitario" valor={detalleSeleccionado.pesoUnitario || 0} />
                </Grid>
              </Grid>
              <VolumenIconTexto
                width="100%"
                height={100}
                fill="#0B2967"
                alto={detalleSeleccionado.alto || 0}
                ancho={detalleSeleccionado.ancho || 0}
                largo={detalleSeleccionado.largo || 0}
                cantidad={detalleSeleccionado.cantidad || 0}
                volumen={`${redondear(calcularVolumen(detalleSeleccionado.largo || 0, detalleSeleccionado.ancho || 0, detalleSeleccionado.alto || 0) || 0, detalleSeleccionado.unidadMedida?.tipo_desc)} ${detalleSeleccionado.unidadMedida?.tipo_desc}`}
              />
            </CardContent>
          </Card>
        )}
      </DialogComponent>
    </DialogComponent>
  );
};

ResumenItem.propTypes = {
  label: PropTypes.string,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sufijo: PropTypes.string,
  highlight: PropTypes.bool,
  color: PropTypes.string,
  textAlign: PropTypes.oneOf(["left", "right", "center"]),
};

CalculadoraDeCantidadYMedidas.propTypes = {
  /** Callback al pulsar "Agregar": (facturableKg, valores) => void */
  agregar: PropTypes.func.isRequired,
  oneLine: PropTypes.bool,
  /** Valores iniciales (items + totales) al abrir el diálogo */
  valoresDefault: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        pesoUnitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        largo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        ancho: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        alto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unidadMedida: PropTypes.shape({ label: PropTypes.string, value: PropTypes.string }),
        unidadPeso: PropTypes.shape({ label: PropTypes.string, value: PropTypes.string }),
      }),
    ),
    totales: PropTypes.shape({
      pesoKgTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pesoKgResultado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      volumenResultado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      volumenTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cantidadResultado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cantidadTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  /** Controla si el diálogo principal está abierto */
  open: PropTypes.bool.isRequired,
  /** Callback para cerrar el diálogo: () => void */
  setOpen: PropTypes.func.isRequired,
  /** Modo solo lectura: bloquea edici�n y acciones */
  readonly: PropTypes.bool,

  tipoTransporte: PropTypes.number,
};

export default CalculadoraDeCantidadYMedidas;
