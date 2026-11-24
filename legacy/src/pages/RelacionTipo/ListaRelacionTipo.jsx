import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { api } from '../../api';;
import { encryptId } from '../../api/encryptDecrypt';
import moment from 'moment/moment'
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2
};

const COLORES_ESTADOS = {
  [COD_ESTADOS.ACTIVO]: 'green.main',
  [COD_ESTADOS.INACTIVO]: 'red.main'
};


const ListaRelacionTipo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { permisosArray } = useObtenerOpcionesAcciones();

  let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
  const accionesDeTabla = {
    view: item?.acciones.some((i) => i.cod_accion === 1),
    edit: item?.acciones.some((i) => i.cod_accion === 2),
    delete: item?.acciones.some((i) => i.cod_accion === 5)
  };

  const botonesDeTabla = {};
  if (item?.acciones.some((i) => i.cod_accion === 3)) {
    botonesDeTabla.add = { label: 'nuevo', color: 'primary', onClick: () => navigate('crear') };
  };

  const [relacionesDeTipos, setRelacionesDeTipos] = useState([]);
  const [relacionDeTiposSeleccionada, setRelacionDeTiposSeleccionada] = useState(null);
  const [estados, setEstados] = useState([]);
  const [isOpenConfirmacionBorrado, setIsOpenConfirmacionBorrado] = useState(false);

  const columnas = [
    {
      label: 'Tipo',
      campo: 'tipo',
      name: 'tipo'
    },
    {
      label: 'Tabla del Tipo',
      campo: 'tipo_tabla',
      name: 'tipo_tabla'
    },
    {
      label: 'Tipo Padre',
      campo: 'tipoPadre',
      name: 'tipoPadre'
    },
    {
      label: 'Tabla del Tipo Padre',
      campo: 'tipo_padre_tabla',
      name: 'tipo_padre_tabla'
    },
    {
      label: 'Fecha de Inicio',
      campo: 'fechaInicio',
      name: 'fechaInicio'
    },
    {
      label: 'Fecha de Fin',
      campo: 'fechaFin',
      name: 'fechaFin'
    },
    {
      label: 'Estado',
      campo: 'nombreEstado',
      name: 'nombreEstado'
    },
  ];


  const [tipos, setTipos] = useState([]);


  const realcionesDeTiposConFormatoTabla = relacionesDeTipos.map(r => {
    const tipo = tipos.find(t => t.cod_tipo === r.cod_tipo);
    const tipoPadre = tipos.find(t => t.cod_tipo === r.cod_tipo_padre);
    const estado = estados.find(e => e.cod_estado === r.cod_estado);
    return {
     ...r,
      tipo: tipo?.nom_tipo,
      tipoPadre: tipoPadre?.nom_tipo,
      nombreEstado: estado?.estado_desc,
      fechaInicio: moment(r.fecha_inicio).format('DD-MM-YYYY HH:mm:ss'),
      fechaFin: r.fecha_fin ? moment(r.fecha_fin).format('DD-MM-YYYY HH:mm:ss') : 'N/A',
      accionesDeTabla,
      propiedadesDeTabla: {
        nombreEstado: {
          color: COLORES_ESTADOS[r.cod_estado]
        }
      }
    };
  });


  const obtenerRelacionesDeTipos = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-relacion-tipo';
    const response = await api.get(baseApiURL);
    const relacionesDeTipos = response.data.data;
    setRelacionesDeTipos(relacionesDeTipos);
  }, []);

  const obtenerTipos = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-tipo';
    const response = await api.get(baseApiURL);
    let tipos = response.data.data;
    tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
    setTipos(tipos);
  }, []);

  const obtenerEstados = useCallback(async () => {
    const baseApiURL = '/api/appweb/listaestados';
    const response = await api.get(baseApiURL);
    const estados = response.data.data;
    setEstados(estados);
  }, []);


  useEffect(() => {
    dispatch(encenderCarga());
    Promise.all([
      obtenerRelacionesDeTipos(),
      obtenerTipos(),
      obtenerEstados()
    ]).then(() => {
      dispatch(apagarCarga());
    });
  }, [obtenerRelacionesDeTipos, obtenerTipos, obtenerEstados, dispatch]);


  const borrarRelacionDeTipos = async () => {
    const fecha_fin = new Date();
    const COD_ESTADO_INACTIVO = 2;
    const baseApiURL = '/api/appweb/actualizar-relacion-tipo';
    const response = await api.post(baseApiURL, {
      ...relacionDeTiposSeleccionada,
      fecha_inicio: new Date(relacionDeTiposSeleccionada.fecha_inicio),
      fecha_fin: fecha_fin,
      cod_estado: COD_ESTADO_INACTIVO 
    });
    if (!response.data.data.success) return;
    setRelacionesDeTipos(prev => prev.map(r => r.cod_relacion_tipo === relacionDeTiposSeleccionada.cod_relacion_tipo ? {...r, fecha_fin, cod_estado: COD_ESTADO_INACTIVO } : r));
  };


  const handleBorearRelacionDeTipos = relacionDeTipos => {
    setRelacionDeTiposSeleccionada(relacionDeTipos);
    setIsOpenConfirmacionBorrado(true);
  };


  return (
    <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
      <Typography variant='h4'>
        Relaciónes de Tipos
      </Typography>

      <TablaComponent
          titulo='Relaciónes de Tipos'
          id='cod_relacion_tipo'
          encabezado={columnas}
          datos={realcionesDeTiposConFormatoTabla}
          botones={botonesDeTabla}
          eventosDeTabla={{
            view: ({ id: cod_relacion_tipo }) => navigate(encryptId(cod_relacion_tipo)),
            edit: ({ id: cod_relacion_tipo }) => navigate(`editar/${encryptId(cod_relacion_tipo)}`),
            delete: ({ content: relacionDeTipos }) => handleBorearRelacionDeTipos(relacionDeTipos)
          }}
      />

      <ActionAlertComponent
          tipo='error'
          content='¿Esta seguro que desea eliminar el registro?'
          openDialog={isOpenConfirmacionBorrado}
          aceptar={() => {
            borrarRelacionDeTipos();
            setIsOpenConfirmacionBorrado(false);
          }}
          cancelar={() => {
            setIsOpenConfirmacionBorrado(false);
            setRelacionDeTiposSeleccionada(null);
          }}
          handleClose={() => {
            setIsOpenConfirmacionBorrado(false);
            setRelacionDeTiposSeleccionada(null);
          }}
      />
    </Box>
  );
};

export default ListaRelacionTipo;