import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
}: ProtectedRouteProps) => {
  // Defensive auth handling with fallback
  let isAuthenticated = false;
  let isLoading = true;
  let initError = null;

  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    isLoading = auth.isLoading;
    initError = auth.initError;
  } catch (error) {
    // Fallback to unauthenticated state and redirect
    isAuthenticated = false;
    isLoading = false;
    initError = "Auth context not available";
  }

  const location = useLocation();
  const [forceRender, setForceRender] = useState(false);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setForceRender(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // If there's an auth error or we've hit the timeout, and auth is required, redirect to login
  if ((initError || forceRender) && requireAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading only if we haven't hit timeout and there's no error
  if (isLoading && !forceRender && !initError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-book-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
