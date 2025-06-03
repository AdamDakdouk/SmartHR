import { clearTokens, getAccessToken, storeTokens } from "@/utils/main-utils";
import api from "./Api";
import { router } from "expo-router";

interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface VerifyEmailDTO {
  email: string;
  otp: number;
}

export interface ResetPasswordDTO {
  email: string;
  newPassword: string;
  code: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    employee: {
      _id: string;
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

export const login = async (dto: LoginDTO): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", dto);

  if (response.data.success && response.data.data.tokens) {
    const { accessToken, refreshToken } = response.data.data.tokens;
    await storeTokens(accessToken, refreshToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  return response.data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } finally {
    await clearTokens();
    delete api.defaults.headers.common["Authorization"];
    router.replace("/screens/login");
  }
};

export const createuser = async (dto: CreateUserDTO) => {
  const response = await api.post("/auth/signup", dto);
  console.log("Response from createuser:", response.data);
  return response.data;
};

export const verifyEmail = async (dto: VerifyEmailDTO) => {
  const response = await api.post("/auth/activate", dto);
  return response.data;
};

export const resendOTP = async (email: string) => {
  const response = await api.post("/auth/resend-otp", { email });
  return response.data;
};

export const sendPasswordResetCode = async (email: string) => {
  const response = await api.post("/auth/send-reset-password", { email });
  return response.data;
};

export const resetPassword = async (dto: ResetPasswordDTO) => {
  const response = await api.put("/auth/reset-password", {
    ...dto,
    code: parseInt(dto.code),
  });
  return response.data;
};

// Helper function to check if user is authenticated
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const token = await getAccessToken();
    return !!token;
  } catch {
    return false;
  }
};
