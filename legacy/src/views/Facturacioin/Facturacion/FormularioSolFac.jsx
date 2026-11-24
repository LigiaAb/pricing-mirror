
import { Grid, Button } from '@mui/material';
import React, { Component, useMemo, useState, useEffect, useCallback } from 'react';
import FormularioComponent from '../../../components/Formulario/FormularioComponent';
import SolicitudFacturacion from './SolicitudFacturacion';
import { useFetchCentrosCosto, useFetchEmpresas, useFetchEstados, useFetchMonedas, useFetchTipos } from '../../../hooks/Fetch/useFetchCatalog';
import { useFetchTiposDocumento } from '../../../hooks/Fetch/useFetchEmbarques';
import { useFetchAllEntidadesSimple } from '../../../hooks/Fetch/useFetchEntidades';
import TablaEditableComponent from '../../../components/Tabla/TablaEditableComponent';
import { api } from "../../../api";
import moment from 'moment';

/* eslint-disable react/prop-types */
const FormularioSolFac = ({ data, agrupaciones = [], onInsertarFactura }) => {

    const [formData, setFormData] = useState({})
    const [cabecera, setCabecera] = useState({})
    const [detalleForm, setDetalleForm] = useState({})
    const [detallesTabla, setDetallesTabla] = useState([])
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState([])


    const cencos = useFetchCentrosCosto()
    const empresa = useFetchEmpresas()
    const tipoDocumento = useFetchTipos({ tipo_tabla: "TIPO_DOCUMENTO" })
    const estados = useFetchEstados({ cod_tipo: 328 })
    const moneda = useFetchMonedas()
    const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {})
    const tipoPago = useFetchTipos({ tipo_tabla: "PAGO" })

    // const obtenerCorrelativos = useCallback(async() => {
    //     await api
    //     .get("/api/appweb/lista-correlativos")

    // })


    useEffect(() => {
        if (!data) {
            console.log("FormularioSolFac: data es null/undefined");
            setCabecera({})
            return;
        }

        console.log("FormularioSolFac: data recibido:", data);

        const sim = data.similarDatos || {};
        console.log("FormularioSolFac: similarDatos:", sim);

        // Usar todos los datos del primer documento, no solo los similares
        const nuevaCabecera = {
            ...sim,
            documentoencabezado_id: null,
            tipo_documento_id: { value: sim.tipo_documento_id, label: tipoDocumento.data?.find(t => t.value === sim.tipo_documento_id)?.label || null },
            estado_id: { value: sim.estado_id, label: estados.data?.find(e => e.value === sim.estado_id)?.label || null },
            entidad_id: { ...sim, value: sim.entidad_id, label: entidades.data?.data?.find((e) => e.entidad_id === sim.entidad_id)?.entidad_nombre || null },
            cencos_id: { value: sim.cencos_id, label: cencos.data?.find((c) => c.cod_cc === sim.cencos_id)?.nombre_cc || null },
            empresa_id: { value: sim.empresa_id, label: empresa.data?.find((em) => em.cod_empresa === sim.empresa_id)?.nombre_emp || null },
            moneda_id: { value: sim.moneda_id, label: moneda.data?.find((m) => m.value === sim.moneda_id)?.label || null },
            fecha_documento: sim.fecha_documento ? moment(sim.fecha_documento).toDate() : null,
            tipo_pago_id: { value: sim.tipo_pago_id, label: tipoPago.data?.find((p) => p.value === sim.tipo_pago_id)?.label || null },

            saldo: parseFloat(Number(data.total || sim.valor_total || 0).toFixed(2)),
            valor_total: parseFloat(Number(data.total || sim.valor_total || 0).toFixed(2)),
        };

        console.log("FormularioSolFac: nuevaCabecera:", nuevaCabecera);

        setCabecera(nuevaCabecera);
        setDetallesTabla(data.detalles || []);
        // Guardar los documentos seleccionados para mostrar en la tabla
        setDocumentosSeleccionados(sim.documentosSeleccionados || []);
    }, [data,  tipoDocumento.data, estados.data, entidades.data, cencos.data, empresa.data, moneda.data, tipoPago.data]);




    const grupos = useMemo(() => {

        const borderWidth = 1,
            borderStyle = "doted";

        return [
            { id: "Datos Generales", label: "Datos Generales", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Datos Documento", label: "Datos de Documento", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Datos Cliente", label: "Datos del Cliente", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Montos y Tributos", label: "Montos y Tributos", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Forma de Pago", label: "Forma de Pago", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Observaciones", label: "Observaciones", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Administrativo y Operativo", label: "Administrativo y Operativo", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
            { id: "Detalle", label: "Detalle", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" },
        ]
    }, [])




    const libreriaInputs = useMemo(() => {
        return {
            idUsuario: {
                // grupoId: "Datos Documento",
                id: "usuario_id",
                label: "ID Usuario",
                tipo: "number",
                size: 4,
                val: cabecera.usuario_id || null,
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
                id: "tipo_documento_id",
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

            //Datos cliente
            entidadId: {
                grupoId: "Datos Cliente",
                id: "entidad_id",
                label: "Cliente",
                tipo: "select",
                size: 6,
                options: entidades.data != null ? entidades.data.data.map((i) => {
                    return { ...i, label: i.entidad_nombre, value: i.entidad_id }
                }) : [],
                val: cabecera.entidad_id || null,
                readonly: true

            },
            clienteNombre: {
                grupoId: "Datos Cliente",
                id: "cliente_nombre",
                label: "Nombre Cliente",
                tipo: "text",
                size: 6,
                readonly: false,
                val: cabecera.cliente_nombre,
                visible: false
            },
            clienteDireccion: {
                grupoId: "Datos Cliente",
                id: "cliente_direccion",
                label: "Direccion Cliente",
                tipo: "text",
                size: 8,
                readonly: true,
                val: cabecera.cliente_direccion || "",

            },
            clienteNit: {
                grupoId: "Datos Cliente",
                id: "cliente_nit",
                label: "Nit Cliente",
                tipo: "text",
                size: 4,
                readonly: true,
                val: cabecera.cliente_nit || ""
            },

            //Montos y tributos
            valorTotal: {
                grupoId: "Montos y Tributos",
                id: "valor_total",
                label: "Valor Total",
                tipo: "number",
                size: 4,
                readonly: true,
                val: cabecera.valor_total || 0
            },
            saldo: {
                grupoId: "Montos y Tributos",
                id: "saldo",
                label: "Saldo",
                tipo: "number",
                size: 4,
                // visible:true,
                val: cabecera.saldo || 0,
                readonly: true

            },

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
                grupoId: "Forma de Pago",
                id: "tipo_pago_id",
                label: "Tipo de Pago",
                tipo: "select",
                size: 6,
                readonly: true,
                options: tipoPago.data || [],
                val: cabecera.tipo_pago_id || null
            },
            monedaId: {
                grupoId: "Forma de Pago",
                id: "moneda_id",
                label: "Moneda ID",
                tipo: "select",
                size: 6,
                options: moneda.data || [],
                val: cabecera.moneda_id || null,
                readonly: true

            },

            constanciaRegistroExonerado: {
                // grupoId: "Administrativo y Operativo",
                id: "constancia_registro_exonerado",
                label: "Constancia de Registro Exonerado",
                tipo: "text",
                size: 4,
                readonly: true,
                val: cabecera.constancia_registro_exonerado || "",
                visible: false
            },
            identificativoRegistroSAG: {
                // grupoId: "Administrativo y Operativo",
                id: "identificativo_registro_sag",
                label: "Identificacion de Restro SAG",
                tipo: "text",
                size: 4,
                readonly: true,
                val: cabecera.identificativo_registro_sag || "",
                visible: false
            },
            movimientoAdministrativo: {
                // grupoId: "Administrativo y Operativo",
                id: "movimiento_administrativo",
                label: "Movimiento Administrativo",
                tipo: "toggle",
                size: "auto",
                readonly: true,
                val: cabecera.movimiento_administrativo ?? false,
                visible: false
            },

            //Observaciones
            concepto: {
                grupoId: "Observaciones",
                id: "concepto",
                label: "Concepto",
                tipo: "textarea",
                size: 12,
                val: cabecera.concepto || ""
            },

            //detalle
            // rubroDetalle: {
            //     grupoId: "Detalle",
            //     id: "rubro_id",
            //     label: "Rubro",
            //     tipo: "number",
            //     val: detalleForm.rubro_id || "",
            //     size: 4
            // },
            // cantidadDetalle: {
            //     grupoId: "Detalle",
            //     id: "cantidad",
            //     label: "Cantidad",
            //     tipo: "number",
            //     val: detalleForm.cantidad || "",
            //     size: 4
            // },
            // valorDetalle: {
            //     grupoId: "Detalle",
            //     id: "valor",
            //     label: "Valor",
            //     tipo: "number",
            //     val: detalleForm.valor || "",
            //     size: 4
            // },
            // saldoDetalle: {
            //     grupoId: "Detalle",
            //     id: "saldo",
            //     label: "Saldo",
            //     tipo: "number",
            //     val: detalleForm.saldo || "",
            //     size: 4
            // },
            // descuentoDetalle: {
            //     grupoId: "Detalle",
            //     id: "descuento",
            //     label: "Descuento",
            //     tipo: "number",
            //     val: detalleForm.descuento || "",
            //     size: 4
            // },
            // fechaDetalle: {
            //     grupoId: "Detalle",
            //     id: "fecha",
            //     label: "Fecha",
            //     tipo: "datetime",
            //     val: detalleForm.fecha || new Date(),
            //     size: 4
            // },
            // descripcionDetalle: {
            //     grupoId: "Detalle",
            //     id: "descripcion",
            //     label: "Descripción",
            //     tipo: "textarea",
            //     val: detalleForm.descripcion || "",
            //     size: 12
            // },
            // impuestoIdDetalle: {
            //     grupoId: "Detalle",
            //     id: "impuesto_id",
            //     label: "Impuesto ID",
            //     tipo: "number",
            //     val: detalleForm.impuesto_id || "",
            //     size: 3
            // },
            // porcentajeImpuestoDetalle: {
            //     grupoId: "Detalle",
            //     id: "porcentaje_impuesto",
            //     label: "Porcentaje Impuesto (%)",
            //     tipo: "number",
            //     val: detalleForm.porcentaje_impuesto || "",
            //     size: 3
            // },
            // estadoIdDetalle: {
            //     grupoId: "Detalle",
            //     id: "estado_id",
            //     label: "Estado",
            //     tipo: "number",
            //     val: detalleForm.estado_id || "",
            //     size: 3
            // },
            // tipoIngresoIdDetalle: {
            //     grupoId: "Detalle",
            //     id: "tipo_ingreso_id",
            //     label: "Tipo Ingreso ID",
            //     tipo: "number",
            //     val: detalleForm.tipo_ingreso_id || "",
            //     size: 3
            // },
            // bancoIdDetalle: {
            //     grupoId: "Detalle",
            //     id: "banco_id",
            //     label: "Banco ID",
            //     tipo: "number",
            //     val: detalleForm.banco_id || "",
            //     size: 3
            // },
            // cuentaBancariaDetalle: {
            //     grupoId: "Detalle",
            //     id: "cuenta_bancaria",
            //     label: "Cuenta Bancaria",
            //     tipo: "text",
            //     val: detalleForm.cuenta_bancaria || "",
            //     size: 4
            // },

        }
    }, [cabecera, cencos, empresa, tipoDocumento, estados, moneda, entidades, tipoPago])

    const inputs = useMemo(() => {

        return Object.values(libreriaInputs)

    }, [libreriaInputs])

    const encabezadosDocumentos = useMemo(() => [
        { id: "documentoencabezado_id", label: "Codigo", field: "documentoencabezado_id" },
        { id: "fecha_creacion", label: "Fecha", field: "fecha_creacion", formato: (val) => val ? new Date(val).toLocaleDateString('es-ES') : '' },
        { id: "entidad_id", label: "Cliente", field: "entidad_id" },
        { id: "valor_total", label: "Valor Total", field: "valor_total" },
    ], [])

    const encabezadosDetalles = useMemo(() => [
        { id: "documentodetalle_id", label: "# Detalle", field: "documentodetalle_id" },
        { id: "descripcion", label: "Descripcion", field: "descripcion" },
        { id: "valor", label: "Valor", field: "valor" },
    ], [])

    const detallesTablaConAcciones = useMemo(() => {
        return detallesTabla.map(d => ({ ...d, accionesDeTabla: { auth: false } }));
    }, [detallesTabla])

    const onInput = ({ id, val }) => {
        setCabecera(prev => ({
            ...prev,
            [id]: val
        }));
    }

    return (

        <>

            <Grid sx={{ width: '100%', overflow: 'hidden' }}>
                <FormularioComponent
                    grupos={grupos}
                    inputs={inputs}
                    onInput={onInput}
                    botones={{
                        agregar: {
                            visible: true,
                            onClick: () => {
                                agrupaciones.forEach(grupo => onInsertarFactura(grupo, cabecera))
                            },
                        },

                    }}
                />
            </Grid>


            <Grid sx={{ width: '100%', overflow: 'auto' }}>
                <TablaEditableComponent
                    titulo="Detalles Importados"
                    rowKey="documentodetalle_id"
                    data={detallesTablaConAcciones}
                    encabezados={encabezadosDetalles}
                    acciones={{ view: false, delete: false }}
                />
            </Grid>
        </>

    );


}

export default FormularioSolFac;