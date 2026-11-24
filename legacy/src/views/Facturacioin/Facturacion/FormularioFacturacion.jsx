import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Grid, Typography } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import TabComponent from "../../../components/Tabs/TabComponent";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import TablaDetallesComponent from "../../../components/Tabla/TablaDetallesComponent";
import { useObtenerAccionesPorOpcionActual } from "../../../hooks/useObtenerPermisos";
import generarQRConImagen from "../../../utils/generadorQR";
import { useFetchAllEntidades, useFetchAllEntidadesSimple } from "../../../hooks/Fetch/useFetchEntidades";
import { useSelector } from "react-redux";
import PdfEtiqueta from "../../../pages/Embarques/pdfEtiqueta";
import { api } from "../../../api";
import { Value } from "sass";
import TextAlign from "@tiptap/extension-text-align";
import { set, sub } from "date-fns";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchEstados, useFetchMonedas, useFetchRelacionTipo, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
import { use } from "react";
import { useFetchUsuarios } from "../../../hooks/Bpm/catalogos/useFetchUsuarios";
import moment from "moment";
import pdfFactura from "../../../pages/Facturacion/facturacion/pdfFactura";
import pdfNotaDebito from "@/pages/Facturacion/facturacion/pdfNotaDebito";
import DialogComponent from "@/components/Dialog/DialogComponent";
import { Download } from "lucide-react";
import { find } from "@amcharts/amcharts5/.internal/core/util/Array";



/* ===================== UTILIDADES PARA SANEAR PAYLOAD ===================== */
const toNumberOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  // eliminar separadores de miles con coma, por si acaso
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v) => !!v;

const toStrOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const toISOOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Construye el payload final para el endpoint /insertar-documento-encabezado
 * Mapea selects (value), convierte números/fechas y corrige valor_extento vs valor_exento.
 */
/**
 * Construye el payload para insertar/actualizar un detalle de documento
 */
const buildDetallePayload = (d = {}) => ({
  documentodetalle_id: toNumberOrNull(d.documentodetalle_id),
  documentoencabezado_id: toNumberOrNull(d.documentoencabezado_id),
  rubro_id: toNumberOrNull(d.rubro_id),
  valor: toNumberOrNull(d.valor),
  saldo: toNumberOrNull(d.saldo),
  fecha: toISOOrNull(d.fecha),
  descripcion: toStrOrNull(d.descripcion),
  impuesto_id: toNumberOrNull(d.impuesto_id),
  porcentaje_impuesto: toNumberOrNull(d.porcentaje_impuesto),
  estado_id: toNumberOrNull(d.estado_id),
  tipo_ingreso_id: toNumberOrNull(d.tipo_ingreso_id),
  banco_id: toNumberOrNull(d.banco_id),
  cuenta_bancaria: toStrOrNull(d.cuenta_bancaria),
  cantidad: toNumberOrNull(d.cantidad),
  descuento: toNumberOrNull(d.descuento),
});

const buildDocumentoPayload = (c = {}) => ({
  // Datos generales
  usuario_id: toNumberOrNull(c.usuario_id),
  usuario_modificador_id: toNumberOrNull(c.usuario_modificador_id),
  cencos_id: c?.cencos_id?.value ?? toNumberOrNull(c.cencos_id),
  empresa_id: c?.empresa_id?.value ?? toNumberOrNull(c.empresa_id),

  // Documento
  documentoencabezado_id: toNumberOrNull(c.documentoencabezado_id),
  tipo_documento_id: c?.tipo_documento_id?.value ?? toNumberOrNull(c.tipo_documento_id),
  estado_id: c?.estado_id?.value ?? toNumberOrNull(c.estado_id),
  fecha_documento: toISOOrNull(c.fecha_documento),
  fecha_emision: toISOOrNull(c.fecha_emision),
  serie: toStrOrNull(c.serie),
  correlativo: toNumberOrNull(c.correlativo),

  // Cliente
  entidad_id: c?.entidad_id?.value ?? toNumberOrNull(c.entidad_id),

  // Montos y tributos (corrige valor_extento/valor_exento)
  valor_exento: toNumberOrNull(c.valor_exento ?? c.valor_extento),
  importe_exonerado: toNumberOrNull(c.importe_exonerado),
  iva_aplica: toBool(c.iva_aplica),
  iva_retenido: toNumberOrNull(c.iva_retenido),
  isv_porcentaje: toNumberOrNull(c.isv_porcentaje),
  isv_val: toNumberOrNull(c.isv_val),
  importe_gravado_porcentaje: toNumberOrNull(c.importe_gravado_porcentaje),
  orden_compra_exenta: toStrOrNull(c.orden_compra_exenta),
  valor_total: toNumberOrNull(c.valor_total),
  saldo: toNumberOrNull(c.saldo),

  // Pago
  tipo_pago_id: c?.tipo_pago_id?.value ?? toNumberOrNull(c.tipo_pago_id),
  moneda_id: c?.moneda_id?.value ?? toNumberOrNull(c.moneda_id),

  // Administrativo
  constancia_registro_exonerado: toStrOrNull(c.constancia_registro_exonerado),
  identificativo_registro_sag: toStrOrNull(c.identificativo_registro_sag),
  movimiento_administrativo: toBool(c.movimiento_administrativo),

  // Observaciones
  concepto: toStrOrNull(c.concepto),
});


