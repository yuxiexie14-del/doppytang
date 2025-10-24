import { message } from 'antd';
import { getStoredToken } from './auth';
import type { ListResult } from '../types';
import { mockRequest } from '../mock/client';

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
  skipErrorMessage?: boolean;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8080';
const USE_MOCK = (import.meta.env.VITE_USE_MOCK as string | undefined) === 'true';

const buildUrl = (url: string, params?: Record<string, unknown>): string => {
  const target = new URL(url, API_BASE_URL);
  if (params) {
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .forEach(([key, value]) => {
        target.searchParams.set(key, String(value));
      });
  }
  return target.toString();
};

const withHeaders = (config: RequestConfig): HeadersInit => {
  const headers = new Headers(config.headers);
  headers.set('Accept', 'application/json');
  if (config.data !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

const handleError = (error: unknown, skipErrorMessage?: boolean): never => {
  const defaultMessage = '请求失败，请稍后重试';
  const content = error instanceof Error ? error.message : defaultMessage;
  if (!skipErrorMessage) {
    message.error(content || defaultMessage);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};

async function realRequest<T>(config: RequestConfig): Promise<T> {
  const headers = withHeaders(config);
  const method = (config.method ?? 'GET').toUpperCase();
  let body: BodyInit | undefined;
  if (config.data !== undefined) {
    body = headers.get('Content-Type') === 'application/json' ? JSON.stringify(config.data) : (config.data as BodyInit);
  }

  try {
    const response = await fetch(buildUrl(config.url, config.params), {
      ...config,
      method,
      body,
      headers
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const payload = await response.json();
        detail = (payload && (payload.message || payload.detail)) ?? detail;
      } catch (error) {
        // ignore json parse error
      }
      throw new Error(detail || `请求失败（${response.status}）`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return undefined as T;
  } catch (error) {
    handleError(error, config.skipErrorMessage);
  }
}

export async function request<T>(config: RequestConfig): Promise<T> {
  if (USE_MOCK) {
    try {
      return await mockRequest<T>(config);
    } catch (error) {
      return handleError(error, config.skipErrorMessage);
    }
  }
  return realRequest<T>(config);
}

export const normalizeListResponse = <T,>(payload: unknown): ListResult<T> => {
  if (Array.isArray(payload)) {
    return { items: payload as T[], total: (payload as T[]).length };
  }
  if (payload && typeof payload === 'object') {
    const data = (payload as Record<string, unknown>).data as T[] | undefined;
    const total = (payload as Record<string, unknown>).total as number | undefined;
    if (Array.isArray(data)) {
      return { items: data, total: typeof total === 'number' ? total : data.length };
    }
  }
  return { items: [], total: 0 };
};
