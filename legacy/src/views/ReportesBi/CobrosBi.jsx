import { api } from '@/api';
import ColumnSelect from '@/components/FiltroBi/columnSelect';
import { construirNivelesDesdeConfig } from '@/components/FiltroBi/construirNivelesdesdeConfig';
import { useColumnasDesdeCampo, useGroupedTree } from '@/components/FiltroBi/useGroupedTree';
import { useMonedaPorColumna } from '@/components/FiltroBi/useMonedaPorColumna';
import { usePersistedState } from '@/components/FiltroBi/usePersistedstate';
import LoaderComponent from '@/components/Loader/LoaderComponent';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

import { Autocomplete, Box, Button, Chip, Divider, Grid, Icon, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TablaDouble from '@/components/FiltroBi/tabledouble';
import AcordeonComponent2 from '@/components/AcordeonComponent/AcordeonComponent2';
import NivelesBuilder from '@/components/FiltroBi/nivelesBuilder';
import SelectFiltro from '@/components/FiltroBi/select';
import { useSelector } from 'react-redux';
import DateRangeSelect from '@/components/FiltroBi/dateRangeSelect';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';


// =========================================================
// TOKENS DE DISEÑO (idénticos a ClienteBi)
// =========================================================
const TOKENS = {
    primary: '#006699',
    primaryDark: '#004A70',
    primarySoft: '#EAF3F8',
    accent: '#E6A817',
    border: '#DCE6EC',
    surface: '#FFFFFF',
    ink: '#1F2D36',
    inkMuted: '#5B6B76',
};

const SectionHeader = ({ icon, title, subtitle, action }) => (
    <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
            px: 2.5, py: 1.75,
            bgcolor: TOKENS.primarySoft,
            borderBottom: `1px solid ${TOKENS.border}`,
        }}
    >
        <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box sx={{ color: TOKENS.primaryDark, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: TOKENS.primaryDark, lineHeight: 1.2 }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" sx={{ color: TOKENS.inkMuted }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Stack>
        {action}
    </Stack>
);

// =========================================================
// CAMPOS DISPONIBLES PARA ARMAR EL ÁRBOL
// =========================================================
const NIVELES_POR_DEFECTO = [
    { campo: 'EMP_NOMBRE', etiqueta: 'Empresa' },
    { campo: 'DEPORG_NOMBRE', etiqueta: 'Departamento' },
    { campo: 'CLIENTE', etiqueta: 'Cliente' },
    { campo: 'CXCIDS_SERDOC', etiqueta: "Serie" },
];

const CAMPOS_DISPONIBLES = [
    { campo: 'EMP_NOMBRE', etiqueta: 'Empresa' },
    { campo: 'DEPORG_NOMBRE', etiqueta: 'Departamento' },
    { campo: 'CLIENTE', etiqueta: 'Cliente' },
    { campo: 'CXCIDS_SERDOC', etiqueta: "Serie" },
    { campo: 'FACTURA', etiqueta: 'Numero Documento' },
    { campo: 'DCREDITO', etiqueta: 'Dias Credito' },
];

const CAMPOS_COLUMNA = [
    { campo: 'MONEDA', etiqueta: 'Moneda' },
    { campo: 'RANGO_VENCIMIENTOS', etiqueta: 'Rango Vencimientos' },
];

const COLORES_GRAFICA = [
    '#065177', '#f5bb34', '#22c55e', '#e25a5a', '#ba83ec',
    '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#6366f1',
    '#0c7c35', '#964609', '#a11956', '#677281', '#9333ea',
    '#c4890c', '#e11d48', '#1d4ed8', '#0d9488', '#1c1917',
];

