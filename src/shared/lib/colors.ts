/**
 * Clases semánticas de estado (éxito/error/advertencia/información).
 *
 * La paleta vive en `globals.css` (`@theme` + tokens `--brand-*`,
 * `--surface-*`): este módulo solo compone clases de Tailwind sobre esos
 * tokens, nunca valores de color literales. Ver docs/PLAN-REDISENO-UI.md.
 */

/**
 * Clases de utilidad Tailwind para estados
 */
export const STATUS_VARIANTS = {
  success: {
    bg: "bg-success",
    text: "text-success-foreground",
    border: "border-success",
    hover: "hover:bg-success/90",
  },
  error: {
    bg: "bg-destructive",
    text: "text-destructive-foreground",
    border: "border-destructive",
    hover: "hover:bg-destructive/90",
  },
  warning: {
    bg: "bg-warning",
    text: "text-warning-foreground",
    border: "border-warning",
    hover: "hover:bg-warning/90",
  },
  info: {
    bg: "bg-info",
    text: "text-info-foreground",
    border: "border-info",
    hover: "hover:bg-info/90",
  },
} as const;

/**
 * Clases para alertas/banners con fondo semitransparente y contraste correcto
 * Patrón: borde + fondo suave + texto foreground (siempre legible) + icono con color
 */
export const ALERT_VARIANTS = {
  success: {
    light: "border-success bg-success/10 text-foreground",
    dark: "dark:border-success/50 dark:bg-success/15",
    icon: "text-success",
  },
  error: {
    light: "border-destructive bg-destructive/10 text-foreground",
    dark: "dark:border-destructive/50 dark:bg-destructive/15",
    icon: "text-destructive",
  },
  warning: {
    light: "border-warning bg-warning/10 text-foreground",
    dark: "dark:border-warning/50 dark:bg-warning/15",
    icon: "text-warning",
  },
  info: {
    light: "border-info bg-info/10 text-foreground",
    dark: "dark:border-info/50 dark:bg-info/15",
    icon: "text-info",
  },
} as const;

/**
 * Helper para obtener clases completas de alerta (light + dark)
 */
export function getAlertClasses(severidad: keyof typeof ALERT_VARIANTS): string {
  const v = ALERT_VARIANTS[severidad];
  return `${v.light} ${v.dark}`;
}

/**
 * Helper para obtener clase de color del icono
 */
export function getAlertIconClass(severidad: keyof typeof ALERT_VARIANTS): string {
  return ALERT_VARIANTS[severidad].icon;
}
