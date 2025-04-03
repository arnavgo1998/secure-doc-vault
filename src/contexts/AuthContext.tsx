
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a mock database for our demo
let USERS_DB: { id: string; email: string; password: string }[] = [
  {
    id: "user-1",
    email: "test@example.com",
    password: "password123",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const foundUser = USERS_DB.find(
        (u) => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const userData = { id: foundUser.id, email: foundUser.email };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/dashboard");
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const existingUser = USERS_DB.find((u) => u.email === email);
      
      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "Email already in use",
          variant: "destructive",
        });
        return;
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password,
      };
      
      USERS_DB.push(newUser);
      
      const userData = { id: newUser.id, email: newUser.email };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      navigate("/dashboard");
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    } catch (error) {
      toast({
        title: "Registration error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
