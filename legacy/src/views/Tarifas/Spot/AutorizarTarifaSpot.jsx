import React from "react";
import PropTypes from "prop-types";
import { Button, Grid, Typography } from "@mui/material";
import { api } from "@/api";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import useCatalogosCotizacion from "../Cotizaciones/hooks/useCatalogosCotizacion";
import { CODS_ESTADOS } from "@/constants/estados";
import { ResumenItem } from "@/pages/Tarifas/Calculo/RenderizadosDePartes";
import SubirArchivoComponent2 from "@/components/Formulario/SubirArchivoComponent2";
import moment from "moment";
import { DownloadIcon, Eye, SquareArrowOutUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import FormularioCotizacion from "../Cotizaciones/FormularioCotizacion/FormularioCotizacion";
import { useLocation } from "react-router-dom";
import { encryptId } from "@/api/encryptDecrypt";

const crearOrdenPorCabeceraYDetalle = (campoCabecera, campoDetalle) => {
  return (a, b) => {
    const ordenCabecera = String(a[campoCabecera] ?? "").localeCompare(String(b[campoCabecera] ?? ""), "es", { numeric: true, sensitivity: "base" });

    if (ordenCabecera !== 0) return ordenCabecera;

    return String(a[campoDetalle] ?? "").localeCompare(String(b[campoDetalle] ?? ""), "es", { numeric: true, sensitivity: "base" });
  };
};

const AutorizarTarifaSpot = (props) => {
  const location = useLocation();

  const { cod_usuario, nombreUsuario } = useSelector((state) => state.auth);
  const { currentCentroCosto, currentPais, currentEmpresa, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);

  const { pathname } = location;

  const [key, setKey] = React.useState(0);

  const [tarifas, setTarifas] = React.useState([]);
  const [cotizaciones, setCotizaciones] = React.useState([]);
  const [cotizacionDetalles, setCotizacionDetalles] = React.useState([]);
  const [criterios, setCriterios] = React.useState([]);

  const [tarifaSeleccionada, setTarifaSeleccionada] = React.useState(null);

  const [archivo, setArchivo] = React.useState(null);
  const [pdfUri, setPdfUri] = React.useState(null);
  const [funcionDeDescarga, setFuncionDeDescarga] = React.useState(() => {});

  const [mostrarAutorizados, setMostrarAutorizados] = React.useState(false);
  const formRef = React.useRef(null);

  const { isLoading, catalogos } = useCatalogosCotizacion();

  const enlaceConCurrents = (id) => {
    const link = `${window.location.origin}/tarifas/cotizacion/solicitud-cotizacion/${encryptId(id)}?meta=${encryptId(
      JSON.stringify({
        pais: currentPais?.cod_pais || null,
        empresa: currentEmpresa?.cod_empresa || null,
        centroCosto: currentCentroCosto?.cod_cc || null,
        modulo: currentModulo?.cod_modulo || null,
        menu: currentMenu?.cod_menu || null,
        categoria: currentCategoria?.cod_categoria || null,
      }),
    )}`;
    return link;
  };

  const consultar = async () => {
    const data = await api.get("/api/appweb/lista-tarifa-spot");
    setTarifas(data.data.data);
    const data1 = await api.get("/api/appweb/lista-cotizacion-cabecera");
    setCotizaciones(data1.data.data);
    const data3 = await api.get("/api/appweb/lista-cotizacion-detalle");
    setCotizacionDetalles(data3.data.data);
  };

  const dataProcesada = React.useMemo(() => {
    //     "cod_cotizaciondetalle": 9,
    // "cod_cotizacion_cabecera": 4,

    return tarifas
      .map((tarifa) => {
        const cotizacionDetalle = (cotizacionDetalles || []).find((cot) => cot.cod_cotizaciondetalle === tarifa.cod_cotizaciondetalle);

        if (!cotizacionDetalle) {
          return null;
        }

        const cotizacion = cotizaciones.find((cot) => cot.cod_cotizacion_cabecera === cotizacionDetalle.cod_cotizacion_cabecera);

        return {
          ...cotizacion,
          ...cotizacionDetalle,
          ...tarifa,
        };
      })
      .filter((i) => i)
      .map((c) => {
        const entidad = c.entidad_nombre || catalogos.clientes?.find((cli) => cli.entidad_id === c.entidad_id)?.entidad_nombre || "";
        const tipoTransporte = catalogos.tiposTransporte?.find((tt) => tt.value === c.cod_tipo_transporte)?.label || "";
        const tipoServicio = catalogos.tiposServicio?.find((ts) => ts.value === c.cod_tipo_servicio)?.label || "";
        const tipoCarga = catalogos.tiposCarga?.find((tc) => tc.value === c.cod_tipo_carga)?.label || "";
        const tipoPago = catalogos.tiposPago?.find((tp) => tp.value === c.cod_tipo_pago)?.label || "";
        const clasificacionCarga = catalogos.clasificacionesCarga?.find((cc) => cc.value === c.cod_clasificacion_carga)?.label || "";
        const estado = catalogos.estados?.find((e) => (!c.cod_estado ? c.cod_estado === 1 : e.value === c.cod_estado))?.label || "";
        const empleado_solicitante = catalogos.empleados.find((e) => e.cod_usuario === c.cod_usuario_tarifaspot);
        const empleado_auorizador = catalogos.empleados.find((e) => e.cod_usuario === c.cod_usuario_tarifaspot);

        return {
          entidad,
          tipoTransporte,
          tipoServicio,
          tipoCarga,
          tipoPago,
          clasificacionCarga,
          estado,
          empleado_solicitante,
          empleado_auorizador,
          ...c,
          // cod_estado: c.cod_estado ?? 1,
          accionesDeTabla: { view: true },
        };
      })
      .sort(crearOrdenPorCabeceraYDetalle("cod_cotizacion_cabecera", "cod_cotizaciondetalle"));
  }, [tarifas, cotizacionDetalles, cotizaciones, catalogos]);

  const dataFiltrada = React.useMemo(() => {
    return dataProcesada
      .filter((i) => i.cod_cc === currentCentroCosto?.cod_cc)
      .filter((i) => (mostrarAutorizados ? i.cod_estado === CODS_ESTADOS.AUTORIZADO : i.cod_estado === CODS_ESTADOS.ACTIVO || i.cod_estado === CODS_ESTADOS.PENDIENTE));
  }, [dataProcesada, mostrarAutorizados, currentCentroCosto?.cod_cc]);

  const handleObtenerArchivo = React.useCallback(async (row) => {
    try {
      const archivo = await api.post("/api/appweb/recuperar-archivo", { ruta_archivo: row.url_documento }, { responseType: "arraybuffer" });

      const nombreArchivo = `SPOT-${moment().format("YYYY")}-${row.cod_tarifa_spot}.pdf`;

      const blob = new Blob([archivo.data], { type: "application/pdf" });
      const file = new File([archivo.data], nombreArchivo, { type: "application/pdf" });

      const url = URL.createObjectURL(file);

      const localFuncionDescarga = () => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      };

      setFuncionDeDescarga(() => localFuncionDescarga);
      setPdfUri(url);
    } catch (err) {
      console.error("Error al subir archivo:", err);

      const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
      // setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      // setIsLoading(false);
    }
  }, []);

  const obtenerDatosDeCriterios = React.useCallback(async ({ cod_cotizacion_cabecera, cod_cotizaciondetalle }) => {
    const criteriosUrl = "/api/appweb/lista-cotizacion-detalle-criterio";
    const data = await api.get(criteriosUrl, {
      params: { cod_cotizacion_cabecera, cod_cotizaciondetalle },
    });

    return data.data.data?.find((i) => i.cod_criterio === 15)?.valor;
  }, []);

  const handleSeleccionar = React.useCallback(
    async (id, row) => {
      if (row) {
        const cw = await obtenerDatosDeCriterios(row);
        setTarifaSeleccionada({ ...row, cw });
        if (row.url_documento) {
          handleObtenerArchivo(row);
        } else {
          setPdfUri(null);
        }
      } else {
        setTarifaSeleccionada(null);
      }
      setKey((v) => v + 1);
    },
    [obtenerDatosDeCriterios, handleObtenerArchivo],
  );

  const handleReactivar = React.useCallback(
    async (row) => {
      try {
        const item = {
          ...row,
          cod_cotizaciondetalle: row.cod_cotizaciondetalle,
          cod_tarfaspot: row.cod_tarifaspot,
          cod_usuario_autoriza_tarifaspot: cod_usuario,
          cod_estado: CODS_ESTADOS.ACTIVO,
        };

        await api.post("/api/appweb/actualizar-tarifa-spot", item);
        handleSeleccionar(0, { ...item });
      } catch (err) {
        console.error("Error al subir archivo:", err);

        const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
        // setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        await consultar();
      }
    },
    [cod_usuario, handleSeleccionar],
  );

  const handleSubirArchivo = React.useCallback(
    async (row) => {
      try {
        const formData = new FormData();
        // Usar los campos correctos según la API
        formData.append("cod_tarifa_spot", row.cod_tarifa_spot); // Campo requerido por la API
        formData.append("archivo", archivo);

        const resp = await api.post("/api/appweb/cargar-archivo-tarifa-spot", formData, { headers: { "Content-Type": "multipart/form-data" } });

        handleSeleccionar(0, { ...row, url_documento: resp?.data?.data?.url_documento });
      } catch (err) {
        console.error("Error al subir archivo:", err);

        const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
        // setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        await consultar();
      }
    },
    [archivo, handleSeleccionar],
  );

  const handleAutorizar = React.useCallback(
    async (row) => {
      try {
        const item = {
          ...row,
          cod_cotizaciondetalle: row.cod_cotizaciondetalle,
          cod_tarfaspot: row.cod_tarifaspot,
          cod_usuario_autoriza_tarifaspot: cod_usuario,
          cod_estado: CODS_ESTADOS.AUTORIZADO,
        };

        const activarVersion = {
          cod_cotizacion_cabecera: row.cod_cotizacion_cabecera,
          cod_cotizaciondetalle: row.cod_cotizaciondetalle,
        };

        await api.post("/api/appweb/actualizar-tarifa-spot", item);

        await api.post(`/api/appweb/activar-cotizacion-detalle`, activarVersion);
        handleSeleccionar(0, { ...item });
      } catch (err) {
        console.error("Error al subir archivo:", err);

        const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
        // setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        await consultar();
      }
    },
    [cod_usuario, handleSeleccionar],
  );

  const handleRechazar = React.useCallback(
    async (row) => {
      try {
        const item = {
          ...row,
          cod_cotizaciondetalle: row.cod_cotizaciondetalle,
          cod_tarfaspot: row.cod_tarifaspot,
          cod_usuario_autoriza_tarifaspot: cod_usuario,
          cod_estado: CODS_ESTADOS.RECHAZADO_GLOBAL,
        };

        await api.post("/api/appweb/actualizar-tarifa-spot", item);
        handleSeleccionar(0, { ...item });
      } catch (err) {
        console.error("Error al subir archivo:", err);

        const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
        // setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        await consultar();
        handleSeleccionar(0, null);
      }
    },
    [cod_usuario, handleSeleccionar],
  );

  const handleEliminarArchivo = async (id, row) => {
    try {
      const item = { ...row, url_documento: "" };

      await api.post("/api/appweb/actualizar-tarifa-spot", item);
      handleSeleccionar(0, { ...item });
    } catch (err) {
      console.error("Error al subir archivo:", err);

      const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
      // setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      await consultar();
    }
  };

  React.useEffect(() => {
    consultar();
  }, []);

  React.useEffect(() => {
    if (!tarifaSeleccionada) {
      return;
    }

    if (!tarifaSeleccionada.url_documento) {
      setPdfUri(null);
      return;
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [handleObtenerArchivo, pdfUri, tarifaSeleccionada]);

  const generarTitulo = (texto, texto2) => {
    return (
      <Grid
        container
        direction="row"
        size={"auto"}
        rowSpacing={0}
        sx={{
          border: "1px solid",
          borderColor: "gray.100",
          boxShadow: "2.5px 10px 10px rgba(0,0,0,0.2)",
        }}
        justifyContent="left"
        alignItems="center"
        borderRadius={1.2}
        px={1}
        mb={2}
        width="100%"
      >
        <Grid width="100%">
          <Typography sx={{ fontSize: 20 }}>{texto}</Typography>
        </Grid>
        {texto2 && (
          <Grid width="100%">
            <Typography sx={{ fontSize: 16 }}>{texto2}</Typography>
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Grid>
      <TablaEditableComponent
        data={dataFiltrada}
        rowKey="cod_tarifa_spot"
        encabezados={[
          { label: "Cotización", campo: "cod_cotizacion_cabecera", name: "cod_cotizacion_cabecera" },
          { label: "Version", campo: "version", name: "version" },
          { label: "Tarifa", campo: "venta", name: "venta" },
          {
            label: "Cliente",
            campo: "entidad_nombre",
            name: "entidad_nombre",
            tooltip_properties: { color: "black.main", borderColor: "black.main", bgcolor: "background.main_70" },
            multilinea: false,
          },
          { label: "Tipo de Transporte", campo: "tipoTransporte", name: "tipoTransporte" },
          { label: "Tipo de Servicio", campo: "tipo_descripcion_servicio", name: "tipo_descripcion_servicio" },
          { label: "Tipo de Carga", campo: "tipoCarga", name: "tipoCarga" },
          { label: "Tipo de pago", campo: "tipoPago", name: "tipoPago" },
          { label: "Clasificación de Carga", campo: "clasificacionCarga", name: "clasificacionCarga" },
        ]}
        acciones={{ view: true, delete: false }}
        eventosDeTabla={{ view: handleSeleccionar, delete: handleEliminarArchivo }}
        botones={{
          autorizados: {
            label: mostrarAutorizados ? "Ocultar Autorizados" : "Mostrar Autorizados",
            onClick: () => setMostrarAutorizados((v) => !v),
          },
        }}
      />
      <Grid container mt={3} ref={formRef} key={key}>
        {tarifaSeleccionada && (
          <Grid container width="100%">
            {generarTitulo(`Tarifa SPOT`)}
            <Grid size={6}>
              <Grid
                container
                sx={{ p: 1, bgcolor: "primary.main_5", borderRadius: 2, boxShadow: "2.5px 10px 10px rgba(0, 2, 48, 0.2)", "& > div": { "&:hover": { bgcolor: "primary.main_10", borderRadius: 1 } } }}
              >
                <ResumenItem size={2} label="Cotización" valor={tarifaSeleccionada.cod_cotizacion_cabecera} />
                <ResumenItem size={2} label="Versión" valor={tarifaSeleccionada.version} />
                <ResumenItem size={4} label="Usuario" valor={tarifaSeleccionada?.empleado_auorizador?.nombre_completo} />
                <ResumenItem size={4} label="Autorizador" valor={tarifaSeleccionada?.empleado_auorizador?.nombre_completo} />
                <Grid size={6} container sx={{ px: 0.5 }}>
                  <Grid size={12} textAlign="center" bgcolor="primary.main" color="white.main" p={0.5}>
                    <Typography>Nuevos valores</Typography>
                  </Grid>
                  <Grid size={12} container px={2}>
                    <ResumenItem size={6} decimales={2} label="Nueva Tarifa" valor={tarifaSeleccionada.venta} />
                    <ResumenItem
                      size={6}
                      decimales={2}
                      label="Nuevo Valor"
                      valor={tarifaSeleccionada.flete ? Number(tarifaSeleccionada.flete) : Number(tarifaSeleccionada.venta) * Number(tarifaSeleccionada.cw)}
                    />
                  </Grid>
                </Grid>
                <Grid size={6} container sx={{ px: 0.5 }}>
                  <Grid size={12} textAlign="center" bgcolor="primary.main" color="white.main" p={0.5}>
                    <Typography>Valores origienales</Typography>
                  </Grid>
                  {tarifaSeleccionada.venta_original ? (
                    <Grid size={12} container px={2}>
                      <ResumenItem size={6} decimales={2} label="Tarifa Original" valor={tarifaSeleccionada.venta_original} />
                      <ResumenItem size={6} decimales={2} label="Valor Original" valor={Number(tarifaSeleccionada.venta_original) * Number(tarifaSeleccionada.cw)} />
                    </Grid>
                  ) : (
                    <Grid size={12} container px={2}>
                      {/* <ResumenItem size={6} decimales={2} label="Tarifa Original" valor={tarifaSeleccionada.venta_original} /> */}
                      {/* <ResumenItem size={6} decimales={2} label="Valor Original" valor={Number(tarifaSeleccionada.venta_original) * Number(tarifaSeleccionada.cw)} /> */}
                    </Grid>
                  )}
                </Grid>
                <ResumenItem size={4} label="Reason Code" valor={catalogos?.reasonCodeSpot?.find((r) => r.value === tarifaSeleccionada?.reason_code)?.label || ""} />
                <ResumenItem size={8} textAlign="left" label="Justificacion" valor={tarifaSeleccionada?.jusificacion} />
                <Grid size={8} />
                {/* <ResumenItem size={4} label="Cliente" valor={tarifaSeleccionada.entidad_nombre} />
                <ResumenItem size={4} label="Tipo de Transporte" valor={tarifaSeleccionada.tipoTransporte} />
                <ResumenItem size={4} label="Tipo de Servicio" valor={tarifaSeleccionada.tipoServicio} />
                <ResumenItem size={4} label="Tipo de Carga" valor={tarifaSeleccionada.tipoCarga} />
                <ResumenItem size={4} label="Tipo de Pago" valor={tarifaSeleccionada.tipoPago} />
                */}
              </Grid>
              <Grid container>
                <FormularioCotizacion inputsToHide={["empresa", "centroCosto"]} defaultValues={tarifaSeleccionada} catalogos={catalogos} tipoFormulario="lectura" />
              </Grid>
              {tarifaSeleccionada.url_documento &&
                (tarifaSeleccionada.cod_estado === CODS_ESTADOS.ACTIVO ? (
                  <Grid width="100%" container rowGap={1}>
                    <Grid size={4} px={2}>
                      <Button variant="contained" size="small" sx={{ width: "100%" }} onClick={() => handleAutorizar(tarifaSeleccionada)}>
                        Autorizar Tarifa Spot
                      </Button>
                    </Grid>
                    <Grid size={4} px={2}>
                      <Button variant="contained" color="error" size="small" sx={{ width: "100%" }} onClick={() => handleRechazar(tarifaSeleccionada)}>
                        Rechazar Tarifa Spot
                      </Button>
                    </Grid>
                    <Grid size={4} px={2}>
                      <Button variant="text" size="small" sx={{ width: "100%" }} href={enlaceConCurrents(tarifaSeleccionada?.cod_cotizacion_cabecera)} target="_blank">
                        <Eye size={20} />
                        <Grid px={1} />
                        Ver Cotización
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Grid width="100%" container rowGap={1}>
                    {/* <Grid size={6} px={2}>
                      <Button variant="contained" size="small" sx={{ width: "100%" }} onClick={() => handleReactivar(tarifaSeleccionada)}>
                        Reactivar Tarifa Spot
                      </Button>
                    </Grid>
                    <Grid size={6} px={2}>
                      <Button variant="text" size="small" sx={{ width: "100%" }} href={enlaceConCurrents(tarifaSeleccionada?.cod_cotizacion_cabecera)} target="_blank">
                        <Eye size={20} />
                        <Grid px={1} />
                        Ver Cotización
                      </Button>
                    </Grid> */}
                  </Grid>
                ))}
            </Grid>
            {!tarifaSeleccionada.url_documento && (
              <Grid container size={6} mt={3} px={2}>
                <Typography variant="h5">Documento de autorización</Typography>

                <ResumenItem
                  size={12}
                  label=" "
                  valor={
                    <SubirArchivoComponent2
                      input={{
                        tipo: "archivo2",
                        label: " ",
                        id: "archivo",
                        val: archivo,
                        acceptedFiles: ["application/pdf", ".pdf", ".eml", ".msg", ".mbox"],
                        multiple: false,
                        icono: "c-pdf",
                        buttonText: "Seleccionar Archivo",
                      }}
                      onInput={(val) => {
                        setArchivo(val);
                      }}
                    />
                  }
                />
                <Grid width="100%">
                  <Button disabled={!archivo} variant="contained" size="small" sx={{ width: "100%" }} onClick={() => handleSubirArchivo(tarifaSeleccionada)}>
                    Subir Archivo
                  </Button>
                </Grid>
              </Grid>
            )}
            {tarifaSeleccionada.url_documento && (
              <Grid container size={6} mt={3} px={2}>
                {pdfUri && <iframe src={`${pdfUri}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="500px" />}
                {pdfUri && (
                  <Grid size={12} px={2}>
                    <Button variant="contained" size="small" sx={{ width: "100%" }} onClick={funcionDeDescarga}>
                      Descargar
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}
          </Grid>
        )}
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify(criterios, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tarifas, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(dataProcesada, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(dataProcesada[0], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(cotizaciones, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(cotizacionDetalles, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

AutorizarTarifaSpot.propTypes = {};

export default AutorizarTarifaSpot;
