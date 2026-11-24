import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Chip,
  Paper,
  Grid,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
// import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFetchCoordinacionCarga, useCoordinacionCargaCRUD, useFetchUnidadesMedida, useFetchRubros } from '../../hooks/Fetch/useFetchEmbarques';
import { useFetchPaises } from '../../hooks/Fetch/useFetchCatalog';
// Importar hooks públicos
import { useFetchPaisesPublic, useFetchRubrosPublic, useFetchUnidadesMedidaPublic } from '../../hooks/Fetch/useFetchPublic';
import { obtenerNombreCampo } from '../../constants/mapeoCampos';
import { formatearFecha } from '../../utils/formateoFechas';
import AcordeonComponent from '../AcordeonComponent/AcordeonComponent';
import FormularioComponent from '../Formulario/FormularioComponent';
import ActionAlertComponent from '../Dialog/ActionAlertComponent';
import CalculadoraDeCantidadYMedidas from '../Tarifas/CalculoTarifasSinPlantillas/CalculadoraDeCantidadYMedidas';

// Iconos temporales usando componentes Icon de Material-UI
const AddIcon = () => <span>+</span>;
const EditIcon = () => <span>✎</span>;
const DeleteIcon = () => <span>🗑</span>;

// Estados de carga
const estadosCarga = [
  { value: 1, label: "ACTIVO" },
];

// Campos iniciales del formulario
const camposIniciales = {
  EMBARQUE_ID: "", // Campo requerido por la API
  RUBRO_ID: "", // Campo requerido por la API
  BULTOS: "",
  TIPO_ID_UNIDAD_MEDIDA: "", // Campo requerido por la API
  PESO: "",
  VOLUMEN: "0", // Campo requerido por la API, valor por defecto
  METROS_CUBICOS: "0", // Campo requerido por la API, valor por defecto
  CW: "",
  VALOR: "",
  ESTADO_ID: 1,
  DESCRIPCION_CARGA: "",
  COD_PAIS_ORIGEN_CARGA: "",
  PARTIDA_ARANCELARIA: "",
  REGIMEN_ADUANAL: "",
  DEFINITIVO_GENERAL: "N",
  COD_CIUDAD_ORIGEN_CARGA: ""
};

// Estructura de columnas para la tabla
const encabezadoTabla = [
  { name: "ACCIONES", label: "ACCIONES", campo: "ACCIONES", align: "center", width: 80 },
  { name: "BULTOS", label: obtenerNombreCampo("BULTOS", "carga"), campo: "BULTOS", align: "center", width: 80 },
  { name: "TIPO_DESCRIPCION", label: obtenerNombreCampo("TIPO_DESCRIPCION", "carga"), campo: "TIPO_DESCRIPCION", width: 120 },
  { name: "PESO", label: obtenerNombreCampo("PESO", "carga"), campo: "PESO", align: "center", width: 80 },
  { name: "VOLUMEN", label: obtenerNombreCampo("VOLUMEN", "carga"), campo: "VOLUMEN", align: "center", width: 80 },
  { name: "METROS_CUBICOS", label: obtenerNombreCampo("METROS_CUBICOS", "carga"), campo: "METROS_CUBICOS", align: "center", width: 120 },
  { name: "CW", label: obtenerNombreCampo("CW", "carga"), campo: "CW", align: "center", width: 80 },
  { name: "VALOR", label: obtenerNombreCampo("VALOR", "carga"), campo: "VALOR", align: "center", width: 80 },
  { name: "ESTADO_DESCRIPCION", label: obtenerNombreCampo("ESTADO_DESCRIPCION", "carga"), campo: "ESTADO_DESCRIPCION", width: 120 },
  { name: "DESCRIPCION_CARGA", label: obtenerNombreCampo("DESCRIPCION_CARGA", "carga"), campo: "DESCRIPCION_CARGA", width: 150 },
  { name: "PARTIDA_ARANCELARIA", label: obtenerNombreCampo("PARTIDA_ARANCELARIA", "carga"), campo: "PARTIDA_ARANCELARIA", width: 120 },
  { name: "REGIMEN_ADUANAL", label: obtenerNombreCampo("REGIMEN_ADUANAL", "carga"), campo: "REGIMEN_ADUANAL", width: 120 },
  { name: "DEFINITIVO_GENERAL", label: obtenerNombreCampo("DEFINITIVO_GENERAL", "carga"), campo: "DEFINITIVO_GENERAL", align: "center", width: 120 },
  { name: "FECHA_REGISTRO", label: obtenerNombreCampo("FECHA_REGISTRO", "carga"), campo: "FECHA_REGISTRO", align: "center", width: 120 },
];

