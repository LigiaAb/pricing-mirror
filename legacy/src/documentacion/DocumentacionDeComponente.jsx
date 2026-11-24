import PropTypes from "prop-types";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  Icon,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "../hooks/useForm";
// import lista from "./componentes/listaComponentes";
import renderItem from "./renderDocumentacion";
import { api } from "../api";
import DocumentacionIndiceLaterial from "./DocumentacionIndiceLaterial";
import { useSelector } from "react-redux";
import DocumentacionTest from "../pages/Test/DocumentacionTest";

const DocumentacionDeComponente = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = React.useState(false);
  
  const [lista, setLista] = useState({ det_docu_json: "[]" });
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const [documento, setDocumento] = React.useState(null);
  const [nuevoFormato, setNuevoFormato] = React.useState(false);

  const toggleDrawer = (open) => (event) => {
    setState(open);
  };

  const informacion = useMemo(() => {
    try {
      return JSON.parse(lista.det_docu_json);
    } catch(e){
      return JSON.parse("{}")
    }
  }, [lista]);

  useEffect(() => {
    api
      .get("/api/appweb/lista-det-tipo-documentacion", {
        params: { cod_det_tip_docu: tipo, cod_tip_docu: id },
      })
      .then(({ data }) => {
        if(!!data.data[0]){
          try {
            console.log(data.data[0])
            const doc_parse = JSON.parse(data.data[0].det_docu_json);
            setLista(data.data[0]);
            console.log("json")
          } catch(e){
            console.log("markdown")
            setNuevoFormato(true)
            setDocumento(data.data[0].det_docu_json)
          }
        }
      });
  }, []);

  return (
    <Box sx={{ p: 1, m: 0}} width="100%">
      <DocumentacionIndiceLaterial lista={informacion} />
      <Grid container direction="row" sx={{ my: 1, bgcolor: `primary.main_20`, p: 1, borderRadius: 2 }}>
        <Grid>
          <Typography variant="h6" sx={{ color: "text.main" }}>
            <IconButton
              sx={{
                "&:hover": { bgcolor: `primary.main_10`, cursor: "pointer" },
                borderColor: `primary.${opositeMode}`,
                borderWidth: 1,
                borderStyle: "solid",
                fontSize: 25,
                p: 0,
                mr: 1,
              }}
              onClick={() => navigate("/documentacion/" + id)}
            >
              <Icon fontSize="inherit" sx={{ color: `primary.${opositeMode}` }} className="c-izquierda" />
            </IconButton>
            {lista.det_desc_docu}
          </Typography>
        </Grid>
      </Grid >
        {
          nuevoFormato ?
          <DocumentacionTest guardar={() => {}} datos={documento} viewOnly={true}/>
          :
          <Box sx={{ m: 0, p: 0, px: 1, overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 170px)" }}>{renderItem(informacion)}</Box>
        }
      {/* <Grid container><pre>{JSON.stringify(informacion.contenido, null, 5)}</pre></Grid> */}
    </Box>
  );
};

export default DocumentacionDeComponente;
