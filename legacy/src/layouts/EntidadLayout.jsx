import React, { useCallback, useEffect, useState } from "react";
import { Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { encryptId } from "../api/encryptDecrypt";
import ListaEntidad from "../pages/Entidad/ListaEntidad";
import VistaEntidad from "../pages/Entidad/VistaEntidad";
import PropTypes from "prop-types";
import { useFetchAllEntidadesSimple } from "@/hooks/Fetch/useFetchEntidades";

const EntidadLayout = ({ tipo, ruta }) => {
  let { encryptedTipo } = useParams(); // Obtiene el :encryptedTipo de la URL
  const [tipoConsultado, setTipoConsultado] = useState(null); // Guarda el tipo consultado desde la API
  const [tipoActual, setTipoActual] = useState(tipo); // Guarda el tipo actual pasado como prop
  const navigate = useNavigate();

  const listaEntidades = useFetchAllEntidadesSimple([tipo], { cod_estado: ["CLIENTE", "PROVEEDOR"].includes(tipo) ? undefined : 1, tipo_entidad: tipo }, {}, undefined, 1);

  // const entidadFetch = useFetchAllEntidadesSimple();

  const consultar = useCallback(async () => {
    // Si `tipoConsultado` ya coincide con `tipoActual`, no hacer nada
    if (tipoConsultado && encryptedTipo === encryptId(tipoConsultado) && tipoActual === tipo) {
      return;
    }

    try {
      // Realiza la consulta a la API solo si no se ha consultado aún
      const { data, cod_tipo: nuevoTipo } = listaEntidades.data || [];

      // Si el tipo obtenido de la API es diferente al actual, actualiza el estado y navega
      if (nuevoTipo !== tipoConsultado) {
        setTipoConsultado(nuevoTipo);
        navigate(`${encryptId(nuevoTipo)}`, { replace: true }); // Navega a la nueva ruta encriptada
      }

      setTipoActual(tipo); // Actualiza el tipo actual
    } catch (error) {
      console.error("Error al consultar el tipo:", error);
    }
  }, [encryptedTipo, navigate, tipo, tipoActual, tipoConsultado, listaEntidades.data]);

  useEffect(() => {
    // Solo llamar a `consultar` si no hay `encryptedTipo` en la URL
    if (!encryptedTipo) {
      consultar();
    }
  }, [consultar, encryptedTipo]);

  return (
    <Routes>
      <Route path=":encryptedTipo" element={<Outlet />}>
        <Route index element={<ListaEntidad tipoStr={tipo} />} />
        <Route path=":encryptedId" element={<VistaEntidad tipoStr={tipo} />} />
      </Route>
    </Routes>
  );
};

EntidadLayout.propTypes = {
  tipo: PropTypes.string.isRequired,
  ruta: PropTypes.string.isRequired,
};

export default EntidadLayout;