const FormularioFacturacion = (props) => {
  // const { cod_usuario } = useSelector((state) => state.auth);
  // const permisos = useObtenerAccionesPorOpcionActual();
  const tipoDocumento = useFetchTipos({ tipo_tabla: "TIPO_DOCUMENTO" });
  const tipoPago = useFetchTipos({ tipo_tabla: "PAGO" })
  const estados = useFetchEstados({ cod_tipo: 328 });
  const moneda = useFetchMonedas();
  const cencos = useFetchCentrosCosto()
  const empresa = useFetchEmpresas();
  const { currentCentroCosto, currentEmpresa, currentPais } = useSelector((state) => state.menu)


  const razonSocial = useFetchAllEntidadesSimple(["dsv"], { cod_estado: 1, tipo_entidad: "DSV" }, {});

  const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});
  const proveedores = useFetchAllEntidadesSimple(["proveedores"], { cod_estado: 1, tipo_entidad: "proveedor" }, {});
  const [documentos, setDocumentos] = useState({ data: [] });


  const [cabecera, setCabecera] = useState({});

  const [contactos, setContactos] = useState([]);

  const [usuarios, setUsuarios] = useState([]);


  const [detalleForm, setDetalleForm] = useState({});

  const [detalles, setDetalles] = useState([]);

  //pdf
  const [pdfUri, setPdfUri] = useState(null);
  const [funcionDescargaPdf, setFuncionDescargaPdf] = useState(() => { });
  const [previewPdf, setPreviewPdf] = useState(false);


  const [filtroEntidadSeleccionada, setFiltroEntidadSeleccionada] = useState(null);
  const [filtroTipoDocumentoSeleccionado, setFiltroTipoDocumentoSeleccionado] = useState(null);

  const [documentoEncabezadoIdActual, setDocumentoEncabezadoIdActual] = useState(null);
  // const entidades = useFetchAllEntidades(["clientes"], { cod_estado: 1 }, {}, ["CLIENTE"]);

  
  const buscarEntidades = useCallback((entidad_id) => {
    const enClientes = entidades.data?.data?.find(e => e.entidad_id === entidad_id);
    if (enClientes) return enClientes.entidad_nombre;
    const enProveedores = proveedores.data?.data?.find(e => e.entidad_id === entidad_id);
    if (enProveedores) return enProveedores.entidad_nombre;
    return entidad_id;
  }, [entidades.data, proveedores.data])
  
  useEffect(() => {
      if(entidades.data?.isPending)entidades.refetch();
  },[entidades])
  console.log("entidades", entidades.data)

  const obtenerContactos = async (entidad_id) => {
    await api
      .get("/api/appweb/lista-entidad-contacto", { params: { cod_tipo: 3, entidad_id: entidad_id || cabecera.entidad_id?.entidad_id } })
      .then(({ data }) => setContactos(data.data.data.map((i) => ({ ...i, label: `${i.entidadcontacto_nombre}` }))));
  };

  // console.log("razon social", razonSocial.data);


  // console.log("contactos", contactos)
  // console.log("tipos", tipoDocumento.data)

  const obtenerUsuario = useCallback(async () => {
    const baseApiURL = "/api/appweb/listaemp-usu-puesto";
    const response = await api.get(baseApiURL);
    let usuarios = response.data.data;
    usuarios = usuarios.map((e) => ({ ...e, label: e.usuario_nombre, value: e.cod_usuario }));
    setUsuarios(usuarios);
  }, []);

  const codPais = currentPais.cod_pais;
  // console.log("pais", currentPais)
  // console.log("empresa", currentEmpresa);
  // console.log("cabecera", cabecera);
  // console.log("tipoDocumento", tipoDocumento.data);
  // console.log("tipoPago",tipoPago.data)
  // console.log("estados", estados.data);
  // console.log("correlativo", correlativo.data);
  // console.log("entidades", entidades);
  // console.log("clientes", entidades.data);
  console.log("moneda", moneda.data);

  // const obtenerIdentificaciones = async (entidad_id) => {
  //   await api
  //     .get("/api/appweb/lista-entidad-identificacion", { params: { cod_tipo: 3, entidad_id: entidad_id || cabecera.entidad_id?.entidad_id } })
  //     .then(({ data }) => setCabecera((d) => ({ ...d, entidad_nit: "test" })));
  // };




  const verFila = (id, row) => {
    // console.log("row.tipo_documento_id:", row.tipo_documento_id);
    // console.log("tipoDocumento.data:", tipoDocumento.data);
    // console.log("find result:", tipoDocumento.data?.find((t) => t.value === row.tipo_documento_id));
    setCabecera({
      ...row,
      tipo_documento_id: tipoDocumento.data?.find((t) => t.value === row.tipo_documento_id),
      entidad_id: { ...row, value: row.entidad_id, label: buscarEntidades(row.entidad_id) },
      tipo_pago_id: { value: row.tipo_pago_id, label: tipoPago.data?.find((t) => t.value === row.tipo_pago_id)?.label || null },
      moneda_id: { value: row.moneda_id, label: moneda.data?.find((m) => m.value === row.moneda_id)?.label || null },
      estado_id: { value: row.estado_id, label: estados.data?.find((e) => e.value === row.estado_id)?.label || null },
      idUsuario: { value: row.usuario_id, label: usuarios.find((u) => u.cod_usuario === row.usuario_id)?.usuario || null },
      cencos_id: { value: row.cencos_id, label: cencos.data?.find((c) => c.cod_cc === row.cencos_id)?.nombre_cc || null },
      empresa_id: { value: row.empresa_id, label: empresa.data?.find((em) => em.cod_empresa === row.empresa_id)?.nombre_emp || null },
      fecha_documento: row.fecha_documento ? moment(row.fecha_documento).toDate() : null,
      fecha_emision: row.fecha_emision ? moment(row.fecha_emision).toDate() : null,
      serie: row.serie ?? "",

    });

    // Cargar detalles específicos de este encabezado

    // Limpiar formulario de detalles cuando cambias de encabezado
    setDetalleForm({});
    obtenerDetallesPorEncabezado(row.documentoencabezado_id);
  }

  // console.log("cabecera.tipo_documento_id:", cabecera.tipo_documento_id)}
  // console.log("centros de costo", cencos.data)
  // console.log("empresa", empresa.data)

  const verFilaDetalle = (id, row) => {
    setDetalleForm({
      ...row,
      fecha: row.fecha ? moment(row.fecha).toDate() : null,
    })
  }


  const onInput = ({ id, val }) => {
    setCabecera(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const onInputDetalle = ({ id, val }) => {
    setDetalleForm(prev => ({
      ...prev,
      [id]: val
    }));
  };

  // const obtenerCorrelativos = useCallback(async () => {

  //   try {
  //     const response = await api.get("/api/appweb/lista-correlativos");
  //     console.log("correlativos", response.data.data?.filter(c => c.tabla_correlativo === "DOCUMENTO_ENCABEZADO" && c.nombre_cc === "EXPORTACIONES"));
  //   } catch (error) {
  //     console.error("Error al obtener correlativos:", error);
  //   }
  // }, [])


  const obtenerDocumentos = useCallback(async (entidad_id) => {
    try {
      const response = await api.get("/api/appweb/lista-documento-encabezado");
      // console.log("Documentos obtenidos del servidor:", response.data);
      setDocumentos(response.data);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
    }
  }, []);

  const DocumentosFiltrados = useMemo(() => {
    return (documentos?.data || [])
      .filter(e => e.estado_id === 80 && [302, 327, 351].includes(e.tipo_documento_id))
      .filter(e => filtroEntidadSeleccionada ? e.entidad_id === filtroEntidadSeleccionada.value : true)
      .filter(e => filtroTipoDocumentoSeleccionado ? e.tipo_documento_id === filtroTipoDocumentoSeleccionado.value : true)
      .map(e => {
        return {
          ...e,
          tipo_documento_label: tipoDocumento.data?.find((t) => t.value === e.tipo_documento_id)?.label || e.tipo_documento_id

        }
      })
  }, [documentos?.data, filtroEntidadSeleccionada, filtroTipoDocumentoSeleccionado, tipoDocumento.data])

  const onInputFiltro = ({ id, val }) => {
    if (id === "entidad") setFiltroEntidadSeleccionada(val);
    if (id === "tipo_documento_id") setFiltroTipoDocumentoSeleccionado(val);
  };

  const anularDocumento = useCallback(async (documentoencabezado_id) => {
    await api.post("/api/appweb/cambio-estado-documento-encabezado", { documentoencabezado_id: documentoencabezado_id, estado_id: 4 })
    await obtenerDocumentos()
  }, [obtenerDocumentos])


  const agregar = useCallback(async () => {
    const payload = buildDocumentoPayload(cabecera);
    // console.log("Estado cabecera antes de enviar:", cabecera);
    // console.log("payload POST /insertar-documento-encabezado", payload);

    try {
      const response = await api.post("/api/appweb/insertar-documento-encabezado", payload);
      // console.log("respuesta al agregar", response.data);

      // Refrescar lista de documentos
      await obtenerDocumentos();

      // Limpiar formulario después de insertar exitosamente
      setCabecera({});
      console.log("Documento agregado exitosamente. Formulario limpiado.");
    } catch (err) {
      console.error("Error al insertar documento:", err?.response?.data ?? err.message);
    }
  }, [cabecera, obtenerDocumentos]);


  const actualizar = useCallback(async () => {
    const payload = buildDocumentoPayload(cabecera);
    // console.log("payload PUT /actualizar-documento-encabezado", payload);

    if (!cabecera.documentoencabezado_id) {
      console.error("No hay ID de documento para actualizar");
      return;
    }

    try {
      const response = await api.post("/api/appweb/actualizar-documento-encabezado", payload);
      // console.log("respuesta al actualizar", response.data);

      // refrescar lista
      await obtenerDocumentos();

      // limpiar formulario
      setCabecera({});
      console.log("Documento actualizado exitosamente. Formulario limpiado.");
    } catch (err) {
      console.error("Error al actualizar documento:", err?.response?.data ?? err.message);
    }
  }, [cabecera, obtenerDocumentos])


  // Obtener detalles específicos de un encabezado
  const obtenerDetallesPorEncabezado = useCallback(async (documentoencabezado_id) => {
    if (!documentoencabezado_id) {
      setDetalles([]);
      return;
    }

    try {
      const response = await api.get("/api/appweb/lista-documento-detalle", {
        params: { documentoencabezado_id: documentoencabezado_id }
      });
      setDetalles(response.data?.data || []);
      setDocumentoEncabezadoIdActual(documentoencabezado_id);
    } catch (error) {
      console.error("Error al obtener detalles:", error);
      setDetalles([]);
      setDocumentoEncabezadoIdActual(documentoencabezado_id);
    }
  }, []);

  // Agregar o actualizar detalle de factura
  const agregarDetalleFactura = useCallback(async () => {
    // Validar que haya un encabezado seleccionado
    if (!documentoEncabezadoIdActual) {
      // console.error("Debe seleccionar un documento encabezado primero");
      return;
    }

    // Construir payload con el documentoencabezado_id actual
    const payload = buildDetallePayload({
      ...detalleForm,
      documentoencabezado_id: documentoEncabezadoIdActual,
    });

    // console.log("payload detalle:", payload);

    // Si existe documentodetalle_id, es actualización; sino, es creación
    if (detalleForm.documentodetalle_id) {
      // Actualizar detalle existente
      await api
        .post("/api/appweb/actualizar-documento-detalle", payload)
        .then(({ data }) => {
          console.log("Detalle actualizado:", data);
          // Recargar detalles del encabezado
          obtenerDetallesPorEncabezado(documentoEncabezadoIdActual);
          // Limpiar formulario
          setDetalleForm({});
        })
        .catch((err) => {
          console.error("Error al actualizar detalle:", err?.response?.data ?? err.message);
        });
    } else {
      // Crear nuevo detalle
      await api
        .post("/api/appweb/insertar-documento-detalle", payload)
        .then(({ data }) => {
          console.log("Detalle creado:", data);
          // Recargar detalles del encabezado
          obtenerDetallesPorEncabezado(documentoEncabezadoIdActual);
          // Limpiar formulario
          setDetalleForm({});
        })
        .catch((err) => {
          console.error("Error al insertar detalle:", err?.response?.data ?? err.message);
        });
    }
  }, [detalleForm, documentoEncabezadoIdActual, obtenerDetallesPorEncabezado]);

  // Editar un detalle (cargarlo en el formulario)
  const editarDetalle = useCallback((documentodetalle_id) => {
    const detalleAEditar = detalles.find(
      (item) => item.documentodetalle_id === documentodetalle_id
    );

    if (detalleAEditar) {
      setDetalleForm(detalleAEditar);
    }
  }, [detalles]);

  // Eliminar un detalle
  // const eliminarDetalle = useCallback(async (documentodetalle_id) => {
  //   try {
  //     await api.delete("/api/appweb/eliminar-documento-detalle", {
  //       params: { documentodetalle_id: documentodetalle_id }
  //     });
  //     console.log("Detalle eliminado");
  //     // Recargar detalles del encabezado
  //     obtenerDetallesPorEncabezado(documentoEncabezadoIdActual);
  //   } catch (error) {
  //     console.error("Error al eliminar detalle:", error);
  //   }
  // }, [documentoEncabezadoIdActual, obtenerDetallesPorEncabezado]);

  // const obtenerDetalleDocumento = async () => {
  //   await api
  //   .get("/api/appweb/lista-documento-detalle")
  //   .then(({data}) => setDetalleForm(data));
  // }

  // console.log("detalle", detalleForm)


  // console.log("documentos", documentos);
  // console.log("detalles documentos", detalleForm);


  // const generarPdfDeFacturacion = useCallback (
  //   async(documentodetalle_id, row)=>{

  //     try{

  //       const pdfData ={

  //       }
  //     }

  //   }
  // )

  //   const obtenerDocumentoRelacionado = async (documentoId) => {
  //     const { data } = await api.get("/api/appweb/lista-documento-coordinacion", { params: { documentoencabezado_id: documentoId } });

  //     return data.data || [];
  //   };

  //   const validarExistenciaDocumento = async (embarqueId, tipoDoc) => {
  //   try {
  //     const { data } = await api.get("/api/appweb/listar-coordinacion-documento", {
  //       params: {
  //         embarque_id: embarqueId,
  //         cod_tipo_documento: tipoDoc
  //       }
  //     });

  //     return (data?.data || []).length > 0;
  //   } catch (error) {
  //     console.error("Error validando documento:", error);
  //     return false;
  //   }
  // };


  useEffect(() => {
    // console.log("Estado cabecera actualizado:", cabecera);
    return () => {
      if (pdfUri) URL.revokeObjectURL(pdfUri);
    };
  }, [pdfUri]);

  useEffect(() => {
    obtenerDocumentos()
    obtenerUsuario()
    // obtenerCorrelativos()
    // obtenerDetalleDocumento()
  }, [obtenerUsuario, obtenerDocumentos])

  const handleGenerarPdfFactura = useCallback(async (documentoencabezado_id, row) => {

    const tipoDoc = Number(row?.tipo_documento_id?.value ?? row?.tipo_documento_id);
    const documentoId = Number(documentoencabezado_id ?? row?.documentoencabezado_id);

    if (!documentoId) {
      console.error("handleGenerarPdfFactura: documentoencabezado_id no válido", documentoencabezado_id, row);
      return;
    }

    // const coordinaciones = await obtenerDocumentoRelacionado(documentoId)

    // const embarqueId = coordinaciones?.[0]?.embarque_id;

    // if (!embarqueId) {
    //   console.error("No se encontró embarque_id para este documento");
    //   return;
    // }

    let pdfDataUri;

    if (tipoDoc === 302) {
      const nombreArchivo = `factura_${documentoId}.pdf`;

      const { data: response } = await api.post(`api/appweb/generar-pdf-factura`, { documentoencabezado_id: documentoId, codPais: codPais });

      const urlDocumento = response?.data?.url_documento || response?.url_documento || response?.data?.url;

      if (urlDocumento) {

        //   const yaExiste = await validarExistenciaDocumento(embarqueId, tipoDoc);

        //  if(!yaExiste)
        //   { await api.post("/api/appweb/insertar-coordinacion-documento", {
        //     embarque_id: embarqueId,
        //     cod_tipo_documento: tipoDoc,
        //     ubicacion: "coordinaciones",
        //     tipo_documento: "coordinaciones",
        //     url_archivo: urlDocumento,
        //     descripcion: `Documento generado automáticamente (${tipoDoc})`,
        //     estado_cod: 1
        //   })}

        const archivo = await api.post(`api/appweb/recuperar-archivo`, { ruta_archivo: urlDocumento }, { responseType: "arraybuffer" });
        const blob = new Blob([archivo.data], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(blob);

        const localFuncionDescarga = () => {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          link.remove();
        };

        setFuncionDescargaPdf(() => localFuncionDescarga);
        setPreviewPdf(true);
        setPdfUri(fileUrl);
        return;
      }

      // Fallback: el endpoint puede devolver el PDF directamente en vez de una URL de archivo
      // const responsePdf = await api.post(`api/appweb/generar-pdf-factura`, { documentoencabezado_id: documentoId }, { responseType: "arraybuffer" });
      // const blob = new Blob([responsePdf.data], { type: "application/pdf" });
      // const fileUrl = URL.createObjectURL(blob);

      // const localFuncionDescarga = () => {
      //   const link = document.createElement("a");
      //   link.href = fileUrl;
      //   link.download = nombreArchivo;
      //   document.body.appendChild(link);
      //   link.click();
      //   link.remove();
      // };

      // setFuncionDescargaPdf(() => localFuncionDescarga);
      // setPreviewPdf(true);
      // setPdfUri(fileUrl);

    } else if (tipoDoc === 327) {

      const nombreArchivo = `ND_${documentoId}.pdf`;

      const { data: response } = await api.post(`api/appweb/generar-pdf-notadebito`, { documentoencabezado_id: documentoId, codPais: codPais });

      const urlDocumento = response?.data?.url_documento || response?.url_documento || response?.data?.url;

      if (urlDocumento) {

        //   const yaExiste = await validarExistenciaDocumento(embarqueId, tipoDoc);

        //  if(!yaExiste)
        //   { await api.post("/api/appweb/insertar-coordinacion-documento", {
        //     embarque_id: embarqueId,
        //     cod_tipo_documento: tipoDoc,
        //     ubicacion: "coordinaciones",
        //     tipo_documento: "coordinaciones",
        //     url_archivo: urlDocumento,
        //     descripcion: `Documento generado automáticamente (${tipoDoc})`,
        //     estado_cod: 1
        //   })}

        const archivo = await api.post(`api/appweb/recuperar-archivo`, { ruta_archivo: urlDocumento }, { responseType: "arraybuffer" });
        const blob = new Blob([archivo.data], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(blob);

        const localFuncionDescarga = () => {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          link.remove();
        };

        setFuncionDescargaPdf(() => localFuncionDescarga);
        setPreviewPdf(true);
        setPdfUri(fileUrl);
        return;
      }

      // const response = await api.post('/api/appweb/generar-pdf-notadebito', {
      //   documentoencabezado_id,
      //   embarque_id: row.embarque_id
      // });

      // const raw = response.data.data;
      // console.log("raw nota debito", raw);


      // const { detalles, ...pdfDataRaw } = raw;
      // const monedaRaw = detalles?.[0]?.moneda ?? null;
      // const monedaLabel = moneda.data?.find(m => m.value === monedaRaw)?.simbolo_moneda ?? String(monedaRaw ?? "");

      // const vesselStr = Array.isArray(raw.vessel)
      //   ? raw.vessel.map(v => `${v.correlativo_guia ?? ""} / ${v.correlativo_guia_master ?? ""}`).join(", ")
      //   : raw.vessel ?? "";

      // const contenedorStr = Array.isArray(raw.contenedor)
      //   ? raw.contenedor.map(c => c.equipo_descripcion ?? c.equipo_id).join(", ")
      //   : raw.contenedor ?? "";

      // const equipos = Array.isArray(raw.contenedor)
      //   ? raw.contenedor.map(c => c.equipo_descripcion ?? c.equipo_id)
      //   : [];

      // const pdfDataMapped = {
      //   ...pdfDataRaw,
      //   horizontal: false,
      //   tamano: "pt",
      //   format: "a4",
      //   vessel: vesselStr,
      //   contenedor: contenedorStr,
      //   equipos,
      //   fiscalNumber:raw.fiscalNumber ?? "",
      //   fechaLlegada:raw.fechafechaLlegada ?? "",
      //   moneda: monedaLabel,
      //   tax: raw.tax ?? 0,
      //   taxId: raw.taxId ?? "",
      //   direccionBancoOrigen: "Bank of America N.A 1se Third Ave. Miami, FL 33131",
      //   intermediarySwiftBancoOrigen: "BOFAUS3M",
      //   bankAccountNumberBancoOrigen: "1901643308",
      //   beneficiaryBankSwiftBancoDestino: "FCOHPAPA",
      //   beneficiaryBankNameBancoDestino: "Banco Ficohsa Panama S.A.",
      //   accountBancoDestino: "01-102-4769",
      //   beneficiaryNameBancoDestino: "Cropa International, S.A.",
      //   enviarAvisoDePago: "ricardo.guzman@cropa.com.gt",
      //   emitidoPor: usuarios.find(u => u.cod_usuario === raw.emitidoPor)?.nom_empleado ?? String(raw.emitidoPor ?? ""),
      // };

      // const pdfItems = detalles.map((d) => ({
      //   rubro: d.rubro ?? "",
      //   monto: d.monto ?? 0,
      //   moneda: moneda.data?.find((m) => m.value === d.moneda)?.simbolo_moneda ?? String(d.moneda ?? ""),
      // }));

      // pdfDataUri = pdfNotaDebito(pdfDataMapped, pdfItems);

      // const link = document.createElement("a");
      // link.href = pdfDataUri;
      // link.download = `nota_debito_${raw.internalNumber ?? "N"}.pdf`;
      // link.click();
    } else if (tipoDoc === 351) {
      const response = await api.post("/api/appweb/generar-pdf-ordencompra", { documentoencabezado_id: documentoId, codPais: codPais });
      // console.log("Respuesta pdf ", response.data)
      const nombreArchivo = `OrdenCompra_${documentoId}.pdf`;


      const urlDocumento = response?.data?.data?.url_documento || response?.url_documento || response?.data?.data?.url;

      if (urlDocumento) {

        //   const yaExiste = await validarExistenciaDocumento(embarqueId, tipoDoc);

        //  if(!yaExiste)
        //   { await api.post("/api/appweb/insertar-coordinacion-documento", {
        //     embarque_id: embarqueId,
        //     cod_tipo_documento: tipoDoc,
        //     ubicacion: "coordinaciones",
        //     tipo_documento: "coordinaciones",
        //     url_archivo: urlDocumento,
        //     descripcion: `Documento generado automáticamente (${tipoDoc})`,
        //     estado_cod: 1
        //   })}

        const archivo = await api.post(`api/appweb/recuperar-archivo`, { ruta_archivo: urlDocumento }, { responseType: "arraybuffer" });
        const blob = new Blob([archivo.data], { type: "application/pdf" });
        const fileUrl = URL.createObjectURL(blob);

        const localFuncionDescarga = () => {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = nombreArchivo;
          document.body.appendChild(link);
          link.click();
          link.remove();
        };

        setFuncionDescargaPdf(() => localFuncionDescarga);
        setPreviewPdf(true);
        setPdfUri(fileUrl);
        return;
      }
    }

  }, [moneda.data, usuarios]);


  const grupos = useMemo(() => {

    const borderWidth = 1,
      borderColor = "primary",
      borderStyle = "doted";

    return [
      { id: "Datos Generales", label: "Datos Generales", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Datos Documento", label: "Datos de Documento", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Datos cliente", label: "Datos de Cliente", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Montos y Tributos", label: "Montos y Tributos", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Forma Pago", label: "Forma de Pago", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Administrativo  y Operativo", label: "Administrativo y Operativo", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Observaciones", label: "Observaciones", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
      { id: "Detalle", label: "Detalle", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
    ]
  }, []);


  const libreriaInputs = useMemo(() => {

    return {
      //Datos generales
      idUsuario: {
        // grupoId: "Datos Generales",
        id: "usuario_id",
        label: "ID Usuario",
        tipo: "number",
        size: 4,
        val: cabecera.usuario_id || 0,
        visible: false

      },

      idUsuarioModificador: {
        // grupoId: "Datos Generales",
        id: "usuario_modificador_id",
        label: "Id usuario modificador",
        tipo: "number",
        val: cabecera.usuario_modificador_id || 0, size: 3,
        visible: false
      },

      centroCosto: {
        // grupoId: "Datos Generales",
        id: "cencos_id",
        label: "Centro Costo",
        tipo: "select",
        // labelOption:"nombre",
        size: 4,
        options: cencos.data || [],
        val: cabecera.cencos_id || 0,
        visible: false

      },

      empresa: {
        // grupoId: "Datos Generales",
        id: "empresa_id",
        label: "Empresa",
        tipo: "select",
        // labelOption:"nombre", 
        size: 4,
        options: empresa.data || [],
        val: cabecera.empresa_id || 0,
        visible: false

      },

      //Datos documento
      documentoEncabezadoId: {
        // grupoId: "Datos Documento",
        id: "documentoencabezado_id",
        label: "Documento Encabezado ID",
        tipo: "number",
        size: 4,
        val: cabecera.documentoencabezado_id || null,
        visible: false
      },

      tipoDocumento: {
        // grupoId: "Datos Documento",
        id: "tipo_documento_label",
        label: "Tipo Documento",
        tipo: "select",
        size: 4,
        options: tipoDocumento.data || [],
        val: cabecera.tipo_documento_id || null,
        visible: false
      },

      estadoId: {
        // grupoId: "Datos Documento",
        id: "estado_id",
        label: "Estado ID",
        tipo: "select",
        size: 4,
        options: estados.data || [],
        val: cabecera.estado_id || null,
        visible: false
      },

      fechaDocumento: {
        // grupoId: "Datos Documento",
        id: "fecha_documento",
        label: "Fecha Documento",
        tipo: "datetime",
        size: 4,
        readonly: false,
        val: cabecera.fecha_documento || new Date(),
        visible: false

      },


      fechaEmision: {
        // grupoId: "Datos Documento",
        id: "fecha_emision",
        label: "Fecha Emision",
        tipo: "datetime",
        size: 4,
        readonly: false,
        val: cabecera.fecha_emision || new Date(),
        visible: false

      },

      // fechaContable:{ 
      //   grupoId:"Datos Documento", 
      //   id:"fecha_contable", 
      //   label:"Fecha Contable", 
      //   tipo:"datetime", 
      //   size:4, val:cabecera.fecha_contable || new Date()
      // },

      serie: {
        // grupoId: "Datos Documento",
        id: "serie",
        label: "Serie",
        tipo: "text",
        size: 6,
        readonly: false,
        val: cabecera.serie ?? "",
        visible: false

      },

      correlativo: {
        // grupoId: "Datos Documento",
        id: "correlativo",
        label: "Correlativo",
        tipo: "number",
        size: 6,
        val: cabecera.correlativo || 0,
        readonly: false,
        visible: false

      },

      // serieContable:{ 
      //   grupoId:"Datos Documento", 
      //   id:"serie_contable", 
      //   label:"Serie Contable", 
      //   tipo:"text", 
      //   size:6, 
      //   val:cabecera.serie_contable || ""
      // },

      // correlativoContable:{ 
      //   grupoId:"Datos Documento", 
      //   id:"correlativo_contable", 
      //   label:"Correlativo Contable", 
      //   tipo:"number", 
      //   size:6, val:cabecera.correlativo_contable || 0
      // },

      // serieFel: {
      //   grupoId:"Datos Documento", 
      //   id:"serie_fel", 
      //   label:"Serie FEL", 
      //   tipo:"number", 
      //   size:4, 
      //   val:cabecera.serie_fel || ""
      // },

      // numeroFel: { 
      //   grupoId:"Datos Documento", 
      //   id:"numero_fel", 
      //   label:"Numero FEL", 
      //   tipo:"number", 
      //   size:4,val:cabecera.numero_fel || 0
      // },

      // uuidFel:{ 
      //   groupId:"Datos Documento", 
      //   id:"uuid_fel", 
      //   label:"UUID FEL", 
      //   tipo:"number", 
      //   size:4, 
      //   visible:true, 
      //   val:cabecera.uuid_fel || ""

      // },
      // talonario:{ 
      //   groupId:"Datos Documento", 
      //   id:"talonario", 
      //   label:"Talonario", 
      //   tipo:"number", 
      //   size:6, 
      //   val:cabecera.talonario || ""
      // },
      // numeroCorte:{ 
      //   groupId:"Datos Documento", 
      //   id:"numero_corte", 
      //   label:"Numero Corte", 
      //   tipo:"number", 
      //   size:6, 
      //   val:cabecera.numero_corte || 0
      // },
      // modificable:{ 
      //   groupId:"Datos Documento", 
      //   id:"modificable", 
      //   label:"Modificable", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   val:cabecera.modificable || false
      // },
      // facturaJuridica:{ 
      //   groupId:"Datos Documento", 
      //   id:"factura_juridica", 
      //   label:"Factura Juridica", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   val:cabecera.factura_juridica || false
      // },
      // movimientoAdministrativoDocumento:{ 
      //   groupId:"Datos Documento", 
      //   id:"movimiento_administrativo_documento", 
      //   label:"Movimiento Administrativo Documento", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   val:cabecera.movimiento_administrativo_documento || false
      // },
      // liquidacionesEliminadas:{ 
      //   groupId:"Datos Documento", 
      //   id:"liquidaciones_eliminadas", 
      //   label:"Liquidaciones Eliminadas", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   val:cabecera.liquidaciones_eliminadas || false
      // },

      //Datos cliente
      entidadId: {
        // grupoId: "Datos cliente",
        id: "entidad_id",
        label: "Cliente",
        tipo: "select",
        size: 6,
        options: entidades.data != null ? entidades.data.data.map((i) => {
          return { ...i, label: i.entidad_nombre, value: i.entidad_id }
        }) : [],
        val: cabecera.entidad_id || null,
        visible: false

      },
      clienteNombre: {
        //  grupoId:"Datos cliente", 
        id: "cliente_nombre",
        label: "Nombre Cliente",
        tipo: "text",
        size: 6,
        readonly: false,
        val: cabecera.cliente_nombre,
        visible: false
      },
      clienteDireccion: {
        // grupoId:"Datos cliente", 
        id: "cliente_direccion",
        label: "Direccion Cliente",
        tipo: "text",
        size: 8,
        readonly: false,
        val: cabecera.cliente_direccion || "",
        visible: false

      },
      clienteNit: {
        // grupoId:"Datos cliente", 
        id: "cliente_nit",
        label: "Nit Cliente",
        tipo: "text",
        size: 4,
        readonly: false,
        val: cabecera.cliente_nit || "",
        visible: false

      },
      // tipoContribuyente:{ 
      //   grupoId:"Datos cliente", 
      //   id:"tipo_contribuyente", 
      //   label:"Tipo Contribuyente", 
      //   tipo:"number", 
      //   size:4, 
      //   readonly: false, 
      //   val:cabecera.tipo_contribuyente || 0
      // },
      // tipoActividadEconomica:{ 
      //   grupoId:"Datos cliente", 
      //   id:"tipo_actividad_economica", 
      //   label:"Tipo Actividad Economica", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   readonly: false, 
      //   val:cabecera.tipo_actividad_economica || false
      // },


      //Montos y tributos
      valorTotal: {
        // grupoId: "Montos y Tributos",
        id: "valor_total",
        label: "Valor Total",
        tipo: "number",
        size: 4,
        readonly: false,
        val: cabecera.valor_total || 0,
        visible: false

      },
      saldo: {
        // grupoId: "Montos y Tributos",
        id: "saldo",
        label: "Saldo",
        tipo: "number",
        size: 4,
        // visible:true,
        val: cabecera.saldo ?? 0,
        visible: false

      },
      // totalDescuentos:{ 
      //   grupoId:"Montos y Tributos", 
      //   id:"total_descuentos", 
      //   label:"Total Descuentos", 
      //   tipo:"number", 
      //   size:4, 
      //   val:cabecera.total_descuentos || 0
      // },
      valorExento: {
        // grupoId: "Montos y Tributos",
        id: "valor_extento",
        label: "Valor Exento",
        tipo: "number",
        size: 3,
        readonly: true,
        val: cabecera.valor_exento || 0,
        visible: false

      },
      importeExonerado: {
        // grupoId: "Montos y Tributos",
        id: "importe_exonerado",
        label: "Importe Exonerado",
        tipo: "number",
        size: 3,
        readonly: true,
        val: cabecera.importe_exonerado || 0,
        visible: false
      },
      aplicaIva: {
        // grupoId: "Montos y Tributos",
        id: "iva_aplica",
        label: "Aplica IVA",
        tipo: "toggle",
        size: "auto",
        readonly: true,
        val: cabecera.iva_aplica ?? false,
        visible: false


      },
      ivaRetenido: {
        // grupoId: "Montos y Tributos",
        id: "iva_retenido",
        label: "IVA Retenido",
        tipo: "number",
        size: 3,
        readonly: true,
        val: cabecera.iva_retenido || 0,
        visible: false
      },
      isvPorcentaje: {
        // grupoId: "Montos y Tributos",
        id: "isv_porcentaje",
        label: "ISV Porcentaje",
        tipo: "number",
        size: 3,
        readonly: true,
        val: cabecera.isv_porcentaje || 0,
        visible: false

      },
      isvVal: {
        // grupoId: "Montos y Tributos",
        id: "isv_val",
        label: "ISV Valor",
        tipo: "number",
        readonly: true,
        size: 3, val: cabecera.isv_val || 0,
        visible: false
      },
      importeGravado: {
        // grupoId: "Montos y Tributos",
        id: "importe_gravado_porcentaje",
        label: "Importe Grabado",
        tipo: "number",
        size: 3,
        readonly: true,
        val: cabecera.importe_gravado_porcentaje || 0,
        visible: false
      },
      ordenCompraExenta: {
        // grupoId: "Montos y Tributos",
        id: "orden_compra_exenta",
        label: "Venta Exenta",
        tipo: "text",
        size: 3,
        readonly: true,
        val: cabecera.orden_compra_exenta || "",
        visible: false
      },

      //Forma de pago
      tipoPagoId: {
        // grupoId: "Forma Pago",
        id: "tipo_pago_id",
        label: "Tipo de Pago",
        tipo: "select",
        size: 6,
        readonly: false,
        options: tipoPago.data || [],
        val: cabecera.tipo_pago_id || null,
        visible: false

      },
      monedaId: {
        // grupoId: "Forma Pago",
        id: "moneda_id",
        label: "Moneda ID",
        tipo: "select",
        size: 6,
        options: moneda.data || [],
        val: cabecera.moneda_id || null,
        visible: false

      },
      // incobrable:{ 
      //   grupoId:"Forma Pago", 
      //   id:"incobrable", 
      //   label:"Incobrable", 
      //   tipo:"toggle", 
      //   size:"auto",
      //   val:cabecera.incobrable
      // },
      // interEmpresa:{ 
      //   groupId:"Forma Pago", 
      //   id:"interempresa", 
      //   label:"Interempresa", 
      //   tipo:"toggle", 
      //   size:"auto", 
      //   val:cabecera.interempresa
      // },


      //Administrativo y operativo
      // ordenCompra:{
      //    grupoId:"Administrativo  y Operativo", 
      //   id:"orden_compra", 
      //   label:"Orden Compra", 
      //   tipo:"text", 
      //   size:3,
      //   val:cabecera.orden_compra || ""
      // },
      // numeroGuia:{ 
      //   grupoId:"Administrativo  y Operativo", 
      //   id:"numero_guia", 
      //   label:"Numero Guia", 
      //   tipo:"text",
      //    size:3,
      //   val:cabecera.numero_guia || ""
      // },
      constanciaRegistroExonerado: {
        // grupoId: "Administrativo  y Operativo",
        id: "constancia_registro_exonerado",
        label: "Constancia de Registro Exonerado",
        tipo: "text",
        size: 3,
        readonly: true,
        val: cabecera.constancia_registro_exonerado || "",
        visible: false
      },
      identificativoRegistroSAG: {
        // grupoId: "Administrativo  y Operativo",
        id: "identificativo_registro_sag",
        label: "Identificacion de Restro SAG",
        tipo: "text",
        size: 3,
        readonly: true,
        val: cabecera.identificativo_registro_sag || "",
        visible: false
      },
      movimientoAdministrativo: {
        // grupoId: "Administrativo  y Operativo",
        id: "movimiento_administrativo",
        label: "Movimiento Administrativo",
        tipo: "toggle",
        size: "auto",
        readonly: true,
        val: cabecera.movimiento_administrativo ?? false,
        visible: false
      },
      // tipoBien:{ 
      //   grupoId:"Administrativo  y Operativo", 
      //   id:"tipo_bien", 
      //   label:"Tipo Bien", 
      //   tipo:"toggle",
      //    size:"auto", 
      //   val:cabecera.tipo_bien 
      // },

      //Observaciones
      concepto: {
        // grupoId: "Observaciones",
        id: "concepto",
        label: "Concepto",
        tipo: "textarea",
        size: 12,
        val: cabecera.concepto || "",
        visible: false

      },
      // conceptoNc:{ 
      //   grupoId:"Observaciones", 
      //   id:"concepto_nc", 
      //   label:"Concepto NC",
      //    tipo:"number", 
      //   size:12, 
      //   val:cabecera.concepto_nc || 0
      // },
      // reasonCode:{ 
      //   grupoId:"Observaciones", 
      //   id:"reason_code", 
      //   label:"Reason Code", 
      //   tipo:"text", 
      //   size:6, 
      //   val:cabecera.reason_code || ""
      // },
      // sellorec:{ 
      //   grupoId:"Observaciones", 
      //   id:"sellorec", 
      //   label:"Sellorec", 
      //   tipo:"text", 
      //   size:6, 
      //   val:cabecera.sellorec || ""
      // },

      //detalle
      rubroDetalle: {
        // grupoId: "Detalle",
        id: "rubro_id",
        label: "Rubro",
        tipo: "number",
        val: detalleForm.rubro_id || "",
        size: 4,
        visible: false

      },
      cantidadDetalle: {
        // grupoId: "Detalle",
        id: "cantidad",
        label: "Cantidad",
        tipo: "number",
        val: detalleForm.cantidad || "",
        size: 4,
        visible: false

      },
      valorDetalle: {
        // grupoId: "Detalle",
        id: "valor",
        label: "Valor",
        tipo: "number",
        val: detalleForm.valor || "",
        size: 4,
        visible: false

      },
      saldoDetalle: {
        // grupoId: "Detalle",
        id: "saldo",
        label: "Saldo",
        tipo: "number",
        val: detalleForm.saldo || "",
        size: 4,
        visible: false

      },
      descuentoDetalle: {
        // grupoId: "Detalle",
        id: "descuento",
        label: "Descuento",
        tipo: "number",
        val: detalleForm.descuento || "",
        size: 4,
        visible: false
      },
      fechaDetalle: {
        // grupoId: "Detalle",
        id: "fecha",
        label: "Fecha",
        tipo: "datetime",
        val: detalleForm.fecha || new Date(),
        size: 4,
        visible: false

      },
      descripcionDetalle: {
        // grupoId: "Detalle",
        id: "descripcion",
        label: "Descripción",
        tipo: "textarea",
        val: detalleForm.descripcion || "",
        size: 12,
        visible: false

      },
      impuestoIdDetalle: {
        // grupoId: "Detalle",
        id: "impuesto_id",
        label: "Impuesto ID",
        tipo: "number",
        val: detalleForm.impuesto_id || "",
        size: 3,
        visible: false
      },
      porcentajeImpuestoDetalle: {
        // grupoId: "Detalle",
        id: "porcentaje_impuesto",
        label: "Porcentaje Impuesto (%)",
        tipo: "number",
        val: detalleForm.porcentaje_impuesto || "",
        size: 3,
        visible: false
      },
      estadoIdDetalle: {
        // grupoId: "Detalle",
        id: "estado_id",
        label: "Estado",
        tipo: "number",
        val: detalleForm.estado_id || "",
        size: 3,
        visible: false

      },
      tipoIngresoIdDetalle: {
        // grupoId: "Detalle",
        id: "tipo_ingreso_id",
        label: "Tipo Ingreso ID",
        tipo: "number",
        val: detalleForm.tipo_ingreso_id || "",
        size: 3,
        visible: false,

      },
      bancoIdDetalle: {
        // grupoId: "Detalle",
        id: "banco_id",
        label: "Banco ID",
        tipo: "number",
        val: detalleForm.banco_id || "",
        size: 3,
        visible: false
      },
      cuentaBancariaDetalle: {
        // grupoId: "Detalle",
        id: "cuenta_bancaria",
        label: "Cuenta Bancaria",
        tipo: "text",
        val: detalleForm.cuenta_bancaria || "",
        size: 4,
        visible: false
      },
    }

  }, [cabecera.usuario_id, cabecera.usuario_modificador_id, cabecera.cencos_id, cabecera.empresa_id, cabecera.documentoencabezado_id, cabecera.tipo_documento_id, cabecera.estado_id, cabecera.fecha_documento, cabecera.fecha_emision, cabecera.serie, cabecera.correlativo, cabecera.entidad_id, cabecera.cliente_nombre, cabecera.cliente_direccion, cabecera.cliente_nit, cabecera.valor_total, cabecera.saldo, cabecera.valor_exento, cabecera.importe_exonerado, cabecera.iva_aplica, cabecera.iva_retenido, cabecera.isv_porcentaje, cabecera.isv_val, cabecera.importe_gravado_porcentaje, cabecera.orden_compra_exenta, cabecera.tipo_pago_id, cabecera.moneda_id, cabecera.constancia_registro_exonerado, cabecera.identificativo_registro_sag, cabecera.movimiento_administrativo, cabecera.concepto, cencos.data, empresa.data, tipoDocumento.data, estados.data, entidades.data, tipoPago.data, moneda.data, detalleForm.rubro_id, detalleForm.cantidad, detalleForm.valor, detalleForm.saldo, detalleForm.descuento, detalleForm.fecha, detalleForm.descripcion, detalleForm.impuesto_id, detalleForm.porcentaje_impuesto, detalleForm.estado_id, detalleForm.tipo_ingreso_id, detalleForm.banco_id, detalleForm.cuenta_bancaria]);


  const encabezadosFactura = useMemo(
    () => [
      { id: "cencos_id", field: "cencos_id", label: "Centro Costo", formato: (val) => cencos.data?.find((c) => c.value === val)?.label || val },
      { id: "empresa_id", field: "empresa_id", label: "Empresa", formato: (val) => empresa.data?.find((em) => em.value === val)?.label || val },

      { field: "documentoencabezado_id", label: "Documento Encabezado ID" },
      { field: "tipo_documento_id", label: "Tipo Documento", formato: (val) => tipoDocumento.data?.find((t) => t.value === val)?.label || val },
      { id: "estado_id", field: "estado_id", label: "Estado ID", formato: (val) => estados.data?.find((e) => e.cod_estado === val)?.estado_desc || val },
      { id: "fecha_documento", field: "fecha_documento", label: "Fecha Documento", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
      { id: "fecha_emision", field: "fecha_emision", label: "Fecha Emision", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
      // { id: "fecha_contable", field: "fecha_contable", label: "Fecha Contable" },
      { id: "serie", field: "serie", label: "Serie" },
      { id: "correlativo", field: "correlativo", label: "Correlativo" },
      // { id: "serie_contable", field: "serie_contable", label: "Serie Contable" },
      // { id: "correlativo_contable", field: "correlativo_contable", label: "Correlativo Contable" },
      // { id: "serie_fel", field: "serie_fel", label: "Serie FEL" },
      // { id: "numero_fel", field: "numero_fel", label: "Numero FEL" },
      // { id: "uuid_fel", field: "uuid_fel", label: "UUID FEL" },
      // { id: "talonario", field: "talonario", label: "Talonario" },
      // { id: "numero_corte", field: "numero_corte", label: "Numero Corte" },
      // { id: "modificable", field: "modificable", label: "Modificable" },
      // { id: "factura_juridica", field: "factura_juridica", label: "Factura Juridica" },
      // { id: "movimiento_administrativo_documento", field: "movimiento_administrativo_documento", label: "Movimiento Administrativo Documento" },
      // { id: "liquidaciones_eliminadas", field: "liquidaciones_eliminadas", label: "Liquidaciones Eliminadas" },

      { id: "entidad_id", field: "entidad_id", label: "Nombre Cliente", multilinea: false, formato: (val) => buscarEntidades(val) },
      // { id: "cliente_direccion", field: "cliente_direccion", label: "Direccion Cliente" },
      // { id: "cliente_nit", field: "cliente_nit", label: "Nit Cliente" },
      // { id: "tipo_contribuyente", field: "tipo_contribuyente", label: "Tipo Contribuyente" },
      // { id: "tipo_actividad_economica", field: "tipo_actividad_economica", label: "Tipo Actividad Economica" },
      // { id: "constancia_registro_exonerado", field: "constancia_registro_exonerado", label: "Constancia Registro Exonerado" },
      // { id: "identificativo_registro_sag", field: "identificativo_registro_sag", label: "Identificativo Registro SAG" },

      { id: "valor_total", field: "valor_total", label: "Valor Total" },
      { id: "saldo", field: "saldo", label: "Saldo" },

      //PENDIENTES
      // { id: "total_descuentos", field: "total_descuentos", label: "Total Descuentos" },
      // { id: "valor_exento", field: "valor_exento", label: "Valor Exento" },
      // { id: "importe_exonerado", field: "importe_exonerado", label: "Importe Exonerado" },
      // { id: "iva_aplica", field: "iva_aplica", label: "Aplica IVA", tipo: "boolean" },
      // { id: "iva_retenido", field: "iva_retenido", label: "IVA Retenido" },
      // { id: "isv_porcentaje", field: "isv_porcentaje", label: "ISV Porcentaje" },
      // { id: "isv_val", field: "isv_val", label: "ISV Valor" },
      // { id: "importe_gravado_porcentaje", field: "importe_gravado_porcentaje", label: "Importe Grabado" },
      // { id: "venta_exenta", field: "venta_exenta", label: "Venta Exenta" },

      { id: "tipo_pago_id", field: "tipo_pago_id", label: "Tipo de Pago", formato: (val) => tipoPago.data?.find((t) => t.value === val)?.label || val },
      { id: "moneda_id", field: "moneda_id", label: "Moneda ID", formato: (val) => moneda.data?.find((m) => m.cod_moneda === val)?.nom_moneda || val },
      // { id: "incobrable", field: "incobrable", label: "Incobrable" },
      // { id: "interempresa", field: "interempresa", label: "Interempresa" },

      { id: "concepto", field: "concepto", label: "Concepto" },
      // { id:"concepto_nc", field:"concepto_nc", label:"Concepto NC" },
      // { id:"reason_code", field:"reason_code", label:"Reason Code" },
      // { id:"sellorec", field:"sellorec", label:"Sellorec" },

      { field: "usuario_id", label: "# Usuario", formato: (val) => usuarios?.find((u) => u.cod_usuario === val)?.nom_empleado || val },
      { field: "usuario_modificador_id", label: "Usuario Modificador", formato: (val) => usuarios?.find((u) => u.cod_usuario === val)?.nom_empleado || val },


    ], [cencos.data, empresa.data, tipoDocumento.data, estados.data, entidades.data?.data, tipoPago.data, moneda.data, usuarios, proveedores.data]
  )


  const libreriaInputsFiltro = useMemo(() => {
    return {
      entidad: {
        id: "entidad",
        label: "Entidad",
        tipo: "select",
        val: filtroEntidadSeleccionada || null,
        options: entidades.data != null ? entidades.data.data.map((i) => ({
          ...i,
          label: i.entidad_nombre,
          value: i.entidad_id
        })) : [],
      },
      tipo_documento_id: {
        id: "tipo_documento_id",
        label: "Tipo Documento",
        tipo: "select",
        val: filtroTipoDocumentoSeleccionado || null,
        options: tipoDocumento.data
          ? tipoDocumento.data
            .filter(t => [302, 327, 351].includes(t.value)) // solo factura y nota débito
            .map(t => ({ label: t.label, value: t.value }))
          : [],
      }
    }
  }, [entidades.data, filtroEntidadSeleccionada, tipoDocumento.data, filtroTipoDocumentoSeleccionado]);


  const filtroInput = useMemo(() => {
    return [
      { ...libreriaInputsFiltro.entidad },
      { ...libreriaInputsFiltro.tipo_documento_id },
    ]
  }, [libreriaInputsFiltro]);


  const encabezados = useMemo(
    () => [
      { id: "documentodetalle_id", field: "documentodetalle_id", label: "# Detalle" },
      { id: "rubro_id", field: "rubro_id", label: "Rubro" },
      { id: "cantidad", field: "cantidad", label: "Cantidad" },
      { id: "valor", field: "valor", label: "Valor" },
      // { id: "saldo", field: "saldo", label: "Saldo" },
      // { id: "descuento", field: "descuento", label: "Descuento" },
      { id: "fecha", field: "fecha", label: "Fecha", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
      { id: "descripcion", field: "descripcion", label: "Descripción" },
      // { id: "porcentaje_impuesto", field: "porcentaje_impuesto", label: "% Impuesto" },
      { id: "estado_id", field: "estado_id", label: "Estado", formato: (val) => estados.data?.find((e) => e.cod_estado === val)?.estado_desc || val },
    ],
    [estados.data]
  );

  const inputs2 = useMemo(() => {
    return [
      { ...libreriaInputs.idUsuario },
      { ...libreriaInputs.idUsuarioModificador },
      { ...libreriaInputs.centroCosto },
      { ...libreriaInputs.empresa },

      { ...libreriaInputs.documentoEncabezadoId },
      { ...libreriaInputs.tipoDocumento },
      { ...libreriaInputs.estadoId },
      { ...libreriaInputs.fechaDocumento },
      { ...libreriaInputs.fechaEmision },
      // {...libreriaInputs.fechaContable},
      { ...libreriaInputs.serie },
      { ...libreriaInputs.correlativo },
      // {...libreriaInputs.serieContable},
      // {...libreriaInputs.correlativoContable},
      // {...libreriaInputs.serieFel},
      // {...libreriaInputs.numeroFel},
      // {...libreriaInputs.uuidFel},
      // {...libreriaInputs.talonario},
      // {...libreriaInputs.numeroCorte},
      // {...libreriaInputs.modificable},
      // {...libreriaInputs.facturaJuridica},
      // {...libreriaInputs.movimientoAdministrativoDocumento},
      // {...libreriaInputs.liquidacionesEliminadas},


      { ...libreriaInputs.entidadId },
      { ...libreriaInputs.clienteNombre },
      { ...libreriaInputs.clienteDireccion },
      { ...libreriaInputs.clienteNit },
      // {...libreriaInputs.tipoContribuyente},
      // {...libreriaInputs.tipoActividadEconomica},


      { ...libreriaInputs.valorTotal },
      { ...libreriaInputs.saldo },
      // {...libreriaInputs.totalDescuentos},
      { ...libreriaInputs.valorExento },
      { ...libreriaInputs.importeExonerado },
      { ...libreriaInputs.aplicaIva },
      { ...libreriaInputs.ivaRetenido },
      { ...libreriaInputs.isvPorcentaje },
      { ...libreriaInputs.isvVal },
      { ...libreriaInputs.importeGravado },
      { ...libreriaInputs.ordenCompraExenta },

      { ...libreriaInputs.tipoPagoId },
      { ...libreriaInputs.monedaId },
      // {...libreriaInputs.incobrable},
      // {...libreriaInputs.interEmpresa}, 

      // {...libreriaInputs.ordenCompra},
      // {...libreriaInputs.numeroGuia},
      { ...libreriaInputs.constanciaRegistroExonerado },
      { ...libreriaInputs.identificativoRegistroSAG },
      { ...libreriaInputs.movimientoAdministrativo },
      // {...libreriaInputs.tipoBien},

      { ...libreriaInputs.concepto },
      // {...libreriaInputs.conceptoNc},
      // {...libreriaInputs.reasonCode},
      // {...libreriaInputs.sellorec}

    ]
  }, [libreriaInputs]);

  const inputsDetalle = useMemo(() => {
    return [
      //detalle
      { ...libreriaInputs.rubroDetalle },
      { ...libreriaInputs.cantidadDetalle },
      { ...libreriaInputs.valorDetalle },
      { ...libreriaInputs.saldoDetalle },
      { ...libreriaInputs.descuentoDetalle },
      { ...libreriaInputs.fechaDetalle },
      { ...libreriaInputs.estadoIdDetalle },
      { ...libreriaInputs.descripcionDetalle },
      { ...libreriaInputs.impuestoIdDetalle },
      { ...libreriaInputs.porcentajeImpuestoDetalle },
      { ...libreriaInputs.tipoIngresoIdDetalle },
      { ...libreriaInputs.bancoIdDetalle },
      { ...libreriaInputs.cuentaBancariaDetalle },
    ]
  }, [libreriaInputs]);

  return (
    <Grid container width="100%" pb={5} pl={1}>
      {/* <Grid width="100%">
        <TablaDetallesComponent />
      </Grid> */}

      <Grid width="100%">
        <FormularioComponent
          inputs={filtroInput}
          onInput={onInputFiltro}
          botones={{
            agregar: { visible: false }
          }}
        />
      </Grid>

      <Grid width="100%">

        <TablaEditableComponent
          key={`${filtroEntidadSeleccionada?.value ?? "all"}-${filtroTipoDocumentoSeleccionado?.value ?? "all"}`} // 👈
          rowKey="documentoencabezado_id"
          acciones={{ add: false, view: true, edit: false, delete: false, pdf: true }}
          encabezados={encabezadosFactura}
          grupos={[]}
          data={DocumentosFiltrados}
          eventosDeTabla={{
            view: (id, row) => verFila(id, row),
            edit: (id, row) => verFila(id, row),
            delete: (fila) => anularDocumento(fila)
          }}
          onRowPdf={handleGenerarPdfFactura}
        />
        <FormularioComponent
          grupos={grupos}
          inputs={inputs2}
          onInput={onInput}
          botones={{
            agregar: { texto: "Agregar Factura", visible: false /* !cabecera.documentoencabezado_id, onClick: () => agregar()  */ },
            // actualizar: { texto: "Actualizar Factura", visible: !!cabecera.documentoencabezado_id, onClick: () => actualizar() },
            // limpiar: { texto: "Limpiar", visible: !!cabecera.documentoencabezado_id, onClick: () => setCabecera({}) }
          }}
        />
      </Grid >
      <Grid width="100%">
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Detalles de la Factura #{documentoEncabezadoIdActual}</Typography>
        <FormularioComponent
          grupos={grupos}
          inputs={inputsDetalle}
          onInput={onInputDetalle}
          botones={{
            agregar: {
              texto: detalleForm.documentodetalle_id ? "Actualizar Detalle" : "Agregar Detalle",
              visible: false /* !!documentoEncabezadoIdActual */,
              onClick: agregarDetalleFactura
            },
            limpiar: {
              texto: "Limpiar",
              visible: false /* !!detalleForm.documentodetalle_id */,
              onClick: () => setDetalleForm({})
            }
          }}
        />
        <TablaEditableComponent
          idKey={"documentodetalle_id"}
          acciones={{ add: false, view: true, edit: false, delete: false, pdf: false }}
          encabezados={encabezados}
          grupos={[]}
          data={detalles}
          eventosDeTabla={{
            view: (id, row) => verFilaDetalle(id, row),
            // edit: (id) => editarDetalle(id),
            // delete: (id) => eliminarDetalle(id),
          }}
        />
      </Grid>
      <DialogComponent titulo="Preview" width={"90vw"} open={previewPdf} setOpen={() => setPreviewPdf((v) => !v)}>
        <Button sx={{ width: "100%", mb: 3 }} variant="contained" onClick={funcionDescargaPdf}>
          <Grid container direction="columns" spacing={2} width="100%" justifyContent="center" justifyItems="center" alignItems="center" alignContent="center">
            <Download />
            Descargar
          </Grid>
        </Button>
        <iframe src={`${pdfUri}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="500px" />{" "}
      </DialogComponent>
    </Grid>
  );
};

FormularioFacturacion.propTypes = {};

export default FormularioFacturacion;
