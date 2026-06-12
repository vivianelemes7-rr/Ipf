export const MODO_API = (import.meta.env.VITE_API_MODE || 'mock').toLowerCase();

export const URL_BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const TEMPO_LIMITE_API_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);

export const DEVE_USAR_MOCKS = MODO_API !== 'api';
