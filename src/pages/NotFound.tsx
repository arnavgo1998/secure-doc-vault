
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 mobile-container py-12 flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! The page you're looking for can't be found.
        </p>
        <Button onClick={() => navigate("/")}>Return to Home</Button>
      </main>
    </div>
  );
};

export default NotFound;
