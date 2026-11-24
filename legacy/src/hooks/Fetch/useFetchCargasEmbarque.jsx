import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';

// Hook para listar cargas de una coordinación
export const useFetchCoordinacionCarga = (embarqueId, options = {}) => {
  return useQuery({
    queryKey: ['coordinacion-carga', embarqueId],
    queryFn: async () => {
      if (!embarqueId) return null;
      
      const response = await api.get('/api/appweb/listar-coordinacion-carga', {
        params: { embarque_id: embarqueId }
      });
      
      return response.data;
    },
    enabled: !!embarqueId && (options.enabled !== false),
    ...options
  });
};

// Hook para insertar una carga de coordinación
export const useInsertarCoordinacionCarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cargaData) => {
      const response = await api.post('/api/appweb/insertar-coordinacion-carga', cargaData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar la query de cargas para refrescar la lista
      queryClient.invalidateQueries(['coordinacion-carga', variables.embarque_id]);
    }
  });
};

// Hook para actualizar una carga de coordinación
export const useActualizarCoordinacionCarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cargaData) => {
      const response = await api.post('/api/appweb/actualizar-coordinacion-carga', cargaData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar la query de cargas para refrescar la lista
      queryClient.invalidateQueries(['coordinacion-carga', variables.embarque_id]);
    }
  });
};

// Hook para eliminar una carga de coordinación
// payload esperado: { embarque_id, emb_carga_id, ... } (el resto no se usa)
export const useEliminarCoordinacionCarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cargaData) => {
      const response = await api.post('/api/appweb/eliminar-coordinacion-carga', cargaData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar la query de cargas para refrescar la lista
      queryClient.invalidateQueries(['coordinacion-carga', variables.embarque_id]);
    }
  });
};

// Hook combinado para operaciones CRUD de cargas
export const useCargasEmbarque = (embarqueId, options = {}) => {
  const cargas = useFetchCoordinacionCarga(embarqueId, options);
  const insertar = useInsertarCoordinacionCarga();
  const actualizar = useActualizarCoordinacionCarga();
  const eliminar = useEliminarCoordinacionCarga();
  
  return {
    cargas,
    insertar,
    actualizar,
    eliminar,
    isLoading: cargas.isLoading || insertar.isPending || actualizar.isPending || eliminar.isPending,
    error: cargas.error || insertar.error || actualizar.error || eliminar.error
  };
};
