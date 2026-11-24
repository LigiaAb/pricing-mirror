import FormularioComponent from '@/components/Formulario/FormularioComponent';
import TablaEditableComponent from '@/components/Tabla/TablaEditableComponent';
import { useFetchAllEntidadesSimple } from '@/hooks/Fetch/useFetchEntidades';
import PropTypes from "prop-types";
import { Box, Button, Grid, Icon, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from "../../../api";
import { useSelector } from 'react-redux';
import moment from 'moment';
import DialogComponent from '@/components/Dialog/DialogComponent';
import SolicitudFacturacion from './SolicitudFacturacion';
import { useFetchEstados, useFetchMonedas, useFetchTipos } from '@/hooks/Bpm';
import { ContinuousColorLegend } from '@mui/x-charts';
import { Download } from 'lucide-react';
import AcordeonComponent2 from '@/components/AcordeonComponent/AcordeonComponent2';


const SolicitudOrdenCompra = ({ tipo = "oc" }) => {

    const { currentCentroCosto, currentEmpresa, currentPais } = useSelector((state) => state.menu);

    const [filtroProveedorSeleccionado, setFiltroProveedorSeleccionado] = useState(null)

    const [entidad, setEntidad] = useState(null)
    const [crearDocumento, setCrearDocumento] = useState([])
    const [rubroSeleccionado, setRubroSeleccionado] = useState([])
    const [rubroGuardado, setRubroGuardado] = useState([])
    const [agrupacionesGuardadas, setAgrupacionesGuardadas] = useState([])
    const [rubroGrupoReferencia, setRubroGrupoReferencia] = useState(null)
    const [openDialogRubro, setOpenDialogRubro] = useState(false)
    const [rubroActivo, setRubroActivo] = useState(null)
    const [montoFacturar, setMontoFacturar] = useState("")
    const [concepto, setConcepto] = useState("")
    const [documentos, setDocumentos] = useState([]);
    const [openDialogConfirmar, setOpenDialogConfirmar] = useState(false);
    const [documentoAConfirmar, setDocumentoAConfirmar] = useState(null);

    const [abrirSolicitudesOC, setAbrirSolicitudesOC] = useState(false)
    const toggleLock = React.useRef(false)
    const handleAbrirSolicitudesOC = useCallback(() => {
        if (toggleLock.current) {
            toggleLock.current = false
            return
        }
        toggleLock.current = true
        setAbrirSolicitudesOC(prev => !prev)
    }, [])

    //PDF
    const [pdfUri, setPdfUri] = useState(null);
    const [funcionDescargaPdf, setFuncionDescargaPdf] = useState(() => { });
    const [previewPdf, setPreviewPdf] = useState(false);


    const proveedor = useFetchAllEntidadesSimple(["clientes"], { cod_tipo: 1, tipo_entidad: "proveedor" })
    const tipoDocumento = useFetchTipos({ tipo_tabla: "TIPO_DOCUMENTO" });
    const tipoPago = useFetchTipos({ tipo_tabla: "PAGO" });
    const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});

    const estados = useFetchEstados({ cod_tipo: 328 }, {})
    const monedas = useFetchMonedas();


    const preOrdenCompra = useCallback(async (id) => {
        const response = await api.get("/api/appweb/listar-documento-preordencompra", { params: { entidad_id: id.value } })
        // console.log("pre orden de compra", response.data);
        // console.log("id enviado",id.value)
        const data = response?.data?.data || response?.data || [];
        setCrearDocumento(Array.isArray(data) ? data : []);

        console.log("data", data);
    }, [])

    console.log("entidades", entidades)
    const codPais = currentPais.cod_pais;


    const obtenerDocumentos = useCallback(async (entidad_id) => {
        try {
            const response = await api.get("/api/appweb/lista-documento-encabezado");
            console.log("Documentos obtenidos del servidor:", response.data);
            setDocumentos(response.data?.data || response.data || []);
        } catch (error) {
            console.error("Error al obtener documentos:", error);
        }
    }, []);

    console.log("documentos", documentos)

    const DocumentoProcesados = useMemo(() => {
        if (tipo === "oc") {
            return documentos
                .filter(e => e.tipo_documento_id === 354 && [76, 79/* , 80 */].includes(e.estado_id))
                .map(e => {
                    const estaEnGrupo = agrupacionesGuardadas.some(grupo => grupo.documentos.includes(e.documentoencabezado_id));
                    return {
                        ...e,
                        tipo_documento_id: tipoDocumento.data?.filter((t) => t.value === e.tipo_documento_id)?.label || e.tipo_documento_id,
                        // accionesDeTabla: {
                        //     auth: !documentoSeleccionado.some(a => a.documentoencabezado_id === e.documentoencabezado_id) && !estaEnGrupo
                        // },
                        valor_total: documentos.reduce((acc, r) => (r.documentoencabezado_id === e.documentoencabezado_id) ? acc += r.valor_total : acc, 0)
                    };
                })
        }
    }, [documentos, tipo, agrupacionesGuardadas, tipoDocumento.data])

    //   useEffect(() => {
    //       if(entidades.data?.isPending)entidades.refetch();
    //   },[entidades.data])

    console.log("entidades", entidades)
    useEffect(() => {
        obtenerDocumentos()
    }, [obtenerDocumentos, tipo])

    useEffect(() => {
        // console.log("Estado cabecera actualizado:", cabecera);
        return () => {
            if (pdfUri) URL.revokeObjectURL(pdfUri);
        };
    }, [pdfUri]);


    const RubrosProcesados = useMemo(() => {

        if (tipo === "oc") {

            return crearDocumento
                .map(e => {
                    const estaEnGrupo = rubroGuardado.some(grupo => grupo.crearDocumento.includes(e.emb_gasto_id))
                    return {
                        ...e,
                        accionesDeTabla: {
                            auth: !rubroSeleccionado.some(a => a.emb_gasto_id === e.emb_gasto_id) && !estaEnGrupo
                        },
                        saldo_costo: crearDocumento.reduce((acc, r) => (r.emb_gasto_id === e.emb_gasto_id) ? acc += r.saldo_costo : acc, 0)
                    }
                })
        }
    }, [tipo, crearDocumento, rubroSeleccionado, rubroGuardado])

    const listaFiltrada = useMemo(() => {
        if (!filtroProveedorSeleccionado) {
            return RubrosProcesados || [];
        }
        return RubrosProcesados?.filter(r => r.entidad_id_proveedor === filtroProveedorSeleccionado.value) || []
    }, [filtroProveedorSeleccionado, RubrosProcesados])

    const rubroSeleccionadoProcesado = useMemo(() => {
        return rubroSeleccionado.map(d => ({ ...d, accionesDeTabla: { auth: false } }))
    }, [rubroSeleccionado])

    const rubrosGuardadosProcesado = useMemo(() => {
        return rubroGuardado.map(d => ({ ...d, accionesDeTabla: { auth: false } }))
    }, [rubroGuardado])


    const seleccionarRubros = useCallback((id, row) => {

        const { accionesDeTabla, ...rowLimpio } = row;

        if (rubroSeleccionado.length === 0) {

            if (rubrosGuardadosProcesado.length > 0) {
                const proveedorRubroGuardado = rubrosGuardadosProcesado[0]?.similarDatos?.entidad_proveedor_id;
                if (proveedorRubroGuardado && rowLimpio.entidad_proveedor_id !== proveedorRubroGuardado) {
                    const nombreProveedor = proveedor.data?.data?.find(p => p.value === rowLimpio.entidad_proveedor_id)?.label ?? rowLimpio.entidad_proveedor_id;
                    alert(`No se puede seleccionar este rubro por diferente proveedor ${nombreProveedor}`)
                    return;
                }
            }

            setRubroGrupoReferencia({
                entidad_proveedor_id: rowLimpio.entidad_proveedor_id
            })

        } else {
            const mismoProveedor = rowLimpio.entidad_proveedor_id === rubroGrupoReferencia?.entidad_proveedor_id;

            if (!mismoProveedor) {
                alert(`No se puede agrupar por este proveedor`)
                return;
            }

        }

        setRubroActivo(rowLimpio);
        setMontoFacturar(rowLimpio.saldo_costo || "");
        setOpenDialogRubro(true);

        // const nuevoRubroSeleccionado = [...rubroSeleccionado, rowLimpio];
        // setRubroSeleccionado(nuevoRubroSeleccionado);

    }, [rubrosGuardadosProcesado, rubroSeleccionado, rubroGrupoReferencia, proveedor.data])

    console.log("grupos", rubroSeleccionado)

    const insertarSolicitudOC = useCallback(async () => {

        const rubros = rubroSeleccionado.map(r => ({
            emb_gasto_ids: r.emb_gasto_id,
            monto_oc: Number(r.pago),
            embarque_id: r.embarque_id
        }))

        try {

            const response = await api.post("/api/appweb/insertar-documento-solicitud-ordencompra", {
                entidad_id: filtroProveedorSeleccionado.value,
                cod_empresa: currentEmpresa.cod_empresa,
                cod_cc: currentCentroCosto.cod_cc,
                concepto: concepto,
                rubros
            })

            console.log("Respuesta", response.data)
            setRubroSeleccionado([]);
            setRubroGrupoReferencia(null);
            setConcepto("");

            await obtenerDocumentos()

            if (filtroProveedorSeleccionado) {
                await preOrdenCompra(filtroProveedorSeleccionado);
            }

        } catch (error) {
            console.error(error);
            alert("Error al guardar")
        }
    }, [rubroSeleccionado, filtroProveedorSeleccionado, currentCentroCosto?.cod_cc, currentEmpresa?.cod_empresa, obtenerDocumentos, preOrdenCompra, concepto])


    const handleGenerarPdf = useCallback(async (documentoencabezado_id, row) => {

        const docId = documentoencabezado_id ?? row?.documentoencabezado_id;
        // console.log("generar pdf para documentoencabezado_id:", documentoencabezado_id);

        try {
            const response = await api.post("/api/appweb/generar-pdf-ordencompra", { documentoencabezado_id: docId, codPais: codPais });
            // console.log("Respuesta pdf ", response.data)
            const nombreArchivo = `factura_${docId}.pdf`;


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
        } catch (error) {
            console.error("Error al generar PDF:", error);
        }

    }, [])

    const handleAbrirConfirmarOc = useCallback(async (documentoencabezado_id, row) => {
        setDocumentoAConfirmar({ documentoencabezado_id, row });
        setOpenDialogConfirmar(true);
    }, [])

    const confirmarOc = useCallback(async () => {
        if (!documentoAConfirmar) return;
        try {
            const idDocumento = documentoAConfirmar.documentoencabezado_id;
            const response = await api.post("/api/appweb/insertar-documento-ordencompra", { documentoencabezado_id: idDocumento })

            console.log("Respuesta al confirmar OC", response.data);

            setOpenDialogConfirmar(false);
            setDocumentoAConfirmar(null);
            await obtenerDocumentos()
        } catch (error) {
            console.error("Error al confirmar OC", error);
            alert("Error al confirmar OC")
        }
    }, [documentoAConfirmar, obtenerDocumentos])

    const libreriaInputsFiltro = useMemo(() => {
        return {
            entidad: {
                id: "entidad_id",
                label: "Proveedor",
                tipo: "select",
                val: filtroProveedorSeleccionado,
                options: proveedor.data != null ? proveedor.data?.data?.map((e) => ({ label: e.label, value: e.value })) : []
            }
        }
    }, [proveedor.data, filtroProveedorSeleccionado])

    const filtroInput = useMemo(() => ([
        { ...libreriaInputsFiltro.entidad }
    ]), [libreriaInputsFiltro])


    const encabezados = useMemo(
        () => [
            { field: "emb_gasto_id", label: "Id Gasto" },
            { field: "rubro_nombre", label: "Nombre Rubro" },
            { field: "cod_file", label: "File Embarque" },
            // { field: "entidad_proveedor_nombre", label: "Proveedor" },
            { field: "fecha_creacion", label: "Fecha", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
            { field: "embgasto_costo_rubro", label: "Valor costo" },
            { field: "saldo_costo", label: "Saldo" },
            { field: "entidad_cliente_nombre", label: "Cliente" }
        ],
        []);

    const encabezadosDocumentos = useMemo(
        () => [
            { field: "documentoencabezado_id", label: "# Documento" },
            { field: "fecha_creacion", label: "Fecha", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
            { field: "entidad_id", label: "Cliente", formato: (val) => proveedor.data?.data?.find((e) => e.entidad_id === val)?.entidad_nombre || val },
            { field: "tipo_documento_id", label: "Tipo Documento", formato: (val) => tipoDocumento.data?.find((t) => t.value === val)?.label || val },
            // { field: "embarque_id_file", label: "File Embarque", },
            { field: "tipo_pago_id", label: "Tipo Pago", formato: (val) => tipoPago.data?.find((t) => t.value === val)?.label || val },
            { field: "estado_id", label: "Estado", formato: (val) => estados.data?.find((e) => e.cod_estado === val)?.estado_desc || val },
            { field: "moneda_id", label: "Moneda", formato: (val) => monedas.data?.find((m) => m.cod_moneda === val)?.nom_moneda || val },
            { field: "saldo", label: "Saldo", formato: (valor) => (valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
            { field: "valor_total", label: "Valor Total", formato: (valor) => (valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
            { field: "concepto", label: "Concepto" }

        ], [entidades.data?.data, estados.data, monedas.data, tipoPago.data]
    )

    console.log("tipo estados", monedas.data)



    return (
        <>
            <Grid>
                <Grid>
                    <FormularioComponent
                        inputs={filtroInput}
                        onInput={({ id, val }) => {
                            if (id === "entidad_id") {

                                const cambioProvedor = filtroProveedorSeleccionado?.value !== val?.value;

                                if (cambioProvedor) {
                                    setRubroSeleccionado([]);
                                    setRubroGrupoReferencia(null);
                                    setRubroActivo(null);
                                    setMontoFacturar("");
                                }

                                setFiltroProveedorSeleccionado(val);
                                preOrdenCompra(val);
                            }
                        }}
                        botones={{
                            agregar: { visible: false }
                        }}
                    />
                </Grid>
                <Grid sx={{ mt: 2 }}>
                    <TablaEditableComponent
                        titulo="Crear Solicitud de OC"
                        rowKey="emb_gasto_id"
                        encabezados={encabezados}
                        data={listaFiltrada}
                        acciones={{ auth: true }}
                        eventosDeTabla={{
                            auth: (id, row) => seleccionarRubros(id, row)
                        }}
                    />
                </Grid>

                <DialogComponent
                    openDialog={openDialogRubro}
                    handleClose={() => setOpenDialogRubro(false)}
                    tipo="alert"
                    titulo={'Facturar Rubro'}
                    content={
                        rubroActivo && (
                            <Grid sx={{ mt: 2 }}>

                                <Grid sx={{ mb: 3 }}>
                                    <h3>Detalle del Rubro</h3>
                                    <TablaEditableComponent
                                        titulo="Rubro"
                                        rowKey="emb_gasto_id"
                                        data={[rubroActivo]}
                                        encabezados={[
                                            { field: "emb_gasto_id", label: "Id Gasto" },
                                            { field: "rubro_nombre", label: "Nombre Rubro" },
                                            { field: "cod_file", label: "File Embarque" },
                                            { field: "embgasto_costo_rubro", label: "Valor costo" },
                                            { field: "saldo_costo", label: "Saldo" },
                                        ]}
                                        acciones={{ view: false, delete: false }}
                                    />
                                </Grid>
                                <Grid>
                                    <h3>Monto a Facturar</h3>
                                    <FormularioComponent
                                        inputs={[
                                            {
                                                id: "monto",
                                                label: "Monto",
                                                tipo: "number",
                                                val: montoFacturar
                                            }
                                        ]}
                                        onInput={({ id, val }) => {
                                            if (id === "monto") {
                                                if (val > rubroActivo?.saldo_costo) {
                                                    alert("No puede ser mayor al saldo");
                                                    return;
                                                }
                                                setMontoFacturar(val);

                                            }
                                        }}
                                        botones={{
                                            agregar: {
                                                visible: true,
                                                onClick: () => {
                                                    const rubroConPago = {
                                                        ...rubroActivo,
                                                        pago: montoFacturar
                                                    }

                                                    setRubroSeleccionado(prev => [...prev, rubroConPago])

                                                    setOpenDialogRubro(false);
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        )
                    }
                />

                <Grid sx={{ mt: 3 }}>
                    <TablaEditableComponent
                        titulo="Rubro Seleccionado"
                        rowKey="emb_gasto_id"
                        data={rubroSeleccionado}
                        encabezados={[
                            { field: "emb_gasto_id", label: "Id Gasto" },
                            { field: "rubro_nombre", label: "Nombre Rubro" },
                            { field: "cod_file", label: " FIle" },
                            { field: "embgasto_costo_rubro", label: "Valor" },
                            { field: "saldo_costo", label: "Saldo" },
                            { field: "pago", label: "Pago" }
                        ]}
                    />
                </Grid>
                <Grid sx={{ mt: 2 }}>
                    <FormularioComponent
                        inputs={[
                            {
                                id: "concepto",
                                label: "Concepto",
                                tipo: "textarea",
                                val: concepto,
                                size: "12"
                            }
                        ]}
                        onInput={({ id, val }) => {
                            if (id === "concepto") setConcepto(val);
                        }}
                        botones={{
                            agregar: { visible: false }
                        }}
                    />
                </Grid>

                <Grid sx={{ mt: 2 }}>
                    <Button variant="contained"
                        color="primary"
                        onClick={insertarSolicitudOC}
                        disabled={rubroSeleccionado.length === 0 || !concepto?.trim()}
                    >
                        Crear Solicitud OC
                    </Button>
                </Grid>

                <Grid sx={{ mt: 3 }}>
                    <AcordeonComponent2
                        expandido={abrirSolicitudesOC}
                        expandir={handleAbrirSolicitudesOC}
                        titulo={
                            <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
                                <Typography variant="h6">SOLICITUDES OC</Typography>
                                <Icon className={abrirSolicitudesOC ? "c-arriba-simple" : "c-abajo-simple"} />
                            </Box>
                        }
                    >
                        <TablaEditableComponent
                            titulo="Solicitudes OC"
                            rowKey="documentoencabezado_id"
                            encabezados={encabezadosDocumentos}
                            data={DocumentoProcesados}
                            acciones={{ pdf: true, auth: true }}
                            eventosDeTabla={{
                                auth: (id, row) => handleAbrirConfirmarOc(id, row)
                            }}
                            onRowPdf={handleGenerarPdf}
                        />


                    </AcordeonComponent2>

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

                <DialogComponent
                    openDialog={openDialogConfirmar}
                    handleClose={() => setOpenDialogConfirmar(false)}
                    tipo="alert"
                    titulo={'Confirma Solicitud de Orden de Compra'}
                    content={
                        <Grid sx={{ mt: 2 }}>
                            <h2>¿Está seguro que desea confirmar la Solicitud OC como Orden de Compra?</h2>
                            <Grid sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "center" }}>
                                <Button
                                    variant='contained'
                                    color="error"
                                    onClick={() => {
                                        setOpenDialogConfirmar(false);
                                        setDocumentoAConfirmar(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant='contained'
                                    color="primary"
                                    onClick={confirmarOc}
                                >
                                    Confirmar
                                </Button>
                            </Grid>
                        </Grid>
                    }
                >

                </DialogComponent>


            </Grid>
        </>
    )
}

SolicitudOrdenCompra.propTypes = { tipo: PropTypes.string }

export default SolicitudOrdenCompra