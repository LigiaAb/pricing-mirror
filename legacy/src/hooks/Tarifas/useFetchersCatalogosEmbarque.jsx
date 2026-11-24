import { useState, useEffect } from "react";
import {
  tiposTransporte,
  tiposEmbarque,
  tiposProducto,
  origenes,
  destinos,
  proveedores,
  commodities,
  estados,
  monedas,
  incoterms,
} from "../../database_dummy/embarques";

const useFetchersCatalogosEmbarque = () => {
  const [catalogos, setCatalogos] = useState({
    tiposTransporte: [],
    tiposEmbarque: [],
    tiposProducto: [],
    origenes: [],
    destinos: [],
    proveedores: [],
    commodities: [],
    estados: [],
    monedas: [],
    incoterms: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        setLoading(true);
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCatalogos({
          tiposTransporte,
          tiposEmbarque,
          tiposProducto,
          origenes,
          destinos,
          proveedores,
          commodities,
          estados,
          monedas,
          incoterms,
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCatalogos();
  }, []);

  return { catalogos, loading, error };
};

export default useFetchersCatalogosEmbarque; 