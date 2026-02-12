import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import authService from "../services/auth.service";
import type { LoginCredentials, RegisterData } from "../types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response.data;
    },
    enabled: !!localStorage.getItem("accessToken"),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        queryClient.setQueryData(authKeys.currentUser(), user);
        toast.success("Login successful");
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, tokens } = response.data;
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        queryClient.setQueryData(authKeys.currentUser(), user);
        toast.success("Registration successful");
        navigate("/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
      navigate("/login");
      toast.success("Logged out successfully");
    },
  });
};
