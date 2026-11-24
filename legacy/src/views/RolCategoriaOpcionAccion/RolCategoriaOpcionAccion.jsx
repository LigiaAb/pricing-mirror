import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";

/* ------------------------------- helpers -------------------------------- */
const safeData = (resp) => resp?.data?.data || [];

const n = (v) => (v == null || v === "" ? null : Number(v));

const makeKey = (m, c, o, a) => `${m}__${c}__${o}__${a}`;
const parseKey = (k) => {
  const [cod_menu, cod_categoria, cod_opcion, cod_accion] = k.split("__").map(Number);
  return { cod_menu, cod_categoria, cod_opcion, cod_accion };
};

const setEquals = (a, b) => {
  if (a.size !== b.size) return false;
  for (const k of a) if (!b.has(k)) return false;
  return true;
};

const setDiff = (a, b) => {
  const out = [];
  for (const k of a) if (!b.has(k)) out.push(k);
  return out;
};

// ✅ Resolver ids aunque el backend cambie nombres/case
const getMenuIds = (m) => ({
  cod_menu: n(m.cod_menu ?? m.COD_MENU ?? m.id_menu),
  cod_emp: n(m.cod_emp ?? m.cod_empresa ?? m.COD_EMP ?? m.COD_EMPRESA ?? m.emp_id),
  cod_cc: n(m.cod_cc ?? m.cod_centro_costo ?? m.COD_CC ?? m.cc_id ?? m.cod_empresa_cc),
  cod_modulo: n(m.cod_modulo ?? m.COD_MODULO ?? m.modulo_id),
});

const getCtxIds = (ctx) => ({
  cod_pais: n(ctx?.pais?.cod_pais),
  cod_emp: n(ctx?.empresa?.cod_empresa),
  cod_cc: n(ctx?.cc?.cod_cc),
  cod_modulo: n(ctx?.modulo?.cod_modulo),
});

/* ------------------------------ tiny ui --------------------------------- */
function Select({ label, value, options, valueKey, labelKey, disabled, onChange }) {
  const v = value ? String(value[valueKey]) : "";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      <select
        value={v}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          const obj = options.find((o) => String(o[valueKey]) === val) || null;
          onChange(obj);
        }}
        style={{
          height: 36,
          borderRadius: 10,
          border: "1px solid #e6e6e6",
          padding: "0 10px",
          background: disabled ? "#f6f6f6" : "#fff",
        }}
      >
        <option value="">Seleccione…</option>
        {options.map((o) => (
          <option key={String(o[valueKey])} value={String(o[valueKey])}>
            {String(o[labelKey] ?? "")}
          </option>
        ))}
      </select>
    </label>
  );
}

function Panel({ title, right, children }) {
  return (
    <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ marginLeft: "auto" }}>{right}</div>
      </div>
      <div style={{ maxHeight: 520, overflow: "auto" }}>{children}</div>
    </section>
  );
}

function List({ children }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>;
}

function Row({ active, onClick, text, subtext, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        border: "1px solid #eee",
        background: active ? "#f3f6ff" : "#fff",
        borderRadius: 10,
        padding: "10px 10px",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 8,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 650, lineHeight: 1.2 }}>{text}</div>
        {subtext ? <div style={{ fontSize: 12, opacity: 0.7 }}>{subtext}</div> : null}
      </div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{badge}</div>
    </button>
  );
}

function Empty({ children }) {
  return <div style={{ padding: 12, opacity: 0.75 }}>{children}</div>;
}

