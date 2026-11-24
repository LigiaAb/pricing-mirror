import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid, Icon, Typography } from "@mui/material";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useFetchIndustrias, useFetchPaises, useFetchTipos, useFetchCommodities, useFetchPeriodicidad } from "../../hooks/Fetch/useFetchCatalog";
import { ConstructionIcon } from "lucide-react";

export const FormularioPreferencias = (props) => {
    const {entidad_id, titulo } = props;
    const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
    const dispatch = useDispatch();
    const [data, setData] = useState({
        entidad: null
    });

    const paises = useFetchPaises()
    const industrias = useFetchIndustrias()
    const tipos = useFetchTipos()
    const commodities = useFetchCommodities()
    const periodicidad = useFetchPeriodicidad()

    const [errorInputs, setErrorInputs] = useState(false);
    const [fechaLimite, setFechaLimite] = useState(new Date("1900-01-01"));
    const [direcciones, setDirecciones] = useState([]);
    const [contactos, setContactos] = useState([]);
    const [listaError, setListaError] = useState([]);
    const [entidadData, setEntidadData] = useState({
        data_contactos: [],
        data_direcciones: [],
    }); 

    useEffect(() => {
        if(!!entidad_id){
            getEntidad()  
        }

        async function getEntidad() {
            const datos_entidad = await api
                .get("api/appweb/recuperar-datos-entidad-resumen", {
                    params: { cod_entidad: entidad_id }
                })
                .then(({ data }) => {
                    if(!!data.data[0]){
                        setData((old) => ({ ...old, entidad: {
                            ...data.data[0],
                            entidad_id: data.data[0].cod_entidad
                        } }))
                        return data.data[0]
                    }
                    
                })
                .catch((e) => {
                    console.error(e);
                });

            const datos_extra = await api
                .get("api/appweb/recuperar-datos-entidad", {
                    params: { cod_tipo: datos_entidad.cod_tipo, entidad_id: datos_entidad.cod_entidad }
                })
                .then(({ data }) => {
                    setEntidadData(data.data)
                    return data.data
                })
                .catch((e) => {
                    setEntidadData({
                        data_contactos: [],
                        data_direcciones: [],
                    })
                });

            await getPreferencias(datos_extra)
        }

        async function getPreferencias(datos_entidad) {
            const preferencias = await api
                .get("api/appweb/lista-entidad-preferencias", {
                    params: { entidad_id: entidad_id }
                })
                .then(({ data }) => {
                    if(!!data.data.data){
                        return data.data.data
                    }
                    return null
                })
                .catch((e) => {
                    return null
                });

            if(!!preferencias){
                const data = {
                    contacto: datos_entidad?.data_contactos?.find(c => c.ENTIDADCONTACTO_ID == preferencias.entidadcontacto_id) || null,
                    direccion: datos_entidad?.data_direcciones?.find(d => d.ENTIDADDIRECCION_ID == preferencias.entidaddireccion_id) || null,
                    industria: industrias.data.find(i => i.cod_industria == preferencias.industria_id) || null,
                    periodicidad: periodicidad.data.find(p => p.cod_periodicidad == preferencias.periodicidad_id) || null,
                    commodity: commodities.data.find(c => c.cod_commodity == preferencias.commodity_id) || null,
                    instrucciones: preferencias.instruccion,
                    peso_objetivo: preferencias.peso_objetivo,

                    check_maritimo: false,
                    check_aereo: false,
                    check_terrestre: false,

                    paises_maritimo: [],
                    paises_aereo: [],
                    paises_terrestre: [],

                    tipo_carga_maritimo: [],
                    tipo_carga_aereo: [],
                    tipo_carga_terrestre: [],

                    clasificacion_carga_maritimo: [],
                    clasificacion_carga_aereo: [],
                    clasificacion_carga_terrestre: []
                }

                preferencias.transportes.forEach(t => {
                    const mapData = (codigos, catalogo, key) => codigos.map(cod => catalogo.find(i => i[key] === cod)).filter(Boolean)

                    if (t.tipo_transporte_id == 50) {
                        data.check_maritimo = true
                        data.paises_maritimo = mapData(t.paises, paises.data, "cod_pais")
                        data.tipo_carga_maritimo = mapData(t.tipo_carga, tipos.data, "cod_tipo")
                        data.clasificacion_carga_maritimo = mapData(t.clasificacion, tipos.data, "cod_tipo")
                    }

                    if (t.tipo_transporte_id == 49) {
                        data.check_aereo = true
                        data.paises_aereo = mapData(t.paises, paises.data, "cod_pais")
                        data.tipo_carga_aereo = mapData(t.tipo_carga, tipos.data, "cod_tipo")
                        data.clasificacion_carga_aereo = mapData(t.clasificacion, tipos.data, "cod_tipo")
                    }

                    if (t.tipo_transporte_id == 51) {
                        data.check_terrestre = true
                        data.paises_terrestre = mapData(t.paises, paises.data, "cod_pais")
                        data.tipo_carga_terrestre = mapData(t.tipo_carga, tipos.data, "cod_tipo")
                        data.clasificacion_carga_terrestre = mapData(t.clasificacion, tipos.data, "cod_tipo")
                    }
                })

                setData((old) => ({ ...old, ...data}))

            }
        }
        
    }, [commodities.data, periodicidad.data])

    // useEffect(() => {
    //     let active = true
        
    //     if(!!data.entidad){
    //         load()
    //     } else {
    //         setEntidadData({
    //             data_contactos: [],
    //             data_direcciones: [],
    //         })
    //     }

    //     setData((prev) => ({
    //         ...prev,
    //         contacto: null,
    //         direccion: null,
    //         industria: null
    //     }))

    //     return () => { active = false }

    //     async function load() {
    //     //   console.log(data.entidad)
    //         await api
    //             .get("api/appweb/recuperar-datos-entidad", {
    //                 params: { cod_tipo: data.entidad.cod_tipo, entidad_id: data.entidad.entidad_id }
    //             })
    //             .then(({ data }) => {
    //                 setEntidadData(data.data)
    //             })
    //             .catch((e) => {
    //                 console.error(e);
    //                 setEntidadData({
    //                     data_contactos: [],
    //                     data_direcciones: [],
    //                 })
    //             });

    //         if (!active) { return }
    //     // setResult(res)
    //     }
    // }, [entidad_id])


    // useEffect(() => {
    //     // getPreferencias()
    //     async function getPreferencias() {
    //         const preferencias = await api
    //             .get("api/appweb/lista-entidad-preferencias", {
    //                 params: { entidad_id }
    //             })
    //             .then(({ data }) => {
    //                 if(!!data.data.data){
    //                     return data.data.data
    //                 }
    //                 return null
                    
    //             })
    //             .catch((e) => {
    //                 return null
    //             });

    //         if(!!preferencias){
    //             const data = {
    //                 contacto: entidadData?.data_contactos?.find(c => c.ENTIDADCONTACTO_ID == preferencias.entidadcontacto_id) || null,
    //                 direccion: entidadData?.data_direcciones?.find(d => d.ENTIDADDIRECCION_ID == preferencias.entidaddireccion_id) || null,
    //                 industria: industrias.data.find(i => i.cod_industria == preferencias.industria_id) || null,
    //                 periodicidad: periodicidad.data.find(p => p.cod_periodicidad == preferencias.periodicidad_id) || null,
    //                 commodity: commodities.data.find(c => c.cod_commodity == preferencias.commodity_id) || null,
    //                 instrucciones: preferencias.instruccion,
    //                 peso_objetivo: preferencias.peso_objetivo,

    //                 check_maritimo: false,
    //                 check_aereo: false,
    //                 check_terrestre: false,

    //                 paises_maritimo: [],
    //                 paises_aereo: [],
    //                 paises_terrestre: [],

    //                 tipo_carga_maritimo: [],
    //                 tipo_carga_aereo: [],
    //                 tipo_carga_terrestre: [],

    //                 clasificacion_carga_maritimo: [],
    //                 clasificacion_carga_aereo: [],
    //                 clasificacion_carga_terrestre: []
    //             }

    //             preferencias.transportes.forEach(t => {
    //                 const mapData = (codigos, catalogo, key) => codigos.map(cod => catalogo.find(i => i[key] === cod)).filter(Boolean)

    //                 if (t.tipo_transporte_id == 50) {
    //                     data.check_maritimo = true
    //                     data.paises_maritimo = mapData(t.paises, paises.data, "cod_pais")
    //                     data.tipo_carga_maritimo = mapData(t.tipo_carga, tipos.data, "cod_tipo")
    //                     data.clasificacion_carga_maritimo = mapData(t.clasificacion, tipos.data, "cod_tipo")
    //                 }

    //                 if (t.tipo_transporte_id == 49) {
    //                     data.check_aereo = true
    //                     data.paises_aereo = mapData(t.paises, paises.data, "cod_pais")
    //                     data.tipo_carga_aereo = mapData(t.tipo_carga, tipos.data, "cod_tipo")
    //                     data.clasificacion_carga_aereo = mapData(t.clasificacion, tipos.data, "cod_tipo")
    //                 }

    //                 if (t.tipo_transporte_id == 51) {
    //                     data.check_terrestre = true
    //                     data.paises_terrestre = mapData(t.paises, paises.data, "cod_pais")
    //                     data.tipo_carga_terrestre = mapData(t.tipo_carga, tipos.data, "cod_tipo")
    //                     data.clasificacion_carga_terrestre = mapData(t.clasificacion, tipos.data, "cod_tipo")
    //                 }
    //             })

    //             setData((old) => ({ ...old, ...data}))

    //         }
    //     }
    // }, [entidadData, commodities, periodicidad])


    const fetchOptions = async (searchTerm) => {
        return await api
            .get("api/appweb/busqueda-entidad-x-criterio", {
            params: {
                ref_busqueda: searchTerm,
                list_descripcion_tipo: ["CLIENTE"],
                tipo_busqueda: "NOMBRE",
            },
            })
            .then(({ data }) => {
            const convertKeysToLowerCase = (obj) => {
                if (Array.isArray(obj)) {
                return obj.map((v) => convertKeysToLowerCase(v));
                } else if (obj !== null && obj.constructor === Object) {
                return Object.keys(obj).reduce((acc, key) => {
                    acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
                    return acc;
                }, {});
                }
                return obj;
            };
    
            const eliminarDuplicadosById = (arr, id) => {
                return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
            };
    
            return eliminarDuplicadosById(convertKeysToLowerCase(data.data.data), "entidad_id");
            })
            .catch((e) => {
                console.error(e);
                return [];
            });
    };

    const grupos = useMemo(() => {
        const borderWidth = 1,
          borderColor = "primary",
          borderStyle = "doted";
        return [
          { id: "preferencias", label: titulo ? "Visiting Report" : "", borderWidth, borderStyle, borderColor: "accent", bgcolor: "accent", variant: "h4" },
        ];
      }, []);

    const inputs = useMemo(() => {        
        return [
            {
                grupoId: "preferencias",
                id: "entidad",
                tipo: "select",
                label: "Cliente",
                options: [],
                val: data?.entidad,
                fetchOptions,
                valueOption: "entidad_id",
                labelOption: "entidad_nombre",
                size: 12,
                // readonly: !!entidad_id 
            },
            {
                grupoId: "preferencias",
                id: "contacto",
                label: "Contacto",
                val: data?.contacto ,
                tipo: "select",
                options: entidadData?.data_contactos,
                valueOption: "ENTIDADCONTACTO_ID",
                labelOption: "ENTIDADCONTACTO_NOMBRE",
                size: 4,
                actions: data.entidad ?  [{
                    icono: "c-suma",
                    nombre: "Crear Nuevo",
                    onClick: () => console.log("test")
                }] : []
            },
            {
                grupoId: "preferencias",
                id: "telefono",
                label: "Telefono",
                val: data?.contacto?.ENTIDADCONTACTO_TELEFONO || "",
                tipo: "text",
                readonly: true,
                size: 4
            },
            {
                grupoId: "preferencias",
                id: "correo",
                label: "Correo",
                val: data?.contacto?.ENTIDADCONTACTO_EMAIL || "",
                tipo: "text",
                readonly: true,
                size: 4
            },
            {
                grupoId: "preferencias",
                id: "direccion",
                label: "Direccion",
                val: data?.direccion ,
                tipo: "select",
                options: entidadData?.data_direcciones,
                valueOption: "ENTIDADDIRECCION_ID",
                labelOption: "ENTIDADDIRECCION_DIRECCION",
                size: 6,
                actions: data.entidad ?  [{
                    icono: "c-suma",
                    nombre: "Crear Nuevo",
                    onClick: () => console.log("test")
                }] : []
            },
            {
                grupoId: "preferencias",
                id: "industria",
                label: "Industria",
                val: data?.industria ,
                tipo: "select",
                options: industrias.data,
                valueOption: "cod_industria",
                labelOption: "nom_industria_en",
                size: 6
            },
            {
                grupoId: "preferencias",
                id: "commodity",
                label: "Commodity",
                val: data?.commodity ,
                tipo: "select",
                options: commodities.data,
                valueOption: "cod_commodity",
                labelOption: "nombre",
                size: 6
            },
            {
                grupoId: "preferencias",
                id: "periodicidad",
                label: "Frecuencia de contacto",
                val: data?.periodicidad ,
                tipo: "select",
                options: periodicidad.data,
                valueOption: "cod_periodicidad",
                labelOption: "descripcion",
                size: 6,
                multiple: false
            },
            {
                grupoId: "preferencias",
                id: "peso_objetivo",
                label: "Peso Objetivo",
                val: data?.peso_objetivo || null,
                tipo: "number",
                readonly: false,
                size: 6
            },
            {
                grupoId: "preferencias",
                id: "instrucciones",
                label: "Instrucciones",
                val: data?.instrucciones ,
                tipo: "textarea",
                size: 12,
            },

            { grupoId: "preferencias", id: "subtitulo", tipo: "subtitulo", val: "Tipos de Carga" },

            { grupoId: "preferencias", id: "check_maritimo", tipo: "checkbox", label: "Maritimo", options: true, val: data.check_maritimo, size: data.check_maritimo ? 3 : 12 },
            !!data.check_maritimo ? 
            {
                grupoId: "preferencias",
                id: "paises_maritimo",
                label: "Paises",
                val: data?.paises_maritimo || [],
                tipo: "select",
                options: paises.data || [],
                valueOption: "cod_pais",
                labelOption: "nombre_pais",
                size: 3,
                multiple: true
            }: null,
            !!data.check_maritimo ? 
            {
                grupoId: "preferencias",
                id: "tipo_carga_maritimo",
                label: "Tipo de carga",
                val: data?.tipo_carga_maritimo || [],
                tipo: "select",
                options: tipos.data.filter(tipo => tipo.tipo_tabla === "TIPO_CARGA") || [] ,
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,
            !!data.check_maritimo ? 
            {
                grupoId: "preferencias",
                id: "clasificacion_carga_maritimo",
                label: "Clasificacion de carga",
                val: data?.clasificacion_carga_maritimo || [],
                tipo: "select",
                options: tipos.data.filter(tipo => tipo.tipo_tabla === "CLASIFICACION_CARGA") || [],
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,

            { grupoId: "preferencias", id: "check_aereo", tipo: "checkbox", label: "Aéreo", options: true, val: data.check_aereo, size: data.check_aereo ? 3 : 12 },
            !!data.check_aereo ? 
            {
                grupoId: "preferencias",
                id: "paises_aereo",
                label: "Paises",
                val: data?.paises_aereo || [],
                tipo: "select",
                options: paises.data || [],
                valueOption: "cod_pais",
                labelOption: "nombre_pais",
                size:  3,
                multiple: true
            }: null,
            !!data.check_aereo ? 
            {
                grupoId: "preferencias",
                id: "tipo_carga_aereo",
                label: "Tipo de carga",
                val: data?.tipo_carga_aereo || [] ,
                tipo: "select",
                options: tipos.data.filter(tipo => tipo.tipo_tabla === "TIPO_CARGA") || [],
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,
            !!data.check_aereo ? 
            {
                grupoId: "preferencias",
                id: "clasificacion_carga_aereo",
                label: "Clasificacion de carga",
                val: data?.clasificacion_carga_aereo || [],
                tipo: "select",
                options: tipos.data.filter(tipo => tipo.tipo_tabla === "CLASIFICACION_CARGA") || [],
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,


            { grupoId: "preferencias", id: "check_terrestre", tipo: "checkbox", label: "Terrestre", options: true, val: data.check_terrestre, size: data.check_terrestre ? 3 : 12 },
            !!data.check_terrestre ? 
            {
                grupoId: "preferencias",
                id: "paises_terrestre",
                label: "Paises",
                val: data?.paises_terrestre || [],
                tipo: "select",
                options: paises.data || [],
                valueOption: "cod_pais",
                labelOption: "nombre_pais",
                size: 3,
                multiple: true
            }: null,
            !!data.check_terrestre ? 
            {
                grupoId: "preferencias",
                id: "tipo_carga_terrestre",
                label: "Tipo de carga",
                val: data?.tipo_carga_terrestre || [],
                tipo: "select",
                options: tipos.data.filter(tipo => (tipo.tipo_tabla === "TIPO_CARGA") && (tipo.cod_estado == 1)) || [],
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,
            !!data.check_terrestre ? 
            {
                grupoId: "preferencias",
                id: "clasificacion_carga_terrestre",
                label: "Clasificacion de carga",
                val: data?.clasificacion_carga_terrestre || [],
                tipo: "select",
                options: tipos.data.filter(tipo => (tipo.tipo_tabla === "CLASIFICACION_CARGA") && (tipo.cod_estado == 1)) || [],
                valueOption: "cod_tipo",
                labelOption: "nom_tipo",
                size: 3,
                multiple: true
            }: null,
        ].filter((input) => input != null);
    }, [data, entidadData, tipos.data, paises.data, industrias.data, periodicidad.data, commodities.data]);

    const handleSubmitPost = async () => {
        let postData = {}
        // console.log(data)
        const { entidad, contacto, direccion, commodity, industria, periodicidad, instrucciones, check_maritimo, check_aereo, check_terrestre, paises_aereo, paises_maritimo, paises_terrestre,
            tipo_carga_aereo, tipo_carga_maritimo, tipo_carga_terrestre, clasificacion_carga_aereo, clasificacion_carga_maritimo, clasificacion_carga_terrestre, peso_objetivo } = data

        if(!!entidad){
            postData = {
                entidad_id: entidad.entidad_id,
                entidadcontacto_id: !!contacto ? (contacto.ENTIDADCONTACTO_ID || contacto.entidadcontacto_id) : null,
                entidaddireccion_id: !!direccion ? (direccion.ENTIDADDIRECCION_ID || direccion.entidaddireccion_id) : null,
                industria_id: !!industria ? industria.cod_industria : null, 
                periodicidad_id:  !!periodicidad ? periodicidad.cod_periodicidad : null, 
                commodity_id:  !!commodity ? commodity.cod_commodity : null, 
                instruccion:  instrucciones,
                peso_objetivo: peso_objetivo,
                transportes: []
            }
            if(check_maritimo){
                postData["transportes"].push({
                    tipo_transporte_id: 50,
                    paises: (paises_maritimo || []).map(pais => pais.cod_pais),
                    tipo_carga: (tipo_carga_maritimo || []).map(tipo => tipo.cod_tipo),
                    clasificacion: (clasificacion_carga_maritimo || []).map(tipo => tipo.cod_tipo),
                })
            }
            if(check_aereo){
                postData["transportes"].push({
                    tipo_transporte_id: 49,
                    paises: (paises_aereo || []).map(pais => pais.cod_pais),
                    tipo_carga: (tipo_carga_aereo || []).map(tipo => tipo.cod_tipo),
                    clasificacion: (clasificacion_carga_aereo || []).map(tipo => tipo.cod_tipo),
                })
            }
            if(check_terrestre){
                postData["transportes"].push({
                    tipo_transporte_id: 51,
                    paises: (paises_terrestre || []).map(pais => pais.cod_pais),
                    tipo_carga: (tipo_carga_terrestre || []).map(tipo => tipo.cod_tipo),
                    clasificacion: (clasificacion_carga_terrestre || []).map(tipo => tipo.cod_tipo),
                })
            }
            console.log(postData)

            await api
                .post("api/appweb/carga-entidad-preferencias", {
                    ...postData,
                    estado_id: 1,
                })
                .then(({ data }) => {
                    if (!data.data.success) {
                        console.error(data.data.mensaje);
                    }
                })
                .catch((e) => console.error(e));
        }  
    };


  const evalFechaLimite = (configuracion, evalFecha) => {
    if (ignorarLimite) return true;

    const fechaHoy = new Date();
    const fechaLimite_ = new Date();
    fechaLimite_.setDate(fechaHoy.getDate() - configuracion.dias_creacion);
    if (evalFecha) {
      const fecha = new Date(evalFecha);
      fechaLimite_.setDate(fechaLimite_.getDate() - 1);
      return fecha >= fechaLimite_;
    }
    setFechaLimite(fechaLimite_);
    return false;
  };

  return (
    <Grid sx={{p: 0, m: 0 }}>
      <Grid>
        <FormularioComponent
          data={{ inputs, grupos }}
          onInput={({ id, val }) => setData((inp) => ({ ...inp, [id]: val }))}
          botones={{
            agregar: { visible: false, onClick: handleSubmitPost, readonly: false },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: false, onClick: null },
            filtrar: { visible: false, onClick: null },
            actualizar: { visible: true, onClick: handleSubmitPost, texto: "Actualizar Preferencias" },
          }}
        />
      </Grid>

      <ActionAlertComponent
        aceptar={() => {
          setErrorInputs(false);
        }}
        activarCanecelar={false}
        openDialog={errorInputs}
        tipo="error"
        handleClose={() => {}}
        content={
          <Box>
            Faltan los siguientes parametros para poder crear un resultado:
            {listaError.map((value) => (
              <Typography>- {value}</Typography>
            ))}
          </Box>
        }
      />
    </Grid>
  );
};

FormularioPreferencias.propTypes = {
  catalogos: PropTypes.object,
};
