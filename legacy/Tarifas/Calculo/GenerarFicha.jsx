import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Icon, Stack, Tooltip, Typography } from "@mui/material";
import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../constants/clasifacionesTarifas";
const GenerarFicha = (props) => {
  const { item, seleccionarTarifa } = props;

  const disabled = useMemo(() => !item.seleccionable, [item]);
  const completo = useMemo(() => item.completo, [item]);
  const clasificacion = useMemo(() => REL_TIPOS_CLASIFICACION_TARIFAS.find((tc) => tc.value === item.servicio_clasificacion && tc.cod_tipo_padre === item.cod_tipo_transporte), [item]);

  return (
    <Stack
      direction={{ md: "row", sm: "row" }}
      fullWidth
      sx={{ m: 0, p: 0, cursor: disabled ? "" : "pointer" }}
      onClick={() => (disabled ? () => {} : seleccionarTarifa(item))}
      bgcolor="background.main"
      borderRadius={2}
      // arial-disabled={disabled}
    >
      {/* <pre>{JSON.stringify({ completo }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify({ item }, null, 2)}</pre> */}
      {item.seleccionado && (
        <TooltipComponent
          titulo={<Typography textAlign="center">Limpiar selección</Typography>}
          borderColor="primary.main"
          bgcolor="white.main"
          fontSize={14}
          content={<Typography className="c-circulo-x" color="error" sx={{ my: "auto", mr: 0.5, fontSize: "inherit" }} />}
        />
      )}
      <Stack
        direction={{ md: "column", sm: "column" }}
        alignItems="center"
        alignContent="center"
        alignSelf="center"
        alignText="center"
        width="100%"
        gap={0.5}
        sx={{
          p: 0.5,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: disabled ? "grey.main" : "primary.main",
          borderStyle: "solid",
          bgcolor: "background.main",
          "&:hover": {
            bgcolor: disabled ? undefined : "accent.main_20",
          },
        }}
        key={`${item.cod_servicio}_${1}`}
      >
        <TooltipComponent
          arrow
          borderColor="black.main"
          titulo={
            <Stack direction="column" width="fit-content" gap={1} alignItems="center" alignContent="center" alignSelf="center">
              {item.metodo?.detalles?.length > 0 ? (
                item.metodo?.detalles?.map((detalle) => (
                  <Stack direction="column" sx={{ textAlign: "left", fontSize: 13 }} alignItems="left" alignContent="left" alignSelf="left" width="fit-content" gap={0} key={detalle.tarifadetalle_id}>
                    <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
                      {detalle.tipo_desc}
                    </Typography>
                    <Typography variant="body" fontWeight="600" sx={{ fontSize: "inherit", m: 0, p: 0 }}>
                      {detalle.tarifadetalle_descripcion || detalle.tarifadetalle_valor}
                    </Typography>
                  </Stack>
                ))
              ) : (
                <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 10 }}>
                  No hay detalles ingresados
                </Typography>
              )}
            </Stack>
          }
        >
          <Stack
            direction="row"
            alignItems="start"
            alignContent="start"
            alignSelf="center"
            alignText="center"
            width="100%"
            gap={1}
            sx={{
              px: 0.9,
              mb: 0,
              fontSize: 11,
              color: "white.main",
              bgcolor: !item.seleccionable ? "grey.main" : item.metodo.tipo_tarifa_desc === "PUBLICA" ? "primary.main" : "accent.main",
              // color: !item.seleccionable ? "grey.main" : item.metodo.tipo_tarifa_desc === "PUBLICA" ? "primary.main" : "accent.main",
              // borderColor: !item.seleccionable ? "grey.main" : item.metodo.tipo_tarifa_desc === "PUBLICA" ? "primary.main" : "accent.main",
              borderWidth: 1,
              borderStyle: "solid",
            }}
            borderColor={!item.seleccionable ? "grey.main" : item.metodo.tipo_tarifa_desc === "PUBLICA" ? "primary.main" : "accent.main"}
            borderRadius={10}
          >
            <Typography className={item.metodo.tipo_tarifa_desc === "PUBLICA" ? "c-circulo-cheque" : "c-sol"} sx={{ p: 0, m: 0, width: 12, height: 12, textAlign: "", fontSize: "inherit" }} />
            {["PREPAID", "COLLECT"].includes(item.cod_tipo_pago?.label) && (
              <Typography sx={{ width: 12, height: 12, textAlign: "", fontSize: "inherit", fontWeight: "bolder" }}>
                {item.cod_tipo_pago?.label === "PREPAID" ? "P" : item.cod_tipo_pago?.label === "COLLECT" ? "C" : item.cod_tipo_pago?.label}
              </Typography>
            )}
            <Typography variant="body1" sx={{ mx: "auto", fontSize: "inherit", fontWeight: "bolder" }}>
              {/* {item.cod_servicio} */} {item.metodo.tipo_tarifa_desc}
            </Typography>
          </Stack>
        </TooltipComponent>
        {/* <Stack direction="row" alignItems="center" alignContent="center" alignSelf="center" alignText="center" gap={1} sx={{ mx: "auto" }}> */}
        {/* {item.tipo_calculo_desc} */}
        <Stack direction="column" alignItems={"start"} alignContent="start" alignSelf="start" alignText="start" sx={{}}>
          <Typography variant="body1" sx={{ p: 0, fontSize: "inherit", fontWeight: "bolder", borderColor: "primary", borderWidth: 0, borderRightStyle: "solid" }}>
            <Stack direction="row" alignItems="start" alignContent="start" alignSelf="start" alignText="start" gap={1} sx={{}}>
              <Typography variant="caption" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                Servicio
              </Typography>
              <Typography variant="body" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                {item.nombre}
              </Typography>
            </Stack>
          </Typography>
          <Typography variant="body1" sx={{ p: 0, fontSize: "inherit", fontWeight: "bolder", borderColor: "primary", borderWidth: 0, borderRightStyle: "solid" }}>
            <Stack direction="row" alignItems="start" alignContent="start" alignSelf="start" alignText="start" gap={1} sx={{}}>
              <Typography variant="caption" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                Tipo de Calculo
              </Typography>
              <Typography variant="body" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                {item.tipo_calculo_desc}
              </Typography>
            </Stack>
          </Typography>
          {clasificacion && (
            <Typography variant="body1" sx={{ p: 0, fontSize: "inherit", fontWeight: "bolder", borderColor: "primary", borderWidth: 0, borderRightStyle: "solid" }}>
              <Stack direction="row" alignItems="start" alignContent="start" alignSelf="start" alignText="start" gap={1} sx={{}}>
                <Typography variant="caption" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                  Clasificacion Calculo
                </Typography>
                <Typography variant="body" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                  {clasificacion.label}
                </Typography>
              </Stack>
            </Typography>
          )}
          <Typography variant="body1" sx={{ p: 0, fontSize: "inherit", fontWeight: "bolder" }}>
            <Stack direction="row" alignItems="start" alignContent="start" alignSelf="start" alignText="start" gap={1} sx={{}}>
              <Typography variant="caption" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                Total del Calculo
              </Typography>
              <Typography variant="body" sx={{ m: 0, p: 0, textWrap: "nowrap" }}>
                <Typography sx={{}} variant="body">
                  {item.metodo.moneda_venta?.simbolo_moneda}{" "}
                </Typography>
                <Typography sx={{}} variant="body">
                  {Number(item.metodo.venta).toFixed(2)}
                </Typography>
              </Typography>
            </Stack>
          </Typography>
        </Stack>
        {/* </Stack> */}
      </Stack>
      {/* <pre>{JSON.stringify(item, null, 2)}</pre> */}
    </Stack>
  );
};

GenerarFicha.propTypes = {
  item: PropTypes.object,

  seleccionarTarifa: PropTypes.func,
};

export default GenerarFicha;
