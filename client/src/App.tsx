import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import ChatPage from "@/pages/chat-page";

function Router() {

  return (
    <Switch>
      {/* Chat Page as the home page - iMessage-style assistant chat */}
      <Route path="/" component={ChatPage} />

      
      {/* Legacy routes kept for compatibility */}

      <Route path="/chat" component={ChatPage} />

      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
