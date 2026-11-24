import { useState, useEffect } from "react";
import useFetchersCatalogosTarifa from "../../pages/Tarifas/CreacionTarifa/hooks/useFetchersCatalogosTarifa";

const useCatalogosTarifas = ({
  empresas = [],
  centrosCostos = [],
  rubros = [],
  tiposServicio = [],
  tiposTransporte = [],
  tiposAplicacion = [],
  proveedores = [],
  tiposCalculo = [],
  estados = [],
  tiposTarifa = [],
  tiposMetodo = [],
  tiposCarga = [],
  clasificacionesCarga = [],
  incoterms = [],
  tiposPago = [],
  categoriasTransporte = [],
}) => {
  const {
    obtenerRubros,
    obtenerProveedores,
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerTiposTransporte,
    obtenerTiposServicio,
    obtenerTiposAplicacion,
    obtenerTiposCalculo,
    obtenerTiposCarga,
    obtenerClasificacionesCarga,
    obtenerIncoterms,
    obtenerTiposPago,
    obtenerCategoriasTransporte,
  } = useFetchersCatalogosTarifa();

  const ensureArray = (val) => (Array.isArray(val) ? val : []);
  const [catalogos, setCatalogos] = useState({
    empresas: ensureArray(empresas),
    centrosCostos: ensureArray(centrosCostos),
    rubros: ensureArray(rubros),
    tiposServicio: ensureArray(tiposServicio),
    tiposTransporte: ensureArray(tiposTransporte),
    tiposAplicacion: ensureArray(tiposAplicacion),
    proveedores: ensureArray(proveedores),
    tiposCalculo: ensureArray(tiposCalculo),
    estados: ensureArray(estados),
    tiposTarifa: ensureArray(tiposTarifa),
    tiposMetodo: ensureArray(tiposMetodo),
    tiposCarga: ensureArray(tiposCarga),
    clasificacionesCarga: ensureArray(clasificacionesCarga),
    incoterms: ensureArray(incoterms),
    tiposPago: ensureArray(tiposPago),
    categoriasTransporte: ensureArray(categoriasTransporte),
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          empresas,
          centrosCostos,
          rubros,
          proveedores,
          tiposTransporte,
          tiposServicio,
          tiposAplicacion,
          tiposCalculo,
          tiposCarga,
          clasificacionesCarga,
          tiposPago,
          categoriasTransporte,
          incoterms,
        ] = await Promise.all([
          obtenerEmpresas(catalogos.empresas),
          obtenerCentrosCostos(catalogos.centrosCostos),
          obtenerRubros(catalogos.rubros),
          obtenerProveedores(catalogos.proveedores),

          obtenerTiposTransporte(catalogos.tiposTransporte),
          obtenerTiposServicio(catalogos.tiposServicio),
          obtenerTiposAplicacion(catalogos.tiposAplicacion),
          obtenerTiposCalculo(catalogos.tiposCalculo),
          obtenerTiposCarga(catalogos.tiposCarga),
          obtenerClasificacionesCarga(catalogos.clasificacionesCarga),
          obtenerTiposPago(catalogos.tiposPago),

          obtenerCategoriasTransporte(catalogos.categoriasTransporte),

          obtenerIncoterms(catalogos.incoterms),
        ]);

        setCatalogos({
          empresas,
          centrosCostos,
          rubros,
          proveedores,
          incoterms,
          estados,
          tiposServicio: tiposServicio,
          tiposTransporte: tiposTransporte,
          tiposAplicacion: tiposAplicacion,
          tiposCalculo: tiposCalculo,
          tiposTarifa: tiposTransporte,
          tiposMetodo: tiposMetodo,
          tiposCarga: tiposCarga,
          clasificacionesCarga: clasificacionesCarga,
          tiposPago: tiposPago,
          categoriasTransporte,
        });
      } catch (error) {
        console.error("Error al cargar los catálogos de tarifas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerRubros,
    obtenerProveedores,
    obtenerTiposTransporte,
    obtenerTiposServicio,
    obtenerTiposAplicacion,
    obtenerTiposCalculo,
    obtenerTiposCarga,
    obtenerClasificacionesCarga,
    obtenerIncoterms,
    obtenerTiposPago,
    obtenerCategoriasTransporte,
  ]);

  return {
    ...catalogos,
    isLoading,
  };
};

export default useCatalogosTarifas;
