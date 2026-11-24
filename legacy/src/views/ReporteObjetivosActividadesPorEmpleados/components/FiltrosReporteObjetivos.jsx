import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones, { useObtenerPermisosDeMenuActual } from "../../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";

const formatFiltrosToApiSubmissionFormat = (filtros) => {
  return {
    ...filtros,
    cod_emp: filtros.empresa?.value,
    cod_cc: filtros.centroCosto?.value,
    cod_tipo_asignacion: filtros.tipoAsignacion?.value,
  };
};

const FiltrosReporteObjetivos = ({ catalogos, onFiltrarResultadosObjetivos }) => {
  const { empresas, centrosCostos, tiposAsignacion } = catalogos;
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const permisosDePantallaActual = useObtenerPermisosDeMenuActual();

  const opcion = permisosArray.find((o) => o.nom_opcion === "Información" && o.nivel_opcion === "E");
  const puedeFiltrarEmpresaCentroCosto = opcion?.acciones?.some((a) => a.nom_accion === "Filtrar Empresa Centro Costo");
  const permisoReportesPaisCC = useMemo(
    () => "11" in (Object.values(Object.values(permisosDePantallaActual).find((i) => i.nom_cat === "Reportes")?.opciones)[0]?.acciones || {}),
    [permisosDePantallaActual]
  );

  const valoresIniciales = useMemo(() => {
    let empresa = { ...currentEmpresa };
    empresa = { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa };
    delete empresa.centrosCosto;
    let centroCosto = { ...currentCentroCosto };
    centroCosto = { ...centroCosto, label: centroCosto.nombre_cc, value: centroCosto.cod_cc };
    delete centroCosto.modulos;
    return {
      empresa,
      centroCosto,
      fecha_inicial: null,
      fecha_final: new Date(),
      tipoAsignacion: null,
    };
  }, [currentEmpresa, currentCentroCosto]);

  const [valores, setValores] = useState(valoresIniciales);

  const centrosCostosSeleccionables = useMemo(() => {
    return centrosCostos.filter((cc) => cc.cod_empresa_cc === valores.empresa?.value);
  }, [valores.empresa, centrosCostos]);

  const [isOpenAlertErrores, setIsOpenAlertErrores] = useState(false);

  const inputs = [
    {
      tipo: "select",
      label: "Empresa",
      id: "empresa",
      options: empresas,
      val: valores.empresa,
      requerido: true,
      readonly: false,
      visible: permisoReportesPaisCC !== undefined ? permisoReportesPaisCC : puedeFiltrarEmpresaCentroCosto,
    },
    {
      tipo: "select",
      label: "Centro de Costo",
      id: "centroCosto",
      options: centrosCostosSeleccionables,
      val: valores.centroCosto,
      requerido: true,
      readonly: !valores.empresa,
      visible: permisoReportesPaisCC !== undefined ? permisoReportesPaisCC : puedeFiltrarEmpresaCentroCosto,
    },
    {
      tipo: "datetime",
      label: "Fecha Inicial",
      id: "fecha_inicial",
      val: valores.fecha_inicial,
      requerido: true,
      readonly: false,
    },
    {
      tipo: "datetime",
      label: "Fecha Final",
      id: "fecha_final",
      val: valores.fecha_final,
      requerido: true,
      readonly: false,
    },
    {
      tipo: "select",
      label: "Tipo de Asignación",
      id: "tipoAsignacion",
      options: tiposAsignacion,
      val: valores.tipoAsignacion,
      requerido: true,
      readonly: false,
    },
  ];

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const newValues = { ...prev, [id]: val };

      if (id === "empresa") {
        newValues.centroCosto = null;
      }

      return newValues;
    });
  };

  const handleFiltrarResultadosObjetivos = () => {
    if (!valores.empresa || !valores.centroCosto || !valores.tipoAsignacion || !valores.fecha_inicial || !valores.fecha_final) {
      setIsOpenAlertErrores(true);
      return;
    }
    onFiltrarResultadosObjetivos(formatFiltrosToApiSubmissionFormat(valores));
  };

  return (
    <>
      <FormularioComponent
        titulo="FiltrosReporteObjetivos"
        inputs={inputs}
        onInput={handleInputChange}
        botones={{
          agregar: { visible: false },
          filtrar: { visible: true, onClick: handleFiltrarResultadosObjetivos },
        }}
      />

      <ActionAlertComponent
        content="Todods los campos son obligatorios"
        openDialog={isOpenAlertErrores}
        titulo="Error"
        tipo="error"
        activarAceptar={true}
        activarCanecelar={false}
        aceptar={() => setIsOpenAlertErrores(false)}
      />
    </>
  );
};

FiltrosReporteObjetivos.propTypes = {
  catalogos: PropTypes.object,
  onFiltrarResultadosObjetivos: PropTypes.func,
};

export default FiltrosReporteObjetivos;
