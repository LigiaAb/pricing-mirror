import { useMemo } from "react";
import useObtenerOpcionesAcciones from "../../../../../../hooks/useObtenerOpcionesAcciones";

const useInputsFitroTarifas = ({
    empresas,
    centrosCostos,
    tiposTransporte,
    tiposServicio,
    tiposCarga,
    clasificacionesCarga,
    incoterms,
    tiposPago,
    valores,
    inputsToHide = [],
    setIsOpenDialogBusquedaProveedor,
    setIsOpenDialogCrearProveedor,
}) => {
    const { permisosArray, } = useObtenerOpcionesAcciones();
    const opcion = permisosArray.find(o => (o.nom_opcion === 'Servicios' && o.nivel_opcion === 'E' ) || (o.nom_opcion === 'Tarifas' && o.nivel_opcion === 'I' ));
    const puedeFiltrarEmpresaCentroCosto = opcion?.acciones?.some(a => a.nom_accion === 'Filtrar Empresa Centro Costo');

    const centrosCostosSeleccionables = centrosCostos.filter(cc => cc.cod_empresa_cc === valores.empresa?.value);
    const tiposServicioSeleccionables = tiposServicio.filter(ts => ts.codsTiposPadres.includes(valores.tipoTransporte?.cod_tipo));

    const inputs = useMemo(() => [
        {
            tipo: 'select',
            label: 'Empresa',
            id: 'empresa',
            options: empresas,
            val: valores.empresa,
            requerido: true,
            readonly: false,
            visible: puedeFiltrarEmpresaCentroCosto
        },
        {
            tipo: 'select',
            label: 'Centro de Costo',
            id: 'centroCosto',
            options: centrosCostosSeleccionables,
            val: valores.centroCosto,
            requerido: true,
            readonly: !valores.empresa,
            visible: puedeFiltrarEmpresaCentroCosto
        },
        {
            tipo: 'select',
            label: 'Tipo de Transporte',
            id: 'tipoTransporte',
            options: tiposTransporte,
            val: valores.tipoTransporte,
            requerido: true,
            readonly: false
        },
        {
            tipo: 'select',
            label: 'Tipo de Servicio',
            id: 'tipoServicio',
            options: tiposServicioSeleccionables,
            val: valores.tipoServicio,
            requerido: true,
            readonly: !valores.tipoTransporte,
        },
        {
            tipo: 'select',
            label: 'Tipo de Carga',
            id:  'tipoCarga',
            options: tiposCarga,
            val: valores.tipoCarga,
            requerido: false,
            readonly: false
        },
        {
            tipo: 'select',
            label: 'Clasificación de Carga',
            id:  'clasificacionCarga',
            options: clasificacionesCarga,
            val: valores.clasificacionCarga,
            requerido: false,
            readonly: false
        },
        {
            tipo: 'select',
            label: 'Incoterm',
            id:  'incoterm',
            options: incoterms,
            val: valores.incoterm,
            requerido: false,
            readonly: false
        },
        {
            tipo: 'select',
            label: 'Tipo de Pago',
            id:  'tipoPago',
            options: tiposPago,
            val: valores.tipoPago,
            requerido: false,
            readonly: false
        },
        {
            tipo: 'modalselect',
            label: 'Proveedor',
            id: 'proveedor',
            val: valores.proveedor,
            requerido: true,
            readonly: false,
            visible: !inputsToHide.includes('proveedor'),
            onBuscar: () => setIsOpenDialogBusquedaProveedor(true),
            onCrear: () => setIsOpenDialogCrearProveedor(true)
        }
    ], [valores, tiposCarga, clasificacionesCarga, tiposTransporte, tiposServicioSeleccionables, empresas, centrosCostosSeleccionables, tiposPago, incoterms, setIsOpenDialogBusquedaProveedor, setIsOpenDialogCrearProveedor, puedeFiltrarEmpresaCentroCosto, inputsToHide]);

    return inputs;
};


export default useInputsFitroTarifas;