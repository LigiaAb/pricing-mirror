import { useState, useCallback, useEffect } from "react";
import { Stack, Pagination, Box, Typography } from "@mui/material";
import { api } from "../../api";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import LoaderComponent from "../../components/Loader/LoaderComponent";
import FiltrosReporteObjetivos from "./components/FiltrosReporteObjetivos";
import TablaResultadosObjetivosActividad from "./components/TablaResultadosObjetivosActividades/TablaResultadosObjetivosActividades";
import useFetchersCatalogosReporte from "./hooks/useFetchersCatalogosReporte";

const ReporteObjetiovsActividadesPorEmpleado = () => {
  const dispatch = useDispatch();
  const { obtenerEmpresas, obtenerCentrosCostos, obtenerTiposAsignacion, obtenerPeriodicidades } = useFetchersCatalogosReporte();

  const [resultadosObjetivos, setResultadosObjetivos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [elementsPerPage, setElementsPerPage] = useState(7);
  const lastElementIndex = currentPage * elementsPerPage;
  const firstElementIndex = lastElementIndex - elementsPerPage;

  const [isOpenLoader, setIsOpenLoader] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCostos, setCentrosCostos] = useState([]);
  const [tiposAsignacion, setTiposAsignacion] = useState([]);
  const [periodicidades, setPeriodicidades] = useState([]);

  const hayEmpleadosConElTipoAsignacion = !!resultadosObjetivos.length && resultadosObjetivos[0].empleados.length;

  const obtenerResultadosObjetivos = useCallback(async (filtros) => {
    const apiBaseURL = "/api/appweb/reporte-objetivos";
    const response = await api.get(apiBaseURL, { params: filtros });
    const resultadosObjetivos = response.data.data;
    setResultadosObjetivos(resultadosObjetivos);
  }, []);

  useEffect(() => {
    dispatch(encenderCarga);
    setIsOpenLoader(true);
    Promise.all([
      obtenerEmpresas().then((empresas) => setEmpresas(empresas)),
      obtenerCentrosCostos().then((centrosCostos) => setCentrosCostos(centrosCostos)),
      obtenerTiposAsignacion().then((tiposAsignacion) => setTiposAsignacion(tiposAsignacion)),
      obtenerPeriodicidades().then((periodicidades) => setPeriodicidades(periodicidades)),
    ]).then(() => {
      dispatch(apagarCarga);
      setIsOpenLoader(false);
    });
  }, [dispatch, obtenerEmpresas, obtenerCentrosCostos, obtenerTiposAsignacion, obtenerPeriodicidades]);

  const handleFiltrarResultadosObjetivos = async (filtros) => {
    setIsOpenLoader(true);
    await obtenerResultadosObjetivos(filtros);
    setIsOpenLoader(false);
  };

  const paginator = (
    <Stack direction="row" justifyContent="center">
      <Pagination count={Math.ceil(resultadosObjetivos.length / elementsPerPage)} page={currentPage} onChange={(e, page) => setCurrentPage(page)} />
    </Stack>
  );

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2}>
        <FiltrosReporteObjetivos catalogos={{ empresas, centrosCostos, tiposAsignacion }} onFiltrarResultadosObjetivos={handleFiltrarResultadosObjetivos} />

        {!resultadosObjetivos.length || !hayEmpleadosConElTipoAsignacion ? (
          <Box>
            <Typography variant="h6" align="center">
              No hay resultados
            </Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={4}>
            {paginator}

            {resultadosObjetivos.slice(firstElementIndex, lastElementIndex).map((resultado) => (
              <TablaResultadosObjetivosActividad key={resultado.id} catalogos={{ periodicidades }} resultado={resultado} />
            ))}

            {!!resultadosObjetivos.length && paginator}
          </Box>
        )}
      </Box>

      <LoaderComponent open={isOpenLoader} />
    </>
  );
};

export default ReporteObjetiovsActividadesPorEmpleado;
