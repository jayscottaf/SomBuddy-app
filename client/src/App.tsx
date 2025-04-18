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
  
  // Check if we're on a public path that doesn't need authentication
  const isPublicPath = location === '/demo' || location === '/tour' || location === '/app';

  useEffect(() => {
    if (isPublicPath) {
      return; // Skip auth checks for public paths
    }
    
    const checkAuthentication = async () => {
      try {
        await checkAuth();
        
        // Redirect to dashboard if authenticated and on the root path
        if (isAuthenticated && !isOnboarding && location === '/') {
          setLocation('/dashboard');
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    
    checkAuthentication();
  }, [checkAuth, isAuthenticated, isOnboarding, location, setLocation, isPublicPath]);

  return (
    <Switch>
      {/* Public routes that don't require authentication */}
      <Route path="/demo" component={DemoPage} />
      <Route path="/tour" component={TourPage} />
      <Route path="/app" component={() => isAuthenticated ? <DashboardPage /> : <Login />} />
      
      {/* Root path shows splash screen in index.html */}
      <Route path="/" component={() => {
        if (isAuthenticated && isOnboarding) return <OnboardingView />;
        if (isAuthenticated) return <DashboardPage />;
        return <Login />;
      }} />
      
      {/* Auth routes */}
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/login" component={Login} />
      
      {/* Protected dashboard routes */}
      <Route path="/dashboard">
        {isAuthenticated ? <DashboardPage /> : <Login />}
      </Route>
      <Route path="/dashboard/nutrition">
        {isAuthenticated ? <NutritionPage /> : <Login />}
      </Route>
      <Route path="/dashboard/workout">
        {isAuthenticated ? <WorkoutPage /> : <Login />}
      </Route>
      <Route path="/dashboard/profile">
        {isAuthenticated ? <ProfilePage /> : <Login />}
      </Route>
      
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
