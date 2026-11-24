import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import CalculadoraDeCantidadYMedidas from "../../../components/Tarifas/CalculoTarifasSinPlantillas/CalculadoraDeCantidadYMedidas";
import { useFetchPaises, useFetchRelacionTipo, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
import { useFetchCommodity, useFetchEquipos } from "../../../hooks/Fetch/useFetchTarifas";
import { useFetchAllEntidadesSimple } from "../../../hooks/Fetch/useFetchEntidades";
import { Calculator, ExternalLink, PictureInPicture } from "lucide-react";
import { useSelector } from "react-redux";
import { GenerarCeldaNombre, GenerarCeldaValor } from "./RenderizadosDePartes";

const redondear = (valor, decimales = 0) => {
  if (valor === null || valor === undefined || isNaN(valor)) return "";
  return Number(valor).toFixed(decimales);
};

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

const INPUTS_NO_VISIBLES = [
  "valor_cw",
  "cod_puntoenlace_origen",
  "cod_puntoenlace_destino",
  "entidad_id",
  "express",
  "categoria_transporte",
  "valor_dueagent",
  "valor_kilos",
  "valor_por_peso",
  "valor_flete",
  "valor_factura",
];

const accionesRadio = [
  { label: "Si", value: true },
  { label: "No", value: false },
];

const accionesRadioCategoriaTransporte = [
  { label: "Pasajero", value: 1 },
  { label: "Carguero", value: 2 },
  { label: "Todos", value: 0 },
];

const calcularTotalesMinimos = (items = []) => {
  const cantidadTotal = (items || []).reduce((a, it) => a + Number(it?.cantidad || 0), 0);
  const pesoKgTotal = (items || []).reduce((a, it) => a + Number(it?.pesoUnitario || 0) * Number(it?.cantidad || 0), 0);

  return {
    pesoKgTotal,
    pesoKgResultado: pesoKgTotal,
    volumenTotal: 0,
    volumenResultado: 0,
    cantidadTotal,
    cantidadResultado: cantidadTotal,
  };
};

const GenerarFiltrosCriterios = (props) => {
  const {
    criterios = [],
    listaDimensiones = [],
    valoresDefault = {},
    cotizacion = {},

    // ✅ NUEVOS (no cambian tu proceso)
    resetKey = 0, // cambia por versión
    valorFlete = null, // viene del padre

    onValoresChange = () => {},
    onDimensionesChage = () => {},
    onTotalesChange = () => {},
    lectura = false,

    mostrarExpress = false,
  } = props;

  const { colors } = useSelector((state) => state.theme);

  const paises = useFetchPaises();
  const equipos = useFetchEquipos({ equipo_operativo: true });
  const commodity = useFetchCommodity({ cod_estado: 1 });
  const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});
  const unidadesMedida = useFetchRelacionTipo({ tipo_tabla: "COORDINACION_CARGA", tipo_padre_tabla: "TIPO_MEDIDA" });
  const categoriaTransporte = useFetchTipos({ tipo_tabla: "CATEGORIA_TRANSPORTE" });

  const valoresDefaultProcesados = useMemo(() => {
    const valoresDefaultProcesados = {};
    Object.keys(valoresDefault).forEach((id) => {
      if (id === "cod_commodity") valoresDefaultProcesados[id] = commodity.data.find((i) => String(i.value) === String(valoresDefault["cod_commodity"])) || null;
      else valoresDefaultProcesados[id] = valoresDefault[id];
    });
    return valoresDefaultProcesados;
  }, [commodity.data, valoresDefault]);

  const [valores, setValores] = useState(valoresDefaultProcesados);
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [listaCalculos, setListaCalculos] = useState([]);
  const [totalesCalculadora, setTotalesCalculadora] = useState(calcularTotalesMinimos([]));

  // ---- control de “cuándo emitir al padre” ----
  const cambioOrigenRef = useRef("init"); // "init" | "user" | "flete"
  const lastSentRef = useRef(""); // para no spamear al padre

  const listaMedidas = useMemo(() => (unidadesMedida.data || []).filter((i) => i.tipo_padre_desc === "VOLUMEN"), [unidadesMedida.data]);
  const listaPeso = useMemo(() => (unidadesMedida.data || []).filter((i) => i.tipo_padre_desc === "PESO"), [unidadesMedida.data]);

  const mapDimensionesApiToCalcItems = useCallback(
    (apiDims = []) =>
      (apiDims || []).map((d, idx) => {
        const codMedida = d?.cotdetdim_unidad_medida != null ? String(d.cotdetdim_unidad_medida) : null;
        const codPeso = d?.cotdetdim_unidad_peso != null ? String(d.cotdetdim_unidad_peso) : null;
        const cantidad = Number(d.cotdetdim_cantidad || 0);
        const largo = Number(d.cotdetdim_largo || 0);
        const ancho = Number(d.cotdetdim_ancho || 0);
        const alto = Number(d.cotdetdim_alto || 0);
        const pesoUnitario = Number(d.cotdetdim_peso_unitario || 0);
        const volumenUnitario = largo * ancho * alto;

        return {
          id: d.cod_cotdetdim ?? idx + 1,
          cantidad,
          largo,
          ancho,
          alto,
          pesoUnitario,
          formulaVolumen: `${largo || 0}x${ancho || 0}x${alto || 0}`,
          volumenUnitario,
          volumenTotal: volumenUnitario * cantidad,
          pesoTotal: pesoUnitario * cantidad,

          unidadMedida: codMedida ? listaMedidas.find((i) => String(i.value) === codMedida) || null : null,
          unidadPeso: codPeso ? listaPeso.find((i) => String(i.value) === codPeso) || null : null,
        };
      }),
    [listaMedidas, listaPeso],
  );

  const normalizarDimensionesParaGuardar = useCallback((items = []) => {
    return (items || []).map((d) => {
      const cantidad = Number(d?.cotdetdim_cantidad ?? d?.cantidad ?? 0);
      const largo = Number(d?.cotdetdim_largo ?? d?.largo ?? 0);
      const ancho = Number(d?.cotdetdim_ancho ?? d?.ancho ?? 0);
      const alto = Number(d?.cotdetdim_alto ?? d?.alto ?? 0);
      const pesoUnitario = Number(d?.cotdetdim_peso_unitario ?? d?.pesoUnitario ?? 0);

      const volumenUnitarioBase = Number(d?.volumenUnitario ?? largo * ancho * alto);
      const volumenTotalBase = Number(d?.volumenTotal ?? volumenUnitarioBase * cantidad);
      const totalVolumen = Number(d?.total_volumen ?? d?.volumenTotalKg ?? volumenTotalBase);

      const pesoTotalBase = Number(d?.pesoTotal ?? pesoUnitario * cantidad);
      const totalPeso = Number(d?.total_peso ?? d?.pesoTotalKg ?? pesoTotalBase);
      const totalCW = Number(d?.total_cw ?? Math.max(totalPeso, totalVolumen));

      return {
        ...d,
        cotdetdim_cantidad: cantidad,
        cotdetdim_largo: largo,
        cotdetdim_ancho: ancho,
        cotdetdim_alto: alto,
        cotdetdim_peso_unitario: pesoUnitario,
        cotdetdim_unidad_medida: d?.cotdetdim_unidad_medida ?? d?.unidadMedida?.value ?? null,
        cotdetdim_unidad_peso: d?.cotdetdim_unidad_peso ?? d?.unidadPeso?.value ?? null,
        total_peso: totalPeso,
        total_volumen: totalVolumen,
        total_cw: totalCW,
      };
    });
  }, []);

  // ✅ 1) al cambiar versión: cargar defaults y marcar origen init (esto debe disparar “consulta flete” en padre)
  useEffect(() => {
    cambioOrigenRef.current = "init";
    setValores(valoresDefaultProcesados || {});
  }, [resetKey, valoresDefaultProcesados]);

  // ✅ 2) cuando el padre manda valor_flete: solo setear y marcar origen flete (NO debe disparar consulta)
  useEffect(() => {
    if (valorFlete == null) return;

    cambioOrigenRef.current = "flete";
    setValores((prev) => {
      if (prev?.valor_flete === valorFlete) return prev;
      return { ...prev, valor_flete: valorFlete };
    });
  }, [valorFlete]);

  // dimensiones -> calculadora
  useEffect(() => {
    const items = mapDimensionesApiToCalcItems(listaDimensiones);
    setListaCalculos(items);
    setTotalesCalculadora(calcularTotalesMinimos(items));
  }, [listaDimensiones, mapDimensionesApiToCalcItems]);

  useEffect(() => {
    onDimensionesChage(normalizarDimensionesParaGuardar(listaCalculos));
  }, [onDimensionesChage, listaCalculos, normalizarDimensionesParaGuardar]);

  // ✅ 3) EMITIR AL PADRE SOLO CUANDO TOCA (init o user), NUNCA por flete
  const enviarValores = useCallback(
    (force = false) => {
      const origen = cambioOrigenRef.current;

      // si vino de valor_flete, NO emitir (tu paso “espera a criterio 13”)
      if (origen === "flete") return;

      const payload = {
        ...(valores || {}),
        cod_commodity: valores.cod_commodity?.value,
        categoria_transporte: valores.categoria_transporte === "0" ? null : valores.categoria_transporte,
      };
      const signature = JSON.stringify(payload);

      // evita spam si el objeto realmente no cambió
      if (!force && signature === lastSentRef.current) return;
      lastSentRef.current = signature;

      onValoresChange(payload, { force });
    },
    [valores, onValoresChange],
  );

  const catalogosCriterios = useMemo(
    () => ({
      cod_puntoenlace_origen: { catalogo: paises.data || [], value: "value", label: "label" },
      cod_puntoenlace_destino: { catalogo: paises.data || [], value: "value", label: "label" },
      cod_equipo: { catalogo: equipos.data || [], value: "value", label: "label" },
      cod_commodity: { catalogo: commodity.data || [], value: "value", label: "label" },
      entidad_id: { catalogo: entidades.data?.data || [], value: "entidad_id", label: "entidad_nombre" },
      express: { catalogo: accionesRadio, value: "value", label: "label" },
      categoria_transporte: { catalogo: [...(categoriaTransporte.data || []), { value: 0, label: "TODOS" }], value: "value", label: "label" },
    }),
    [paises.data, equipos.data, commodity.data, categoriaTransporte.data, entidades.data?.data],
  );

  const catalogoInputs = useMemo(
    () => [
      { tipo: "select", subtipo: "select", options: [], size: 4 },
      { tipo: "number", subtipo: "number", min: 0, size: 4 },
      { tipo: "radio", subtipo: "radio", size: 4 },
      { tipo: "toggle", subtipo: "toggle", size: 4 },
      {
        tipo: "number",
        subtipo: "calcular",
        min: 0,
        size: 4,
        readonly: true,
        // actions: [{ nombre: "Calcular", icono: "c-calcular", readonly: false, onClick: () => setMostrarCalculadora(true) }],
      },
    ],
    [],
  );

  const obtenerCW = (valor, totales, valoresCalc) => {
    setMostrarCalculadora(false);

    const pesoTotal = Number(totales?.pesoTotal || 0);
    const volumenTotal = Number(totales?.volumenTotal || 0);
    const cantidadTotal = Number(totales?.cantidadTotal || 0);

    cambioOrigenRef.current = "user";
    setValores((v) => ({
      ...v,
      valor_por_peso: pesoTotal,
      valor_cw: valor?.valor ?? null,
      total_peso: pesoTotal,
      total_volumen: volumenTotal,
      total_cw: Math.max(pesoTotal, volumenTotal),
    }));

    setListaCalculos(
      (Array.isArray(valoresCalc) ? valoresCalc : []).map((i) => ({
        ...i,
        valor_por_peso: pesoTotal,
        valor_cw: valor?.valor ?? null,
        total_peso: pesoTotal,
        total_volumen: volumenTotal,
        total_cw: Math.max(pesoTotal, volumenTotal),
      })),
    );
    setTotalesCalculadora({
      pesoKgTotal: pesoTotal,
      pesoKgResultado: pesoTotal,
      volumenTotal,
      volumenResultado: volumenTotal,
      cantidadTotal,
      cantidadResultado: cantidadTotal,
    });
    onTotalesChange({ valor, totales });
  };

  const criteriosConCategoria = useMemo(() => [...criterios], [criterios]);

  const generarInputs = useMemo(() => {
    // 👇 helper: evita que RadioGroup reciba undefined (uncontrolled -> controlled)
    const normalizeVal = (tipo, id, v) => {
      if (tipo === "radio") {
        // si querés que "categoria_transporte" por defecto sea TODOS (0), dejalo así:
        if (id === "categoria_transporte") return v ?? 0;

        // para radios booleanos tipo express, que empiece sin selección:
        if (id === "express") return v ?? "";

        // cualquier otro radio
        return v ?? "";
      } else if ("number" === tipo || "calcular" === tipo) {
        return v ?? null;
      }

      return v;
    };

    const criteriosConCategoria = [...criterios];

    return criteriosConCategoria
      .filter((i) => !INPUTS_NO_VISIBLES.some((b) => b === i.campo))
      .map((criterio) => {
        const { cod_criterio, cod_tipo_dato, campo: id, descripcion: label } = criterio;

        const tipo = cod_tipo_dato === 1 ? "number" : cod_tipo_dato === 4 ? "select" : cod_tipo_dato === 5 ? "calcular" : cod_tipo_dato === 6 ? "radio" : cod_tipo_dato === 7 ? "radio" : null;

        if (!tipo) return null;

        // ✅ regla: criterio 13 solo si ya hay valor_flete
        if (cod_criterio === 13 && !mostrarExpress) return null;

        const input = catalogoInputs.find((i) => i.subtipo === tipo);
        if (!input) return null;

        const esCatalogo = cod_tipo_dato === 4 || cod_tipo_dato === 6 || cod_tipo_dato === 7;
        const cat = esCatalogo ? catalogosCriterios[id] : null;

        const rawVal = valores?.[id];

        return {
          ...input,
          grupoId: tipo,
          id,
          label, // : `[${cod_tipo_dato}] - ${label}`,
          // label: `[${id}] - ${label}`,
          val: normalizeVal(tipo, id, rawVal), // ✅ AQUÍ se evita el warning
          visible: !INPUTS_NO_VISIBLES.includes(id),
          readonly: id === "valor_por_peso" ? true : tipo === "calcular" ? true : lectura,
          options: esCatalogo ? cat?.catalogo || [] : undefined,
          valueOption: esCatalogo ? cat?.value || "value" : undefined,
          labelOption: esCatalogo ? cat?.label || "label" : undefined,
          size: 12,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.cod_tipo_dato - b.cod_tipo_dato);
  }, [criterios, valores, catalogoInputs, lectura, catalogosCriterios, mostrarExpress]);

  const generarGrupos = useMemo(() => {
    // 👇 helper: evita que RadioGroup reciba undefined (uncontrolled -> controlled)

    const criteriosConCategoria = [...criterios];

    const grupos = [];

    criteriosConCategoria.forEach((criterio) => {
      const { cod_criterio, cod_tipo_dato, campo: id, descripcion: label } = criterio;

      const tipo = cod_tipo_dato === 1 ? "number" : cod_tipo_dato === 4 ? "select" : cod_tipo_dato === 5 ? "calcular" : cod_tipo_dato === 6 ? "radio" : cod_tipo_dato === 7 ? "radio" : null;

      if (!tipo) return null;

      // ✅ regla: criterio 13 solo si ya hay valor_flete
      if (cod_criterio === 13 && !mostrarExpress) return null;

      const input = catalogoInputs.find((i) => i.subtipo === tipo);
      if (!input) return null;

      const item = { ...input, id: tipo, mostrarTitulo: false, size: 6 };

      if (!grupos.some((g) => g.id === tipo)) grupos.push(item);
    });
    return grupos;
  }, [criterios, catalogoInputs, mostrarExpress]);

  const valoresDefaultCalc = useMemo(() => {
    const items = listaCalculos || [];
    return { items, totales: totalesCalculadora };
  }, [listaCalculos, totalesCalculadora]);

  // ✅ IMPORTANTE: aquí NO llamamos onValoresChange (solo marcamos origen user)
  const handleInput = useCallback(({ id, val }) => {
    cambioOrigenRef.current = "user";
    setValores((v) => ({ ...v, [id]: val }));
  }, []);

  return (
    <Grid size={12} width="100%" container p={1}>
      <Grid size={12} width="100%" container>
        <Grid size={6} container px={2}>
          <ResumenItem label="CW" valor={valores?.valor_cw ?? 0} />

          {/* <Grid size={6} container>
            <GenerarCeldaNombre nombre="CW" />
          </Grid>
          <Grid size={6} container>
            <GenerarCeldaValor moneda={""} valor={valores?.valor_cw ?? 0} decimales={0} />
          </Grid> */}
        </Grid>
        <Grid size={6} container px={2}>
          <ResumenItem label="PESO" valor={valores?.valor_por_peso ?? 0} />
          {/* <Grid size={6} container>
            <GenerarCeldaNombre nombre="PESO" />
          </Grid>
          <Grid size={6} container>
            <GenerarCeldaValor moneda={""} valor={valores?.valor_por_peso ?? 0} decimales={0} />
          </Grid> */}
        </Grid>
      </Grid>
      <Grid size={12} width="100%">
        <FormularioComponent
          width="100%"
          data={{ inputs: generarInputs, grupos: generarGrupos }}
          onInput={handleInput}
          botones={{
            agregar: { visible: false },
            calculadora: {
              name: "calculadora",
              icono2: <PictureInPicture size={20} style={{ color: !lectura ? "white" : colors?.accent?.main, rotate: "180deg" }} />,
              // icono: "c-calcular",
              texto: "Abrir calculadora",
              onClick: () => setMostrarCalculadora(true),
              color: "accent",
              textColor: !lectura ? "white" : "accent",
              variant: !lectura && "contained",
              visible: true,
            },
            calcular: {
              name: "calcular",
              icono2: <Calculator size={20} style={{ color: "white" }} />,
              texto: "Calcular",
              onClick: () => enviarValores(true),
              visible: !lectura,
              color: "primary",
              variant: "contained",
            },
          }}
        />
      </Grid>
      <CalculadoraDeCantidadYMedidas
        open={mostrarCalculadora}
        setOpen={setMostrarCalculadora}
        agregar={obtenerCW}
        valoresDefault={valoresDefaultCalc}
        readonly={lectura}
        tipoTransporte={cotizacion?.cod_tipo_transporte}
      />
      <Grid conteiner>
        {/* <pre>{JSON.stringify(criterios, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(criteriosConCategoria.length, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valoresDefault, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valoresDefaultProcesados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ valorFlete }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ cotizacion }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ mostrarExpress }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ generarInputs: generarInputs.map((i) => ({ ...i, options: undefined })) }, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

GenerarFiltrosCriterios.propTypes = {
  criterios: PropTypes.arrayOf(PropTypes.object),
  listaDimensiones: PropTypes.arrayOf(PropTypes.object),
  valoresDefault: PropTypes.object,
  valorFlete: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onValoresChange: PropTypes.func,
  onDimensionesChage: PropTypes.func,
  onTotalesChange: PropTypes.func,
  lectura: PropTypes.bool,
  resetKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mostrarExpress: PropTypes.bool,
  cotizacion: PropTypes.object,
};

export default GenerarFiltrosCriterios;
