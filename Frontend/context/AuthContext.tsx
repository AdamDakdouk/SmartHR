// contexts/AuthContext.tsx
import React, { createContext, useContext, useState } from "react";
import { clearTokens } from "@/utils/main-utils";
import { router } from "expo-router";

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<Employee | null>(null);

  const logout = async () => {
    setUser(null);
    await clearTokens();
    router.replace("/screens/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
