
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl text-gray-600 mb-8">Secure document storage powered by Supabase</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In / Sign Up</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
