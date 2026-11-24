import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';

/**
 * Hook para obtener documentos de una cotización específica
 * @param {number} codCotizacionCabecera - ID de la cotización
 * @returns {object} - Datos de documentos de cotización
 */
export const useFetchCotizacionDocumentos = (codCotizacionCabecera) => {
  return useQuery({
    queryKey: ['cotizacion-documentos', codCotizacionCabecera],
    queryFn: async () => {
      if (!codCotizacionCabecera) {
        return [];
      }

      try {
        // Llamando API lista-cotizacion-documentos
        const response = await api.get(`/api/appweb/lista-cotizacion-documentos?cod_cotizacion_cabecera=${codCotizacionCabecera}`);
        let documentos = [];
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          documentos = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          documentos = response.data.data;
        } else if (Array.isArray(response.data)) {
          documentos = response.data;
        }

        return documentos;
      } catch (error) {
        console.error('❌ Error obteniendo documentos de cotización:', error);
        throw error;
      }
    },
    enabled: !!codCotizacionCabecera,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
/**
 * Hook para operaciones CRUD de documentos de cotización
 * @param {number} codCotizacionCabecera - ID de la cotización
 * @returns {object} - Funciones CRUD
 */
export const useCotizacionDocumentosCRUD = (codCotizacionCabecera) => {
  const queryClient = useQueryClient();

  const insertarCotizacionDocumento = useMutation({
    mutationFn: async (datos) => {
      const datosCompletos = {
        cod_cotizacion_cabecera: codCotizacionCabecera,
        cod_tip_doc: datos.cod_tip_doc,
        url_documento: datos.url_documento,
        cod_estado: datos.cod_estado || 1 // Estado activo por defecto
      };
      const response = await api.post('/api/appweb/insertar-cotizacion-documento', datosCompletos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizacion-documentos', codCotizacionCabecera] });
    },
    onError: (error) => {
      console.error('Error insertando documento de cotización:', error);
    }
  });

  const actualizarCotizacionDocumento = useMutation({
    mutationFn: async (datos) => {
      const datosCompletos = {
        cotizaciondocumento_id: datos.cotizaciondocumento_id,
        cod_cotizacion_cabecera: codCotizacionCabecera,
        cod_tip_doc: datos.cod_tip_doc,
        url_documento: datos.url_documento,
        cod_estado: datos.cod_estado
      };
      const response = await api.post('/api/appweb/actualizar-cotizacion-documento', datosCompletos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizacion-documentos', codCotizacionCabecera] });
    },
    onError: (error) => {
      console.error('Error actualizando documento de cotización:', error);
    }
  });

  const eliminarCotizacionDocumento = useMutation({
    mutationFn: async (cotizaciondocumentoId) => {
      const response = await api.post('/api/appweb/actualizar-cotizacion-documento', {
        cotizaciondocumento_id: cotizaciondocumentoId,
        cod_cotizacion_cabecera: codCotizacionCabecera,
        cod_tip_doc: 1,
        url_documento: '',
        cod_estado: 2 // Estado inactivo
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizacion-documentos', codCotizacionCabecera] });
    },
    onError: (error) => {
      console.error('Error eliminando documento de cotización:', error);
    }
  });

  return {
    insertarCotizacionDocumento: insertarCotizacionDocumento.mutateAsync,
    actualizarCotizacionDocumento: actualizarCotizacionDocumento.mutateAsync,
    eliminarCotizacionDocumento: eliminarCotizacionDocumento.mutateAsync,
    isInserting: insertarCotizacionDocumento.isLoading,
    isUpdating: actualizarCotizacionDocumento.isLoading,
    isDeleting: eliminarCotizacionDocumento.isLoading,
  };
};

/**
 * Hook para obtener información del embarque y extraer el cod_cotizacion_cabecera
 * @param {number} embarqueId - ID del embarque
 * @returns {object} - Información del embarque
 */
export const useFetchEmbarqueParaCotizacion = (embarqueId) => {
  return useQuery({
    queryKey: ['embarque-info-cotizacion', embarqueId],
    queryFn: async () => {
      if (!embarqueId) return null;

      try {
        const response = await api.get('/api/appweb/lista-coordinacion', {
          params: {
            cod_cc: 16,
            cod_empresa: 1
          },
        });        
        const data = response.data?.data?.data || [];
        const embarque = data.find(e => e.embarque_id === embarqueId || e.EMBARQUE_ID === embarqueId);
        
      // Información del embarque para cotización
      
      return embarque;
      } catch (error) {
        console.error('Error obteniendo información del embarque:', error);
        throw error;
      }
    },
    enabled: !!embarqueId,
    staleTime: 5 * 60 * 1000,
  });
};
