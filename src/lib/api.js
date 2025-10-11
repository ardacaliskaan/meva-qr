// src/lib/api.js

export const apiPath = (path) => {
  // Base URL ve path birleştirme
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://ardacaliskan.com/meva';
  if (!path.startsWith('http')) {
    return `${base}${path}`;
  }
  return path;
};
