import ColumnSelect from '@/components/FiltroBi/columnSelect';
import DateRangeSelect from '@/components/FiltroBi/dateRangeSelect';
import RangeSelect from '@/components/FiltroBi/rangeSelect';
import SelectFiltro from '@/components/FiltroBi/select';
import TablaDouble from '@/components/FiltroBi/tabledouble';
import { useGroupedTree, useColumnasDesdeCampo } from '@/components/FiltroBi/useGroupedTree';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from "../../api";
import moment from 'moment';
import {
    Box, Button, Grid, MenuItem, TextField, Typography,
    Paper, Stack, Chip, Divider,
    Icon,
    Alert,
} from '@mui/material';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { usePersistedState } from '@/components/FiltroBi/usePersistedstate';
import { construirNivelesDesdeConfig } from '@/components/FiltroBi/construirNivelesdesdeConfig';
import NivelesBuilder from '@/components/FiltroBi/nivelesBuilder';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';

import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { useMonedaPorColumna } from '@/components/FiltroBi/useMonedaPorColumna';
import AcordeonComponent2 from '@/components/AcordeonComponent/AcordeonComponent2';
import LoaderComponent from '@/components/Loader/LoaderComponent';
import { useEffectEvent } from 'react';
// import { DATA_GRID_PROPS_DEFAULT_VALUES } from '@mui/x-data-grid';


// =========================================================
// TOKENS DE DISEÑO
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
const CAMPOS_DISPONIBLES = [
    // { campo: 'FILE_DEPTO', etiqueta: 'Departamento' },
    { campo: 'FILE_VENDEDOR', etiqueta: 'Vendedor' },
    { campo: 'FILE_CLINOMBRE', etiqueta: 'Cliente' },
    { campo: 'FILE_NUMERO', etiqueta: 'File (Número)' },
    { campo: 'DOC_MONEDA', etiqueta: 'Moneda' },
    { campo: 'DOC_RUBNOMBRE', etiqueta: 'Rubro' },
    { campo: 'DOC_TIPO_NOMBRE', etiqueta: 'Tipo Documento' },
    { campo: 'FILE_CUSTOMER', etiqueta: 'Customer' },
    { campo: 'FILE_MES', etiqueta: "Mes" },
    { campo: 'DOC_SERIE', etiqueta: 'Serie' },
    { campo: 'DOC_NUMERO', etiqueta: '# Documento' },
];

const CAMPOS_COLUMNA = [
    { campo: 'FILE_ANIO', etiqueta: 'Año' },
    { campo: 'DOC_TIPO_NOMBRE', etiqueta: 'Tipo Documento' },
    { campo: 'DOC_MONEDA', etiqueta: 'Moneda' },

];

const NIVELES_POR_DEFECTO = [
    // { campo: 'FILE_DEPTO', etiqueta: 'Departamento' },
    { campo: 'FILE_CLINOMBRE', etiqueta: 'Cliente' },
    { campo: 'DOC_TIPO_NOMBRE', etiqueta: 'Tipo Documento' },
    { campo: 'FILE_NUMERO', etiqueta: 'File (Número)' },
    { campo: 'DOC_RUBNOMBRE', etiqueta: 'Rubro' }
];

const COLORES_GRAFICA = [
    '#065177', '#f5bb34', '#22c55e', '#e25a5a', '#ba83ec',
    '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#6366f1',
    '#0c7c35', '#964609', '#a11956', '#677281', '#9333ea',
    '#c4890c', '#e11d48', '#1d4ed8', '#0d9488', '#1c1917',
];

