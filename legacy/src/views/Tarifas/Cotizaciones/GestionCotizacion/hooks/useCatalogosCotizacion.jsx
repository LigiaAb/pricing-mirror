import { useState, useEffect } from "react";
import useFetchersCatalogosCotizacion from "./useFetchersCatalogosCotizacion";
import { useFetchAllEntidades } from "../../../../../hooks/Fetch/useFetchEntidades";
import { CODS_ESTADOS } from "../../../../../constants/estados";
import { CODS_TIPOS_ENTIDAD, NOMBRES_TIPOS_ENTIDAD } from "../../../../../constants/tiposEntidades";

const useCatalogosCotizacion = ({
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
  paises = [],
  tiposPuntoEnlace = [],
  puntosEnlace = [],
  monedas = [],
  carriers = [],
  tiposSeguimiento = [],
  clientes = [],
}) => {
  const {
    obtenerEmpresas,
    obtenerCentrosCostos,
    obtenerTiposTransporte,
    obtenerTiposServicio,
    obtenerTiposCarga,
    obtenerClasificacionesCarga,
    obtenerIncoterms,
    obtenerTiposPago,
    obtenerPaises,
    obtenerTiposPuntoEnlace,
    obtenerPuntosEnlace,
    obtenerMonedas,
    obtenerCarriers,
    obtenerTiposSeguimiento,
  } = useFetchersCatalogosCotizacion();

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
    paises: ensureArray(paises),
    tiposPuntoEnlace: ensureArray(tiposPuntoEnlace),
    puntosEnlace: ensureArray(puntosEnlace),
    monedas: ensureArray(monedas),
    carriers: ensureArray(carriers),
    tiposSeguimiento: ensureArray(tiposSeguimiento),
    clientes: ensureArray(clientes),
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          empresas,
          centrosCostos,
          tiposTransporte,
          tiposServicio,
          tiposCarga,
          clasificacionesCarga,
          tiposPago,
          incoterms,
          paises,
          tiposPuntoEnlace,
          puntosEnlace,
          monedas,
          carriers,
          tiposSeguimiento,
        ] = await Promise.all([
          obtenerEmpresas(catalogos.empresas),
          obtenerCentrosCostos(catalogos.centrosCostos),
          obtenerTiposTransporte(catalogos.tiposTransporte),
          obtenerTiposServicio(catalogos.tiposServicio),
          obtenerTiposCarga(catalogos.tiposCarga),
          obtenerClasificacionesCarga(catalogos.clasificacionesCarga),
          obtenerTiposPago(catalogos.tiposPago),
          obtenerIncoterms(catalogos.incoterms),
          obtenerPaises(catalogos.paises),
          obtenerTiposPuntoEnlace(catalogos.tiposPuntoEnlace),
          obtenerPuntosEnlace(catalogos.puntosEnlace),
          obtenerMonedas(catalogos.monedas),
          obtenerCarriers(catalogos.carriers),
          obtenerTiposSeguimiento(catalogos.tiposSeguimiento),
        ]);

        setCatalogos((prev) => ({
          ...prev,
          empresas,
          centrosCostos,
          rubros,
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
          paises,
          tiposPuntoEnlace,
          puntosEnlace,
          monedas,
          carriers,
          tiposSeguimiento,
        }));
      } catch (error) {
        console.error("Error al cargar los catálogos de tarifas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const catalogoClientes = [];
    const clientesConFormatoUI = catalogoClientes.map((cliente) => ({
      label: `${cliente.codigo_entidad} - ${cliente.entidad_nombre}`,
      value: +cliente.entidad_id,
      ...cliente,
    }));

    setCatalogos((prev) => ({
      ...prev,
      clientes: clientesConFormatoUI,
    }));
  }, []);

  return {
    ...catalogos,
    isLoading: isLoading,
    setCatalogos,
  };
};

export default useCatalogosCotizacion;
