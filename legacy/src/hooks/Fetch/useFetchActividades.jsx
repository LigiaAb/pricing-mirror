import { Typography } from "@mui/material";
import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import { createAllPagedEntityDataHook, createDataHook, createObjectDataHook } from "./useFunctions";

// api/appweb/lista-commodities
export const useFetchConteoActividades = createObjectDataHook(["conteo-actividades"], "/api/appweb/conteo-actividades");
