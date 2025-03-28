import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { chatSocket } from "../lib/socket";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (password !== "456") {
      setError("Invalid password");
      return;
    }
    
    // Create user object and store in localStorage
    const user = { username };
    localStorage.setItem("chatUser", JSON.stringify(user));
    
    // Show toast notification
    toast({
      title: "Login successful",
      description: `Welcome ${username}!`,
    });
    
    // Redirect to chat page using wouter's navigation
    // This will trigger App's useEffect that checks localStorage
    setLocation("/");
    
    // Force a refresh of the page to ensure all state is updated
    window.location.reload();
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
      
      <Card className="relative bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl max-w-md w-full border border-white/20">
        <CardContent className="p-0">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">RealChat</h1>
            <p className="text-gray-600 mt-2">Connect with friends in real-time</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any username"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (hint: 456)"
                className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">Default password is: 456</p>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Login to Chat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
