import { useState } from "react";
import { api } from "../../../api";

const useCatalogosFacturacion = ({ identificaciones = [] }) => {
  const ensureArray = (val) => (Array.isArray(val) ? val : []);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogos, setCatalogos] = useState({
    identificaciones: ensureArray(identificaciones),
  });

  const obtenerIdentificaciones = async (entidad_id) => {
    await api.get("/api/appweb/lista-entidad-identificacion", { params: { cod_tipo: 3, entidad_id: entidad_id } }).then(({ data }) => data.data);
  };

  return {
    ...catalogos,
    isLoading: isLoading,
    setCatalogos,
  };
};
