
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { Shield, Upload, Share, User } from "lucide-react";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 mobile-container py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3 text-brand-dark">
            Secure Insurance Document Vault
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Store, manage, and share your insurance documents securely from any device
          </p>
        </div>

        <div className="grid gap-6 mb-10">
          <div className="flex flex-col items-center">
            <div className="bg-accent p-4 rounded-full mb-4">
              <Shield className="h-8 w-8 text-brand-teal" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Secure Storage</h2>
            <p className="text-sm text-center text-muted-foreground">
              Keep all your important insurance documents in one secure location
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-accent p-4 rounded-full mb-4">
              <Upload className="h-8 w-8 text-brand-teal" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Easy Uploads</h2>
            <p className="text-sm text-center text-muted-foreground">
              Quickly upload and organize your insurance documents
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-accent p-4 rounded-full mb-4">
              <Share className="h-8 w-8 text-brand-teal" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Selective Sharing</h2>
            <p className="text-sm text-center text-muted-foreground">
              Share your documents with family or advisors using secure invite codes
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="gap-2"
          >
            <User className="h-5 w-5" />
            Create Account
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/login")}
          >
            Already have an account? Login
          </Button>
        </div>
      </main>
      
      <footer className="py-6 border-t bg-muted/30">
        <div className="mobile-container text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SecureDocVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
