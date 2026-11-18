// Espejo: copia del index.ts real de catálogos sin las exportaciones de ./hooks (no existen aquí).
// API pública del feature catálogos: objetos createCatalogo + tipos.
// Uso: const { data } = monedas.useLista(); const insertar = monedas.useInsertar();
export { type Accion, acciones } from "./api/acciones";
export { catalogoErrores, type Errores } from "./api/catalogo-errores";
export { type Categoria, categorias } from "./api/categorias";
export { type CategoriaMenu, categoriasMenu } from "./api/categorias-menu";
export { type CentroCosto, centrosCosto } from "./api/centros-costo";
export { type CentroCostoModulo, centrosCostoModulos } from "./api/centros-costo-modulos";
export { type Ciudad, ciudades } from "./api/ciudades";
export { type Commodities, commodities } from "./api/commodities";
export { type Configuracion, configuracion } from "./api/configuracion";
export {
  type ConfiguracionActividades,
  configuracionActividades,
} from "./api/configuracion-actividades";
export { type Continente, continentes } from "./api/continentes";
export { type Correlativo, correlativos } from "./api/correlativos";
export { createCatalogo, createCatalogoMutation } from "./api/create-catalogo";
export { type Departamento, departamentos } from "./api/departamentos";
export { type Distrito, distritos } from "./api/distritos";
export { type Empleado, empleados } from "./api/empleados";
export { type EmpleadoUsuario, empleadosUsuarios } from "./api/empleados-usuarios";
export { type Empresa, empresas } from "./api/empresas";
export { type Estado, estados } from "./api/estados";
export { type Identificacion, identificacion } from "./api/identificacion";
export {
  deduplicarValoresIdentificacion,
  esIdentificacionConValoresPredefinidos,
  IDENTIFICACIONES_CON_VALORES_PREDEFINIDOS,
  type IdentificacionValor,
  identificacionValores,
} from "./api/identificacion-valores";
export { type ImpuestoPais, type Impuestos, impuestos, impuestosPais } from "./api/impuestos";
export { type Incoterm, incoterms } from "./api/incoterms";
export { type Industria, industrias } from "./api/industrias";
export { type Menu, menus } from "./api/menus";
export { type Modulo, modulos } from "./api/modulos";
export { type Moneda, monedas } from "./api/monedas";
export { type Municipio, municipios } from "./api/municipios";
export { type Opcion, opciones } from "./api/opciones";
export { type OpcionAccion, opcionesAcciones } from "./api/opciones-acciones";
export { type Pais, paises } from "./api/paises";
export { type PaisConEmpresa, paisesConEmpresa } from "./api/paises-con-empresa";
export { type Periodicidad, periodicidad } from "./api/periodicidad";
export {
  ciudadesPublico,
  departamentosPublico,
  type IncotermPublico,
  incotermsPublico,
  industriasPublico,
  municipiosPublico,
  paisesPublico,
  type RelacionTipoPublico,
  relacionTipoPublico,
  type TipoPublico,
  tiposPublico,
} from "./api/publicos";
export { type Puesto, puestos, useActualizarJsonPuesto } from "./api/puestos";
export { type PuntoEnlace, puntosEnlace } from "./api/punto-enlace";
export {
  type PuntoEnlaceIdentificacion,
  puntosEnlaceIdentificaciones,
} from "./api/punto-enlace-identificaciones";
export { type PuntoEnlaceNombre, puntosEnlaceNombres } from "./api/punto-enlace-nombres";
export { type RelacionTipo, relacionTipo } from "./api/relacion-tipo";
export { type RolOpcionAccion, rolOpcionAccion } from "./api/rol-opcion-accion";
export { type Rol, roles } from "./api/roles";
export { type RolPuesto, rolesPuesto } from "./api/roles-puesto";
export {
  type Rubro,
  type RubroCenco,
  type RubroIdentificacion,
  type RubroNombre,
  rubros,
} from "./api/rubros";
export { type Servicio, servicios } from "./api/servicios";
export { type Temperamento, temperamento } from "./api/temperamento";
export { type TipoCambio, tipoCambio } from "./api/tipo-cambio";
export { type ListaTipoCentroCosto, tipoCencos } from "./api/tipo-cencos";
export { type Tipo, tipos } from "./api/tipos";
export { type TipoPuesto, tiposPuesto } from "./api/tipos-puesto";
export { type Tratamiento, tratamiento } from "./api/tratamiento";
export { type Usuario, useActualizarUsuarioPass, usuarios } from "./api/usuarios";
