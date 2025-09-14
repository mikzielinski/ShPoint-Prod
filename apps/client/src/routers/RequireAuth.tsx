import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export type Role = "USER" | "EDITOR" | "ADMIN";

export default function RequireAuth({
children,
role,
}: {
children: React.ReactElement;
role?: Role;
}) {
const { auth } = useAuth();
const location = useLocation();

// While auth is loading, render nothing to avoid flicker
if (auth.status === "loading") return null;

if (auth.status !== "authenticated") {
return <Navigate to="/login" state={{ from: location }} replace />;
}

const myRole = (auth.user as any)?.role as Role | undefined;
if (role === "ADMIN" && myRole !== "ADMIN") {
return <Navigate to="/login" state={{ from: location }} replace />;
}
if (role === "EDITOR" && !(myRole === "EDITOR" || myRole === "ADMIN")) {
return <Navigate to="/login" state={{ from: location }} replace />;
}

return children;
}
