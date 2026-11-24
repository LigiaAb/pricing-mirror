import { Box, Icon } from "@mui/material"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../../api/encryptDecrypt"
import FormularioRack from "./FormularioRack";
import useAlmacen from "../almacen/hooks/useAlmancen";
import useRack from "./hooks/useRack";
import { useEffect, useState } from "react";
import { api } from '../../../api'
import PropTypes from 'prop-types'
import FormularioFiltroRack from "./FormularioFiltroRack";
import FormularioRackCompleto from "./FormuarioRackCompleto";
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent"

const TablaRacks = () => {
    const [drawerConfig, setDrawerConfig] = useState({
        open: false,
        anchor: 'right',
        rackEditando: null,
    });
    const [drawerFiltro, setDrawerFiltro] = useState({
        open: false,
        anchor: 'right',
        rackEditando: null,
    });

    const [drawerConfigRackCompleto, setDrawerConfigRackCompleto] = useState({
        open: false,
        anchor: 'right',
        rackEditando: null,
    });

    const { almacenes } = useAlmacen()
    const { load_racks, racks, generatePDF, obtener_racksFiltrado, bodegas, rackRacks,
        tramos,
        nivels,
        espacio
    } = useRack()

    const encabezados = [
        {
            name: "ALMACEN_NOM",
            label: 'Almacén',
            campo: 'ALMACEN_NOM',
            align: 'center'
        },
        {
            name: "RACK_BOD",
            label: 'BODEGA',
            campo: 'RACK_BOD',
            align: 'center'
        },
        {
            name: "RACK_RACK",
            label: 'RACK',
            campo: 'RACK_RACK',
            align: 'center'
        }
        ,
        {
            name: "RACK_TRAMO",
            label: 'TRAMO',
            campo: 'RACK_TRAMO',
            align: 'center'
        },
        {
            name: "RACK_NIVEL",
            label: 'NIVEL',
            campo: 'RACK_NIVEL',
            align: 'center'
        },
        {
            name: "RACK_ESPACIO",
            label: 'ESPACIO',
            campo: 'RACK_ESPACIO',
            align: 'center'
        }]
    const navigate = useNavigate()

    const showRackNuevo = (anchor = 'right') => {
        setDrawerConfig({
            open: true,
            anchor,
            rackEditando: null,
        });
    };
    const showRackNuevoCompleto = (anchor = 'right') => {
        setDrawerConfigRackCompleto({
            open: true,
            anchor,
            rackEditando: null,
        });
    };
    const abrirParaEditar = (rack, anchor = 'right') => {
        setDrawerConfig({
            open: true,
            anchor,
            rackEditando: rack,
        });
    };

    const cerrarDrawer = () => {
        setDrawerConfig(prev => ({ ...prev, open: false }));
    };
    useEffect(() => {
        console.log("🔄 TablaRacks - racks actualizado:", racks.length, "elementos")
    }, [racks])
    const guardarRack = async (rackData) => {
        /* if (rackData.id) {
          // Actualizar
          setRacks(prev => prev.map(r => 
            r.id === rackData.id ? { ...r, ...rackData } : r
          ));
        } else { 
          // Crear nuevo
          const nuevoId = Math.max(...racks.map(r => r.id), 0) + 1;
          setRacks(prev => [...prev, { ...rackData, id: nuevoId }]);
        } */
        const { data } = await api.post("api/appweb/crear-rack", rackData)
        await load_racks()

        cerrarDrawer();
    }

    const [toast, setToast] = useState({
        vertical: 'top',
        horizontal: 'right',
        open: false
    })
    const { vertical, horizontal, open } = toast
    const guardarRackCompleto = async (formdData) => {
        const result = await api.post("api/appweb/crear-rackcompleto", formdData).then((i) => {
            return "success"
        }).catch((error) => {
            return error
        })
        
        console.log("SI O NO",result)
        if(result!="success"){
            console.log("cambio alo calores de estado de toast")
setToast(prev => ({...prev, open: true}))

        }
        await load_racks()

        cerrarDrawerRackCompleto()
        setTimeout(()=>{

            setToast(prev => ({...prev, open: false}))
        },2000)
    }
    const handleClose = () => {
        setToast({ ...toast, open: false });
    };

    const show_modal_filter = (value) => {
        setDrawerFiltro({
            open: true,
            anchor: 'right',
            rackEditando: null,
        });
    }

    const cerrarDrawerFiltro = () => {
        setDrawerFiltro({
            open: false,
            anchor: 'right',
            rackEditando: null,
        });
    }

    const cerrarDrawerRackCompleto = () => {
        setDrawerConfigRackCompleto({
            open: false,
            anchor: 'right',
            rackEditando: null,
        });
    }

    return (
        <Box

            sx={{ p: 1, m: 0 }}

        >
            
            {open ===true ?

                <BandaAlertaComponent tipo='error'>
                Ya existe el rack
            </BandaAlertaComponent>:""
            }
            <TablaComponent
                id="LOCALIZACION"
                useSeach={false}
                encabezado={encabezados}
                datos={racks}
                select={false}
                multipleSelect
                botones={{
                    agregar: {
                        label: "Nuevo rack completo",
                        color: 'secondary',
                        onClick: () => showRackNuevoCompleto()
                    },
                    nuevo: {
                        label: "Nueva ubicación",
                        color: 'primary',
                        onClick: () => showRackNuevo()
                    },
                    filtrar: {
                        label: <>Filtrar <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-lupa" /></>,
                        onClick: () => show_modal_filter(true),
                        color: 'secondary'
                    },
                    editar: {
                        label: <>Generar Etiquetas <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-codigo-qr" /></>,
                        onClick: () => generatePDF()
                    },
                }}
            />
            <FormularioRack
                open={drawerConfig.open}
                anchor={drawerConfig.anchor}
                initialData={drawerConfig.rackEditando || {}}
                onClose={cerrarDrawer}
                onSave={guardarRack}
                almacenes={almacenes}
            />
            <FormularioFiltroRack
                open={drawerFiltro.open}
                anchor={drawerFiltro.anchor}
                onClose={cerrarDrawerFiltro}
                initialData={drawerFiltro.rackEditando || {}}
                obtener_racksFiltrado={obtener_racksFiltrado}
                bodegas={bodegas}
                rackRacks={rackRacks}
                tramos={tramos}
                nivels={nivels}
                espacio={espacio}

            />
            <FormularioRackCompleto
                open={drawerConfigRackCompleto.open}
                anchor={drawerConfigRackCompleto.anchor}
                onClose={cerrarDrawerRackCompleto}
                initialData={drawerConfigRackCompleto.rackEditando || {}}
                almacenes={almacenes}
                onSave={guardarRackCompleto}
            />
           
        </Box>
    )
}
TablaRacks.propTypes = {
    lista: PropTypes.array
}
export default TablaRacks