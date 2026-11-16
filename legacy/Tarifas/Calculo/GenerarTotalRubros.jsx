import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FormControlLabel, Grid, Radio, RadioGroup, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Typography } from "@mui/material";

import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import { useFetchRubros } from "../../../hooks/Fetch/useFetchTarifas";
import { GenerarCeldaDetalle, GenerarCeldaNombre, GenerarCeldaVaciaDetalle, GenerarCeldaVaciaValor, GenerarCeldaValor } from "./RenderizadosDePartes";
import { construirAgrupacionAutomatica } from "@/views/Tarifas/Cotizaciones/GestionCotizacion/helpers/manejo_grupos";

// ---------- helpers ----------
const getLetraTipoPago = (codTipoPago) => (codTipoPago === 127 ? "C" : codTipoPago === 128 ? "P" : "P");

const GrupoInput = ({ value, onChange, lectura = false }) => {
  // input nativo, compacto, sin cambiar altura de row
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      inputMode="numeric"
      disabled={lectura}
      style={{
        width: "42px",
        height: "22px",
        lineHeight: "22px",
        padding: "10px",
        border: "1px solid #104f9c",
        borderRadius: "6px",
        textAlign: "center",
        outline: "none",
        font: "inherit",
        background: "transparent",
      }}
    />
  );
};

GrupoInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  lectura: PropTypes.bool,
};

const GrupoNombreInput = ({ value, onChange, lectura = false }) => (
  <input
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder="Nombre grupo"
    disabled={lectura}
    style={{
      width: "140px",
      height: "18px",
      lineHeight: "18px",
      padding: "10px",
      border: "1px solid #104f9c",
      borderRadius: "6px",
      outline: "none",
      font: "inherit",
      background: "transparent",
      textAlign: "right",
    }}
  />
);

GrupoNombreInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  lectura: PropTypes.bool,
};
// ---------- component ----------
const GenerarTotalRubros = ({ rubros, cotizacion, entidad, lectura = false, onRubrosAgrupados = () => {} }) => {
  const monedas = useFetchMonedas();
  const rubrosCatalogo = useFetchRubros();

  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState({});
  const [gruposIngresadosSegunRubro, setGruposIngresadosSegunRubro] = useState({});

  const codTipoPago = cotizacion?.cod_tipo_pago;
  const letraTipoPagoDefault = useMemo(() => getLetraTipoPago(codTipoPago), [codTipoPago]);
  const mostrarRadio = useMemo(() => codTipoPago === 131, [codTipoPago]);

  const IVA_DEFAULT = 0.12;

  const tiene_tarifa_spot = rubros.some((i) => i.es_tarifa_spot);

  const esTipoPagoPrepaid = ({ item, codTipoPago, tipoPagoSeleccionado, letraTipoPagoDefault }) => {
    if (codTipoPago === 131) {
      return (tipoPagoSeleccionado?.[item.value] ?? item?.letra_tipo_pago ?? letraTipoPagoDefault) === "P";
    }

    return Number(item?.cod_tipo_pago ?? codTipoPago) === 128;
  };

  const porcentajeIVA = IVA_DEFAULT; // luego aquí vendrá de BD

  const [nombresGrupo, setNombresGrupo] = useState({}); // <-- nombre por idDeGrupo

  const getMetodo = (item) => item?.metodo ?? item?.servicio?.metodo;
  const codRubroIVA = useMemo(() => {
    const ivaCatalogo = (rubrosCatalogo?.data || []).find((r) => `${r?.nombre || ""}`.trim().toUpperCase() === "IVA");
    return ivaCatalogo?.cod_rubro ?? null;
  }, [rubrosCatalogo?.data]);

  const rubrosIvaEnCalculo = useMemo(
    () =>
      (rubros || [])
        .filter((i) => !i.es_flete || (tiene_tarifa_spot ? i.es_tarifa_spot : i.es_flete))
        .filter((r) => {
          const nombre = `${r?.nombre || r?.gruporubro_nombre || ""}`.trim().toUpperCase();
          return (codRubroIVA !== null && r?.cod_rubro === codRubroIVA) || nombre === "IVA";
        }),
    [rubros, tiene_tarifa_spot, codRubroIVA],
  );

  const rubrosSinIva = useMemo(
    () =>
      (rubros || [])
        .filter((i) => !i.es_flete || (tiene_tarifa_spot ? i.es_tarifa_spot : i.es_flete))
        .filter((r) => {
          const nombre = `${r?.nombre || r?.gruporubro_nombre || ""}`.trim().toUpperCase();
          return !((codRubroIVA !== null && r?.cod_rubro === codRubroIVA) || nombre === "IVA");
        }),
    [rubros, tiene_tarifa_spot, codRubroIVA],
  );

  const agrupacionDesdeDetalle = useMemo(() => {
    const gruposIngresados = {};
    const nombres = {};
    const idPorNombre = new Map();
    let seq = 1;

    (rubrosSinIva || []).forEach((item) => {
      const nombre = `${item?.gruporubro_nombre || ""}`.trim();
      if (!nombre) return;
      if (!item?.value) return;

      if (!idPorNombre.has(nombre)) {
        idPorNombre.set(nombre, seq);
        nombres[String(seq)] = nombre;
        seq += 1;
      }

      const idDeGrupo = idPorNombre.get(nombre);
      gruposIngresados[item.value] = { idDeGrupo, nombre };
    });

    return { gruposIngresados, nombres };
  }, [rubrosSinIva]);

  // Normaliza sin side-effects
  const listaElementos = useMemo(() => {
    return (rubrosSinIva || [])
      .map((i) => ({
        ...i,
        cod_tipo_pago: codTipoPago,
        letra_tipo_pago: letraTipoPagoDefault,
        idDeGrupo: 0,
      }))
      .filter((i) => i?.metodo?.venta);
  }, [rubrosSinIva, codTipoPago, letraTipoPagoDefault]);

  const sugerenciaNombreGrupo = useMemo(() => {
    // { [idDeGrupo]: { count, sugerido } }
    const map = {};

    for (const item of listaElementos) {
      const rubroId = item.value;
      const idDeGrupo = gruposIngresadosSegunRubro?.[rubroId]?.idDeGrupo;
      if (!idDeGrupo) continue;

      const nombreServicio = item?.servicio?.nombre || "";

      if (!map[idDeGrupo]) {
        map[idDeGrupo] = { count: 1, sugerido: nombreServicio };
      } else {
        map[idDeGrupo].count += 1;
        // Si hay más de uno, ya no hay sugerencia automática útil
        map[idDeGrupo].sugerido = "";
      }
    }

    return map;
  }, [listaElementos, gruposIngresadosSegunRubro]);

  useEffect(() => {
    const auto = construirAgrupacionAutomatica(rubrosSinIva, {
      codCc: cotizacion?.cod_cc,
      codTipoTransporte: cotizacion?.cod_tipo_transporte,
    });

    setGruposIngresadosSegunRubro({
      ...auto.gruposIngresados,
      ...agrupacionDesdeDetalle.gruposIngresados,
    });

    setNombresGrupo((prev) => ({
      ...auto.nombres,
      ...agrupacionDesdeDetalle.nombres,
      ...prev,
    }));

    const next = {};

    (rubrosSinIva || []).forEach((i) => {
      if (!i) return;
      if (!i.value) return;

      if (codTipoPago === 131) {
        next[i.value] = i?.cod_tipo_pago ? getLetraTipoPago(i.cod_tipo_pago) : letraTipoPagoDefault;
      } else {
        next[i.value] = letraTipoPagoDefault;
      }
    });

    setTipoPagoSeleccionado(next);
  }, [codTipoPago, letraTipoPagoDefault, rubrosSinIva, agrupacionDesdeDetalle, cotizacion?.cod_cc, cotizacion?.cod_tipo_transporte]);

  const getSimboloMoneda = useCallback(
    (item) => {
      const metodo = getMetodo(item);
      return monedas.data?.find((m) => (metodo?.cod_moneda_venta ?? 2) === m.cod_moneda)?.SIMBOLO_MONEDA;
    },
    [monedas.data],
  );

  const totalPorMoneda = useMemo(() => {
    const dataMonedas = monedas.data || [];

    const existeRubroConIVA = listaElementos.some((item) =>
      esTipoPagoPrepaid({
        item,
        codTipoPago,
        tipoPagoSeleccionado,
        letraTipoPagoDefault,
      }),
    );

    const ivaExistentePorMoneda = existeRubroConIVA
      ? (rubrosIvaEnCalculo || []).reduce((acc, item) => {
          const metodo = getMetodo(item);
          const codMoneda = metodo?.cod_moneda_venta;
          if (!codMoneda) return acc;

          acc[codMoneda] = Number(acc[codMoneda] || 0) + Number(metodo?.venta || 0);
          return acc;
        }, {})
      : {};

    const acumulado = listaElementos.reduce((sum, item) => {
      const metodo = getMetodo(item);
      const moneda = dataMonedas.find((m) => (metodo?.cod_moneda_venta ?? 2) === m.cod_moneda);

      if (!moneda) return sum;

      const venta = Number(metodo?.venta || 0);
      const total = (sum[moneda.cod_moneda]?.total || 0) + venta;

      sum[moneda.cod_moneda] = {
        total,
        moneda,
      };

      return sum;
    }, {});

    const acumuladaParaIVA = listaElementos
      .filter((item) =>
        esTipoPagoPrepaid({
          item,
          codTipoPago,
          tipoPagoSeleccionado,
          letraTipoPagoDefault,
        }),
      )
      .reduce((sum, item) => {
        const metodo = getMetodo(item);
        const moneda = dataMonedas.find((m) => (metodo?.cod_moneda_venta ?? 2) === m.cod_moneda);

        if (!moneda) return sum;

        const venta = Number(metodo?.venta || 0);
        const total = (sum[moneda.cod_moneda]?.total || 0) + venta;

        sum[moneda.cod_moneda] = {
          total,
          moneda,
        };

        return sum;
      }, {});

    Object.keys(acumulado).forEach((key) => {
      const total = acumulado[key].total;
      const totalParaIVA = acumuladaParaIVA[key]?.total || 0;

      const iva = existeRubroConIVA ? (ivaExistentePorMoneda[key] ?? totalParaIVA * porcentajeIVA) : 0;

      acumulado[key].iva = iva;
      acumulado[key].totalConIVA = total + iva;
    });

    return acumulado;
  }, [monedas.data, listaElementos, rubrosIvaEnCalculo, codTipoPago, tipoPagoSeleccionado, letraTipoPagoDefault, porcentajeIVA]);
  const elementosAgrupados = useMemo(() => {
    const salida = [];
    const gruposMap = new Map();

    for (const item of listaElementos) {
      const rubroId = item.value;
      const metodo = getMetodo(item);
      const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";
      const venta = Number(metodo?.venta || 0);

      const idDeGrupo = gruposIngresadosSegunRubro?.[rubroId]?.idDeGrupo;

      // Si no tiene grupo => se muestra como estaba antes
      if (!idDeGrupo) {
        salida.push({ ...item, __tipo: "ITEM" });
        continue;
      }

      // Agrupar por (idDeGrupo + moneda) para no mezclar monedas
      const tipoPago = tipoPagoSeleccionado[rubroId] || item.letra_tipo_pago || letraTipoPagoDefault;
      const key = `${idDeGrupo}__${codMoneda}__${tipoPago}`;

      if (!gruposMap.has(key)) {
        gruposMap.set(key, {
          // fila "grupo" (no es un rubro real)
          value: `GRUPO_${key}`, // id único para React
          __tipo: "GRUPO",
          __idDeGrupo: idDeGrupo,
          __codMoneda: codMoneda,

          // Para mostrar letra tipo pago (si tiene sentido)
          letra_tipo_pago: tipoPago,

          // Datos para reutilizar tus celdas
          metodo: {
            ...(metodo || {}),
            cod_moneda_venta: codMoneda,
            venta,
            detalles: [...(metodo?.detalles || [])],
          },
        });
      } else {
        const acc = gruposMap.get(key);
        acc.metodo.venta = Number(acc.metodo.venta || 0) + venta;
        // Si quieres concatenar detalles:
        acc.metodo.detalles = [...(acc.metodo.detalles || []), ...(metodo?.detalles || [])];
      }
    }

    // Primero los ítems sin grupo y luego las filas de grupo
    salida.unshift(...Array.from(gruposMap.values()));
    return salida;
  }, [listaElementos, gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault]);

  const handleChangeTipoPago = useCallback(
    (rubroId, value) => {
      const idDeGrupo = gruposIngresadosSegunRubro?.[rubroId]?.idDeGrupo;

      // CAMBIO: si pertenece a grupo, cambiar todos los rubros del mismo grupo
      if (idDeGrupo) {
        setTipoPagoSeleccionado((prev) => {
          const next = { ...prev };

          Object.entries(gruposIngresadosSegunRubro).forEach(([otroRubroId, info]) => {
            if (Number(info?.idDeGrupo) === Number(idDeGrupo)) {
              next[otroRubroId] = value;
            }
          });

          return next;
        });

        return;
      }

      // sin grupo, cambia solo el rubro actual
      setTipoPagoSeleccionado((prev) => ({ ...prev, [rubroId]: value }));
    },
    [gruposIngresadosSegunRubro],
  );

  useEffect(() => {
    if (lectura) return;

    setNombresGrupo((prev) => {
      let changed = false;
      const next = { ...prev };

      // SOLO eliminar si el grupo ya no existe en los rubros
      const gruposActivos = new Set(
        Object.values(gruposIngresadosSegunRubro || {})
          .map((g) => g?.idDeGrupo)
          .filter(Boolean)
          .map(String),
      );

      for (const id in next) {
        if (!gruposActivos.has(id)) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [gruposIngresadosSegunRubro, lectura]);

  const handleChangeNombreGrupo = useCallback((idDeGrupo, nombre) => {
    const key = String(idDeGrupo);
    setNombresGrupo((v) => ({ ...v, [key]: nombre }));
  }, []);

  const handleChangeGrupo = useCallback(
    (rubroId, raw) => {
      const cleaned = String(raw ?? "").replace(/[^\d]/g, "");
      const idDeGrupo = cleaned === "" ? "" : parseInt(cleaned, 10);

      // permitir limpiar
      if (idDeGrupo === "") {
        setGruposIngresadosSegunRubro((v) => {
          const next = { ...v };
          delete next[rubroId];
          return next;
        });
        return;
      }

      // tipo pago del rubro actual
      const tipoPagoActual = tipoPagoSeleccionado[rubroId] || letraTipoPagoDefault; // "P" o "C"

      // buscar si ese grupo ya está usado por otro rubro con tipo distinto
      let conflicto = false;

      for (const [otroRubroId, info] of Object.entries(gruposIngresadosSegunRubro)) {
        if (!info?.idDeGrupo) continue;
        if (Number(info.idDeGrupo) !== idDeGrupo) continue;
        if (String(otroRubroId) === String(rubroId)) continue;

        const tipoPagoOtro = tipoPagoSeleccionado[otroRubroId] || letraTipoPagoDefault;

        if (tipoPagoOtro !== tipoPagoActual) {
          conflicto = true;
          break;
        }
      }

      if (conflicto) {
        // NO asignar el grupo si mezcla P/C
        // opcional: puedes poner un console.warn o disparar un anuncio/toast
        return;
      }

      // asignar normalmente
      setGruposIngresadosSegunRubro((v) => ({
        ...v,
        [rubroId]: { idDeGrupo, nombre: v?.[rubroId]?.nombre || "" },
      }));
    },
    [gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault],
  );

  // ---------- generar payload para API ----------
  const letraToCodTipoPago = (letra) => (letra === "C" ? 127 : 128);

  useEffect(() => {
    const todos = listaElementos || [];

    // si no hay nada, avisar vacío
    if (!todos.length) {
      onRubrosAgrupados([]);
      return;
    }

    const letraToCodTipoPagoLocal = (letra) => (letra === "C" ? 127 : 128);

    // totales por grupo SOLO para los que tienen grupo
    const totalesPorGrupo = new Map();

    for (const item of todos) {
      const rubroId = item.value;
      const idDeGrupo = gruposIngresadosSegunRubro?.[rubroId]?.idDeGrupo;
      if (!idDeGrupo) continue;

      const metodo = getMetodo(item);
      const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";
      const letra = tipoPagoSeleccionado?.[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

      const key = `${idDeGrupo}__${codMoneda}__${letra}`;

      const venta = Number(metodo?.venta || 0);
      const costo = Number(metodo?.costo || 0);

      const acc = totalesPorGrupo.get(key) || {
        venta_grupo: 0,
        costo_grupo: 0,
      };
      acc.venta_grupo += venta;
      acc.costo_grupo += costo;
      totalesPorGrupo.set(key, acc);
    }

    const getNombreGrupo = (idDeGrupo, fallbackRubroNombre) => {
      if (!idDeGrupo) return null; // 👈 sin grupo
      const idKey = String(idDeGrupo);

      if (Object.prototype.hasOwnProperty.call(nombresGrupo, idKey)) {
        return nombresGrupo[idKey] ?? "";
      }

      const info = sugerenciaNombreGrupo?.[idKey];
      const sugerido = info?.count === 1 ? (info?.sugerido ?? "") : "";

      // si querés tu fallback a nombre del rubro cuando no haya nada:
      return sugerido || fallbackRubroNombre || "";
    };

    const payload = todos.map((item) => {
      const rubroId = item.value;
      const metodo = getMetodo(item);

      const idDeGrupo = gruposIngresadosSegunRubro?.[rubroId]?.idDeGrupo || null;

      const nombreGrupo = getNombreGrupo(idDeGrupo, item?.nombre);

      const codMoneda = metodo?.cod_moneda_venta ?? "SIN_MONEDA";
      const letra = tipoPagoSeleccionado?.[rubroId] ?? item.letra_tipo_pago ?? letraTipoPagoDefault;

      const cod_tipo_pago_db = codTipoPago === 131 ? letraToCodTipoPagoLocal(letra) : codTipoPago;

      const venta_rubro = Number(metodo?.venta || 0);
      const costo_rubro = Number(metodo?.costo || 0);

      // si no hay grupo: grupo = rubro
      let venta_grupo = venta_rubro;
      let costo_grupo = costo_rubro;

      if (idDeGrupo) {
        const key = `${idDeGrupo}__${codMoneda}__${letra}`;
        const tot = totalesPorGrupo.get(key);
        if (tot) {
          venta_grupo = Number(tot.venta_grupo || 0);
          costo_grupo = Number(tot.costo_grupo || 0);
        }
      }

      return {
        cod_detallerubro: item.cod_detallerubro,
        cod_cotizaciondetalle: item.cod_cotizaciondetalle,
        cod_rubro: item.cod_rubro,

        idDeGrupo,

        gruporubro_nombre: idDeGrupo ? nombreGrupo : item?.nombre,

        costo_rubro,
        costo_grupo,

        venta_rubro,
        venta_grupo,

        es_tarifa_spot: item.es_tarifa_spot,
        es_flete: item.es_flete,
        original_venta: metodo?.original_venta,

        cod_moneda_costo: metodo?.cod_moneda_costo ?? metodo?.cod_moneda_venta,
        cod_moneda_venta: metodo?.cod_moneda_venta,

        cod_servicio: item?.servicio?.cod_servicio,
        entidad_id: item?.servicio?.entidad_id ?? item?.entidad_id,
        clasificacion: item?.servicio_clasificacion,

        cod_tipo_pago: cod_tipo_pago_db,

        cod_tipo_facturacion: item?.cod_tipo_facturacion ?? null,
        cod_tipo_calculo: metodo?.cod_tipo_calculo,
        cod_metodo: metodo?.cod_metodo,
        rate_costo: metodo?.rate_costo ?? null,
        rate_venta: metodo?.rate_venta ?? null,
        original_rate_costo: metodo?.original_rate_costo ?? null,
        original_rate_venta: metodo?.original_rate_venta ?? null,

        detalle: (metodo?.detalles || [])
          .map((i) => {
            const tipo = `${i?.tipo_desc || ""}`.trim();
            const desc = `${i?.tarifadetalle_descripcion || i?.tarifadetalle_valor || ""}`.trim();
            if (!tipo && !desc) return "";
            if (!tipo) return desc;
            if (!desc) return tipo;
            return `${tipo}: ${desc}`;
          })
          .filter(Boolean)
          .join(", "),
      };
    });

    const existeRubroConIVA = todos.some((item) =>
      esTipoPagoPrepaid({
        item,
        codTipoPago,
        tipoPagoSeleccionado,
        letraTipoPagoDefault,
      }),
    );

    const payloadIvaExistente = existeRubroConIVA
      ? (rubrosIvaEnCalculo || []).map((item) => {
          const metodo = getMetodo(item);
          const ventaIva = Number(metodo?.venta || 0);
          const costoIva = Number(metodo?.costo ?? ventaIva);

          return {
            cod_detallerubro: item?.cod_detallerubro ?? null,
            cod_cotizaciondetalle: item?.cod_cotizaciondetalle ?? todos?.[0]?.cod_cotizaciondetalle ?? null,
            cod_rubro: item?.cod_rubro ?? codRubroIVA ?? null,
            gruporubro_nombre: "IVA",
            costo_rubro: costoIva,
            costo_grupo: costoIva,
            venta_rubro: ventaIva,
            venta_grupo: ventaIva,
            es_tarifa_spot: false,
            cod_moneda_costo: metodo?.cod_moneda_costo ?? metodo?.cod_moneda_venta ?? null,
            cod_moneda_venta: metodo?.cod_moneda_venta ?? null,
            cod_servicio: null,
            entidad_id: item?.servicio?.entidad_id ?? item?.entidad_id ?? entidad?.entidad_id ?? entidad?.cod_entidad ?? entidad?.id ?? null,
            clasificacion: null,
            cod_tipo_pago: 128, // item?.cod_tipo_pago ?? (codTipoPago === 131 ? 127 : codTipoPago),
            cod_tipo_facturacion: null,
            cod_tipo_calculo: null,
            cod_metodo: null,
            rate_costo: metodo?.rate_costo ?? item?.rate_costo ?? porcentajeIVA,
            rate_venta: metodo?.rate_venta ?? item?.rate_venta ?? porcentajeIVA,
            detalle:
              (metodo?.detalles || [])
                .map((i) => {
                  const tipo = `${i?.tipo_desc || ""}`.trim();
                  const desc = `${i?.tarifadetalle_descripcion || i?.tarifadetalle_valor || ""}`.trim();
                  if (!tipo && !desc) return "";
                  if (!tipo) return desc;
                  if (!desc) return tipo;
                  return `${tipo}: ${desc}`;
                })
                .filter(Boolean)
                .join(", ") ||
              item?.detalle ||
              "IVA: 12%",
          };
        })
      : [];

    if (payloadIvaExistente.length) {
      onRubrosAgrupados([...payload, ...payloadIvaExistente]);
      return;
    }

    const payloadConIva = [...payload];
    const codCotizacionDetalle = todos?.[0]?.cod_cotizaciondetalle ?? null;

    if (existeRubroConIVA && codRubroIVA !== null) {
      Object.keys(totalPorMoneda || {}).forEach((codMoneda) => {
        const totalMoneda = totalPorMoneda[codMoneda];
        const iva = Number(totalMoneda?.iva || 0);
        payloadConIva.push({
          cod_detallerubro: null,
          cod_cotizaciondetalle: codCotizacionDetalle,
          cod_rubro: codRubroIVA,
          gruporubro_nombre: "IVA",
          costo_rubro: iva,
          costo_grupo: iva,
          venta_rubro: iva,
          venta_grupo: iva,
          es_tarifa_spot: false,
          cod_moneda_costo: totalMoneda?.moneda?.cod_moneda ?? codMoneda ?? null,
          cod_moneda_venta: totalMoneda?.moneda?.cod_moneda ?? codMoneda ?? null,
          cod_servicio: null,
          entidad_id: entidad?.entidad_id ?? entidad?.cod_entidad ?? entidad?.id ?? null,
          clasificacion: null,
          cod_tipo_pago: codTipoPago === 131 ? 128 : codTipoPago,
          cod_tipo_facturacion: null,
          cod_tipo_calculo: null,
          cod_metodo: null,
          rate_costo: porcentajeIVA,
          rate_venta: porcentajeIVA,
          detalle: "IVA: 12%",
        });
      });
    }

    onRubrosAgrupados(payloadConIva.filter((i) => i.venta_rubro > 0));
  }, [
    listaElementos,
    gruposIngresadosSegunRubro,
    tipoPagoSeleccionado,
    letraTipoPagoDefault,
    nombresGrupo,
    sugerenciaNombreGrupo,
    codTipoPago,
    onRubrosAgrupados,
    rubrosIvaEnCalculo,
    codRubroIVA,
    totalPorMoneda,
    entidad,
    porcentajeIVA,
  ]);

  // useEffect(() => {
  //   console.log([listaElementos, gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault, nombresGrupo, sugerenciaNombreGrupo, codTipoPago, onRubrosAgrupados]);
  //   onRubrosAgrupados();
  // }, [listaElementos, gruposIngresadosSegunRubro, tipoPagoSeleccionado, letraTipoPagoDefault, nombresGrupo, sugerenciaNombreGrupo, codTipoPago, onRubrosAgrupados]);

  const renderSubTotalFooter = () =>
    Object.keys(totalPorMoneda).map((tipo_moneda, ind) => (
      <TableRow
        key={tipo_moneda}
        hover
        sx={
          ind === 0
            ? {
                borderTopColor: "primary.main",
                borderTopWidth: 2,
                borderTopStyle: "solid",
              }
            : undefined
        }
      >
        <TableCell />
        <TableCell />
        <TableCell>
          <GenerarCeldaNombre nombre="SUB TOTAL" />
        </TableCell>
        <TableCell width="1%">
          <Grid container size={3} pr={1} justifyContent="end" p={0}>
            {totalPorMoneda[tipo_moneda]?.total ? (
              <GenerarCeldaValor total moneda={totalPorMoneda[tipo_moneda]?.moneda?.SIMBOLO_MONEDA} valor={totalPorMoneda[tipo_moneda]?.total || 0} />
            ) : (
              <GenerarCeldaVaciaValor total />
            )}
          </Grid>
        </TableCell>
        <TableCell width="1%">
          <GenerarCeldaDetalle detalles={[{ tipo_desc: "Sin IVA", tarifadetalle_descripcion: "" }]} />
        </TableCell>
      </TableRow>
    ));

  const renderIvaFooter = () =>
    Object.keys(totalPorMoneda).map((tipo_moneda, ind) => (
      <TableRow
        key={tipo_moneda}
        hover
        sx={
          ind === 0
            ? {
                borderTopColor: "primary.main",
                borderTopWidth: 1,
                borderTopStyle: "solid",
              }
            : undefined
        }
      >
        <TableCell />
        <TableCell />
        <TableCell>
          <GenerarCeldaNombre nombre="IVA" />
        </TableCell>
        <TableCell width="1%">
          <Grid container size={3} pr={1} justifyContent="end" p={0}>
            {totalPorMoneda[tipo_moneda]?.total ? (
              <GenerarCeldaValor total moneda={totalPorMoneda[tipo_moneda]?.moneda?.SIMBOLO_MONEDA} valor={totalPorMoneda[tipo_moneda]?.iva || 0} />
            ) : (
              <GenerarCeldaVaciaValor total />
            )}
          </Grid>
        </TableCell>
        <TableCell width="1%">
          <GenerarCeldaDetalle detalles={[{ tipo_desc: "IVA", tarifadetalle_descripcion: "12%" }]} />
        </TableCell>
      </TableRow>
    ));

  const renderTotalFooter = () =>
    Object.keys(totalPorMoneda).map((tipo_moneda, ind) => (
      <TableRow
        key={tipo_moneda}
        hover
        sx={
          ind === 0
            ? {
                borderTopColor: "primary.main",
                borderTopWidth: 4,
                borderTopStyle: "solid",
              }
            : undefined
        }
      >
        <TableCell />
        <TableCell />
        <TableCell>
          <GenerarCeldaNombre nombre="TOTAL" />
        </TableCell>
        <TableCell width="1%">
          <Grid container size={3} pr={1} justifyContent="end" p={0}>
            {totalPorMoneda[tipo_moneda]?.total ? (
              <GenerarCeldaValor total moneda={totalPorMoneda[tipo_moneda]?.moneda?.SIMBOLO_MONEDA} valor={totalPorMoneda[tipo_moneda]?.totalConIVA || 0} />
            ) : (
              <GenerarCeldaVaciaValor total />
            )}
          </Grid>
        </TableCell>
        <TableCell width="1%">
          <GenerarCeldaDetalle detalles={[{ tipo_desc: "Con IVA", tarifadetalle_descripcion: "" }]} />
        </TableCell>
      </TableRow>
    ));

  return (
    <Grid container rowSpacing={2} py={0.5}>
      {/* ===================== TOTAL ===================== */}
      <Grid container rowSpacing={2} width="100%">
        <Grid container bgcolor="#104f9c" width="100%" justifyContent="center" alignItems="center" borderRadius={1.2} px={2} columnSpacing={2}>
          <Grid size="auto">
            <Typography sx={{ color: "white.main", fontSize: 20, letterSpacing: 3 }}>TOTAL</Typography>
          </Grid>
          <Grid size="grow" justifyContent="center" alignItems="center">
            <Grid bgcolor="#fff" py={0.2} />
          </Grid>
        </Grid>

        <Grid size={12} width="100%">
          <TableContainer px={0} width="100%">
            <Table size="small" dense width="100%">
              <TableHead>
                <TableRow>
                  <TableCell width="1%">Grupo</TableCell>
                  <TableCell width="1%"></TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {listaElementos.map((item) => {
                  const id = item.value; // ✅ tu id único
                  const metodo = getMetodo(item);
                  const detalles = metodo?.detalles || []; // ✅ FIX: antes usabas item.metodo
                  const simbolo = getSimboloMoneda(item);

                  return (
                    <TableRow key={id} hover>
                      <TableCell width="1%">
                        {lectura ? (
                          (gruposIngresadosSegunRubro?.[id]?.idDeGrupo ?? "")
                        ) : (
                          <GrupoInput value={gruposIngresadosSegunRubro?.[id]?.idDeGrupo ?? ""} onChange={(val) => handleChangeGrupo(id, val)} lectura={lectura} />
                        )}
                      </TableCell>

                      <TableCell width="1%">
                        {!lectura
                          ? mostrarRadio && (
                              <RadioGroup row name={`tipo_pago_${id}`} value={tipoPagoSeleccionado[id] ?? letraTipoPagoDefault} onChange={(ev) => handleChangeTipoPago(id, ev.target.value)}>
                                <FormControlLabel sx={{ p: 0, m: 0 }} value="P" control={<Radio />} label="Prepaid" />
                                <FormControlLabel sx={{ p: 0, m: 0 }} value="C" control={<Radio />} label="Collect" />
                              </RadioGroup>
                            )
                          : null}
                      </TableCell>

                      <TableCell>
                        <GenerarCeldaNombre nombre={item?.servicio?.nombre || ""} nombre_proveedor={item?.servicio?.entidad_nombre || ""} />
                      </TableCell>

                      <TableCell width="1%">{metodo?.venta ? <GenerarCeldaValor moneda={simbolo} valor={metodo.venta} /> : <GenerarCeldaVaciaValor />}</TableCell>

                      <TableCell width="1%">{detalles.length ? <GenerarCeldaDetalle detalles={detalles} /> : <GenerarCeldaVaciaDetalle />}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>{renderSubTotalFooter()}</TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* <pre style={{ margin: 0 }}>{JSON.stringify(gruposIngresadosSegunRubro, null, 2)}</pre> */}

      {/* ===================== TOTAL AGRUPADO ===================== */}
      <Grid container rowSpacing={2} width="100%">
        <Grid container borderColor="#104f9c" border="1px solid" width="100%" justifyContent="center" alignItems="center" borderRadius={1.2} px={2} columnSpacing={2}>
          <Grid size="auto">
            <Typography sx={{ color: "#104f9c", fontSize: 20, letterSpacing: 3 }}>TOTAL AGRUPADO</Typography>
          </Grid>
          <Grid size="grow" justifyContent="center" alignItems="center">
            <Grid bgcolor="#104f9c" py={0.1} />
          </Grid>
        </Grid>

        <Grid size={12}>
          <TableContainer px={0} width="100%">
            <Table size="small" dense width="100%">
              <TableHead>
                <TableRow>
                  <TableCell width="1%">Grupo</TableCell>
                  <TableCell width="1%" sx={{ textAlign: "center" }}>
                    Prepaid / Collect
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>

              <TableBody>
                {elementosAgrupados.map((item) => {
                  const metodo = getMetodo(item);
                  const detalles = metodo?.detalles || [];
                  const simbolo = getSimboloMoneda(item);

                  // ---------- FILA GRUPO ----------
                  if (item.__tipo === "GRUPO") {
                    const idKey = String(item.__idDeGrupo);

                    const tieneNombreEscrito = Object.prototype.hasOwnProperty.call(nombresGrupo, idKey);
                    const escrito = nombresGrupo?.[idKey] ?? "";

                    // buscar cualquier rubro que pertenezca al grupo
                    const rubroDelGrupo = listaElementos.find((i) => String(gruposIngresadosSegunRubro?.[i.value]?.idDeGrupo) === idKey);

                    // nombre automático
                    const nombreAutomatico = gruposIngresadosSegunRubro?.[rubroDelGrupo?.value]?.nombre;

                    // fallback al nombre del rubro
                    const nombreRubro = rubroDelGrupo?.servicio?.nombre || rubroDelGrupo?.nombre || "";

                    // si el usuario ya tocó el input, respetar aunque sea ""
                    const nombreMostrar = tieneNombreEscrito ? escrito : nombreAutomatico || nombreRubro || "";

                    return (
                      <TableRow key={item.value} hover>
                        <TableCell width="1%">{item.__idDeGrupo}</TableCell>

                        <TableCell width="1%" sx={{ textAlign: "center" }}>
                          {item.letra_tipo_pago || ""}
                        </TableCell>

                        <TableCell>
                          {lectura ? (
                            <GenerarCeldaNombre nombre={nombreMostrar} />
                          ) : (
                            <GrupoNombreInput value={nombreMostrar} onChange={(txt) => handleChangeNombreGrupo(idKey, txt)} lectura={lectura} />
                          )}
                        </TableCell>

                        <TableCell width="1%">
                          <GenerarCeldaValor moneda={simbolo} valor={metodo?.venta || 0} />
                        </TableCell>

                        <TableCell width="1%">{detalles.length ? <GenerarCeldaDetalle detalles={detalles} /> : <GenerarCeldaVaciaDetalle />}</TableCell>
                      </TableRow>
                    );
                  }

                  // ---------- FILA NORMAL (sin grupo) ----------
                  const id = item.value;
                  return (
                    <TableRow key={`agr_${id}`} hover>
                      <TableCell>{gruposIngresadosSegunRubro?.[id]?.idDeGrupo ?? ""}</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>{tipoPagoSeleccionado[id] ?? item.letra_tipo_pago ?? letraTipoPagoDefault}</TableCell>{" "}
                      <TableCell>
                        <GenerarCeldaNombre nombre={item?.servicio?.nombre || ""} nombre_proveedor={item?.servicio?.entidad_nombre || ""} lectura={lectura} />
                      </TableCell>
                      <TableCell width="1%">{metodo?.venta ? <GenerarCeldaValor moneda={simbolo} valor={metodo.venta} /> : <GenerarCeldaVaciaValor />}</TableCell>
                      <TableCell width="1%">{detalles.length ? <GenerarCeldaDetalle detalles={detalles} /> : <GenerarCeldaVaciaDetalle />}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                {renderSubTotalFooter()}
                {renderIvaFooter()}
                {renderTotalFooter()}
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Grid>
  );
};

GenerarTotalRubros.propTypes = {
  cotizacion: PropTypes.object,
  rubros: PropTypes.array.isRequired,
  entidad: PropTypes.object,
  lectura: PropTypes.bool,
  onRubrosAgrupados: PropTypes.func.isRequired,
};

export default GenerarTotalRubros;
