import { useState, useCallback, useEffect, useMemo } from "react";
import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import useCustomMutation from "./useCustomMutation";
import { createAllPagedEntityDataHook, createDataHook } from "./useFunctions";
import { useFetchEmpUsuPuesto } from "./useFetchConfiguracion";
import CryptoJS from "crypto-js";
import { end } from "slate";
import { ContinuousColorLegend } from "@mui/x-charts";

// Función para desencriptar datos del localStorage/sessionStorage
const decryptId = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, import.meta.env.VITE_ENCRIPT_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
};

// Hook para obtener cod_cc y cod_empresa del empleado-usuario-puesto actual
export const useFetchCodCcEmpresa = () => {
  const { data: empleadoUsuarioPuesto } = useFetchEmpUsuPuesto();
  
  // Intentar obtener del localStorage/sessionStorage primero
  const currentCentroCosto = decryptId(localStorage.getItem("currentCentroCosto") || sessionStorage.getItem("currentCentroCosto"));
  const currentEmpresa = decryptId(localStorage.getItem("currentEmpresa") || sessionStorage.getItem("currentEmpresa"));
  
  // Si no están en localStorage, intentar obtener del empleado-usuario-puesto
  const empleadoActual = empleadoUsuarioPuesto?.find(emp => 
    emp.cod_usuario === localStorage.getItem('usuario_id') || 
    emp.cod_empleado === localStorage.getItem('empleado_id')
  );
  
  const cod_cc = currentCentroCosto?.cod_cc || empleadoActual?.cod_cc || null;
  const cod_empresa = currentEmpresa?.cod_empresa || empleadoActual?.cod_empresa || null;
  
  return { cod_cc, cod_empresa, empleadoActual };
};
// ========================================
// HOOK PARA ACTUALIZAR DATOS DE EMBARQUES
// ========================================
//API POST: /api/appweb/actualizar-coordinacion
export const useActualizarCoordinacion = () => {
  return useCustomMutation({
    mutationFn: async ({ embarque_id, embarqueData }) => {
      const response = await api.post('/api/appweb/actualizar-coordinacion', {
        embarque_id: embarque_id,
        ...embarqueData
      });
      return response.data;
    },
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.log('Error', error);
      console.error('Error al actualizar embarque:', error);
    }
  });
};
// ========================================
// HOOK PARA OBTENER TIPOS DE BITÁCORA (HISTORICO_COORDINACION)
// ========================================
export const useFetchTiposBitacora = () => {
  return useCustomQuery(
    ["tipos-bitacora"],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-tipo', {
          params: {
            tipo_tabla: "HISTORICO_COORDINACION"
          },
        });
        // Manejar la estructura específica de la respuesta
        let tipos = [];
        if (response.data?.status === 200 && response.data?.data && Array.isArray(response.data.data)) {
          tipos = response.data.data;
        } else if (Array.isArray(response.data)) {
          tipos = response.data;
        } else {
          console.warn('Estructura de respuesta inesperada para tipos de bitácora:', response.data);
          tipos = [];
        }
        return tipos.map(tipo => ({
          cod_tipo: tipo.COD_TIPO,
          nom_tipo: tipo.NOM_TIPO,
          tipo_tabla: tipo.TIPO_TABLA,
          cod_estado: tipo.COD_ESTADO,
          estado_desc: tipo.ESTADO_DESC,
          value: tipo.COD_TIPO,
          label: tipo.NOM_TIPO
        }));
      } catch (error) {
        console.error('Error al cargar tipos de bitácora:', error);
        throw error;
      }
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );
};
// ========================================
// FUNCIÓN UTILITARIA PARA REGISTRAR BITÁCORAS AUTOMÁTICAS
// ========================================
/**
 * Función para registrar automáticamente una bitácora después de una operación CRUD
 * @param {number|string} embarque_id - ID del embarque
 * @param {string} operacion - Tipo de operación (CREACION, ACTUALIZA, ELIMINACION, INTERACCION)
 * @param {object} datosEnviados - Datos que se enviaron a la API
 * @param {object} respuestaAPI - Respuesta que devolvió la API
 * @param {string} modulo - Módulo donde se realizó la operación (ej: "Carga", "Contacto", "Equipo", etc.)
 */
