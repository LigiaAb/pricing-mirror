import { useState, useCallback } from "react";
import { Box, TextField, IconButton, Icon, Button } from "@mui/material";
import PropTypes from "prop-types";

const ListaGuiasComponent = ({ listaGuias = [], onAddGuia, onEliminarGuia, onLimpiarGuias, onNumeroGuiaChange, maxGuias }) => {
  const [nuevoNumeroGuia, setNuevoNumeroGuia] = useState("");
  const maxReached = typeof maxGuias === "number" && listaGuias.length >= maxGuias;
  const maxGuiasPlural = maxGuias === 1 ? "" : "s";
  const helperText = maxReached
    ? `Se alcanzó el máximo de ${maxGuias} guía${maxGuiasPlural}`
    : "Presione Enter o haga clic en + para agregar";

  const handleAgregar = useCallback(() => {
    if (maxReached) return;
    const numeroLimpio = String(nuevoNumeroGuia ?? "").trim();
    if (!numeroLimpio) return;
    onAddGuia?.(numeroLimpio);
    setNuevoNumeroGuia("");
    if (typeof onNumeroGuiaChange === 'function') onNumeroGuiaChange("");
  }, [maxReached, nuevoNumeroGuia, onAddGuia, onNumeroGuiaChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAgregar();
    }
  }, [handleAgregar]);

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      <TextField
        fullWidth
        size="small"
        label="Número de Guía"
        value={nuevoNumeroGuia}
        onChange={(e) => {
          const v = e.target.value;
          setNuevoNumeroGuia(v);
          if (typeof onNumeroGuiaChange === 'function') onNumeroGuiaChange(v);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Ej: 12345678"
        helperText={helperText}
        slotProps={{ input: { sx: { bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } } } }}
        sx={{ flexGrow: 1 }}
        disabled={maxReached}
      />
      <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
        <IconButton
          color="primary"
          onClick={handleAgregar}
          disabled={maxReached}
          sx={{
            height: 40,
            width: 40,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
            transition: 'all 0.2s ease-in-out',
            boxShadow: 1,
          }}
        >
          <Icon className="c-suma" />
        </IconButton>
        <Button size="small" variant="outlined" color="error" startIcon={<Icon className="c-eliminar" />} onClick={onLimpiarGuias} disabled={!listaGuias.length} sx={{ minWidth: 100, height: 40, textTransform: 'none' }}>
          Limpiar
        </Button>
      </Box>
    </Box>
  );
};

ListaGuiasComponent.propTypes = {
  listaGuias: PropTypes.arrayOf(PropTypes.shape({ no_guia: PropTypes.string })).isRequired,
  onAddGuia: PropTypes.func.isRequired,
  onEliminarGuia: PropTypes.func.isRequired,
  onLimpiarGuias: PropTypes.func.isRequired,
  onNumeroGuiaChange: PropTypes.func,
  maxGuias: PropTypes.number,
};

export default ListaGuiasComponent;
