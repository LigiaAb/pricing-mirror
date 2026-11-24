import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { executeQuery } from "../../utils/queryUtils";
import useCustomMutation from "./useCustomMutation";
import useCustomQuery from "./useCustomQuery";
import useCustomObjectQuery from "./useCustomObjectQuery";

const defaultOptions = {
  staleTime: 1000 * 60 * 10,
};

const pendingAllPagedEntityRequests = new Map();

const buildRequestKey = (endpoint, params, tipos_entidad, paginasAConsultar) =>
  JSON.stringify({
    endpoint,
    params,
    tipos_entidad,
    paginasAConsultar,
  });

export const convertKeysToLowerCase = (data) => {
  if (Array.isArray(data)) {
    return data.map(convertKeysToLowerCase);
  }

  if (data !== null && typeof data === "object") {
    return Object.keys(data).reduce((acc, key) => {
      const value = data[key];

      acc[key.toLowerCase()] = value !== null && typeof value === "object" ? convertKeysToLowerCase(value) : value;

      return acc;
    }, {});
  }

  return data;
};

// Hook para obtener datos desde una API
const getDataHook = (endpoint, params, mapper) => () => api.get(endpoint, { params }).then(({ data }) => (mapper ? data.data.map(mapper) : data.data));
const getObjectDataHook = (endpoint, params) => () => api.get(endpoint, { params }).then(({ data }) => data.data);

const getDataPaginated =
  (endpoint, params, mapper = (i) => i) =>
  async () => {
    try {
      // Paso 1: Consulta inicial para obtener metadatos
      const firstPageResponse = await api.get(endpoint, { params });

      const responseData = firstPageResponse.data.data;
      const totalRegistros = responseData.total_registros || 0;
      const totalPaginas = responseData.total_paginas || 1;

      // Si no hay registros, retornar estructura vacía
      // if (totalRegistros === 0) {
      //   return {
      //     total_registros: 0,
      //     total_paginas: 1,
      //     data: [],
      //   };
      // }

      // Inicializar con datos de la primera página
      let allData = [...(responseData.data || [])];

      // Paso 2: Preparar solicitudes para páginas restantes (si existen)
      if (totalPaginas > 1) {
        const pagePromises = [];

        // Empezar desde la página 2 hasta la última
        for (let pagina = 2; pagina <= totalPaginas; pagina++) {
          pagePromises.push(
            api.get(endpoint, {
              params: {
                ...params,
                datosxpagina: 100, // Mismo tamaño que la primera página
                pagina: pagina,
              },
            }),
          );
        }

        // Paso 3: Ejecutar consultas para páginas restantes
        const responses = await Promise.all(pagePromises);

        // Paso 4: Procesar y combinar datos
        responses.forEach((response) => {
          const pageData = response.data.data.data || [];
          allData = [...allData, ...pageData];
        });
      }

      // Aplicar mapper si existe
      return {
        total_registros: totalRegistros,
        total_paginas: totalPaginas,
        data: mapper ? allData.map(mapper) : allData,
      };
    } catch (error) {
      console.error("Error al obtener datos:", error);
      throw new Error(error);
    }
  };

