import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Divider, Grid, Table, TableBody, TableCell, TableContainer, TableFooter, TableRow, Typography } from "@mui/material";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import SelectComponent from "../../../components/Formulario/SelectComponent";
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";
import { GenerarCeldaDetalle, GenerarCeldaNombre, GenerarCeldaVaciaDetalle, GenerarCeldaVaciaValor, GenerarCeldaValor, HelperInfoTarifa, IconoInformacion } from "./RenderizadosDePartes";
import TooltipComponent from "@/components/TooltipComponent/TooltipComponent";
import moment from "moment";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";

const isTratado = (r) => !!r?.servicio; // shape tratado (servicio)
const isBD = (r) => !!r?.servicios; // shape BD (servicios)
const normalizeBool = (v) => {
  if (v === true || v === false) return v;
  if (v == null) return false;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "si", "sí", "y", "yes"].includes(s)) return true;
    if (["0", "false", "no", "n"].includes(s)) return false;
  }
  return Boolean(v);
};

const isServicioObligatorio = (item) =>
  normalizeBool(item?.obligatorio) ||
  normalizeBool(item?.servicio?.obligatorio) ||
  normalizeBool(item?.servicio_obligatorio) ||
  normalizeBool(item?.servicio?.servicio_obligatorio) ||
  normalizeBool(item?.es_obligatorio) ||
  normalizeBool(item?.servicio?.es_obligatorio);

const getAutoSeleccionObligatorios = (items = []) => {
  const porRubro = (items || []).reduce((acc, it) => {
    const key = String(it?.cod_rubro ?? "");
    if (!acc[key]) acc[key] = [];
    if (!acc[key].some((x) => x.cod_servicio === it.cod_servicio)) acc[key].push(it);
    return acc;
  }, {});

  return Object.values(porRubro).reduce((acc, grupo) => {
    const obligatorios = grupo.filter(isServicioObligatorio).filter((item, index, arr) => {
      const key = `${item?.cod_rubro ?? ""}-${item?.servicio?.cod_servicio ?? item?.cod_servicio ?? ""}`;
      return (
        arr.findIndex((x) => {
          const xKey = `${x?.cod_rubro ?? ""}-${x?.servicio?.cod_servicio ?? x?.cod_servicio ?? ""}`;
          return xKey === key;
        }) === index
      );
    });
    // Regla: auto-seleccionar solo si es obligatorio único por rubro.
    if (obligatorios.length === 1) acc.push(obligatorios[0]);
    return acc;
  }, []);
};