const ClienteBi = () => {

    const [documentos, setDocumentos] = useState([]);
    const [tipoFile, setTipoFile] = useState([]);
    const [clienteFile, setClienteFile] = useState([]);
    const [rubrosFile, setRubrosFile] = useState([]);
    const [tiposDocumetosFile, setTiposDocumentosFile] = useState([]);
    const [numeroFiles, setNumeroFiles] = useState([]);
    // const [mesfiles, setMesFiles] = useState([]);
    const [serieFiles, setSeriesFiles] = useState([]);

    const [rubroSeleccionado, setRubroSeleccionado] = usePersistedState('clienteBi.rubroSeleccionado', []);
    const [clienteSeleccionado, setClienteSeleccionado] = usePersistedState('clienteBi.clienteSeleccionado', []);
    const [numeroFileSeleccionado, setNumeroFileSeleccionado] = usePersistedState('clienteBi.numeroSeleccionado', []);
    const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = usePersistedState('clienteBi.tipoDocumentoSeleccionado', []);
    const [tipoFileSeleccionado, setTipoFileSeleccionado] = usePersistedState('clienteBi.tipoFileSeleccionado', []);
    const [valorTotalRangeSeleccionado, setValorTotalRangeSeleccionado] = useState([0, 0]);
    const [fechaRangeSeleccionado, setFechaRangeSeleccionado] = useState([null, null]);
    const [columnasVisibles, setColumnasVisibles] = useState(new Set());
    // const [mesFileSeleccionado, setMesFileSeleccionado] = useState([])
    const [serieFileSeleccionado, setSerieFileSeleccionado] = usePersistedState('clienteBi.serieFileSeleccionado', []);

    const [nivelesActivos, setNivelesActivos] = usePersistedState(
        'clienteBi.nivelesActivos', NIVELES_POR_DEFECTO
    );
    const [campoColumna, setCampoColumna] = usePersistedState(
        'clienteBi.campoColumna', 'FILE_ANIO'
    );

    const [nivelGrafica, setNivelGrafica] = useState(0);

    const [abrirFiltros, setAbrirFiltros] = useState(false);
    const [cargando, setCargando] = useState(true)

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);


    const FECHA_MINIMA_REAL = '2018-01-01';
    const FECHA_MAXIMA_REAL = moment().format('YYYY-MM-DD');
    const LIMITE_ANIOS_CONSULTA = 2;
    const [fechaConsultaInicio, setFechaConsultaInicio] = usePersistedState('clienteBi.fechaConsultaInicio', moment().startOf('year').toISOString());
    const [fechaConsultaFin, setFechaConsultaFin] = usePersistedState('clienteBi.fechaConsultaFin', moment().endOf('day').toISOString())

    const [inputFechaInicio, setInputFechaInicio] = useState(moment(fechaConsultaInicio).format('YYYY-MM-DD'))
    const [inputFechaFin, setInputFechaFin] = useState(moment(fechaConsultaFin).format('YYYY-MM-DD'))

    const aplicarRangoConsulta = useCallback(() => {
        let inicio = moment(inputFechaInicio, "YYYY-MM-DD").startOf('day');
        let fin = moment(inputFechaFin, "YYYY-MM-DD").endOf('day');

        if (!inicio.isValid() || !fin.isValid()) return;

        if (inicio.isAfter(fin)) {
            [inicio, fin] = [fin.clone().startOf('day'), inicio.clone().endOf('day')];
        }

        if (fin.diff(inicio, 'years', true) > LIMITE_ANIOS_CONSULTA) {
            inicio = fin.clone().subtract(LIMITE_ANIOS_CONSULTA, 'year').startOf('day')
        }

        setFechaConsultaInicio(inicio.toISOString());
        setFechaConsultaFin(fin.toISOString());
        setInputFechaInicio(inicio.format('YYYY-MM-DD'));
        setInputFechaFin(fin.format('YYYY-MM-DD'));
    }, [inputFechaFin, inputFechaInicio])

    const mensajeRangoConsulta = useMemo(() => {
        let inicio = moment(inputFechaInicio, "YYYY-MM-DD");
        let fin = moment(inputFechaFin,"YYYY-MM-DD");

        if(!inicio.isValid() || !fin.isValid()) return "";

        if(inicio.isAfter(fin)){
            [inicio, fin] = [fin, inicio];
        }

        const anios = fin.diff(inicio,"years", true);

        if(anios > LIMITE_ANIOS_CONSULTA){
            return `Solo se permite consultar un maximo de ${LIMITE_ANIOS_CONSULTA} años.`
        }

        return "";

    },[inputFechaFin, inputFechaInicio])

    // ── Rangos ────────────────────────────────────────────────────────────

    const minValorTotal = useMemo(() => {
        if (!documentos.length) return 0;

        let min = Infinity;

        for (const doc of documentos) {
            const valor = Number(doc.DOC_VALORDOLAR) || 0;

            if (valor < min) {
                min = valor;
            }
        }
        return Math.floor(min === Infinity ? 0 : min);
    }, [documentos]);

    const maxValorTotal = useMemo(() => {
        if (!documentos.length) return 10000;

        let max = 0;

        for (const doc of documentos) {
            const valor = Number(doc.DOC_VALORDOLAR) || 0;

            if (valor > max) {
                max = valor;
            }
        }

        return Math.ceil(max);
    }, [documentos]);

    const minFecha = useMemo(() => {
        if (!documentos.length) return null;

        let min = Infinity;

        for (const doc of documentos) {
            if (!doc.FILE_FECHA) continue;

            const tiempo = new Date(doc.FILE_FECHA).getTime();

            if (!Number.isNaN(tiempo) && tiempo < min) {
                min = tiempo;
            }
        }

        return min === Infinity ? null : min;
    }, [documentos]);

    const maxFecha = useMemo(() => {
        if (!documentos.length) return null;

        let max = -Infinity;

        for (const doc of documentos) {
            if (!doc.FILE_FECHA) continue;

            const tiempo = new Date(doc.FILE_FECHA).getTime();

            if (!Number.isNaN(tiempo) && tiempo > max) {
                max = tiempo;
            }
        }

        return max === -Infinity ? null : max;
    }, [documentos]);

    useEffect(() => {
        setValorTotalRangeSeleccionado([minValorTotal, maxValorTotal]);
    }, [minValorTotal, maxValorTotal]);

    useEffect(() => {
        if (minFecha != null && maxFecha != null) {
            setFechaRangeSeleccionado([minFecha, maxFecha]);
        }
    }, [minFecha, maxFecha]);

    // ── Carga de datos ────────────────────────────────────────────────────

    const paramsRango = useMemo(() => ({
        fe_inicio: fechaConsultaInicio,
        fe_fin: fechaConsultaFin
    }), [fechaConsultaInicio, fechaConsultaFin])

    const obtenerDatosCompletos = useCallback(async () => {
        setCargando(true)

        try {
            const response = await api.get("api/appweb/bi-aduanas-completo", { params: paramsRango })
            const data = response.data?.data;

            setDocumentos(data?.data_cli_bi_aduanas || []);

            const catalogos = data?.catalogos
            setTipoFile(catalogos.tipoFile || []);
            setClienteFile(catalogos.clienteFile || []);
            setRubrosFile(catalogos.rubrosFile || []);
            setTiposDocumentosFile(catalogos.tiposDocumentosFile || []);
            setNumeroFiles(catalogos.numeroFiles || []);
            setSeriesFiles(catalogos.serieFiles)

        } catch (error) {
            console.error(error)
            setDocumentos([]);
            setTipoFile([]);
            setRubrosFile([])
            setTiposDocumentosFile([])
            setNumeroFiles([])
            setSeriesFiles([])
        } finally {
            setCargando(false)
        }

    }, [paramsRango])

    useEffect(() => {
        obtenerDatosCompletos();
    }, [obtenerDatosCompletos])

    // ── Filtrado ──────────────────────────────────────────────────────────

    const documentosFiltrados = useMemo(() => {
        if (!documentos.length) return [];
        return documentos.filter((doc) => {
            if (tipoDocumentoSeleccionado.length > 0) {
                if (!tipoDocumentoSeleccionado.map((e) => e.value).includes(doc.DOC_TIPO_NOMBRE)) return false;
            }
            if (rubroSeleccionado.length > 0) {
                if (!rubroSeleccionado.map((p) => p.value).includes(doc.DOC_RUBNOMBRE)) return false;
            }
            if (clienteSeleccionado.length > 0) {
                if (!clienteSeleccionado.map((c) => c.value).includes(doc.FILE_CLICODIGO)) return false;
            }
            if (tipoFileSeleccionado.length > 0) {
                if (!tipoFileSeleccionado.map((d) => d.value).includes(doc.FILE_TIPO)) return false;
            }
            if (numeroFileSeleccionado.length > 0) {
                if (!numeroFileSeleccionado.map((f) => f.value).includes(doc.FILE_NUMERO)) return false;
            }
            // if (mesFileSeleccionado.length > 0) {
            //     if (!mesFileSeleccionado.map((m) => m.value).includes(doc.FILE_MES)) return false;
            // }
            if (serieFileSeleccionado.length > 0) {
                if (!serieFileSeleccionado.map((s) => s.value).includes(doc.DOC_SERIE)) return false;
            }
            if (Array.isArray(valorTotalRangeSeleccionado) && valorTotalRangeSeleccionado.length === 2) {
                const [minTotal, maxTotal] = valorTotalRangeSeleccionado;
                const valor = Number(doc.DOC_VALORDOLAR) || 0;
                if (valor < minTotal || valor > maxTotal) return false;
            }
            if (Array.isArray(fechaRangeSeleccionado) && fechaRangeSeleccionado[0] != null && fechaRangeSeleccionado[1] != null) {
                const [desde, hasta] = fechaRangeSeleccionado;
                const fechaDoc = doc.FILE_FECHA ? new Date(doc.FILE_FECHA).getTime() : null;
                if (fechaDoc == null || Number.isNaN(fechaDoc)) return false;
                if (fechaDoc < desde || fechaDoc > hasta) return false;
            }
            return true;
        });
    }, [documentos, numeroFileSeleccionado, rubroSeleccionado, tipoDocumentoSeleccionado, valorTotalRangeSeleccionado, fechaRangeSeleccionado, clienteSeleccionado, tipoFileSeleccionado, /* mesFileSeleccionado */ serieFileSeleccionado]);

    // ── Árbol configurable ────────────────────────────────────────────────

    const todasLasColumnas = useColumnasDesdeCampo(documentos, campoColumna);

    useEffect(() => {
        setColumnasVisibles(new Set(todasLasColumnas.map((c) => c.key)));
    }, [campoColumna, todasLasColumnas.length]);

    const columnsFromApi = useMemo(
        () => todasLasColumnas.filter((c) => columnasVisibles.has(c.key)),
        [todasLasColumnas, columnasVisibles]
    );

    const NIVELES_AGRUPACION = useMemo(
        () => construirNivelesDesdeConfig(nivelesActivos),
        [nivelesActivos]
    );

    const obtenerColumnaActiva = useCallback((doc) => String(doc[campoColumna] ?? ''), [campoColumna]);
    const obtenerValor = useCallback((doc) => doc.DOC_VALORDOLAR, []);
    const idDocumento = useCallback((doc) => String(doc.DOC_NUMERO ?? '').trim(), []);

    const groupedData = useGroupedTree({
        documentos: documentosFiltrados,
        niveles: NIVELES_AGRUPACION,
        columnas: columnsFromApi,
        obtenerColumnaActiva,
        obtenerValor,
        idDocumento,
    });

    const monedaMap = useMonedaPorColumna(documentosFiltrados, campoColumna);

    // ── Gráfica de barras ────────────────────────────────────────────────

    const nodosParaGrafica = useMemo(() => {
        const recoger = (nodos, depthActual, depthObjetivo) => {
            if (depthActual === depthObjetivo) return nodos;
            return nodos.flatMap((n) => recoger(n.children ?? [], depthActual + 1, depthObjetivo));
        };
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
        }));
    }, [nodosParaGrafica, columnsFromApi]);

    const opcionesNivelGrafica = nivelesActivos.map((n, i) => ({ value: i, label: n.etiqueta }));

    // ── Tendencia temporal POR NODO (dinámica con la tabla) ─────────────
    // Para cada nodo visible en el nivel seleccionado de la gráfica de
    // barras, se calcula su evolución mes a mes, usando el mismo campo
    // de agrupación que define ese nivel del árbol (NIVELES_AGRUPACION).

    const campoDelNivelGrafica = NIVELES_AGRUPACION?.[nivelGrafica]?.campo ?? null;

    const tendenciaTemporal = useMemo(() => {
        const mesesMap = new Map(); // 'YYYY-MM' -> { clave, anio, mes, mesNombre }
        documentosFiltrados.forEach((doc) => {
            const anio = doc.FILE_ANIO ?? (doc.FILE_FECHA ? new Date(doc.FILE_FECHA).getFullYear() : null);
            const mes = doc.FILE_MES ?? (doc.FILE_FECHA ? String(new Date(doc.FILE_FECHA).getMonth() + 1).padStart(2, '0') : null);
            if (anio == null || mes == null) return;
            const clave = `${anio}-${String(mes).padStart(2, '0')}`;
            if (!mesesMap.has(clave)) {
                mesesMap.set(clave, {
                    clave,
                    anio: String(anio),
                    mes: String(mes).padStart(2, '0'),
                    mesNombre: `${doc.FILE_MES}-` ?? String(mes).padStart(2, '0'),
                });
            }
        });
        const meses = Array.from(mesesMap.values()).sort((a, b) => a.clave.localeCompare(b.clave));

        if (!campoDelNivelGrafica || meses.length === 0 || nodosParaGrafica.length === 0) {
            return { meses, seriesPorNodo: [] };
        }

        const nodosVisibles = nodosParaGrafica.slice(0, 10);

        const seriesPorNodo = nodosVisibles.map((nodo) => {
            const porMes = new Map(meses.map((m) => [m.clave, 0]));

            documentosFiltrados.forEach((doc) => {
                const valorCampo = String(doc[campoDelNivelGrafica] ?? '').trim();
                if (valorCampo !== String(nodo.label ?? '').trim()) return;

                const anio = doc.FILE_ANIO ?? (doc.FILE_FECHA ? new Date(doc.FILE_FECHA).getFullYear() : null);
                const mes = doc.FILE_MES ?? (doc.FILE_FECHA ? String(new Date(doc.FILE_FECHA).getMonth() + 1).padStart(2, '0') : null);
                if (anio == null || mes == null) return;
                const clave = `${anio}-${String(mes).padStart(2, '0')}`;
                if (!porMes.has(clave)) return;

                porMes.set(clave, porMes.get(clave) + (Number(doc.DOC_VALORDOLAR) || 0));
            });

            return {
                id: nodo.id,
                label: nodo.label,
                data: meses.map((m) => Number((porMes.get(m.clave) || 0).toFixed(2))),
            };
        });

        return { meses, seriesPorNodo };
    }, [documentosFiltrados, nodosParaGrafica, campoDelNivelGrafica]);

    const tendenciaLabels = tendenciaTemporal.meses.map((m) => `${m.mesNombre}${m.anio}`);

    const tendenciaSeries = tendenciaTemporal.seriesPorNodo.map((serie, i) => ({
        id: serie.id,
        label: serie.label,
        data: serie.data,
        curve: 'natural',
        color: COLORES_GRAFICA[i % COLORES_GRAFICA.length],
        showMark: true,
    }));

    // ── Resumen rápido (chips de contexto) ───────────────────────────────
    const totalDocumentosFiltrados = documentosFiltrados.length;
    const hayFiltrosActivos =
        tipoDocumentoSeleccionado.length > 0 ||
        rubroSeleccionado.length > 0 ||
        clienteSeleccionado.length > 0 ||
        tipoFileSeleccionado.length > 0 ||
        numeroFileSeleccionado.length > 0 ||
        (fechaRangeSeleccionado[0] !== minFecha || fechaRangeSeleccionado[1] !== maxFecha);
    // mesFileSeleccionado.length > 0 ||

    //--- EXCEL--------------------------------------------------------

    const handleExportarExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte BI");

        const encabezado = ["Concepto", ...columnsFromApi.map((c) => c.label), "Total"];
        const headerRow = worksheet.addRow(encabezado);
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF6FF" } }
        })

        const calcularProfundidadMaxima = (nodos, actual = 0) => {
            if (!nodos?.length) return actual;
            return Math.max(...nodos.map((n) => calcularProfundidadMaxima(n.children, actual + 1)))
        }
        const profundidadMaxima = calcularProfundidadMaxima(groupedData);

        const nivelesConValores = new Set([0, 1, profundidadMaxima - 1]);

        let totalesGenerales = columnsFromApi.map(() => 0)

        const agregarNodos = (nodos, profundidad) => {
            nodos.forEach((nodo) => {
                const valores = columnsFromApi.map((c) => Number(nodo.values?.[c.key] || 0));
                const totalFila = valores.reduce((acc, v) => acc + v, 0)

                const mostrarValores = nivelesConValores.has(profundidad);

                const fila = worksheet.addRow([
                    " ".repeat(profundidad) + nodo.label,
                    ...(mostrarValores ? valores : valores.map(() => null)),
                    mostrarValores ? totalFila : null,
                ]);

                fila.getCell(1).alignment = { indent: profundidad };

                if (nodo.children?.length) {
                    fila.font = { bold: true }
                }

                if (mostrarValores) {
                    columnsFromApi.forEach((c, i) => {
                        const moneda = monedaMap?.[c.key];
                        const cell = fila.getCell(i + 2);
                        cell.numFmt = moneda === "USD" ? '"$"#,##0.00' : '#,##0.00';
                    });
                    fila.getCell(columnsFromApi.length + 2).numFmt = "#,##0.00";
                }

                if (profundidad === 0) {
                    valores.forEach((v, i) => { totalesGenerales[i] += v; })
                }

                if (nodo.children?.length) {
                    agregarNodos(nodo.children, profundidad + 1);
                }

            });
        }

        agregarNodos(groupedData, 0);

        const totalGeneralGlobal = totalesGenerales.reduce((acc, v) => acc + v, 0);
        const filaTotal = worksheet.addRow([
            "TOTAL GENERAL",
            ...totalesGenerales,
            totalGeneralGlobal,
        ])
        filaTotal.font = { bold: true };
        filaTotal.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } }
        })

        columnsFromApi.forEach((c, i) => {
            const moneda = monedaMap?.[c.key];
            const cell = filaTotal.getCell(i + 2);
            cell.numFmt = moneda === "USD" ? '"$"#,##0.00' : '#,##0.00';
        })
        filaTotal.getCell(columnsFromApi.length + 2).numFmt = '#,##0.00'

        worksheet.columns.forEach((column, index) => {
            column.width = index === 0 ? 35 : 18;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })

        saveAs(blob, `Reporte_BI_${moment().format("YYYYMMDD_HHmmss")}.xlsx`)
    }

    // 1. Cambia el useState por un ref de lock, igual que en el ejemplo
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
                    label={`${totalDocumentosFiltrados} documento${totalDocumentosFiltrados === 1 ? '' : 's'}${hayFiltrosActivos ? ' (filtrado)' : ''}`}
                    sx={{
                        bgcolor: hayFiltrosActivos ? TOKENS.accent : TOKENS.primarySoft,
                        color: hayFiltrosActivos ? '#5A3D00' : TOKENS.primaryDark,
                        fontWeight: 600,
                    }}
                />
            </Stack>

            <Stack spacing={2.5}>

                <Paper variant="outlined" sx={{ borderColor: TOKENS.border, borderRadius: 2.5, overflow: 'hidden', mb: 2.5 }}>
                    <SectionHeader
                        icon={<FilterListRoundedIcon fontSize="small" />}
                        title="Periodo de consulta"
                        subtitle={`Rango de datos a traer del servidor (máximo ${LIMITE_ANIOS_CONSULTA} años)`}
                    />
                    <Box sx={{ p: 2.5 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
                            <TextField
                                label="Desde"
                                type="date"
                                size="small"
                                value={inputFechaInicio}
                                onChange={(e) => setInputFechaInicio(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: FECHA_MINIMA_REAL,
                                    max: inputFechaFin
                                }}
                            />
                            <TextField
                                label="Hasta"
                                type="date"
                                size="small"
                                value={inputFechaFin}
                                onChange={(e) => setInputFechaFin(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: inputFechaInicio,
                                    max: FECHA_MAXIMA_REAL,
                                }}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={aplicarRangoConsulta}
                                disabled={cargando || !!mensajeRangoConsulta}
                                sx={{ bgcolor: TOKENS.primary, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: TOKENS.primaryDark } }}
                            >
                                Consultar
                            </Button>
                        </Stack>
                        <Typography variant="caption" sx={{ color: TOKENS.inkMuted, display: 'block', mt: 1 }}>
                            Consultando: {moment(fechaConsultaInicio).format('DD/MM/YYYY')} — {moment(fechaConsultaFin).format('DD/MM/YYYY')}
                        </Typography>
                        {mensajeRangoConsulta && (
                            <Alert
                                severity='warning' sx={{ mt: 2}}
                            >
                                {mensajeRangoConsulta}
                            </Alert>
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
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>TIPOS DOCUMENTOS</Typography>
                                                <SelectFiltro options={tiposDocumetosFile} value={tipoDocumentoSeleccionado} onChange={setTipoDocumentoSeleccionado} searchable multi emitObjects placeholder="Selecciona tipo" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>RUBROS</Typography>
                                                <SelectFiltro options={rubrosFile} value={rubroSeleccionado} onChange={setRubroSeleccionado} searchable multi emitObjects placeholder="Selecciona rubro" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>CLIENTES</Typography>
                                                <SelectFiltro options={clienteFile} value={clienteSeleccionado} onChange={setClienteSeleccionado} searchable multi emitObjects chipLabelKey="codigo" placeholder="Selecciona cliente" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>TIPO FILE</Typography>
                                                <SelectFiltro options={tipoFile} value={tipoFileSeleccionado} onChange={setTipoFileSeleccionado} searchable multi emitObjects placeholder="Selecciona tipo file" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>NÚMERO FILE</Typography>
                                                <SelectFiltro options={numeroFiles} value={numeroFileSeleccionado} onChange={setNumeroFileSeleccionado} searchable multi emitObjects placeholder="Selecciona file" />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                                <Typography variant="caption" sx={{ color: TOKENS.inkMuted, fontWeight: 600, display: 'block', mb: 0.5 }}>SERIE DOCUMENTO</Typography>
                                                <SelectFiltro options={serieFiles} value={serieFileSeleccionado} onChange={setSerieFileSeleccionado} searchable multi emitObjects placeholder="Selecciona serie" />
                                            </Grid>
                                        </Grid>

                                        <Divider sx={{ my: 4, borderColor: TOKENS.border }} />

                                        <Grid container spacing={4} >
                                            <Grid size={{ xs: 6 }}>
                                                <RangeSelect label="Valor Total" min={minValorTotal} max={maxValorTotal} step={1} value={valorTotalRangeSeleccionado} onChange={setValorTotalRangeSeleccionado} formatValue={(val) => val.toFixed(2)} />
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <DateRangeSelect label="Fecha del File" tipo="date" min={minFecha} max={maxFecha} value={fechaRangeSeleccionado} onChange={setFechaRangeSeleccionado} />
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
                        {nivelesActivos.length === 0 ? (
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
                        subtitle={series.length > 10 ? 'Se muestran los primeros 20 elementos del nivel seleccionado' : undefined}
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
                                ? `Evolución mensual por ${nivelesActivos[nivelGrafica]?.etiqueta ?? 'nivel'}${tendenciaSeries.length >= 20 ? ' (primeros 10)' : ''}`
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

export default ClienteBi;