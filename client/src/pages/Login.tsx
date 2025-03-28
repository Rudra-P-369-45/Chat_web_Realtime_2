import { useState } from "react";
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
    
    // Connect to WebSocket
    chatSocket.connect(username);
    
    toast({
      title: "Login successful",
      description: `Welcome ${username}!`,
    });
    
    // Redirect to chat page
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1189&q=80')"
        }}
      ></div>
      
      <Card className="relative bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <CardContent className="p-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">RealChat</h1>
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
                className="w-full px-4 py-3"
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
                className="w-full px-4 py-3"
              />
              <p className="text-xs text-gray-500 mt-1">Default password is: 456</p>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white py-6"
            >
              Login to Chat
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
