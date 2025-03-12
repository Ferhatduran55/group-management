export default function convertKeysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  } else if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [k, v]) => {
      const newKey = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
      acc[newKey] = convertKeysToSnakeCase(v);
      return acc;
    }, {} as any);
  }
  return obj;
}
