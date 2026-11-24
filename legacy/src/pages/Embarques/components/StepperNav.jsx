import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Icon, Tooltip, Badge, useTheme, alpha } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WatchLaterOutlinedIcon from "@mui/icons-material/WatchLaterOutlined";

const DEFAULT_ICONS = {
  Shipper: "c-usuario",
  Consignatario: "c-usuario",
  Notificaciones: "c-campana",
  Producto: "c-bienes",
  Facturacion: "c-documento",
  Detalles: "c-informacion",
  Gastos: "c-bolsa-dinero",
  Documentos: "c-pdf",
  Rutas: "c-entregar",
  Fechas: "c-calendario",
  Seguimiento: "c-derecha-doble",
};

function resolveColors(theme, { isActive, isComplete, isWarning, isPending, isIncomplete, isOptional, isPreCliente }) {
  const success = theme.palette.success.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;
  const primary = theme.palette.primary.main;
  const textSecondary = theme.palette.text.secondary;
  const needsWarning = isWarning || isPending || isIncomplete;

  if (isOptional) {
    if (isActive) return { bg: alpha(theme.palette.grey[200], 0.6), fg: theme.palette.grey[600], borderColor: "transparent" };
    return { bg: "transparent", fg: theme.palette.grey[600], borderColor: "transparent" };
  }

  if (isActive) {
    if (isComplete) return { bg: alpha(success, 0.1), fg: success, borderColor: success };
    if (isPreCliente) return { bg: alpha(error, 0.1), fg: error, borderColor: error };
    if (needsWarning) return { bg: alpha(warning, 0.1), fg: warning, borderColor: warning };
    return { bg: alpha(primary, 0.1), fg: primary, borderColor: primary };
  }

  if (isComplete) return { bg: alpha(success, 0.1), fg: success, borderColor: "transparent" };
  if (isPreCliente) return { bg: alpha(error, 0.1), fg: error, borderColor: "transparent" };
  if (needsWarning) return { bg: alpha(warning, 0.1), fg: warning, borderColor: "transparent" };
  return { bg: "transparent", fg: textSecondary, borderColor: "transparent" };
}

function buildTooltipText(step, pending, isIncomplete, isPending) {
  if (step.info) return step.info;
  if (pending > 0) {
    const plural = pending > 1 ? "s" : "";
    return `Faltan ${pending} campo${plural}`;
  }
  if (isPending) return "Datos completos pero no guardados";
  if (isIncomplete) return "Faltan campos obligatorios";
  return "";
}

function resolveFontWeight(isActive, isComplete, isIncomplete, isPending) {
  if (isActive) return 700;
  if (isComplete) return 600;
  if (isIncomplete) return 600;
  if (isPending) return 600;
  return 500;
}

function StatusIndicator({ isComplete, isWarning, isPending, isIncomplete, isPreCliente, theme }) {
  if (isComplete) {
    return (
      <CheckCircleRoundedIcon
        sx={{ fontSize: 16, color: theme.palette.success.main, ml: 0.5, flexShrink: 0 }}
      />
    );
  }
  if (isPending) {
    return (
      <WatchLaterOutlinedIcon
        sx={{ fontSize: 16, color: theme.palette.warning.main, ml: 0.5, flexShrink: 0 }}
      />
    );
  }
  if (isPreCliente) {
    return (
      <WarningAmberRoundedIcon
        sx={{ fontSize: 16, color: theme.palette.error.main, ml: 0.5, flexShrink: 0 }}
      />
    );
  }
  if (isWarning || isIncomplete) {
    return (
      <WarningAmberRoundedIcon
        sx={{ fontSize: 16, color: theme.palette.warning.main, ml: 0.5, flexShrink: 0 }}
      />
    );
  }
  return null;
}

StatusIndicator.propTypes = {
  isComplete: PropTypes.bool,
  isWarning: PropTypes.bool,
  isPending: PropTypes.bool,
  isIncomplete: PropTypes.bool,
  isPreCliente: PropTypes.bool,
  theme: PropTypes.object.isRequired,
};

/* ── individual step item ── */

