import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { api } from '../../../../../api';
import TransferListsComponent from '../../../../../components/Lists/TransferListsComponent';
import BandaAlertaComponent from '../../../../../components/Alertas/BandaAlertaComponent';

const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const obtenerRubrosSeleccionados = async ({
    cod_grupo_rubro
}) => {
    let baseApiURL = '/api/appweb/lista-asignacion-grupos-rubros';
    const responseRubrosDeGrupo = await api.get(baseApiURL, { params: { cod_grupo_rubro, cod_estado: CODS_ESTADOS.ACTIVO } });
    const rubrosDeGrupo = responseRubrosDeGrupo.data.data;
    rubrosDeGrupo.forEach(r => {
        r.label = r.rubro_nombre;
        r.value = r.cod_rubro;
        r.wasInitiallyAssigned = true;
    });
    return rubrosDeGrupo;
};

const obtenerRubrosDisponibles = async ({
    grupo,
    catalogoRubros
}) => {
    const { cod_empresa, cod_cc, cod_tipo_transporte, cod_tipo_servicio } = grupo;
    const params = {
        cod_empresa,
        cod_cc,
        cod_tipo_transporte,
        cod_tipo_servicio,
        cod_estado: CODS_ESTADOS.ACTIVO
    };

    // Se obtiene la plantilla de tarifas que cumple con los filtros
    let baseApiURL = '/api/appweb/lista-tarifa-plantilla';
    const responsePlantillaTarifas = await api.get(baseApiURL, { params });
    const [plantillaTarifas] = responsePlantillaTarifas.data.data;

    // Se obtienen los rubros de la plantilla obtenida
    baseApiURL = '/api/appweb/lista-plantilla-rubro';
    const responseRubrosDePlantilla = await api.get(baseApiURL, { 
        params: { 
            cod_tarifaplantilla: plantillaTarifas.cod_tarifaplantilla,
            cod_estado: CODS_ESTADOS.ACTIVO
        } 
    });
    const rubrosDePlantilla = responseRubrosDePlantilla.data.data;

    // Se obtienen los grupos de rubros segun los filtros
    baseApiURL = '/api/appweb/lista-grupos-rubros';
    const responseGruposRubros = await api.get(baseApiURL, { params });
    const gruposRubros = responseGruposRubros.data.data;

    // Se obtiene los rubros que utilizan los grupos obtenidos
    baseApiURL = '/api/appweb/lista-asignacion-grupos-rubros';
    const respuestasRubrosUtilizados = await Promise.all(
        gruposRubros.map(gr => {
            return api.get(baseApiURL, { params: { cod_grupo_rubro: gr.cod_grupo_rubro, cod_estado: CODS_ESTADOS.ACTIVO } });
        })
    );
    const rubrosUtilizados = respuestasRubrosUtilizados.map(res => res.data.data).flat();

    // Se filtran los rubros de la plantilla que no se encuentran en los rubros utilizados
    let rubrosDisponibles = rubrosDePlantilla
        .filter(r => !rubrosUtilizados.some(r2 => r2.cod_rubro === r.cod_rubro))
        .map(rd => {
            const rubro = catalogoRubros.find(r => rd.cod_rubro === r.cod_rubro);
            rubro.label = rubro.nombre;
            rubro.value = rubro.cod_rubro;
            rubro.wasInitiallyAssigned = false;
            return rubro;
        });
    
    return rubrosDisponibles;
};



const TransferListRubrosAgrupacion = ({
    grupo = null,
    catalogos = {
        rubros: []
    },
    readonly = false
}) => {
    const enabled = grupo && grupo.cod_grupo_rubro && grupo.cod_grupo_rubro !== 'new';
    const { rubros: catalogoRubros} = catalogos;

    const [rubrosDisponibles, setRubrosDisponibles] = useState([]);
    const [rubrosSeleccionados, setRubrosSeleccionados] = useState([]);


    useEffect(() => {
        if (!enabled) {
            setRubrosDisponibles([]);
            setRubrosSeleccionados([]);
            return;
        }
        const obtenerDatosIniciales = async () => {
            const [rubrosSseleccionados, rubrosDisponibles] = await Promise.all([
                obtenerRubrosSeleccionados({
                    cod_grupo_rubro: grupo.cod_grupo_rubro
                }),
                obtenerRubrosDisponibles({
                    grupo: {
                        cod_empresa: grupo.cod_empresa,
                        cod_cc: grupo.cod_cc,
                        cod_tipo_transporte: grupo.cod_tipo_transporte,
                        cod_tipo_servicio: grupo.cod_tipo_servicio
                    },
                    catalogoRubros
                })
            ]);

            setRubrosSeleccionados(rubrosSseleccionados);
            if  (grupo.cod_estado === CODS_ESTADOS.ACTIVO) {
                setRubrosDisponibles(rubrosDisponibles);
            };
        };

        obtenerDatosIniciales();
    }, [enabled, grupo?.cod_grupo_rubro, grupo?.cod_empresa, grupo?.cod_cc, grupo?.cod_tipo_transporte, grupo?.cod_tipo_servicio, grupo?.cod_estado, catalogoRubros]);


    const handleGuardarRubros = async (rubrosDisponibles, rubrosSeleccionados) => {
        const rubrosPorAsignar = rubrosSeleccionados.filter(r => !r.wasInitiallyAssigned);
        const idsRubrosPorAsignar = rubrosPorAsignar.map(r => r.cod_rubro);
        const rubrosPorDesasignar = rubrosDisponibles.filter(r => r.wasInitiallyAssigned);
        const idsRubrosPorDesasignar = rubrosPorDesasignar.map(r => r.cod_rubro);
        const baseApiURL = '/api/appweb/asignacion-masiva-grupos-rubros';
        await api.post(baseApiURL, {
            cod_grupo_rubro: grupo.cod_grupo_rubro,
            asignaciones: idsRubrosPorAsignar,
            anuladas: idsRubrosPorDesasignar
        });
    };

    return (
        <>
            <TransferListsComponent
                size={12}
                tituloListaPrincipal='Rubros Disponibles'
                listaPrincipal={rubrosDisponibles}
                tituloListaSecundaria='Rubros Seleccionados'
                listaSecundaria={rubrosSeleccionados}
                objectLabel='label'
                objectValue='cod_rubro'
                propFiltro={['nombre']}
                guardarListas={handleGuardarRubros}
                permitirPasarTodos={true}
                readonly={readonly || !grupo.cod_estado || grupo.cod_estado === CODS_ESTADOS.INACTIVO}
                mostrarBotonGuardar={true}
            />
        </>
    )
};


TransferListRubrosAgrupacion.propTypes = {
    cod_grupo_rubro: PropTypes.number,
    grupo: PropTypes.shape({
        cod_empresa: PropTypes.number,
        cod_cc: PropTypes.number,
        cod_tipo_transporte: PropTypes.number,
        cod_tipo_servicio: PropTypes.number
    }),
    catalogos: PropTypes.shape({
        rubros: PropTypes.array
    }),
    readonly: PropTypes.bool
};


export default TransferListRubrosAgrupacion;