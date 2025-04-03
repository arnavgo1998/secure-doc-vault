
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const AppHeader: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-brand-blue text-white py-4 shadow-md">
      <div className="mobile-container flex justify-between items-center">
        <h1 
          className="text-xl font-bold cursor-pointer"
          onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
        >
          SecureDocVault
        </h1>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline-block">{user?.email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-brand-blue/20"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/login")}
            className="hover:bg-brand-blue/20"
          >
            <User className="h-4 w-4 mr-2" />
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
