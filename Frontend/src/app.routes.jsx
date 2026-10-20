import { createBrowserRouter, Navigate, useRouteError, isRouteErrorResponse, Link } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/protected";
import Home from "./features/interview/pages/home";
import Interview from "./features/interview/pages/interview";
import LandingPage from "./pages/LandingPage";
import MockInterview from "./features/interview/pages/MockInterview";

export function RouteErrorBoundary() {
    const error = useRouteError();
    console.error("Router error:", error);

    const is404 = isRouteErrorResponse(error) && error.status === 404;

    return (
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", color: "#f8fafc" }}>
            <h1 style={{ fontSize: "2.25rem", marginBottom: "1rem" }}>
                {is404 ? "404 - Page Not Found" : "Oops! Something went wrong"}
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem", maxWidth: "480px" }}>
                {is404 ? "The page you're looking for doesn't exist or has moved." : (error?.message || "An unexpected error occurred.")}
            </p>
            <Link to="/" style={{ padding: "0.75rem 1.5rem", background: "#6366f1", color: "#fff", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "600" }}>
                Back to Home
            </Link>
        </main>
    );
}

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LandingPage />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/login",
        element: <Login />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/login/*",
        element: <Login />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/register",
        element: <Register />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/register/*",
        element: <Register />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/sign-in/*",
        element: <Navigate to="/login" replace />
    },
    {
        path: "/sign-up/*",
        element: <Navigate to="/register" replace />
    },
    {
        path: "/dashboard",
        element: <Protected><Home /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/interview/:interviewId/mock",
        element: <Protected><MockInterview /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
])