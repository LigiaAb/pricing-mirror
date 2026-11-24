const dateToIso = (dt) => {
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0];
};

const parseFromString = (s) => {
  const isoCandidate = String(s).split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoCandidate)) return isoCandidate;

  const ddmmMatch = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(String(s));
  if (ddmmMatch) return `${ddmmMatch[3]}-${ddmmMatch[2]}-${ddmmMatch[1]}`;

  return dateToIso(new Date(s));
};

const parseFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.toDate === "function") {
    const iso = dateToIso(obj.toDate());
    if (iso) return iso;
  }
  if (obj.$d instanceof Date) {
    const iso = dateToIso(obj.$d);
    if (iso) return iso;
  }
  return null;
};

export const toIsoDate = (d) => {
  if (!d) return null;

  if (typeof d === "string") return parseFromString(d) || String(d);
  if (d instanceof Date) return dateToIso(d) || String(d);

  const isoFromObj = parseFromObject(d);
  if (isoFromObj) return isoFromObj;

  return dateToIso(new Date(d)) || String(d);
};
