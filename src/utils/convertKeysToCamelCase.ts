export default function convertKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [k, v]) => {
      const newKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      acc[newKey] = convertKeysToCamelCase(v);
      return acc;
    }, {} as any);
  }
  return obj;
}
