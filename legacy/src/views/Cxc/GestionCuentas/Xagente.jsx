import { api } from '@/api'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Drawer, Paper, Typography } from '@mui/material'
import { usePersistedState } from '@/components/FiltroBi/usePersistedstate'
import { useColumnasDesdeCampo, useGroupedTree } from '@/components/FiltroBi/useGroupedTree'
import { construirNivelesDesdeConfig } from '@/components/FiltroBi/construirNivelesdesdeConfig'
import { useMonedaPorColumna } from '@/components/FiltroBi/useMonedaPorColumna'
import TablaDouble from '@/components/FiltroBi/tabledouble'
import { useFetchCentrosCosto, useFetchEmpresas } from '@/hooks/Fetch/useFetchCatalog'
import FormularioComponent from '@/components/Formulario/FormularioComponent'
// import SeguimientoDeCliente from '@/components/SeguimientoCliente/SeguimientoDeCliente' // ajustá la ruta real

const NIVELES_POR_DEFECTO = [
    { campo: 'CLIENTE', etiqueta: 'Cliente' },
    { campo: 'EMP_NOMBRE', etiqueta: 'Empresa' },
    { campo: 'DEPORG_NOMBRE', etiqueta: 'Departamento' },
    { campo: 'CXCIDS_SERDOC', etiqueta: "Serie" },
];

const Xagente = () => {

    const cencos = useFetchCentrosCosto();
    const empresa = useFetchEmpresas();

    console.log("cencos", cencos?.data)
    console.log("empresa", empresa?.data)

    const [cobros, setCobros] = useState([])
    const [cargando, setCargando] = useState(true)
    const [clientes, setClientes] = useState([])
    const [formData, setFormData] = useState({})

    // ── Drawer de seguimiento de cliente ──────────────────────────────────
    const [abrirCobroCliente, setAbrirCobroCliente] = useState(false)
    const [dataGet, setDataGet] = useState(null)

    const toggleDrawer = (valor) => () => {
        setAbrirCobroCliente(valor)
    }

    const [nivelesActivos] = usePersistedState('xagente.nivelesActivos', NIVELES_POR_DEFECTO);
    const [campoColumna] = usePersistedState('xagente.camposColumna', 'RANGO_VENCIMIENTOS');

    const obtenerCobros = useCallback(async () => {
        setCargando(true);
        try {
            const response = await api.get("api/appweb/bi_cobros_completo_v2", { params: { USUARIO: "ASAMAYOA", MONEDA: "Q" } })
            const data = response?.data?.data || [];
            setCobros(data?.datos || []);

            const catalogos = data?.catalogos || {};
            setClientes(catalogos.clientes || [])

        } catch (error) {
            setCobros([]);
            setClientes([])
        } finally {
            setCargando(false);
        }
    }, [])

    useEffect(() => {
        obtenerCobros()
    }, [obtenerCobros])

    //--------Formulario ------------------------------

    const grupos = useMemo(() => {

        const borderWidth = 1,
            borderStyle = "doted";

        return [
            { id: "Filtros obligatorios", label: "Filtros", borderWidth, borderStyle, bgcolor: "success.light", direction: "column", variant: "h6", tipo: "separador" }
        ]
    }, [])

    const libreriaInputs = useMemo(() => {
        return {
            CentroCosto: {
                grupoId: "Filtros obligatorios",
                id: "cencos_id",
                label: "Centro Costo",
                tipo: "select",
                val: "",
                options: cencos.data != null ? cencos.data.map((e) => ({ label: e.label, value: e.value })) : []
            },
            Empresa: {
                grupoId: "Filtros obligatorios",
                id: "empresa_id",
                label: "Empresa",
                tipo: "select",
                val: "",
                options: empresa.data != null ? empresa.data.map((e) => ({ label: e.label, value: e.value })) : []
            }

        }
    }, [cencos])

    const inputs = useMemo(() => {
        return Object.values(libreriaInputs)
    }, [libreriaInputs])

    const onInput = ({ id, val }) => {
        setCobros(prev => ({
            ...prev,
            [id]: val
        }))
    }


    // ── Árbol agrupado ───────────────────────────────────────────────────
    const todasLasColumnas = useColumnasDesdeCampo(cobros, campoColumna);
    const columnsFromApi = todasLasColumnas;

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
        documentos: cobros,
        niveles: NIVELES_AGRUPACION,
        columnas: columnsFromApi,
        obtenerColumnaActiva,
        obtenerValor,
        obtenerValoresDocumento,
        idDocumento
    });

    const monedaMap = useMonedaPorColumna(cobros, campoColumna);

    //-------Ver Detalles--------------

    // Por ahora solo abrimos el drawer con lo que tengamos del nodo.
    // Cuando exista la API real, acá se hace el fetch y se llena dataGet.
    const verDetalles = useCallback((node) => {
        setDataGet(node)
        setAbrirCobroCliente(true)
    }, [])

    return (
        <Box width="100%" sx={{ p: { xs: 1.5, md: 3 } }}>
            <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5 }}>
                    <FormularioComponent
                        grupos={grupos}
                        inputs={inputs}
                        onInput={onInput}
                        botones={{
                            agregar: {
                                visible: false
                            }
                        }}
                    />
                </Box>
            </Paper>
            <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                <Box sx={{ p: 2.5 }}>
                    {cargando ? (
                        <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                            Cargando datos...
                        </Typography>
                    ) : (
                        <TablaDouble
                            data={groupedData}
                            columns={columnsFromApi}
                            rowKey="id"
                            showTotals={true}
                            firstColumnWidth={250}
                            monedaMap={monedaMap}
                            acciones={[
                                {
                                    id: 'ver',
                                    tooltip: "Ver detalle",
                                    soloRaiz: true,
                                    soloHojas: false,
                                    onClick: (node) => {
                                        verDetalles(node);
                                    },
                                },
                            ]}
                        />
                    )}
                </Box>
            </Paper>

            <Drawer
                sx={{ maxWidth: "50%", "& .MuiDrawer-paper": { maxWidth: "50%" } }}
                anchor={"right"}
                open={abrirCobroCliente}
                onClose={toggleDrawer(false)}
            >
                <Box sx={{ padding: "1em" }}>

                <TablaDouble
                    data={groupedData}
                    columns={columnsFromApi}
                    rowKey="id"
                    showTotals={true}
                    firstColumnWidth={250}
                    monedaMap={monedaMap}
                    // acciones={[
                    //     {
                    //         id: 'ver',
                    //         tooltip: "Ver detalle",
                    //         soloRaiz: true,
                    //         soloHojas: false,
                    //         onClick: (node) => {
                    //             verDetalles(node);
                    //         },
                    //     },
                    // ]}
                    />
                </Box>
            </Drawer>
        </Box>
    )
}

export default Xagente