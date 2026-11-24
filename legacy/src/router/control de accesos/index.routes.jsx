import { Outlet, Route, Routes } from "react-router-dom";
import { NotFoundPage } from "../../layouts/404";
import PaisCrud from "../../pages/Cruds/PaisCrud";
import ListaTest from "../../pages/Test/ListaTest";
import VistaTest from "../../pages/Test/VistaTest";
import ListaUsuario from "../../pages/Usuario/ListaUsuario";
import VistaUsuario from "../../pages/Usuario/VistaUsuario";
import VistaDocumentacion from "../../pages/Documentacion/VistaDocumentacion";
import ListaDocumentacion from "../../pages/Documentacion/ListaDocumentacion";
import VistaCatalogoDocumentacion from "../../pages/CatalogoDocumentacion/VistaCatalogoDocumentacion";
import ListaCatalogoDocumentacion from "../../pages/CatalogoDocumentacion/ListaCatalogoDocumentacion";
import VistaCentroCosto from "../../pages/CentroCosto/VistaCentroCosto";
import ListaCentroCosto from "../../pages/CentroCosto/ListaCentroCosto";
import { ListaPaises } from "../../pages/Paises/ListaPaises";
import { VistaPaises } from "../../pages/Paises/VistaPaises";
import ListaEmpresas from "../../pages/Empresa/ListaEmpresa";
import VistaEmpresa from "../../pages/Empresa/VistaEmpresa";
import MenuBasePage from "../../pages/Cruds/MenuBasePage";
import ListaEmpleado from "../../pages/Empleado/ListaEmpleado";
import VistaEmpleado from "../../pages/Empleado/VistaEmpleado";
import ListaPuesto from "../../pages/Puesto/ListaPuesto";
import VistaPuesto from "../../pages/Puesto/VistaPuesto";
import ListaRol from "../../pages/Rol/ListaRol";
import VistaRol from "../../pages/Rol/VistaRol";
import ListaCatalogoErrores from "../../pages/CatalogoErrores/ListaCatalogoErrores";
import VistaCatalogoErrores from "../../pages/CatalogoErrores/VistaCatalogoErrores";
import ListaModulo from "../../pages/Modulo/ListaModulo";
import VistaModulo from "../../pages/Modulo/VistaModulo";
import ListaMenu from "../../pages/Menu/ListaMenu";
import VistaMenu from "../../pages/Menu/VistaMenu";
import ListaCategoria from "../../pages/Categoria/ListaCategoria";
import VistaCategoria from "../../pages/Categoria/VistaCategoria";
import ListaOpcion from "../../pages/Opcion/ListaOpcion";
import VistaOpcion from "../../pages/Opcion/VistaOpcion";
import ListaAccion from "../../pages/Accion/ListaAccion";
import VistaAccion from "../../pages/Accion/VistaAccion";
import ListaEstado from "../../pages/Estado/ListaEstado";
import VistaEstado from "../../pages/Estado/VistaEstado";
import { VistaCiudades } from "../../pages/Ciudades/VistaCiudades";
import { VistaDepartamentos } from "../../pages/Departamentos/VistaDepartamentos";
import { VistaMunicipios } from "../../pages/Municipios/VistaMunicipios";
import ListaTipo from "../../pages/Tipo/ListaTipo";
import VistaTipo from "../../pages/Tipo/VistaTipo";
import ListaCorrelativo from "../../pages/Correlativo/ListaCorrelativo";
import VistaCorrelativo from "../../pages/Correlativo/VistaCorrelativo";
import { ListaMoneda } from "../../pages/Moneda/ListaMoneda";
import { VistaMoneda } from "../../pages/Moneda/VistaMoneda";
import { ListaImpuestos } from "../../pages/Impuestos/ListaImpuestos";
import { VistaImpuestos } from "../../pages/Impuestos/VistaIMpuestos";
import ListaIdentificacion from "../../pages/Identificacion/ListaIdentificacion";
import VistaIdentificacion from "../../pages/Identificacion/VistaIdentificacion";
import ListaConfiguracion from "../../pages/Configuracion/ListaConfiguracion";
import VistaConfiguracion from "../../pages/Configuracion/VistaConfiguracion";
import ListaTratamiento from "../../pages/Tratamiento/ListaTratamiento";
import VistaTratamiento from "../../pages/Tratamiento/VistaTratamiento";
import ListaTemperamento from "../../pages/Temperamento/ListaTemperamento";
import VistaTemperamento from "../../pages/Temperamento/VistaTemperamento";
import ListaConfiguracionActividades from "../../pages/ConfiguracionActividades/ListaConfiguracionActividades";
import VistaConfiguracionActividades from "../../pages/ConfiguracionActividades/VistaConfiguracionActividades";
import ListaIndustria from "../../pages/Industria/ListaIndustria";
import ListaPeriodicidades from "../../pages/Periodicidades/ListaPeriodicidades";
import VistaPeriodicidades from "../../pages/Periodicidades/VistaPeriodicidades";
import ListaRelacionTipo from "../../pages/RelacionTipo/ListaRelacionTipo";
import VistaRelacionTipo from "../../pages/RelacionTipo/VistaRelacionTipo";
import ListaTipoCentroCosto from "../../pages/TipoCentroCosto/ListaTipoCentroCosto";
import VistaTipoCentroCosto from "../../pages/TipoCentroCosto/VistaTipoCentroCosto";
import ListaPuntosEnlaces from "../../pages/PuntoEnlace/ListaPuntosEnlace";
import VistaPuntoEnlace from "../../pages/PuntoEnlace/VistaPuntoEnlace";
import ListaRubros from "../../pages/Rubros/ListaRubros";
import VistaRubro from "../../pages/Rubros/VistaRubro";
import ListaCommodities from "../../pages/Commodities/ListaCommodities";
import VistaCommodity from "../../pages/Commodities/VistaCommodity";
import ListaIncoterms from "../../pages/Incoterms/ListaIncoterms";
import VistaIncoterm from "../../pages/Incoterms/VistaInconterm";
import ListaEquipos from "../../pages/Equipos/ListaEquipos";
import VistaEquipos from "../../pages/Equipos/VistaEquipos";

