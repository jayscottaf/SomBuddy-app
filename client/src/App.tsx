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
import TourPage from "@/pages/tour";
import { useAuth } from "./context/auth-context";
import { OnboardingView } from "./components/onboarding/OnboardingView";
import DemoPage from "./components/dashboard/DemoPage";
import { useEffect } from "react";
import { useLocation } from "wouter";

function Router() {
  const { isAuthenticated, isOnboarding, checkAuth } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Get URL params to check for demo mode
  const params = new URLSearchParams(window.location.search);
  const isDemoMode = params.has('demo');

  useEffect(() => {
    // Don't run authentication checks for special routes
    if (location === '/demo' || location === '/tour') {
      return;
    }
    
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
      {/* Special routes that don't require authentication */}
      <Route path="/demo" component={DemoPage} />
      <Route path="/tour" component={TourPage} />
      
      <Route path="/" component={() => {
        // For the root path, check the query param for demo mode
        if (isDemoMode) return <DemoPage />;
        if (isAuthenticated && isOnboarding) return <OnboardingView />;
        return <Login />;
      }} />
      
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/login" component={Login} />
      <Route path="/dashboard" component={() => isAuthenticated ? <DashboardPage /> : <Login />} />
      <Route path="/dashboard/nutrition" component={() => isAuthenticated ? <NutritionPage /> : <Login />} />
      <Route path="/dashboard/workout" component={() => isAuthenticated ? <WorkoutPage /> : <Login />} />
      <Route path="/dashboard/profile" component={() => isAuthenticated ? <ProfilePage /> : <Login />} />
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
