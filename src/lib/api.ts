const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  private refreshingToken: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Decodifica JWT sem validação para ler a expiração
   */
  private decodeToken(token: string): { exp?: number } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o token já expirou
   */
  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    return expirationTime <= now;
  }

  /**
   * Verifica se o token expira em menos de 5 minutos
   */
  private isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return expirationTime - now < fiveMinutes;
  }

  private async refreshAccessToken(): Promise<boolean> {
    // Se já está fazendo refresh, aguardar o mesmo processo
    if (this.refreshingToken) {
      return this.refreshingToken;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    // Verificar se o refresh token ainda é válido (7 dias)
    if (this.isTokenExpired(refreshToken)) {
      // Refresh token expirado após 7 dias - sessão terminou
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return false;
    }

    // Criar promise de refresh
    this.refreshingToken = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const responseData = await response.json();
          // Handle transformed response (with data wrapper) or direct response
          const data = responseData.data || responseData;
          
          if (data.accessToken && data.refreshToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            this.refreshingToken = null; // Reset
            return true;
          }
        }
      } catch (error) {
        // Silent fail - will logout user
      } finally {
        this.refreshingToken = null; // Reset sempre
      }

      // If refresh fails, clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return false;
    })();

    return this.refreshingToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let token = this.getAuthToken();

    // Se o token já expirou (15min), fazer refresh obrigatório antes da requisição
    // Não fazer logout aqui - refresh token ainda pode ser válido (7 dias)
    // REMOVIDO: Refresh proativo antes de cada requisição - causava requisições excessivas
    // O AuthContext já faz verificação periódica a cada 10 minutos
    // O refresh reativo (401 handler) cobre casos urgentes
    if (token && this.isTokenExpired(token)) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        // Refresh falhou - verificar se refresh token expirou (7 dias)
        const refreshTokenValue = this.getRefreshToken();
        if (!refreshTokenValue || this.isTokenExpired(refreshTokenValue)) {
          // Refresh token expirado após 7 dias - sessão terminou, redirecionar para login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Session expired');
        }
        // Refresh falhou mas refresh token ainda válido - erro temporário
        // Continuar com token atual, o 401 handler vai tentar novamente
      } else {
        token = this.getAuthToken(); // Atualizar token após refresh
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Headers para bypass do warning do ngrok free
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - try refresh token
    if (response.status === 401 && token) {
      // Primeiro, ler a resposta para verificar se é um erro de negócio (ex: senha incorreta)
      // ou um erro de autenticação (token expirado)
      let errorData: any = null;
      try {
        const responseClone = response.clone();
        const contentType = responseClone.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await responseClone.json();
          
          // Se é um erro específico de negócio (senha incorreta, etc), não tentar refresh
          // Apenas retornar o erro diretamente
          if (errorData.message && (
            errorData.message.toLowerCase().includes('senha') || 
            errorData.message.toLowerCase().includes('password') ||
            errorData.message.toLowerCase().includes('incorreta') ||
            errorData.message.toLowerCase().includes('incorrect')
          )) {
            // É um erro de negócio, não de autenticação - retornar o erro original
            const error: ApiError = {
              message: errorData.message || errorData.error || response.statusText,
              statusCode: errorData.statusCode || response.status,
              error: errorData.error,
            };
            throw error;
          }
        }
      } catch (e: any) {
        // Se já é um ApiError (erro de negócio), relançar
        if (e.statusCode) {
          throw e;
        }
        // Se não conseguir ler, continuar com refresh (pode ser erro de autenticação)
      }

      // Se chegou aqui, pode ser erro de autenticação - tentar refresh
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry request with new token
        const newToken = this.getAuthToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
          });

          if (retryResponse.ok) {
            // Handle empty responses for retry
            if (retryResponse.status === 204) {
              return {} as T;
            }
            const text = await retryResponse.text();
            if (!text || text.trim() === '') {
              return {} as T;
            }
            const parsed = JSON.parse(text);
            // O TransformInterceptor retorna { data, statusCode, timestamp }
            return (parsed && typeof parsed === 'object' && 'data' in parsed) ? parsed.data : parsed;
          }

          // Se retry ainda retornou 401, tratar como erro de negócio
          if (retryResponse.status === 401) {
            try {
              const retryErrorData = await retryResponse.json();
              const error: ApiError = {
                message: retryErrorData.message || retryErrorData.error || retryResponse.statusText,
                statusCode: retryErrorData.statusCode || retryResponse.status,
                error: retryErrorData.error,
              };
              throw error;
            } catch (e: any) {
              if (e.statusCode) throw e;
              // Se não conseguir ler, tratar como erro de autenticação
            }
          }
        }
      }

      // Refresh failed ou retry failed - erro de autenticação
      // Verificar se refresh token expirou (7 dias) antes de redirecionar
      const refreshTokenValue = this.getRefreshToken();
      if (!refreshTokenValue || this.isTokenExpired(refreshTokenValue)) {
        // Refresh token expirado após 7 dias - sessão terminou
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      // Refresh falhou mas refresh token ainda válido - erro temporário
      throw new Error('Erro de autenticação. Tente novamente.');
    }

    if (!response.ok) {
      let error: ApiError;
      try {
        // Verificar se a resposta é HTML (provavelmente página de warning do ngrok)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const text = await response.text();
          if (import.meta.env.DEV) {
            console.error('Resposta HTML recebida (possível warning do ngrok):', text.substring(0, 500));
          }
          throw {
            message: 'Erro: O servidor retornou HTML em vez de JSON. Verifique se o ngrok está configurado corretamente.',
            statusCode: response.status,
          } as ApiError;
        }
        
        const errorData = await response.json();
        error = {
          message: errorData.message || errorData.error || response.statusText,
          statusCode: errorData.statusCode || response.status,
          error: errorData.error,
        };
      } catch (err: any) {
        // Se já é um ApiError, relançar
        if (err.statusCode) {
          throw err;
        }
        // If response is not JSON, create error from status
        error = {
          message: response.statusText || 'Erro na requisição',
          statusCode: response.status,
        };
      }
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content for DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    
    // Parse JSON response
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return {} as T;
      }
      
      // Verificar se a resposta é HTML (provavelmente warning do ngrok)
      if (contentType && contentType.includes('text/html')) {
        if (import.meta.env.DEV) {
          console.error('Resposta HTML recebida (possível warning do ngrok):', text.substring(0, 500));
        }
        throw {
          message: 'Erro: O servidor retornou HTML em vez de JSON. Verifique se o ngrok está configurado corretamente.',
          statusCode: response.status,
        } as ApiError;
      }
      
      // Se não é JSON e status é OK, retornar objeto vazio
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status >= 200 && response.status < 300) {
          return {} as T;
        }
      }
      
      const parsed = JSON.parse(text);
      // O TransformInterceptor retorna { data, statusCode, timestamp }
      // Extrair o data se existir
      return (parsed && typeof parsed === 'object' && 'data' in parsed) ? parsed.data : parsed;
    } catch (error: any) {
      // Se já é um ApiError, relançar
      if (error.statusCode) {
        throw error;
      }
      
      // If parsing fails but status is OK, return empty object
      if (response.status >= 200 && response.status < 300) {
        return {} as T;
      }
      throw {
        message: 'Resposta inválida do servidor (erro ao processar JSON)',
        statusCode: response.status,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Public POST request without authentication
  async publicPost<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const text = await response.text();
          if (import.meta.env.DEV) {
            console.error('Resposta HTML recebida (possível warning do ngrok):', text.substring(0, 500));
          }
          throw {
            message: 'Erro: O servidor retornou HTML em vez de JSON. Verifique se o ngrok está configurado corretamente.',
            statusCode: response.status,
          } as ApiError;
        }
        
        const errorData = await response.json();
        error = {
          message: errorData.message || errorData.error || response.statusText,
          statusCode: errorData.statusCode || response.status,
          error: errorData.error,
        };
      } catch (err: any) {
        if (err.statusCode) {
          throw err;
        }
        error = {
          message: response.statusText || 'Erro na requisição',
          statusCode: response.status,
        };
      }
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (import.meta.env.DEV) {
        console.error('Resposta não é JSON. Content-Type:', contentType);
        console.error('Primeiros 500 caracteres da resposta:', text.substring(0, 500));
      }
      throw {
        message: 'Resposta inválida do servidor (não é JSON). Verifique se o ngrok está configurado corretamente.',
        statusCode: response.status,
      } as ApiError;
    }

    try {
      const data = await response.json();
      // O TransformInterceptor retorna { data, statusCode, timestamp }
      // Extrair o data se existir
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao fazer parse do JSON:', error);
      }
      throw {
        message: 'Resposta inválida do servidor (erro ao processar JSON)',
        statusCode: response.status,
      } as ApiError;
    }
  }

  // Public request without authentication
  async publicGet<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Headers para bypass do warning do ngrok free
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        // Verificar se a resposta é HTML (provavelmente página de warning do ngrok)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const text = await response.text();
          if (import.meta.env.DEV) {
            console.error('Resposta HTML recebida (possível warning do ngrok):', text.substring(0, 500));
          }
          throw {
            message: 'Erro: O servidor retornou HTML em vez de JSON. Verifique se o ngrok está configurado corretamente.',
            statusCode: response.status,
          } as ApiError;
        }
        
        const errorData = await response.json();
        error = {
          message: errorData.message || errorData.error || response.statusText,
          statusCode: errorData.statusCode || response.status,
          error: errorData.error,
        };
      } catch (err: any) {
        // Se já é um ApiError, relançar
        if (err.statusCode) {
          throw err;
        }
        error = {
          message: response.statusText || 'Erro na requisição',
          statusCode: response.status,
        };
      }
      throw error;
    }

    // Verificar se a resposta é JSON antes de fazer parse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (import.meta.env.DEV) {
        console.error('Resposta não é JSON. Content-Type:', contentType);
        console.error('Primeiros 500 caracteres da resposta:', text.substring(0, 500));
      }
      throw {
        message: 'Resposta inválida do servidor (não é JSON). Verifique se o ngrok está configurado corretamente.',
        statusCode: response.status,
      } as ApiError;
    }

    try {
      const data = await response.json();
      // O TransformInterceptor retorna { data, statusCode, timestamp }
      // Extrair o data se existir
      return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erro ao fazer parse do JSON:', error);
      }
      throw {
        message: 'Resposta inválida do servidor (erro ao processar JSON)',
        statusCode: response.status,
      } as ApiError;
    }
  }

  // Webhooks methods
  async createWebhook<T>(data: any): Promise<T> {
    return this.post<T>('/webhooks', data);
  }

  async getWebhooks<T>(reelId: string, query?: any): Promise<T> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    return this.get<T>(`/webhooks/reel/${reelId}${queryString}`);
  }

  async getWebhook<T>(id: string): Promise<T> {
    return this.get<T>(`/webhooks/${id}`);
  }

  async updateWebhook<T>(id: string, data: any): Promise<T> {
    return this.patch<T>(`/webhooks/${id}`, data);
  }

  async deleteWebhook<T>(id: string): Promise<T> {
    return this.delete<T>(`/webhooks/${id}`);
  }

  async getWebhookLogs<T>(id: string, query?: any): Promise<T> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    return this.get<T>(`/webhooks/${id}/logs${queryString}`);
  }

  async testWebhook<T>(id: string): Promise<T> {
    return this.post<T>(`/webhooks/${id}/test`, {});
  }

  // User profile methods
  async getMyProfile<T>(): Promise<T> {
    return this.get<T>('/users/me');
  }

  async updateMyProfile<T>(data: { name?: string; avatar?: string }): Promise<T> {
    return this.put<T>('/users/me', data);
  }

  async changePassword<T>(currentPassword: string, newPassword: string): Promise<T> {
    return this.post<T>('/auth/change-password', { currentPassword, newPassword });
  }

  // Admin methods
  async getAdminStats<T>(): Promise<T> {
    return this.get<T>('/admin/stats');
  }

  async getAdminUsers<T>(query?: { page?: number; limit?: number; search?: string; role?: string }): Promise<T> {
    const queryString = query ? `?${new URLSearchParams(Object.entries(query).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}` : '';
    return this.get<T>(`/admin/users${queryString}`);
  }

  async getAdminUser<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/users/${id}`);
  }

  async updateAdminUser<T>(id: string, data: { name?: string; email?: string; role?: string; emailVerified?: boolean; planId?: string | null }): Promise<T> {
    return this.put<T>(`/admin/users/${id}`, data);
  }

  async changeAdminUserPassword<T>(id: string, newPassword: string): Promise<T> {
    return this.patch<T>(`/admin/users/${id}/password`, { newPassword });
  }

  async toggleAdminUserEmailVerification<T>(id: string): Promise<T> {
    return this.patch<T>(`/admin/users/${id}/verify-email`, {});
  }

  async deleteAdminUser<T>(id: string): Promise<T> {
    return this.delete<T>(`/admin/users/${id}`);
  }

  async getAdminUserReels<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/users/${id}/reels`);
  }

  async getAdminUserAnalytics<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/users/${id}/analytics`);
  }

  // Email Provider methods
  async getEmailProviders<T>(): Promise<T> {
    return this.get<T>('/admin/email-providers');
  }

  async getEmailProvider<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/email-providers/${id}`);
  }

  async createEmailProvider<T>(data: any): Promise<T> {
    return this.post<T>('/admin/email-providers', data);
  }

  async updateEmailProvider<T>(id: string, data: any): Promise<T> {
    return this.put<T>(`/admin/email-providers/${id}`, data);
  }

  async deleteEmailProvider<T>(id: string): Promise<T> {
    return this.delete<T>(`/admin/email-providers/${id}`);
  }

  async testEmailProvider<T>(id: string, toEmail?: string): Promise<T> {
    return this.post<T>(`/admin/email-providers/${id}/test`, { toEmail });
  }

  async toggleEmailProviderActive<T>(id: string): Promise<T> {
    return this.patch<T>(`/admin/email-providers/${id}/activate`, {});
  }

  // Settings methods
  async getSettings<T>(): Promise<T> {
    return this.get<T>('/admin/settings');
  }

  async updateSettings<T>(data: any): Promise<T> {
    return this.patch<T>('/admin/settings', data);
  }

  // Tracking methods
  async sendTrackingEvent<T>(data: any): Promise<T> {
    return this.post<T>('/tracking/event', data);
  }

  // Plans methods (public)
  async getPlans<T>(): Promise<T> {
    return this.publicGet<T>('/plans');
  }

  // Plans methods (admin)
  async getAdminPlans<T>(): Promise<T> {
    return this.get<T>('/plans/admin');
  }

  async checkWebhookLimit<T>(): Promise<T> {
    return this.get<T>('/plans/limits/webhooks');
  }

  async checkCustomDomainLimit<T>(): Promise<T> {
    return this.get<T>('/plans/limits/domains');
  }

  async getAdminPlan<T>(id: string): Promise<T> {
    return this.get<T>(`/plans/admin/${id}`);
  }

  async createPlan<T>(data: any): Promise<T> {
    return this.post<T>('/plans/admin', data);
  }

  async updatePlan<T>(id: string, data: any): Promise<T> {
    return this.put<T>(`/plans/admin/${id}`, data);
  }

  async deletePlan<T>(id: string): Promise<T> {
    return this.delete<T>(`/plans/admin/${id}`);
  }

  async togglePlanActive<T>(id: string): Promise<T> {
    return this.patch<T>(`/plans/admin/${id}/toggle-active`, {});
  }

  // Payments methods
  async createCheckout<T>(planId: string): Promise<T> {
    return this.get<T>(`/payments/checkout/${planId}`);
  }

  async processPayment<T>(planId: string, data: any): Promise<T> {
    return this.post<T>(`/payments/checkout/${planId}/process`, data);
  }

  async getMyPayments<T>(): Promise<T> {
    return this.get<T>('/payments/my-payments');
  }

  async checkPaymentStatus<T>(txid: string): Promise<T> {
    return this.post<T>(`/payments/check-payment/${txid}`, {});
  }

  // Gateway methods (admin)
  async getGateways<T>(): Promise<T> {
    return this.get<T>('/admin/gateways');
  }

  async getGateway<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/gateways/${id}`);
  }

  async createGateway<T>(data: any): Promise<T> {
    return this.post<T>('/admin/gateways', data);
  }

  async updateGateway<T>(id: string, data: any): Promise<T> {
    return this.put<T>(`/admin/gateways/${id}`, data);
  }

  async testGateway<T>(id: string): Promise<T> {
    return this.get<T>(`/admin/gateways/${id}/test`);
  }

  // Custom Domains methods
  async getCustomDomains<T>(reelId: string): Promise<T> {
    return this.get<T>(`/reels/${reelId}/domains`);
  }

  async addCustomDomain<T>(reelId: string, domain: string): Promise<T> {
    return this.post<T>(`/reels/${reelId}/domains`, { domain });
  }

  async verifyCustomDomain<T>(reelId: string, domainId: string): Promise<T> {
    return this.post<T>(`/reels/${reelId}/domains/${domainId}/verify`, {});
  }

  async removeCustomDomain<T>(reelId: string, domainId: string): Promise<T> {
    return this.delete<T>(`/reels/${reelId}/domains/${domainId}`);
  }

  // Auth methods
  async register<T>(data: any): Promise<T> {
    return this.publicPost<T>('/auth/register', data);
  }

  async resendVerificationEmail<T>(): Promise<T> {
    return this.post<T>('/auth/resend-verification', {});
  }

  initiateGoogleAuth(): void {
    // Redirecionar para o endpoint OAuth do backend
    window.location.href = `${this.baseURL}/auth/google`;
  }
}

export const api = new ApiClient(API_URL);

