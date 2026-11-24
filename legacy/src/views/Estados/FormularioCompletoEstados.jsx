import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioCompletoEstados = ( props ) => {
  const { dataGet, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput } = props;
  const [data, setData] = useState( null );
  const [errorsInputs, setErrorsInputs] = useState( {} );
  const navigate = useNavigate();

  const createRecord = async ( data ) => {
    try {
      const response = await api.post( "/api/appweb/insertarestado", data );
      if ( response.data.data.mensaje === "Estado creado correctamente" ) {
        const estado = response.data.data.cod_estado;
        navigate( `../view/${estado}` );
      } else if ( response.data.data.mensaje === "faltan parametros requeridos, verifique" ) console.error( "Error en el nuevo registro" );
    } catch ( error ) {
      console.error( error );
    }
  };

  const updateRecord = async ( dataUpdated ) => {
    try {
      const response = await api.post( "/api/appweb/actualizarestado", dataUpdated );
      if ( response.data.data.mensaje === "Estado actualizado correctamente" ) {
        setUpdateData( !updateData );
      }
      console.log( "Estado actualizado correctamente", response );
    } catch ( error ) {
      console.error( error );
    }
  };

  useEffect( () => {
    if ( dataGet ) {
      setData( {
        estado_desc: dataGet.estado_desc,
        cod_estado: dataGet.cod_estado,
      } );
    } else {
      setData( false );
    }
  }, [dataGet] );

  useEffect( () => {
    if ( dataGet && data ) {
      handleValidateBtn( data, dataGet );
    }
  }, [data] );

  const handleValidateBtn = ( dataForUpdate, infoCompare ) => {
    const props = [];
    for ( const item in dataForUpdate ) {
      props.push( item );
    }
    const exam = props.some( ( nameProp ) => {
      return dataForUpdate[nameProp] != infoCompare[nameProp];
    } );
    setEnableBtn( !exam );
  };

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "estado_desc",
        val: data?.estado_desc,
        label: "Estado",
        readonly: readOnlyInput,
      },
    ],
    [data]
  );

  const inputsNewEstado = useMemo(
    () => [
      {
        tipo: "text",
        id: "estado_desc",
        val: "",
        label: "Estado",
        requerido: errorsInputs.estado_desc,
      },
    ],
    [data, errorsInputs]
  );

  const validateFormData = ( data ) => {
    let errors = {};

    if ( data.estado_desc === undefined || data.estado_desc === "" ) errors.estado_desc = true;

    return errors;
  };

  const handleSubmitPost = () => {
    const dataSend = {
      estado_desc: data.estado_desc?.toUpperCase(),
    };

    const handleErrors = validateFormData( dataSend );
    if ( Object.keys( handleErrors ).length > 0 ) {
      setErrorsInputs( handleErrors );
      return null;
    }
    createRecord( dataSend );
  };

  const handleSubmitUpdate = () => {
    const dataSend = {
      estado_desc: data.estado_desc.toUpperCase(),
      cod_estado: data.cod_estado,
    };
    updateRecord( dataSend );
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {data && dataGet && (
        <Box display="flex" alignItems="end" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={( { id, val } ) => {
              setData( ( inp ) => ( { ...inp, [id]: val } ) );
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: enableBtn },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Box>
      )}
      {!dataGet && (
        <Box>
          <FormularioComponent
            inputs={inputsNewEstado}
            onInput={( { id, val } ) => {
              setData( ( inp ) => ( { ...inp, [id]: val } ) );
            }}
            botones={{
              agregar: {
                visible: true,
                onClick: handleSubmitPost,
              },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
