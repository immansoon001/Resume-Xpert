import React, { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "../hooks/useAuth";
import { clerkSync } from "../services/auth.api";

export const ClerkSyncManager = () => {
    const { isLoaded, isSignedIn, user: clerkUser } = useUser();
    const { user, handleClerkSync } = useAuth();
    const syncedClerkIdRef = useRef(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && clerkUser) {
            const email = clerkUser.primaryEmailAddress?.emailAddress;
            const username = clerkUser.fullName || clerkUser.username || clerkUser.firstName || email?.split("@")[0] || "User";
            const clerkId = clerkUser.id;

            if (email && syncedClerkIdRef.current !== clerkId && (!user || user.email !== email)) {
                syncedClerkIdRef.current = clerkId;
                handleClerkSync({ email, username, clerkId }).catch((err) => {
                    console.error("Clerk user sync error:", err);
                });
            }
        } else if (isLoaded && !isSignedIn && syncedClerkIdRef.current) {
            syncedClerkIdRef.current = null;
        }
    }, [isLoaded, isSignedIn, clerkUser, user, handleClerkSync]);

    return null;
};

export default ClerkSyncManager;
