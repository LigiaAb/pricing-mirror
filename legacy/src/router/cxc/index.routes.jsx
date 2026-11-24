import MenuBasePage from '@/pages/Cruds/MenuBasePage'
import AsignacionAgentes from '@/views/Cxc/GestionCuentas/AsignacionAgentes'
import Xagente from '@/views/Cxc/GestionCuentas/xagente'
import ClienteBi from '@/views/ReportesBi/ClienteBi'
import ListaNotas from '@/pages/cxc/gestion-documentos/notas/ListaNotas'
import React from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

const RutasCxc = () => {
    return (
        <Routes>
            <Route path="estadoscuenta" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />

                <Route path="Xagente" element={<Outlet />}>
                    <Route index element={<Xagente />} />
                </Route>

                <Route path="AsignacionAgentes" element={<Outlet />}>
                    <Route index element={<AsignacionAgentes />} />
                </Route>

            </Route>
            <Route path="gestion-documentos" element={<MenuBasePage />}>
                <Route index element={<Outlet />} />
                <Route path="notas" element={<ListaNotas />} />
            </Route>
            
        </Routes>
    )
}

export default RutasCxc