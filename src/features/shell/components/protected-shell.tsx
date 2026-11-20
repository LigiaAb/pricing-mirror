"use client";
import { useEffect, useState } from "react";
import { useVersionCheck, VersionNotificationModal } from "@/features/notificaciones";
import { PermissionsLoader } from "@/features/permisos";
import { SidebarInset, SidebarProvider } from "@/shared/components/ui/sidebar";
import { env } from "@/shared/config/env";
import { formatBuildLabel } from "@/shared/lib/format-build-label";
import { cn } from "@/shared/lib/utils";
import { useUIStore } from "../stores/ui-store";
import { AppHeader } from "./header";
import { AppSidebar } from "./sidebar";

interface ProtectedShellProps {
  readonly children: React.ReactNode;
}

export function ProtectedShell({ children }: ProtectedShellProps) {
  useUIStore();
  const { show, dismiss, notification } = useVersionCheck();
  const buildId = env.NEXT_PUBLIC_APP_BUILD_ID;
  const [buildLabel, setBuildLabel] = useState<string | null>(null);

  useEffect(() => {
    setBuildLabel(formatBuildLabel(buildId));
  }, []);

  return (
    <SidebarProvider>
      {/* El skip-link global (src/app/layout.tsx) apunta a #main-content. */}
      <PermissionsLoader />
      <AppHeader />
      <AppSidebar />
      {/* SidebarInset renderiza <main>: landmark principal del layout */}
      <SidebarInset id="main-content">
        <div className="flex-1 overflow-x-clip bg-background">
          <div className={cn("mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 lg:py-8 lg:pr-8 lg:pl-10")}>
            {children}
          </div>
        </div>
        <div className="fixed bottom-1 right-2 z-50 text-xs text-muted-foreground select-none pointer-events-none">
          <span title={buildId}>{buildLabel ?? buildId}</span>
        </div>
      </SidebarInset>
      <VersionNotificationModal open={show} onDismiss={dismiss} notification={notification} />
    </SidebarProvider>
  );
}