const getDataEntidades =
  (endpoint, params, mapper = (i) => i, tipos_entidad = ["PROVEEDOR", "PRE-PREPROVEEDOR"], paginasAConsultar) =>
  async () => {
    const requestKey = buildRequestKey(endpoint, params, tipos_entidad, paginasAConsultar);

    // NUEVO: si la misma consulta ya está corriendo, reutilizarla
    if (pendingAllPagedEntityRequests.has(requestKey)) {
      return pendingAllPagedEntityRequests.get(requestKey);
    }

    const requestPromise = (async () => {
      const datosxpagina = params.datosxpagina || 100;

      const metadataResponses = await Promise.all(
        tipos_entidad.map((tipo) =>
          api.get(endpoint, {
            params: {
              tipo_entidad: tipo,
              ...params,
              datosxpagina: 1,
              nopagina: 1,
            },
          }),
        ),
      );

      const metadata = metadataResponses.map((response, index) => {
        const data = response.data.data;
        const total_registros = data?.total_registros || 0;

        return {
          tipo: tipos_entidad[index],
          total_registros,
          total_paginas: Math.ceil(total_registros / datosxpagina),
          cod_tipo: data?.cod_tipo,
          permite_crear: data?.permite_crear,
        };
      });

      const allData = [];

      for (const meta of metadata) {
        const { tipo, total_paginas } = meta;

        if (meta.total_registros === 0) continue;

        const totalPaginasAConsultar = paginasAConsultar ? Math.min(total_paginas, paginasAConsultar) : total_paginas;

        // CAMBIO: secuencial para no saturar API/BD
        for (let pagina = 1; pagina <= totalPaginasAConsultar; pagina++) {
          const response = await api.get(endpoint, {
            params: {
              tipo_entidad: tipo,
              ...params,
              datosxpagina,
              nopagina: pagina,
            },
          });

          const pageData = response.data?.data?.data || [];

          if (Array.isArray(pageData)) {
            allData.push(...pageData);
          }
        }
      }

      const mapped = mapper ? allData.map(mapper) : allData;

      return { ...metadata[0], data: mapped };
    })();

    pendingAllPagedEntityRequests.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      pendingAllPagedEntityRequests.delete(requestKey);
    }
  };

const getDataEntidadesSimple = (endpoint, params, mapper) => () => {
  return api.get(endpoint, { params }).then(({ data }) => {
    const metadata = {
      total_registros: data?.total_registros || data.data?.data.length || 0,
      cod_tipo: data?.data?.cod_tipo,
      permite_crear: data?.data.permite_crear,
    };

    const dataToMap = data?.data?.data || [];

    const lowerKeydata = convertKeysToLowerCase(dataToMap);

    const dataMapped = mapper ? lowerKeydata.map(mapper) : lowerKeydata;

    return { ...metadata, data: dataMapped };
  });
};
(endpoint, params, mapper = (i) => i, tipos_entidad = ["PROVEEDOR", "PRE-PREPROVEEDOR"]) =>
  async () => {
    const datosxpagina = 100;
    // --- Paso 1: Obtener metadatos de cada tipo ---
    const metadataResponses = await Promise.all(
      tipos_entidad.map((tipo) =>
        api.get(endpoint, {
          params: { tipo_entidad: tipo, ...params, datosxpagina: 1 },
        }),
      ),
    );

    const metadata = metadataResponses.map((response, index) => {
      const data = response.data.data;
      return {
        tipo: tipos_entidad[index],
        total_registros: data?.total_registros || 0,
        total_paginas: Math.ceil(data?.total_paginas / (params.datosxpagina || datosxpagina)) || 1,
        cod_tipo: data?.cod_tipo,
        permite_crear: data?.permite_crear,
      };
    });

    // --- Paso 2: Consultar página por página ---
    let allData = [];
    for (const meta of metadata) {
      const { tipo, total_paginas } = meta;

      if (meta.total_registros === 0) continue;

      // Crear una lista de promesas por cada página
      const promesas = [];

      for (let pagina = 1; pagina <= total_paginas; pagina++) {
        promesas.push(
          api.get(endpoint, {
            params: {
              tipo_entidad: tipo,
              ...params,
              datosxpagina: params.datosxpagina || datosxpagina,
              nopagina: pagina,
            },
          }),
        );
      }

      // Ejecutar todas las páginas en paralelo
      const respuestas = await Promise.all(promesas);

      // Juntar los datos
      for (const response of respuestas) {
        const pageData = response.data?.data?.data || [];
        if (Array.isArray(pageData)) {
          allData.push(...pageData);
        }
      }
    }

    // --- Paso 3: aplicar mapper ---
    const mapped = mapper ? allData.map(mapper) : allData;

    // Devuelvo metadata del primer tipo porque así lo tenías
    return { ...metadata[0], data: mapped };
  };

const normalizeKey = (key) => (Array.isArray(key) ? key[0] : key);

