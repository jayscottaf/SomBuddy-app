import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import TourPage from "@/pages/tour";
import DemoPage from "./components/dashboard/DemoPage";
import { useLocation } from "wouter";

function Router() {
  // For MVP, we're bypassing authentication and using a simple router
  const [location] = useLocation();

  return (
    <Switch>
      {/* Demo Mode - This is our main focus for MVP */}
      <Route path="/demo" component={DemoPage} />
      
      {/* Tour Page - Shows features walkthrough */}
      <Route path="/tour" component={TourPage} />
      
      {/* Root path shows splash screen (defined in index.html) */}
      <Route path="/" component={DemoPage} />
      
      {/* Redirect everything else to Demo for MVP */}
      <Route path="/dashboard" component={DemoPage} />
      <Route path="/dashboard/:any*" component={DemoPage} />
      <Route path="/auth/:any*" component={DemoPage} />
      
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
