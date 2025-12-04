"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "@/app/app/lib/appwrite";
import { Models } from "appwrite";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 1. CONFIGURATION ---
// This ID must match the 'FALLBACK_USER_ID' in your Mobile App's App.tsx
const SHARED_ANONYMOUS_ID = '692f2fac2c7455a23e01';

// Create a "Fake" User Object that mimics a real login
const SHARED_ANONYMOUS_USER = {
    $id: SHARED_ANONYMOUS_ID,
    name: "Shared User",
    registration: new Date().toISOString(),
    status: true,
    prefs: {},
    email: "",
    emailVerification: false,
    phone: "",
    phoneVerification: false,
    passwordUpdate: "",
    accessedAt: ""
} as Models.User<Models.Preferences>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Default to the shared user immediately so the app feels "ready"
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(SHARED_ANONYMOUS_USER);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            // Optional: If you ever add real login later, this checks for it.
            // For now, it will likely fail or return null, which is fine.
            await account.get();
        } catch (err) {
            // Ignore errors, we stick to the shared user
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    // "Login" just resets to the shared user (Simulated)
    const login = async () => {
        setUser(SHARED_ANONYMOUS_USER);
    };

    const logout = async () => {
        setUser(SHARED_ANONYMOUS_USER);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};