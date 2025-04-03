
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email?: string;
  name: string;
  birthdate: Date;
  phone: string;
  phoneVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithPhone: (phone: string, rememberMe: boolean) => Promise<void>;
  register: (phone: string, name: string, birthdate: Date, email?: string) => Promise<void>;
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
  email?: string; 
  name: string;
  birthdate: Date;
  phone: string;
  phoneVerified: boolean;
}[] = [
  {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    birthdate: new Date("1990-01-01"),
    phone: "+11234567890",
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
      try {
        const parsedUser = JSON.parse(storedUser);
        // Convert birthdate string back to Date object
        if (parsedUser.birthdate) {
          parsedUser.birthdate = new Date(parsedUser.birthdate);
        }
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const loginWithPhone = async (phone: string, rememberMe: boolean) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log("Attempting login with phone:", phone);
      console.log("Available users:", USERS_DB);
      
      const foundUser = USERS_DB.find(u => u.phone === phone && u.phoneVerified);
      
      if (foundUser) {
        const userData = { 
          id: foundUser.id, 
          email: foundUser.email,
          name: foundUser.name,
          birthdate: foundUser.birthdate,
          phone: foundUser.phone,
          phoneVerified: foundUser.phoneVerified,
        };
        
        setUser(userData);
        
        if (rememberMe) {
          // Serialize Date object to string before storing
          const userDataToStore = {
            ...userData,
            birthdate: userData.birthdate.toISOString(),
          };
          localStorage.setItem("user", JSON.stringify(userDataToStore));
        } else {
          // For session-only storage, we could use sessionStorage instead
          // For this example, we'll just use localStorage but clear on logout
          const userDataToStore = {
            ...userData,
            birthdate: userData.birthdate.toISOString(),
            sessionOnly: true, // Flag to identify session-only storage
          };
          localStorage.setItem("user", JSON.stringify(userDataToStore));
        }
        
        navigate("/dashboard");
        return Promise.resolve();
      } else {
        throw new Error("Invalid phone number or not verified");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (phone: string, name: string, birthdate: Date, email?: string) => {
    setLoading(true);
    try {
      // Simulate API request delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const existingUser = USERS_DB.find((u) => u.phone === phone);
      
      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "Phone number already in use",
          variant: "destructive",
        });
        return;
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        email, // Optional
        name,
        birthdate,
        phone,
        phoneVerified: true, // Set to true since we verified during registration
      };
      
      USERS_DB.push(newUser);
      
      const userData = { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name,
        birthdate: newUser.birthdate,
        phone: newUser.phone,
        phoneVerified: newUser.phoneVerified,
      };
      
      setUser(userData);
      
      // Serialize Date object to string before storing
      const userDataToStore = {
        ...userData,
        birthdate: userData.birthdate.toISOString(),
      };
      localStorage.setItem("user", JSON.stringify(userDataToStore));
      
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
      throw error;
    }
  };

  const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
    // Check if OTP matches
    if (OTP_STORE[phone] === otp) {
      // Update user's phone verification status if they're already in the system
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
        
        // Serialize Date object to string before storing
        const userDataToStore = {
          ...updatedUser,
          birthdate: updatedUser.birthdate.toISOString(),
        };
        localStorage.setItem("user", JSON.stringify(userDataToStore));
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
      birthdate: foundUser.birthdate,
      phone: foundUser.phone,
      phoneVerified: foundUser.phoneVerified,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPhone,
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
