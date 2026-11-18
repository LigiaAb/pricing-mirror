import React from "react";
import { getIconForName } from "@/shared/lib/icons";

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  className?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
};

/**
 * Componente de ícono del sistema
 * - Renderiza componentes Lucide en lugar de la fuente legacy
 * - Mantiene compatibilidad aceptando nombres legacy (prefijo `c-`)
 * @example
 * <Icon name="suma" size="lg" />
 * <Icon name="usuario" size={24} />
 */
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ name, size = "md", className = "", ...props }, ref) => {
    const sizeValue = typeof size === "number" ? size : sizeMap[size];

    const IconComp = getIconForName(name);

    return (
      <span
        ref={ref}
        className={className}
        style={{
          display: "inline-flex",
          width: `${sizeValue}px`,
          height: `${sizeValue}px`,
          alignItems: "center",
          justifyContent: "center",
          ...props.style,
        }}
        {...props}
      >
        {/* Renderizar componente Lucide */}
        <IconComp size={sizeValue} />
      </span>
    );
  },
);

Icon.displayName = "Icon";
