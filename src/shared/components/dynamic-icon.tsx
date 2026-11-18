/**
 * DynamicIcon - Wrapper component for dynamic icon rendering
 *
 * Avoids React.createElement calls in render and provides memoization
 * for icon components based on name prop.
 *
 * @example
 * <DynamicIcon name="settings" size={20} className="text-primary" />
 */
import { memo } from "react";
import { getIconForName } from "@/shared/lib/icons";
import { cn } from "@/shared/lib/utils";

interface DynamicIconProps {
  /** Icon name - maps to lucide-react icon via getIconForName */
  name: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Stroke width for the icon */
  strokeWidth?: number;
}

/**
 * Memoized dynamic icon component that renders icons by name.
 * Uses getIconForName to resolve the icon component and memoizes
 * to prevent unnecessary re-renders.
 */
export const DynamicIcon = memo<DynamicIconProps>(function DynamicIcon({
  name,
  size = 20,
  className,
  strokeWidth,
}) {
  const IconComponent = getIconForName(name);

  return (
    <IconComponent size={size} className={cn("shrink-0", className)} strokeWidth={strokeWidth} />
  );
});
