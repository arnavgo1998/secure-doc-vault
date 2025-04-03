
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="text-sm">{user?.phone || "Not available"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="text-sm break-words">{user?.id || "Not available"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={signOut} className="w-full">
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Dashboard;