// Hook para obtener datos desde una API
export const createObjectDataHook =
  (key, endpoint) =>
  (params = {}, options = {}) =>
    useCustomObjectQuery([normalizeKey(key), params], getObjectDataHook(endpoint, params), { ...defaultOptions, ...options });

export const createDataHook =
  (key, endpoint, mapper = (e) => e) =>
  (params = {}, options = {}) =>
    useCustomQuery([normalizeKey(key), params], getDataHook(endpoint, params, mapper), { ...defaultOptions, ...options });
export const createPaginatedHook =
  (key, endpoint, mapper = (e) => e) =>
  (params = {}, options = {}) =>
    useCustomQuery([normalizeKey(key), params], getDataPaginated(endpoint, params, mapper), { ...defaultOptions, ...options });
export const createAllPagedEntityDataHook =
  (key, endpoint, mapper = (e) => e, entidades) =>
  (key_ = key, params = {}, options = {}, tipos_entidad, paginasAConsultar) => {
    const queryKey = Array.isArray(key_) ? key_ : [key_];

    const tiposEntidadFinal = tipos_entidad ? tipos_entidad : entidades;

    return useCustomQuery([...queryKey, params, tiposEntidadFinal, paginasAConsultar], getDataEntidades(endpoint, params, mapper, tiposEntidadFinal, paginasAConsultar), {
      ...defaultOptions,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      ...options,
    });
  };
export const createAllPagedEntitySimpleDataHook =
  (key, endpoint, mapper = (e) => convertKeysToLowerCase(e)) =>
  (key_ = key, params = { tipo_entidad: "CLIENTE" }, options = {}) => {
    // Asegurar que tenemos un array plano para la clave de consulta
    const queryKey = Array.isArray(key_) ? key_ : [key_];

    return useCustomQuery([...queryKey, params], getDataEntidadesSimple(endpoint, params, mapper), { ...defaultOptions, ...options });
  };

export const createDataMutationHook =
  (key, endpoint, mapper = (e) => e) =>
  (params, options = {}) => {
    const queryClient = useQueryClient();

    return useCustomMutation({
      mutationFn: async (newData) => {
        const response = await api.post(endpoint, newData);
        return mapper(response.data); // Aplicar mapper si existe
      },
      onSuccess: (newData) => {
        // Actualización optimista para queries simples (no paginados)
        queryClient.setQueryData([key, params], (old) => {
          if (!old) return [newData];
          return Array.isArray(old) ? [newData, ...old] : { ...old, data: [newData, ...old.data] };
        });
      },
      onError: (error) => {
        // Revertir invalidando la query
        queryClient.invalidateQueries({ queryKey: [key, params] });
      },
      ...options,
    });
  };
export const updateDataMutationHook =
  (key, endpoint, mapper = (e) => e) =>
  (params, options = {}) => {
    const queryClient = useQueryClient();

    return useCustomMutation({
      mutationFn: async (updatedData) => {
        // Asume que updatedData tiene un id
        const response = await api.post(`${endpoint}`, updatedData);
        return mapper(response.data);
      },
      onMutate: async (updatedData) => {
        // Cancelar queries para evitar conflictos
        await queryClient.cancelQueries({ queryKey: key });

        // Snapshot previo para posible rollback
        const previousData = queryClient.getQueryData([key, params]);

        // Actualización optimista
        queryClient.setQueryData([key, params], (old) => {
          if (!old) return [updatedData];

          if (Array.isArray(old)) {
            return old.map((item) => (item.id === updatedData.id ? updatedData : item));
          }

          // Para estructura paginada
          return {
            ...old,
            data: old.data.map((item) => (item.id === updatedData.id ? updatedData : item)),
          };
        });

        return { previousData };
      },
      onError: (error, variables, context) => {
        // Revertir al estado anterior en caso de error
        queryClient.setQueryData([key, params], context.previousData);
      },
      onSettled: () => {
        // Asegurar que los datos estén frescos después de actualizar
        queryClient.invalidateQueries({ queryKey: [key, params] });
      },
      ...options,
    });
  };
