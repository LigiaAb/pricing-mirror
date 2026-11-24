import { Button, Grid } from "@mui/material";
import PropTypes from "prop-types";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useFetchAllEntidades, useFetchAllEntidadesSimple } from "../../../hooks/Fetch/useFetchEntidades";
import { useFetchEstados, useFetchMonedas, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
import { api } from "../../../api";
import { use } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import { set } from "date-fns";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import { useFetchTiposDocumento } from "../../../hooks/Fetch/useFetchEmbarques";
import FormularioFacturacion from "./FormularioFacturacion";
import FormularioSolFac from "./FormularioSolFac";



const SolicitudFacturacion = ({ tipo = "fa" }) => {

    const { currentCentroCosto, currentEmpresa, currentPais } = useSelector((state) => state.menu)
    const { cod_usuario } = useSelector((state) => state.auth);
    // const [embarques, setEmbarques] = useState([]);

    const [agrupacionesGuardadas, setAgrupacionesGuardadas] = useState([]);

    const [filtroEntidadSeleccionada, setFiltroEntidadSeleccionada] = useState(null);
    const [filtroMonedaSeleccionado, setFiltroMonedaSeleccionado] = useState(null);
    const [firltroEstadoSeleccionado, setFiltroEstadoSeleccionado] = useState(null);
    const [documentoSeleccionado, setDocumentoSeleccionado] = useState([]);
    const [grupoReferencia, setGrupoReferencia] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [detalleDocumento, setDetalleDocumento] = useState([]);
    const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false);
    const [dialogDetalleVerOpen, setDialogDetalleVerOpen] = useState(false);
    const [detalleVer, setDetalleVer] = useState([])
    const [detalleSeleccionado, setDetalleSeleccionado] = useState([]);
    const [documentoPadreActual, setDocumentoPadreActual] = useState(null);
    const [grupoActual, setGrupoActual] = useState(null);
    const [dialogGrupoDetalleOpen, setDialogGrupoDetalleOpen] = useState(false);
    const [rubrosComunesDocumentos, setRubrosComunesDocumentos] = useState({});
    const [detallesDocumentos, setDetallesDocumentos] = useState({});
    const [dialogFormularioSolFac, setDialogFormularioSolFac] = useState(false);

    const [coordinacion, setEmbarques] = useState([])

    // Estados para alertas
    const [mostrarAlertaMoneda, setMostrarAlertaMoneda] = useState(false);
    const [mostrarAlertaAgrupar, setMostrarAlertaAgrupar] = useState(false);
    const [mostrarAlertaNoDocs, setMostrarAlertaNoDocs] = useState(false);
    const [mostrarAlertaNoGrupo, setMostrarAlertaNoGrupo] = useState(false);
    const [mostrarAlertaErrorFactura, setMostrarAlertaErrorFactura] = useState(false);
    const [mensajeErrorFactura, setMensajeErrorFactura] = useState("");
    const [mensajeAlertaMoneda, setMensajeAlertaMoneda] = useState("");
    const [mostrarAlertaFaltaDetalle, setMostrarAlertaFaltaDetalle] = useState(false);



    const tipoDocumento = useFetchTipos({ tipo_tabla: "TIPO_DOCUMENTO" });
    const tipoPago = useFetchTipos({ tipo_tabla: "PAGO" });
    const entidades = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});
    const estados = useFetchEstados({ cod_tipo: 328 }, {})
    const monedas = useFetchMonedas();


    // console.log("estados", estados.data);
    // console.log("entidades.data", entidades.data);
    // // console.log("fechaSalida", fechaSalida);
    // console.log("solicitud", solicitud);    
    // console.log("usuario",cod_usuario)


    const obtenerDocumentos = useCallback(async (entidad_id) => {
        try {
            const response = await api.get("/api/appweb/lista-documento-encabezado");
            console.log("Documentos obtenidos del servidor:", response.data);
            setDocumentos(response.data?.data || response.data || []);
        } catch (error) {
            console.error("Error al obtener documentos:", error);
        }
    }, []);


    // console.log("documentos", documentos);

    const obtenerDetalleDocumento = useCallback(async (documentoencabezado_id) => {
        try {
            const response = await api.get("/api/appweb/lista-documento-detalle", { params: { documentoencabezado_id } });
            console.log("Detalle del documento obtenido del servidor:", response.data);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error("Error al obtener detalle del documento:", error);
            return [];
        }
    }, []);

    // console.log("detalles documento", detalleDocumento)

    // const obtenerRelacion = useCallback(async () => {
    //     try {
    //         const response = await api.get("/api/appweb/lista-documento-relacion", { params: { documentoencabezado_id: documentoPadreActual?.documentoencabezado_id } });
    //         console.log("Relaciones obtenidas del servidor:", response.data);
    //         return response.data?.data || response.data || [];
    //     } catch (error) {
    //         console.error("Error al obtener relaciones:", error);
    //         return [];
    //     }
    // }, [documentoPadreActual?.documentoencabezado_id]);

    const agruparPorGrupo = useCallback((detalles) => {
        // Contar cuántos detalles hay por grupo
        const conteoGrupos = detalles.reduce((acc, d) => {
            const grupo = d.grupo || d.GRUPO;
            if (grupo) acc[grupo] = (acc[grupo] || 0) + 1;
            return acc;
        }, {});

        const agrupado = {};

        detalles.forEach(d => {
            const grupo = d.grupo || d.GRUPO;
            const esGrupoCompartido = grupo && conteoGrupos[grupo] > 1;

            if (!esGrupoCompartido) {
                // Sin grupo o grupo único: fila individual con descripción del rubro
                agrupado[`solo_${d.documentodetalle_id}`] = {
                    ...d,
                    descripcion: d.descripcion,
                    _detallesOriginales: null
                };
            } else {
                // Grupo compartido: fusionar y mostrar nombre del grupo
                if (!agrupado[grupo]) {
                    agrupado[grupo] = {
                        ...d,
                        descripcion: grupo,
                        valor: 0,
                        saldo: 0,
                        _detallesOriginales: []
                    };
                }
                agrupado[grupo].valor += Number(d.valor || d.VALOR || 0);
                agrupado[grupo].saldo += Number(d.saldo || d.SALDO || 0);
                agrupado[grupo]._detallesOriginales.push(d);
            }
        });

        return Object.values(agrupado);
    }, [])

    const verDetalle = useCallback(async (id, row) => {
        const detalle = await obtenerDetalleDocumento(row.documentoencabezado_id);
        // Guardar documento padre para asociar detalles
        setDocumentoPadreActual(row);
        const detallePendiente = detalle.filter(d => d.estado_id === 76);
        const agrupado = agruparPorGrupo(detallePendiente);
        setDetalleDocumento(agrupado);
        setDialogDetalleOpen(true);
    }, [obtenerDetalleDocumento, setDocumentoPadreActual, setDetalleDocumento, setDialogDetalleOpen, agruparPorGrupo]);



    const verDetalleSoloLectura = useCallback(async (id, row) => {
        const detalle = await obtenerDetalleDocumento(row.documentoencabezado_id);
        const detallePendiente = detalle.filter(d => d.estado_id === 76);
        const agrupado = agruparPorGrupo(detallePendiente);
        setDetalleVer(agrupado);
        setDialogDetalleVerOpen(true);
    }, [obtenerDetalleDocumento, agruparPorGrupo]);




    const seleccionarDetalle = useCallback((id, row) => {

        // console.log("ROW SELECCIONADO:", {
        //     documentodetalle_id: row.documentodetalle_id,
        //     rubro_id: row.rubro_id,
        //     descripcion: row.descripcion,
        //     grupo: row.grupo,
        //     GRUPO: row.GRUPO,
        //     _detallesOriginales: row._detallesOriginales,
        // });

        // console.log("DETALLES OTROS DOCS:",
        //     Object.entries(detallesDocumentos).map(([docId, detalles]) => ({
        //         docId,
        //         detalles: detalles.map(d => ({
        //             documentodetalle_id: d.documentodetalle_id,
        //             rubro_id: d.rubro_id,
        //             descripcion: d.descripcion,
        //             grupo: d.grupo,
        //             GRUPO: d.GRUPO,
        //         }))
        //     }))
        // );

        let nuevoDetalleSeleccionado;

        if (row._detallesOriginales) {
            // ES GRUPO FUSIONADO
            const yaExiste = detalleSeleccionado.some(
                ds => ds.documentodetalle_id === row._detallesOriginales[0].documentodetalle_id
            );
            if (yaExiste) return;

            const fusionado = {
                ...row._detallesOriginales[0],
                descripcion: row.descripcion,
                valor: row._detallesOriginales.reduce((acc, d) => acc + Number(d.valor || 0), 0),
                saldo: row._detallesOriginales.reduce((acc, d) => acc + Number(d.saldo || 0), 0),
                documentoencabezado_id_padre: documentoPadreActual.documentoencabezado_id,
                _detallesOriginales: row._detallesOriginales
            };
            nuevoDetalleSeleccionado = [...detalleSeleccionado, fusionado];

            if (documentoSeleccionado.length >= 2) {
                const otrosDocumentos = documentoSeleccionado.filter(
                    d => d.documentoencabezado_id !== documentoPadreActual.documentoencabezado_id
                );

                otrosDocumentos.forEach(doc => {
                    const detallesOtroDoc = detallesDocumentos[doc.documentoencabezado_id] || [];
                    const grupoNombre = row.descripcion;

                    // 👇 Contar cuántos detalles tienen ese grupo en el otro doc
                    const detallesMismoGrupo = detallesOtroDoc.filter(detalle => {
                        const grupoDetalle = detalle.grupo || detalle.GRUPO;
                        return grupoDetalle === grupoNombre && Number(detalle.estado_id) === 76;
                    });

                    // 👇 Solo agregar si en el otro doc también es un grupo compartido (más de 1)
                    if (detallesMismoGrupo.length > 1 &&
                        !nuevoDetalleSeleccionado.some(ds => ds.documentodetalle_id === detallesMismoGrupo[0].documentodetalle_id)
                    ) {
                        nuevoDetalleSeleccionado.push({
                            ...detallesMismoGrupo[0],
                            descripcion: grupoNombre,
                            valor: detallesMismoGrupo.reduce((acc, d) => acc + Number(d.valor || 0), 0),
                            saldo: detallesMismoGrupo.reduce((acc, d) => acc + Number(d.saldo || 0), 0),
                            documentoencabezado_id_padre: doc.documentoencabezado_id,
                            _detallesOriginales: detallesMismoGrupo
                        });
                    }
                });
            }

        } else {
            // ES RUBRO INDIVIDUAL — sin grupo o grupo único
            if (detalleSeleccionado.some(ds => ds.documentodetalle_id === row.documentodetalle_id)) return;

            nuevoDetalleSeleccionado = [...detalleSeleccionado, {
                ...row,
                documentoencabezado_id_padre: documentoPadreActual.documentoencabezado_id
            }];

            if (documentoSeleccionado.length >= 2) {
                const otrosDocumentos = documentoSeleccionado.filter(
                    d => d.documentoencabezado_id !== documentoPadreActual.documentoencabezado_id
                );

                otrosDocumentos.forEach(doc => {
                    const detallesOtroDoc = detallesDocumentos[doc.documentoencabezado_id] || [];

                    detallesOtroDoc
                        .filter(detalle => {
                            const grupoDetalle = detalle.grupo || detalle.GRUPO;

                            // El detalle del otro doc debe ser también individual (sin grupo o grupo único)
                            const cantidadMismoGrupoEnOtroDoc = grupoDetalle
                                ? detallesOtroDoc.filter(d => (d.grupo || d.GRUPO) === grupoDetalle).length
                                : 0;
                            const esIndividualEnOtroDoc = cantidadMismoGrupoEnOtroDoc <= 1;

                            // El row actual también debe ser individual
                            const grupoDelRow = row.grupo || row.GRUPO;
                            const cantidadMismoGrupoEnDocActual = grupoDelRow
                                ? (detallesDocumentos[documentoPadreActual.documentoencabezado_id] || [])
                                    .filter(d => (d.grupo || d.GRUPO) === grupoDelRow).length
                                : 0;
                            const esIndividualEnDocActual = cantidadMismoGrupoEnDocActual <= 1;

                            return detalle.rubro_id === row.rubro_id &&
                                esIndividualEnOtroDoc &&
                                esIndividualEnDocActual && // 👈 ambos deben ser individuales
                                Number(detalle.estado_id) === 76 &&
                                !nuevoDetalleSeleccionado.some(
                                    ds => ds.documentodetalle_id === detalle.documentodetalle_id
                                );
                        })
                        .forEach(detalle => {
                            nuevoDetalleSeleccionado.push({
                                ...detalle,
                                documentoencabezado_id_padre: doc.documentoencabezado_id
                            });
                        });
                });
            }
        }

        setDetalleSeleccionado(nuevoDetalleSeleccionado);

    }, [detalleSeleccionado, documentoPadreActual, documentoSeleccionado, detallesDocumentos]);

    const deseleccionarDetalle = useCallback((id, row) => {
        // Si es grupo fusionado, quitar todos sus originales
        if (row._detallesOriginales && row._detallesOriginales.length > 0) {
            const idsOriginales = new Set(row._detallesOriginales.map(d => d.documentodetalle_id));
            setDetalleSeleccionado(prev => prev.filter(ds => !idsOriginales.has(ds.documentodetalle_id)));
        } else {
            // Es individual
            setDetalleSeleccionado(prev => prev.filter(ds => ds.documentodetalle_id !== row.documentodetalle_id));
        }
    }, []);



    // Filtrar detalles: mostrar solo los no seleccionados, pero mantener la fila con auth desactivado
    const detallesFiltrados = useMemo(() => {
        return detalleDocumento.map(d => ({
            ...d,
            accionesDeTabla: {
                auth: !detalleSeleccionado.some(ds => ds.documentodetalle_id === d.documentodetalle_id),
                delete: detalleSeleccionado.some(ds => ds.documentodetalle_id === d.documentodetalle_id)

            }
        }));
    }, [detalleDocumento, detalleSeleccionado]);



    const DocumentosProcesados = useMemo(() => {
        if (tipo === "fa") {
            return documentos
                .filter(e => e.tipo_documento_id === 325 && [76, 79, 80].includes(e.estado_id))
                .map(e => {
                    const estaEnGrupo = agrupacionesGuardadas.some(grupo => grupo.documentos.includes(e.documentoencabezado_id));
                    return {
                        ...e,
                        tipo_documento_id: tipoDocumento.data?.filter((t) => t.value === e.tipo_documento_id)?.label || e.tipo_documento_id,
                        accionesDeTabla: {
                            auth: !documentoSeleccionado.some(a => a.documentoencabezado_id === e.documentoencabezado_id) && !estaEnGrupo
                        },
                        valor_total: documentos.reduce((acc, r) => (r.documentoencabezado_id === e.documentoencabezado_id) ? acc += r.valor_total : acc, 0)
                    };
                });
        } else if (tipo === "nd") {
            return documentos
                .filter(e => e.tipo_documento_id === 326 && [76, 79, 80].includes(e.estado_id))

                .map(e => {
                    const estaEnGrupo = agrupacionesGuardadas.some(grupo => grupo.documentos.includes(e.documentoencabezado_id));
                    const monedaGruposGuardados = agrupacionesGuardadas[0]?.similarDatos?.moneda_id;
                    const monedaIncompatible = monedaGruposGuardados
                        ? e.moneda_id !== monedaGruposGuardados
                        : false;
                    return {
                        ...e,
                        tipo_documento_id: tipoDocumento.data?.filter((t) => t.value === e.tipo_documento_id)?.label || e.tipo_documento_id,
                        accionesDeTabla: {
                            auth: !documentoSeleccionado.some(a => a.documentoencabezado_id === e.documentoencabezado_id) && !estaEnGrupo && !monedaIncompatible
                        },
                        valor_total: documentos.reduce((acc, r) => (r.documentoencabezado_id === e.documentoencabezado_id) ? acc += r.valor_total : acc, 0)
                    };
                });
        }
    }, [tipo, documentos, agrupacionesGuardadas, tipoDocumento.data, documentoSeleccionado]);

    const listaFiltrada = useMemo(() => {
        if (!filtroEntidadSeleccionada && !filtroMonedaSeleccionado && !firltroEstadoSeleccionado) {
            return DocumentosProcesados;
        }
        return DocumentosProcesados?.filter((i) => {
            const matchEntidad = filtroEntidadSeleccionada ? i.entidad_id === filtroEntidadSeleccionada.value : true;
            const matchMoneda = filtroMonedaSeleccionado ? i.moneda_id === filtroMonedaSeleccionado.value : true;
            const matchEstado = firltroEstadoSeleccionado ? i.estado_id === firltroEstadoSeleccionado.value : true;
            return matchEntidad && matchMoneda && matchEstado;
        });
    }, [DocumentosProcesados, filtroEntidadSeleccionada, filtroMonedaSeleccionado, firltroEstadoSeleccionado])

    const documentoSeleccionadoProcesado = useMemo(() => {
        return documentoSeleccionado.map(d => ({ ...d, accionesDeTabla: { auth: false } }));
    }, [documentoSeleccionado]);

    const agrupacionesGuardadasProcesada = useMemo(() => {
        return agrupacionesGuardadas.map(d => ({ ...d, accionesDeTabla: { auth: false } }));
    }, [agrupacionesGuardadas]);

    const detallesSeleccionadosProcesado = useMemo(() => {
        return (grupoActual?.detalles || []).map(d => ({ ...d, accionesDeTabla: { auth: false } }));
    }, [grupoActual?.detalles]);

    const documentosEnGrupoProcesado = useMemo(() => {
        return documentos.filter(d => grupoActual?.documentos.includes(d.documentoencabezado_id)).map(d => ({ ...d, accionesDeTabla: { auth: false } }));
    }, [documentos, grupoActual?.documentos]);


    const manejarAgrupacion = useCallback((id, row) => {
        // Limpiar la propiedad accionesDeTabla del objeto
        const { accionesDeTabla, ...rowLimpio } = row;

        if (documentoSeleccionado.length === 0) {

            if (agrupacionesGuardadas.length > 0) {
                const monedaGruposGuardados = agrupacionesGuardadas[0]?.similarDatos?.moneda_id;
                if (monedaGruposGuardados && rowLimpio.moneda_id !== monedaGruposGuardados) {
                    const nombreMonedaDoc = monedas.data?.find(m => m.value === rowLimpio.moneda_id)?.label ?? rowLimpio.moneda_id;
                    const nombreMonedaGrupo = monedas.data?.find(m => m.value === monedaGruposGuardados)?.label ?? monedaGruposGuardados;
                    setMensajeAlertaMoneda(`No se puede seleccionar este documento.\nMoneda del documento: ${nombreMonedaDoc}\nMoneda de los grupos guardados: ${nombreMonedaGrupo}`);
                    setMostrarAlertaMoneda(true);
                    return;
                }
            }

            setDocumentoSeleccionado([rowLimpio]);
            setGrupoReferencia({
                entidad_id: rowLimpio.entidad_id,
                tipo_pago_id: rowLimpio.tipo_pago_id,
                moneda_id: rowLimpio.moneda_id,
            })
            return;
        }

        const mismaEntidad = rowLimpio.entidad_id === grupoReferencia?.entidad_id;
        const mismoTipoPago = rowLimpio.tipo_pago_id === grupoReferencia?.tipo_pago_id;
        const mismaMoneda = rowLimpio.moneda_id === grupoReferencia?.moneda_id;

        if (!mismaEntidad || !mismoTipoPago || !mismaMoneda) {
            setMostrarAlertaAgrupar(true);
            return;
        }

        const nuevoDocumentoSeleccionado = [...documentoSeleccionado, rowLimpio];
        setDocumentoSeleccionado(nuevoDocumentoSeleccionado);
        // Los rubros comunes se cargarán automáticamente por el useEffect
    }, [agrupacionesGuardadas, documentoSeleccionado, grupoReferencia, monedas.data]);

    const cargarDetallesDocumentos = useCallback(async (documentos) => {
        const detalles = {};
        const rubrosComunesMap = {};

        try {
            // Cargar detalles de cada documento
            for (const doc of documentos) {
                const detallesDoc = await obtenerDetalleDocumento(doc.documentoencabezado_id);
                detalles[doc.documentoencabezado_id] = detallesDoc || [];
            }

            // Identificar rubros comunes entre todos los documentos
            if (documentos.length >= 2) {
                const rubrosPorDocumento = Object.values(detalles).map(detallesList =>
                    new Set(detallesList.map(d => d.rubro_id || d.documentodetalle_id || d.estado_id))
                );

                // Encontrar la intersección de rubros
                let rubrosComunesSet = new Set(rubrosPorDocumento[0] || []);
                for (let i = 1; i < rubrosPorDocumento.length; i++) {
                    rubrosComunesSet = new Set(
                        [...rubrosComunesSet].filter(r => rubrosPorDocumento[i].has(r))
                    );
                }

                // Crear mapeo de rubros comunes por documento
                documentos.forEach(doc => {
                    rubrosComunesMap[doc.documentoencabezado_id] = Array.from(rubrosComunesSet);
                });
            }

            setDetallesDocumentos(detalles);
            setRubrosComunesDocumentos(rubrosComunesMap);
        } catch (error) {
            console.error("Error al cargar detalles de documentos:", error);
        }
    }, [obtenerDetalleDocumento]);



    const quitarAgrupacion = (row) => {

        const nuevaLista = documentoSeleccionado.filter(
            e => e.documentoencabezado_id !== row.documentoencabezado_id
        );

        setDocumentoSeleccionado(nuevaLista);

        // Limpiar detalles seleccionados asociados a este documento
        const nuevoDetalleSeleccionado = detalleSeleccionado.filter(
            d => d.documentoencabezado_id_padre !== row.documentoencabezado_id
        );
        setDetalleSeleccionado(nuevoDetalleSeleccionado);

        // Si ya no queda ninguno, limpiamos referencia y rubros comunes
        if (nuevaLista.length === 0) {
            setGrupoReferencia(null);
            setRubrosComunesDocumentos({});
            setDetallesDocumentos({});
        } else if (nuevaLista.length === 1) {
            // Si queda solo un documento, no hay rubros comunes
            setRubrosComunesDocumentos({});
        } else {
            // Recargar rubros comunes con los documentos restantes
            cargarDetallesDocumentos(nuevaLista);
        }
    };

    const guardarGrupo = () => {
        if (documentoSeleccionado.length === 0) {
            setMostrarAlertaNoDocs(true);
            return;
        }

        // Verificar que cada documento seleccionado tenga al menos un detalle seleccionado
        const documentosSinDetalle = documentoSeleccionado.filter(doc =>
            !detalleSeleccionado.some(det => det.documentoencabezado_id_padre === doc.documentoencabezado_id)
        );

        if (documentosSinDetalle.length > 0) {
            setMostrarAlertaFaltaDetalle(true);
            return;
        }

        // Calcular el total sumando los valores de los detalles seleccionados
        const totalDetalles = detalleSeleccionado.reduce((acc, detalle) => {
            return acc + (parseFloat(Number(detalle.valor).toFixed(2)) || 0);
        }, 0).toFixed(2);

        // También incluir el valor total de los documentos como alternativa
        const totalDocumentos = documentoSeleccionado.reduce((acc, e) => acc + (e.valor_total || 0), 0);

        // Crear datos similares con información de todos los documentos seleccionados
        const datosSimilares = {
            documentosSeleccionados: documentoSeleccionado,
            // Usar datos del primer documento como base
            ...(documentoSeleccionado[0] || {}),
            totalDetalles,
            totalDocumentos,
            cantidadDocumentos: documentoSeleccionado.length
        };

        const nuevoGrupo = {
            grupo_id: Date.now(),
            entidad_id: grupoReferencia.entidad_id,
            tipo_pago_id: grupoReferencia.tipo_pago_id,
            documentos: documentoSeleccionado.map(e => e.documentoencabezado_id),
            detalles: detalleSeleccionado,
            total: totalDetalles > 0 ? totalDetalles : totalDocumentos, // Usar suma de detalles si hay, sino suma de documentos
            totalDocumentos: totalDocumentos,
            totalDetalles: totalDetalles,
            similarDatos: datosSimilares,
            documentosOrigen: documentoSeleccionado
        };

        setAgrupacionesGuardadas([...agrupacionesGuardadas, nuevoGrupo]);
        // Enviar el grupo creado al formulario para edición inmediata
        setGrupoActual(nuevoGrupo);
        // console.log("Grupo guardado:", nuevoGrupo);

        // Limpiar selección para permitir crear nuevos grupos
        setDocumentoSeleccionado([]);
        setDetalleSeleccionado([]);
        setGrupoReferencia(null);

    }

    const verDetallesGrupo = useCallback((id, row) => {
        setGrupoActual(row);
        setDialogGrupoDetalleOpen(true);
    }, []);    // const verFila = (id, row) => {
    //     setEmbarques({
    //         ...row,
    //         fecha_creacion: moment(row.fecha_creacion).toDate(),
    //         entidad_id_cli: row.entidad_id_cli,
    //     })
    // }

    useEffect(() => {
        obtenerDocumentos()
        setAgrupacionesGuardadas([]);
        setDocumentoSeleccionado([]);
        setDetalleSeleccionado([]);
        setGrupoReferencia(null);
        setGrupoActual(null);
        setDetalleDocumento([]);
        setDetallesDocumentos({});
        setRubrosComunesDocumentos({});
        setFiltroEntidadSeleccionada(null);
        // setFiltroTipoPagoSeleccionado(null);
        setFiltroMonedaSeleccionado(null)
        setFiltroEstadoSeleccionado(null);
        // verDetallesGrupo(null, null);
    }, [obtenerDocumentos, tipo])

    // Cargar detalles cuando cambien los documentos seleccionados
    useEffect(() => {
        if (documentoSeleccionado.length >= 2) {
            cargarDetallesDocumentos(documentoSeleccionado);
        } else if (documentoSeleccionado.length === 0) {
            setDetallesDocumentos({});
            setRubrosComunesDocumentos({});
        }
    }, [documentoSeleccionado, cargarDetallesDocumentos])

    // console.log("coordinacion", embarques);
    // console.log("rubros", rubros);

    const eliminarSolicitud = useCallback(async (documentoencabezado_id) => {
        await api.post("/api/appweb/cambio-estado-documento-encabezado", { documentoencabezado_id: documentoencabezado_id, estado_id: 4 });
        await obtenerDocumentos()
    },
        [obtenerDocumentos],
    )

    //     console.log("PARAMS:", {
    //   cod_empresa: currentEmpresa?.cod_empresa,
    //   cod_cc: currentCentroCosto?.cod_cc
    // });

    const obtenerCoordinaciones = useCallback(async () => {
        if (!currentEmpresa?.cod_empresa || !currentCentroCosto?.cod_cc) {
            console.log("Aún no hay empresa o centro de costo");
            return [];
        }

        const { data } = await api.get("/api/appweb/lista-coordinacion", {
            params: {
                cod_empresa: currentEmpresa.cod_empresa,
                cod_cc: currentCentroCosto.cod_cc
            }
        });

        console.log("RESPUESTA COORDINACIONES:", data);

        return data?.data.data || data || [];
    }, [currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc]);


    const insertarFactura = useCallback(async (grupo, cabecera) => {
        if (!grupo || !grupo.similarDatos) {
            setMostrarAlertaNoGrupo(true);
            return;
        }

        try {

            //para el saldo en cualquier cosa

            const tipoDocumentoId = tipo === "nd" ? 327 : 302;

            const saldoTotalRubros = grupo.detalles.reduce((acc, d) => Number(d.valor || 0), 0)


            const nuevoDocumento = {
                // documentoencabezado_id: null,
                tipo_documento_id: tipoDocumentoId, // Tipo Factura
                entidad_id: Number(cabecera.entidad_id.value || cabecera.entidad_id),
                cliente_nombre: cabecera.cliente_nombre,
                cliente_nit: cabecera.cliente_nit,
                cliente_direccion: cabecera.cliente_direccion,
                estado_id: 80,
                fecha_documento: cabecera.fecha_documento || new Date(),
                fecha_emision: cabecera.fecha_emision || new Date(),
                serie: null,
                correlativo: null,
                cencos_id: Number(cabecera.cencos_id?.value || cabecera.cencos_id),
                empresa_id: Number(cabecera.empresa_id?.value || cabecera.empresa_id),
                moneda_id: Number(cabecera.moneda_id?.value || cabecera.moneda_id),
                tipo_pago_id: Number(cabecera.tipo_pago_id?.value || cabecera.tipo_pago_id),
                valor_total: parseFloat(Number(grupo.total)).toFixed(2),
                saldo: parseFloat(Number(grupo.total)).toFixed(2),
                concepto: cabecera.concepto,
                usuario_modificador_id: Number(cod_usuario),
                usuario_id: Number(cod_usuario),
            };

            // Insertar el nuevo documento Factura
            const responseFactura = await api.post("/api/appweb/insertar-documento-encabezado", nuevoDocumento);
            // console.log("Factura creada:", responseFactura.data.data);

            const nuevoId = responseFactura.data.data.documentoencabezado_id;
            console.log("id nuevo", nuevoId);


            // console.log("FILES:", grupo.documentosOrigen.map(d => d.embarque_id_file));

            const coordinaciones = await obtenerCoordinaciones();
            console.log("COORDINACIONES:", coordinaciones);

            const embarquesIds = [
                ...new Set(
                    grupo.documentosOrigen
                        .map(doc => doc.embarque_id_file)
                        .filter(file => file)
                        .flatMap(file =>
                            coordinaciones
                                .filter(c => c.cod_file === file)
                                .map(c => c.embarque_id)
                        )
                )
            ];
            // console.log("EMBARQUES IDS:", embarquesIds);

            await Promise.all(
                embarquesIds.map(embarque_id =>
                    api.post("/api/appweb/insertar-documento-coordinacion", {
                        documentoencabezado_id: nuevoId,
                        embarque_id: embarque_id,
                        estado_id: nuevoDocumento.estado_id,
                        rubro_id: null
                    })
                )
            )



            const facturados = grupo.detalles || [];



            const detallesAgrupados = facturados.reduce((acc, item) => {

                const clave = (item.descripcion || "").trim().toLowerCase();

                if (!acc[clave]) {
                    acc[clave] = {
                        documentoencabezado_id: Number(nuevoId), // Se asignará después de crear la factura
                        rubro_id: Number(item.rubro_id),
                        descripcion: item.descripcion,
                        valor: 0,
                        saldo: 0,
                        fecha: new Date(),
                        estado_id: 80,
                        // tipo_ingreso_id: Number(d.tipo_ingreso_id),
                        cantidad: 0,

                    }
                }

                acc[clave].valor += Number(item.valor);
                acc[clave].saldo += Number(item.valor);
                acc[clave].cantidad += Number(item.cantidad || 1)

                return acc;

            }, {})

            const detallesFact = Object.values(detallesAgrupados).map(d => ({
                ...d,
                valor: Number(d.valor.toFixed(2)),
                saldo: Number(d.saldo.toFixed(2)),
            }));;

            // const detallesFact = facturados.map(d => ({
            //     // documentodetalle_id: null, // Auto-generado
            //     documentoencabezado_id: Number(nuevoId), // Se asignará después de crear la factura
            //     rubro_id: Number(d.rubro_id),
            //     descripcion: d.descripcion,
            //     valor: Number(d.valor),
            //     saldo: Number(d.valor),
            //     fecha: new Date(),
            //     estado_id: Number(d.estado_id),
            //     // tipo_ingreso_id: Number(d.tipo_ingreso_id),
            //     cantidad: Number(d.cantidad || 1),
            // }));



            const responseFacturaDetalle = await api.post("/api/appweb/insertar-documento-detalle-masivo", { detalles: detallesFact });

            // // DEBUG TEMPORAL
            // console.log("=== DEBUG FILEXRUBRO ===");
            // console.log("grupo.detalles:", JSON.stringify(grupo.detalles, null, 2));
            // console.log("grupo.documentosOrigen:", JSON.stringify(grupo.documentosOrigen, null, 2));

            // grupo.detalles.forEach(d => {
            //     console.log({
            //         descripcion: d.descripcion,
            //         rubro_id: d.rubro_id,
            //         documentoencabezado_id_padre: d.documentoencabezado_id_padre,
            //         documentoencabezado_id: d.documentoencabezado_id, // <-- ¿viene este también?
            //         _detallesOriginales: d._detallesOriginales?.length
            //     });
            // });
            // console.log("Detalles de factura creados:", responseFacturaDetalle.data.data);

            const embarquesPayload = grupo.documentosOrigen
                .filter(docOrigen => docOrigen.embarque_id_file)
                .map(docOrigen => {

                    //expandimos los detalles originales si es grupo fusionado
                    const detallesDeEsteDoc = grupo.detalles
                        .filter(d => d.documentoencabezado_id_padre === docOrigen.documentoencabezado_id)
                        .flatMap(d => d._detallesOriginales && d._detallesOriginales.length > 0
                            ? d._detallesOriginales
                            : [d]
                        );

                    const rubrosIds = [...new Set(detallesDeEsteDoc.map(d => Number(d.rubro_id)))]

                    return {
                        file: docOrigen.embarque_id_file,
                        rubros: rubrosIds
                    };
                });

            await api.post("/api/appweb/insertar-documento-filexrubro", {
                documentoencabezado_id: nuevoId,
                embarques: embarquesPayload
            })

            const detallesExpandidos = grupo.detalles.flatMap(detalle => {
                // Si tiene detalles originales (es grupo fusionado), usa esos
                if (detalle._detallesOriginales && detalle._detallesOriginales.length > 0) {
                    return detalle._detallesOriginales;
                }
                // Si es individual, usa el detalle tal cual
                return [detalle];
            });


            await Promise.all(
                detallesExpandidos.map(detalle =>
                    api.post("/api/appweb/actualizar-documento-detalle", {
                        documentodetalle_id: Number(detalle.documentodetalle_id),
                        documentoencabezado_id: Number(detalle.documentoencabezado_id),
                        rubro_id: Number(detalle.rubro_id),
                        valor: Number(detalle.valor),
                        saldo: Number(detalle.saldo),
                        fecha: detalle.fecha,
                        estado_id: 80
                    })
                )
            )

            const documentosAfectados = [
                ...new Set(grupo.detalles.map(d => d.documentoencabezado_id))
            ];

            const idsDetallesFacturados = new Set(
                grupo.detalles.flatMap(d => {
                    if (d._detallesOriginales && d._detallesOriginales.length > 0) {
                        return d._detallesOriginales.map(orig => Number(orig.documentodetalle_id));
                    }
                    return [Number(d.documentodetalle_id)];
                })
            )


            await Promise.all(
                documentosAfectados.map(async (docId) => {

                    const documentoOriginal = grupo.documentosOrigen.find(
                        d => Number(d.documentoencabezado_id) === Number(docId)
                    );

                    if (!documentoOriginal) {
                        // console.log("No se encontro documento", docId)
                        return;
                    }

                    const todosLosDetalles = await obtenerDetalleDocumento(docId);

                    const quedanPendientes = todosLosDetalles.some(
                        d => Number(d.estado_id) === 76 && !idsDetallesFacturados.has(Number(d.documentodetalle_id))
                    );

                    const estadoFinal = quedanPendientes ? 79 : 80;

                    const valorFacturadoDoc = grupo.detalles
                        .filter(d => Number(d.documentoencabezado_id) === Number(docId))
                        .reduce((acc, d) => acc + Number(d.valor || 0), 0);

                    const nuevoValorTotal = parseFloat(Number(documentoOriginal.valor_total)).toFixed(2);
                    const nuevoSaldo = parseFloat((Number(documentoOriginal.saldo) - valorFacturadoDoc).toFixed(2));


                    // console.log(`Documento ${docId}: quedan pendientes=${quedanPendientes} -> estado =${estadoFinal}`);

                    return api.post("/api/appweb/actualizar-documento-encabezado", {
                        documentoencabezado_id: documentoOriginal.documentoencabezado_id,
                        correlativo: documentoOriginal.correlativo,
                        serie: documentoOriginal.serie,
                        tipo_documento_id: documentoOriginal.tipo_documento_id,
                        valor_total: nuevoValorTotal,
                        saldo: nuevoSaldo,
                        entidad_id: documentoOriginal.entidad_id,
                        moneda_id: documentoOriginal.moneda_id,
                        tipo_pago_id: documentoOriginal.tipo_pago_id,
                        usuario_id: Number(cod_usuario),
                        usuario_modificador_id: Number(cod_usuario),
                        empresa_id: documentoOriginal.empresa_id,
                        cencos_id: documentoOriginal.cencos_id,
                        estado_id: Number(estadoFinal)
                    })

                })

            )

            // console.log("Documentos actualizados a estado parcialmente facturado");

            // Recargar documentos después de crear la factura
            await obtenerDocumentos();

            // alert("Factura creada exitosamente y documentos actualizados");

            // Limpiar selección
            setDocumentoSeleccionado([]);
            setDetalleSeleccionado([]);
            setGrupoActual(null);
            setGrupoReferencia(null);
            setAgrupacionesGuardadas([]);
            setDetallesDocumentos({});
            setRubrosComunesDocumentos({});
            setFiltroEntidadSeleccionada(null);
            setFiltroMonedaSeleccionado(null);
            setFiltroEstadoSeleccionado(null);
            setDialogFormularioSolFac(false)

        } catch (error) {
            console.error("Error al insertar factura:", error);
            setMensajeErrorFactura("Error al crear la factura: " + error.message);
            setMostrarAlertaErrorFactura(true);
        }
    }, [cod_usuario, obtenerDetalleDocumento, obtenerDocumentos, tipo]);


    const encabezados = useMemo(
        () => [

            // { field: "embarque_id", label: "ID" },
            { field: "documentoencabezado_id", label: "# Documento" },
            { field: "fecha_creacion", label: "Fecha", formato: (val) => (moment(val).isValid() ? moment(val).format("DD-MM-YYYY HH:mm") : "") },
            { field: "entidad_id", label: "Cliente", formato: (val) => entidades.data?.data?.find((e) => e.entidad_id === val)?.entidad_nombre || val },
            // { field: "tipo_documento_id", label: "Tipo Documento", formato: (val) => tipoDocumento.data?.find((t) => t.value === val)?.label || val },
            { field: "embarque_id_file", label: "File Embarque", },
            { field: "tipo_pago_id", label: "Tipo Pago", formato: (val) => tipoPago.data?.find((t) => t.value === val)?.label || val },
            { field: "estado_id", label: "Estado", formato: (val) => estados.data?.find((e) => e.cod_estado === val)?.estado_desc || val },
            { field: "moneda_id", label: "Moneda", formato: (val) => monedas.data?.find((m) => m.cod_moneda === val)?.nom_moneda || val },
            { field: "saldo", label: "Saldo", formato: (valor) => (valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
            { field: "valor_total", label: "Valor Total", formato: (valor) => (valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },

        ],
        [entidades.data?.data, estados.data, monedas.data, tipoPago.data]
    );


    const libreriaInputsFiltro = useMemo(() => {
        return {
            entidad: {
                id: "entidad",
                label: "Entidad", tipo: "select", val: filtroEntidadSeleccionada || "",
                options: entidades.data != null ? entidades.data.data.map((i) => {
                    return { ...i, label: i.entidad_nombre, value: i.entidad_id }
                }) : [],
            },
            moneda_id: {
                id: "moneda_id",
                label: "Moneda",
                tipo: "select",
                val: filtroMonedaSeleccionado || null,
                options: monedas.data ? monedas.data.map((t) => ({ label: t.label, value: t.value })) : [],
            },
            estado: {
                id: "estado_id",
                label: "Estado", tipo: "select", val: firltroEstadoSeleccionado || "",
                options: estados.data ? estados.data.map((e) => ({ label: e.label, value: e.value })) : []
            }
        }
    }, [filtroEntidadSeleccionada, entidades.data, filtroMonedaSeleccionado, monedas.data, firltroEstadoSeleccionado, estados.data])





    const filtroInput = useMemo(() => {
        return [
            { ...libreriaInputsFiltro.entidad },
            // { ...libreriaInputsFiltro.moneda_id },
            { ...libreriaInputsFiltro.estado }
        ]
    }, [libreriaInputsFiltro])


    const mostrarFormularioFacturar = () => {
        setDialogFormularioSolFac(true);
    }


    return (
        <>
            <Grid>
                {/* {tipo} */}
                <Grid>
                    <FormularioComponent
                        inputs={filtroInput}
                        onInput={({ id, val }) => {
                            // console.log("Filtro seleccionado:", { id, val });
                            if (id === "entidad") {
                                setFiltroEntidadSeleccionada(val);
                            }
                            if (id === "moneda_id") {
                                setFiltroMonedaSeleccionado(val);
                            }
                            if (id === "estado_id") {
                                setFiltroEstadoSeleccionado(val);
                            }
                        }}
                        botones={{
                            agregar: { visible: false }
                        }}
                    />
                </Grid>
                <Grid sx={{ mt: 2 }}>
                    <TablaEditableComponent
                        titulo="Documentos"
                        rowKey="documentoencabezado_id"
                        data={listaFiltrada}
                        encabezados={encabezados}
                        acciones={{ view: true, auth: true, delete: false }} //delete es eliminar solicitud, auth es agregar a agrupacion
                        // onRowAuth={}
                        eventosDeTabla={{
                            view: (id, row) => verDetalleSoloLectura(id, row),
                            auth: (id, row) => manejarAgrupacion(id, row),
                            delete: (fila) => eliminarSolicitud(fila)
                        }}
                    />

                    <DialogComponent
                        openDialog={dialogDetalleVerOpen}
                        handleClose={() => setDialogDetalleVerOpen(false)}
                        tipo="alert"
                        title="Detalle del Documento"
                        content={
                            <Grid sx={{ mt: 2 }}>
                                <TablaEditableComponent
                                    titulo="Detalles"
                                    rowKey="documentodetalle_id"
                                    data={detalleVer}
                                    encabezados={[
                                        { field: "documentodetalle_id", label: "ID Detalle" },
                                        { field: "documentoencabezado_id", label: "ID Encabezado" },
                                        { field: "descripcion", label: "Concepto" },
                                        { field: "valor", label: "Valor Unitario" },
                                    ]}
                                // acciones={{ view: false, delete: false, auth: false }}
                                // eventosDeTabla={{
                                //     auth: (id, row) => seleccionarDetalle(id, row),
                                // }}
                                />
                            </Grid>
                        }
                        cancelar={() => setDialogDetalleVerOpen(false)}
                    />


                    <DialogComponent
                        openDialog={dialogDetalleOpen}
                        handleClose={() => setDialogDetalleOpen(false)}
                        tipo="alert"
                        title="Detalle del Documento"
                        content={
                            <Grid sx={{ mt: 2 }}>
                                <TablaEditableComponent
                                    titulo="Detalles"
                                    rowKey="documentodetalle_id"
                                    data={detallesFiltrados}
                                    encabezados={[
                                        { field: "documentodetalle_id", label: "ID Detalle" },
                                        { field: "documentoencabezado_id", label: "ID Encabezado" },
                                        { field: "descripcion", label: "Concepto" },
                                        { field: "valor", label: "Valor Unitario" },
                                    ]}
                                    acciones={{ view: false, delete: true, auth: false }}
                                    eventosDeTabla={{
                                        auth: (id, row) => seleccionarDetalle(id, row),
                                        delete: (id, row) => deseleccionarDetalle(id, row)
                                    }}
                                />
                            </Grid>
                        }
                        cancelar={() => setDialogDetalleOpen(false)}
                    />
                </Grid>



                <DialogComponent
                    openDialog={dialogGrupoDetalleOpen}
                    handleClose={() => setDialogGrupoDetalleOpen(false)}
                    tipo="alert"
                    title={`Detalles del Grupo ${grupoActual?.grupo_id || ""}`}
                    content={
                        grupoActual && (
                            <Grid sx={{ mt: 2 }}>
                                <Grid sx={{ mb: 3 }}>
                                    <h3>Documentos en el Grupo</h3>
                                    <TablaEditableComponent
                                        titulo="Documentos"
                                        rowKey="documentoencabezado_id"
                                        data={documentosEnGrupoProcesado}
                                        encabezados={encabezados}
                                        acciones={{ view: false, delete: false }}
                                    />
                                </Grid>
                                <Grid>
                                    <h3>Detalles Seleccionados</h3>
                                    <TablaEditableComponent
                                        titulo="Detalles"
                                        rowKey="documentodetalle_id"
                                        data={detallesSeleccionadosProcesado}
                                        encabezados={[
                                            { field: "documentodetalle_id", label: "ID Detalle" },
                                            { field: "documentoencabezado_id_padre", label: "Documento Padre" },
                                            { field: "descripcion", label: "Concepto" },
                                            { field: "valor", label: "Valor Unitario" },
                                        ]}
                                        acciones={{ view: false, delete: false }}
                                    />
                                </Grid>
                            </Grid>
                        )
                    }
                    cancelar={() => setDialogGrupoDetalleOpen(false)}
                />
                {/* <Grid>
                    <FormularioComponent
                        inputs={inputs}
                    />
                </Grid> */}

                <Grid sx={{ mt: 3 }}>
                    <TablaEditableComponent
                        titulo={`Documentos Seleccionados (${documentoSeleccionado.length})`}
                        rowKey="documentoencabezado_id"
                        data={documentoSeleccionadoProcesado}
                        encabezados={encabezados}
                        acciones={{ delete: true, view: true }}
                        eventosDeTabla={{
                            delete: (id, row) => quitarAgrupacion(row),
                            view: (id, row) => verDetalle(id, row)
                        }}
                    />
                </Grid>

                <Grid sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={guardarGrupo} disabled={documentoSeleccionado.length === 0}>
                        Guardar Grupo
                    </Button>
                </Grid>

                <Grid sx={{ mt: 4 }}>
                    <TablaEditableComponent
                        titulo="Grupos Guardados"
                        rowKey="grupo_id"
                        data={agrupacionesGuardadasProcesada}
                        encabezados={[
                            { field: "grupo_id", label: "ID" },
                            { field: "entidad_id", label: "Cliente", formato: (val) => entidades.data?.data?.find((e) => e.entidad_id === val)?.entidad_nombre || val },
                            { field: "tipo_pago_id", label: "Tipo Pago", formato: (val) => tipoPago.data?.find((t) => t.value === val)?.label || val },
                            { field: "total", label: "Total" },
                        ]}
                        acciones={{ view: true, delete: true }}
                        eventosDeTabla={{
                            view: (id, row) => verDetallesGrupo(id, row),
                        }}
                    />
                </Grid>

                <Grid sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={mostrarFormularioFacturar} disabled={agrupacionesGuardadasProcesada.length === 0}>
                        Generar Documento
                    </Button>
                </Grid>


                <DialogComponent
                    openDialog={dialogFormularioSolFac}
                    handleClose={() => setDialogFormularioSolFac(false)}
                    tipo="alert"
                    titulo={'GENERAR DOCUMENTO'}
                    maxWidth="md"
                    fullWidth={false}
                    content=
                    {dialogFormularioSolFac && (
                        <Grid container sx={{ height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <Grid item sx={{ width: '100%', maxWidth: '900px', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, p: 2 }}>
                                <FormularioSolFac
                                    data={grupoActual}
                                    agrupaciones={agrupacionesGuardadas}
                                    onInsertarFactura={insertarFactura}
                                // rowKey="documentoencabezado_id"
                                // botones={{
                                //     agregar: { visible: false, 
                                //     onClick: (id,row) => insertarFactura(grupoActual)
                                // },
                                // }}

                                />
                            </Grid>
                        </Grid>
                    )}
                />




            </Grid>

            {/* Alertas */}
            <ActionAlertComponent
                tipo={"alert"}
                titulo="Error de Moneda"
                openDialog={mostrarAlertaMoneda}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaMoneda(false)}
                cancelar={() => setMostrarAlertaMoneda(false)}
                aceptar={() => setMostrarAlertaMoneda(false)}
            >
                {mensajeAlertaMoneda}
            </ActionAlertComponent>

            <ActionAlertComponent
                tipo={"alert"}
                titulo="Error de Agrupación"
                openDialog={mostrarAlertaAgrupar}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaAgrupar(false)}
                cancelar={() => setMostrarAlertaAgrupar(false)}
                aceptar={() => setMostrarAlertaAgrupar(false)}
            >
                No se puede agrupar este documento con los seleccionados
            </ActionAlertComponent>

            <ActionAlertComponent
                tipo={"alert"}
                titulo="Sin Documentos"
                openDialog={mostrarAlertaNoDocs}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaNoDocs(false)}
                cancelar={() => setMostrarAlertaNoDocs(false)}
                aceptar={() => setMostrarAlertaNoDocs(false)}
            >
                No hay documentos seleccionados para guardar
            </ActionAlertComponent>

            <ActionAlertComponent
                tipo={"alert"}
                titulo="Sin Datos de Grupo"
                openDialog={mostrarAlertaNoGrupo}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaNoGrupo(false)}
                cancelar={() => setMostrarAlertaNoGrupo(false)}
                aceptar={() => setMostrarAlertaNoGrupo(false)}
            >
                No hay datos de grupo para crear la factura
            </ActionAlertComponent>

            <ActionAlertComponent
                tipo={"alert"}
                titulo="Error al Crear Factura"
                openDialog={mostrarAlertaErrorFactura}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaErrorFactura(false)}
                cancelar={() => setMostrarAlertaErrorFactura(false)}
                aceptar={() => setMostrarAlertaErrorFactura(false)}
            >
                {mensajeErrorFactura}
            </ActionAlertComponent>

            <ActionAlertComponent
                tipo={"alert"}
                titulo="Falta Seleccionar Detalles"
                openDialog={mostrarAlertaFaltaDetalle}
                width={{ xs: "90%", md: "30%" }}
                handleClose={() => setMostrarAlertaFaltaDetalle(false)}
                cancelar={() => setMostrarAlertaFaltaDetalle(false)}
                aceptar={() => setMostrarAlertaFaltaDetalle(false)}
            >
                Le falta seleccionar detalle en algún documento
            </ActionAlertComponent>

        </>
    )

};

SolicitudFacturacion.propTypes = { tipo: PropTypes.string };

export default SolicitudFacturacion