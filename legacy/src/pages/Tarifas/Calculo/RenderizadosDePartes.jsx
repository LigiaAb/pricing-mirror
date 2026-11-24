import PropTypes from "prop-types";
import { Box, Button, Divider, Grid, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";
import React from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import TextComponent from "@/components/Formulario/TextComponent";
import SubirArchivoComponent2 from "@/components/Formulario/SubirArchivoComponent2";
import { Upload } from "lucide-react";
import SelectComponent from "@/components/Formulario/SelectComponent";
import { api } from "@/api";

export const GenerarCeldaNombre = ({ nombre, nombre_proveedor, textAlign = "right", color = "info.main" }) => {
  return (
    <Stack direction="column" color={color} mt={0} pr={2} width="100%">
      <Typography variant="h5" textAlign={textAlign} sx={{ fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: textAlign, fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {nombre_proveedor}
      </Typography>
    </Stack>
  );
};
export const GenerarCeldaAlertaVacio = ({ nombre }) => {
  return (
    <Grid container color={"error.main"} mt={0} width="100%" alignItems="center">
      <Grid size="grow">
        <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
          {nombre}
        </Typography>
        <Grid size="grow">
          <Typography variant="h5" sx={{ fontWeight: "lighter !important", textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
            No se encontraron Servicios de este proveedor para este rubro
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

export const GenerarCeldaVaciaNombre = ({ nombre }) => {
  return (
    <Stack direction="column" color={"red.main"} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {nombre}
      </Typography>
      <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        No se selecciono ninguna tarifa para el rubro
      </Typography>
    </Stack>
  );
};
export const GenerarCeldaPorcentajeNombre = ({ nombre }) => {
  return (
    <Stack direction="column" color={"info.main"} mt={1} width="100%">
      <Typography variant="h5" sx={{ textAlign: "right", fontSize: "inherit", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {nombre}
      </Typography>
      {/* <Typography variant="body" sx={{ textAlign: "right", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "wrap" }}>
        {entidad_nombre}
      </Typography> */}
    </Stack>
  );
};
export const GenerarCeldaValor = ({ moneda, valor, total = false, decimales = 2 }) => {
  return (
    <Grid container width="100%" direction="column" justifyContent="space-between">
      <Grid key={moneda} container color={`text.main`} width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
        <Typography variant="body" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16, mr: 1 }}>
          {moneda}
        </Typography>
        <Typography color={`${total ? "text" : "primary"}.main`} variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }}>
          {isNaN(valor)
            ? valor
            : Number(valor || 0.00001)
                .toFixed(decimales)
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </Typography>
      </Grid>
    </Grid>
  );
};

export const GenerarCeldaVaciaValor = () => {
  return (
    <Grid container width="100%" direction="row" justifyContent="space-between" wrap="nowrap">
      <Typography variant="body" fontWeight="600" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 16 }} color={"red.main"}>
        -
      </Typography>
      <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", fontSize: 16, m: 0, p: 0 }} color={"red.main"}>
        {(0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </Typography>
    </Grid>
  );
};

export const GenerarCeldaDetalle = ({ detalles = [] }) => {
  return (
    <List sx={{ m: 0, p: 0 }}>
      {detalles?.map((i, ind) => (
        <ListItem sx={{ m: 0, p: 0, mt: ind !== 0 ? i.mt : undefined }} key={`${i.tarifadetalle_id}-${ind}`}>
          <ListItemText sx={{ m: 0, p: 0 }}>
            <Stack color={`${i.color || "primary"}.main`} textAlign="right">
              <Typography variant="caption" fontWeight="thin" sx={{ textWrap: "nowrap", m: 0, p: 0, fontSize: 12 }}>
                {i.tipo_desc}
              </Typography>
              <Typography variant="body" fontWeight="medium" sx={{ m: 0, p: 0, fontSize: 12 }}>
                {i.tarifadetalle_descripcion || i.tarifadetalle_valor}
              </Typography>
            </Stack>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  );
};
export const GenerarCeldaVaciaDetalle = () => {
  return (
    <List sx={{ m: 0, p: 0 }}>
      <ListItem sx={{ m: 0, p: 0 }}>
        <ListItemText sx={{ m: 0, p: 0 }}>
          <Stack color={`${"primary"}.main`} textAlign="right">
            <Typography variant="body" fontWeight="600" sx={{ textAlign: "right", width: "100%", m: 0, p: 0, fontSize: 18 }} color="error.main">
              -
            </Typography>
          </Stack>
        </ListItemText>
      </ListItem>
    </List>
  );
};

const redondear = (valor, decimales = 0) => {
  if (valor === null || valor === undefined || isNaN(valor)) return "";
  return Number(valor).toFixed(decimales);
};

export const ResumenItem = ({ label, valor, prefijo, sufijo, highlight = false, bgcolor, color, labelColor, textAlign = "right", size = 4, sx, decimales = 0 }) => {
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  return (
    <Grid size={size} bgcolor={bgcolor} p={0.5} sx={sx} textAlign={textAlign} justifyContent={"space-between"} container>
      <Typography width="100%" border="none" variant="caption" color={labelColor || "text.secondary"} wrap>
        {label}
      </Typography>
      <Typography
        // border="none"
        sx={{
          fontFamily: "monospace",
          fontWeight: highlight ? "bold" : 500,
          color: color || (highlight ? "success.main" : "text.primary"),
          width: "100%",
          border: 0,
          borderBottom: 1,
          borderStyle: "solid",
          borderColor: "primary.main",
          whiteSpace: "normal",
          wordBreak: "break-all",
        }}
        // noWrap
      >
        {prefijo ?? ""} {valor != null && valor !== "" ? (typeof valor === "number" ? redondear(valor, decimales) : valor) : "-"} {sufijo ?? ""}
      </Typography>
    </Grid>
  );
};

export const HelperInfoTarifa = ({ tarifa }) => {
  const { catalogos } = useCatalogosCotizacion({});
  const sx_item = { "&:hover": { bgcolor: "primary.main_20" } };

  const color1 = "primary.main_20";
  const color2 = "grey.800_10";
  const color3 = "warning.main_30";
  const color4 = "error.main_30";
  const color5 = "warning.main_10";
  const color6 = "error.main_10";

  // Datos de bitacora
  const servicio = catalogos?.servicios.find((i) => i.value === tarifa?.cod_servicio);
  const metodo = catalogos?.metodos.find((i) => i.cod_servicio === tarifa?.cod_servicio);
  const usuario = catalogos?.empleados?.find((i) => i.cod_usuario === servicio?.ultimo_usuario)?.nombre_completo ?? "";

  const fechaInicio = metodo?.fecha_inicial;
  const fechaFin = metodo?.fecha_final;

  const aQuinceDias = !fechaFin ? false : moment().isBetween(moment(fechaFin).subtract(15, "days"), moment(fechaFin), "day", "[]");
  const vencida = moment().isAfter(fechaFin);
  // const venceEn = moment();

  const tipoTransporte = catalogos?.["tiposTransporte"].find((i) => i.value === tarifa?.cod_tipo_transporte);
  const tipoServicio = catalogos?.["tiposServicio"].find((i) => i.value === tarifa?.cod_tipo_servicio);
  const tipoCarga = catalogos?.["tiposCarga"].find((i) => i.value === tarifa?.cod_tipo_carga);
  const clasificacionCarga = catalogos?.["clasificacionesCarga"].find((i) => i.value === tarifa?.cod_clasificacion_carga);
  const tipoAplicacion = catalogos?.["tiposAplicacion"].find((i) => i.value === tarifa?.cod_tipo_aplicacion);
  const tipoPago = catalogos?.["tiposPago"].find((i) => i.value === tarifa?.cod_tipo_pago);
  const tipoCalculo = catalogos?.["tiposCalculo"].find((i) => i.value === tarifa?.cod_tipo_calculo);
  const categoriaTransporte = catalogos?.["categoriasTransporte"].find((i) => i.value === tarifa?.categoria_transporte);
  const tipoClasificacionServicio = catalogos?.["tiposClasificacionServicio"].find((i) => i.value === tarifa?.servicio_clasificacion);

  return (
    <Grid size={12} container spacing={0.3} bgcolor={aQuinceDias ? color5 : vencida ? color6 : undefined}>
      {aQuinceDias && <ResumenItem textAlign="center" sx={sx_item} size={12} bgcolor={color3} label="" valor={`Tarifa esta por vencer`} />}
      {vencida && <ResumenItem textAlign="center" sx={sx_item} size={12} bgcolor={color4} label="" valor={`Tarifa ha vencido`} />}
      <ResumenItem sx={sx_item} size={4} label="No." valor={`[ ${tarifa?.cod_servicio} ]`} />
      <ResumenItem sx={sx_item} size={8} label="Tarifa" valor={tarifa?.nombre} />
      <ResumenItem sx={sx_item} label="Tipo de Transporte" valor={tipoTransporte?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} bgcolor={!tipoServicio && color2} label="Tipo de Servicio" valor={tipoServicio?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} label="Siglas" valor={tarifa?.siglas} />
      <ResumenItem sx={sx_item} size={12} label="Carrier" valor={tarifa?.entidad_nombre} />
      <ResumenItem sx={sx_item} bgcolor={!tipoCarga && color2} label="Tipo de Carga" valor={tipoCarga?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} bgcolor={!clasificacionCarga && color2} label="Clasificacion de carga" valor={clasificacionCarga?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} bgcolor={!tipoAplicacion && color2} label="Tipo de Aplicacion" valor={tipoAplicacion?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} label="Tipo de Pago" valor={tipoPago?.label ?? "PREPAID / COLLECT"} />
      <ResumenItem sx={sx_item} bgcolor={!tipoCalculo && color2} label="Tipo de Calculo" valor={tipoCalculo?.label} />
      <ResumenItem sx={sx_item} bgcolor={!categoriaTransporte && color2} label="Categoria Transporte" valor={categoriaTransporte?.label ?? "TODOS"} />
      <ResumenItem sx={sx_item} bgcolor={!tipoClasificacionServicio && color2} size={12} label="Tipo de Clasificacion Servicio" valor={tipoClasificacionServicio?.label} />
      <Grid size={12} />
      <ResumenItem sx={sx_item} label="Aplica a todos los origenes y destinos" valor={tarifa?.metodo?.metodo_todos_los_paises ? "Si" : "No"} />
      <ResumenItem sx={sx_item} label="Aplica a todos los commodities" valor={tarifa?.metodo?.metodo_todos_los_commodities ? "Si" : "No"} />
      <ResumenItem sx={sx_item} label="Aplica a todos los clientes" valor={tarifa?.metodo?.cod_tipo_tarifa === 97 ? "Si" : "No"} />
      <Grid size={12} />
      <ResumenItem sx={sx_item} size={6} label="Ultimo Modificador" valor={usuario} />
      <ResumenItem sx={sx_item} size={6} label="Ultima Modificacion" valor={servicio?.ultima_fecha_modificacion ? moment(servicio?.ultima_fecha_modificacion).format("DD-MM-YYYY") : ""} />
      <Grid size={12} />
      <ResumenItem sx={sx_item} size={6} label="Fecha de Inicio" valor={fechaInicio ? moment(fechaInicio).format("DD-MM-YYYY") : ""} />
      <ResumenItem sx={sx_item} size={6} label="Fecha de Vencimiento" valor={fechaFin ? moment(fechaFin).format("DD-MM-YYYY") : ""} />
    </Grid>
  );
};

export const IconoInformacion = ({ item, vencida, aQuinceDias }) => (
  <Grid
    className="c-informacion"
    id={`preview_${item.value}`}
    sx={{
      color: vencida ? "error.main" : aQuinceDias ? "warning.main" : "secondary.main",
      "&:hover": { color: vencida ? "error.900" : aQuinceDias ? "orange.900" : "primary.main" },
      p: 0,
      m: 0,
    }}
  />
);

export const FormularioSpot = ({
  rubros = [],
  monedas = { data: [] },
  criterios = {},
  tarifaSpot = 0,
  setTarifaSpot = () => {},
  onValoresChange = () => {},
  setOpenDialog = () => {},
  metodosRango = [],
}) => {
  const sx_item = { "&:hover": { bgcolor: "primary.main_20" } };

  const [rangos, setRangos] = React.useState([]);
  const [fleteMinimoNuevo, setFleteMinimoNuevo] = React.useState(0);

  const item = rubros.find((item) => item.es_flete);

  const esMinimo = item?.metodo?.rate_venta === 0;

  const moneda = monedas.data?.find((m) => item?.servicio.metodo?.cod_moneda_venta === m.cod_moneda);

  const oldFete = item?.metodo?.rate_venta * criterios?.valor_cw;

  const newFlete = criterios?.valor_cw * tarifaSpot;

  const fleteMinimo = React.useMemo(() => {
    if (!Array.isArray(rangos) || rangos.length === 0) {
      return {};
    }

    return rangos.reduce((min, actual) => (actual.inicio < min.inicio ? actual : min));
  }, [rangos]);

  const consultarRangos = React.useCallback(async () => {
    if (item?.metodo.cod_metodo)
      await api
        .get("api/appweb/lista-tarifa-rango", { params: { cod_estado: 1, cod_metodo: item?.metodo.cod_metodo } })
        .then(({ data }) => {
          setRangos(data.data);
        })
        .catch((e) => console.error(e));
    else {
      setRangos([]);
    }
  }, [item?.metodo?.cod_metodo]);

  React.useEffect(() => {
    consultarRangos();
  }, []);

  React.useEffect(() => {
    setTarifaSpot(fleteMinimo?.venta ?? 0);
  }, [fleteMinimo]);

  if (esMinimo)
    return (
      <Grid p={1}>
        <Grid>
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            width="100%"
            sx={{ "&:before": { m: 0, width: "0%", borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>Datos de tarifa de Flete</Typography>
          </Divider>
          <Grid container>
            <ResumenItem sx={sx_item} size={6} decimales={2} label="Minimo" valor={item?.metodo?.venta} prefijo={moneda?.SIMBOLO_MONEDA} />
            <ResumenItem sx={sx_item} size={6} decimales={2} label="Tarifa actual" valor={fleteMinimo?.venta ?? 0} />
          </Grid>
          <Grid py={2} />
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            width="100%"
            sx={{ "&:before": { m: 0, width: "0%", borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>Ingresar la tarifa SPOT</Typography>
            <Typography color={"text"} variant="caption">
              Modificacion aplicada al minimo
            </Typography>
          </Divider>
          <Grid container>
            <Grid size={6} />
            <ResumenItem
              sx={sx_item}
              size={6}
              decimales={2}
              label="Nuevo Flete"
              valor={
                <Grid container>
                  <TextComponent
                    input={{ grupoId: "total", tipo: "number", label: ` `, id: "pesoKgResultado", val: fleteMinimoNuevo, size: 12 }}
                    onInput={(val) => setFleteMinimoNuevo((v) => val ?? 0)}
                  />
                </Grid>
              }
            />
          </Grid>
          <Grid size={12} container textAlign="right">
            <Grid size="grow" />
            <Grid
              p={1}
              sx={{ "&:hover": { bgcolor: "primary.main", color: "white.main" }, border: 1, borderColor: "primary.main", color: "primary.main", borderRadius: 2, cursor: "pointer" }}
              onClick={() => {
                onValoresChange(fleteMinimoNuevo, Number(fleteMinimo?.venta ?? 0));
                setOpenDialog(false);
                setTarifaSpot(0);
              }}
              tabIndex={2}
            >
              Calcular
            </Grid>
          </Grid>
          <Grid></Grid>
          {/* <pre>{JSON.stringify(item, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(rangos, null, 2)}</pre> */}
        </Grid>
      </Grid>
    );

  return (
    <>
      <Grid p={1}>
        <Grid size="grow" px={0}>
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>Datos de tarifa de Flete</Typography>
          </Divider>
        </Grid>
        <Grid container>
          <ResumenItem sx={sx_item} size={3} decimales={2} label="Tarifa actual" valor={item?.metodo?.rate_venta} />
          <ResumenItem sx={sx_item} size={3} label="CW" valor={criterios?.valor_cw} />
          <ResumenItem sx={sx_item} size={6} decimales={2} label="Flete actual" valor={oldFete} prefijo={moneda?.SIMBOLO_MONEDA} />
        </Grid>
        <Grid py={2} />
        <Grid size="grow" px={0}>
          <Divider
            color={"primary.main"}
            textAlign="left"
            p={0}
            m={0}
            sx={{ "&:before": { m: 0, borderTopWidth: 10, borderTopColor: "primary.main" }, "&:after": { m: 0, borderTopWidth: 0, borderTopColor: "primary.main_90" } }}
          >
            <Typography color={"text"}>Ingresar la tarifa SPOT</Typography>
          </Divider>
        </Grid>
        <Grid container>
          <ResumenItem
            sx={sx_item}
            size={6}
            decimales={2}
            label="Tarifa SPOT"
            valor={
              <Grid container>
                <TextComponent input={{ grupoId: "total", tipo: "number", label: ` `, id: "pesoKgResultado", val: tarifaSpot, size: 12 }} onInput={(val) => setTarifaSpot((v) => val ?? 0)} />
              </Grid>
            }
          />
          <ResumenItem sx={sx_item} size={6} decimales={2} label="Flete SPOT" valor={newFlete} prefijo={moneda?.SIMBOLO_MONEDA} />
        </Grid>
        <Grid py={2} />
        <Grid size={12} container textAlign="right">
          <Grid size="grow" />
          <Grid
            p={1}
            sx={{ "&:hover": { bgcolor: "primary.main", color: "white.main" }, border: 1, borderColor: "primary.main", color: "primary.main", borderRadius: 2, cursor: "pointer" }}
            onClick={() => {
              onValoresChange(newFlete, Number(tarifaSpot));
              setOpenDialog(false);
              setTarifaSpot(0);
            }}
            tabIndex={2}
          >
            Calcular
          </Grid>
        </Grid>
        <Grid></Grid>
        <Grid>{/* <pre>{JSON.stringify(item, null, 2)}</pre> */}</Grid>
        <Grid>{/* <pre>{JSON.stringify(criterios, null, 2)}</pre> */}</Grid>
      </Grid>
    </>
  );
  // );
};

export const AgregarArchivoDescripcionSPOT = ({ archivoSPOT, setArchivoSPOT, generarVersion, descripcionSPOT, setDescripcionSPOT, reasonCodeSPOT, setReasonCodeSPOT, reasonsCodes }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={6} container direction="row" spacing={2}>
        <SubirArchivoComponent2
          input={{
            tipo: "archivo2",
            label: "Archivo de justificacion",
            id: "archivo",
            val: archivoSPOT,
            acceptedFiles: ["application/pdf", ".pdf"],
            multiple: false,
            icono: "c-pdf",
            buttonText: "Seleccionar Archivo",
            requerido: true,
          }}
          onInput={(val) => {
            setArchivoSPOT(val);
          }}
          xz
        />
        <Grid size={12}>
          <SelectComponent
            input={{
              tipo: "select",
              label: "Reason code",
              id: "archivo",
              options: reasonsCodes,
              val: reasonCodeSPOT,
              requerido: true,
            }}
            onInput={(val) => {
              setReasonCodeSPOT(val);
            }}
          />
        </Grid>
      </Grid>
      <Grid size={6}>
        <TextComponent
          input={{
            tipo: "textarea",
            label: "Descripción",
            id: "descripcion",
            val: descripcionSPOT,
            // acceptedFiles: ["application/pdf", ".pdf"],
            multiple: false,
            // icono: "c-pdf",
            buttonText: "Seleccionar Archivo",
            requerido: true,
          }}
          onInput={(val) => {
            setDescripcionSPOT(val);
          }}
        />
      </Grid>
      <Grid size={12}>
        <Button sx={{ width: "100%", mb: 3 }} disabled={!archivoSPOT || !reasonCodeSPOT || !descripcionSPOT} variant="contained" onClick={generarVersion}>
          <Grid container direction="columns" spacing={2} width="100%" justifyContent="center" justifyItems="center" alignItems="center" alignContent="center">
            <Upload />
            GUARDAR VERSION CON ESTE ARCHIVO
          </Grid>
        </Button>
      </Grid>
    </Grid>
  );
};

IconoInformacion.propTypes = { item: PropTypes.object, vencida: PropTypes.bool, aQuinceDias: PropTypes.bool };
GenerarCeldaNombre.propTypes = { nombre: PropTypes.string.isRequired, nombre_proveedor: PropTypes.string, textAlign: PropTypes.string, color: PropTypes.string };
GenerarCeldaAlertaVacio.propTypes = { nombre: PropTypes.string.isRequired };
GenerarCeldaVaciaNombre.propTypes = { nombre: PropTypes.string.isRequired };
GenerarCeldaPorcentajeNombre.propTypes = { nombre: PropTypes.string.isRequired };
GenerarCeldaValor.propTypes = { moneda: PropTypes.string.isRequired, valor: PropTypes.number.isRequired, total: PropTypes.bool.isRequired, decimales: PropTypes.number };
GenerarCeldaDetalle.propTypes = { detalles: PropTypes.array.isRequired };
HelperInfoTarifa.propTypes = { tarifa: PropTypes.object.isRequired };
AgregarArchivoDescripcionSPOT.propTypes = {
  archivoSPOT: PropTypes.object,
  setArchivoSPOT: PropTypes.func,
  generarVersion: PropTypes.func,
  descripcionSPOT: PropTypes.string,
  setDescripcionSPOT: PropTypes.func,
  reasonCodeSPOT: PropTypes.string,
  setReasonCodeSPOT: PropTypes.func,
  reasonsCodes: PropTypes.array,
};
