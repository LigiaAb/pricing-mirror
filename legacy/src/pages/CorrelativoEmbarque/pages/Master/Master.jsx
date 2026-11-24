import { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import TabComponent from "../../../../components/Tabs/TabComponent";
import SecuencialMaster from "./Secuencial/SecuencialMaster";
import PoolMaster from "./Pool/PoolMaster";
import ManualMaster from "./Manual/ManualMaster";


const Master = ({
  correlativos,
  isLoading = false,
  onEdit = () => { },
  onDelete = () => { },
  onAgregar = () => { },
}) => {

  const handleAgregarSecuencial = useCallback(() => onAgregar("SECUENCIAL"), [onAgregar]);
  const handleAgregarManual = useCallback(() => onAgregar("MANUAL"), [onAgregar]);

  const opciones = useMemo(() => [
    {
      id: "SECUENCIAL",
      label: "Secuencial",
      icono: "c-avion",
      content: (
        <SecuencialMaster
          correlativos={correlativos}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onAgregar={handleAgregarSecuencial}
        />
      ),
    },
    {
      id: "MANUAL",
      label: "Manual",
      icono: "c-lista",
      content: (
        <ManualMaster
          correlativos={correlativos}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onAgregar={handleAgregarManual}
        />
      ),
    },
    {
      id: "POOL",
      label: "Pool",
      icono: "c-camion",
      content: (
        <PoolMaster
          correlativos={correlativos}
          isLoading={isLoading}
          onEdit={onEdit}
          onDelete={onDelete}
          onAgregar={handleAgregarSecuencial}
        />
      ),
    },
  ], [correlativos, isLoading, onEdit, onDelete, handleAgregarSecuencial, handleAgregarManual]);

  return (
    <TabComponent
      opciones={opciones}
      tabInicial="SECUENCIAL"
      direccion="horizontal"
      variante="scrollable"
      bgcolor="background.main"
      mostrarTitulo={false}
      noOcultarTabs={true}
    />
  );
};

Master.propTypes = {
  correlativos: PropTypes.array,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onAgregar: PropTypes.func,
};

export default Master;
