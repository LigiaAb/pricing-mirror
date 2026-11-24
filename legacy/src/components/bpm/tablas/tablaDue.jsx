import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Divider, Grid, IconButton, List, ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RefreshCcw } from "lucide-react";
// Referencia de diseño: from "../../../pages/Tarifas/Calculo/RenderizadosDePartes";

// ── Celdas inline (independientes de RenderizadosDePartes) ────────────────────
const GenerarCeldaNombre = ({ nombre, textAlign = "right", color }) => {
  const theme = useTheme();
  const defaultColor = theme.palette.mode === "dark" ? "info.light" : "info.main";
  return (
    <Stack direction="column" color={color || defaultColor} mt={0} pr={{ xs: 0.5, sm: 2 }} width="100%">
      <Typography variant="h5" textAlign={textAlign} sx={{ fontSize: { xs: "0.85rem", sm: "inherit" }, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {nombre}
      </Typography>
    </Stack>
  );
};
GenerarCeldaNombre.propTypes = { nombre: PropTypes.string, textAlign: PropTypes.string, color: PropTypes.string };

const GenerarCeldaValor = ({ moneda, valor, total = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const labelColor = isDark ? "grey.300" : "black.main";
  let valorColor = "primary.main";
  if (isDark) valorColor = "info.light";
  else if (total) valorColor = "black.main";
  return (
    <Grid container width="100%" direction="column" justifyContent="space-between">
      <Grid key={moneda} container color={labelColor} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: { xs: 13, sm: 16 }, mr: 1 }}>
          {moneda}
        </Typography>
        <Typography color={valorColor} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: { xs: 13, sm: 16 }, m: 0, p: 0 }}>
          {(valor || 0).toFixed(2).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Typography>
      </Grid>
    </Grid>
  );
};
GenerarCeldaValor.propTypes = { moneda: PropTypes.string.isRequired, valor: PropTypes.number.isRequired, total: PropTypes.bool };

const GenerarCeldaVaciaValor = ({ total = false }) => (
  <Grid container width="100%" direction="row" justifyContent="space-between" wrap="nowrap" data-total={total}>
    <Typography variant="body" fontWeight="600" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16 }} color="red.main">
      -
    </Typography>
    <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }} color="red.main">
      {(0).toFixed(2).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",")}
    </Typography>
  </Grid>
);
GenerarCeldaVaciaValor.propTypes = { total: PropTypes.bool };

const resolveTextColor = (theme, colorKey) => {
  if (colorKey) {
    if (colorKey.includes(".")) {
      return colorKey;
    }
    const suffix = theme.palette.mode === "dark" ? "light" : "main";
    return `${colorKey}.${suffix}`;
  }
  return theme.palette.mode === "dark" ? "text.primary" : "primary.main";
};

