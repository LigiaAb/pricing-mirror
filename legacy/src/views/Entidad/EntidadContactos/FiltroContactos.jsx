import { Box } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { api } from "../../../api";
import { useDebounce } from "../../../utils/debounce";

export const FiltroContactos = (props) => {
  const {
    debounceDelay = 300,
    useCache = true,
    setResults,
    tipo_entidad = 0,
    entidad_id = 0
  } = props;

  const [cache, setCache] = useState({});
  const [valores, setValores] = useState({
    query: null
  });

  const debouncedSearchTerm = useDebounce(valores.query, debounceDelay);

  const inputs = useMemo(() => {
    return [
      { id: "query", label: "Valor", tipo: "text", size:12, val: valores?.query || "", readonly: false } ,
    ]
  }, [valores]);

  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);

  const fetchData = async (query) => {
    if (useCache && cache[query]) {
      setResults(editProperties(cache[query]));
      return;
    }
    try {
      api.get("api/appweb/lista-entidad-contacto", { params: { cod_tipo: tipo_entidad, entidad_id: entidad_id } })
        .then(({ data }) => {
          console.log(data.data.data)
          setCache({ ...cache, [query]: data.data.data })
          setResults(editProperties(data.data.data));
        })
        .catch((e) => console.error(e));
    } catch (error) {
      console.error('Error fetching data:', error);
    } 
  };

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      fetchData(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  const editProperties = (arr) => {
    return arr.map((item, i) => {
      return {
        ...item,
        "unique_id": i+1,
        accionesDeTabla: {
          ...item.accionesDeTabla,
          ...{ view: true, add: false, go: false, excel: false, pdf: false, download: false, auth: true, },
        },
      };
    });
  };

  return (
    <Box sx={{  m: 0 }}>
      <FormularioComponent
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: false, onClick: null },
          cancelar: { visible: false, onClick: null },
          guardar: { visible: false, onClick: null },
          filtrar: { visible: false, onClick: null },
        }}
      />
    </Box>
  );
};

FiltroContactos.propTypes = {
  debounceDelay: PropTypes.number,
  useCache: PropTypes.bool,
  tiposBusqueda: PropTypes.array,
  tiposEntidad: PropTypes.array,
  setResults: PropTypes.func,
  listaTipos: PropTypes.array,
  tipoDefaultIndex: PropTypes.number,
};