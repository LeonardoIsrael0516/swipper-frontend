import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'REELS';
  avatar?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decodifica JWT sem validação para ler a expiração
  const decodeToken = useCallback((token: string): { exp?: number } | null => {
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
  }, []);

  // Verifica se o token já expirou
  const isTokenExpired = useCallback((token: string | null): boolean => {
    if (!token) return true;

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    return expirationTime <= now;
  }, [decodeToken]);

  const logout = useCallback(() => {
    // Clear tokens and user
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Refresh token helper (definido antes do loadUser para poder ser usado)
  const refreshTokenInternal = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      return false;
    }

    try {
      const response = await api.post<{
        data?: {
          accessToken: string;
          refreshToken: string;
        };
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/refresh', { refreshToken: refreshTokenValue });

      // Handle transformed response (with data wrapper) or direct response
      const data = (response as any).data || response;

      if (!data.accessToken || !data.refreshToken) {
        return false;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Function to refresh user data (definido antes do loadUser para poder ser usado)
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getMyProfile<any>();
      const userData = (response as any).data || response;
      
      if (userData) {
        // Sempre atualizar estado e localStorage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Debug em desenvolvimento
        if (import.meta.env.DEV) {
          console.log('User refreshed:', { 
            id: userData.id, 
            emailVerified: userData.emailVerified 
          });
        }
      }
    } catch (error) {
      // Silently fail - user data will be refreshed on next login/refresh
      if (import.meta.env.DEV) {
        console.error('Error refreshing user data:', error);
      }
    }
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const refreshTokenValue = localStorage.getItem('refreshToken');
        const accessToken = localStorage.getItem('accessToken');

        // Se não houver refresh token, fazer logout
        if (!refreshTokenValue) {
          logout();
          setIsLoading(false);
          return;
        }

        // Verificar se o refresh token ainda é válido (7 dias)
        if (isTokenExpired(refreshTokenValue)) {
          // Refresh token expirado após 7 dias, fazer logout
          logout();
          setIsLoading(false);
          return;
        }

        // Refresh token válido (sessão ainda ativa por até 7 dias)
        // Verificar access token (expira em 15min)
        if (!accessToken || isTokenExpired(accessToken)) {
          // Access token expirado ou não existe, fazer refresh automático
          // NÃO fazer logout aqui - refresh token ainda é válido
          const refreshed = await refreshTokenInternal();
          if (!refreshed) {
            // Refresh falhou - pode ser erro temporário
            // Tentar carregar usuário mesmo assim (token pode estar válido ainda)
            // Se realmente falhar, a próxima verificação periódica vai tentar novamente
          }
        }

        // Se chegou aqui, refresh token é válido (sessão ativa por até 7 dias)
        // Carregar usuário dos dados salvos temporariamente
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser); // Carregar temporariamente para UI não ficar vazia
          } catch {
            // Invalid user data, clear it
            localStorage.removeItem('user');
          }
        }
        
        // SEMPRE buscar dados atualizados do servidor após carregar do localStorage
        // Isso garante que emailVerified e outros campos estejam atualizados
        try {
          await refreshUser();
        } catch (error) {
          // Se falhar, manter dados do localStorage (melhor que nada)
          if (import.meta.env.DEV) {
            console.warn('Failed to refresh user on load, using cached data');
          }
        }
      } catch (error) {
        // Invalid stored data, clear it
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUser, refreshTokenInternal, isTokenExpired, logout]); // Adicionar dependências necessárias

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      return false;
    }

    // Verificar se o refresh token ainda é válido antes de tentar fazer refresh
    if (isTokenExpired(refreshTokenValue)) {
      logout();
      return false;
    }

    try {
      const response = await api.post<{
        data?: {
          accessToken: string;
          refreshToken: string;
        };
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/refresh', { refreshToken: refreshTokenValue });

      // Handle transformed response (with data wrapper) or direct response
      const data = (response as any).data || response;

      if (!data.accessToken || !data.refreshToken) {
        logout();
        return false;
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [logout, isTokenExpired]);

  /**
   * Verifica se o token expira em menos de 5 minutos
   */
  const isTokenExpiringSoon = useCallback((token: string | null): boolean => {
    if (!token) return true;

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return expirationTime - now < fiveMinutes;
  }, [decodeToken]);

  // Verificação periódica do token (a cada 10 minutos)
  // Sessão dura 7 dias enquanto refresh token for válido
  // Aumentado de 5min para 10min para reduzir requisições
  useEffect(() => {
    if (!user) return; // Só verificar se estiver logado

    let isRefreshing = false; // Flag para evitar múltiplos refreshes simultâneos

    const checkAndRefreshToken = async () => {
      // Evitar múltiplos refreshes simultâneos
      if (isRefreshing) {
        return;
      }

      const refreshTokenValue = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      
      // Se não houver refresh token, fazer logout
      if (!refreshTokenValue) {
        logout();
        return;
      }

      // Verificar se o refresh token ainda é válido (7 dias)
      if (isTokenExpired(refreshTokenValue)) {
        // Refresh token expirado após 7 dias - fazer logout apenas aqui
        logout();
        return;
      }

      // Refresh token válido - sessão ainda ativa por até 7 dias
      // Access token expira em 15min mas isso não deve fazer logout
      
      // Verificar access token
      if (!accessToken || isTokenExpired(accessToken)) {
        // Access token expirado (15min) - fazer refresh automático
        // NÃO fazer logout - refresh token ainda é válido (7 dias)
        isRefreshing = true;
        const refreshed = await refreshToken();
        isRefreshing = false;
        if (!refreshed) {
          // Refresh falhou - pode ser erro temporário
          // Não fazer logout - tentar novamente na próxima verificação
          // Se realmente falhar, o interceptor da API vai tentar refresh na próxima requisição
        }
        return;
      }

      // Se access token está próximo de expirar (menos de 5 min), fazer refresh proativo
      if (isTokenExpiringSoon(accessToken)) {
        isRefreshing = true;
        const refreshed = await refreshToken();
        isRefreshing = false;
        if (!refreshed) {
          // Se refresh proativo falhar mas token ainda não expirou, não fazer logout
          // Tentar novamente na próxima verificação
        }
      }
    };

    // Verificar imediatamente
    checkAndRefreshToken();

    // Verificar a cada 10 minutos (aumentado de 5min para reduzir requisições)
    // A sessão permanece ativa enquanto refresh token for válido (7 dias)
    const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, isTokenExpired, isTokenExpiringSoon, refreshToken, logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<{
        data?: {
          user: User;
          accessToken: string;
          refreshToken: string;
        };
        user?: User;
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/login', { email, password });

      // Handle transformed response (with data wrapper) or direct response
      const data = (response as any).data || response;

      // Verify response has all required fields
      if (!data) {
        throw new Error('Nenhuma resposta recebida do servidor');
      }

      // Check each field individually to provide better error message
      if (!data.accessToken) {
        throw new Error('Token de acesso não recebido');
      }

      if (!data.refreshToken) {
        throw new Error('Token de refresh não recebido');
      }

      if (!data.user) {
        throw new Error('Dados do usuário não recebidos');
      }

      // Verify user has required fields
      if (!data.user.id || !data.user.email) {
        throw new Error('Dados do usuário incompletos');
      }

      // Store tokens and user
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Update state - this should trigger re-render
      setUser(data.user);
    } catch (error: any) {
      // If it's already an Error object with message, throw it
      if (error instanceof Error) {
        throw error;
      }
      // If it's an ApiError object, extract message
      if (error?.message) {
        throw new Error(error.message);
      }
      // Fallback
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  }, []);


  // Calculate isAuthenticated directly from user state
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