const GenerarCeldaDetalle = ({ detalles = [], columnas = false, mostrarEtiquetas = true }) => {
  const theme = useTheme();

  if (columnas) {
    return (
      <Grid container spacing={1} alignItems="flex-start" wrap="nowrap">
        {detalles?.map((i, ind) => (
          <Grid key={`${i.tarifadetalle_id}-${ind}`} sx={{ minWidth: 120, flex: 1 }}>
            <Stack color={resolveTextColor(theme, i.color)} textAlign="right">
              {mostrarEtiquetas && (
                <Typography variant="caption" fontWeight="thin" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
                  {i.tipo_desc}
                </Typography>
              )}
              <Typography variant="body" fontWeight="medium" sx={{ fontSize: "inherit", m: 0, p: 0 }}>
                {i.tarifadetalle_descripcion || i.tarifadetalle_valor}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <List sx={{ m: 0, p: 0 }}>
      {detalles?.map((i, ind) => (
        <ListItem sx={{ m: 0, p: 0, mt: ind === 0 ? undefined : i.mt }} key={`${i.tarifadetalle_id}-${ind}`}>
          <ListItemText sx={{ m: 0, p: 0 }}>
            <Stack color={resolveTextColor(theme, i.color)} textAlign="right">
              <Typography variant="caption" fontWeight="thin" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
                {i.tipo_desc}
              </Typography>
              <Typography variant="body" fontWeight="medium" sx={{ fontSize: "inherit", m: 0, p: 0 }}>
                {i.tarifadetalle_descripcion || i.tarifadetalle_valor}
              </Typography>
            </Stack>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
};
GenerarCeldaDetalle.propTypes = { detalles: PropTypes.array, columnas: PropTypes.bool, mostrarEtiquetas: PropTypes.bool };

const GenerarCabeceraDetalle = ({ detalles = [] }) => (
  <Grid container spacing={1} alignItems="flex-start" wrap="nowrap">
    {detalles.map((detalle, index) => (
      <Grid key={`${detalle}-${index}`} sx={{ minWidth: 120, flex: 1 }}>
        <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ display: "block", textAlign: "right", textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
          {detalle}
        </Typography>
      </Grid>
    ))}
  </Grid>
);
GenerarCabeceraDetalle.propTypes = { detalles: PropTypes.arrayOf(PropTypes.string) };

const GenerarCeldaVaciaDetalle = () => {
  const theme = useTheme();
  return (
    <List sx={{ m: 0, p: 0 }}>
      <ListItem sx={{ m: 0, p: 0 }}>
        <ListItemText sx={{ m: 0, p: 0 }}>
          <Stack color={resolveTextColor(theme)} textAlign="right">
            <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", width: "100%", m: 0, p: 0, fontSize: 20 }} color="error.main">
              -
            </Typography>
          </Stack>
        </ListItemText>
      </ListItem>
    </List>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * TablaDue — Componente reutilizable con el diseño de "DUE CARRIER / DUE AGENT".
 *
 * Props:
 * - titulo:         Texto vertical en la barra lateral (ej. "DUE CARRIER").
 * - subtituloParte: Texto resaltado en el subtítulo (ej. "CARRIER").
 * - subtituloTexto: Texto completo del subtítulo alrededor de subtituloParte.
 *                   Usa "{parte}" como placeholder para la parte resaltada.
 * - entidadNombre:  Nombre de la entidad que aparece en el Divider.
 * - colorBarra:     Color de fondo de la barra lateral.
 * - items:          Array de objetos con la data de cada fila.
 *                   Cada item: { key, nombre, nombreProveedor, monedaSimbolo, valor, detalles }
 *                     - detalles: array de { tarifadetalle_id, tipo_desc, tarifadetalle_descripcion, tarifadetalle_valor, color, mt }
 * - children:       Contenido extra entre el encabezado y la tabla (selectores, botones, etc.).
 * - renderAccionFila: (item) => ReactNode — columna adicional al inicio de cada fila.
 * - renderAccionFooter: (totalItem, ind) => ReactNode — columna adicional al inicio del footer.
 * - columnaAccionAncho: Ancho de la columna de acción (default "1%").
 */
const TablaDue = ({
  titulo = "DUE",
  subtituloParte = "",
  subtituloTexto = "Seleccione los servicios del {parte} para aplicar a la cotización",
  entidadNombre = "",
  colorBarra = "#104f9c",
  items = [],
  children,
  renderAccionFila,
  renderAccionFooter,
  columnaAccionAncho = "1%",
  mostrarCodTipoPago = false,
  mostrarCosto = false,
  mostrarValor = true,
  mostrarDetalle = true,
  mostrarCabecera = false,
  usarEtiquetasDetalleComoCabecera = false,
  onRefresh,
  refreshDisabled = false,
  accionesHeader,
}) => {
  const theme = useTheme();

  const totalPorMoneda = useMemo(() => {
    return items.reduce((acc, item) => {
      const simbolo = item.monedaSimbolo;
      const codMoneda = item.codMoneda ?? simbolo;

      if (!simbolo && !codMoneda) return acc;

      const key = String(codMoneda ?? simbolo);

      if (!acc[key]) acc[key] = { total: 0, monedaSimbolo: simbolo };

      acc[key].total += Number(item.valor || 0);

      return acc;
    }, {});
  }, [items]);

  const detalleCabeceras = useMemo(() => {
    if (!usarEtiquetasDetalleComoCabecera) return [];

    const primerItemConDetalles = items.find((item) => item.detallesColumns && item.detalles?.length);
    return primerItemConDetalles?.detalles?.map((detalle) => detalle.tipo_desc).filter(Boolean) ?? [];
  }, [items, usarEtiquetasDetalleComoCabecera]);

  const totalCostoPorMoneda = useMemo(() => {
    return items.reduce((acc, item) => {
      const simbolo = item.monedaSimbolo;
      const codMoneda = item.codMoneda ?? simbolo;

      if (!simbolo && !codMoneda) return acc;

      const key = String(codMoneda ?? simbolo);

      if (!acc[key]) acc[key] = { total: 0, monedaSimbolo: simbolo };

      acc[key].total += Number(item.costo || 0);

      return acc;
    }, {});
  }, [items]);

  const partes = subtituloTexto.split("{parte}");
  const mostrarTextoCabecera = Boolean(entidadNombre || subtituloTexto || subtituloParte);
  const mostrarAccionesCabecera = Boolean(onRefresh || accionesHeader);

  return (
    <Grid container columnSpacing={{ xs: 1, sm: 2 }} sx={{ width: "100%", minWidth: 0 }}>
      {/* ── Barra lateral vertical ── */}
      <Grid
        container
        direction="column"
        size="auto"
        bgcolor={colorBarra}
        rowSpacing={2}
        justifyContent="center"
        alignItems="center"
        borderRadius={1.2}
        py={{ xs: 1, sm: 2 }}
      >
        <Grid size="auto">
          <Typography sx={{ writingMode: "vertical-rl", rotate: "180deg", color: "white.main", fontSize: { xs: 11, sm: 16 }, letterSpacing: { xs: 1, sm: 3 } }}>
            {titulo}
          </Typography>
        </Grid>
        <Grid size="grow" bgcolor="#fff" justifyContent="center" alignItems="center" mx={0} px={0.2} />
      </Grid>

      {/* ── Contenido principal ── */}
      <Grid size="grow" px={0} sx={{ minWidth: 0 }}>
        {/* Encabezado */}
        {(mostrarTextoCabecera || mostrarAccionesCabecera) && (
          <Grid container alignItems="center" justifyContent={mostrarTextoCabecera ? "space-between" : "flex-end"} spacing={1} px={0}>
            {mostrarTextoCabecera && (
              <Grid size="grow">
                <Divider
                  color="primary.main"
                  textAlign="left"
                  p={0}
                  m={0}
                  sx={{
                    "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" },
                    "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" },
                  }}
                >
                  <Typography color="text">{entidadNombre}</Typography>
                </Divider>
                <Typography color="text" variant="overline">
                  {partes[0]}
                  {subtituloParte && (
                    <Typography component="b" variant="b" color="primary">
                      {subtituloParte}
                    </Typography>
                  )}
                  {partes[1] ?? ""}
                </Typography>
              </Grid>
            )}
            {mostrarAccionesCabecera && (
              <Grid size="auto">
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                  {onRefresh && (
                    <Tooltip title="Recargar datos">
                      <IconButton size="small" disabled={refreshDisabled} onClick={onRefresh}>
                        <RefreshCcw size={18} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {accionesHeader}
                </Stack>
              </Grid>
            )}
          </Grid>
        )}

        {/* Contenido extra (children) */}
        {children}

        {/* Tabla */}
        <Grid size={12} px={0} sx={{ minWidth: 0 }}>
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" sx={{ width: "100%", minWidth: { xs: 300, sm: 420 } }}>
              {(mostrarCabecera || detalleCabeceras.length > 0) && (
                <TableHead>
                  <TableRow>
                    {renderAccionFila && <TableCell width={columnaAccionAncho} />}
                    <TableCell>{mostrarCabecera ? "Rubro" : ""}</TableCell>
                    {mostrarCodTipoPago && <TableCell>{mostrarCabecera ? "Tipo" : ""}</TableCell>}
                    {mostrarCosto && <TableCell>{mostrarCabecera ? "Costo" : ""}</TableCell>}
                    {mostrarValor && <TableCell>{mostrarCabecera ? "Venta" : ""}</TableCell>}
                    {mostrarDetalle && (
                      <TableCell>
                        {detalleCabeceras.length > 0 ? <GenerarCabeceraDetalle detalles={detalleCabeceras} /> : null}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {items.map((item, index) => {
                  const mostrarSeccion = item.seccion != null && item.seccion !== "";
                  const esPrimeroOSeccionCambio =
                    index === 0 ||
                    items[index - 1].seccion !== item.seccion;

                  return (
                    <React.Fragment key={item.key}>
                      {mostrarSeccion && esPrimeroOSeccionCambio && (
                        <TableRow>
                          <TableCell
                            colSpan={
                              1 +
                              (renderAccionFila ? 1 : 0) +
                              (mostrarCabecera ? 1 : 0) +
                              (mostrarCodTipoPago ? 1 : 0) +
                              (mostrarCosto ? 1 : 0) +
                              (mostrarValor ? 1 : 0) +
                              (mostrarDetalle ? 1 : 0)
                            }
                            sx={{
                              bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "grey.100",
                              py: 0.75,
                              px: 1.5,
                              borderTop: "2px solid",
                              borderColor: "primary.main",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                letterSpacing: 0.3,
                                color: "text.secondary",
                              }}
                            >
                              {item.seccion}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow hover>
                        {renderAccionFila && (
                          <TableCell width={columnaAccionAncho}>
                            {renderAccionFila(item)}
                          </TableCell>
                        )}

                        <TableCell>
                          <GenerarCeldaNombre
                            nombre={item.nombre || ""}
                            textAlign={item.textAlign}
                            color={item.colorNombre}
                          />
                        </TableCell>

                        {mostrarCodTipoPago && (
                          <TableCell width="1%" sx={{ textAlign: "center" }}>
                            <Typography m={0} p={0} px={1.1} fontSize="0.8rem" color="text.secondary">
                              {item.tipo_pago_label ?? item.cod_tipo_pago ?? item.COD_TIPO_PAGO ?? item.codTipoPago ?? item.codTipoPago ?? "-"}
                            </Typography>
                          </TableCell>
                        )}

                        {mostrarCosto && (
                          <TableCell width="1%">
                            {item.costo != null && item.costo !== 0 ? (
                              <GenerarCeldaValor moneda={item.monedaSimbolo || ""} valor={Number(item.costo || 0)} />
                            ) : (
                              <GenerarCeldaVaciaValor />
                            )}
                          </TableCell>
                        )}

                        {mostrarValor && (
                          <TableCell width="1%">
                            {item.valor != null && item.valor !== 0 ? (
                              <GenerarCeldaValor moneda={item.monedaSimbolo || ""} valor={Number(item.valor || 0)} />
                            ) : (
                              <GenerarCeldaVaciaValor />
                            )}
                          </TableCell>
                        )}

                        {mostrarDetalle && (
                          <TableCell width={item.detallesColumns ? "auto" : "1%"}>
                            {item.detalles?.length ? (
                              <GenerarCeldaDetalle
                                detalles={item.detalles}
                                columnas={item.detallesColumns}
                                mostrarEtiquetas={!(usarEtiquetasDetalleComoCabecera && item.detallesColumns)}
                              />
                            ) : (
                              <GenerarCeldaVaciaDetalle />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>

              <TableFooter>
                {Object.keys(totalPorMoneda).map((key, ind) => (
                  <TableRow
                    key={key}
                    hover
                    sx={{ ...(ind === 0 && { borderTopColor: "primary.main", borderTopWidth: 4, borderTopStyle: "solid" }) }}
                  >
                    {renderAccionFooter && (
                      <TableCell width={columnaAccionAncho}>
                        {renderAccionFooter(totalPorMoneda[key], ind)}
                      </TableCell>
                    )}

                    <TableCell>
                      <GenerarCeldaNombre nombre="TOTAL" />
                    </TableCell>

                    {mostrarCodTipoPago && <TableCell width="1%" />}

                    {mostrarCosto && (
                      <TableCell width="1%">
                        <Grid container size={3} pr={1} textAlign="left" justifyContent="end" p={0}>
                          {totalCostoPorMoneda[key]?.total ? (
                            <GenerarCeldaValor total moneda={totalCostoPorMoneda[key]?.monedaSimbolo || ""} valor={totalCostoPorMoneda[key]?.total || 0} />
                          ) : (
                            <GenerarCeldaVaciaValor total />
                          )}
                        </Grid>
                      </TableCell>
                    )}

                    {mostrarValor && (
                      <TableCell width="1%">
                        <Grid container size={3} pr={1} textAlign="left" justifyContent="end" p={0}>
                          {totalPorMoneda[key]?.total ? (
                            <GenerarCeldaValor total moneda={totalPorMoneda[key]?.monedaSimbolo || ""} valor={totalPorMoneda[key]?.total || 0} />
                          ) : (
                            <GenerarCeldaVaciaValor total />
                          )}
                        </Grid>
                      </TableCell>
                    )}

                    {mostrarDetalle && <TableCell width="1%" />}
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

TablaDue.propTypes = {
  titulo: PropTypes.string,
  subtituloParte: PropTypes.string,
  subtituloTexto: PropTypes.string,
  entidadNombre: PropTypes.string,
  colorBarra: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      seccion: PropTypes.string,
      nombre: PropTypes.string,
      nombreProveedor: PropTypes.string,
      monedaSimbolo: PropTypes.string,
      codMoneda: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      valor: PropTypes.number,
      detalles: PropTypes.array,
      detallesColumns: PropTypes.bool,
      textAlign: PropTypes.string,
      colorNombre: PropTypes.string,
      cod_tipo_pago: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
  children: PropTypes.node,
  renderAccionFila: PropTypes.func,
  renderAccionFooter: PropTypes.func,
  columnaAccionAncho: PropTypes.string,
  mostrarCodTipoPago: PropTypes.bool,
  mostrarCosto: PropTypes.bool,
  mostrarValor: PropTypes.bool,
  mostrarDetalle: PropTypes.bool,
  mostrarCabecera: PropTypes.bool,
  usarEtiquetasDetalleComoCabecera: PropTypes.bool,
  onRefresh: PropTypes.func,
  refreshDisabled: PropTypes.bool,
  accionesHeader: PropTypes.node,
};

export default TablaDue;