function StepItem({ step, index, isActive, stepValidity, pendingCount, onStepClick, theme }) {
  const validity = stepValidity[index];
  const isComplete = validity === true || validity === "valid";
  const isWarning = validity === "warning";
  const isPending = validity === "pending";
  const isPreCliente = validity === "pre-cliente";
  // Si no hay dato explícito (undefined/null), asumir que está incompleto.
  const isIncomplete = !isComplete && !isWarning && !isPending && !isPreCliente;
  const isOptional = Boolean(
    step.optional ||
    ["seguimiento", "cca", "rutas"].includes(String(step.label).toLowerCase()),
  ); // eslint-disable-line react/prop-types
  const pending = pendingCount;
  const { bg, fg, borderColor } = resolveColors(theme, { isActive, isComplete, isWarning, isPending, isIncomplete, isOptional, isPreCliente });
  const tooltipText = buildTooltipText(step, pending, isIncomplete, isPending);

  const content = (
    <Box
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onStepClick?.(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStepClick?.(index);
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: { xs: 1.25, sm: 1.75 },
        py: 1,
        minWidth: "max-content",
        borderRadius: 2,
        cursor: "pointer",
        userSelect: "none",
        bgcolor: bg,
        border: "2px solid",
        borderColor,
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: isActive ? bg : alpha(theme.palette.primary.main, 0.05),
          transform: isActive ? "none" : "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Badge
        badgeContent={Math.max(pending, 0)}
        color="error"
        max={99}
        sx={{
          "& .MuiBadge-badge": {
            fontSize: "0.65rem",
            height: 16,
            minWidth: 16,
            p: "0 4px",
          },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isActive ? fg : alpha(fg, 0.12),
            color: theme.palette.text.primary,
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          <Icon className={step.icon || "c-informacion"} sx={{ fontSize: "1.1rem", color: theme.palette.text.primary }} />
        </Box>
      </Badge>

      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: resolveFontWeight(isActive, isComplete, isIncomplete, isPending),
            color: theme.palette.text.primary,
            fontSize: { xs: "0.72rem", sm: "0.78rem" },
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            letterSpacing: isActive ? "0.02em" : 0,
          }}
        >
          {step.label}
        </Typography>
        {pending > 0 && !isComplete && (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.62rem",
              color: theme.palette.error.main,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {pending} pendiente{pending > 1 ? "s" : ""}
          </Typography>
        )}
        {isPending && (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.62rem",
              color: theme.palette.text.primary,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            Sin guardar
          </Typography>
        )}
        {isIncomplete && pending === 0 && !isOptional && (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.62rem",
              color: theme.palette.text.primary,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            Faltan campos
          </Typography>
        )}
        {isPreCliente && (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.62rem",
              color: theme.palette.error.main,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              fontWeight: 600,
            }}
          >
            aún es Pre-Cliente
          </Typography>
        )}
      </Box>

      {!isOptional && <StatusIndicator isComplete={isComplete} isWarning={isWarning} isPending={isPending} isIncomplete={isIncomplete} isPreCliente={isPreCliente} theme={theme} />}
    </Box>
  );

  if (tooltipText) {
    return (
      <Tooltip
        title={tooltipText}
        arrow
        placement="bottom"
        slotProps={{ tooltip: { sx: { fontSize: "0.8rem", p: "6px 10px" } } }}
      >
        {content}
      </Tooltip>
    );
  }

  return content;
}

StepItem.propTypes = {
  step: PropTypes.shape({
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    info: PropTypes.string,
    optional: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  stepValidity: PropTypes.object.isRequired,
  pendingCount: PropTypes.number.isRequired,
  onStepClick: PropTypes.func,
  theme: PropTypes.object.isRequired,
};

/* ── main component ── */

const StepperNav = ({
  steps = [],
  activeStep = 0,
  stepValidity = {},
  onStepClick,
  pendingCounts = {},
}) => {
  const theme = useTheme();

  const normalised = steps.map((s) =>
    typeof s === "string" ? { label: s, icon: DEFAULT_ICONS[s] || "c-informacion" } : s,
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
        pb: 0.5,
        px: 0.5,
        maxWidth: "100%",
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "grey.300", borderRadius: 2 },
      }}
    >
      {normalised.map((step, index) => (
        <StepItem
          key={step.label}
          step={step}
          index={index}
          isActive={index === activeStep}
          stepValidity={stepValidity}
          pendingCount={pendingCounts[index] ?? 0}
          onStepClick={onStepClick}
          theme={theme}
        />
      ))}
    </Box>
  );
};

StepperNav.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        icon: PropTypes.string,
        info: PropTypes.string,
      }),
    ]),
  ),
  activeStep: PropTypes.number,
  stepValidity: PropTypes.object,
  onStepClick: PropTypes.func,
  pendingCounts: PropTypes.object,
};

export default StepperNav;
