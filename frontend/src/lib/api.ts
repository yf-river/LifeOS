/**
 * API 客户端 - 用于与后端通信
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  isVersionConflict: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.isVersionConflict = status === 409;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  // 从 localStorage 获取 token
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // 处理响应
  if (!response.ok) {
    let message = '请求失败';
    try {
      const errorData = await response.json();
      message = errorData.message || errorData.detail || message;
    } catch {
      // 忽略 JSON 解析错误
    }
    throw new ApiError(message, response.status);
  }

  // 处理空响应
  if (response.status === 204) {
    return {} as T;
  }

  // 解析 JSON 响应
  const data = await response.json();
  
  // 处理 Get笔记 API 响应格式：{ h: { c: 0 }, c: {...} }
  if (data && typeof data === 'object' && 'h' in data && 'c' in data) {
    if (data.h.c !== 0) {
      throw new ApiError(data.h.e || '请求失败', data.h.c);
    }
    return data.c as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, unknown>): Promise<T> => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return request<T>(url);
  },

  post: <T>(endpoint: string, body?: unknown): Promise<T> => {
    return request<T>(endpoint, { method: 'POST', body });
  },

  put: <T>(endpoint: string, body?: unknown): Promise<T> => {
    return request<T>(endpoint, { method: 'PUT', body });
  },

  patch: <T>(endpoint: string, body?: unknown): Promise<T> => {
    return request<T>(endpoint, { method: 'PATCH', body });
  },

  delete: <T = void>(endpoint: string): Promise<T> => {
    return request<T>(endpoint, { method: 'DELETE' });
  },

};