// declarar token global
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
const registrarBitacoraAutomatica = async (embarque_id, operacion, datosEnviados, respuestaAPI, modulo) => {
  try {
    // Obtener tipos de bitácora dinámicamente
    let codTipo = 'EVENTOS COORDINACION'; // Valor por defecto
    try {
      const tiposResponse = await api.get('/api/appweb/lista-tipo', {
        params: { tipo_tabla: "HISTORICO_COORDINACION" },
      });
      // Normalizar la respuesta
      let tipos = [];
      if (Array.isArray(tiposResponse.data?.data)) {
        tipos = tiposResponse.data.data;
      } else if (Array.isArray(tiposResponse.data)) {
        tipos = tiposResponse.data;
      }
      const operacionUpper = (operacion || '').toUpperCase();
      // Buscar coincidencia directa
      const tipoEncontrado = tipos.find(tipo => {
        const nomTipo = (tipo.NOM_TIPO || tipo.nom_tipo || '').toUpperCase();
        return nomTipo === operacionUpper;
      });
      if (tipoEncontrado) {
        codTipo = tipoEncontrado.NOM_TIPO || tipoEncontrado.nom_tipo;
      } else {
        // Fallback a "EVENTOS COORDINACION"
        const eventoCoordinacion = tipos.find(tipo => 
          (tipo.NOM_TIPO || tipo.nom_tipo || '').toUpperCase() === 'EVENTOS COORDINACION'
        );
        if (eventoCoordinacion) {
          codTipo = eventoCoordinacion.NOM_TIPO || eventoCoordinacion.nom_tipo;
        } else {
          console.warn(`No se encontró tipo para operación "${operacion}", usando codTipo: ${codTipo}`);
        }
      }
    } catch (error) {
      console.error('Error al obtener tipos de bitácora, usando valor por defecto:', error);
    }
    const jsonModificacion = {
      operacion: operacion,
      modulo: modulo,
      datos_enviados: datosEnviados,
      respuesta_api: respuestaAPI,
      timestamp: new Date().toISOString(),
      usuario_id: localStorage.getItem('usuario_id') || 'sistema',
      token: token
    };
    const datosBitacora = {
      embarque_id: embarque_id.toString(),
      cod_tipo: codTipo,
      json_modificacion: JSON.stringify(jsonModificacion)
    };
    const response = await api.post('/api/appweb/insertar-historico-coordinacion', datosBitacora);
    return response.data;
  } catch (error) {
    console.error('Error al registrar bitácora automática:', error);
    // No lanzamos el error para no interrumpir la operación principal
    // Solo lo registramos en consola
  }
};
const defaultOptions = {
  staleTime: 1000 * 60 * 10,
};
// ========================================
// CATÁLOGO DE APIS PARA EMBARQUES
// ========================================
// TIPOS DE FECHA
export const useFetchTiposFecha = () => {
  return useCustomQuery(
    ["tipos-fecha"],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-tipo?tipo_tabla=coordinacion_fecha');
        // Manejar diferentes estructuras de respuesta
        let tipos = [];
        if (response.data?.status === 200 && response.data?.data) {
          // Estructura: {status: 200, message: 'SUCCESS', data: Array}
          tipos = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          tipos = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          tipos = response.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para tipos de fecha:', response.data);
          tipos = [];
        }
        // diccionario de siglas por descripcion
        const siglasPorDescripcion = {
          "ACTUAL TIME OF DEPARTURE": "- ATD",
          "ESTIMATED TIME OF DEPARTURE": "- ETD",
          "ACTUAL TIME OF ARRIVAL": "- ATA",
          "ESTIMATED TIME OF ARRIVAL": "- ETA"
        };
        return tipos.map(item => {
          const nomTipo = item.nom_tipo ?? item.NOM_TIPO ?? "Sin nombre";
          const sigla = siglasPorDescripcion[nomTipo] ?? "";
          const labelCompleto = sigla ? `${nomTipo} ${sigla}` : nomTipo;
          return {
            ...item,
            label: labelCompleto,
            value: item.cod_tipo  
          };
        });
      } catch (error) {
        console.error('Error al cargar tipos de fecha:', error);
        throw error;
      }
    },
    {
      ...defaultOptions,
    }
  );
};
// COORDINACIÓN FECHA MOVIMIENTO
export const useFetchCoordinacionFechaMov = (embarque_id) => {
  return useCustomQuery(
    ["coordinacion-fecha-mov", embarque_id],
    async () => {
      const response = await api.get(`/api/appweb/listar-coordinacion-fecha-mov?embarque_id=${embarque_id}`);
      return response.data.map(item => ({ 
        ...item, 
        label: item.nombre || item.descripcion, 
        value: item.id 
      }));
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id, // Solo ejecuta si hay embarque_id
    }
  );
};
// COORDINACIÓN FECHA MOVIMIENTO POR LEG
export const useFetchCoordinacionFechaMovPorLeg = (embarque_id, emb_legs_id) => {
  return useCustomQuery(
    ["coordinacion-fecha-mov-leg", embarque_id, emb_legs_id],
    async () => {
      const endpoint = `/api/appweb/listar-coordinacion-fecha-mov?embarque_id=${embarque_id}&emb_legs_id=${emb_legs_id}`;
      const response = await api.get(endpoint);
      // Manejar la estructura de respuesta anidada
      let fechas = [];
      if (response.data?.status === 200 && response.data?.data?.data) {
        // Estructura: {status: 200, message: 'SUCCESS', data: {data: Array}}
        fechas = response.data.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Estructura: {data: Array}
        fechas = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Estructura directa: Array
        fechas = response.data;
      } else {
        console.warn('Estructura de respuesta inesperada para fechas por leg:', response.data);
        fechas = [];
      }
      // console.log('Debug - Fechas extraídas del hook por leg:', fechas);
      const fechasFiltradas = fechas.filter(item => {
        const itemEmbLegsId = item.EMB_LEGS_ID || item.emb_legs_id || item.emb_legs_ID;
        const coincideTramo = itemEmbLegsId == emb_legs_id;
        if (!coincideTramo) {
        }
        return coincideTramo;
      });
        // console.log('Debug - Fechas después del filtrado por tramo:', fechasFiltradas);
      return fechasFiltradas.map(item => {
        // Formatear la fecha para mostrar correctamente
        let fechaFormateada = item.FECHA || item.fecha || "";
        if (fechaFormateada && fechaFormateada.includes('T')) {
          fechaFormateada = fechaFormateada.split('T')[0];
        }
        return {
          ...item,
          FECHA: fechaFormateada, // Formatear fecha para mostrar
          NOM_TIPO: item.TIPO_DESCRIPCION || item.NOMENCLATURA || item.nom_tipo || "Sin tipo",
          label: item.TIPO_DESCRIPCION || item.NOMENCLATURA || item.nom_tipo || "Sin tipo",
          value: item.ID_FECHA_REG_EMBARQUE || item.id
        };
      });
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id && !!emb_legs_id, // Solo ejecuta si hay embarque_id y emb_legs_id
    }
  );
};
// Hook para operaciones CRUD de Coordinación Fecha Movimiento
export const useCoordinacionFechaMovCRUD = (embarque_id) => {
  const { refetch } = useFetchCoordinacionFechaMov(embarque_id);
  const insertarCoordinacionFechaMov = async (datos) => {
    try {
      // Incluir embarque_id en los datos si no está presente
      const datosCompletos = {
        ...datos,
        embarque_id: embarque_id || datos.embarque_id,
      };
      const response = await api.post('/api/appweb/insertar-coordinacion-fecha-mov', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  const actualizarCoordinacionFechaMov = async (datos) => {
    try {
      // Incluir embarque_id en los datos si no está presente
      const datosCompletos = {
        ...datos,
        embarque_id: embarque_id || datos.embarque_id,

      };
      const response = await api.post('/api/appweb/actualizar--coordinacion-fecha-mov', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  const eliminarCoordinacionFechaMov = async (id) => {
    try {
      // console.log('Debug - Eliminando fecha general con parámetros:', { 
      //   id_fecha_reg_embarque: id,
      //   embarque_id 
      // });
      const response = await api.post('/api/appweb/eliminar-coordinacion-fecha-mov', { 
        id_fecha_reg_embarque: id,
        embarque_id 
      });
      // console.log('Debug - Respuesta de eliminación general:', response);
      
      // Verificar que la respuesta sea válida
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor');
      }
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        { id_fecha_reg_embarque: id, embarque_id },
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error en eliminarCoordinacionFechaMov (general):', error);
      if (error.response?.status === 404) {
        throw new Error('El endpoint de eliminación de fecha no está disponible en el servidor');
      }
      throw error;
    }
  };
  return {
    insertarCoordinacionFechaMov,
    actualizarCoordinacionFechaMov,
    eliminarCoordinacionFechaMov
  };
};
// Hook para operaciones CRUD de Coordinación Fecha Movimiento por Leg
export const useCoordinacionFechaMovCRUDPorLeg = (embarque_id, emb_legs_id) => {
  const { refetch } = useFetchCoordinacionFechaMovPorLeg(embarque_id, emb_legs_id);
  const insertarCoordinacionFechaMov = async (datos) => {
    try {
      // Incluir embarque_id y emb_legs_id en los datos
      const datosCompletos = {
        ...datos,
        embarque_id: embarque_id || datos.embarque_id,
        emb_legs_id: emb_legs_id || datos.emb_legs_id
      };
      // console.log('Debug - Datos que se envían a la API de fechas:', datosCompletos);
      // console.log('Debug - Tipo de fecha:', typeof datosCompletos.fecha);
      // console.log('Debug - Valor de fecha:', datosCompletos.fecha);
      // console.log('Debug - emb_legs_id que se envía:', datosCompletos.emb_legs_id);
      const response = await api.post('/api/appweb/insertar-coordinacion-fecha-mov', datosCompletos);      
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      console.error('Error al insertar fecha de coordinación:', error);
      throw error;
    }
  };
  const actualizarCoordinacionFechaMov = async (datos) => {
    try {
      // Incluir embarque_id y emb_legs_id en los datos
      const datosCompletos = {
        ...datos,
        embarque_id: embarque_id || datos.embarque_id,
        emb_legs_id: emb_legs_id || datos.emb_legs_id
      };  
      const response = await api.post('/api/appweb/actualizar-coordinacion-fecha-mov', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  const eliminarCoordinacionFechaMov = async (id) => {
    try {

      const response = await api.post('/api/appweb/eliminar-coordinacion-fecha-mov', { 
        id_fecha_reg_embarque: id,
        embarque_id,
        emb_legs_id
      });
      // Verificar que la respuesta sea válida
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor');
      }
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        { id_fecha_reg_embarque: id, embarque_id, emb_legs_id },
        response.data,
        'CoordinacionFechaMov'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      console.error('Error en eliminarCoordinacionFechaMov:', error);
      if (error.response?.status === 404) {
        throw new Error('El endpoint de eliminación de fecha no está disponible en el servidor');
      }
      throw error;
    }
  };
  return {
    insertarCoordinacionFechaMov,
    actualizarCoordinacionFechaMov,
    eliminarCoordinacionFechaMov,
    refetch
  };
};
// FECHAS DE EMBARQUE (SOLO FECHAS GENERALES, SIN TRAMO ASIGNADO)
export const useFetchFechasEmbarque = (embarque_id) => {
  return useCustomQuery(
    ["fechas-embarque", embarque_id],
    async () => {
      try {
        // Debug: Verificar el embarque_id que se está enviando
        // Intentar con el endpoint correcto para fechas de embarque
        const endpoint = `/api/appweb/listar-coordinacion-fecha-mov?embarque_id=${embarque_id}`;
        // console.log('Debug - endpoint a llamar:', endpoint);
        const response = await api.get(endpoint);
        // Verificar la estructura de la respuesta
        // console.log('Debug - Respuesta completa de fechas de embarque:', response.data);
        // estructuras de respuesta
        let fechas = [];
        if (response.data?.status === 200 && response.data?.data) {
          // Estructura: {status: 200, message: 'SUCCESS', data: {data: Array}}
          if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            fechas = response.data.data.data;
          } else if (Array.isArray(response.data.data)) {
            fechas = response.data.data;
          } else {
            fechas = [];
          }
        } else if (Array.isArray(response.data)) {
          fechas = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          fechas = response.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada:', response.data);
          fechas = [];
        }
        // FILTRAR: Solo mostrar fechas que NO tienen tramo asignado (emb_legs_id es null, undefined, 0, o vacío)
        const fechasGenerales = fechas.filter(item => {
          const embLegsId = item.EMB_LEGS_ID || item.emb_legs_id || item.emb_legs_ID;
          const tieneTramo = embLegsId && embLegsId !== 0 && embLegsId !== "0" && embLegsId !== "";
          if (tieneTramo) {

          }
          return !tieneTramo; // Solo incluir fechas que NO tienen tramo
        });
        // console.log('Debug - Fechas generales (sin tramo) después del filtrado:', fechasGenerales);
        return fechasGenerales.map(item => ({ 
          ...item, 
          label: item.OBSERVACION || item.FECHA_DESCRIPICION || item.FECHA, 
          value: item.ID_FECHA_REG_EMBARQUE 
        }));
      } catch (error) {
        // Solo mostrar el error en consola
        console.error('Error al cargar fechas de embarque:', {
          endpoint: `/api/appweb/listar-coordinacion-fecha-mov?embarque_id=${embarque_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error; 
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id, // Solo ejecuta si hay embarque_id
    }
  );
};
// Hook para operaciones CRUD de Fechas de Embarque
export const useFechasEmbarqueCRUD = (embarque_id) => {
  const { refetch, data: fechasExistentes } = useFetchFechasEmbarque(embarque_id);

  const insertarFechaEmbarque = async (datos) => {
    try {
      // Calcular el siguiente ID incremental
      const siguienteId = fechasExistentes && fechasExistentes.length > 0 
        ? Math.max(...fechasExistentes.map(f => parseInt(f.ID_FECHA_REG_EMBARQUE) || 0)) + 1
        : 1;
      
      // Extraer el valor correcto de id_tipo_fecha
      let idTipoFecha = "1"; // valor por defecto
      if (datos.id_tipo_fecha) {
        if (typeof datos.id_tipo_fecha === 'object' && datos.id_tipo_fecha.value) {
          idTipoFecha = datos.id_tipo_fecha.value.toString();
        } else {
          idTipoFecha = datos.id_tipo_fecha.toString();
        }
      }
      
      // Formatear la fecha correctamente
      let fechaFormateada = datos.fecha;
      if (datos.fecha && typeof datos.fecha === 'string' && datos.fecha.includes('T')) {
        // Si viene como ISO string, convertir a YYYY-MM-DD
        fechaFormateada = datos.fecha.split('T')[0];
      }
      
      // Estructura de datos según la API requerida
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        id_tipo_fecha: idTipoFecha,
        observacion: datos.observacion,
        fecha: fechaFormateada,
        estado_cod: "1",
        id_fecha_reg_embarque: siguienteId.toString()
      };
      const response = await api.post('/api/appweb/insertar-coordinacion-fecha-mov', datosCompletos);      
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'FechasEmbarque'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al insertar fecha:', error);
      throw error;
    }
  };
  const actualizarFechaEmbarque = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        id_tipo_fecha: datos.id_tipo_fecha || "1",
        observacion: datos.observacion,
        fecha: datos.fecha,
        estado_cod: "1",
        id_fecha_reg_embarque: datos.id_fecha_reg_embarque
      };
      const response = await api.post('/api/appweb/actualizar-coordinacion-fecha-mov', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'FechasEmbarque'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al actualizar fecha:', error);
      throw error;
    }
  };
  const eliminarFechaEmbarque = async (id) => {
    try {
      const datosEliminar = {
        id_fecha_reg_embarque: id,
        embarque_id: embarque_id.toString()
      };
      //console.log('Enviando datos para eliminar:', datosEliminar);
      const response = await api.post('/api/appweb/eliminar-coordinacion-fecha-mov', datosEliminar);
      
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        datosEliminar,
        response.data,
        'FechasEmbarque'
      );
      
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al eliminar fecha:', error);
      throw error;
    }
  };

  return {
    insertarFechaEmbarque,
    actualizarFechaEmbarque,
    eliminarFechaEmbarque
  };
};

// ========================================
// HOOK PARA OBTENER ENTIDADES POR TIPO
// ========================================
export const useFetchEntidades = (tipo_entidad = null, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidades", tipo_entidad],
    async () => {
      // Doble verificación de modo público
      if (isModoPublico) return [];
      try {
        // console.log('Hook useFetchEntidades ejecutándose con tipo_entidad:', tipo_entidad);
        if (!tipo_entidad) {
          // console.log('No hay tipo_entidad seleccionado, retornando array vacío');
          return [];
        }
        // Convertir el número a string del tipo de entidad
        let tipoEntidadString = tipo_entidad;
        // Si es un número, intentar obtener el nombre del tipo de entidad
        if (typeof tipo_entidad === 'number') {
          try {
            const tiposResponse = await api.get('/api/appweb/lista-tipo?tipo_tabla=entidad');
            if (tiposResponse.data?.data) {
              const tipoEncontrado = tiposResponse.data.data.find(tipo =>
                (tipo.COD_TIPO || tipo.cod_tipo) === tipo_entidad
              );
              if (tipoEncontrado) {
                tipoEntidadString = tipoEncontrado.NOM_TIPO || tipoEncontrado.nom_tipo;
              }
            }
          } catch (error) {
            console.warn('No se pudo obtener el nombre del tipo de entidad, usando valor original:', error);
            // Mantener el valor original si no se puede obtener el nombre
          }
        }
        const endpoint = `/api/appweb/lista-entidad?tipo_entidad=${tipoEntidadString}`;
        const response = await api.get(endpoint);
        let entidades = [];
        if (response.data?.status === 200 && response.data?.data?.data && Array.isArray(response.data.data.data)) {
        entidades = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
        entidades = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Estructura directa: Array
          entidades = response.data;
        } else {
          console.warn('Estructura de respuesta inesperada para entidades:', response.data);

          entidades = [];
        }
        const entidadesProcesadas = entidades
          .filter(item => {
            // Verificar que tenga los campos necesarios
            const entidadId = item.ENTIDAD_ID || item.entidad_id || item.id;
            const entidadNombre = item.ENTIDAD_NOMBRE || item.entidad_nombre || item.nombre;
            return entidadId && entidadNombre;
          })
          .map(item => {
            // Mapear todos los campos relevantes
            const entidadId = item.ENTIDAD_ID || item.entidad_id || item.id;
            const codigoEntidad = item.CODIGO_ENTIDAD || item.codigo_entidad || item.codigo;
            const entidadNombre = item.ENTIDAD_NOMBRE || item.entidad_nombre || item.nombre;
            const codTipo = item.COD_TIPO || item.cod_tipo;
            const tipoDescripcion = item.TIPO_DESCRIPCION || item.tipo_descripcion;
            const entidadClasificacion = item.ENTIDAD_CLASIFICACION || item.entidad_clasificacion;
            return {
              value: entidadId,
              label: entidadNombre, // Mostrar solo ENTIDAD_NOMBRE como label
              entidad_id: entidadId,
              codigo_entidad: codigoEntidad,
              entidad_nombre: entidadNombre,
              cod_tipo: codTipo,
              tipo_descripcion: tipoDescripcion,
              entidad_clasificacion: entidadClasificacion,
              ...item // Incluir todos los campos originales
            };
          });
        // console.log('Entidades procesadas para el select:', entidadesProcesadas);
        return entidadesProcesadas;
      } catch (error) {
        console.error('Error al cargar entidades:', {
          endpoint: `/api/appweb/lista-entidad?tipo_entidad=${tipo_entidad}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!tipo_entidad && !isModoPublico && options.enabled !== false,
      ...options,
    }
  );
};
// COORDINACIÓN DE CONTACTOS
export const useFetchCoordinacionContacto = (embarque_id) => {
  return useCustomQuery(
    ["coordinacion-contacto", embarque_id],
    async () => {
      try {
        //console.log('Debug - embarque_id para contactos:', embarque_id);
        const endpoint = `/api/appweb/listar-coordinacion-contacto?embarque_id=${embarque_id}`;
        //console.log('Debug - endpoint contactos:', endpoint);        
        const response = await api.get(endpoint);
        // Manejar diferentes estructuras de respuesta
        let contactos = [];
        if (Array.isArray(response.data)) {
          contactos = response.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          contactos = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          contactos = response.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para contactos:', response.data);
          contactos = [];
        }
        //console.log('Debug - contactos extraídos:', contactos);
        return contactos.map(item => ({ 
          ...item, 
          label: item.nombre || item.cargo || item.email, 
          value: item.actor_id || item.id 
        }));
      } catch (error) {
        console.error('Error al cargar contactos:', {
          endpoint: `/api/appweb/listar-coordinacion-contacto?embarque_id=${embarque_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id,
    }
  );
};
// COORDINACIÓN DE CONTACTOS POR LEG
export const useFetchCoordinacionContactoPorLeg = (embarque_id, emb_legs_id) => {
//   console.log('Debug - useFetchCoordinacionContactoPorLeg llamado con:', { embarque_id, emb_legs_id });
  return useCustomQuery(
    ["coordinacion-contacto-leg", embarque_id, emb_legs_id],
    async () => {
      try {
        const endpoint = `/api/appweb/listar-coordinacion-contacto?embarque_id=${embarque_id}&emb_legs_id=${emb_legs_id}`;
        // console.log('Debug - useFetchCoordinacionContactoPorLeg ejecutando query con endpoint:', endpoint);
        const response = await api.get(endpoint);    
        // Manejar diferentes estructuras de respuesta
        let contactos = [];
        if (Array.isArray(response.data)) {
          contactos = response.data;
        //   console.log('Debug - useFetchCoordinacionContactoPorLeg: response.data es array directo');
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          contactos = response.data.data.data;
        //   console.log('Debug - useFetchCoordinacionContactoPorLeg: response.data.data.data es array');
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          contactos = response.data.data;
        //   console.log('Debug - useFetchCoordinacionContactoPorLeg: response.data.data es array');
        } else {
          console.warn('Estructura de respuesta inesperada para contactos por leg:', response.data);
          contactos = [];
        }
        // console.log('Debug - useFetchCoordinacionContactoPorLeg contactos extraídos:', contactos);
        const contactosProcesados = contactos.map(item => ({ 
          ...item, 
          label: item.nombre || item.cargo || item.email, 
          value: item.actor_id || item.id 
        }));
        // console.log('Debug - useFetchCoordinacionContactoPorLeg contactos procesados:', contactosProcesados);
        return contactosProcesados;
      } catch (error) {
        console.error('Error al cargar contactos por leg:', {
          endpoint: `/api/appweb/listar-coordinacion-contacto?embarque_id=${embarque_id}&emb_legs_id=${emb_legs_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id && !!emb_legs_id,
    }
  );
};
// Hook para operaciones CRUD de Coordinación de Contactos
export const useCoordinacionContactoCRUD = (embarque_id) => {
  const { refetch, data: contactosExistentes } = useFetchCoordinacionContacto(embarque_id);
  const insertarCoordinacionContacto = async (datos) => {
    try {
      // Calcular el siguiente ID incremental
      const siguienteId = contactosExistentes && contactosExistentes.length > 0 
        ? Math.max(...contactosExistentes.map(c => parseInt(c.ID_CONTACTO_COORDINACION) || 0)) + 1
        : 1;
      // Estructura de datos según la API requerida
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        entidadcontacto_id: datos.entidadcontacto_id.toString(),
        cod_tipo: datos.tipoEntidad?.toString() || "",
        instrucciones: datos.instrucciones,
        id_contacto_coordinacion: siguienteId.toString()
      };
      // Solo agregar emb_legs_id si se proporciona y no es 0
      if (datos.emb_legs_id && datos.emb_legs_id !== 0) {
        datosCompletos.emb_legs_id = datos.emb_legs_id;
      }      
      const response = await api.post('/api/appweb/insertar-coordinacion-contacto', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al insertar contacto:', error);
      throw error;
    }
  };
  const actualizarCoordinacionContacto = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        entidadcontacto_id: datos.entidadcontacto_id.toString(),
        cod_tipo: datos.tipoEntidad?.toString() || "",
        instrucciones: datos.instrucciones,
        id_contacto_coordinacion: datos.id_contacto_coordinacion
      };
      
      // Solo agregar emb_legs_id si se proporciona y no es 0
      if (datos.emb_legs_id && datos.emb_legs_id !== 0) {
        datosCompletos.emb_legs_id = datos.emb_legs_id;
      }
    //   console.log('Enviando datos para actualizar contacto:', datosCompletos);
      const response = await api.post('/api/appweb/actualizar-coordinacion-contacto', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al actualizar contacto:', error);
      throw error;
    }
  };
  const eliminarCoordinacionContacto = async (id) => {
    try {
      const datosEliminar = {
        id_contacto_coordinacion: id,
        embarque_id: embarque_id.toString()
      };
      //console.log('Enviando datos para eliminar contacto:', datosEliminar);
      const response = await api.post('/api/appweb/eliminar-coordinacion-contacto', datosEliminar);
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        datosEliminar,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      throw error;
    }
  };
  return {
    insertarCoordinacionContacto,
    actualizarCoordinacionContacto,
    eliminarCoordinacionContacto
  };
};
// ========================================
// COORDINACIÓN DE DOCUMENTOS
// ========================================
// Hook para obtener lista de documentos de coordinación
export const useFetchCoordinacionDocumentos = (embarque_id) => {
  return useCustomQuery(
    ["coordinacion-documentos", embarque_id],
    async () => {
      try {
        //console.log('Debug - embarque_id para documentos:', embarque_id);
        const endpoint = `/api/appweb/listar-coordinacion-documento?embarque_id=${embarque_id}`;
        const headers = {
          'version_app': '0.0.2',
          'Content-Type': 'application/json',
      }
        //console.log('Debug - endpoint documentos:', endpoint);
        const response = await api.get(endpoint);
        //console.log('Respuesta completa documentos:', response);
        //console.log('response.data documentos:', response.data);
        // Manejar diferentes estructuras de respuesta
        let documentos = [];
        if (Array.isArray(response.data)) {
          documentos = response.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          documentos = response.data.data.data; // Para estructura: {status: 200, data: {data: Array}}
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          documentos = response.data.data; // Para estructura: {data: Array}
        } else {
          console.warn('Estructura de respuesta inesperada para documentos:', response.data);
          documentos = [];
        }
        //console.log('Debug - documentos extraídos:', documentos);
        //console.log('Debug - cantidad de documentos:', documentos.length);
        const documentosProcesados = documentos.map(item => ({ 
          ...item, 
          label: item.DESCRIPCION || item.TIPO_DESCRIPCION || item.URL_ARCHIVO, 
          value: item.DOCUMENTO_ID_COORD 
        }));
        //console.log('Debug - documentos procesados:', documentosProcesados);
        return documentosProcesados;
      } catch (error) {
        console.error('Error al cargar documentos:', {
          endpoint: `/api/appweb/listar-coordinacion-documento?embarque_id=${embarque_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id,
    }
  );
};
// Hook para obtener solo documentos creados desde el módulo de Documentos
export const useFetchDocumentosModulo = (embarque_id) => {
  return useCustomQuery(
    ["documentos-modulo", embarque_id],
    async () => {
      try {
        //console.log('Debug - embarque_id para documentos del módulo:', embarque_id);
        const endpoint = `/api/appweb/listar-coordinacion-documento?embarque_id=${embarque_id}`;
        const headers = {
          'version_app': '0.0.2',
          'Content-Type': 'application/json',
      }
        //console.log('Debug - endpoint documentos del módulo:', endpoint);
        const response = await api.get(endpoint);
        // Manejar diferentes estructuras de respuesta
        let documentos = [];
        if (Array.isArray(response.data)) {
          documentos = response.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          documentos = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          documentos = response.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para documentos del módulo:', response.data);
          documentos = [];
        }
        // Filtrar solo documentos creados desde este módulo
        // Los documentos creados desde aquí tienen URL_ARCHIVO que comienza con "/cropa/coordinaciones/"
        // console.log('Debug - documentos antes del filtro:', documentos);
        const documentosModulo = documentos.filter(item => {
          const urlArchivo = item.URL_ARCHIVO || item.url_archivo || "";
          // Verificar que la ruta comience con "/cropa/coordinaciones/" (que es lo que genera la API)
          const cumpleFiltro = urlArchivo.startsWith("/cropa/coordinaciones/");
          // console.log('Debug - documento:', item.DESCRIPCION, 'URL:', urlArchivo, 'Cumple filtro:', cumpleFiltro);
          return cumpleFiltro;
        });
        // console.log('Debug - documentos del módulo filtrados:', documentosModulo);
        // console.log('Debug - cantidad de documentos del módulo:', documentosModulo.length);
        const documentosProcesados = documentosModulo.map(item => ({ 
          ...item, 
          label: item.DESCRIPCION || item.TIPO_DESCRIPCION || item.URL_ARCHIVO, 
          value: item.DOCUMENTO_ID_COORD 
        }));
        //console.log('Debug - documentos del módulo procesados:', documentosProcesados);
        return documentosProcesados;
      } catch (error) {
        console.error('Error al cargar documentos del módulo:', {
          endpoint: `/api/appweb/listar-coordinacion-documento?embarque_id=${embarque_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id,
    }
  );
};
// Hook para operaciones CRUD de Coordinación de Documentos
export const useCoordinacionDocumentosCRUD = (embarque_id) => {
  // console.log('Hook useCoordinacionDocumentosCRUD ejecutándose con embarque_id:', embarque_id);
  // IMPORTANTE: Llamar el hook incondicionalmente para respetar las reglas de hooks de React
  const { refetch } = useFetchDocumentosModulo(embarque_id);

  // Si no hay embarque_id, retornar funciones que no hacen nada
  if (!embarque_id) {
    // console.warn('useCoordinacionDocumentosCRUD: embarque_id es undefined o null');
    return {
      insertarCoordinacionDocumento: async () => { console.warn('insertarCoordinacionDocumento: embarque_id requerido'); return null; },
      actualizarCoordinacionDocumento: async () => { console.warn('actualizarCoordinacionDocumento: embarque_id requerido'); return null; },
      eliminarCoordinacionDocumento: async () => { console.warn('eliminarCoordinacionDocumento: embarque_id requerido'); return null; },
      subirArchivo: async () => { console.warn('subirArchivo: embarque_id requerido'); return null; }
    };
  }
  const insertarCoordinacionDocumento = async (datos) => {
    try {
      // console.log('Hook insertarCoordinacionDocumento ejecutándose con datos:', datos);
      // Estructura de datos según la API requerida
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        cod_tipo_documento: (datos.cod_tipo_documento || datos.tipo_id_documento)?.toString(),
        ubicacion: datos.ubicacion,
        url_archivo: datos.url_archivo,
        descripcion: datos.descripcion,
        estado_cod: (datos.estado_cod || datos.estado_id)?.toString(),
        documento_id_coord: datos.documento_id_coord?.toString(),
        emb_legs_id: datos.emb_legs_id?.toString()
      };
      // console.log('Datos completos a enviar:', datosCompletos);
      const response = await api.post('/api/appweb/insertar-coordinacion-documento', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionDocumentos'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al insertar documento:', error);
      throw error;
    }
  };
  const actualizarCoordinacionDocumento = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        cod_tipo_documento: datos.cod_tipo_documento.toString(),
        ubicacion: datos.ubicacion,
        url_archivo: datos.url_archivo,
        descripcion: datos.descripcion,
        estado_cod: datos.estado_cod.toString(),
        documento_id_coord: datos.documento_id_coord,
        emb_legs_id: datos.emb_legs_id?.toString()
      };
      //console.log('Enviando datos para actualizar documento:', datosCompletos);
      const response = await api.post('/api/appweb/actualizar-coordinacion-documento', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionDocumentos'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al actualizar documento:', error);
      throw error;
    }
  };
  const eliminarCoordinacionDocumento = async (documento_id) => {
    try {
      const datosEliminar = {
        documento_id_coord: documento_id.toString(), // Cambiado de documento_id a documento_id_coord
        embarque_id: embarque_id.toString()
      };
      //console.log('Enviando datos para eliminar documento:', datosEliminar);
      const response = await api.post('/api/appweb/eliminar-coordinacion-documento', datosEliminar);
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        datosEliminar,
        response.data,
        'CoordinacionDocumentos'
      );
      await refetch(); // Recargar datos automáticamente
      return response.data;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      throw error;
    }
  };
  // Función para subir archivo usando la API de guardar-archivo
  const subirArchivo = async (archivo, tipoDocumento, codTipo, embarqueId, codFile) => {
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("tipo_documento", "coordinaciones");
      formData.append("embarque_id", embarqueId.toString());
      formData.append("cod_file", codFile || "");
      // console.log('Datos del FormData:', {
       // archivo: archivo.name,
       // tipo_documento: "coordinaciones",
       // embarque_id: embarqueId.toString(),
       // cod_file: codFile || ""
      //});
      const response = await api.post("/api/appweb/guardar-archivo", formData);
      const rutaArchivo = response.data.data.ruta_archivo;
      // console.log('Ruta devuelta por la API:', rutaArchivo);
      return rutaArchivo;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw new Error('Error al subir el archivo al servidor');
    }
  };
  return {
    insertarCoordinacionDocumento,
    actualizarCoordinacionDocumento,
    eliminarCoordinacionDocumento,
    subirArchivo
  };
};
// ========================================
// HOOK PARA OBTENER INFORMACIÓN DEL EMBARQUE
// ========================================
export const useFetchEmbarqueInfo = (embarque_id) => {
  return useCustomQuery(
    ["embarque-info", embarque_id],
    async () => {
      try {
        //console.log('Obteniendo información del embarque:', embarque_id);
        // Usar la misma API que InformacionEmbarqueComponent
        const response = await api.get('/api/appweb/lista-coordinacion', {
          params: {
            cod_cc: 16,
            cod_empresa: 1
          },
          headers: {
            'version_app': '0.0.2',
            'Content-Type': 'application/json',
          }
        });
        //console.log('Respuesta de información del embarque:', response.data);
        // Usar la misma lógica que InformacionEmbarqueComponent
        const data = response.data.data.data || [];
        const embarqueInfo = data.find(e => e.embarque_id === embarque_id || e.EMBARQUE_ID === embarque_id);
        //console.log('Información del embarque extraída:', embarqueInfo);
        return embarqueInfo;
      } catch (error) {
        console.error('Error al obtener información del embarque:', {
          embarque_id,
          endpoint: '/api/appweb/lista-coordinacion',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id,
    }
  );
};
// ========================================
// HOOK PARA OBTENER TODOS LOS EMBARQUES (LISTA-COORDINACION)
// ========================================
export const useFetchListaCoordinacion = (params = {}) => {
  return useCustomQuery(
    ["lista-coordinacion", params],
    async () => {
      try {
        const defaultParams = {
          cod_cc: 16,
          cod_empresa: 1,
          ...params
        };
        const response = await api.get('/api/appweb/lista-coordinacion', {
          params: defaultParams,
          headers: {
            'version_app': '0.0.2',
            'Content-Type': 'application/json',
          }
        });
        let embarques = [];
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          embarques = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          embarques = response.data.data;
        } else if (Array.isArray(response.data)) {
          embarques = response.data;
        } else {
          console.warn('Estructura de respuesta inesperada para lista-coordinacion:', response.data);
          embarques = [];
        }
        return embarques;
      } catch (error) {
        console.error('Error al obtener lista de coordinación:', {
          params,
          endpoint: '/api/appweb/lista-coordinacion',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: true, // Siempre habilitado
    }
  );
};
// ========================================
// HOOK PARA OBTENER TODOS LOS EMBARQUES DEL USUARIO
// ========================================
export const useFetchEmbarquesUsuario = (usuario) => {
  return useCustomQuery(
    ["embarques-usuario", usuario],
    async () => {
      try {
        //console.log('Obteniendo embarques del usuario:', usuario);
        const response = await api.get('/api/appweb/lista-coordinacion', {
          params: {
            cod_cc: 16,
            cod_empresa: 1
          },
        });
        //console.log("Respuesta de la API:", response.data);
        //console.log("Array de embarques del usuario:", response.data.data.data);
        // Filtrar embarques que fueron creados por el usuario actual
        const embarquesFiltrados = (response.data.data.data || []).filter(embarque =>
          embarque.usuario_correo_crea === usuario
        );
        return embarquesFiltrados;
      } catch (error) {
        console.error('Error al obtener embarques del usuario:', {
          usuario,
          endpoint: '/api/appweb/lista-coordinacion',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!usuario,
    }
  );
};
// ========================================
// HOOK PRINCIPAL PARA EMBARQUES
// ========================================
export const useEmbarques = (embarque_id) => {
  const coordinacionFechaMov = useFetchCoordinacionFechaMov(embarque_id);
  const coordinacionFechaMovCRUD = useCoordinacionFechaMovCRUD(embarque_id);
  const fechasEmbarque = useFetchFechasEmbarque(embarque_id);
  const fechasEmbarqueCRUD = useFechasEmbarqueCRUD(embarque_id);
  const coordinacionContacto = useFetchCoordinacionContacto(embarque_id);
  const coordinacionContactoCRUD = useCoordinacionContactoCRUD(embarque_id);
  const coordinacionDocumentos = useFetchCoordinacionDocumentos(embarque_id);
  const coordinacionDocumentosCRUD = useCoordinacionDocumentosCRUD(embarque_id);
  const entidades = useFetchEntidades("CLIENTE");
  const embarqueInfo = useFetchEmbarqueInfo(embarque_id);
  return {
    coordinacionFechaMov,
    coordinacionFechaMovCRUD,
    fechasEmbarque,
    fechasEmbarqueCRUD,
    coordinacionContacto,
    coordinacionContactoCRUD,
    coordinacionDocumentos,
    coordinacionDocumentosCRUD,
    entidades,
    embarqueInfo,
  };
};
// ========================================
// COORDINACIÓN DE CARGA
// ========================================

export const useFetchCoordinacionCarga = (embarque_id, emb_legs_id = null) => {
  return useCustomQuery(
    ["coordinacion-carga", embarque_id, emb_legs_id],
    async () => {
      try {
        //console.log('Debug - embarque_id para carga:', embarque_id);
        //console.log('Debug - emb_legs_id para carga:', emb_legs_id);
        let endpoint = `/api/appweb/listar-coordinacion-carga?embarque_id=${embarque_id}`;
        if (emb_legs_id) {
          endpoint += `&emb_legs_id=${emb_legs_id}`;
        }
        //console.log('Debug - endpoint carga:', endpoint);
        const response = await api.get(endpoint);
        //console.log('Respuesta completa carga:', response);
        //console.log('response.data carga:', response.data);
        // Manejar diferentes estructuras de respuesta
        let cargas = [];
        if (Array.isArray(response.data)) {
          cargas = response.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          cargas = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          cargas = response.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para carga:', response.data);
          cargas = [];
        }
        // console.log('Debug - cargas extraídas:', cargas);
        // console.log('Debug - estructura de respuesta:', response.data);
        return cargas;
      } catch (error) {
        console.error('Error al cargar cargas:', {
          endpoint: `/api/appweb/listar-coordinacion-carga?embarque_id=${embarque_id}${emb_legs_id ? `&emb_legs_id=${emb_legs_id}` : ''}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id && (emb_legs_id === null || !!emb_legs_id),
    }
  );
};
// ========================================
// OBTENER RUBROS PARA CARGA
// ========================================
export const useFetchRubros = (options = {}) => {
  const { enabled = true } = options;
  return useCustomQuery(
    ["lista-rubros"],
    async () => {
      // IMPORTANTE: Verificar si estamos en modo público y no hacer llamadas a /api/appweb/
      const isModoPublico = window.location.pathname.includes('/public');
      if (isModoPublico) {
        return Promise.resolve([]);
      }

      const response = await api.get('/api/appweb/lista-rubros');
            // Soportar múltiples estructuras
      const lista = response?.data?.data || response?.data || [];
      return (Array.isArray(lista) ? lista : []).map((item) => ({
        value: item.COD_RUBRO || item.cod_rubro || item.ID || item.id,
        label: item.NOMBRE || item.nombre || item.NOM_RUBRO || item.nom_rubro || String(item.COD_RUBRO || item.cod_rubro || item.ID || item.id),
        raw: item
      }));
    },
    {
      ...defaultOptions,
      enabled,
    }
  );
};
// Hook para operaciones CRUD de Coordinación de Carga
export const useCoordinacionCargaCRUD = (embarque_id, emb_legs_id = null) => {
  const { refetch, data: cargasExistentes } = useFetchCoordinacionCarga(embarque_id, emb_legs_id);
  const insertarCoordinacionCarga = async (datos) => {
    try {
      // Validar y convertir campos numéricos antes de enviar
      const validarNumero = (valor, campo) => {
        if (valor === "" || valor === null || valor === undefined) {
          return "0";
        }
        const num = parseFloat(valor);
        return isNaN(num) ? "0" : num.toString();
      };
      // Estructura de datos según la nueva API con campos opcionales
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        rubro_id: datos.RUBRO_ID.toString(),
        bultos: validarNumero(datos.BULTOS, "BULTOS"),
        cod_tipo_unidad_medidad: datos.TIPO_ID_UNIDAD_MEDIDA.toString(),
        peso: validarNumero(datos.PESO, "PESO"),
        volumen: validarNumero(datos.VOLUMEN, "VOLUMEN"),
        metros_cubicos: validarNumero(datos.METROS_CUBICOS, "METROS_CUBICOS"),
        char_w: validarNumero(datos.CW, "CW"),
        valor: validarNumero(datos.VALOR, "VALOR"),
        estado_cod: datos.ESTADO_ID.toString(),
        descripcion_carga: datos.DESCRIPCION_CARGA || "",
        cod_pais_origen_carga: datos.COD_PAIS_ORIGEN_CARGA || "",
        cod_ciudad_origen_carga: datos.COD_CIUDAD_ORIGEN_CARGA || "",
        partida_arancelaria: datos.PARTIDA_ARANCELARIA || null,
        regimen_aduanal: datos.REGIMEN_ADUANAL || null,
        definitivo_general: datos.DEFINITIVO_GENERAL || "N"
      };
      // Solo incluir emb_legs_id si no está vacío
      if (datos.EMB_LEGS_ID && datos.EMB_LEGS_ID !== "" && datos.EMB_LEGS_ID !== null) {
        datosCompletos.emb_legs_id = datos.EMB_LEGS_ID;
      }
      // console.log('Enviando datos para crear carga:', datosCompletos);
      const response = await api.post('/api/appweb/insertar-coordinacion-carga', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionCarga'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al insertar carga:', error);
      throw error;
    }
  };
  const actualizarCoordinacionCarga = async (datos) => {
    try {
      // Validar y convertir campos numéricos antes de enviar
      const validarNumero = (valor, campo) => {
        if (valor === "" || valor === null || valor === undefined) {
          return "0";
        }
        const num = parseFloat(valor);
        return isNaN(num) ? "0" : num.toString();
      };
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        rubro_id: datos.RUBRO_ID.toString(),
        bultos: validarNumero(datos.BULTOS, "BULTOS"),
        cod_tipo_unidad_medidad: datos.TIPO_ID_UNIDAD_MEDIDA.toString(),
        peso: validarNumero(datos.PESO, "PESO"),
        volumen: validarNumero(datos.VOLUMEN, "VOLUMEN"),
        metros_cubicos: validarNumero(datos.METROS_CUBICOS, "METROS_CUBICOS"),
        char_w: validarNumero(datos.CW, "CW"),
        valor: validarNumero(datos.VALOR, "VALOR"),
        estado_cod: datos.ESTADO_ID.toString(),
        emb_carga_id: datos.EMB_CARGA_ID.toString(), // Requerido en actualizar
        descripcion_carga: datos.DESCRIPCION_CARGA || "",
        cod_pais_origen_carga: datos.COD_PAIS_ORIGEN_CARGA || "",
        // cod_ciudad_origen_carga puede ser requerido por API; lo incluimos si viene
        ...(datos.COD_CIUDAD_ORIGEN_CARGA ? { cod_ciudad_origen_carga: datos.COD_CIUDAD_ORIGEN_CARGA } : {}),
        partida_arancelaria: datos.PARTIDA_ARANCELARIA || null,
        regimen_aduanal: datos.REGIMEN_ADUANAL || null,
        definitivo_general: datos.DEFINITIVO_GENERAL || "N"
      };
      // Solo incluir emb_legs_id si no está vacío
      const embLegsId = (typeof emb_legs_id !== 'undefined' && emb_legs_id !== null ? emb_legs_id.toString() : datos.EMB_LEGS_ID);
      if (embLegsId && embLegsId !== "" && embLegsId !== null) {
        datosCompletos.emb_legs_id = embLegsId;
      }
      const response = await api.post('/api/appweb/actualizar-coordinacion-carga', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionCarga'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al actualizar carga:', error);
      throw error;
    }
  };
  const eliminarCoordinacionCarga = async (emb_carga_id) => {
    try {
      const datosEliminar = {
        emb_carga_id: emb_carga_id.toString(),
        embarque_id: embarque_id.toString()
      };
      //console.log('Enviando datos para eliminar carga:', datosEliminar);      
      const response = await api.post('/api/appweb/eliminar-coordinacion-carga', datosEliminar);
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        datosEliminar,
        response.data,
        'CoordinacionCarga'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al eliminar carga:', error);
      throw error;
    }
  };
  return {
    insertarCoordinacionCarga,
    actualizarCoordinacionCarga,
    eliminarCoordinacionCarga
  };
};
// ========================================
// COORDINACIÓN DE EQUIPOS
// ========================================
export const useFetchCoordinacionEquipo = (embarque_id, emb_legs_id = null) => {
  return useCustomQuery(
    ["coordinacion-equipo", embarque_id, emb_legs_id],
    async () => {
      try {
        //console.log('Fetching coordinación de equipos para embarque_id:', embarque_id, 'emb_legs_id:', emb_legs_id);
        let endpoint = `/api/appweb/listar-coordinacion-equipo?embarque_id=${embarque_id}`;
        if (emb_legs_id) {
          endpoint += `&emb_legs_id=${emb_legs_id}`;
        }
        const response = await api.get(endpoint);
        //console.log('Respuesta de coordinación de equipos:', response.data);
        // Verificar si la respuesta tiene la estructura esperada
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          //console.log('Extrayendo datos de response.data.data:', response.data.data);
          return response.data.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          //console.log('Extrayendo datos de response.data.data.data:', response.data.data.data);
          return response.data.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para equipos:', response.data);
          return [];
        }
      } catch (error) {
        console.error('Error al obtener coordinación de equipos:', {
          embarque_id,
          emb_legs_id,
          endpoint: `/api/appweb/listar-coordinacion-equipo?embarque_id=${embarque_id}${emb_legs_id ? `&emb_legs_id=${emb_legs_id}` : ''}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id && (emb_legs_id === null || !!emb_legs_id),
    }
  );
};
// Hook para operaciones CRUD de Coordinación de Equipos
export const useCoordinacionEquipoCRUD = (embarque_id, emb_legs_id = null) => {
  const { refetch } = useFetchCoordinacionEquipo(embarque_id, emb_legs_id);
  const insertarCoordinacionEquipo = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        equipo_id: datos.EQUIPO_ID?.toString() || "",
        marchamo: datos.MARCHAMO?.toString() || "",
        descripcion: datos.DESCRIPCION?.toString() || "",
        estado_cod: "1" // Siempre Activo
      };
      
      // Solo agregar emb_legs_id si no es null
      if (emb_legs_id !== null) {
        datosCompletos.emb_legs_id = emb_legs_id.toString();
      }
      //console.log('Enviando datos para crear equipo:', datosCompletos);
      const response = await api.post('/api/appweb/insertar-coordinacion-equipo', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionEquipo'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al insertar equipo:', error);
      throw error;
    }
  };
  const actualizarCoordinacionEquipo = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        emb_equipo_id: datos.EMB_EQUIPO_ID?.toString() || "",
        equipo_id: datos.EQUIPO_ID?.toString() || "",
        marchamo: datos.MARCHAMO?.toString() || "",
        descripcion: datos.DESCRIPCION?.toString() || "",
        estado_cod: "1" // Siempre Activo
      };
      
      // Solo agregar emb_legs_id si no es null
      if (emb_legs_id !== null) {
        datosCompletos.emb_legs_id = emb_legs_id.toString();
      }
      //console.log('Enviando datos para actualizar equipo:', datosCompletos);
      const response = await api.post('/api/appweb/actualizar-coordinacion-equipo', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionEquipo'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      throw error;
    }
  };
  const eliminarCoordinacionEquipo = async (emb_equipo_id) => {
    try {
      //console.log('Eliminando equipo con ID:', emb_equipo_id);
      const response = await api.post('/api/appweb/eliminar-coordinacion-equipo', {
        emb_equipo_id: emb_equipo_id.toString()
      });
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        { emb_equipo_id: emb_equipo_id.toString() },
        response.data,
        'CoordinacionEquipo'
      );
      await refetch();
      return response.data
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      throw error;
    }
  };
  return {
    insertarCoordinacionEquipo,
    actualizarCoordinacionEquipo,
    eliminarCoordinacionEquipo
  };
};
// ========================================
// HOOKS PARA BITÁCORAS (HISTÓRICO DE COORDINACIÓN)
// ========================================
export const useFetchBitacoras = (embarque_id, cod_emb_legs = null) => {
  return useCustomQuery(
    ["bitacoras", embarque_id, cod_emb_legs],
    async () => {
      try {
        //console.log('Fetching bitácoras para embarque_id:', embarque_id, 'cod_emb_legs:', cod_emb_legs);
        let url = `/api/appweb/lista-historico-coordinacion?embarque_id=${embarque_id}`;
        if (cod_emb_legs) {
          url += `&cod_emb_legs=${cod_emb_legs}`;
        }        
        const response = await api.get(url);
        //console.log('Respuesta de bitácoras:', response.data);
        // Verificar si la respuesta tiene la estructura esperada
        if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          //console.log('Extrayendo datos de response.data.data.data:', response.data.data.data);
          return response.data.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn('Estructura de respuesta inesperada para bitácoras:', response.data);
          return [];
        }
      } catch (error) {
        console.error('Error al obtener bitácoras:', {
          embarque_id,
          cod_emb_legs,
          endpoint: `/api/appweb/lista-historico-coordinacion?embarque_id=${embarque_id}`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id,
    }
  );
};
export const useBitacorasCRUD = (embarque_id) => {
  const { refetch } = useFetchBitacoras(embarque_id);
  const insertarBitacora = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        cod_tipo: datos.COD_TIPO?.toString() || "",
        json_modificacion: datos.JSON_MODIFICACION || "{}"
      };
      //console.log('Enviando datos para crear bitácora:', datosCompletos);
      const response = await api.post('/api/appweb/insertar-historico-coordinacion', datosCompletos);
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al insertar bitácora:', error);
      throw error;
    }
  };
  return {
    insertarBitacora
  };
};
// ========================================
// COORDINACIÓN DE TRAMOS (LEGS)
// ========================================
export const useFetchCoordinacionLegs = (embarque_id) => {
  const { cod_cc, cod_empresa } = useFetchCodCcEmpresa();
  return useCustomQuery(
    ["coordinacion-legs", embarque_id, cod_cc, cod_empresa],
    async () => {
      try {        
        if (!cod_cc || !cod_empresa) {
          throw new Error('No se pudieron obtener cod_cc o cod_empresa');
        }
        // Solo llamas al endpoint, sin headers manuales
        // const url = `/api/appweb/listar-coordinacion-legs?embarque_id=${embarque_id}&cod_cc=${cod_cc}&cod_empresa=${cod_empresa}`; 
        const url = `/api/appweb/listar-coordinacion-legs?embarque_id=${embarque_id}&cod_cc=16&cod_empresa=1`;
        const response = await api.get(url);
        // console.log('Respuesta de coordinación de legs:', response.data);
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        } else {
          console.warn('Estructura de respuesta inesperada para legs:', response.data);
          return [];
        }
      } catch (error) {
        console.error('Error al obtener coordinación de legs:', {
          embarque_id,
          cod_cc,
          cod_empresa,
          endpoint: `/api/appweb/listar-coordinacion-legs?embarque_id=${embarque_id}&cod_cc=16&cod_empresa=1`,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!embarque_id && !!cod_cc && !!cod_empresa,
    }
  );
};
// Hook para operaciones CRUD de Coordinación de Legs
export const useCoordinacionLegsCRUD = (embarque_id) => {
  const { refetch } = useFetchCoordinacionLegs(embarque_id);
  const insertarCoordinacionLegs = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        cod_file: datos.COD_FILE || "",
        cod_tipo_transporte: datos.COD_TIPO_TRANSPORTE?.toString() || "",
        // cod_entidad_prov: datos.COD_ENTIDAD_PROV?.toString() || "",
        cod_pais_origen: datos.COD_PAIS_ORIGEN?.toString() || "",
        cod_pais_destino: datos.COD_PAIS_DESTINO?.toString() || "",
        puerto_id_origen: datos.PUERTO_ID_ORIGEN?.toString() || "",
        puerto_id_destino: datos.PUERTO_ID_DESTINO?.toString() || "",
        cod_servicio: datos.COD_SERVICIO?.toString() || "",
        cod_tipo_carga: datos.COD_TIPO_CARGA?.toString() || "",
        estado_cod: datos.ESTADO_COD?.toString() || "1",
        master_number: datos.MASTER_NUMBER || "",
        flight_number: datos.FLIGHT_NUMBER || "",
        vessel_name: datos.VESSEL_NAME || "",
        voyage_number: datos.VOYAGE_NUMBER || "",
        url_documento_soporte: datos.URL_DOCUMENTO_SOPORTE || "",
        costo_estimado: datos.COSTO_ESTIMADO?.toString() || "0",
        costo_real: datos.COSTO_REAL?.toString() || "0"
      };
      //console.log('=== ENVIANDO DATOS PARA CREAR LEG ===');
      //console.log('datosCompletos:', datosCompletos);
      //console.log('url_documento_soporte:', datosCompletos.url_documento_soporte);
      const response = await api.post('/api/appweb/insertar-coordinacion-legs', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionLegs'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al insertar leg:', error);
      throw error;
    }
  };
  const actualizarCoordinacionLegs = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        emb_legs_id: datos.emb_legs_id?.toString() || datos.EMB_LEGS_ID?.toString() || "",
        cod_file: datos.cod_file || datos.COD_FILE || "",
        cod_tipo_transporte: datos.cod_tipo_transporte?.toString() || datos.COD_TIPO_TRANSPORTE?.toString() || "",
        cod_entidad_prov: datos.cod_entidad_prov?.toString() || datos.COD_ENTIDAD_PROV?.toString() || "1",
        cod_pais_origen: datos.cod_pais_origen?.toString() || datos.COD_PAIS_ORIGEN?.toString() || "",
        cod_pais_destino: datos.cod_pais_destino?.toString() || datos.COD_PAIS_DESTINO?.toString() || "",
        puerto_id_origen: datos.puerto_id_origen?.toString() || datos.PUERTO_ID_ORIGEN?.toString() || "",
        puerto_id_destino: datos.puerto_id_destino?.toString() || datos.PUERTO_ID_DESTINO?.toString() || "",
        cod_servicio: datos.cod_servicio?.toString() || datos.COD_SERVICIO?.toString() || "",
        cod_tipo_carga: datos.cod_tipo_carga?.toString() || datos.COD_TIPO_CARGA?.toString() || "",
        estado_cod: datos.estado_cod?.toString() || datos.ESTADO_COD?.toString() || "1",
        master_number: datos.master_number || datos.MASTER_NUMBER || "",
        flight_number: datos.flight_number || datos.FLIGHT_NUMBER || "",
        vessel_name: datos.vessel_name || datos.VESSEL_NAME || "",
        voyage_number: datos.voyage_number || datos.VOYAGE_NUMBER || "",
        url_documento_soporte: datos.url_documento_soporte || datos.URL_DOCUMENTO_SOPORTE || "",
        costo_estimado: datos.costo_estimado?.toString() || datos.COSTO_ESTIMADO?.toString() || "0",
        costo_real: datos.costo_real?.toString() || datos.COSTO_REAL?.toString() || "0"
      };
      // Verificar que emb_legs_id no esté vacío
      if (!datosCompletos.emb_legs_id) {
        throw new Error('emb_legs_id es requerido para actualizar un tramo');
      }
      const response = await api.post('/api/appweb/actualizar-coordinacion-legs', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionLegs'
      );
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error al actualizar leg:', error);
      throw error;
    }
  };
  return {
    insertarCoordinacionLegs,
    actualizarCoordinacionLegs
  };
};
// ========================================
// HOOK PARA OBTENER TIPOS DE TRANSPORTE
// ========================================
export const useFetchTiposTransporte = () => {
  return useCustomQuery(
    ["tipos-transporte"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo', {
        params: {
          tipo_tabla: "TRANSPORTE"
        },
      });
      // Transformar los datos para que tengan value y label
      const data = response.data.data || [];
      return data.map(tipo => ({
        ...tipo,
        value: tipo.COD_TIPO || tipo.cod_tipo,
        label: tipo.NOM_TIPO || tipo.nom_tipo
      }));
    },  
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};
// ========================================
// HOOK PARA OBTENER TIPOS DE SERVICIO POR TRANSPORTE
// ========================================
export const useFetchRelacionesTipos = () => {
  return useCustomQuery(
    ["relaciones-tipos"],
    async () => {
      const response = await api.get('/api/appweb/lista-relacion-tipo', {
        params: {
          tipo_tabla: "SERVICIO"
        },
      });
      return response.data.data || [];
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );
};
//HOOK PARA OBTENER TIPOS DE DOCUMENTOS REQUERIDOS PARA EXPORTACION EN PANTALLA DE COTIZACIONES APROBADAS
export const useFetchTiposDocumentosRequeridos = () => {
  return useCustomQuery(
    ["tipos-documentos-requeridos"],
    async () => {
      const response = await api.get('/api/appweb/lista-relacion-tipo', {
        params: {
          tipo_tabla: "DETALLE_DOCUMENTOS_COTIZACION"
        },
      });
      return response.data.data || [];
    },
  );
};



// ========================================
// HOOK PARA OBTENER TIPOS DE CARGA
// ========================================
export const useFetchTiposCarga = () => {
  return useCustomQuery(
    ["tipos-carga"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo', {
        params: {
          tipo_tabla: "TIPO_CARGA"
        },
      });
      return (response.data.data || []).map(tipo => ({
        value: tipo.COD_TIPO || tipo.cod_tipo,
        label: tipo.NOM_TIPO || tipo.nom_tipo
      }));
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

// ========================================
// HOOK PARA OBTENER CRITERIO CABEZERA COTIZACION
// ========================================
export const useFetchCriterioCabezeraCotizacion = (params = {}) => {
  return useCustomQuery(
    ["criterio-cabezera-cotizacion", params],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-cotizacion-cabecera', {
          params: {
            ...params
          },
          headers: {
            'version_app': '0.0.2',
            'Content-Type': 'application/json',
          }
        });
        
        // Manejar diferentes estructuras de respuesta
        let cotizaciones = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          cotizaciones = response.data.data;
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          cotizaciones = response.data.data.data;
        } else if (Array.isArray(response.data)) {
          cotizaciones = response.data;
        } else {
          console.warn('Estructura de respuesta inesperada para criterio-cabezera-cotizacion:', response.data);
          cotizaciones = [];
        }
        
        return cotizaciones;
      } catch (error) {
        console.error('Error al obtener criterio cabezera cotizacion:', {
          params,
          endpoint: '/api/appweb/lista-cotizacion-cabecera',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};
// ========================================
// HOOK PARA OBTENER UNIDADES DE MEDIDA
// ========================================
export const useFetchUnidadesMedida = (options = {}) => {
  const { enabled = true } = options;
  return useCustomQuery(
    ["unidades-medida"],
    async () => {
      // IMPORTANTE: Verificar si estamos en modo público y no hacer llamadas a /api/appweb/
      const isModoPublico = window.location.pathname.includes('/public');
      if (isModoPublico) {
        return Promise.resolve([]);
      }

      const response = await api.get('/api/appweb/lista-tipo', {
        params: {
          tipo_tabla: "coordinacion_carga"
        },
      });
      return (response.data.data || []).map(tipo => ({
        value: tipo.COD_TIPO || tipo.cod_tipo,
        label: tipo.NOM_TIPO || tipo.nom_tipo
      }));
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      enabled,
    }
  );
};
// ========================================
// HOOK PARA OBTENER TIPOS DE DOCUMENTO
// ========================================
export const useFetchTiposDocumento = () => {
  return useCustomQuery(
    ["tipos-documento"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo', {
        params: {
          tipo_tabla: "coordinacion documentos"
        },
      });
      //console.log('Respuesta de tipos de documento:', response.data);
      return (response.data.data || []).map(tipo => ({
        value: tipo.COD_TIPO || tipo.cod_tipo,
        label: tipo.NOM_TIPO || tipo.nom_tipo
      }));
    },
    {
      ...defaultOptions,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};
// ========================================
// HOOK PARA OBTENER TIPOS DE ENTIDAD (COOR)
// ========================================
// HOOK PARA OBTENER NOMBRES DE ENTIDAD
// ========================================
export const useFetchEntidadNombres = (entidad_id, cod_tipo) => {
  return useCustomQuery(
    ["entidad-nombres", entidad_id, cod_tipo],
    async () => {
      try {
        if (!entidad_id || !cod_tipo) {
          return null;
        }

        const response = await api.get('/api/appweb/lista-entidad-nombres', {
          params: {
            entidad_id: entidad_id,
            cod_tipo: cod_tipo
          }
        });

        if (response.data?.status === 200 && response.data?.data?.data && Array.isArray(response.data.data.data)) {
          const entidadData = response.data.data.data[0];
          return entidadData ? {
            ENTIDAD_NOMBRE: entidadData.ENTIDAD_NOMBRE || entidadData.entidad_nombre,
            CODIGO_ENTIDAD: entidadData.CODIGO_ENTIDAD || entidadData.codigo_entidad,
            ENTIDAD_ID: entidadData.ENTIDAD_ID || entidadData.entidad_id,
            COD_TIPO: entidadData.COD_TIPO || entidadData.cod_tipo,
            TIPO_DESCRIPCION: entidadData.TIPO_DESCRIPCION || entidadData.tipo_descripcion
          } : null;
        }
        
        return null;
      } catch (error) {
        console.error('Error al obtener nombres de entidad:', {
          entidad_id,
          cod_tipo,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return null;
      }
    },
    {
      ...defaultOptions,
      enabled: !!entidad_id && !!cod_tipo,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );
};

// ========================================
// HOOK PARA OBTENER CONTACTOS DE ENTIDAD
// ========================================
export const useFetchEntidadContacto = (entidad_id, cod_tipo) => {
  return useCustomQuery(
    ["entidad-contacto", entidad_id, cod_tipo],
    async () => {
      try {
        if (!entidad_id || !cod_tipo) {
          return null;
        }

        const response = await api.get('/api/appweb/lista-entidad-contacto', {
          params: {
            entidad_id: entidad_id,
            cod_tipo: cod_tipo
          }
        });

        if (response.data?.status === 200 && response.data?.data?.data && Array.isArray(response.data.data.data)) {
          const contactoData = response.data.data.data[0];
          return contactoData ? {
            ENTIDADCONTACTO_NOMBRE: contactoData.ENTIDADCONTACTO_NOMBRE || contactoData.entidadcontacto_nombre,
            ENTIDADCONTACTO_EMAIL: contactoData.ENTIDADCONTACTO_EMAIL || contactoData.entidadcontacto_email,
            ENTIDADCONTACTO_TELEFONO: contactoData.ENTIDADCONTACTO_TELEFONO || contactoData.entidadcontacto_telefono,
            ENTIDADCONTACTO_ID: contactoData.ENTIDADCONTACTO_ID || contactoData.entidadcontacto_id,
            ENTIDAD_ID: contactoData.ENTIDAD_ID || contactoData.entidad_id,
            COD_TIPO: contactoData.COD_TIPO || contactoData.cod_tipo
          } : null;
        }
        
        return null;
      } catch (error) {
        console.error('Error al obtener contactos de entidad:', {
          entidad_id,
          cod_tipo,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return null;
      }
    },
    {
      ...defaultOptions,
      enabled: !!entidad_id && !!cod_tipo,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );
};

// ========================================
// HOOK PARA OBTENER TIPOS DE PAGO
// ========================================
export const useFetchTiposPago = () => {
  return useCustomQuery(
    ["tipos-pago"],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-tipo', {
          params: {
            tipo_tabla: "pago"
          }
        });

        if (response.data?.status === 200 && response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data.map(tipo => ({
            COD_TIPO: tipo.COD_TIPO || tipo.cod_tipo,
            NOM_TIPO: tipo.NOM_TIPO || tipo.nom_tipo,
            TIPO_TABLA: tipo.TIPO_TABLA || tipo.tipo_tabla,
            COD_ESTADO: tipo.COD_ESTADO || tipo.cod_estado,
            ESTADO_DESC: tipo.ESTADO_DESC || tipo.estado_desc
          }));
        }
        
        return [];
      } catch (error) {
        console.error('Error al obtener tipos de pago:', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        return [];
      }
    },
    {
      ...defaultOptions,
      staleTime: 10 * 60 * 1000, // 10 minutos (catálogo estático)
      cacheTime: 30 * 60 * 1000, // 30 minutos
    }
  );
};

// ========================================
// HOOK PARA OBTENER TIPOS DE ENTIDAD (SHIPPER Y CONSIGNATARIO)
// ========================================
export const useFetchTiposEntidad = () => {
  //console.log('Hook useFetchTiposEntidad ejecutándose...');
  return useCustomQuery(
    ["tipos-entidad-coor"],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-tipo', {
          params: {
            tipo_tabla: "entidad"
          },
        });
        //console.log('Respuesta completa de tipos de entidad:', response.data);
        if (!response.data || !response.data.data) {
          //console.log('No hay datos en la respuesta');
          return [];
        }        
        // Filtrar solo los tipos específicos: SHIPPER y CONSIGNATARIO usando NOMENCLATURA: "COOR"
        const tiposEspecificos = response.data.data.filter(tipo => {
          const nomenclatura = tipo.NOMENCLATURA || tipo.nomenclatura;
          //console.log('Revisando tipo:', tipo.NOM_TIPO || tipo.nom_tipo, 'NOMENCLATURA:', nomenclatura);
          return nomenclatura === "COOR"; // SHIPPER y CONSIGNATARIO
        });
        //console.log('Tipos específicos filtrados:', tiposEspecificos);
        // Ordenar: SHIPPER primero, luego CONSIGNATARIO
        const tiposOrdenados = tiposEspecificos.sort((a, b) => {
          const nomA = (a.NOM_TIPO || a.nom_tipo || '').toUpperCase();
          const nomB = (b.NOM_TIPO || b.nom_tipo || '').toUpperCase();
          // SHIPPER va primero
          if (nomA.includes('SHIPPER') && !nomB.includes('SHIPPER')) return -1;
          if (!nomA.includes('SHIPPER') && nomB.includes('SHIPPER')) return 1;
          // Si ambos son del mismo tipo, ordenar alfabéticamente
          return nomA.localeCompare(nomB);
        });
        const tiposProcesados = tiposOrdenados.map(tipo => ({
          value: tipo.COD_TIPO || tipo.cod_tipo, 
          label: tipo.NOM_TIPO || tipo.nom_tipo,
          cod_tipo: tipo.COD_TIPO || tipo.cod_tipo,
          nom_tipo: tipo.NOM_TIPO || tipo.nom_tipo,
          nomenclatura: tipo.NOMENCLATURA || tipo.nomenclatura
        }));
        // console.log('Tipos procesados para el select:', tiposProcesados);
        return tiposProcesados;
      } catch (error) {
        console.error('Error en useFetchTiposEntidad:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};
// ========================================
// HOOK PARA INSERTAR CONTACTO DE ENTIDAD
// ========================================
export const useInsertarEntidadContacto = () => {
  return useCustomMutation({
    mutationFn: async (contactoData) => {
      const response = await api.post('/api/appweb/insertar-entidad-contacto', contactoData);
      return response.data;
    },
    onSuccess: (data) => {
      //console.log('Contacto de entidad insertado exitosamente:', data);
    },
    onError: (error) => {
      console.error('Error al insertar contacto de entidad:', error);
    }
  });
};
// ========================================
// HOOK PARA INSERTAR DIRECCIÓN DE ENTIDAD
// ========================================
export const useInsertarEntidadDireccion = () => {
  return useCustomMutation({
    mutationFn: async (direccionData) => {
      const response = await api.post('/api/appweb/insertar-entidad-direccion', direccionData);
      return response.data;
    },
    onSuccess: (data) => {
      //console.log('Dirección de entidad insertada exitosamente:', data);
    },
    onError: (error) => {
      console.error('Error al insertar dirección de entidad:', error);
    }
  });
};
// ========================================
// HOOK PARA OBTENER CONTACTOS DE UNA ENTIDAD
// ========================================
export const useFetchEntidadContactos = (codTipo, entidadId, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidad-contactos", codTipo, entidadId],
    async () => {
      // Doble verificación de modo público
      if (isModoPublico) return [];
      if (!codTipo || !entidadId) {
        return [];
      }
        const response = await api.get('/api/appweb/lista-entidad-contacto', {
        params: {
          cod_tipo: codTipo,
          entidad_id: entidadId
        },
      });
      // console.log('Parámetros de consulta - codTipo:', codTipo, ', entidadId:', entidadId);
      // Manejar la estructura anidada de la respuesta
      let datosOriginales = [];
      if (response.data?.data?.data) {
        // Estructura: {data: {data: {data: [...]}}}
        datosOriginales = response.data.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Estructura: {data: [...]}
        datosOriginales = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Estructura: [...]
        datosOriginales = response.data;
      } else {
        console.warn('Estructura de respuesta inesperada para contactos:', response.data);
        datosOriginales = [];
      }
      //console.log('Datos originales extraídos:', datosOriginales);
      // Obtener la información del tipo de entidad basándose en codTipo
      let tipoEntidadDescripcion = "N/A";
      try {
        const tiposResponse = await api.get('/api/appweb/lista-tipo?tipo_tabla=entidad', {
        });
        if (tiposResponse.data?.data) {
          const tipoEncontrado = tiposResponse.data.data.find(tipo =>
            (tipo.COD_TIPO || tipo.cod_tipo) === codTipo
          );
          if (tipoEncontrado) {
            tipoEntidadDescripcion = tipoEncontrado.NOM_TIPO || tipoEncontrado.nom_tipo;
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener la descripción del tipo de entidad:', error);
      }
      const datosProcesados = datosOriginales.map(contacto => ({
        value: contacto.ENTIDADCONTACTO_ID || contacto.entidadcontacto_id,
        label: contacto.ENTIDADCONTACTO_NOMBRE || contacto.entidadcontacto_nombre,
        entidadId: entidadId,
        email: contacto.ENTIDADCONTACTO_EMAIL || contacto.entidadcontacto_email,
        telefono: contacto.ENTIDADCONTACTO_TELEFONO || contacto.entidadcontacto_telefono,
        // Agregar información del tipo de entidad
        TIPO_ENTIDAD_DESCRIPCION: tipoEntidadDescripcion,
        COD_TIPO: codTipo,
        // Incluir datos originales para la tabla
        datosOriginales: contacto
      }));

      // console.log('Contactos procesados para select:', datosProcesados);
      return datosProcesados; // Retornar directamente el array
    },
    {
      enabled: !!(codTipo && entidadId) && !isModoPublico && options.enabled !== false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      ...options,
    }
  );
};
// ========================================
// HOOK PARA OBTENER TIPOS DE CONTACTO
// ========================================
export const useFetchTiposContacto = (options = {}) => {
  const { enabled = true } = options;
  return useCustomQuery(
    ["tipos-contacto"],
    async () => {
      try {
        const response = await api.get('/api/appweb/lista-tipo', {
          params: {
            tipo_tabla: "entidad_contactos"
          },
        });
        //console.log('Respuesta completa de tipos de contacto:', response.data);
        if (!response.data || !response.data.data) {
          //console.log('No hay datos en la respuesta de tipos de contacto');
          return [];
        }
        const tiposProcesados = response.data.data.map(tipo => ({
          value: tipo.COD_TIPO || tipo.cod_tipo,
          label: tipo.NOM_TIPO || tipo.nom_tipo,
          cod_tipo: tipo.COD_TIPO || tipo.cod_tipo,
          nom_tipo: tipo.NOM_TIPO || tipo.nom_tipo
        }));
        //console.log('Tipos de contacto procesados para el select:', tiposProcesados);
        return tiposProcesados;
      } catch (error) {
        console.error('Error en useFetchTiposContacto:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      enabled,
    }
  );
};
export const useFetchListaCuidades = () => {
  return useCustomQuery(
    ["lista-ciudades"],
    async () => {
      const response = await api.get('/api/appweb/lista-ciudad');                 
      return response.data.data;
    },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};
// Lista de ciudades por país
export const useFetchCiudadesPorPais = (cod_pais) => {
  return useCustomQuery(
    ["lista-ciudades-por-pais", cod_pais],
    async () => {
      const response = await api.get('/api/appweb/lista-ciudad', {
        params: { cod_pais },
      });
      const lista = response?.data?.data || response?.data || [];
      return (Array.isArray(lista) ? lista : []).map((item) => ({
        value: item.COD_CIUDAD || item.cod_ciudad || item.ID || item.id,
        label: item.NOMBRE_CIUDAD || item.nombre_ciudad || item.NOM_CIUDAD || item.nom_ciudad || item.NOMBRE || item.nombre || String(item.COD_CIUDAD || item.cod_ciudad || item.ID || item.id)
      }));
    },
    {
      ...defaultOptions,
      enabled: !!cod_pais,
    }
  );
};
// ========================================
// HOOK PARA INSERTAR ENTIDAD
// ========================================
export const useInsertarEntidad = () => {
  return useCustomMutation({
    mutationFn: async (datos) => {
      try {
        //console.log('Enviando datos para crear entidad:', datos)
        const response = await api.post('/api/appweb/insertar-entidad', datos);
        //console.log('Respuesta de inserción de entidad:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error al insertar entidad:', {
          datos,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      //console.log('Entidad creada exitosamente:', data);
    },
    onError: (error, variables) => {
      console.error('Error en la mutación de insertar entidad:', error);
    }
  });
};
// ========================================
// HOOK ESPECÍFICO PARA CRUD DE COORDINACIÓN DE CONTACTOS EN MODAL DE LEGS
// ========================================
export const useCoordinacionContactoCRUDPorLeg = (embarque_id, emb_legs_id) => {
  const { refetch, data: contactosExistentes } = useFetchCoordinacionContactoPorLeg(embarque_id, emb_legs_id);
  const insertarCoordinacionContacto = async (datos) => {
    try {
      // Calcular el siguiente ID incremental
      const siguienteId = contactosExistentes && contactosExistentes.length > 0 
        ? Math.max(...contactosExistentes.map(c => parseInt(c.ID_CONTACTO_COORDINACION) || 0)) + 1
        : 1;
      // Estructura de datos según la API requerida
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        entidadcontacto_id: datos.entidadcontacto_id.toString(),
        cod_tipo: datos.tipoEntidad?.toString() || "",
        instrucciones: datos.instrucciones,
        id_contacto_coordinacion: siguienteId.toString()
      };
      // Solo agregar emb_legs_id si se proporciona y no es 0
      if (datos.emb_legs_id && datos.emb_legs_id !== 0) {
        datosCompletos.emb_legs_id = datos.emb_legs_id;
      }
      // console.log('Enviando datos para crear contacto:', datosCompletos);
      const response = await api.post('/api/appweb/insertar-coordinacion-contacto', datosCompletos);
      // Registrar bitácora automática después de crear
      await registrarBitacoraAutomatica(
        embarque_id,
        'CREACION',
        datosCompletos,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      console.error('Error al insertar contacto:', error);
      throw error;
    }
  };
  const actualizarCoordinacionContacto = async (datos) => {
    try {
      const datosCompletos = {
        embarque_id: embarque_id.toString(),
        entidadcontacto_id: datos.entidadcontacto_id.toString(),
        cod_tipo: datos.tipoEntidad?.toString() || "",
        instrucciones: datos.instrucciones,
        id_contacto_coordinacion: datos.id_contacto_coordinacion
      };
      // Solo agregar emb_legs_id si se proporciona y no es 0
      if (datos.emb_legs_id && datos.emb_legs_id !== 0) {
        datosCompletos.emb_legs_id = datos.emb_legs_id;
      }
      // console.log('Enviando datos para actualizar contacto:', datosCompletos);
      const response = await api.post('/api/appweb/actualizar-coordinacion-contacto', datosCompletos);
      // Registrar bitácora automática después de actualizar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ACTUALIZA',
        datosCompletos,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      console.error('Error al actualizar contacto:', error);
      throw error;
    }
  };
  const eliminarCoordinacionContacto = async (id) => {
    try {
      const datosEliminar = {
        id_contacto_coordinacion: id,
        embarque_id: embarque_id.toString()
      };
      //console.log('Enviando datos para eliminar contacto:', datosEliminar);
      const response = await api.post('/api/appweb/eliminar-coordinacion-contacto', datosEliminar);
      // Registrar bitácora automática después de eliminar
      await registrarBitacoraAutomatica(
        embarque_id,
        'ELIMINACION',
        datosEliminar,
        response.data,
        'CoordinacionContacto'
      );
      await refetch(); // Recargar datos automáticamente usando el hook específico por leg
      return response.data;
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      throw error;
    }
  };
  return {
    insertarCoordinacionContacto,
    actualizarCoordinacionContacto,
    eliminarCoordinacionContacto,
    refetch
  };
};

// Hook para insertar documento de cotización en la BD
export const useInsertarCotizacionDocumento = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const insertarDocumento = useCallback(async ({ cod_cotizacion_cabecera, cod_tip_doc, url_documento }) => {
    
    if (!cod_cotizacion_cabecera || !cod_tip_doc || !url_documento) {
      throw new Error('Faltan parámetros requeridos: cod_cotizacion_cabecera, cod_tip_doc y url_documento');
    }

    setIsLoading(true);
    setError(null);

    try {
      const datos = {
        cod_cotizacion_cabecera: cod_cotizacion_cabecera,
        cod_tip_doc: cod_tip_doc,
        url_documento: url_documento
      };


      const response = await api.post('/api/appweb/insertar-cotizacion-documento', datos);


      return response.data;
    } catch (err) {
      console.error('Error al insertar documento:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al insertar documento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    insertarDocumento,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Hook para actualizar documentos de cotización
export const useActualizarCotizacionDocumento = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const actualizarDocumento = useCallback(async ({ 
    cotizaciondocumento_id, 
    cod_cotizacion_cabecera, 
    cod_tip_doc, 
    url_documento, 
    cod_estado = 1 
  }) => {

    if (!cotizaciondocumento_id || !cod_cotizacion_cabecera || !cod_tip_doc || !url_documento) {
      throw new Error('Faltan parámetros requeridos: cotizaciondocumento_id, cod_cotizacion_cabecera, cod_tip_doc y url_documento');
    }

    setIsLoading(true);
    setError(null);

    try {
      const datos = {
        cotizaciondocumento_id: cotizaciondocumento_id,
        cod_cotizacion_cabecera: cod_cotizacion_cabecera,
        cod_tip_doc: cod_tip_doc,
        url_documento: url_documento,
        cod_estado: cod_estado
      };


      const response = await api.post('/api/appweb/actualizar-cotizacion-documento', datos);


      return response.data;
    } catch (err) {
      console.error('Error al actualizar documento:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar documento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    actualizarDocumento,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Hook para subir archivos de documentos de cotización
export const useSubirArchivoDocumento = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const subirArchivo = useCallback(async ({ cod_cotizacion_cabecera, entidad_id, archivo }) => {
    
    if (!cod_cotizacion_cabecera || !entidad_id || !archivo) {
      throw new Error('Faltan parámetros requeridos: cod_cotizacion_cabecera, entidad_id y archivo');
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      // Usar los campos correctos según la API
      formData.append('cod_cotizacion_cabecera', cod_cotizacion_cabecera.toString());
      formData.append('entidad_id', entidad_id.toString());
      formData.append('cod_tip_doc', '1'); // Código para cotizaciones
      formData.append('tipo_documento', 'cotizaciones'); // Campo requerido por la API
      formData.append('archivo', archivo);



      const response = await api.post('/api/appweb/guardar-archivo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });


      return response.data;
    } catch (err) {
      console.error('Error al subir archivo:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al subir archivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    subirArchivo,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Hook para recuperar archivos de documentos
export const useRecuperarArchivo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const recuperarArchivo = useCallback(async (rutaArchivo) => {
    if (!rutaArchivo) {
      throw new Error('La ruta del archivo es requerida');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/appweb/recuperar-archivo', {
        ruta_archivo: rutaArchivo
      }, { responseType: "blob" });

      // Obtener el tipo de contenido y nombre del archivo desde los headers
      const contentType = response.headers["content-type"];
      const contentDisposition = response.headers["content-disposition"];
      
      // Extraer el nombre del archivo desde content-disposition si está disponible
      let fileName = "archivo_descargado";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Crear un blob con los datos del archivo
      const blob = new Blob([response.data], { type: contentType });
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear enlace de descarga y activarlo
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Limpiar la URL después de un tiempo
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      return { success: true, url, fileName };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al recuperar archivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recuperarArchivo,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Hook para listar documentos de cotizaciones
export const useListarCotizacionDocumentos = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const listarDocumentos = useCallback(async (cod_cotizacion_cabecera) => {
    
    if (!cod_cotizacion_cabecera) {
      throw new Error('Falta parámetro requerido: cod_cotizacion_cabecera');
    }

    setIsLoading(true);
    setError(null);

    try {

      const response = await api.get('/api/appweb/lista-cotizacion-documentos', {
        params: {
          cod_cotizacion_cabecera: cod_cotizacion_cabecera
        }
      });


      return response.data;
    } catch (err) {
      console.error('Error al listar documentos:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al listar documentos de cotización';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    listarDocumentos,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// ========================================
// HOOK PARA CARGAR DATOS DE COTIZACIÓN
// ========================================
export const useCargarDatosCotizacion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatosDeCotizacion = useCallback(async (cotizacionId, entidadId) => {
    if (!cotizacionId) {
      throw new Error('El ID de cotización es requerido');
    }

    setIsLoading(true);
    setError(null);

    try {      
      // Llamar a la API para obtener todas las cotizaciones
      const response = await api.get('/api/appweb/lista-cotizacion-cabecera');
      
      
      // Verificar si la respuesta es HTML (error de autenticación)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('La API devolvió HTML en lugar de JSON. Posible problema de autenticación.');
      }
      
      // console.log('ESTRUCTURA DE DATOS:', {
      //   hasData: !!response.data.data,
      //   dataType: typeof response.data.data,
      //   isArray: Array.isArray(response.data.data),
      //   dataLength: response.data.data?.length || 0,
      //   firstItem: response.data.data?.[0]
      // });
      
      // Buscar la cotización específica por ID
      const cotizaciones = response.data.data || [];
      
      const cotizacionEncontrada = cotizaciones.find(cot => {
        const match1 = cot.cod_cotizacion_cabecera == cotizacionId;
        const match2 = cot.numero_cotizacion == cotizacionId;
        const match3 = cot.id == cotizacionId;
        const match4 = cot.cod_cotizacion == cotizacionId;
        const match5 = cot.numero_cotizacion_cabecera == cotizacionId;
        
        return match1 || match2 || match3 || match4 || match5;
      });
      
      if (cotizacionEncontrada) {
        console.log('COTIZACIÓN ENCONTRADA:', cotizacionEncontrada);
        
        // Mapear los datos de la cotización al formato esperado
        const datosCotizacionMapeados = {
          numeroCotizacion: cotizacionEncontrada.cod_cotizacion_cabecera || cotizacionEncontrada.numero_cotizacion || cotizacionId,
          entidadId: entidadId || cotizacionEncontrada.entidad_id || cotizacionEncontrada.codigo_exportador,
          exportador: cotizacionEncontrada.exportador || cotizacionEncontrada.entidad_nombre || `Entidad ${entidadId}`,
          consignatario: cotizacionEncontrada.consignatario || 'Consignatario por definir',
          tipoTransporte: cotizacionEncontrada.tipo_transporte || 'AÉREO',
          tipoServicio: cotizacionEncontrada.tipo_servicio || 'CONSOLIDADO',
          // Agregar más campos según la estructura real de la API
          ...cotizacionEncontrada
        };
        
        console.log('DATOS MAPEADOS:', datosCotizacionMapeados);
        return datosCotizacionMapeados;
        
      } else {
        console.warn('COTIZACIÓN NO ENCONTRADA EN LA API');
        
        // Fallback: usar datos básicos con el ID de la URL
        const datosCotizacionFallback = {
          numeroCotizacion: cotizacionId,
          entidadId: entidadId,
          exportador: `Entidad ${entidadId || 'N/A'}`,
          consignatario: 'Consignatario por definir',
          tipoTransporte: 'AÉREO',
          tipoServicio: 'CONSOLIDADO',
        };
        
        console.log('🔄 USANDO DATOS DE FALLBACK:', datosCotizacionFallback);
        return datosCotizacionFallback;
      }
      
    } catch (err) {
      console.error('ERROR AL CARGAR DATOS DE LA API:', err);
      
      // Fallback en caso de error de API
      const datosCotizacionError = {
        numeroCotizacion: cotizacionId,
        entidadId: entidadId,
        exportador: `Entidad ${entidadId || 'N/A'}`,
        consignatario: 'Consignatario por definir',
        tipoTransporte: 'AÉREO',
        tipoServicio: 'CONSOLIDADO',
      };
      
      console.log('USANDO DATOS DE FALLBACK POR ERROR DE API:', datosCotizacionError);
      setError(err.message);
      return datosCotizacionError;
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cargarDatosDeCotizacion,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// ========================================
// HOOK LISTAR COSTOS DE EMBARQUE
// ========================================
const normalizarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === "") return undefined;
  const numero = Number(valor);
  return Number.isNaN(numero) ? undefined : numero;
};

export const useListarCoordinacionGastos = (
  { embarque_id, embarque_version, enabled = true } = {}
) => {
  const idNormalizado = normalizarNumero(embarque_id);
  const versionNormalizada = normalizarNumero(embarque_version);

  return useCustomQuery(
    ["listar-coordinacion-gastos", idNormalizado, versionNormalizada],
    async () => {
      try {
        if (idNormalizado === undefined) {
          return { data: [], status: 200, message: "Sin embarque seleccionado" };
        }
        const params = {
          embarque_id: idNormalizado,
          EMBARQUE_ID: idNormalizado
        };
        if (versionNormalizada !== undefined) {
          params.embarque_version = versionNormalizada;
          params.EMBARQUE_VERSION = versionNormalizada;
        }
        const response = await api.get('/api/appweb/listar-coordinacion-gastos', { params });
        return response.data;
      } catch (error) {
        console.error('Error al listar costos de embarque:', error);
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: enabled && idNormalizado !== undefined,
      select: (data) => {
        if (idNormalizado === undefined) {
          return { data: [], status: 200, message: "No hay embarque seleccionado" };
        }
        return data;
      }
    }
  );
};

// ========================================
// HOOK LISTAR CRITERIOS DE COSTOS DE EMBARQUE
// ========================================
export const useListarCoordinacionGastosCriterio = (
  { embarque_id, embarque_version, enabled = true } = {}
) => {
  const idNormalizado = normalizarNumero(embarque_id);
  const versionNormalizada = normalizarNumero(embarque_version);

  return useCustomQuery(
    ["listar-coordinacion-gastos-criterio", idNormalizado, versionNormalizada],
    async () => {
      try {
        if (idNormalizado === undefined) {
          return { data: [], status: 200, message: "Sin embarque seleccionado" };
        }
        const params = {
          embarque_id: idNormalizado,
          EMBARQUE_ID: idNormalizado
        };
        if (versionNormalizada !== undefined) {
          params.embarque_version = versionNormalizada;
          params.EMBARQUE_VERSION = versionNormalizada;
        }
        const response = await api.get('/api/appweb/listar-coordinacion-gastos-criterio', { params });
        return response.data;
      } catch (error) {
        console.error('Error al listar criterios de coordinación de gastos:', error);
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: enabled && idNormalizado !== undefined,
      select: (data) => {
        if (idNormalizado === undefined) {
          return { data: [], status: 200, message: "No hay embarque seleccionado" };
        }
        return data;
      }
    }
  );
};

// ========================================
// HOOK OBTENER ÚLTIMA VERSIÓN DE COORDINACIÓN DE GASTOS
// ========================================
export const useObtenerUltimaVersionCoordinacionGastos = (
  embarque_id,
  options = {}
) => {
  const idNormalizado = normalizarNumero(embarque_id);

  return useCustomQuery(
    ["ultima-version-coordinacion-gastos", idNormalizado],
    async () => {
      if (idNormalizado === undefined) {
        return { data: null, status: 200, message: "Sin embarque seleccionado" };
      }
      const response = await api.get('/api/appweb/obtener-ultima-version-coordinacion-gastos', {
        params: { EMBARQUE_ID: idNormalizado }
      });
      return response.data;
    },
    {
      ...defaultOptions,
      enabled: options.enabled ?? idNormalizado !== undefined,
      ...options
    }
  );
};

// ========================================
// OBTENER TIPOS DE METODO DE COORDINACION DE COSTOS
// ========================================
export const useObtenerTiposMetodo = () => {
  return useCustomQuery(
    ["lista-tipo"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo?tipo_tabla=metodo');
      return response.data;
    }
  );
};

// ========================================
// OBTENER CLASIFICACIONES DE SERVICIO
// ========================================
export const useObtenerClasificacionesServicio = () => {
  return useCustomQuery(
    ["obtener-clasificaciones-servicio"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo?tipo_tabla=CLASIFICACION_SERVICIO');
      return response.data;
    }
  );
};

// ========================================
// OBTENER TIPOS DE PAGO
// ========================================
export const useObtenerTiposPago = () => {
  return useCustomQuery(
    ["obtener-tipos-pago"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo?tipo_tabla=PAGO');
      return response.data;
    }
  );
};

// ========================================
// OBTENER TIPOS DE FACTURACION
// ========================================
export const useObtenerTiposFacturacion = () => {
  return useCustomQuery(
    ["obtener-tipos-facturacion"],
    async () => {
      const response = await api.get('/api/appweb/lista-tipo?tipo_tabla=FACTURACION');
      return response.data;
    }
  );
};

// ========================================
// OBTENER ENTIDADES RELACIONADAS
// ========================================
export const useFetchEntidadRelacion = (params = {}, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidad-relacion", params],
    async () => {
      // Doble verificación de modo público
      if (isModoPublico) return [];
      try {
        const response = await api.get('/api/appweb/lista-entidad-relacion', { params });

        // Manejar diferentes estructuras de respuesta
        let data = response.data;

        // Estructura 1: { status: 200, data: { data: [...] } }
        if (data?.status === 200 && data?.data?.data && Array.isArray(data.data.data)) {
          return data.data.data;
        }

        // Estructura 2: { data: { data: [...] } }
        if (data?.data?.data && Array.isArray(data.data.data)) {
          return data.data.data;
        }

        // Estructura 3: { data: [...] }
        if (data?.data && Array.isArray(data.data)) {
          return data.data;
        }

        // Estructura 4: Array directo
        if (Array.isArray(data)) {
          return data;
        }

        // Estructura 5: { status: 200, data: [...] }
        if (data?.status === 200 && data?.data && Array.isArray(data.data)) {
          return data.data;
        }

        return [];
      } catch (error) {
        throw error;
      }
    },
    { ...options, enabled: options.enabled !== false && !isModoPublico }
  );
};

// ========================================
// OBTENER DATOS DE ENTIDAD POR ID
// ========================================
export const useFetchEntidadPorId = (cod_tipo, entidad_id, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidad-por-id", cod_tipo, entidad_id],
    async () => {
      if (isModoPublico) return null;
      const response = await api.get('/api/appweb/lista-entidad-contacto', {
        params: { cod_tipo, entidad_id }
      });
      return response.data;
    },
    { ...options, enabled: options.enabled !== false && !isModoPublico }
  );
};

// Hook para obtener direcciones de una entidad
export const useFetchEntidadDireccion = (cod_tipo, entidad_id, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidad-direccion", cod_tipo, entidad_id],
    async () => {
      if (isModoPublico) return null;
      const response = await api.get('/api/appweb/lista-entidad-direccion', {
        params: { cod_tipo, entidad_id }
      });
      return response.data;
    },
    { ...options, enabled: options.enabled !== false && !isModoPublico }
  );
};

// Hook para obtener contactos de una entidad por tipo
export const useFetchEntidadContactoPorTipo = (cod_tipo, entidad_id, options = {}) => {
  // En modo público, NUNCA ejecutar este hook
  const isModoPublico = typeof window !== 'undefined' && window.location.pathname.includes('/public');
  return useCustomQuery(
    ["entidad-contacto-tipo", cod_tipo, entidad_id],
    async () => {
      if (isModoPublico) return null;
      const response = await api.get('/api/appweb/lista-entidad-contacto', {
        params: { cod_tipo, entidad_id }
      });
      return response.data;
    },
    { ...options, enabled: options.enabled !== false && !isModoPublico }
  );
};

// ========================================
// OBTENER COTIZACION DETALLE ACEPTADA (COD_ESTADO = 1)
// ========================================
// api /api/appweb/lista-cotizacion-detalle
// parametros: cod_cotizacion_cabecera
// retorna: cod_cotizacion_detalle de la versión aceptada (COD_ESTADO = 1)
export const useObtenerCotizacionDetalleAceptada = (cod_cotizacion_cabecera) => {
  return useCustomQuery(
    ["cotizacion-detalle-aceptada", cod_cotizacion_cabecera],
    async () => {
      const response = await api.get('/api/appweb/lista-cotizacion-detalle', { 
        params: { cod_cotizacion_cabecera } 
      });
      
      // Buscar el registro con COD_ESTADO === 1
      const cotizacionesDetalle = response.data?.data || [];
      
      // Buscar con diferentes comparaciones (número y string) - probar diferentes nombres de campo
      const cotizacionAceptada = cotizacionesDetalle.find(item => {
        // Intentar diferentes nombres de campo
        const codEstado = item.COD_ESTADO || 
                          item.cod_estado || 
                          item.CODESTADO || 
                          item.codEstado ||
                          item.estado ||
                          item.ESTADO;
        
        if (codEstado === undefined || codEstado === null) {
          return false;
        }
        
        return codEstado === 1 || codEstado === '1' || parseInt(codEstado) === 1;
      });
      
      if (cotizacionAceptada) {
        // Intentar diferentes nombres de campo para COD_COTIZACIONDETALLE
        const codCotizacionDetalle = cotizacionAceptada.COD_COTIZACIONDETALLE ||
                                      cotizacionAceptada.cod_cotizaciondetalle ||
                                      cotizacionAceptada.COD_COTIZACION_DETALLE ||
                                      cotizacionAceptada.codCotizacionDetalle;
        
        const codCotizacionCabecera = cotizacionAceptada.COD_COTIZACION_CABECERA ||
                                      cotizacionAceptada.cod_cotizacion_cabecera ||
                                      cotizacionAceptada.codCotizacionCabecera;
        
        const version = cotizacionAceptada.VERSION || cotizacionAceptada.version;
        
        return {
          cod_cotizacion_detalle: codCotizacionDetalle,
          cod_cotizacion_cabecera: codCotizacionCabecera,
          version: version,
          datos: cotizacionAceptada
        };
      }
      
      return null;
    },
    { enabled: !!cod_cotizacion_cabecera }
  );
};

// ========================================
// OBTENER RUBROS DE COTIZACION DETALLE
// ========================================
// api /api/appweb/lista-cotizacion-detalle-rubro
// parametros: cod_cotizaciondetalle
// retorna: lista de rubros del detalle de cotización
export const useObtenerCotizacionDetalleRubros = (cod_cotizaciondetalle) => {
  return useCustomQuery(
    ["cotizacion-detalle-rubros", cod_cotizaciondetalle],
    async () => {
      const response = await api.get('/api/appweb/lista-cotizacion-detalle-rubro', { 
        params: { cod_cotizaciondetalle } 
      });
      console.log('Rubros:', response.data);
      const rubros = response.data?.data || [];
      return rubros;
    },
    { enabled: !!cod_cotizaciondetalle }
  );
};
// ========================================
// OBTENER RUBROS DE COTIZACION CON VENTA_RUBRO
// ========================================
// Obtiene los rubros de la cotización aceptada sin sumar
// parametros: cod_cotizacion_cabecera
// retorna: lista de rubros con VENTA_RUBRO y COD_MONEDA_VENTA
export const useObtenerTotalCotizadoPorMoneda = (cod_cotizacion_cabecera) => {
  // Obtener la cotización aceptada
  const { data: cotizacionAceptada, isLoading: isLoadingCotizacion } = useObtenerCotizacionDetalleAceptada(cod_cotizacion_cabecera);
  // Obtener los rubros usando el cod_cotizacion_detalle
  const { data: rubros, isLoading: isLoadingRubros } = useObtenerCotizacionDetalleRubros(
    cotizacionAceptada?.cod_cotizacion_detalle
  );
  return {
    data: rubros,
    isLoading: isLoadingCotizacion || isLoadingRubros,
    cotizacionAceptada,
    rubros
  };
};
// ========================================
//OBTENER VUELOS PARA COORDIANACINES TIPOS AEROS Y SERVICIO CONSOLIDADO
// ========================================
//
export { useListarMasterDisponiblesCoordinacion } from "../Bpm";

// ========================================
// CRUD PARA CRITERIOS DE GASTOS DE COORDINACION
// ========================================

export const useInsertarCoordinacionGastoCriterio = () => {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/appweb/insertar-coordinacion-gasto-criterio', payload);
      return response.data;
    }
  });
};

export const useActualizarCoordinacionGastoCriterio = () => {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/appweb/actualizar-coordinacion-gasto-criterio', payload);
      return response.data;
    }
  });
};

export const useEliminarCoordinacionGastoCriterio = () => {
  return useCustomMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/appweb/eliminar-coordinacion-gasto-criterio', payload);
      return response.data;
    }
  });
};

//*CAMBIO DE ESTADO PARA COTIZACION*//

export const useActualizarEstadoCotizacion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const actualizarEstado = useCallback(async ({
    cod_cotizacion_cabecera,
    cod_empresa,
    entidad_id,
    cod_cc,
    cod_estado
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/appweb/actualiza-estado-cotizacion', {
        cod_cotizacion_cabecera,
        cod_empresa,
        entidad_id,
        cod_cc,
        cod_estado
      });

      if (response.data?.status === 200 && response.data?.data?.success) {
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data?.data?.mensaje || 'Error al actualizar estado de cotización';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar estado de cotización';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { actualizarEstado, isLoading, error };
};

//*SEGUIMIENTO CTS COTIZACION*//

export const useRegistrarSeguimientoCTS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const registrarSeguimiento = useCallback(async ({
    cod_cotizacion_cabecera,
    cod_empresa,
    entidad_id,
    cod_cc,
    fecha_seguimiento,
    desc_seguimiento
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/appweb/seguimiento-cts-cotizacion', {
        cod_cotizacion_cabecera,
        cod_empresa,
        entidad_id,
        cod_cc,
        fecha_seguimiento,
        desc_seguimiento
      });

      if (response.data?.status === 200 && response.data?.data?.success) {
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data?.data?.mensaje || 'Error al registrar seguimiento';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al registrar seguimiento';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { registrarSeguimiento, isLoading, error };
};

// Hook para listar seguimientos CTS de cotización
export const useListarSeguimientoCTS = (params = {}) => {
  const { cod_cotizacion_cabecera, cod_empresa, cod_cc, entidad_id } = params;

  return useCustomQuery(
    ["seguimiento-cts-cotizacion", cod_cotizacion_cabecera, cod_empresa, cod_cc, entidad_id],
    async () => {
      try {
        const response = await api.get('/api/appweb/listar-seguimiento-cts-cotizacion', {
          params: {
            cod_cotizacion_cabecera,
            cod_empresa,
            cod_cc,
            entidad_id
          }
        });

        let seguimientos = [];
        if (response.data?.status === 200 && response.data?.data) {
          if (Array.isArray(response.data.data)) {
            seguimientos = response.data.data;
          } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            seguimientos = response.data.data.data;
          }
        } else if (Array.isArray(response.data)) {
          seguimientos = response.data;
        }

        return seguimientos;
      } catch (error) {
        console.error('Error al listar seguimientos CTS:', error);
        throw error;
      }
    },
    {
      ...defaultOptions,
      enabled: !!cod_cotizacion_cabecera && !!cod_empresa && !!cod_cc && !!entidad_id,
    }
  );
};

// Hook para listar seguimientos CTS para el calendario
// Usa /api/appweb/listar-seguimiento-cts-cotizacion sin parámetros para obtener todos
// Filtra los que tienen FECHA_SEGUIMIENTO y los transforma al formato del calendario
// Solo muestra los seguimientos creados por el usuario actual (cod_usuario)
export const useListarCotizacionesConfirmadasCalendario = (cod_usuario) => {
  return useCustomQuery(
    ["seguimientos-cts-calendario", cod_usuario],
    async () => {
      try {
        const response = await api.get('/api/appweb/listar-seguimiento-cts-cotizacion', { params: { cod_usuario } });

        let seguimientos = [];
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          seguimientos = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          seguimientos = response.data.data;
        } else if (Array.isArray(response.data)) {
          seguimientos = response.data;
        }

        // Filtrar solo los que tienen FECHA_SEGUIMIENTO, creados por el usuario actual, y transformar al formato del calendario
        const seguimientosConFecha = seguimientos
          .filter(seg => !!(seg.FECHA_SEGUIMIENTO) && (seg.USUARIO_ID === cod_usuario))
          .map((seg, index) => ({
            cod_actividad: `CTS-${seg.COTIZACIONCABECERA_ID}-${index}`,
            nom_tipo: 'SEGUIMIENTO CTS',
            estado_desc: seg.ESTADO_DESCRIPCION === 'REALIZADO' ? 'FINALIZADO' : 'EN PROCESO',
            asesor: seg.USUARIO || '',
            nombre_cliente: `#${seg.COTIZACIONCABECERA_ID}`,
            cliente_desc: '',
            cod_cliente: null,
            fecha_programada: seg.FECHA_SEGUIMIENTO,
            fecha_programada_locale: seg.FECHA_SEGUIMIENTO,
            asunto: `CTS #${seg.COTIZACIONCABECERA_ID}`,
            descripcion: seg.SEGUIMIENTO || '',
            cod_asesor: seg.USUARIO_ID,
            cod_emp: null,
            cod_cc: null,
            // Datos adicionales para navegación
            cod_cotizacion_cabecera: seg.COTIZACIONCABECERA_ID,
            es_seguimiento_cts: true,
            estado_seguimiento: seg.ESTADO_DESCRIPCION,
            fecha_registro: seg.FECHA_REGISTRO
          }));

        return seguimientosConFecha;

      } catch (error) {
        console.error('Error al listar seguimientos CTS para calendario:', error);
        return [];
      }
    },
    {
      ...defaultOptions,
      enabled: !!cod_usuario,
      staleTime: 2 * 60 * 1000, // 2 minutos
      cacheTime: 5 * 60 * 1000, // 5 minutos
    }
  );
};