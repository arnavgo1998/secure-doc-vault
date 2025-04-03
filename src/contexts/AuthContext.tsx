
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  phone: string;
  phoneVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, age: number, phone: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  sendOTP: (phone: string) => Promise<void>;
  getUserById: (id: string) => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a mock database for our demo
let USERS_DB: { 
  id: string; 
  email: string; 
  password: string;
  name: string;
  age: number;
  phone: string;
  phoneVerified: boolean;
}[] = [
  {
    id: "user-1",
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    age: 30,
    phone: "1234567890",
    phoneVerified: true,
  },
];

// Mock OTP storage for verification
let OTP_STORE: { [phone: string]: string } = {};

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
        const userData = { 
          id: foundUser.id, 
          email: foundUser.email,
          name: foundUser.name,
          age: foundUser.age,
          phone: foundUser.phone,
          phoneVerified: foundUser.phoneVerified,
        };
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

  const register = async (email: string, password: string, name: string, age: number, phone: string) => {
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
        name,
        age,
        phone,
        phoneVerified: false, // Requires verification
      };
      
      USERS_DB.push(newUser);
      
      const userData = { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name,
        age: newUser.age,
        phone: newUser.phone,
        phoneVerified: newUser.phoneVerified,
      };
      
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

  const sendOTP = async (phone: string) => {
    try {
      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In a real app, we would send an SMS here
      console.log(`[MOCK] Sending OTP ${otp} to ${phone}`);
      
      // Store OTP for verification
      OTP_STORE[phone] = otp;
      
      toast({
        title: "OTP sent",
        description: `Verification code sent to ${phone}. For testing, the code is: ${otp}`,
      });
    } catch (error) {
      toast({
        title: "Error sending OTP",
        description: "Failed to send verification code",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Check if OTP matches
    if (OTP_STORE[phone] === otp) {
      // Update user's phone verification status
      if (user) {
        const updatedUser = {
          ...user,
          phoneVerified: true,
        };
        
        // Update in mock DB
        const userIndex = USERS_DB.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          USERS_DB[userIndex].phoneVerified = true;
        }
        
        // Update local state
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      toast({
        title: "Phone verified",
        description: "Your phone number has been verified successfully",
      });
      
      // Clean up OTP
      delete OTP_STORE[phone];
      
      return true;
    } else {
      toast({
        title: "Verification failed",
        description: "Invalid OTP code. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getUserById = (id: string): User | null => {
    const foundUser = USERS_DB.find(u => u.id === id);
    if (!foundUser) return null;
    
    return {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      age: foundUser.age,
      phone: foundUser.phone,
      phoneVerified: foundUser.phoneVerified,
    };
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
        verifyOTP,
        sendOTP,
        getUserById,
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
