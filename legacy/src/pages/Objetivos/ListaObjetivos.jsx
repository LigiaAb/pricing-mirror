import { useState, useCallback, useEffect } from 'react';
import { api } from '../../api';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { encryptId } from '../../api/encryptDecrypt';
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import FormularioFiltrosObjetivos from '../../views/Objetivos/FormularioFiltrosObjetivos/FormularioFiltrosObjetivos';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { useSelector } from 'react-redux';


const COD_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2
};

const COLORES_ESTADOS = {
  [COD_ESTADOS.ACTIVO]: 'green.main',
  [COD_ESTADOS.INACTIVO]: 'red.main'
};



const ListaObjetivos = () => {
  const navigate = useNavigate();
  const { permisosArray } = useObtenerOpcionesAcciones();
  const { currentEmpresa, currentCentroCosto } = useSelector(state => state.menu);

  const opcion = permisosArray.find(i => i.nom_opcion === 'Lista');
  const puedeFiltrarEmpresaCentroCosto = opcion?.acciones?.some(a => a.nom_accion === 'Filtrar Empresa Centro Costo');

  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState(null);
  const [objetivos, setObjetivos] = useState([]);
  const [filtrosObjetivos, setFiltrosObjetivos] = useState(null);
  const [tiposActividades, setTiposActividades] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCostos, setCentrosCostos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [periodicidades, setPeriodicidades] = useState([]);
  const [tiposAsignacion, setTiposAsignacion] = useState([]);

  const [isOpenConfirmacionBorrado, setIsOpenConfirmacionBorrado] = useState(false);

  const columnas = [
    {
      label: 'Descripción',
      campo: 'descripcion',
      name: 'descripcion'
    },
    // {
    //   label: 'Fecha Inicial',
    //   campo: 'fecha_inicial_locale',
    //   name: 'fecha_final'
    // },
    // {
    //   label: 'Fecha Final',
    //   campo: 'fecha_final_locale',
    //   name: 'fecha_final'
    // },
    // {
    //   label: 'Cantidad',
    //   campo: 'cantidad',
    //   name: 'cantidad'
    // },
    // {
    //   label: 'Actividad',
    //   campo: 'nombreTipoActividad',
    //   name: 'nombreTipoActividad'
    // },
    {
      label: 'Tipo Asignación',
      campo: 'nombreTipoAsignacion',
      name: 'nombreTipoAsignacion'
    },
    // {
    //   label: 'Empresa',
    //   campo: 'nombreEmpresa',
    //   name: 'nombreEmpresa'
    // },
    // {
    //   label: 'Centro de Costo',
    //   campo: 'nombreCentroCosto',
    //   name: 'nombreCentroCosto'
    // },
    // {
    //   label: 'Periodicidad',
    //   campo: 'nombreTipoPeriodicidad',
    //   name: 'nombreTipoPeriodicidad'
    // },
    {
      label: 'Estado',
      campo: 'nombreEstado',
      name: 'nombreEstado'
    },
  ];


  const objetivosFiltrados = !filtrosObjetivos ? objetivos
    : objetivos.filter(o => {
      return Object.keys(filtrosObjetivos).every(key => {
        const valorFiltro = filtrosObjetivos[key];
        // Si una clave de los filtros no tiene valor o es un objeto, se considera que no hay filtro para esa clave
        if (!valorFiltro || typeof valorFiltro === 'object') return true;
        return o[key] === valorFiltro;
      });
    });


  const objtetivosConFormatoTabla = objetivosFiltrados.map(o => {
    const tipoActividad = tiposActividades.find(ta => ta.cod_tipo === o.cod_tipo_actividad);
    const empresa = empresas.find(e => e.cod_empresa === o.cod_emp);
    const centroCosto = centrosCostos.find(cc => cc.cod_cc === o.cod_cc);
    const estado = estados.find(e => e.cod_estado === o.cod_estado);
    const periodicidad = periodicidades.find(p => p.cod_periodicidad === o.cod_periodicidad);
    const tipoAsignacion = tiposAsignacion.find(ta => ta.cod_tipo === o.cod_tipo_asignacion);
    return {
      ...o,
      empresa,
      nombreTipoActividad: tipoActividad?.nom_tipo,
      nombreEmpresa: empresa?.nombre_emp,
      nombreCentroCosto: centroCosto?.nombre_cc,
      nombreEstado: estado?.estado_desc,
      nombreTipoPeriodicidad: periodicidad?.descripcion,
      nombreTipoAsignacion: tipoAsignacion?.nom_tipo,
      fecha_inicial_locale: new Date(o.fecha_inicial).toLocaleString(),
      fecha_final_locale: new Date(o.fecha_final).toLocaleString(),
      accionesDeTabla: {
        view: true,
        edit: true,
        delete: true,
      },
      propiedadesDeTabla: {
        nombreEstado: {
          color: COLORES_ESTADOS[o.cod_estado]
        }
      }
    }
  });


  const obtenerObjetivos = useCallback(async () => {
    const baseApiUrl = '/api/appweb/lista-objetivos';
    const response = await api.get(baseApiUrl, { params: { cod_cc: currentCentroCosto.cod_cc } });
    let objetivos = response.data.data;
    setObjetivos(objetivos);
  }, [currentCentroCosto.cod_cc]);

  const obtenerTiposActividad = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-tipo';
    const response = await api.get(baseApiURL, { params: { tipo_tabla: 'ACTIVIDAD' } });
    const tiposActividad = response.data.data;
    setTiposActividades(tiposActividad);
  }, []);

  const obtenerEmpresas = useCallback(async () => {
    const baseApiURL = '/api/appweb/listaempresas';
    const response = await api.get(baseApiURL);
    let empresas = response.data.data;
    empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
    setEmpresas(empresas);
  }, []);

  const obtenerCentrosCostos = useCallback(async () => {
    const baseApiURL = '/api/appweb/listacentrocosto';
    const response = await api.get(baseApiURL);
    let centrosCostos = response.data.data;
    centrosCostos = centrosCostos.map(cc => ({ ...cc, label: cc.nombre_cc, value: cc.cod_cc }));
    setCentrosCostos(centrosCostos);
  }, []);

  const obtenerPeriodicidades = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-periodicidad';
    const response = await api.get(baseApiURL, { params: { cod_estado: 1 } });
    const periodicidades = response.data.data;
    setPeriodicidades(periodicidades);
  }, []);

  const obtenerTiposAsignacion = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-tipo';
    const response = await api.get(baseApiURL, { params: { tipo_tabla: 'ASIGNACION_ENTIDAD' } });
    const tiposAsignacion = response.data.data;
    setTiposAsignacion(tiposAsignacion);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const baseApiURL = '/api/appweb/listaestados';
    const response = await api.get(baseApiURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);


  useEffect(() => {
    Promise.all([
      obtenerObjetivos(),
      obtenerTiposActividad(),
      obtenerEmpresas(),
      obtenerCentrosCostos(),
      obtenerPeriodicidades(),
      obtenerTiposAsignacion(),
      obtenerEstados()
    ]).then(() => {

    });

    setFiltrosObjetivos({
      cod_emp: currentEmpresa.cod_empresa,
      cod_cc: currentCentroCosto.cod_cc
    });
  }, [obtenerObjetivos, obtenerTiposActividad, obtenerEmpresas, obtenerCentrosCostos, obtenerPeriodicidades, obtenerTiposAsignacion, obtenerEstados]);


  const handleFiltradoObjetivos = useCallback(async filtros => {
    setFiltrosObjetivos(filtros);
  }, []);


  const borrarObjetivo = async () => {
    const COD_ESTADO_INACTIVO = 2;
    const baseApiUrl = '/api/appweb/actualizar-objetivos';
    const response = await api.post(baseApiUrl, { ...objetivoSeleccionado, cod_estado: COD_ESTADO_INACTIVO });
    if (!response.data.data.success) return;
    setObjetivos(prev => prev.map(o => o.cod_objetivo === objetivoSeleccionado.cod_objetivo ? { ...o, cod_estado: COD_ESTADO_INACTIVO } : o));

    // const baseApiURL = '/api/appweb/eliminar-objetivos';
    // const response = await api.post(baseApiURL, { cod_objetivo: objetivoSeleccionado.cod_objetivo, descripcion: '' });
    // if (!response.data.data.success) return;
    // setObjetivos(prev => prev.filter(o => o.cod_objetivo!== objetivoSeleccionado.cod_objetivo));
  };


  const handleBorrarObjetivo = (objetivo) => {
    setObjetivoSeleccionado(objetivo);
    setIsOpenConfirmacionBorrado(true);
  };


  return (
    <Box display='flex' flexDirection='column' gap={2} p={2}>
      <Typography variant='h4'>Lista de Objetivos</Typography>

      {
        puedeFiltrarEmpresaCentroCosto &&
        <FormularioFiltrosObjetivos
          defaultValues={filtrosObjetivos}
          catalogos={{
            empresas,
            centrosCostos
          }}
          onSubmit={handleFiltradoObjetivos}
        />
      }

      <TablaComponent
        titulo={'Objetivos'}
        id={'cod_objetivo'}
        encabezado={columnas}
        datos={objtetivosConFormatoTabla}
        select={false}
        eventosDeTabla={{
          view: ({ id: cod_objetivo }) => navigate(encryptId(cod_objetivo)),
          edit: ({ id: cod_objetivo }) => navigate(`editar/${encryptId(cod_objetivo)}`),
          delete: ({ content: objetivo }) => handleBorrarObjetivo(objetivo)
        }}
        botones={{
          nuevo: { label: 'nuevo', color: 'primary', onClick: () => navigate('crear') }
        }}
      />

      <ActionAlertComponent
        tipo='error'
        content='¿Esta seguro que desea eliminar el registro?'
        openDialog={isOpenConfirmacionBorrado}
        aceptar={() => {
          borrarObjetivo();
          setIsOpenConfirmacionBorrado(false);
        }}
        cancelar={() => {
          setIsOpenConfirmacionBorrado(false);
          setObjetivoSeleccionado(null);
        }}
        handleClose={() => {
          setIsOpenConfirmacionBorrado(false);
          setObjetivoSeleccionado(null);
        }}
      />
    </Box>
  )
};

export default ListaObjetivos;