import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    
    // Use the fixed password for all users
    // Note: In a real application, each user would have their own password
    if (password !== "456") {
      setError("Invalid password");
      return;
    }
    
    try {
      setIsLoggingIn(true);
      
      // Login with Firebase
      await login(username, password);
      
      // Show toast notification
      toast({
        title: "Login successful",
        description: `Welcome ${username}!`,
      });
      
      // Redirect to chat page using wouter's navigation
      setLocation("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check if this is the specific username in use error
      if (error.message === "Username already in use") {
        setError("This username is already in use by another online user. Please try a different username.");
        
        // Toast is already displayed in the AuthContext
      } else {
        setError("Login failed. Please try again.");
        
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500"
      >
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="w-96 h-96 rounded-full bg-white blur-3xl pulse-glow-animation"></div>
        </div>
        <div className="absolute inset-0 flex">
          <div className="w-24 h-24 rounded-full bg-blue-500/30 blur-xl absolute top-1/4 left-1/4 float-animation"></div>
          <div className="w-32 h-32 rounded-full bg-purple-500/20 blur-xl absolute bottom-1/3 right-1/3 float-animation" style={{ animationDelay: '-3s' }}></div>
          <div className="w-20 h-20 rounded-full bg-pink-500/20 blur-xl absolute top-2/3 right-1/4 float-animation" style={{ animationDelay: '-6s' }}></div>
        </div>
      </div>
      
      <Card className="relative bg-white/90 backdrop-blur-sm p-4 sm:p-8 rounded-xl shadow-2xl w-[90%] max-w-md border border-white/20 mx-4">
        <CardContent className="p-0">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Rudra Chats</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Connect with friends in real-time</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Clear error when username changes, especially if it was a "username in use" error
                  if (error.includes("username is already in use")) {
                    setError("");
                  }
                }}
                placeholder="Enter any username"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <Button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login to Chat'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
