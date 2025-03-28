import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ChatProvider } from "./context/ChatContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <App />
      <Toaster />
    </ChatProvider>
  </QueryClientProvider>
);
