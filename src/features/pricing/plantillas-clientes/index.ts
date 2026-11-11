export {
  PLANTILLAS_CLIENTE_KEY,
  PLANTILLAS_RUBROS_KEY,
  type PlantillaCliente,
  type PlantillaClientePayload,
  type PlantillaRubro,
  plantillaClienteSchema,
  plantillaRubroSchema,
  useActualizarPlantillaCliente,
  useEliminarPlantillaCliente,
  useGuardarPlantillaRubros,
  useInsertarPlantillaCliente,
  usePlantillasCliente,
  usePlantillasRubros,
} from "./api/plantillas-clientes";
export { GestionPlantillasClientes } from "./components/gestion-plantillas-clientes";
export { RubrosPlantilla } from "./components/rubros-plantilla";