const GenerarRubrosDueAgent = ({
  rubros = [],
  entidad,
  lectura = false,
  codMonedaPadre = null,
  onRubrosSeleccionados,
  dueAgentIsValid = () => {},
  serviciosAutoSeleccion = [],
  valorFlete = 0,
  setCriterios,
}) => {
  const monedas = useFetchMonedas();
  const { catalogos } = useCatalogosCotizacion({});

  const [seleccionados, setSeleccionados] = useState([]);
  const [valoresTarifaManual, setValoresTarifaManual] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Detectar de qué tipo viene la data
  const flags = useMemo(() => {
    const vieneTratado = (rubros || []).some(isTratado);
    const vieneDeBD = (rubros || []).some(isBD);
    return { vieneTratado, vieneDeBD };
  }, [rubros]);

  // 1) Normalizar/“aplanar” SIN blocked (solo depende de rubros)
  const baseElementos = useMemo(() => {
    const list = rubros || [];

    // Caso BD: rubros[].servicios => aplanar a filas por servicio
    if (flags.vieneDeBD && !flags.vieneTratado) {
      return list.reduce((acc, rubro) => {
        const raw = rubro?.servicios;
        const arr = Array.isArray(raw) ? raw : raw ? Object.values(raw) : [];
        if (!arr.length) return acc;

        const filas = arr.map((s) => ({
          value: `${rubro.cod_rubro}-${s.cod_servicio}`,
          ...rubro,
          ...s,
          servicios: undefined,
          servicio: s,
        }));

        return acc.concat(filas);
      }, []);
    }

    // Caso tratado: rubros ya trae servicio => devolver tal cual (asegurando value)
    return list.map((r) => ({
      ...r,
      value: r?.value ?? `${r?.cod_rubro}-${r?.servicio?.cod_servicio ?? "x"}`,
    }));
  }, [rubros, flags.vieneDeBD, flags.vieneTratado]);

  // 2) Agregar blocked (depende de seleccionados)
  const listaElementos = useMemo(() => {
    return (baseElementos || []).map((item) => {
      const value = item.value;
      const blocked = (seleccionados || []).some((sel) => sel?.cod_rubro === item.cod_rubro && sel.value !== value);
      return { ...item, blocked };
    });
  }, [baseElementos, seleccionados]);

  const rubrosObligatoriosPendientes = useMemo(() => {
    const porRubro = (baseElementos || []).reduce((acc, item) => {
      const key = String(item?.cod_rubro ?? "");
      if (!key) return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.values(porRubro).reduce((acc, grupo) => {
      const obligatorios = grupo.filter(isServicioObligatorio);

      // Solo nos interesan los rubros con múltiples obligatorios,
      // porque los de 1 ya se autoseleccionan.
      if (obligatorios.length <= 1) return acc;

      const yaSeleccionado = (seleccionados || []).some((sel) => String(sel?.cod_rubro ?? "") === String(grupo[0]?.cod_rubro ?? ""));

      if (yaSeleccionado) return acc;

      acc.push({
        cod_rubro: grupo[0]?.cod_rubro ?? null,
        nombre_rubro: grupo[0]?.nombre ?? "",
        items: obligatorios,
      });

      return acc;
    }, []);
  }, [baseElementos, seleccionados]);

  const getCodMonedaItem = useCallback((item) => item?.servicio?.metodo?.cod_moneda_venta ?? item?.servicio?.cod_moneda_venta ?? item?.cod_moneda_venta ?? null, []);

  const codMonedaDelResto = useMemo(() => {
    return (listaElementos || []).map((item) => getCodMonedaItem(item)).find((cod) => cod !== null && cod !== undefined && String(cod).trim() !== "") ?? null;
  }, [listaElementos, getCodMonedaItem]);

  const getCodMonedaEfectiva = useCallback((item) => getCodMonedaItem(item) ?? codMonedaPadre ?? codMonedaDelResto ?? null, [getCodMonedaItem, codMonedaPadre, codMonedaDelResto]);

  const getMonedaCatalogo = useCallback(
    (codMoneda) => {
      if (codMoneda === null || codMoneda === undefined) return null;
      if (typeof codMoneda === "string" && codMoneda.trim() === "") return null;

      const codNum = Number(codMoneda);
      if (Number.isFinite(codNum)) {
        return (monedas.data || []).find((m) => Number(m.cod_moneda) === codNum) || null;
      }

      return (monedas.data || []).find((m) => m.cod_moneda === codMoneda) || null;
    },
    [monedas.data],
  );

  const listaElementosParaRenderizado = useMemo(() => {
    return (listaElementos || []).map((item) => ({
      ...item,
      nombre: `${item.nombre} - ${item?.servicio?.siglas}`,
      label: (
        <Grid container direction="row" width="100%" columnSpacing={1}>
          <Grid size={1}>
            {item.blocked && <Typography className="c-cancelar" color="error.main" />}
            <Typography
              borderRadius={10}
              p={0}
              m={0}
              className={seleccionados?.some((l) => l?.value === item.value) ? "c-circulo-cheque" : ""}
              color={seleccionados?.some((l) => l?.value === item.value) ? "success.main" : "white"}
            />
          </Grid>

          <Grid size={"auto"} color="primary.main" sx={{ whiteSpace: "normal", overflow: "visible", wordBreak: "break-word", lineHeight: 1.1 }}>
            <GenerarCeldaNombre nombre={`${item?.servicio?.siglas && `[${item?.servicio?.siglas}] `}`} nombre_proveedor={""} />
          </Grid>
          <Grid size={"grow"} color="primary.main" sx={{ whiteSpace: "normal", overflow: "visible", wordBreak: "break-word", lineHeight: 1.1 }}>
            <GenerarCeldaNombre nombre={`${item?.servicio?.nombre && ` ${item?.servicio?.nombre}`}`} nombre_proveedor={""} />
          </Grid>

          <Grid size={3}>
            {item?.servicio?.cod_tipo_calculo === 340 ? (
              <GenerarCeldaNombre nombre={`ABIERTO`} nombre_proveedor={""} />
            ) : item?.servicio?.cod_tipo_calculo === 356 ? (
              <GenerarCeldaNombre nombre={`COBERTURA DE MERCADERIA`} nombre_proveedor={""} />
            ) : (
              <GenerarCeldaValor
                moneda={monedas.data?.find((m) => item?.servicio?.metodo?.cod_moneda_venta === m.cod_moneda)?.SIMBOLO_MONEDA || ""}
                valor={Number(item?.servicio?.metodo?.venta || 0)}
                total
              />
            )}
          </Grid>
        </Grid>
      ),
    }));
  }, [listaElementos, monedas.data, seleccionados]);

  const esTipoCalculoManual = useCallback((item) => {
    const codTipo = item?.servicio?.metodo?.cod_tipo_calculo ?? item?.servicio?.cod_tipo_calculo ?? item?.cod_tipo_calculo;
    return Number(codTipo) === 340 || Number(codTipo) === 356;
  }, []);

  const totalPorMoneda = useMemo(() => {
    return (seleccionados || []).reduce((sum, it) => {
      const codMoneda = esTipoCalculoManual(it) ? getCodMonedaEfectiva(it) : it?.servicio?.metodo?.cod_moneda_venta;
      const moneda = esTipoCalculoManual(it) ? getMonedaCatalogo(codMoneda) : monedas.data?.find((m) => codMoneda === m.cod_moneda);
      if (!moneda) return sum;

      const value = it.value;
      const key = String(moneda.cod_moneda);
      let venta = Number(it?.servicio?.metodo?.venta ?? 0);

      if (isNaN(venta)) venta = 0;

      sum[key] = { moneda, total: (sum[key]?.total ?? 0) + (esTipoCalculoManual(it) ? Number(valoresTarifaManual[value]) || 0 : venta) };
      return sum;
    }, {});
  }, [monedas.data, seleccionados, getCodMonedaEfectiva, getMonedaCatalogo, esTipoCalculoManual, valoresTarifaManual]);

  const handleRubroSelected = useCallback(
    (_item) => {
      const item = _item ?? listaElementos[currentIndex];
      if (!item) return;

      const esta = seleccionados.some((s) => s.value === item.value);

      if (!esta) {
        if (item.blocked) return;
        setSeleccionados((prev) => prev.concat(item));
      } else {
        setSeleccionados((prev) => prev.filter((s) => s.value !== item.value));
      }
    },
    [currentIndex, listaElementos, seleccionados],
  );
  const serviciosAutoSeleccionKey = useMemo(() => (serviciosAutoSeleccion || []).map(String).sort().join(","), [serviciosAutoSeleccion]);

  // ✅ Sync cuando cambia lectura o rubros
  useEffect(() => {
    setCurrentIndex(0);

    // Si lectura es TRUE:
    // - Si rubros viene tratado => es "lectura real" (guardado), mostramos todo lo que viene
    // - Si rubros viene BD (servicios) => normalmente es "lectura forzada" (ej: falta entidad), no autoseleccionar
    if (lectura) {
      if (flags.vieneTratado) {
        setSeleccionados(baseElementos);
      } else {
        setSeleccionados([]); // evita que "nuevo" aparezca con seleccionados
      }
      return;
    }

    // Si edición:
    // 1) conserva selección previa válida
    // 2) auto-selecciona obligatorios únicos por rubro (sin sobreescribir rubros ya seleccionados)
    setSeleccionados((prev) => {
      const prevVigentes = prev.filter((p) => baseElementos.some((n) => n.value === p.value));
      const rubrosYaSeleccionados = new Set(prevVigentes.map((p) => String(p?.cod_rubro ?? "")));

      const autoObligatorios = getAutoSeleccionObligatorios(baseElementos)
        .filter((it) => !rubrosYaSeleccionados.has(String(it?.cod_rubro ?? "")))
        .map((i) => ({ ...i, quitarBoton: true }));
      const codsSet = new Set(serviciosAutoSeleccionKey ? serviciosAutoSeleccionKey.split(",").filter(Boolean) : []);

      const autoPlantilla =
        codsSet.size > 0
          ? baseElementos
              .filter((item) => {
                const codServicio = String(item?.servicio?.cod_servicio ?? item?.cod_servicio ?? "");
                return codsSet.has(codServicio) && !prevVigentes.some((p) => p.value === item.value) && !autoObligatorios.some((p) => p.value === item.value);
              })
              .map((i) => ({ ...i, quitarBoton: false }))
          : [];

      const merged = [...prevVigentes, ...autoObligatorios, ...autoPlantilla];
      const seen = new Set();
      return merged.filter((it) => {
        if (!it?.value || seen.has(it.value)) return false;
        seen.add(it.value);
        return true;
      });
    });
  }, [lectura, baseElementos, flags.vieneTratado, serviciosAutoSeleccion]);

  // ✅ Notificar al padre (con la misma regla de lectura forzada)
  useEffect(() => {
    if (lectura && !flags.vieneTratado) {
      onRubrosSeleccionados?.([]); // lectura forzada => no empujar selección
      return;
    }

    const rubrosSeleccionadosConValores = seleccionados.map((item) => {
      const newItem = { ...item };

      if (esTipoCalculoManual(item)) {
        const esCoberturaMercaderia = Number(item?.servicio?.metodo?.cod_tipo_calculo ?? item?.servicio?.cod_tipo_calculo ?? item?.cod_tipo_calculo) === 356;

        const detalleBase = rubros.find((i) => i.cod_servicio === item.cod_servicio)?.metodo?.detalles ?? [];

        const valorCalculado = Number(valoresTarifaManual[item.value]) || 0;
        const valorIngresado = valoresTarifaManual?.[`${item.value}_a_calcular`];

        if (!newItem.servicio.metodo) newItem.servicio.metodo = {};

        newItem.servicio.metodo.venta = Number(valoresTarifaManual[item.value]) || 0;
        newItem.servicio.metodo.costo = Number(valoresTarifaManual[item.value]) || 0;
        newItem.servicio.metodo.cod_moneda_venta = getCodMonedaEfectiva(item);
        newItem.servicio.metodo.cod_moneda_costo = getCodMonedaEfectiva(item);
        newItem.servicio.metodo.cod_estado = 1;

        if (esCoberturaMercaderia) {
          newItem.servicio.metodo.detalles = [
            ...detalleBase,
            {
              tipo_desc: "",
              tarifadetalle_descripcion: `${/* Flete: ${valorFlete || 0}, Valor estimado: */ ""}Sobre valor de factura ${getMonedaCatalogo(newItem.servicio.metodo.cod_moneda_venta)?.simbolo_moneda} ${valorIngresado || 0}`,
              tarifadetalle_valor: valorIngresado,
            },
          ];
        }
      }
      return newItem;
    });

    onRubrosSeleccionados?.(rubrosSeleccionadosConValores);
  }, [lectura, flags.vieneTratado, seleccionados, onRubrosSeleccionados, esTipoCalculoManual, valoresTarifaManual, getCodMonedaEfectiva, valorFlete, rubros, getMonedaCatalogo]);

  // ✅ Evitar index fuera de rango
  useEffect(() => {
    if (currentIndex >= listaElementosParaRenderizado.length) setCurrentIndex(0);
  }, [currentIndex, listaElementosParaRenderizado.length]);

  const veificarSiSePuedeQuitar = (value) => seleccionados.some((i) => i.value === value && i.quitarBoton === true);

  useEffect(() => {
    rubrosObligatoriosPendientes.length ? dueAgentIsValid(false) : dueAgentIsValid(true);
  }, [rubrosObligatoriosPendientes.length, dueAgentIsValid]);

  return (
    <Grid container columnSpacing={2}>
      <Grid container direction="column " size={"auto"} bgcolor="#104f9c" rowSpacing={2} justifyContent="center" alignItems="center" borderRadius={1.2} py={2} my={1}>
        <Grid size={"auto"}>
          <Typography sx={{ writingMode: "vertical-rl", rotate: "180deg", color: "white.main", fontSize: 20, letterSpacing: 3 }}>DUE AGENT</Typography>
        </Grid>
        <Grid size={"grow"} bgcolor="#fff" justifyContent="center" alignItems="center" mx={0} px={0.2} />
      </Grid>

      <Grid size="grow" px={0}>
        <Grid size="grow" px={0}>
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>{entidad?.label || ""}</Typography>
          </Divider>

          <Typography color={"text"} variant={"overline"}>
            Seleccione los servicios de{" "}
            <Typography component="b" variant="b" color="primary">
              DUE AGENT
            </Typography>{" "}
            para agregarlos a la cotización
          </Typography>
        </Grid>

        {listaElementos[currentIndex]?.blocked && (
          <Grid container size={12} px={0} pb={1}>
            <BandaAlertaComponent tipo="error" content="Este rubro esta bloqueado para evitar duplicidad" />
          </Grid>
        )}

        {!lectura && (
          <Grid container size={12} px={0}>
            <Grid size="grow" px={0}>
              <SelectComponent
                input={{
                  tipo: "select",
                  id: "servicio",
                  options: listaElementosParaRenderizado,
                  labelOption: "nombre",
                  valueOption: "value",
                  renderOption: "label",
                  val: listaElementosParaRenderizado[currentIndex],
                  multiple: false,
                }}
                onInput={(val) => {
                  if (!val) return setCurrentIndex(0);
                  const idx = listaElementosParaRenderizado.findIndex((s) => s.value === val.value);
                  setCurrentIndex(idx >= 0 ? idx : 0);
                }}
              />
            </Grid>

            {!listaElementos[currentIndex]?.blocked && (
              <Grid size="auto" px={2}>
                <Button disabled={veificarSiSePuedeQuitar(listaElementos[currentIndex]?.value)} variant={!lectura ? "contained" : "outlined"} onClick={() => handleRubroSelected()}>
                  {seleccionados.some((s) => listaElementos[currentIndex]?.value === s.value) ? "Quitar del calculo" : "Agregar a calculo"}
                </Button>
              </Grid>
            )}
          </Grid>
        )}
        {rubrosObligatoriosPendientes.length ? (
          <BandaAlertaComponent tipo="error">Hace falta que seleccione algun dato para los rubros: {rubrosObligatoriosPendientes.map((i) => i.nombre_rubro).join(", ")}</BandaAlertaComponent>
        ) : null}
        <Grid size={12} px={0}>
          <TableContainer size={12} px={0}>
            <Table size="small" width="100%" dense>
              <TableBody dense>
                {seleccionados.map((item) => {
                  const detalles = item?.servicio?.metodo?.detalles || [];
                  const metodo = catalogos?.metodos?.find((i) => i.cod_servicio === item?.cod_servicio);
                  const aQuinceDias = !metodo?.fecha_final ? false : moment().isBetween(moment(metodo?.fecha_final).subtract(15, "days"), moment(metodo?.fecha_final), "day", "[]");
                  const vencida = moment().isAfter(metodo?.fecha_final);
                  const color5 = "warning.main_10";
                  const color6 = "error.main_10";

                  return (
                    <TableRow key={item.value} dense hover sx={{ bgcolor: aQuinceDias ? color5 : vencida ? color6 : undefined }}>
                      <TableCell width="1%">
                        <TooltipComponent
                          sx={{ maxWidth: "none" }}
                          componentsProps={{
                            tooltip: {
                              sx: {
                                maxWidth: "none",
                              },
                            },
                          }}
                          titulo={<HelperInfoTarifa tarifa={item} />}
                          placement="right"
                        >
                          <Grid>
                            <IconoInformacion {...{ item, vencida, aQuinceDias }} />
                          </Grid>
                        </TooltipComponent>
                      </TableCell>
                      {item.quitarBoton === true ? (
                        <TableCell width="1%" />
                      ) : (
                        !lectura && (
                          <TooltipComponent titulo={"Quitar de la lista"} borderColor="error.main">
                            <TableCell width="1%">
                              <Grid size="auto" p={0} my="auto" sx={{ "&:hover": { cursor: "pointer", bgcolor: "black.main_20" }, borderRadius: 2, height: "auto", textAlign: "center" }}>
                                <Typography onClick={() => handleRubroSelected(item)} className="c-cancelar" color="error.main" fontWeight="bold" sx={{ px: 0.5 }} />
                              </Grid>
                            </TableCell>
                          </TooltipComponent>
                        )
                      )}

                      <TableCell>
                        <GenerarCeldaNombre textAlign="left" nombre={`${item?.servicio?.siglas && `[${item?.servicio?.siglas}] `}`} nombre_proveedor={""} />
                      </TableCell>

                      <TableCell>
                        <GenerarCeldaNombre nombre={`${item?.servicio?.nombre && ` ${item?.servicio?.nombre}`}`} nombre_proveedor={""} />
                      </TableCell>

                      <TableCell width="1%">
                        {esTipoCalculoManual(item) && !lectura ? (
                          <GenerarCeldaValor
                            moneda={""}
                            valor={
                              <Grid>
                                {item.cod_tipo_calculo === 356 && <Typography variant="caption">Valor factura comercial</Typography>}
                                <input
                                  value={item.cod_tipo_calculo === 356 ? valoresTarifaManual?.[`${item.value}_a_calcular`] : (valoresTarifaManual?.[item.value] ?? item?.servicio?.metodo?.venta ?? "")}
                                  inputMode="decimal"
                                  onChange={(e) => {
                                    if (item.cod_tipo_calculo === 340) {
                                      const nextRaw = String(e.target.value || "").replace(/[^0-9.]/g, "");
                                      setValoresTarifaManual((prev) => ({ ...prev, [item.value]: nextRaw }));
                                    }
                                    if (item.cod_tipo_calculo === 356) {
                                      const nextRaw = String(e.target.value || "").replace(/[^0-9.]/g, "");

                                      const factura = Number(nextRaw);
                                      const flete = valorFlete;

                                      const porcentaje = (item.metodo ?? item.cobertura)?.porcentaje_venta / 100;

                                      const valor = (flete + factura) * 1.1 * porcentaje;

                                      const valorRedondeado = Math.ceil(valor);

                                      const valorRedondeadoProcesado = factura > 0 ? (valorRedondeado < item.metodo?.minimo_venta ? item.metodo?.minimo_venta : valorRedondeado) : 0;

                                      if (setCriterios) setCriterios({ valor_factura: factura });

                                      setValoresTarifaManual((prev) => ({ ...prev, [item.value]: valorRedondeadoProcesado, [`${item.value}_a_calcular`]: nextRaw }));
                                    }
                                  }}
                                  style={{
                                    width: "110px",
                                    height: "28px",
                                    padding: "0 8px",
                                    border: "1px solid #104f9c",
                                    borderRadius: "6px",
                                    textAlign: "right",
                                    outline: "none",
                                    font: "inherit",
                                    background: "transparent",
                                  }}
                                />
                                <GenerarCeldaValor moneda={getMonedaCatalogo(getCodMonedaItem(item))?.SIMBOLO_MONEDA ?? ""} valor={valoresTarifaManual[item.value]} />
                              </Grid>
                            }
                          />
                        ) : item?.servicio?.metodo?.venta ? (
                          <GenerarCeldaValor
                            moneda={monedas.data?.find((m) => item?.servicio?.metodo?.cod_moneda_venta === m.cod_moneda)?.SIMBOLO_MONEDA || ""}
                            valor={Number(item?.servicio?.metodo?.venta || 0)}
                          />
                        ) : (
                          <GenerarCeldaVaciaValor />
                        )}
                      </TableCell>

                      <TableCell width="1%">{!detalles.length ? <GenerarCeldaVaciaDetalle /> : <GenerarCeldaDetalle detalles={detalles} />}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                {Object.keys(totalPorMoneda).map((key, ind) => (
                  <TableRow key={key} dense hover sx={{ ...(ind === 0 && { borderTopColor: "primary.main", borderTopWidth: 4, borderTopStyle: "solid" }) }}>
                    {!lectura && (
                      <TableCell>
                        <Grid size="auto" p={0}>
                          <Typography className="c-cancelar" color="background.main" />
                        </Grid>
                      </TableCell>
                    )}

                    <TableCell />
                    <TableCell />

                    <TableCell>
                      <GenerarCeldaNombre nombre="TOTAL" />
                    </TableCell>

                    <TableCell width="1%">
                      <Grid container size={3} pr={1} textAlign="left" justifyContent="end" p={0}>
                        <GenerarCeldaValor total moneda={totalPorMoneda[key]?.moneda?.SIMBOLO_MONEDA || ""} valor={Number(totalPorMoneda[key]?.total || 0)} />
                      </Grid>
                    </TableCell>

                    <TableCell width="1%"></TableCell>
                  </TableRow>
                ))}
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Grid>
  );
};

GenerarRubrosDueAgent.propTypes = {
  rubros: PropTypes.array.isRequired,
  entidad: PropTypes.object,
  lectura: PropTypes.bool,
  codMonedaPadre: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRubrosSeleccionados: PropTypes.func.isRequired,
  dueAgentIsValid: PropTypes.func,
  setCriterios: PropTypes.func,
  serviciosAutoSeleccion: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  valorFlete: PropTypes.number,
  codMonedaFlete: PropTypes.object,
};

export default GenerarRubrosDueAgent;
