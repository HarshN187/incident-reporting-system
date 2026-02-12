import api from "./api";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  ApiResponse,
} from "../types";

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return api.post<ApiResponse<AuthResponse>>("/auth/register", data);
  }

  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> {
    return api.post<ApiResponse<AuthResponse>>("/auth/login", credentials);
  }

  async logout(): Promise<ApiResponse> {
    const refreshToken = localStorage.getItem("refreshToken");
    return api.post<ApiResponse>("/auth/logout", { refreshToken });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<ApiResponse<User>>("/auth/me");
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    return api.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh-token",
      {
        refreshToken,
      },
    );
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    return api.patch<ApiResponse>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  }
}

export default new AuthService();