export const RutasCruds = () => {
  return (
    <Routes>
      <Route path="crud" element={<MenuBasePage />} loader={() => ({ name: "Cruds" })}>
        <Route index element={<Outlet />} />
        <Route path="estado" element={<Outlet />} loader={() => ({ name: "Cruds-estados" })}>
          <Route index element={<ListaEstado />} loader={() => ({ name: "Cruds-estados" })} />
          <Route path=":encryptedId" element={<VistaEstado />} />
        </Route>
        <Route path="catalogo_documentacion" element={<Outlet />} loader={() => ({ name: "Accesos-catalogo_documentacion" })}>
          <Route index element={<ListaCatalogoDocumentacion />} loader={() => ({ name: "Accesos-catalogo_documentacion" })} />
          <Route path=":encryptedId" element={<VistaCatalogoDocumentacion />} />
        </Route>
        <Route path="documentacion" element={<Outlet />}>
          <Route index element={<ListaDocumentacion />} />
          <Route path=":encryptedId" element={<VistaDocumentacion />} />
        </Route>
        <Route path="catalogo_errores" element={<Outlet />} loader={() => ({ name: "Accesos-catalogo_errores" })}>
          <Route index element={<ListaCatalogoErrores />} />
          <Route path=":encryptedId" element={<VistaCatalogoErrores />} />
        </Route>
        <Route path="tipo" element={<Outlet />} loader={() => ({ name: "Accesos-tipo" })}>
          <Route index element={<ListaTipo />} />
          <Route path=":encryptedId" element={<VistaTipo />} />
        </Route>
        <Route path="correlativo" element={<Outlet />} loader={() => ({ name: "Accesos-correlativo" })}>
          <Route index element={<ListaCorrelativo />} />
          <Route path=":encryptedId" element={<VistaCorrelativo />} />
        </Route>
        <Route path="tratamiento" element={<Outlet />} loader={() => ({ name: "tratamiento" })}>
          <Route index element={<ListaTratamiento />} />
          <Route path=":encryptedId" element={<VistaTratamiento />} />
        </Route>
        <Route path="temperamento" element={<Outlet />} loader={() => ({ name: "tratamiento" })}>
          <Route index element={<ListaTemperamento />} />
          <Route path=":encryptedId" element={<VistaTemperamento />} />
        </Route>
        <Route path="config-actividades" element={<Outlet />} loader={() => ({ name: "tratamiento" })}>
          <Route index element={<ListaConfiguracionActividades />} />
          <Route path=":encryptedId" element={<VistaConfiguracionActividades />} />
        </Route>
        <Route path="identificacion" element={<Outlet />} loader={() => ({ name: "identificacion" })}>
          <Route index element={<ListaIdentificacion />} />
          <Route path=":encryptedId" element={<VistaIdentificacion />} />
        </Route>
        <Route path="configuracion" element={<Outlet />} loader={() => ({ name: "identificacion" })}>
          <Route index element={<ListaConfiguracion />} />
          <Route path=":encryptedId" element={<VistaConfiguracion />} />
        </Route>
        <Route path="industria" element={<Outlet />} loader={() => ({ name: "identificacion" })}>
          <Route index element={<ListaIndustria />} />
          {/* <Route path=":encryptedId" element={<VistaConfiguracion />} /> */}
        </Route>
        <Route path="impuestos" element={<Outlet />} loader={() => ({ name: "Accesos-impuestos" })}>
          <Route index element={<ListaImpuestos />} />
          <Route path=":encryptedId" element={<VistaImpuestos />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="moneda" element={<Outlet />} loader={() => ({ name: "Accesos-moneda" })}>
          <Route index element={<ListaMoneda />} />
          <Route path=":encryptedId" element={<VistaMoneda />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="periodicidad" element={<Outlet />} loader={() => ({ name: "Accesos-periodicidades" })}>
          <Route index element={<ListaPeriodicidades />} />
          <Route path="crear" element={<VistaPeriodicidades isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaPeriodicidades isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaPeriodicidades />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="tipo-relacionado" element={<Outlet />} loader={() => ({ name: "Accesos-periodicidades" })}>
          <Route index element={<ListaRelacionTipo />} />
          <Route path="crear" element={<VistaRelacionTipo isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaRelacionTipo isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaRelacionTipo />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="tipo-centro-costo" element={<Outlet />} loader={() => ({ name: "Accesos-periodicidades" })}>
          <Route index element={<ListaTipoCentroCosto />} />
          <Route path="crear" element={<VistaTipoCentroCosto isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaTipoCentroCosto isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaTipoCentroCosto />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="rubros" element={<Outlet />} loader={() => ({ name: "Rubros" })}>
          <Route index element={<ListaRubros />} />
          <Route path=":encryptedId" element={<VistaRubro />} />
        </Route>
        <Route path="commodities" element={<Outlet />} loader={() => ({ name: "Commodities" })}>
          <Route index element={<ListaCommodities />} />
          <Route path=":encryptedId" element={<VistaCommodity />} />
        </Route>
        <Route path="incoterms" element={<Outlet />} loader={() => ({ name: "Incoterms" })}>
          <Route index element={<ListaIncoterms />} />
          <Route path=":encryptedId" element={<VistaIncoterm />} />
        </Route>
        <Route path="equipos" element={<Outlet />} loader={() => ({ name: "Accesos-moneda" })}>
          <Route index element={<ListaEquipos />} />
          <Route path=":encryptedId" element={<VistaEquipos />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
      </Route>
      <Route path="organizacion" element={<MenuBasePage />} loader={() => ({ name: "Organizacion" })}>
        <Route index element={<Outlet />} />
        <Route path="pais" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route index element={<ListaPaises />} loader={() => ({ name: "Accesos-paises" })} />
          <Route path=":encryptedId" element={<VistaPaises />} loader={() => ({ name: "Accesos-paises" })} />
        </Route>
        <Route path="empresa" element={<Outlet />} loader={() => ({ name: "Organizacion-empresa" })}>
          <Route index element={<ListaEmpresas />} loader={() => ({ name: "Organizacion-empresa" })} />
          <Route path=":encryptedId" element={<VistaEmpresa />} loader={() => ({ name: "Organizacion-empresa" })} />
        </Route>
        <Route path="centro_costo" element={<Outlet />} loader={() => ({ name: "Organizacion-centro_costo" })}>
          <Route index element={<ListaCentroCosto />} loader={() => ({ name: "Organizacion-empresa" })} />
          <Route path=":encryptedId" element={<VistaCentroCosto />} loader={() => ({ name: "Organizacion-empresa" })} />
        </Route>
      </Route>
      <Route path="personal" element={<MenuBasePage />} loader={() => ({ name: "Personal" })}>
        <Route index element={<Outlet />} />
        <Route path="usuario" element={<Outlet />} loader={() => ({ name: "Personal-puesto" })}>
          <Route index element={<ListaUsuario />} />
          <Route path=":encryptedId" element={<VistaUsuario />} />
        </Route>
        <Route path="puesto" element={<Outlet />} loader={() => ({ name: "Personal-puesto" })}>
          <Route index element={<ListaPuesto />} />
          <Route path=":encryptedId" element={<VistaPuesto />} />
        </Route>
        <Route path="empleado" element={<Outlet />} loader={() => ({ name: "Personal-empleado" })}>
          <Route index element={<ListaEmpleado />} />
          <Route path=":encryptedId" element={<VistaEmpleado />} />
        </Route>
        <Route path="rol" element={<Outlet />} loader={() => ({ name: "Personal-rol" })}>
          <Route index element={<ListaRol />} />
          <Route path=":encryptedId" element={<Outlet />}>
            <Route index element={<VistaRol />} />
            <Route path="asignar_opcion" element={<Outlet />} />
          </Route>
        </Route>
      </Route>
      <Route path="accesos" element={<MenuBasePage />} loader={() => ({ name: "Accesos" })}>
        <Route index element={<Outlet />} />
        <Route path="modulo" element={<Outlet />} loader={() => ({ name: "Accesos-modulo" })}>
          <Route index element={<ListaModulo />} />
          <Route path=":encryptedId" element={<VistaModulo />} />
        </Route>
        <Route path="menu" element={<Outlet />} loader={() => ({ name: "Accesos-menu" })}>
          <Route index element={<ListaMenu />} />
          <Route path=":encryptedId" element={<VistaMenu />} />
        </Route>
        <Route path="categoria" element={<Outlet />} loader={() => ({ name: "Accesos-categoria" })}>
          <Route index element={<ListaCategoria />} />
          <Route path=":encryptedId" element={<VistaCategoria />} />
        </Route>
        <Route path="opcion" element={<Outlet />} loader={() => ({ name: "Accesos-categoria" })}>
          <Route index element={<ListaOpcion />} />
          <Route path=":encryptedId" element={<VistaOpcion />} />
        </Route>
        <Route path="accion" element={<Outlet />} loader={() => ({ name: "Accesos-acciones" })}>
          <Route index element={<ListaAccion />} />
          <Route path=":encryptedId" element={<VistaAccion />} />
        </Route>
        {/* <Route path="test" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route index element={<ListaTest />} />
          <Route
            path="new"
            element={<VistaTest />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route path="new/:id" element={<VistaTest />} />
          <Route
            path="edit"
            element={<NotFoundPage />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route path="edit/:id" element={<VistaTest />} />
          <Route
            path="view"
            element={<NotFoundPage />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route path="view/:id" element={<VistaTest />} />
        </Route> */}
        <Route path="accion" element={<PaisCrud />} loader={() => ({ name: "Accesos-pais" })} />
        <Route
          path="*"
          element={<NotFoundPage />}
          loader={() => ({
            name: "NotFound",
            errorMessage: "El CRUD consultado no existe, favor verificar la ruta seleccionada o comunicarse al departamento de IT.",
          })}
        />
      </Route>
      <Route path="geolocalizacion" element={<MenuBasePage />} loader={() => ({ name: "Geolocalizacion" })}>
        <Route index element={<Outlet />} />
        <Route path="pais" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route index element={<ListaPaises />} loader={() => ({ name: "Accesos-paises" })} />
          <Route path=":encryptedId" element={<VistaPaises />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        {/* <Route path="ciudad" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route
            path="*"
            element={<NotFoundPage />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route path=":encryptedId" element={<VistaCiudades />} />
        </Route>
        <Route path="departamento" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route
            path="*"
            element={<NotFoundPage />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route path=":encryptedId" element={<VistaDepartamentos />} loader={() => ({ name: "Accesos-paises" })} />
        </Route>
        <Route path="municipio" element={<Outlet />} loader={() => ({ name: "Accesos-pais" })}>
          <Route
            path="*"
            element={<NotFoundPage />}
            loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })}
          />
          <Route index element={<ListaPaises />} />
          <Route path=":encryptedId" element={<VistaMunicipios />} />
        </Route> */}
        <Route path="moneda" element={<Outlet />} loader={() => ({ name: "Accesos-moneda" })}>
          <Route index element={<ListaMoneda />} />
          <Route path=":encryptedId" element={<VistaMoneda />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="impuestos" element={<Outlet />} loader={() => ({ name: "Accesos-impuestos" })}>
          <Route index element={<ListaImpuestos />} />
          <Route path=":encryptedId" element={<VistaImpuestos />} />
          <Route path="*" element={<NotFoundPage />} loader={() => ({ name: "NotFound", errorMessage: "No se ha encontrado el elemento solicitado." })} />
        </Route>
        <Route path="aduana" element={<Outlet />} loader={() => ({ name: "Accesos-punto-enlace" })}>
          <Route index element={<ListaPuntosEnlaces nombreTipo="ADUANA" />} />
          <Route path="crear" element={<VistaPuntoEnlace nombreTipo="ADUANA" isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaPuntoEnlace nombreTipo="ADUANA" isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaPuntoEnlace nombreTipo="ADUANA" />} />
        </Route>
        <Route path="aeropuerto" element={<Outlet />} loader={() => ({ name: "Accesos-punto-enlace" })}>
          <Route index element={<ListaPuntosEnlaces nombreTipo="AEROPUERTO" />} />
          <Route path="crear" element={<VistaPuntoEnlace nombreTipo="AEROPUERTO" isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaPuntoEnlace nombreTipo="AEROPUERTO" isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaPuntoEnlace nombreTipo="AEROPUERTO" />} />
        </Route>
        <Route path="puerto" element={<Outlet />} loader={() => ({ name: "Accesos-punto-enlace" })}>
          <Route index element={<ListaPuntosEnlaces nombreTipo="PUERTO" />} />
          <Route path="crear" element={<VistaPuntoEnlace nombreTipo="PUERTO" isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaPuntoEnlace nombreTipo="PUERTO" isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaPuntoEnlace nombreTipo="PUERTO" />} />
        </Route>
        <Route
          path="*"
          element={<NotFoundPage />}
          loader={() => ({
            name: "NotFound",
            errorMessage: "El CRUD consultado no existe, favor verificar la ruta seleccionada o comunicarce al departamento de IT.",
          })}
        />
      </Route>
      <Route
        path="*"
        element={<NotFoundPage />}
        loader={() => ({
          name: "NotFound",
          errorMessage: "El CRUD consultado no existe, favor verificar la ruta seleccionada o comunicarce al departamento de IT.",
        })}
      />
    </Routes>
  );
};
