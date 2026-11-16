import React from "react";
import PropTypes from "prop-types";
import { Box, Divider, Grid, List, ListItem, ListItemButton, ListItemText, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableRow, Typography } from "@mui/material";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
import {
  FormularioSpot,
  GenerarCeldaDetalle,
  GenerarCeldaNombre,
  GenerarCeldaVaciaDetalle,
  GenerarCeldaVaciaValor,
  GenerarCeldaValor,
  HelperInfoTarifa,
  IconoInformacion,
  ResumenItem,
} from "./RenderizadosDePartes";
import { CalculatorIcon } from "lucide-react";
import DialogComponent from "@/components/Dialog/DialogComponent";
import TextComponent from "@/components/Formulario/TextComponent";
import moment from "moment";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";

const GenerarRubrosDueCarrier = (props) => {
  const { lectura, onValoresManualChange, criterios, onValoresChange, fleteNuevo, esBasadoEnDueAgent = false, onRemoveSpot = () => {}, onRubrosProcesados } = props;
  const monedas = useFetchMonedas();
  const { catalogos } = useCatalogosCotizacion({});

  const [valoresTarifaManual, setValoresTarifaManual] = React.useState({});
  const [mostrarRubro, setMostrarRubro] = React.useState({});
  const [tarifaSpot, setTarifaSpot] = React.useState(0);
  const [rubroFleteParaSpot, setRubroFleteParaSpot] = React.useState(null);

  const [openDialog, setOpenDialog] = React.useState(false);

  const tiene_tarifa_spot = props.rubros.some((i) => i.es_tarifa_spot);

  const esTipoCalculoManual = React.useCallback((item) => {
    const codTipo = item?.servicio?.metodo?.cod_tipo_calculo ?? item?.servicio?.cod_tipo_calculo ?? item?.cod_tipo_calculo;
    return Number(codTipo) === 340;
  }, []);

  const getCodMonedaItem = React.useCallback((item) => item?.servicio?.metodo?.cod_moneda_venta ?? item?.servicio?.cod_moneda_venta ?? item?.cod_moneda_venta ?? null, []);

  const codMonedaDelResto = React.useMemo(() => {
    return (props.rubros || []).map((item) => getCodMonedaItem(item)).find((cod) => cod !== null && cod !== undefined && String(cod).trim() !== "") ?? null;
  }, [props.rubros, getCodMonedaItem]);

  const getCodMonedaEfectiva = React.useCallback((item) => getCodMonedaItem(item) ?? codMonedaDelResto ?? null, [getCodMonedaItem, codMonedaDelResto]);

  const getMonedaCatalogo = React.useCallback(
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

  const totalPorMoneda = React.useMemo(() => {
    return props.rubros
      .filter((i) => !i.es_flete || (tiene_tarifa_spot ? i.es_tarifa_spot : i.es_flete))
      .reduce((sum, rubro) => {
        const codMoneda = esTipoCalculoManual(rubro) ? getCodMonedaEfectiva(rubro) : rubro.servicio?.metodo?.cod_moneda_venta;

        const moneda = esTipoCalculoManual(rubro) ? getMonedaCatalogo(codMoneda) : monedas.data?.find((m) => codMoneda === m.cod_moneda);

        if (!moneda) return sum;

        if (!sum[moneda.cod_moneda]) {
          sum[moneda.cod_moneda] = { total: 0, moneda };
        }

        let venta = Number(rubro.servicio?.metodo?.venta ?? 0);

        if (isNaN(venta)) venta = 0;

        const total = (sum[moneda.cod_moneda]?.total || 0) + (esTipoCalculoManual(rubro) ? Number(valoresTarifaManual[rubro.value]) || 0 : venta);

        sum[moneda.cod_moneda] = { total, moneda };

        return sum;
      }, {});
  }, [monedas.data, props.rubros, esTipoCalculoManual, getCodMonedaEfectiva, getMonedaCatalogo, valoresTarifaManual]);

  const rubrosProcesados = React.useMemo(() => {
    return (props.rubros || [])
      .filter((item) => !item.es_flete || (tiene_tarifa_spot ? item.es_tarifa_spot : item.es_flete))
      .map((item) => {
        if (!esTipoCalculoManual(item)) {
          return item;
        }

        // En lectura usamos exactamente lo que viene guardado.
        if (lectura) {
          return item;
        }

        const valor = Number(valoresTarifaManual[item.value]) || 0;

        const codMoneda = getCodMonedaEfectiva(item);

        return {
          ...item,

          venta: valor,
          costo: valor,

          metodo: {
            ...item.metodo,
            venta: valor,
            costo: valor,
            cod_moneda_venta: item?.metodo?.cod_moneda_venta ?? codMoneda,
            cod_moneda_costo: item?.metodo?.cod_moneda_costo ?? codMoneda,
          },

          servicio: {
            ...item.servicio,

            metodo: {
              ...item.servicio?.metodo,
              venta: valor,
              costo: valor,
              cod_moneda_venta: codMoneda,
              cod_moneda_costo: codMoneda,
            },
          },
        };
      });
  }, [props.rubros, tiene_tarifa_spot, esTipoCalculoManual, lectura, valoresTarifaManual, getCodMonedaEfectiva]);

  React.useEffect(() => {
    if (!onValoresManualChange) return;
    onValoresManualChange(valoresTarifaManual);
  }, [valoresTarifaManual, onValoresManualChange]);

  React.useEffect(() => {
    onRubrosProcesados?.(rubrosProcesados);
  }, [rubrosProcesados, onRubrosProcesados]);

  return (
    <Grid container columnSpacing={2}>
      <Grid container direction="column " size={"auto"} bgcolor="#104f9c" rowSpacing={2} justifyContent="center" alignItems="center" borderRadius={1.2} py={2}>
        {/* <pre>{JSON.stringify(mostrarRubro, null, 2)}</pre> */}
        <Grid size={"auto"}>
          <Typography
            sx={{
              writingMode: "vertical-rl",
              rotate: "180deg",
              color: "white.main",
              fontSize: 20,
              letterSpacing: 3,
            }}
          >
            DUE CARRIER
          </Typography>
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
            sx={{
              "&:before": {
                m: 0,
                borderTopWidth: 10,
                borderTopColor: "primary.main",
              },
              "&:after": {
                m: 0,
                borderTopWidth: 0,
                borderTopColor: "primary.main_90",
              },
            }}
          >
            <Typography color={"text"}>{props.entidad?.entidad_nombre || ""}</Typography>
          </Divider>
          <Typography color={"text"} variant={"overline"}>
            Seleccione los servicios del{" "}
            <Typography component="b" variant="b" color="primary">
              CARRIER
            </Typography>{" "}
            para aplicar a la cotización
          </Typography>
        </Grid>
        <Grid size={12} px={0}>
          <TableContainer size={12} px={0}>
            <Table size="small" width="100%" dense>
              <TableBody dense>
                {props.entidad &&
                  props.rubros
                    .filter((i) => !i.es_flete || (tiene_tarifa_spot ? i.es_tarifa_spot : i.es_flete))
                    .map((item) => {
                      const detalles = item?.servicio?.metodo?.detalles || [];
                      const metodo = catalogos?.metodos?.find((i) => i.cod_servicio === item?.cod_servicio);
                      const aQuinceDias = !metodo?.fecha_final ? false : moment().isBetween(moment(metodo?.fecha_final).subtract(15, "days"), moment(metodo?.fecha_final), "day", "[]");
                      const vencida = moment().isAfter(metodo?.fecha_final);
                      const color5 = "warning.main_10";
                      const color6 = "error.main_10";

                      return (
                        <TableRow key={item.value} dense hover sx={{ bgcolor: aQuinceDias ? color5 : vencida ? color6 : undefined }}>
                          <TableCell width="1%" sx={{ p: 0, px: 1, m: 0 }}>
                            <TooltipComponent
                              sx={{ maxWidth: "none" }}
                              componentsProps={{
                                tooltip: { sx: { maxWidth: "none" } },
                              }}
                              titulo={<HelperInfoTarifa tarifa={item} />}
                              placement="right"
                            >
                              <Grid>
                                <IconoInformacion {...{ item, vencida, aQuinceDias }} />
                              </Grid>
                            </TooltipComponent>
                          </TableCell>
                          {tiene_tarifa_spot && (
                            <TableCell width="1%" sx={{ p: 0, m: 0 }}>
                              {!lectura && item.es_tarifa_spot && (
                                <Grid sx={{ "&:hover": { bgcolor: "#104f9c10" }, p: 0.5, borderRadius: 2, cursor: "pointer" }} onClick={() => onRemoveSpot()}>
                                  <Grid className="c-cancelar" sx={{ color: "red.main" }} width={15} />
                                </Grid>
                              )}
                            </TableCell>
                          )}
                          <TableCell width="1%" sx={{ p: 0, m: 0 }}>
                            {!lectura && item.es_flete && (
                              <TooltipComponent
                                sx={{ maxWidth: "none" }}
                                componentsProps={{ tooltip: { sx: { maxWidth: "none" } } }}
                                titulo={tiene_tarifa_spot ? "Cambiar tarifa SPOT" : "Agregar tarifa SPOT"}
                                placement="right"
                              >
                                <Grid
                                  sx={{ "&:hover": { bgcolor: "#104f9c10" }, p: 0.5, borderRadius: 2, cursor: "pointer" }}
                                  onClick={() => {
                                    setRubroFleteParaSpot(item);
                                    setTarifaSpot(0);
                                    setOpenDialog(true);
                                  }}
                                >
                                  <CalculatorIcon width={15} />
                                </Grid>
                              </TooltipComponent>
                            )}
                          </TableCell>
                          <TableCell width="1%" sx={{ p: 0, m: 0 }}>
                            <GenerarCeldaNombre color="text" textAlign="left" nombre={""} nombre_proveedor={`[${item?.servicio?.cod_servicio || ""}]`} />
                          </TableCell>
                          {tiene_tarifa_spot && <TableCell width="1%">{item.es_tarifa_spot && <GenerarCeldaNombre textAlign="left" nombre={"SPOT"} nombre_proveedor={``} />}</TableCell>}
                          <TableCell width="1%" sx={{ p: 0, m: 0 }}>
                            <GenerarCeldaNombre textAlign="left" nombre={`[${item?.siglas || ""}]`} nombre_proveedor={""} />
                          </TableCell>
                          <TableCell>
                            <GenerarCeldaNombre nombre={item?.servicio?.nombre || ""} nombre_proveedor={""} />
                          </TableCell>
                          <TableCell width="1%">
                            {esTipoCalculoManual(item) && !lectura ? (
                              <Grid>
                                <input
                                  value={valoresTarifaManual?.[item.value] ?? item?.servicio?.metodo?.venta ?? ""}
                                  inputMode="decimal"
                                  onChange={(e) => {
                                    const nextRaw = String(e.target.value || "").replace(/[^0-9.]/g, "");
                                    setValoresTarifaManual((prev) => ({
                                      ...prev,
                                      [item.value]: nextRaw,
                                    }));
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
                            ) : item?.servicio?.metodo?.venta ? (
                              <GenerarCeldaValor moneda={monedas.data?.find((m) => item?.servicio.metodo?.cod_moneda_venta === m.cod_moneda)?.SIMBOLO_MONEDA} valor={item?.servicio?.metodo?.venta} />
                            ) : (
                              <GenerarCeldaVaciaValor />
                            )}
                          </TableCell>
                          <TableCell width="1%">{!item?.metodo?.detalles.length ? <GenerarCeldaVaciaDetalle /> : <GenerarCeldaDetalle detalles={item?.metodo?.detalles} />}</TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
              <TableFooter>
                {Object.keys(totalPorMoneda).map((tipo_moneda, ind) => (
                  <TableRow
                    key={tipo_moneda}
                    dense
                    hover
                    sx={{
                      ...(ind === 0 && {
                        borderTopColor: "primary.main",
                        borderTopWidth: 4,
                        borderTopStyle: "solid",
                      }),
                    }}
                  >
                    <TableCell colspan={tiene_tarifa_spot ? 6 : 5}>
                      <GenerarCeldaNombre nombre="TOTAL" />
                    </TableCell>
                    <TableCell width="1%">
                      <Grid container size={3} pr={1} textAlign="left" justifyContent="end" p={0}>
                        {totalPorMoneda[tipo_moneda]?.total ? (
                          <GenerarCeldaValor total moneda={totalPorMoneda[tipo_moneda]?.moneda?.SIMBOLO_MONEDA} valor={totalPorMoneda[tipo_moneda]?.total || 0} />
                        ) : (
                          <GenerarCeldaVaciaValor total />
                        )}
                      </Grid>
                    </TableCell>
                    <TableCell width="1%" />
                    <TableCell width="1%" />
                  </TableRow>
                ))}
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <DialogComponent open={openDialog} handleClose={() => setOpenDialog(false)}>
        <FormularioSpot
          onValoresChange={(valor, rate) => {
            props.onValoresChange?.(rubroFleteParaSpot, valor, rate);
            setOpenDialog(false);
          }}
          rubros={props.rubros}
          monedas={monedas}
          criterios={criterios}
          tarifaSpot={tarifaSpot}
          setTarifaSpot={setTarifaSpot}
          setOpenDialog={setOpenDialog}
        />
      </DialogComponent>
    </Grid>
  );
};

GenerarRubrosDueCarrier.propTypes = {
  rubros: PropTypes.array.isRequired,
  entidad: PropTypes.object,
  criterios: PropTypes.object,
  lectura: PropTypes.bool,
  esBasadoEnDueAgent: PropTypes.bool,
  onValoresManualChange: PropTypes.func,
  onRemoveSpot: PropTypes.func,
  onValoresChange: PropTypes.func,
  fleteNuevo: PropTypes.number,
  onRubrosProcesados: PropTypes.func,
};

export default GenerarRubrosDueCarrier;
