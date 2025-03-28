import { Switch, Route, useLocation, Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Chat from "@/pages/Chat";
import { useState, useEffect } from "react";
import { ChatProvider } from "./context/ChatContext";

function App() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/">
        {isAuthenticated ? (
          <ChatProvider>
            <Chat />
          </ChatProvider>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
