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
  
  // Check if we're in demo mode
  const isDemoMode = location.includes('demo=true');

  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth();
      
      // Skip authentication checks if in demo mode
      if (isDemoMode) return;
      
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
  }, [checkAuth, isAuthenticated, isOnboarding, location, setLocation, isDemoMode]);

  // Demo mode banner
  const DemoBanner = () => (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center">
      Demo Mode: This is a preview of the Layover Fuel dashboard with the new meal photo analysis feature.
    </div>
  );

  return (
    <>
      {isDemoMode && <DemoBanner />}
      <Switch>
        <Route path="/" component={() => isAuthenticated && isOnboarding ? <OnboardingView /> : <Login />} />
        <Route path="/auth/register" component={Register} />
        <Route path="/auth/login" component={Login} />
        <Route path="/dashboard" component={isDemoMode ? DashboardPage : (isAuthenticated ? DashboardPage : Login)} />
        <Route path="/dashboard/nutrition" component={isDemoMode ? NutritionPage : (isAuthenticated ? NutritionPage : Login)} />
        <Route path="/dashboard/workout" component={isDemoMode ? WorkoutPage : (isAuthenticated ? WorkoutPage : Login)} />
        <Route path="/dashboard/profile" component={isDemoMode ? ProfilePage : (isAuthenticated ? ProfilePage : Login)} />
        <Route component={NotFound} />
      </Switch>
    </>
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