/* ------------------------------ component ------------------------------- */
export default function RolPermisosReactOnly({ rol }) {
  const codRol = rol?.cod_rol;

  // contexto obligatorio
  const [ctx, setCtx] = useState({ pais: null, empresa: null, cc: null, modulo: null });

  // catálogos
  const [paises, setPaises] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [ccxModulo, setCcxModulo] = useState([]);

  // UI/Permisos
  const [menus, setMenus] = useState([]);
  const [categoriaMenu, setCategoriaMenu] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [opciones, setOpciones] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [opcionAccion, setOpcionAccion] = useState([]);

  // asignaciones rol
  const [rolRows, setRolRows] = useState([]);

  // selección
  const [menuId, setMenuId] = useState(null);
  const [catId, setCatId] = useState(null);
  const [opcId, setOpcId] = useState(null);

  // set editable (solo del contexto)
  const [assignedKeys, setAssignedKeys] = useState(() => new Set());
  const initialKeysRef = useRef(new Set());

  // ui
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ------------------------------ contexto lists -------------------------- */
  const empresasFiltradas = useMemo(() => {
    if (!ctx.pais) return [];
    return empresas.filter((e) => n(e.pais_emp) === n(ctx.pais.cod_pais));
  }, [empresas, ctx.pais]);

  const ccFiltrados = useMemo(() => {
    if (!ctx.empresa) return [];
    return centrosCosto.filter((cc) => n(cc.cod_empresa_cc) === n(ctx.empresa.cod_empresa));
  }, [centrosCosto, ctx.empresa]);

  const modulosFiltrados = useMemo(() => {
    if (!ctx.cc) return [];
    const mods = new Set(ccxModulo.filter((x) => n(x.cod_cc) === n(ctx.cc.cod_cc)).map((x) => n(x.cod_modulo)));
    return modulos.filter((m) => mods.has(n(m.cod_modulo)));
  }, [ccxModulo, ctx.cc, modulos]);

  const ctxCompleto = !!(ctx.pais && ctx.empresa && ctx.cc && ctx.modulo);

  /* -------------------------- ✅ FILTRO REAL (menús) ---------------------- */
  const menusCtx = useMemo(() => {
    if (!ctxCompleto) return [];

    const { cod_emp, cod_cc, cod_modulo } = getCtxIds(ctx);

    return menus.filter((m) => {
      const ids = getMenuIds(m);
      // 🔥 filtro duro: si falta algún id, no entra
      if (ids.cod_emp == null || ids.cod_cc == null || ids.cod_modulo == null) return false;
      return ids.cod_emp === cod_emp && ids.cod_cc === cod_cc && ids.cod_modulo === cod_modulo;
    });
  }, [menus, ctxCompleto, ctx]);

  const menuIdsCtx = useMemo(() => new Set(menusCtx.map((m) => getMenuIds(m).cod_menu).filter((x) => x != null)), [menusCtx]);

  /* ------------------------ ✅ VALIDACIÓN anti-fantasmas ------------------ */
  const catIdsPorMenu = useMemo(() => {
    const map = new Map(); // cod_menu -> Set(cod_categoria)
    for (const cm of categoriaMenu) {
      const m = n(cm.cod_menu);
      const c = n(cm.cod_categoria);
      if (m == null || c == null) continue;
      if (!map.has(m)) map.set(m, new Set());
      map.get(m).add(c);
    }
    return map;
  }, [categoriaMenu]);

  const opcIdsPorCategoria = useMemo(() => {
    const map = new Map(); // cod_categoria -> Set(cod_opcion)
    for (const o of opciones) {
      const c = n(o.cod_categoria);
      const op = n(o.cod_opcion);
      if (c == null || op == null) continue;
      if (!map.has(c)) map.set(c, new Set());
      map.get(c).add(op);
    }
    return map;
  }, [opciones]);

  const accIdsPorCatOpc = useMemo(() => {
    const map = new Map(); // "cat__opc" -> Set(cod_accion)
    for (const oa of opcionAccion) {
      const c = n(oa.cod_categoria);
      const o = n(oa.cod_opcion);
      const a = n(oa.cod_accion);
      if (c == null || o == null || a == null) continue;
      const k = `${c}__${o}`;
      if (!map.has(k)) map.set(k, new Set());
      map.get(k).add(a);
    }
    return map;
  }, [opcionAccion]);

  const esFilaValida = useCallback(
    (r) => {
      const m = n(r.cod_menu);
      const c = n(r.cod_categoria);
      const o = n(r.cod_opcion);
      const a = n(r.cod_accion);

      if (m == null || c == null || o == null || a == null) return false;

      // 1) menú dentro del contexto
      if (!menuIdsCtx.has(m)) return false;

      // 2) categoría pertenece al menú
      if (!catIdsPorMenu.get(m)?.has(c)) return false;

      // 3) opción pertenece a la categoría
      if (!opcIdsPorCategoria.get(c)?.has(o)) return false;

      // 4) acción pertenece a (cat, opc)
      if (!accIdsPorCatOpc.get(`${c}__${o}`)?.has(a)) return false;

      return true;
    },
    [menuIdsCtx, catIdsPorMenu, opcIdsPorCategoria, accIdsPorCatOpc],
  );

  /* ------------------------------ derived ------------------------------- */
  const dirty = useMemo(() => !setEquals(assignedKeys, initialKeysRef.current), [assignedKeys]);

  const categoriasDelMenu = useMemo(() => {
    if (!menuId) return [];
    const m = n(menuId);
    const catIds = catIdsPorMenu.get(m) || new Set();
    return categorias.filter((c) => catIds.has(n(c.cod_categoria)));
  }, [menuId, categorias, catIdsPorMenu]);

  const opcionesDeCategoria = useMemo(() => {
    if (!catId) return [];
    const c = n(catId);
    const opcIds = opcIdsPorCategoria.get(c) || new Set();
    return opciones.filter((o) => opcIds.has(n(o.cod_opcion)));
  }, [catId, opciones, opcIdsPorCategoria]);

  const accionesDeOpcion = useMemo(() => {
    if (!opcId || !catId) return [];
    const c = n(catId);
    const o = n(opcId);
    const accIds = accIdsPorCatOpc.get(`${c}__${o}`) || new Set();
    return acciones.filter((a) => accIds.has(n(a.cod_accion)));
  }, [opcId, catId, accIdsPorCatOpc, acciones]);

  const isChecked = useCallback(
    (accId) => {
      if (!menuId || !catId || !opcId) return false;
      return assignedKeys.has(makeKey(n(menuId), n(catId), n(opcId), n(accId)));
    },
    [assignedKeys, menuId, catId, opcId],
  );

  const menuHas = useCallback(
    (id) => {
      const mid = n(id);
      for (const k of assignedKeys) if (n(k.split("__")[0]) === mid) return true;
      return false;
    },
    [assignedKeys],
  );

  const catHas = useCallback(
    (id) => {
      if (!menuId) return false;
      const mid = n(menuId);
      const cid = n(id);
      for (const k of assignedKeys) {
        const [m, c] = k.split("__").map(Number);
        if (m === mid && c === cid) return true;
      }
      return false;
    },
    [assignedKeys, menuId],
  );

  const opcHas = useCallback(
    (id) => {
      if (!menuId || !catId) return false;
      const mid = n(menuId);
      const cid = n(catId);
      const oid = n(id);
      for (const k of assignedKeys) {
        const [m, c, o] = k.split("__").map(Number);
        if (m === mid && c === cid && o === oid) return true;
      }
      return false;
    },
    [assignedKeys, menuId, catId],
  );

  /* ------------------------------ load data ------------------------------ */
  const loadCatalogs = useCallback(async () => {
    const [resPaises, resEmpresas, resCC, resMod, resCCxMod, resMenus, resCatMenu, resCats, resOpc, resAcc, resOpcAcc] = await Promise.all([
      api.get("api/appweb/listapaises"),
      api.get("api/appweb/listaempresas"),
      api.get("api/appweb/listacentrocosto"),
      api.get("api/appweb/listamodulo"),
      api.get("api/appweb/listaccxmodulo"),
      api.get("api/appweb/lista-menu"),
      api.get("api/appweb/lista-categoria-menu"),
      api.get("api/appweb/lista-categoria"),
      api.get("api/appweb/lista-opcion", { params: { cod_rol: codRol } }),
      api.get("api/appweb/lista-accion"),
      api.get("api/appweb/lista-opcion-accion"),
    ]);

    setPaises(safeData(resPaises));
    setEmpresas(safeData(resEmpresas));
    setCentrosCosto(safeData(resCC));
    setModulos(safeData(resMod));
    setCcxModulo(safeData(resCCxMod));

    setMenus(safeData(resMenus));
    setCategoriaMenu(safeData(resCatMenu));
    setCategorias(safeData(resCats));
    setOpciones(safeData(resOpc));
    setAcciones(safeData(resAcc));
    setOpcionAccion(safeData(resOpcAcc));
  }, [codRol]);

  const loadRolRows = useCallback(async () => {
    const res = await api.get("api/appweb/lista-rol-menu-cat-opc-acc", { params: { cod_rol: codRol } });
    setRolRows(safeData(res));
  }, [codRol]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadCatalogs(), loadRolRows()]);
      } catch (e) {
        setError("No se pudo cargar la información.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadCatalogs, loadRolRows]);

  /* ------------------ ✅ construir permisos SOLO del contexto -------------- */
  useEffect(() => {
    // 1) sin contexto: nada marcado
    if (!ctxCompleto) {
      initialKeysRef.current = new Set();
      setAssignedKeys(new Set());
      setMenuId(null);
      setCatId(null);
      setOpcId(null);
      return;
    }

    // 2) si el filtro de menús no devolvió nada: nada marcado (evita "todo marcado")
    if (!menusCtx.length || !menuIdsCtx.size) {
      initialKeysRef.current = new Set();
      setAssignedKeys(new Set());
      setMenuId(null);
      setCatId(null);
      setOpcId(null);
      return;
    }

    // 3) SOLO filas válidas en este contexto
    const keys = new Set(
      rolRows
        // ✅ NUEVO: primero filtra SOLO el rol actual
        .filter((r) => n(r.cod_rol ?? r.COD_ROL ?? r.id_rol) === n(codRol))

        // ✅ EXISTENTE, pero corregido con n()
        .filter((r) => n(r.cod_menu) && n(r.cod_categoria) && n(r.cod_opcion) && n(r.cod_accion))

        // ✅ EXISTENTE: valida que ese permiso pertenezca al contexto actual
        .filter(esFilaValida)

        .map((r) => makeKey(n(r.cod_menu), n(r.cod_categoria), n(r.cod_opcion), n(r.cod_accion))),
    );

    initialKeysRef.current = keys;
    setAssignedKeys(new Set(keys));

    const firstKey = keys.values().next().value;
    if (firstKey) {
      const { cod_menu, cod_categoria, cod_opcion } = parseKey(firstKey);
      setMenuId(cod_menu);
      setCatId(cod_categoria);
      setOpcId(cod_opcion);
    } else {
      const firstMenu = menusCtx[0];
      setMenuId(firstMenu ? getMenuIds(firstMenu).cod_menu : null);
      setCatId(null);
      setOpcId(null);
    }
  }, [ctxCompleto, rolRows, menusCtx, menuIdsCtx, esFilaValida, codRol]);

  /* ------------------------------ edit ---------------------------------- */
  const toggleAccion = (accId) => {
    if (!menuId || !catId || !opcId) return;
    const k = makeKey(n(menuId), n(catId), n(opcId), n(accId));
    setAssignedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const addAll = () => {
    if (!menuId || !catId || !opcId) return;
    const mid = n(menuId),
      cid = n(catId),
      oid = n(opcId);
    setAssignedKeys((prev) => {
      const next = new Set(prev);
      for (const a of accionesDeOpcion) next.add(makeKey(mid, cid, oid, n(a.cod_accion)));
      return next;
    });
  };

  const removeAll = () => {
    if (!menuId || !catId || !opcId) return;
    const mid = n(menuId),
      cid = n(catId),
      oid = n(opcId);
    setAssignedKeys((prev) => {
      const next = new Set(prev);
      for (const a of accionesDeOpcion) next.delete(makeKey(mid, cid, oid, n(a.cod_accion)));
      return next;
    });
  };

  const revert = () => setAssignedKeys(new Set(initialKeysRef.current));

  /* ------------------------------ save ---------------------------------- */
  const save = useCallback(async () => {
    const initial = initialKeysRef.current;
    const current = assignedKeys;

    const nuevos = setDiff(current, initial);
    const eliminados = setDiff(initial, current);

    if (!nuevos.length && !eliminados.length) return true;

    setSaving(true);
    setError("");

    try {
      await Promise.all(
        nuevos.map((k) => {
          const { cod_menu, cod_categoria, cod_opcion, cod_accion } = parseKey(k);
          return api.post("api/appweb/insertar-rol-menu-cat-opc-acc", {
            cod_rol: Number(codRol),
            cod_menu,
            cod_categoria,
            cod_opcion,
            cod_accion,
            cod_estado: 1,
          });
        }),
      );

      await Promise.all(
        eliminados.map((k) => {
          const { cod_menu, cod_categoria, cod_opcion, cod_accion } = parseKey(k);
          return api.post("api/appweb/eliminar-rol-menu-cat-opc-acc", {
            cod_rol: Number(codRol),
            cod_menu,
            cod_categoria,
            cod_opcion,
            cod_accion,
          });
        }),
      );

      await loadRolRows(); // recarga DB
      return true;
    } catch (e) {
      setError("Error guardando permisos.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [assignedKeys, codRol, loadRolRows]);

  /* --------------------------- change ctx guard -------------------------- */
  const setCtxSafe = async (nextCtx) => {
    if (dirty) {
      const wantSave = window.confirm("Tenés cambios sin guardar. ¿Guardar antes de cambiar el contexto?");
      if (wantSave) {
        const ok = await save();
        if (!ok) return;
      } else {
        const wantDiscard = window.confirm("¿Descartar cambios?");
        if (!wantDiscard) return;
        revert();
      }
    }
    setCtx(nextCtx);
  };

  /* ---------------------------------- UI --------------------------------- */
  if (!codRol) return <div style={{ padding: 16 }}>Seleccione un rol.</div>;
  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;
  if (error) return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Permisos por Empresa / Centro de costo / Módulo</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            {dirty ? "Cambios pendientes" : "Sin cambios"} {saving ? "(guardando…)" : ""}
          </span>
          <button onClick={revert} disabled={!dirty || saving}>
            Revertir
          </button>
          <button onClick={save} disabled={!dirty || saving}>
            Guardar
          </button>
        </div>
      </header>

      {/* CONTEXTO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
        <Select label="País" value={ctx.pais} options={paises} valueKey="cod_pais" labelKey="nombre_pais" onChange={(pais) => setCtxSafe({ pais, empresa: null, cc: null, modulo: null })} />
        <Select
          label="Empresa"
          value={ctx.empresa}
          options={empresasFiltradas}
          valueKey="cod_empresa"
          labelKey="nombre_emp"
          disabled={!ctx.pais}
          onChange={(empresa) => setCtxSafe({ ...ctx, empresa, cc: null, modulo: null })}
        />
        <Select
          label="Centro de costo"
          value={ctx.cc}
          options={ccFiltrados}
          valueKey="cod_cc"
          labelKey="nombre_cc"
          disabled={!ctx.empresa}
          onChange={(cc) => setCtxSafe({ ...ctx, cc, modulo: null })}
        />
        <Select label="Módulo" value={ctx.modulo} options={modulosFiltrados} valueKey="cod_modulo" labelKey="nom_modulo" disabled={!ctx.cc} onChange={(modulo) => setCtxSafe({ ...ctx, modulo })} />
      </div>

      {!ctxCompleto ? (
        <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 12, opacity: 0.8 }}>Seleccioná País, Empresa, Centro de costo y Módulo.</div>
      ) : menusCtx.length === 0 ? (
        <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 12, opacity: 0.8 }}>No hay menús para este contexto.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: 12 }}>
          {/* MENUS */}
          <Panel title="Menús" right={<span style={{ fontSize: 12, opacity: 0.7 }}>{menusCtx.length}</span>}>
            <List>
              {menusCtx.map((m) => {
                const ids = getMenuIds(m);
                return (
                  <Row
                    key={ids.cod_menu}
                    active={n(menuId) === ids.cod_menu}
                    onClick={() => {
                      setMenuId(ids.cod_menu);
                      setCatId(null);
                      setOpcId(null);
                    }}
                    badge={menuHas(ids.cod_menu) ? "✓" : ""}
                    text={m.nom_menu}
                    subtext={`[${m.nombre_emp}] • [${m.nombre_cc}] • [${m.nom_modulo}]`}
                  />
                );
              })}
            </List>
          </Panel>

          {/* CATEGORIAS */}
          <Panel title="Categorías">
            {!menuId ? (
              <Empty>Seleccioná un menú</Empty>
            ) : (
              <List>
                {categoriasDelMenu.map((c) => (
                  <Row
                    key={n(c.cod_categoria)}
                    active={n(catId) === n(c.cod_categoria)}
                    onClick={() => {
                      setCatId(n(c.cod_categoria));
                      setOpcId(null);
                    }}
                    badge={catHas(n(c.cod_categoria)) ? "✓" : ""}
                    text={c.nom_cat}
                    subtext={c.ruta_cat || ""}
                  />
                ))}
              </List>
            )}
          </Panel>

          {/* OPCIONES + ACCIONES */}
          <Panel
            title="Opciones y acciones"
            right={
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addAll} disabled={!opcId || accionesDeOpcion.length === 0}>
                  Agregar todas
                </button>
                <button onClick={removeAll} disabled={!opcId || accionesDeOpcion.length === 0}>
                  Quitar todas
                </button>
              </div>
            }
          >
            {!catId ? (
              <Empty>Seleccioná una categoría</Empty>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
                <div style={{ borderRight: "1px solid #eee", paddingRight: 12 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Opciones</div>
                  <List>
                    {opcionesDeCategoria.map((o) => (
                      <Row
                        key={n(o.cod_opcion)}
                        active={n(opcId) === n(o.cod_opcion)}
                        onClick={() => setOpcId(n(o.cod_opcion))}
                        badge={opcHas(n(o.cod_opcion)) ? "✓" : ""}
                        text={o.nom_opcion}
                        subtext={o.nivel_opcion != null ? `Nivel: ${o.nivel_opcion}` : ""}
                      />
                    ))}
                  </List>
                </div>

                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Acciones</div>
                  {!opcId ? (
                    <Empty>Seleccioná una opción</Empty>
                  ) : accionesDeOpcion.length === 0 ? (
                    <Empty>No hay acciones para esta opción.</Empty>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {accionesDeOpcion.map((a) => (
                        <label key={n(a.cod_accion)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type="checkbox" checked={isChecked(n(a.cod_accion))} onChange={() => toggleAccion(n(a.cod_accion))} />
                          <span>{a.nom_accion}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
