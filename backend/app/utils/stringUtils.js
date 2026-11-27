module.exports.toLowerKeys = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k.toLowerCase(),
            transform(v)
        ])
    );

module.exports.toUpperKeys = (obj) =>
    Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
            k.toUpperCase(),
            transform(v, true)
        ])
    );

const transform = (v, upper = false) => {
    if (Array.isArray(v)) return v.map(item => transform(item, upper));
    if (v && typeof v === "object") return upper ? this.toUpperKeys(v) : this.toLowerKeys(v);
    return v;
};