const CantidadesMedidas = ({
  embarqueId,
  esModoPublico = false,
  onDatosCalculados,
  // Props para datos del formulario instructivo
  codPaisOrigen = null, // Código de país de origen desde la cotización (COD_PAIS_ORIGEN)
  partidaArancelaria = '', // Partida arancelaria desde el formulario
  regimenAduanal = '', // Régimen aduanal desde el formulario
  definitivo = false, // Checkbox definitivo del formulario (boolean)
  cwCotizacion = '', // CW (Chargeable Weight) desde la cotización
  valorCotizacion = '', // Valor desde la cotización
  rubroIdCotizacion = null, // Rubro ID desde la cotización
  // Props opcionales para datos compartidos (evita llamadas duplicadas)
  paisesProp = null, // Paises desde el componente padre
  unidadesMedidaProp = null, // Unidades de medida desde el componente padre
  rubrosProp = null // Rubros desde el componente padre
}) => {
  // Hooks para datos - Solo cargar si existe embarqueId y NO es modo público
  const { data: cargas, isLoading, error, refetch } = useFetchCoordinacionCarga(esModoPublico ? null : embarqueId, null);
  const { insertarCoordinacionCarga, actualizarCoordinacionCarga, eliminarCoordinacionCarga } = useCoordinacionCargaCRUD(esModoPublico ? null : embarqueId, null);
  
  // Usar datos pasados como props si están disponibles, de lo contrario usar hooks
  // Esto evita llamadas duplicadas cuando los datos ya están disponibles en el componente padre
  // IMPORTANTE: En modo público, NO hacer llamadas a /api/appweb/ - solo usar APIs públicas o props
  // En modo público, siempre false para evitar llamadas a /api/appweb/
  const shouldFetchPaises = !paisesProp && !esModoPublico;
  const shouldFetchUnidadesMedida = !unidadesMedidaProp && !esModoPublico;
  const shouldFetchRubros = !rubrosProp && !esModoPublico;
  
  // IMPORTANTE: Los hooks siempre deben llamarse en el mismo orden para cumplir con las reglas de React
  // En modo público, usar solo hooks públicos. En modo privado, usar solo hooks privados
  // Siempre llamar a los hooks, pero deshabilitarlos cuando no se necesiten
  
  // Hook público (solo se usa en modo público, siempre deshabilitado porque los datos vienen de props)
  const { data: paisesPublicos, isLoading: isLoadingPaisesPublicos } = useFetchPaisesPublic({}, { enabled: false });
  
  // Hook privado (solo se usa en modo privado, habilitado solo si se necesitan datos y hay props)
  const { data: paisesPrivados, isLoading: isLoadingPaisesPrivados } = useFetchPaises({}, { enabled: shouldFetchPaises });
  
  // Seleccionar datos según el modo
  const paisesFromHook = esModoPublico ? paisesPublicos : paisesPrivados;
  const isLoadingPaises = esModoPublico ? isLoadingPaisesPublicos : isLoadingPaisesPrivados;
  
  // Hook público (solo se usa en modo público, siempre deshabilitado porque los datos vienen de props)
  const { data: unidadesMedidaPublicas, isLoading: isLoadingUnidadesMedidaPublicas } = useFetchUnidadesMedidaPublic({ enabled: false });
  
  // Hook privado (solo se usa en modo privado, habilitado solo si se necesitan datos)
  // IMPORTANTE: En modo público, SIEMPRE deshabilitado para evitar llamadas a /api/appweb/
  // Forzar que en modo público nunca se ejecute, incluso si shouldFetchUnidadesMedida es true
  const enabledUnidadesMedida = esModoPublico ? false : shouldFetchUnidadesMedida;
  const { data: unidadesMedidaPrivadas, isLoading: isLoadingUnidadesMedidaPrivadas } = useFetchUnidadesMedida({ enabled: enabledUnidadesMedida });
  
  // Seleccionar datos según el modo
  const unidadesMedidaFromHook = esModoPublico ? unidadesMedidaPublicas : unidadesMedidaPrivadas;
  const isLoadingUnidadesMedida = esModoPublico ? isLoadingUnidadesMedidaPublicas : isLoadingUnidadesMedidaPrivadas;
  
  // Hook público (solo se usa en modo público, siempre deshabilitado porque los datos vienen de props)
  const { data: rubrosPublicos, isLoading: isLoadingRubrosPublicos } = useFetchRubrosPublic({}, { enabled: false });
  
  // Hook privado (solo se usa en modo privado, habilitado solo si se necesitan datos)
  // IMPORTANTE: En modo público, SIEMPRE deshabilitado para evitar llamadas a /api/appweb/
  // Forzar que en modo público nunca se ejecute, incluso si shouldFetchRubros es true
  const enabledRubros = esModoPublico ? false : shouldFetchRubros;
  const { data: rubrosPrivados, isLoading: isLoadingRubrosPrivados } = useFetchRubros({ enabled: enabledRubros });
  
  // Seleccionar datos según el modo
  const rubrosFromHook = esModoPublico ? rubrosPublicos : rubrosPrivados;
  const isLoadingRubros = esModoPublico ? isLoadingRubrosPublicos : isLoadingRubrosPrivados;
  
  // Usar props si están disponibles, de lo contrario usar datos del hook
  const paises = paisesProp ?? paisesFromHook;
  const unidadesMedida = unidadesMedidaProp ?? unidadesMedidaFromHook;
  const rubros = rubrosProp ?? rubrosFromHook;

  // Estados del formulario
  const [nuevaCarga, setNuevaCarga] = useState(camposIniciales);
  const [errorForm, setErrorForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cargaSeleccionada, setCargaSeleccionada] = useState(null);
  
  // Estados para los acordeones
  const [isAcordeonControlCargaExpanded, setIsAcordeonControlCargaExpanded] = useState(true);
  const [isAcordeonFormularioExpanded, setIsAcordeonFormularioExpanded] = useState(false);
  
  // Estados para el modal de cálculo
  const [modalCalculoOpen, setModalCalculoOpen] = useState(false);
  const [datosControlCarga, setDatosControlCarga] = useState({
    unidadMedida: "",
    largo: "",
    ancho: "",
    alto: "",
    unidadPeso: "",
    pesoUnitario: "",
    cantidad: "",
    pesoKgResultado: "",
    volumenResultado: ""
  });

  // Estado para la tabla de items del control de carga
  const [itemsControlCarga, setItemsControlCarga] = useState([]);
  
  // Estados para la cola de cargas
  const [cargasEnCola, setCargasEnCola] = useState([]);
  const [procesandoCola, setProcesandoCola] = useState(false);
  const [colaProcesada, setColaProcesada] = useState(false);
  
  // Estados para ActionAlertComponent
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [cargaToDelete, setCargaToDelete] = useState(null);
  const [isEliminando, setIsEliminando] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key para resetear FormularioComponent
  const [controlCargaFormKey, setControlCargaFormKey] = useState(0); // Key para resetear FormularioComponent del control de carga

  // Pre-llenar campos con datos de la cotización cuando estén disponibles
  useEffect(() => {
    setNuevaCarga(prev => ({
      ...prev,
      CW: cwCotizacion || prev.CW || '',
      VALOR: valorCotizacion || prev.VALOR || '',
      RUBRO_ID: rubroIdCotizacion || prev.RUBRO_ID || '',
    }));
  }, [cwCotizacion, valorCotizacion, rubroIdCotizacion]);

  // Normalizar los datos para asegurar que las claves coincidan con el encabezado
  const datosTabla = useMemo(() => {
    if (!cargas || !Array.isArray(cargas)) {
      return [];
    }
    
    // Filtrar solo las cargas que NO tienen emb_legs_id (cargas generales del embarque)
    const cargasGenerales = cargas.filter(carga => {
      const tieneLegsId = carga.EMB_LEGS_ID || carga.emb_legs_id;
      const esCargaGeneral = !tieneLegsId || tieneLegsId === "" || tieneLegsId === null;
      return esCargaGeneral;
    });
    
    return cargasGenerales.map((carga) => {
      // Crear un objeto con las claves exactas que espera el encabezado
      const cargaNormalizada = {
        EMB_CARGA_ID: carga.EMB_CARGA_ID || carga.emb_carga_id || carga.id,
        EMBARQUE_ID: carga.EMBARQUE_ID || carga.embarque_id,
        COD_FILE: carga.COD_FILE || carga.cod_file,
        EMB_LEGS_ID: carga.EMB_LEGS_ID || carga.emb_legs_id,
        BULTOS: carga.BULTOS || carga.bultos,
        TIPO_ID_UNIDAD_MEDIDA: carga.TIPO_ID_UNIDAD_MEDIDA || carga.tipo_id_unidad_medida,
        TIPO_DESCRIPCION: carga.TIPO_DESCRIPCION || carga.tipo_descripcion,
        PESO: carga.PESO || carga.peso,
        VOLUMEN: carga.VOLUMEN || carga.volumen,
        METROS_CUBICOS: carga.METROS_CUBICOS || carga.metros_cubicos,
        CW: carga.CW || carga.cw,
        VALOR: carga.VALOR || carga.valor,
        ESTADO_ID: carga.ESTADO_ID || carga.estado_id,
        ESTADO_DESCRIPCION: carga.ESTADO_DESCRIPCION || carga.estado_descripcion,
        DESCRIPCION_CARGA: carga.DESCRIPCION_CARGA || carga.descripcion_carga || "",
        PARTIDA_ARANCELARIA: carga.PARTIDA_ARANCELARIA || carga.partida_arancelaria || "",
        REGIMEN_ADUANAL: carga.REGIMEN_ADUANAL || carga.regimen_aduanal || "",
        DEFINITIVO_GENERAL: (carga.DEFINITIVO_GENERAL || carga.definitivo_general || "N") === "S" ? "SI" : "NO",
        FECHA_REGISTRO: formatearFecha(carga.FECHA_REGISTRO || carga.fecha_registro),
        ACCIONES: (
          <Tooltip title="VER O EDITAR CARGA" placement="top">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleSeleccionarCarga(cargaNormalizada)}
              sx={{ 
                p: 0.5,
                borderRadius: 1,
                "&:hover": { 
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText"
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        )
      };
      
      return cargaNormalizada;
    });
  }, [cargas]);

  const limpiarFormulario = () => {
    setNuevaCarga({
      ...camposIniciales,
      EMBARQUE_ID: embarqueId?.toString() || "" // Mantener el EMBARQUE_ID al limpiar
    });
    setCargaSeleccionada(null);
    setErrorForm(null);
    setItemsControlCarga([]); // Limpiar también la tabla de items del control de carga
    setFormKey(prev => prev + 1); // Resetear FormularioComponent
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaCarga((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "COD_PAIS_ORIGEN_CARGA" ? { COD_CIUDAD_ORIGEN_CARGA: "" } : {})
    }));
  };

  // Funciones para el modal de control de carga
  const handleChangeControlCarga = (e) => {
    const { name, value } = e.target;
    setDatosControlCarga(prev => {
      const newData = { ...prev, [name]: value };
      
      // Limpiar resultados calculados cuando se cambien los datos de entrada
      if (['largo', 'ancho', 'alto', 'pesoUnitario', 'cantidad', 'unidadMedida'].includes(name)) {
        newData.pesoKgResultado = '';
        newData.volumenResultado = '';
      }
      
      return newData;
    });
  };

  const calcularPesoYVolumen = () => {
    const { largo, ancho, alto, pesoUnitario, cantidad, unidadMedida } = datosControlCarga;
    
    // Validar que todos los campos requeridos estén presentes y sean números válidos
    if (largo && ancho && alto && pesoUnitario && cantidad && unidadMedida) {
      const largoNum = parseFloat(largo);
      const anchoNum = parseFloat(ancho);
      const altoNum = parseFloat(alto);
      const pesoUnitarioNum = parseFloat(pesoUnitario);
      const cantidadNum = parseFloat(cantidad);
      
      // Verificar que todos los valores sean números válidos y positivos
      if (isNaN(largoNum) || isNaN(anchoNum) || isNaN(altoNum) || isNaN(pesoUnitarioNum) || isNaN(cantidadNum) ||
          largoNum <= 0 || anchoNum <= 0 || altoNum <= 0 || pesoUnitarioNum <= 0 || cantidadNum <= 0) {
        setDatosControlCarga(prev => ({
          ...prev,
          pesoKgResultado: '',
          volumenResultado: ''
        }));
        return;
      }
      
      // Calcular peso total en kg
      const pesoTotal = pesoUnitarioNum * cantidadNum;
      
      // Calcular volumen: largo * ancho * alto (sin multiplicar por cantidad)
      const volumen = largoNum * anchoNum * altoNum;
      
      setDatosControlCarga(prev => ({
        ...prev,
        pesoKgResultado: pesoTotal.toFixed(2),
        volumenResultado: volumen.toFixed(4)
      }));
    } else {
      // Limpiar resultados si faltan datos
      setDatosControlCarga(prev => ({
        ...prev,
        pesoKgResultado: '',
        volumenResultado: ''
      }));
    }
  };

  // Función para limpiar el control de carga
  const limpiarControlCarga = () => {
    setDatosControlCarga({
      unidadMedida: "",
      largo: "",
      ancho: "",
      alto: "",
      unidadPeso: "",
      pesoUnitario: "",
      cantidad: "",
      pesoKgResultado: "",
      volumenResultado: ""
    });
    setControlCargaFormKey(prev => prev + 1); // Resetear FormularioComponent del control de carga
  };

  const agregarATabla = () => {
    // Obtener el label de la unidad de medida seleccionada
    const unidadMedidaLabel = datosControlCarga.unidadMedida ? 
      unidadesMedida?.find(unidad => unidad.value === datosControlCarga.unidadMedida)?.label || datosControlCarga.unidadMedida : "";
    
    // Obtener el value de la unidad de medida para la API
    const unidadMedidaValue = datosControlCarga.unidadMedida ? 
      unidadesMedida?.find(unidad => unidad.value === datosControlCarga.unidadMedida)?.value || datosControlCarga.unidadMedida : "";
    
    // Crear un nuevo item con los datos calculados del modal
    // Usar datos del formulario instructivo si están disponibles, sino usar los del formulario interno
    const nuevoItem = {
      id: Date.now(), // ID temporal para identificación
      BULTOS: datosControlCarga.cantidad,
      PESO: datosControlCarga.pesoKgResultado,
      VOLUMEN: datosControlCarga.volumenResultado,
      METROS_CUBICOS: datosControlCarga.volumenResultado,
      TIPO_ID_UNIDAD_MEDIDA: unidadMedidaLabel,
      DESCRIPCION_CARGA: nuevaCarga.DESCRIPCION_CARGA || "Item de carga",
      // Usar partidaArancelaria del formulario instructivo si está disponible, sino del formulario interno
      PARTIDA_ARANCELARIA: partidaArancelaria || nuevaCarga.PARTIDA_ARANCELARIA || "",
      // Usar regimenAduanal del formulario instructivo si está disponible, sino del formulario interno
      REGIMEN_ADUANAL: regimenAduanal || nuevaCarga.REGIMEN_ADUANAL || "",
      // Usar codPaisOrigen del formulario instructivo si está disponible, sino del formulario interno
      COD_PAIS_ORIGEN_CARGA: codPaisOrigen ? String(codPaisOrigen) : (nuevaCarga.COD_PAIS_ORIGEN_CARGA || ""),
      // Usar definitivo del formulario instructivo (convertir boolean a "S"/"N"), sino del formulario interno
      DEFINITIVO_GENERAL: definitivo ? "S" : (nuevaCarga.DEFINITIVO_GENERAL || "N"),
      largo: datosControlCarga.largo,
      ancho: datosControlCarga.ancho,
      alto: datosControlCarga.alto,
      unidadMedida: datosControlCarga.unidadMedida,
      pesoUnitario: datosControlCarga.pesoUnitario,
      unidadPeso: datosControlCarga.unidadPeso
    };
    
    // Crear datos para la cola de cargas (formato API)
    // Usar datos del formulario instructivo si están disponibles, sino usar los del formulario interno
    const cargaParaCola = {
      id: Date.now(),
      rubro_id: nuevaCarga.RUBRO_ID || 0,
      bultos: parseInt(datosControlCarga.cantidad) || 0,
      cod_tipo_unidad_medidad: parseInt(unidadMedidaValue) || 0,
      peso: parseFloat(datosControlCarga.pesoKgResultado) || 0,
      volumen: parseFloat(datosControlCarga.volumenResultado) || 0,
      metros_cubicos: parseFloat(datosControlCarga.volumenResultado) || 0,
      char_w: parseFloat(nuevaCarga.CW) || 0,
      valor: parseFloat(nuevaCarga.VALOR) || 0,
      estado_cod: parseInt(nuevaCarga.ESTADO_ID) || 1,
      descripcion_carga: nuevaCarga.DESCRIPCION_CARGA || "Item de carga",
      // Usar codPaisOrigen del formulario instructivo si está disponible, sino del formulario interno
      cod_pais_origen_carga: codPaisOrigen ? parseInt(codPaisOrigen) : (parseInt(nuevaCarga.COD_PAIS_ORIGEN_CARGA) || 0),
      // Usar partidaArancelaria del formulario instructivo si está disponible, sino del formulario interno
      partida_arancelaria: partidaArancelaria || nuevaCarga.PARTIDA_ARANCELARIA || "",
      // Usar regimenAduanal del formulario instructivo si está disponible, sino del formulario interno
      regimen_aduanal: regimenAduanal || nuevaCarga.REGIMEN_ADUANAL || "",
      // Usar definitivo del formulario instructivo (convertir boolean a "S"/"N"), sino del formulario interno
      definitivo_general: definitivo ? "S" : (nuevaCarga.DEFINITIVO_GENERAL || "N"),
      emb_legs_id: null
    };
    
    // Agregar el item a la tabla de visualización
    setItemsControlCarga(prev => [...prev, nuevoItem]);
    
    // Agregar la carga a la cola para procesamiento automático
    setCargasEnCola(prev => [...prev, cargaParaCola]);
    
    // Limpiar datos del control de carga
    setDatosControlCarga({
      unidadMedida: "",
      largo: "",
      ancho: "",
      alto: "",
      unidadPeso: "",
      pesoUnitario: "",
      cantidad: "",
      pesoKgResultado: "",
      volumenResultado: ""
    });
    setControlCargaFormKey(prev => prev + 1); // Resetear FormularioComponent del control de carga
    
    // Cerrar el modal
    setModalCalculoOpen(false);
    
    // Abrir el acordeón del formulario principal
    setIsAcordeonFormularioExpanded(true);
    
    // Hacer scroll hacia el formulario principal después de un pequeño delay
    setTimeout(() => {
      const formularioElement = document.querySelector('[data-acordeon-formulario]');
      if (formularioElement) {
        formularioElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Función para manejar los datos de la calculadora CalculadoraDeCantidadYMedidas
  // La calculadora pasa 3 argumentos: (facturableKg, totales, valores)
  // - facturableKg: { valor, tipo, mostrar }
  // - totales: { volumenTotal, pesoTotal }
  // - valores: array de items con cantidad, volumen, peso, etc.
  const handleAgregarDesdeCalculadora = (datosCalculadora, totalesCalculados, valoresItems) => {
    // Manejar ambas firmas: (facturableKg, totales, valores) o legacy (facturableKg, valores)
    const valores = Array.isArray(totalesCalculados) ? totalesCalculados : valoresItems;
    const totales = Array.isArray(totalesCalculados) ? {} : totalesCalculados;

    // Extraer totales desde datosCalculadora (facturableKg)
    const facturableKg = datosCalculadora?.valor || 0;
    const tipoFacturable = datosCalculadora?.tipo || '';

    // Calcular totales desde los valores o usar los totales pasados directamente
    const totalVolumen = totales?.volumenTotal || valores?.reduce((acc, v) => acc + (parseFloat(v.volumenTotal) || 0), 0) || 0;
    const totalPeso = totales?.pesoTotal || valores?.reduce((acc, v) => acc + (parseFloat(v.pesoTotal) || 0), 0) || 0;
    const totalBultos = valores?.reduce((acc, v) => acc + (parseInt(v.cantidad) || 0), 0) || 0;

    // Obtener unidades del primer item (si existe)
    const primerItem = valores?.[0];
    const unidadMedidaObj = primerItem?.unidadMedida;
    const unidadPesoObj = primerItem?.unidadPeso;

    // Obtener el código de unidad de medida
    const unidadMedidaLabel = unidadMedidaObj?.tipo_desc || unidadMedidaObj?.label || '';
    const unidadMedidaValue = unidadMedidaObj?.value || unidadMedidaObj?.cod_tipo || 157; // 157 = KILOGRAMOS por defecto
    const unidadPesoLabel = unidadPesoObj?.tipo_desc || unidadPesoObj?.label || 'KG';

    // Calcular CW (kilos volumétricos) y VALOR (el mayor entre peso y kg volumétricos)
    // facturableKg ya contiene el mayor de los dos valores
    const kilosVolumetricos = tipoFacturable === 'KILOS VOLUMETRICOS' ? facturableKg : parseFloat(totalVolumen) / 6000;
    const valorFacturable = Math.max(parseFloat(totalPeso) || 0, facturableKg || 0);

    // Crear un nuevo item con los datos calculados de la calculadora
    const nuevoItem = {
      id: Date.now(),
      BULTOS: totalBultos,
      PESO: totalPeso,
      VOLUMEN: totalVolumen,
      METROS_CUBICOS: totalVolumen,
      TIPO_ID_UNIDAD_MEDIDA: unidadMedidaLabel,
      DESCRIPCION_CARGA: nuevaCarga.DESCRIPCION_CARGA || "Item de carga",
      PARTIDA_ARANCELARIA: partidaArancelaria || nuevaCarga.PARTIDA_ARANCELARIA || "",
      REGIMEN_ADUANAL: regimenAduanal || nuevaCarga.REGIMEN_ADUANAL || "",
      COD_PAIS_ORIGEN_CARGA: codPaisOrigen ? String(codPaisOrigen) : (nuevaCarga.COD_PAIS_ORIGEN_CARGA || ""),
      DEFINITIVO_GENERAL: definitivo ? "S" : (nuevaCarga.DEFINITIVO_GENERAL || "N"),
      unidadMedida: unidadMedidaLabel,
      unidadPeso: unidadPesoLabel,
      // Guardar detalles de los valores calculados para referencia
      detalleValores: valores,
      facturableKg: facturableKg, // Kg volumétricos calculados por la calculadora
      tipoFacturable: tipoFacturable, // Tipo: "KILOGRAMOS" o "KILOS VOLUMETRICOS"
      CW: facturableKg, // Chargeable Weight (kilos volumétricos)
      VALOR: valorFacturable // Valor facturable (mayor entre peso y kg volumétricos)
    };

    // Crear datos para la cola de cargas (formato API insertar-coordinacion-carga)
    const cargaParaCola = {
      id: Date.now(),
      rubro_id: parseInt(nuevaCarga.RUBRO_ID) || 30, // Rubro por defecto: 30 (coordinación de carga)
      bultos: totalBultos,
      cod_tipo_unidad_medidad: parseInt(unidadMedidaValue) || 157,
      peso: parseFloat(totalPeso) || 0,
      volumen: parseFloat(totalVolumen) || 0,
      metros_cubicos: parseFloat(totalVolumen) || 0,
      char_w: parseFloat(facturableKg) || 0, // CW = kilos volumétricos (facturableKg de la calculadora)
      valor: valorFacturable, // VALOR = mayor entre peso y kg volumétricos
      estado_cod: parseInt(nuevaCarga.ESTADO_ID) || 1,
      descripcion_carga: nuevaCarga.DESCRIPCION_CARGA || "Item de carga",
      cod_pais_origen_carga: codPaisOrigen ? parseInt(codPaisOrigen) : (parseInt(nuevaCarga.COD_PAIS_ORIGEN_CARGA) || 0),
      partida_arancelaria: partidaArancelaria || nuevaCarga.PARTIDA_ARANCELARIA || "",
      regimen_aduanal: regimenAduanal || nuevaCarga.REGIMEN_ADUANAL || "",
      definitivo_general: definitivo ? "S" : (nuevaCarga.DEFINITIVO_GENERAL || "N"),
      emb_legs_id: null
    };

    // Agregar el item a la tabla de visualización
    setItemsControlCarga(prev => [...prev, nuevoItem]);

    // Agregar la carga a la cola para procesamiento automático
    setCargasEnCola(prev => [...prev, cargaParaCola]);

    // Cerrar el modal
    setModalCalculoOpen(false);

    // Abrir el acordeón del formulario principal
    setIsAcordeonFormularioExpanded(true);
  };

  // Recalcular automáticamente cuando cambien los datos relevantes
  useEffect(() => {
    const { largo, ancho, alto, pesoUnitario, cantidad, unidadMedida } = datosControlCarga;
    if (largo && ancho && alto && pesoUnitario && cantidad && unidadMedida) {
      // Solo recalcular si todos los campos están completos
      const largoNum = parseFloat(largo);
      const anchoNum = parseFloat(ancho);
      const altoNum = parseFloat(alto);
      const pesoUnitarioNum = parseFloat(pesoUnitario);
      const cantidadNum = parseFloat(cantidad);
      
      if (!isNaN(largoNum) && !isNaN(anchoNum) && !isNaN(altoNum) && !isNaN(pesoUnitarioNum) && !isNaN(cantidadNum) &&
          largoNum > 0 && anchoNum > 0 && altoNum > 0 && pesoUnitarioNum > 0 && cantidadNum > 0) {
        calcularPesoYVolumen();
      }
    }
  }, [datosControlCarga.largo, datosControlCarga.ancho, datosControlCarga.alto, datosControlCarga.pesoUnitario, datosControlCarga.cantidad, datosControlCarga.unidadMedida]);

  // Actualizar automáticamente los campos del formulario principal cuando cambie itemsControlCarga
  useEffect(() => {
    if (itemsControlCarga.length > 0) {
      const totalBultos = itemsControlCarga.reduce((total, item) => {
        const cantidad = parseInt(item.BULTOS) || 0;
        return total + cantidad;
      }, 0);

      const totalPeso = itemsControlCarga.reduce((total, item) => {
        const peso = parseFloat(item.PESO) || parseFloat(item.pesoUnitario) || 0;
        return total + peso;
      }, 0);

      const totalVolumen = itemsControlCarga.reduce((total, item) => {
        const vol = parseFloat(item.volumenResultado || item.VOLUMEN) || 0;
        return total + vol;
      }, 0);

      // Calcular kilos volumétricos (CW) - usar CW del item si existe, sino calcular desde facturableKg
      const totalKilosVolumetricos = itemsControlCarga.reduce((total, item) => {
        // Preferir CW del item (calculado en handleAgregarDesdeCalculadora), sino usar facturableKg
        const kgVol = parseFloat(item.CW) || parseFloat(item.facturableKg) || 0;
        return total + kgVol;
      }, 0);

      // El VALOR es el mayor entre peso y kilos volumétricos
      // También sumar VALOR de cada item si existe
      const totalValorItems = itemsControlCarga.reduce((total, item) => {
        const val = parseFloat(item.VALOR) || 0;
        return total + val;
      }, 0);
      const valorFacturable = totalValorItems > 0 ? totalValorItems : Math.max(totalPeso, totalKilosVolumetricos);

      // Obtener la unidad de medida del primer item (asumiendo que todos tienen la misma)
      const unidadMedidaValue = itemsControlCarga.length > 0 ? itemsControlCarga[0].TIPO_ID_UNIDAD_MEDIDA : "";
      // Buscar el label correspondiente al value
      const unidadMedidaLabel = unidadMedidaValue ?
        unidadesMedida?.find(unidad => unidad.value === unidadMedidaValue)?.label || unidadMedidaValue : "";

      // Asegurar que el value sea numérico y válido
      const unidadMedidaValueNumerico = unidadMedidaValue && !isNaN(parseInt(unidadMedidaValue))
        ? parseInt(unidadMedidaValue)
        : 157; // Valor por defecto: 157 = KILOGRAMOS


      const datosCalculados = {
        BULTOS: totalBultos.toString(),
        PESO: totalPeso.toFixed(2),
        VOLUMEN: totalVolumen.toFixed(4),
        METROS_CUBICOS: totalVolumen.toFixed(4),
        TIPO_ID_UNIDAD_MEDIDA: unidadMedidaValueNumerico, // Asegurar que sea numérico
        TIPO_ID_UNIDAD_MEDIDA_LABEL: unidadMedidaLabel,
        CW: totalKilosVolumetricos.toFixed(2),          // Kilos volumétricos
        VALOR: valorFacturable.toFixed(2),               // Valor facturable (mayor entre peso y kg vol)
        RUBRO_ID: "30"                                   // Rubro por defecto
      };

      setNuevaCarga(prev => ({
        ...prev,
        ...datosCalculados
      }));

      // Pasar los datos calculados al formulario padre si existe el callback
      if (onDatosCalculados && typeof onDatosCalculados === 'function') {
        onDatosCalculados(datosCalculados);
      }
    } else {
      // Si no hay items, limpiar los campos
      const datosVacios = {
        BULTOS: "",
        PESO: "",
        VOLUMEN: "0",
        METROS_CUBICOS: "0",
        TIPO_ID_UNIDAD_MEDIDA: 157, // Valor por defecto: 157 = KILOGRAMOS
        TIPO_ID_UNIDAD_MEDIDA_LABEL: "",
        CW: "0",
        VALOR: "0",
        RUBRO_ID: "30"
      };

      setNuevaCarga(prev => ({
        ...prev,
        ...datosVacios
      }));

      // Pasar los datos vacíos al formulario padre si existe el callback
      if (onDatosCalculados && typeof onDatosCalculados === 'function') {
        onDatosCalculados(datosVacios);
      }
    }
  }, [itemsControlCarga, onDatosCalculados, unidadesMedida]);

  // Establecer el EMBARQUE_ID cuando el componente se inicialice
  useEffect(() => {
    if (embarqueId) {
      setNuevaCarga(prev => ({
        ...prev,
        EMBARQUE_ID: embarqueId.toString()
      }));
    }
  }, [embarqueId]);

  // Procesar automáticamente la cola de cargas cuando se cree el embarque
  useEffect(() => {
    const procesarColaDeCargas = async () => {
      if (embarqueId && cargasEnCola.length > 0 && !colaProcesada && !procesandoCola) {
        setProcesandoCola(true);
        console.log('Procesando cola de cargas automáticamente...', cargasEnCola);
        
        try {
          // Procesar cada carga en la cola
          for (const cargaEnCola of cargasEnCola) {
            const datosCarga = {
              embarque_id: parseInt(embarqueId),
              rubro_id: parseInt(cargaEnCola.rubro_id) || 0,
              bultos: parseInt(cargaEnCola.bultos) || 0,
              cod_tipo_unidad_medidad: parseInt(cargaEnCola.cod_tipo_unidad_medidad) || 0,
              peso: parseFloat(cargaEnCola.peso) || 0,
              volumen: parseFloat(cargaEnCola.volumen) || 0,
              metros_cubicos: parseFloat(cargaEnCola.metros_cubicos) || 0,
              char_w: parseFloat(cargaEnCola.char_w) || 0,
              valor: parseFloat(cargaEnCola.valor) || 0,
              estado_cod: parseInt(cargaEnCola.estado_cod) || 1,
              descripcion_carga: cargaEnCola.descripcion_carga || "",
              // Los valores ya vienen correctos desde agregarATabla (que usa los props del formulario instructivo)
              cod_pais_origen_carga: parseInt(cargaEnCola.cod_pais_origen_carga) || 0,
              partida_arancelaria: cargaEnCola.partida_arancelaria || "",
              regimen_aduanal: cargaEnCola.regimen_aduanal || "",
              definitivo_general: cargaEnCola.definitivo_general || "N",
              emb_legs_id: null
            };
            
            await insertarCoordinacionCarga(datosCarga);
            console.log('Carga creada automáticamente:', datosCarga);
          }
          
          setColaProcesada(true);
          setCargasEnCola([]); // Limpiar la cola después de procesar
          console.log('Todas las cargas de la cola han sido procesadas');
          
        } catch (error) {
          console.error('Error al procesar la cola de cargas:', error);
          setErrorForm('Error al crear las cargas automáticamente: ' + error.message);
        } finally {
          setProcesandoCola(false);
        }
      }
    };

    procesarColaDeCargas();
  }, [embarqueId, cargasEnCola, colaProcesada, procesandoCola, insertarCoordinacionCarga]);

  // Mostrar mensaje informativo si no hay embarqueId, pero permitir funcionalidad
  if (!embarqueId) {
    return (
      <Box p={2}>
        {/* <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>INFORMACIÓN:</strong> Para gestionar las cantidades y medidas, primero debe crear el embarque (coordinación). 
            Una vez creado, podrá agregar las cargas correspondientes.
          </Typography>
        </Alert> */}
        
        {/* Campos adicionales para la carga */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fafafa' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            DATOS ADICIONALES DE LA CARGA
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Partida Arancelaria"
                value={nuevaCarga.PARTIDA_ARANCELARIA}
                onChange={(e) => setNuevaCarga(prev => ({ ...prev, PARTIDA_ARANCELARIA: e.target.value }))}
                placeholder="Ej: 0901.11.00"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Régimen Aduanal"
                value={nuevaCarga.REGIMEN_ADUANAL}
                onChange={(e) => setNuevaCarga(prev => ({ ...prev, REGIMEN_ADUANAL: e.target.value }))}
                placeholder="Ej: Exportación definitiva"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset" size="small">
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Definitivo General</Typography>
                <RadioGroup
                  row
                  value={nuevaCarga.DEFINITIVO_GENERAL}
                  onChange={(e) => setNuevaCarga(prev => ({ ...prev, DEFINITIVO_GENERAL: e.target.value }))}
                >
                  <FormControlLabel value="S" control={<Radio size="small" />} label="Sí" />
                  <FormControlLabel value="N" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                size="small"
                label="Descripción de la Carga"
                value={nuevaCarga.DESCRIPCION_CARGA}
                onChange={(e) => setNuevaCarga(prev => ({ ...prev, DESCRIPCION_CARGA: e.target.value }))}
                placeholder="Describa el contenido de la carga"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="CW (Chargeable Weight)"
                value={nuevaCarga.CW}
                onChange={(e) => setNuevaCarga(prev => ({ ...prev, CW: e.target.value }))}
                placeholder="0.00"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                helperText="Peso cobrable de la cotización"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: nuevaCarga.CW ? '#e8f5e9' : 'inherit',
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Botón para abrir la calculadora */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setModalCalculoOpen(true)}
            size="large"
            sx={{
              minWidth: 300,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            + CALCULAR CANTIDADES Y MEDIDAS
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Use el calculador para determinar peso, volumen y dimensiones de la carga
          </Typography>
        </Box>

        {/* Tabla de items del control de carga */}
        {itemsControlCarga.length > 0 && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                ITEMS DE CARGA PREPARADOS ({itemsControlCarga.length})
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setItemsControlCarga([])}
              >
                LIMPIAR TODOS LOS ITEMS
              </Button>
            </Box>
            
            {/* Totales de peso unitarios y cantidad de bultos */}
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f8ff', border: '1px solid #4a90e2' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary" gutterBottom>
                      Total Peso Unitarios
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {itemsControlCarga.reduce((total, item) => {
                        const pesoUnitario = parseFloat(item.pesoUnitario) || 0;
                        return total + pesoUnitario;
                      }, 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {itemsControlCarga.length > 0 ? `${itemsControlCarga[0].unidadPeso || 'kg'}` : 'kg'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary" gutterBottom>
                      TOTAL CANTIDAD DE BULTOS
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {itemsControlCarga.reduce((total, item) => {
                        const cantidad = parseInt(item.BULTOS) || 0;
                        return total + cantidad;
                      }, 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      BULTOS TOTALES
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {itemsControlCarga.map((item, index) => (
                  <Grid item xs={12} key={item.id}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#fafafa',
                        position: 'relative'
                      }}
                    >
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => eliminarItemControlCarga(item.id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(255, 255, 255, 0.8)'
                        }}
                      >
                        ×
                      </IconButton>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">BULTOS:</Typography>
                          <Typography>{item.BULTOS}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">PESO:</Typography>
                          <Typography>{item.PESO} kg</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">VOLUMEN:</Typography>
                          <Typography>{item.VOLUMEN} m³</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">MEDIDAS:</Typography>
                          <Typography>{item.largo} × {item.ancho} × {item.alto} {item.unidadMedida}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">PESO UNITARIO:</Typography>
                          <Typography>{item.pesoUnitario} {item.unidadPeso}</Typography>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography variant="subtitle2" color="primary">DESCRIPCIÓN:</Typography>
                          <Typography variant="body2">
                            {item.DESCRIPCION_CARGA}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}
        {/* Calculadora de Cantidades y Medidas */}
        <CalculadoraDeCantidadYMedidas
          open={modalCalculoOpen}
          setOpen={setModalCalculoOpen}
          agregar={handleAgregarDesdeCalculadora}
          valoresDefault={{
            unidadMedida: datosControlCarga.unidadMedida,
            unidadPeso: datosControlCarga.unidadPeso,
          }}
        />
      </Box>
    );
  }

  // Función para eliminar items de la tabla del control de carga
  const eliminarItemControlCarga = (itemId) => {
    setItemsControlCarga(prev => prev.filter(item => item.id !== itemId));
    setCargasEnCola(prev => prev.filter(carga => carga.id !== itemId));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSubmitting(true);
    setErrorForm(null);
    
    try {
      // Validar campos requeridos antes de enviar
      if (!nuevaCarga.EMBARQUE_ID || !nuevaCarga.RUBRO_ID || !nuevaCarga.TIPO_ID_UNIDAD_MEDIDA) {
        throw new Error('Los campos Rubro y Unidad de Medida son obligatorios');
      }
      
      // Convertir EMBARQUE_ID a número
      const embarqueIdNumero = parseInt(nuevaCarga.EMBARQUE_ID) || 0;
      
      // Convertir el label de unidad de medida de vuelta al value para la API
      const unidadMedidaValue = nuevaCarga.TIPO_ID_UNIDAD_MEDIDA ? 
        unidadesMedida?.find(unidad => unidad.label === nuevaCarga.TIPO_ID_UNIDAD_MEDIDA)?.value || nuevaCarga.TIPO_ID_UNIDAD_MEDIDA : "";
      
      // Mapear los campos del formulario según la API insertar-coordinacion-carga
      // Usar datos del formulario instructivo si están disponibles, sino usar los del formulario interno
      const datosCarga = {
        embarque_id: embarqueIdNumero,
        rubro_id: parseInt(nuevaCarga.RUBRO_ID) || 0,
        bultos: parseInt(nuevaCarga.BULTOS) || 0,
        cod_tipo_unidad_medidad: parseInt(unidadMedidaValue) || 0,
        peso: parseFloat(nuevaCarga.PESO) || 0,
        volumen: parseFloat(nuevaCarga.VOLUMEN) || 0,
        metros_cubicos: parseFloat(nuevaCarga.METROS_CUBICOS) || 0,
        char_w: parseFloat(nuevaCarga.CW) || 0,
        valor: parseFloat(nuevaCarga.VALOR) || 0,
        estado_cod: parseInt(nuevaCarga.ESTADO_ID) || 1,
        descripcion_carga: nuevaCarga.DESCRIPCION_CARGA || "",
        // Usar codPaisOrigen del formulario instructivo si está disponible, sino del formulario interno
        cod_pais_origen_carga: codPaisOrigen ? parseInt(codPaisOrigen) : (parseInt(nuevaCarga.COD_PAIS_ORIGEN_CARGA) || 0),
        // Usar partidaArancelaria del formulario instructivo si está disponible, sino del formulario interno
        partida_arancelaria: partidaArancelaria || nuevaCarga.PARTIDA_ARANCELARIA || "",
        // Usar regimenAduanal del formulario instructivo si está disponible, sino del formulario interno
        regimen_aduanal: regimenAduanal || nuevaCarga.REGIMEN_ADUANAL || "",
        // Usar definitivo del formulario instructivo (convertir boolean a "S"/"N"), sino del formulario interno
        definitivo_general: definitivo ? "S" : (nuevaCarga.DEFINITIVO_GENERAL === "S" ? "S" : "N"),
        emb_legs_id: null // Cargas generales no tienen emb_legs_id
      };
      
      if (cargaSeleccionada) {
        // Actualizar carga existente
        // Validar que tengamos el ID de la carga para actualizar
        if (!cargaSeleccionada.EMB_CARGA_ID) {
          throw new Error('NO SE PUDO OBTENER EL ID DE LA CARGA PARA ACTUALIZAR');
        }
        
        const datosActualizar = {
          ...datosCarga,
          emb_carga_id: cargaSeleccionada.EMB_CARGA_ID
        };
        
        await actualizarCoordinacionCarga(datosActualizar);
      } else {
        // Insertar nueva carga
        await insertarCoordinacionCarga(datosCarga);
      }
      
      limpiarFormulario();
    } catch (error) {
      console.error('ERROR AL GUARDAR CARGA:', error);
      setErrorForm(error.message || 'ERROR AL GUARDAR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = (carga) => {
    setCargaToDelete(carga);
    setShowDeleteAlert(true);
  };

  const confirmarEliminacion = async () => {
    if (!cargaToDelete) return;
    
    setIsEliminando(true);
    setErrorForm(null);
    
    try {
      await eliminarCoordinacionCarga(cargaToDelete.EMB_CARGA_ID);
      setShowDeleteAlert(false);
      setCargaToDelete(null);
      limpiarFormulario();
    } catch (error) {
      console.error('ERROR AL ELIMINAR CARGA:', error);
      setErrorForm(error.message || 'Error al eliminar la carga');
    } finally {
      setIsEliminando(false);
    }
  };

  const cancelarEliminacion = () => {
    setShowDeleteAlert(false);
    setCargaToDelete(null);
  };

  const handleSeleccionarCarga = (carga) => {
    setCargaSeleccionada(carga);
    
    // Convertir el value de unidad de medida al label para mostrar
    const unidadMedidaLabel = carga.TIPO_ID_UNIDAD_MEDIDA ? 
      unidadesMedida?.find(unidad => unidad.value === carga.TIPO_ID_UNIDAD_MEDIDA)?.label || carga.TIPO_ID_UNIDAD_MEDIDA : "";
    
    setNuevaCarga({
      EMBARQUE_ID: embarqueId?.toString() || "", // Asegurar que siempre esté presente
      RUBRO_ID: carga.RUBRO_ID || "",
      BULTOS: carga.BULTOS || "",
      TIPO_ID_UNIDAD_MEDIDA: unidadMedidaLabel,
      PESO: carga.PESO || "",
      VOLUMEN: carga.VOLUMEN || "0", // Valor por defecto si no existe
      METROS_CUBICOS: carga.METROS_CUBICOS || "0", // Valor por defecto si no existe
      CW: carga.CW || "",
      VALOR: carga.VALOR || "",
      ESTADO_ID: carga.ESTADO_ID || "",
      DESCRIPCION_CARGA: carga.DESCRIPCION_CARGA || "",
      COD_PAIS_ORIGEN_CARGA: carga.COD_PAIS_ORIGEN_CARGA || "",
      PARTIDA_ARANCELARIA: carga.PARTIDA_ARANCELARIA || "",
      REGIMEN_ADUANAL: carga.REGIMEN_ADUANAL || "",
      DEFINITIVO_GENERAL: carga.DEFINITIVO_GENERAL || "N"
    });
    setErrorForm(null);
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <Box p={2} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">ERROR AL CARGAR LAS CARGAS {error.message}</Alert>
      </Box>
    );
  }

  if (esModoPublico) {
    return (
      <Box sx={{ position: 'relative', mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Cantidades y Medidas
          </Typography>
          <Chip
            label=" Solo Lectura"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
          <Typography variant="caption">
            Esta sección es informativa y no puede ser modificada. Solo el operador puede actualizar estos datos.
          </Typography>
        </Alert>
        {isLoading ? (
          <Typography>Cargando cargas...</Typography>
        ) : error ? (
          <Typography color="error">Error al cargar las cargas: {error.message}</Typography>
        ) : cargas.length === 0 ? (
          <Typography>No hay cargas registradas para este embarque.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rubro</TableCell>
                <TableCell>Bultos</TableCell>
                <TableCell>Peso</TableCell>
                <TableCell>Volumen</TableCell>
                <TableCell>CW</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargas.map((carga) => (
                <TableRow key={carga.EMB_CARGA_ID}>
                  <TableCell>{carga.RUBRO_NOMBRE}</TableCell>
                  <TableCell>{carga.BULTOS}</TableCell>
                  <TableCell>{carga.PESO} {carga.TIPO_DESCRIPCION}</TableCell>
                  <TableCell>{carga.VOLUMEN} m³</TableCell>
                  <TableCell>{carga.CW}</TableCell>
                  <TableCell>{carga.VALOR}</TableCell>
                  <TableCell>
                    <Chip
                      label={carga.ESTADO_DESCRIPCION}
                      color={carga.ESTADO_ID === 1 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Mensaje de confirmación cuando el embarque está creado */}
      <Alert severity="success" sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">
            <strong>✅ EMBARQUE CREADO:</strong> El embarque ha sido creado exitosamente. 
            Ahora puede gestionar las cantidades y medidas de las cargas.
          </Typography>
          <Chip 
            label={`ID: ${embarqueId}`} 
            color="success" 
            variant="outlined" 
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </Alert>

      {/* Estado de la cola de cargas */}
      {cargasEnCola.length > 0 && (
        <Alert 
          severity={procesandoCola ? "info" : "warning"} 
          sx={{ mb: 2 }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2">
              {procesandoCola ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <strong>🔄 PROCESANDO COLA:</strong> Creando {cargasEnCola.length} carga(s) automáticamente...
                </>
              ) : (
                <>
                  <strong>⏳ COLA DE CARGAS:</strong> {cargasEnCola.length} carga(s) en espera de ser creadas automáticamente.
                </>
              )}
            </Typography>
            <Chip 
              label={`${cargasEnCola.length} en cola`} 
              color={procesandoCola ? "info" : "warning"} 
              variant="outlined" 
              size="small"
            />
          </Box>
        </Alert>
      )}

      {colaProcesada && cargasEnCola.length === 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>🎉 COLA PROCESADA:</strong> Todas las cargas han sido creadas automáticamente.
          </Typography>
        </Alert>
      )}

      {/* 1. TABLA DE CARGAS - Lo primero que ve el usuario */}
      <Box sx={{
        '& .MuiTabs-scroller': {
          overflow: 'hidden !important'
        },
        '& .MuiTableContainer-root': {
          overflow: 'auto !important'
        },
        '& .MuiTable-root': {
          minWidth: 'max-content'
        }
      }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {encabezadoTabla.map((col) => (
                <TableCell key={col.name} align={col.align} sx={{ width: col.width, fontWeight: 'bold' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {datosTabla.map((carga) => (
              <TableRow key={carga.EMB_CARGA_ID}>
                {encabezadoTabla.map((col) => (
                  <TableCell key={col.name} align={col.align}>
                    {col.name === 'ACCIONES' ? carga.ACCIONES : carga[col.campo]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* 2. BOTÓN PARA ABRIR MODAL DE CÁLCULO */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalCalculoOpen(true)}
          size="large"
          sx={{ minWidth: 200 }}
        >
          CALCULAR CANTIDADES Y MEDIDAS
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
          Use el calculador para determinar peso, volumen y dimensiones de la carga
        </Typography>
      </Box>

      {/* Tabla de items del control de carga */}
      {itemsControlCarga.length > 0 && (
        <Box sx={{ mt: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              ITEMS DE CARGA CREADOS ({itemsControlCarga.length})
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setItemsControlCarga([])}
            >
              LIMPIAR TODOS LOS ITEMS
            </Button>
          </Box>
          
          {/* Totales de peso unitarios y cantidad de bultos */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f0f8ff', border: '1px solid #4a90e2' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary" gutterBottom>
                    Total Peso Unitarios
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {itemsControlCarga.reduce((total, item) => {
                      const pesoUnitario = parseFloat(item.pesoUnitario) || 0;
                      return total + pesoUnitario;
                    }, 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {itemsControlCarga.length > 0 ? `${itemsControlCarga[0].unidadPeso || 'kg'}` : 'kg'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box textAlign="center">
                  <Typography variant="h6" color="primary" gutterBottom>
                    TOTAL CANTIDAD DE BULTOS
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {itemsControlCarga.reduce((total, item) => {
                      const cantidad = parseInt(item.BULTOS) || 0;
                      return total + cantidad;
                    }, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    BULTOS TOTALES
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {itemsControlCarga.map((item, index) => (
                <Grid item xs={12} key={item.id}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                      position: 'relative'
                    }}
                  >
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarItemControlCarga(item.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      ×
                    </IconButton>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">BULTOS:</Typography>
                        <Typography>{item.BULTOS}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">PESO:</Typography>
                        <Typography>{item.PESO} kg</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">VOLUMEN:</Typography>
                        <Typography>{item.VOLUMEN} m³</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">MEDIDAS:</Typography>
                        <Typography>{item.largo} × {item.ancho} × {item.alto} {item.unidadMedida}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">PESO UNITARIO:</Typography>
                        <Typography>{item.pesoUnitario} {item.unidadPeso}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="primary">DESCRIPCIÓN:</Typography>
                        <Typography variant="body2">
                          {item.DESCRIPCION_CARGA}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* 3. CALCULADORA DE CANTIDADES Y MEDIDAS */}
      <CalculadoraDeCantidadYMedidas
        open={modalCalculoOpen}
        setOpen={setModalCalculoOpen}
        agregar={handleAgregarDesdeCalculadora}
        valoresDefault={{
          unidadMedida: datosControlCarga.unidadMedida,
          unidadPeso: datosControlCarga.unidadPeso,
        }}
      />

      {/* 4. ACORDEÓN DEL FORMULARIO PRINCIPAL - Cerrado por defecto */}
      <Box data-acordeon-formulario>
        <AcordeonComponent
          expandido={isAcordeonFormularioExpanded}
          expandir={() => setIsAcordeonFormularioExpanded(!isAcordeonFormularioExpanded)}
          titulo={
            <Box display="flex" justifyContent="space-between" p={0.8} width={"100%"}>
              <Typography variant="h6">
                {cargaSeleccionada ? 'Gestionar Carga' : 'Crear Carga'}
              </Typography>
              <Typography className={isAcordeonFormularioExpanded ? "c-arriba-simple" : "c-abajo-simple"}>▼</Typography>
            </Box>
          }
          cuerpo={
            <Box sx={{ p: 2 }}>
              {!cargaSeleccionada && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>NOTA:</strong> LAS CARGAS CREADAS DESDE ESTE FORMULARIO SERÁN CARGAS GENERALES DEL EMBARQUE 
                    (sin tramo específico). PARA CREAR CARGAS ASOCIADAS A UN TRAMO ESPECÍFICO, 
                    UTILIZA LA PESTAÑA DE CARGAS EN LA VISTA DEL TRAMO CORRESPONDIENTE.
                  </Typography>
                </Alert>
              )}
              
              {errorForm && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorForm}
                </Alert>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!errorForm}>
                    <InputLabel>Rubro</InputLabel>
                    <Select
                      value={nuevaCarga.RUBRO_ID}
                      label="Rubro"
                      onChange={handleChange}
                      name="RUBRO_ID"
                      disabled={isLoadingRubros}
                    >
                      {rubros?.map((rubro) => (
                        <MenuItem key={rubro.value} value={rubro.value}>
                          {rubro.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Descripción de la Carga"
                    value={nuevaCarga.DESCRIPCION_CARGA}
                    onChange={handleChange}
                    name="DESCRIPCION_CARGA"
                    multiline
                    rows={2}
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Unidad de Medida"
                    value={nuevaCarga.TIPO_ID_UNIDAD_MEDIDA}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Partida Arancelaria"
                    value={nuevaCarga.PARTIDA_ARANCELARIA}
                    onChange={handleChange}
                    name="PARTIDA_ARANCELARIA"
                    inputProps={{ maxLength: 50 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bultos"
                    value={nuevaCarga.BULTOS}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Peso"
                    value={nuevaCarga.PESO}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Volumen (m³)"
                    value={nuevaCarga.VOLUMEN}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Metros Cúbicos (m³)"
                    value={nuevaCarga.METROS_CUBICOS}
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="CW"
                    type="number"
                    value={nuevaCarga.CW}
                    onChange={handleChange}
                    name="CW"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Valor"
                    type="number"
                    value={nuevaCarga.VALOR}
                    onChange={handleChange}
                    name="VALOR"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>País Origen</InputLabel>
                    <Select
                      value={nuevaCarga.COD_PAIS_ORIGEN_CARGA}
                      label="País Origen"
                      onChange={handleChange}
                      name="COD_PAIS_ORIGEN_CARGA"
                      disabled={isLoadingPaises}
                    >
                      {paises?.map((pais) => (
                        <MenuItem key={pais.value} value={pais.value}>
                          {pais.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Régimen Aduanal"
                    value={nuevaCarga.REGIMEN_ADUANAL}
                    onChange={handleChange}
                    name="REGIMEN_ADUANAL"
                    inputProps={{ maxLength: 50 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl component="fieldset" margin="normal">
                    <Typography variant="body2" component="legend">Definitivo General</Typography>
                    <RadioGroup
                      row
                      name="DEFINITIVO_GENERAL"
                      value={nuevaCarga.DEFINITIVO_GENERAL}
                      onChange={handleChange}
                    >
                      <FormControlLabel value="S" control={<Radio size="small" />} label="Sí" />
                      <FormControlLabel value="N" control={<Radio size="small" />} label="No" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={nuevaCarga.ESTADO_ID}
                      label="Estado"
                      onChange={handleChange}
                      name="ESTADO_ID"
                    >
                      <MenuItem value={1}>Activo</MenuItem>
                      <MenuItem value={0}>Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box display="flex" gap={2} justifyContent="center" mt={3}>
                {!cargaSeleccionada ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {isSubmitting ? 'CREANDO...' : 'CREAR CARGA'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={20} /> : <EditIcon />}
                    >
                      {isSubmitting ? 'ACTUALIZANDO...' : 'ACTUALIZAR'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleEliminar(cargaSeleccionada)}
                      disabled={isSubmitting}
                      startIcon={<DeleteIcon />}
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={limpiarFormulario}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          }
        />
      </Box>
          
      {/* Alert de confirmación para eliminar carga */}
      <ActionAlertComponent
        openDialog={showDeleteAlert}
        handleClose={cancelarEliminacion}
        onConfirm={confirmarEliminacion}
        onCancel={cancelarEliminacion}
        tipo="warning"
        activarAceptar={true}
        activarCanecelar={true}
      >
        <div>
          <strong>¿Estás seguro de que quieres eliminar la carga?</strong>
          <br />
          <br />
          Descripción: &quot;{cargaToDelete?.DESCRIPCION_CARGA}&quot;
          <br />
          Bultos: {cargaToDelete?.BULTOS}
          <br />
          Peso: {cargaToDelete?.PESO} kg
        </div>
      </ActionAlertComponent>
    </Box>
  );
};

export default CantidadesMedidas;