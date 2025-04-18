import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Register from "@/pages/auth/register";
import Login from "@/pages/auth/login";
import DashboardPage from "@/pages/dashboard";
import NutritionPage from "@/pages/dashboard/nutrition";
import WorkoutPage from "@/pages/dashboard/workout";
import ProfilePage from "@/pages/dashboard/profile";
import { useAuth } from "./context/auth-context";
import { OnboardingView } from "./components/onboarding/OnboardingView";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, isOnboarding, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth();
      
      // Redirect if on protected page and not authenticated
      const protectedPaths = [
        '/dashboard',
        '/dashboard/nutrition',
        '/dashboard/workout',
        '/dashboard/profile',
        '/dashboard/settings',
        '/dashboard/plan'
      ];
      
      if (!isAuthenticated && protectedPaths.some(path => location.startsWith(path))) {
        setLocation('/auth/login');
      }
      
      // Redirect to dashboard if authenticated and not on onboarding
      if (isAuthenticated && !isOnboarding && location === '/') {
        setLocation('/dashboard');
      }
    };
    
    checkAuthentication();
  }, [checkAuth, isAuthenticated, isOnboarding, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={() => isAuthenticated && isOnboarding ? <OnboardingView /> : <Login />} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/login" component={Login} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/nutrition" component={NutritionPage} />
      <Route path="/dashboard/workout" component={WorkoutPage} />
      <Route path="/dashboard/profile" component={ProfilePage} />
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
