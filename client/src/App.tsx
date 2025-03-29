import { Switch, Route, Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { Loader2 } from "lucide-react";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
    <div className="text-white text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
      <p className="text-lg">Loading Rudra Chats...</p>
    </div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
};

// Login route component
const LoginRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Login />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <LoginRoute />
      </Route>
      <Route path="/">
        <ProtectedRoute>
          <ChatProvider>
            <Chat />
          </ChatProvider>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
