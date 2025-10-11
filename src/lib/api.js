// src/lib/api.js

/**
 * API path helper for subdirectory deployment
 * Otomatik olarak basePath ekler
 */
export const apiPath = (path) => {
  // Eğer tam URL ise (http/https ile başlıyorsa) olduğu gibi dön
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Base path'i environment'tan al
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  // Path zaten base path ile başlıyorsa tekrar ekleme
  if (basePath && path.startsWith(basePath)) {
    return path;
  }

  // Path / ile başlamıyorsa ekle
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Base path + normalized path
  return `${basePath}${normalizedPath}`;
};

/**
 * Full site URL helper
 */
export const siteUrl = (path = '') => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ardacaliskan.com/meva';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Asset URL helper (for images, etc.)
 */
export const assetUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};