const CobrosBi = () => {

    const { currentCentroCosto } = useSelector((state) => state.menu)
    const authSlice = useSelector((state) => state.auth)
    const {nombre} = useSelector((state) => state.auth)



    const [cobros, setCobros] = useState([]);
    const [seriesCobros, setSeriesCobros] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [moneda, setMoneda] = useState([]);
    const [clientesCobros, setClientesCobros] = useState([]);
    const [diasCreditoCobros, setDiasCreditoCobros] = useState([]);

    const [empresaSeleccionada, setEmpresaSeleccionada] = usePersistedState('cobrosBi.empresaSeleccionada', []);
    const [serieSeleccionado, setSerieSeleccionado] = usePersistedState('cobrosBi.seriaSeleccionada', []);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = usePersistedState('cobrosBi.empleadoSeleccionado', []);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = usePersistedState('cobrosBi.usuarioSeleccionado', null);
    const [monedaSeleccionado, setMonedaSeleccionado] = usePersistedState('cobrosBi.monedaSeleccionado', null);
    const [clienteSeleccionado, setClienteSeleccionado] = usePersistedState('cobrosBi.clienteSeleccionado', []);
    const [diasCreditoSeleccionado, setDiasCreditoSeleccionado] = usePersistedState('cobrosBi.diasCreditoSeleccionado', []);
    const [fechaRangeSeleccionado, setFechaRangeSeleccionado] = useState([null, null]);
    const [nivelGrafica, setNivelGrafica] = useState(0)

    const [columnasVisibles, setColumnasVisibles] = useState(new Set());

    const [campoColumna, setCampoColumna] = usePersistedState('cobrosBi.camposColumna', 'MONEDA');

    const [nivelesActivos, setNivelesActivos] = usePersistedState('cobrosBi.nivelesActivos', NIVELES_POR_DEFECTO);

    const [cargando, setCargando] = useState(false);
    const [abrirFiltros, setAbrirFiltros] = useState(false);

    // console.log("cod_usuario", cod_usuario)
    // console.log("nombre", nombre)
    // console.log("auth: ", authSlice)
    const cencos = currentCentroCosto.cod_cc;

    //------------------- RANGOS----------------

    const minFecha = useMemo(() => {
        if (!cobros.length) return null;

        let min = Infinity;

        for (const cob of cobros) {
            if (!cob.FECHA) continue;

            const fecha = new Date(cob.FECHA);

            if (Number.isNaN(fecha.getTime())) continue;

            const anio = fecha.getFullYear();

            if (anio < 2000 || anio > 2100) continue;

            const tiempo = fecha.getTime();

            if (tiempo < min) {
                min = tiempo;
            }
        }

        return min === Infinity ? null : min;

    }, [cobros])

    const maxFecha = useMemo(() => {
        if (!cobros.length) return null;

        let max = -Infinity;

        for (const cob of cobros) {
            if (!cob.FECHA) continue;

            const fecha = new Date(cob.FECHA);

            if (Number.isNaN(fecha.getTime())) continue;

            const anio = fecha.getFullYear();

            if (anio < 2000 || anio > 2100) continue;

            const tiempo = fecha.getTime();

            if (tiempo > max) {
                max = tiempo;
            }
        }

        return max === -Infinity ? null : max;

    }, [cobros])


    useEffect(() => {
        if (minFecha != null && maxFecha != null) {
            setFechaRangeSeleccionado([minFecha, maxFecha])
        }
    }, [minFecha, maxFecha])

    // -------------------- APIS ----------------

    const obtenerMoneda = useCallback(async () => {
        try {
            const response = await api.get("api/appweb/lista-moneda");
            const data = response?.data?.data;
            setMoneda(data || []);
        } catch (error) {
            setMoneda([]);
        }
    }, []);

    const obtenerUsuarios = useCallback(async () => {
        try {
            const response = await api.get("api/appweb/bi_cobros_listado", { params: { cencos_id: 29 } });
            const data = response?.data?.data?.data || [];
            setUsuarios(data);
        } catch (error) {
            setUsuarios([]);
        }
    }, [cencos]);

    const opcionesUsuarios = useMemo(() => {
        return usuarios.map((u) => ({
            value: u.COD_CROPA_USUARIO,
            label: `${u.COD_CROPA_USUARIO} - ${u.EMPLEADO_NOMBRES} ${u.EMPLEADO_APELLIDOS}`,
            codigo: u.COD_CROPA_USUARIO,
        }));
    }, [usuarios]);

    const opcionesMoneda = useMemo(() => {
        return moneda.map((m) => ({
            value: m.simbolo_moneda,
            label: `${m.simbolo_moneda} - ${m.nom_moneda}`,
            codigo: m.simbolo_moneda,
        }));
    }, [moneda]);

    const obtenerCobros = useCallback(async () => {
        if (!usuarioSeleccionado && !monedaSeleccionado) {
            setCobros([]);
            setCargando(false);
            return;
        }

        setCargando(true);
        try {
            const response = await api.get("api/appweb/bi_cobros_completo_v2", {
                params: { USUARIO: usuarioSeleccionado?.value, MONEDA: monedaSeleccionado?.value }
            });
            const data = response.data?.data;

            setCobros(data?.datos || []);

            const catalogos = data?.catalogos || {};
            setSeriesCobros(catalogos.series || []);
            setClientesCobros(catalogos.clientes || []);
            setDiasCreditoCobros(catalogos.diasCredito || []);

        } catch (error) {
            console.error(error);
            setCobros([]);
            setSeriesCobros([]);
            setClientesCobros([]);
            setDiasCreditoCobros([]);
        } finally {
            setCargando(false);
        }
    }, [usuarioSeleccionado, monedaSeleccionado]);

    useEffect(() => {
        obtenerUsuarios();
        obtenerMoneda();
    }, [obtenerUsuarios, obtenerMoneda]);

    useEffect(() => {
        if (!usuarioSeleccionado || !monedaSeleccionado) return;
        obtenerCobros();
    }, [usuarioSeleccionado, monedaSeleccionado, obtenerCobros]);

    // ----------- FILTROS -------------------
    const cobrosFiltrados = useMemo(() => {
        if (!cobros.length) return [];
        return cobros.filter((cob) => {
            if (empresaSeleccionada?.length > 0) {
                const empresasValues = empresaSeleccionada.map((e) => e?.value ?? e);
                if (!empresasValues.includes(cob.EMP_NOMBRE)) return false;
            }
            if (serieSeleccionado?.length > 0) {
                const seriesValues = serieSeleccionado.map((d) => d?.value ?? d);
                if (!seriesValues.includes(String(cob.CXCIDS_SERDOC))) return false;
            }
            if (clienteSeleccionado?.length > 0) {
                const clientesValues = clienteSeleccionado.map((c) => c?.value ?? c);
                if (!clientesValues.includes(cob.CLI_CODIGO)) return false;
            }
            if (diasCreditoSeleccionado?.length > 0) {
                const diasValues = diasCreditoSeleccionado.map((d) => d?.value ?? d);
                if (!diasValues.includes(String(cob.DCREDITO))) return false;
            }
            if (Array.isArray(fechaRangeSeleccionado) && fechaRangeSeleccionado[0] != null && fechaRangeSeleccionado[1] != null) {
                const [desde, hasta] = fechaRangeSeleccionado;
                const fechaCob = cob.FECHA ? new Date(cob.FECHA).getTime() : null;
                if (fechaCob == null || Number.isNaN(fechaCob)) return false;
                if (fechaCob < desde || fechaCob > hasta) return false;
            }
            return true;
        });
    }, [cobros, empresaSeleccionada, serieSeleccionado, clienteSeleccionado, diasCreditoSeleccionado, fechaRangeSeleccionado]);

    //     console.log('cliente seleccionado:', clienteSeleccionado.map(c => JSON.stringify(c.value)));
    // console.log('cliente en doc:', JSON.stringify(cobros[0]?.CLIENTE));

    // console.log('dias seleccionado:', diasCreditoSeleccionado.map(d => JSON.stringify(d.value)));
    // console.log('DCREDITO en doc:', JSON.stringify(cobros[0]?.DCREDITO), typeof cobros[0]?.DCREDITO);

    // ---------------------- ARBOL CONFIGURABLE -----------------------------
    const todasLasColumnas = useColumnasDesdeCampo(cobros, campoColumna);

    useEffect(() => {
        setColumnasVisibles(new Set(todasLasColumnas.map((c) => c.key)));
    }, [campoColumna, todasLasColumnas]);

    const columnsFromApi = useMemo(
        () => todasLasColumnas.filter((c) => columnasVisibles.has(c.key)),
        [todasLasColumnas, columnasVisibles]
    );

    const NIVELES_AGRUPACION = useMemo(
        () => construirNivelesDesdeConfig(nivelesActivos),
        [nivelesActivos]
    );

    const obtenerColumnaActiva = useCallback((cob) => String(cob[campoColumna] ?? ''), [campoColumna]);
    const obtenerValor = useCallback((cob) => cob.VAL_FAC, []);
    const obtenerValoresDocumento = useCallback((cob) => {
        if (campoColumna !== "RANGO_VENCIMIENTOS") {
            return null;
        }
        return {
            POR_VENCER: Number(cob.POR_VENCER) || 0,
            S15: Number(cob.S15) || 0,
            S16_30: Number(cob.S16_30) || 0,
            S31_60: Number(cob.S31_60) || 0,
            S61_90: Number(cob.S61_90) || 0,
            MAS_90: Number(cob.MAS_90) || 0,
        };
    }, [campoColumna]);
    const idDocumento = useCallback((cob) => String(cob.FACTURA ?? '').trim(), []);

    const groupedData = useGroupedTree({
        documentos: cobrosFiltrados,
        niveles: NIVELES_AGRUPACION,
        columnas: columnsFromApi,
        obtenerColumnaActiva,
        obtenerValor,
        obtenerValoresDocumento,
        idDocumento
    });

    const monedaMap = useMonedaPorColumna(cobros, campoColumna);

    //-------------------GRAFICA DE BARRAS ------------------

    const nodosParaGrafica = useMemo(() => {
        const recoger = (nodos, depthActual, depthObjetivo) => {
            if (depthActual === depthObjetivo) return nodos;
            return nodos.flatMap((n) => recoger(n.children ?? [], depthActual + 1, depthObjetivo));
        }
        return recoger(groupedData, 0, nivelGrafica);
    }, [groupedData, nivelGrafica]);

    const xLabels = columnsFromApi.map((c) => c.label);

    const series = useMemo(() => {
        return nodosParaGrafica.slice(0, 10).map((nodo, i) => ({
            id: nodo.id,
            label: nodo.label,
            data: columnsFromApi.map((c) => Number(nodo.values?.[c.key] || 0)),
            stack: 'total',
            color: COLORES_GRAFICA[i % COLORES_GRAFICA.length],
        }))
    }, [nodosParaGrafica, columnsFromApi])

    const opcionesNivelGrafica = nivelesActivos.map((n, i) => ({ value: i, label: n.etiqueta }));

    // ── Tendencia temporal POR NODO (dinámica con la tabla) ─────────────
    // Usa el campo FECHA de cada cobro para construir la evolución mensual,
    // agrupando por el mismo campo que define el nivel seleccionado del árbol.

    const campoDelNivelGrafica = NIVELES_AGRUPACION?.[nivelGrafica]?.campo ?? null;

    const tendenciaTemporal = useMemo(() => {
        const mesesMap = new Map();

        cobrosFiltrados.forEach((cob) => {
            if (!cob.FECHA) return;

            const fecha = new Date(cob.FECHA);

            if (Number.isNaN(fecha.getTime())) return;

            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, "0");
            const clave = `${anio}-${mes}`;

            if (!mesesMap.has(clave)) {
                mesesMap.set(clave, {
                    clave,
                    anio,
                    mes,
                    orden: fecha.getTime()
                });
            }
        });

        const meses = Array.from(mesesMap.values())
            .sort((a, b) => a.orden - b.orden);

        if (!campoDelNivelGrafica || meses.length === 0 || nodosParaGrafica.length === 0) {
            return { meses, seriesPorNodo: [] }
        }

        const nodosVisibles = nodosParaGrafica.slice(0, 10);

        const seriesPorNodo = nodosVisibles.map((nodo) => {
            const porMes = new Map(meses.map((m) => [m.clave, 0]));

            cobrosFiltrados.forEach((cob) => {
                const valorCampo = String(cob[campoDelNivelGrafica] ?? '').trim();
                if (nodo.label === nodosVisibles[0].label) {
                    // console.log({
                    //     nodo: nodo.label,
                    //     valorCampo,
                    //     campo: campoDelNivelGrafica
                    // });
                }
                if (valorCampo !== String(nodo.label ?? '').trim()) return;

                if (!cob.FECHA) return;
                const fecha = new Date(cob.FECHA);
                if (Number.isNaN(fecha.getTime())) return;

                const anio = fecha.getFullYear();
                const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                const clave = `${anio}-${mes}`;
                if (!porMes.has(clave)) return;

                porMes.set(clave, porMes.get(clave) + (Number(cob.VAL_FAC) || 0))

                // if (nodo.label === nodosVisibles[0].label) {
                //     console.log("Datos por mes:", [...porMes.entries()]);
                // }

            })


            return {
                id: nodo.id,
                label: nodo.label,
                data: meses.map((m) => Number((porMes.get(m.clave) || 0).toFixed(2)))
            }

        })

        return { meses, seriesPorNodo }


    }, [cobrosFiltrados, nodosParaGrafica, campoDelNivelGrafica])

    const tendenciaLabels = tendenciaTemporal.meses.map((m) => `${m.mes}-${m.anio}`)

    const tendenciaSeries = tendenciaTemporal.seriesPorNodo.map((serie, i) => ({
        id: serie.id,
        label: serie.label,
        data: serie.data,
        curve: 'natural',
        color: COLORES_GRAFICA[i % COLORES_GRAFICA.length],
        showMark: true,
    }))

    // --------------------RESUMEN CHIPS ---------------
    const totalCobrosFiltrados = cobrosFiltrados.length;
    const hayFiltrosActivos =
        (empresaSeleccionada?.length > 0) ||
        (serieSeleccionado?.length > 0) ||
        (clienteSeleccionado?.length > 0) ||
        (diasCreditoSeleccionado?.length > 0) ||
        (fechaRangeSeleccionado[0] !== minFecha || fechaRangeSeleccionado[1] !== maxFecha);

    // ---------------------- EXCEL------------------
    const handleExportarExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte BI");

        const encabezado = ["Concepto", ...columnsFromApi.map((c) => c.label), "Total"];
        const headerRow = worksheet.addRow(encabezado);
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF6FF" } };
        });

        const calcularProfundidadMaxima = (nodos, actual = 0) => {
            if (!nodos?.length) return actual;
            return Math.max(...nodos.map((n) => calcularProfundidadMaxima(n.children, actual + 1)));
        };
        const profundidadMaxima = calcularProfundidadMaxima(groupedData);

        const nivelesConValores = new Set([0, 1, profundidadMaxima - 1]);
        let totalesGenerales = columnsFromApi.map(() => 0);

        const agregarNodos = (nodos, profundidad) => {
            nodos.forEach((nodo) => {
                const valores = columnsFromApi.map((c) => Number(nodo.values?.[c.key] || 0));
                const totalFila = valores.reduce((acc, v) => acc + v, 0);

                const mostrarValores = nivelesConValores.has(profundidad);

                const fila = worksheet.addRow([
                    " ".repeat(profundidad) + nodo.label,
                    ...(mostrarValores ? valores : valores.map(() => null)),
                    mostrarValores ? totalFila : null,
                ]);

                fila.getCell(1).alignment = { indent: profundidad };

                if (nodo.children?.length) {
                    fila.font = { bold: true };
                }

                if (mostrarValores) {
                    columnsFromApi.forEach((c, i) => {
                        const monedaCol = monedaMap?.[c.key];
                        const cell = fila.getCell(i + 2);
                        cell.numFmt = monedaCol === "USD" ? '"$"#,##0.00' : '#,##0.00';
                    });
                    fila.getCell(columnsFromApi.length + 2).numFmt = "#,##0.00";
                }

                if (profundidad === 0) {
                    valores.forEach((v, i) => { totalesGenerales[i] += v; });
                }

                if (nodo.children?.length) {
                    agregarNodos(nodo.children, profundidad + 1);
                }
            });
        };

        agregarNodos(groupedData, 0);

        const totalGeneralGlobal = totalesGenerales.reduce((acc, v) => acc + v, 0);
        const filaTotal = worksheet.addRow([
            "TOTAL GENERAL",
            ...totalesGenerales,
            totalGeneralGlobal,
        ]);
        filaTotal.font = { bold: true };
        filaTotal.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
        });

        columnsFromApi.forEach((c, i) => {
            const monedaCol = monedaMap?.[c.key];
            const cell = filaTotal.getCell(i + 2);
            cell.numFmt = monedaCol === "USD" ? '"$"#,##0.00' : '#,##0.00';
        });
        filaTotal.getCell(columnsFromApi.length + 2).numFmt = '#,##0.00';

        worksheet.columns.forEach((column, index) => {
            column.width = index === 0 ? 35 : 18;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveAs(blob, `Reporte_BI_Cobros_${moment().format("YYYYMMDD_HHmmss")}.xlsx`);
    };

    // ------------ ACORDEON -----------
    const toggleLockFiltros = React.useRef(false);

    const handleAbrirFiltros = useCallback(() => {
        if (toggleLockFiltros.current) {
            toggleLockFiltros.current = false;
            return;
        }
        toggleLockFiltros.current = true;
        setAbrirFiltros(prev => !prev);
    }, []);

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <Box
            width="100%"
            maxHeight="85vh"
            overflow="auto"
            sx={{
                bgcolor: '#F7F9FA',
                p: { xs: 1.5, md: 3 },
            }}
        >
            <LoaderComponent
                texto="Cargando datos..."
                open={cargando}
                sx={{ position: 'fixed' }}
            />

            {/* ── Encabezado de página ── */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                sx={{ mb: 2.5 }}
            >
                <Chip
                    size="small"
                    label={`${totalCobrosFiltrados} documento${totalCobrosFiltrados === 1 ? '' : 's'}${hayFiltrosActivos ? ' (filtrado)' : ''}`}
                    sx={{
                        bgcolor: hayFiltrosActivos ? TOKENS.accent : TOKENS.primarySoft,
                        color: hayFiltrosActivos ? '#5A3D00' : TOKENS.primaryDark,
                        fontWeight: 600,
                    }}
                />
            </Stack>

            <Stack spacing={2.5}>

                {/* ── Usuario y Moneda (obligatorios) ── */}
                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', mb: 2.5 }}>
                    <SectionHeader
                        icon={<FilterListRoundedIcon fontSize="small" />}
                        title="Parámetros de consulta"
                        subtitle="Selecciona usuario y moneda para consultar la cartera (obligatorios)"
                    />
                    <Box sx={{ p: 2.5 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Autocomplete
                                    options={opcionesUsuarios}
                                    getOptionLabel={(option) => option.label}
                                    value={usuarioSeleccionado}
                                    onChange={(event, newValue) => setUsuarioSeleccionado(newValue)}
                                    size="small"
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Usuario"
                                            placeholder="Ingrese o seleccione un usuario"
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Autocomplete
                                    options={opcionesMoneda}
                                    getOptionLabel={(option) => option.label}
                                    value={monedaSeleccionado}
                                    onChange={(event, newValue) => setMonedaSeleccionado(newValue)}
                                    size="small"
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Moneda"
                                            placeholder="Ingrese o seleccione una moneda"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        {(!usuarioSeleccionado || !monedaSeleccionado) && (
                            <Typography
                                variant="caption"
                                sx={{ color: TOKENS.accent, display: "block", mt: 1.5 }}
                            >
                                Debes seleccionar usuario y moneda para ver la cartera.
                            </Typography>
                        )}
                    </Box>
                </Paper>

                {/* ── Filtros + Configurador en acordeón ── */}
                <AcordeonComponent2
                    expandido={abrirFiltros}
                    expandir={handleAbrirFiltros}
                    titulo={
                        <Box display="flex" justifyContent="space-between" alignItems="center" p={0.8} width="100%">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <FilterListRoundedIcon fontSize="small" sx={{ color: TOKENS.primarySoft }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TOKENS.primarySoft }}>
                                    Filtros y configuración
                                </Typography>
                                {hayFiltrosActivos && (
                                    <Chip
                                        size="small"
                                        label="Filtros activos"
                                        sx={{ bgcolor: TOKENS.accent, color: '#5A3D00', fontWeight: 600 }}
                                    />
                                )}
                            </Stack>
                            <Icon className={abrirFiltros ? "c-arriba-simple" : "c-abajo-simple"} />
                        </Box>
                    }
                >
                    <Box sx={{ pt: 1.5 }}>
                        <Grid container spacing={2.5} alignItems="flex-start">

                            {/* ── Configurador del árbol ── */}
                            <Grid size={{ xs: 12, lg: 5 }}>
                                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', height: '100%' }}>
                                    <SectionHeader
                                        icon={<TuneRoundedIcon fontSize="small" />}
                                        title="Personaliza tu reporte"
                                        subtitle="Define cómo se agrupan y desglosan los datos"
                                    />
                                    <Box sx={{ p: 2.5 }}>
                                        <Box sx={{ mb: 2.5 }}>
                                            <TextField
                                                select fullWidth size="small"
                                                label="Columnas (qué se desglosa en columnas)"
                                                value={campoColumna}
                                                onChange={(e) => setCampoColumna(e.target.value)}
                                            >
                                                {CAMPOS_COLUMNA.map((c) => (
                                                    <MenuItem key={c.campo} value={c.campo}>{c.etiqueta}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                        <NivelesBuilder
                                            camposDisponibles={CAMPOS_DISPONIBLES}
                                            nivelesActivos={nivelesActivos}
                                            onChange={setNivelesActivos}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* ── Filtros ── */}
                            <Grid size={{ xs: 12, lg: 7 }}>
                                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', height: '100%' }}>
                                    <SectionHeader
                                        icon={<FilterListRoundedIcon fontSize="small" />}
                                        title="Filtros"
                                        subtitle="Acota el universo de documentos a analizar"
                                    />
                                    <Box sx={{ p: 2.5 }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>SERIE</Typography>
                                                <SelectFiltro options={seriesCobros} value={serieSeleccionado} onChange={setSerieSeleccionado} searchable multi emitObjects placeholder="Seleccione serie" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>CLIENTES</Typography>
                                                <SelectFiltro options={clientesCobros} value={clienteSeleccionado} onChange={setClienteSeleccionado} searchable multi emitObjects chipLabelKey="codigo" placeholder="Seleccione cliente" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>DÍAS DE CRÉDITO</Typography>
                                                <SelectFiltro options={diasCreditoCobros} value={diasCreditoSeleccionado} onChange={setDiasCreditoSeleccionado} searchable multi emitObjects placeholder="Seleccione días de crédito" />
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 4, borderColor: TOKENS.border }} />

                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <DateRangeSelect
                                                    label='Fecha'
                                                    tipo='date'
                                                    min={minFecha}
                                                    max={maxFecha}
                                                    value={fechaRangeSeleccionado}
                                                    onChange={setFechaRangeSeleccionado}
                                                />
                                            </Grid>
                                        </Grid>

                                    </Box>
                                </Paper>
                            </Grid>

                        </Grid>
                    </Box>
                </AcordeonComponent2>

                {/* ── Tabla ── */}
                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden' }}>
                    <SectionHeader
                        icon={<TableChartRoundedIcon fontSize="small" />}
                        title="Resumen agrupado"
                        subtitle="Detalle jerárquico según los niveles configurados"
                        action={
                            <Stack direction="row" spacing={2} alignItems="center">
                                <ColumnSelect
                                    columns={todasLasColumnas}
                                    visibleKeys={columnasVisibles}
                                    onChange={setColumnasVisibles}
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleExportarExcel}
                                    startIcon={<FileDownloadRoundedIcon fontSize="small" />}
                                    sx={{
                                        bgcolor: TOKENS.primary,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': { bgcolor: TOKENS.primaryDark },
                                    }}
                                >
                                    Exportar a Excel
                                </Button>
                            </Stack>
                        }
                    />
                    <Box sx={{ p: nivelesActivos.length === 0 ? 0 : 2.5 }}>
                        {!usuarioSeleccionado || !monedaSeleccionado ? (
                            <Typography sx={{ p: 4, textAlign: 'center', color: TOKENS.inkMuted }}>
                                Selecciona usuario y moneda arriba para ver el reporte.
                            </Typography>
                        ) : nivelesActivos.length === 0 ? (
                            <Typography sx={{ p: 4, textAlign: 'center', color: TOKENS.inkMuted }}>
                                Arrastra al menos un campo en "Niveles del árbol" para ver el reporte.
                            </Typography>
                        ) : (
                            <TablaDouble
                                data={groupedData}
                                columns={columnsFromApi}
                                rowKey="id"
                                showTotals={true}
                                firstColumnWidth={250}
                                monedaMap={monedaMap}
                            />
                        )}
                    </Box>
                </Paper>

                {/* ── Gráfica apilada ── */}
                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', mb: 2 }}>
                    <SectionHeader
                        icon={<BarChartRoundedIcon fontSize="small" />}
                        title="Comparativo gráfico"
                        subtitle={series.length > 10 ? 'Se muestran los primeros 10 elementos del nivel seleccionado' : undefined}
                    />
                    <Box sx={{ p: 2.5 }}>
                        {series.length === 0 ? (
                            <Typography sx={{ p: 4, textAlign: 'center', color: TOKENS.inkMuted }}>
                                Sin datos para mostrar en la gráfica.
                            </Typography>
                        ) : (
                            <Box sx={{ width: '100%', height: 700 }}>
                                <BarChart
                                    series={series}
                                    xAxis={[{ data: xLabels, scaleType: 'band', height: 40 }]}
                                    yAxis={[{
                                        width: 90,
                                        valueFormatter: (value) =>
                                            new Intl.NumberFormat('es-GT', {
                                                notation: 'compact',
                                                maximumFractionDigits: 1,
                                            }).format(value)
                                    }]}
                                    slotProps={{
                                        legend: { hidden: series.length > 10 },
                                        tooltip: { trigger: 'item' },
                                    }}
                                    colors={COLORES_GRAFICA}
                                />
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* ── Tendencia temporal (dinámica con la tabla) ── */}
                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', mb: 2 }}>
                    <SectionHeader
                        icon={<BarChartRoundedIcon fontSize="small" />}
                        title="Tendencia mensual por elemento"
                        subtitle={
                            tendenciaSeries.length > 0
                                ? `Evolución mensual por ${nivelesActivos[nivelGrafica]?.etiqueta ?? 'nivel'}${tendenciaSeries.length >= 10 ? ' (primeros 10)' : ''}`
                                : undefined
                        }
                    />
                    <Box sx={{ p: 2.5 }}>
                        {tendenciaSeries.length === 0 || tendenciaLabels.length === 0 ? (
                            <Typography sx={{ p: 4, textAlign: 'center', color: TOKENS.inkMuted }}>
                                Sin datos para mostrar la tendencia temporal.
                            </Typography>
                        ) : (
                            <Box sx={{ width: '100%', height: 500 }}>
                                <LineChart
                                    height={500}
                                    series={tendenciaSeries}
                                    xAxis={[{ scaleType: 'point', data: tendenciaLabels }]}
                                    grid={{ vertical: true, horizontal: true }}
                                    margin={{ left: 70 }}
                                    slotProps={{ legend: { hidden: tendenciaSeries.length > 8 } }}
                                />
                            </Box>
                        )}
                    </Box>
                </Paper>

            </Stack>
        </Box>
    );
};

export default CobrosBi;