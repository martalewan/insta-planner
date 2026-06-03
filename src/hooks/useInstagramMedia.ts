import { useEffect, useMemo, useState } from "react";
import type { InstagramPost } from "../types/instagram";

type InstagramApiResponse = {
    configured: boolean;
    error?: string;
    posts: InstagramPost[];
};

export type InstagramAccount = {
    account_type?: string;
    id?: string;
    media_count?: number;
    profilePictureUrl?: string;
    username?: string;
};

type InstagramAccountResponse = {
    account: InstagramAccount | null;
    configured: boolean;
    error?: string;
    oauthConfigured?: boolean;
    tokenExpiresAt?: string | null;
};

type InstagramMediaState = {
    account: InstagramAccount | null;
    connectWithToken: (accessToken: string) => Promise<void>;
    connectAccount: () => void;
    disconnectAccount: () => Promise<void>;
    error: string | null;
    isLive: boolean;
    isLoading: boolean;
    isOAuthConfigured: boolean;
    isSavingAccount: boolean;
    posts: InstagramPost[];
    reloadMedia: () => Promise<void>;
    username: string;
};

export function useInstagramMedia(): InstagramMediaState {
    const [account, setAccount] = useState<InstagramAccount | null>(null);
    const [posts, setPosts] = useState<InstagramPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOAuthConfigured, setIsOAuthConfigured] = useState(false);
    const [isSavingAccount, setIsSavingAccount] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const instagramError = params.get("instagram_error");

        if (instagramError) {
            setError(instagramError.replaceAll("_", " "));
            window.history.replaceState(null, "", window.location.pathname);
        }
    }, []);

    async function loadAccount() {
        const response = await fetch("/api/instagram/account");
        const data = (await response.json()) as InstagramAccountResponse;

        if (!response.ok || data.error) {
            throw new Error(data.error || "Instagram account could not be loaded.");
        }

        setIsOAuthConfigured(Boolean(data.oauthConfigured));
        setAccount(data.account);
    }

    async function reloadMedia() {
        setIsLoading(true);

        try {
            await loadAccount();

            const response = await fetch("/api/instagram/media");
            const data = (await response.json()) as InstagramApiResponse;

            if (!response.ok || data.error) {
                setError(data.error || "Instagram media could not be loaded.");
                setIsLive(false);
                return;
            }

            if (data.configured && data.posts.length > 0) {
                setPosts(data.posts);
                setIsLive(true);
                setError(null);
                return;
            }

            setPosts([]);
            setIsLive(false);
            setError(null);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Instagram media could not be loaded.",
            );
            setIsLive(false);
        } finally {
            setIsLoading(false);
        }
    }

    function connectAccount() {
        if (!isOAuthConfigured) {
            setError("Instagram connection is not available yet.");
            return;
        }

        window.location.href = "/api/instagram/auth/start";
    }

    async function connectWithToken(accessToken: string) {
        setIsSavingAccount(true);
        setError(null);

        try {
            const response = await fetch("/api/instagram/connect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ accessToken }),
            });
            const data = (await response.json()) as InstagramAccountResponse;

            if (!response.ok || data.error) {
                throw new Error(data.error || "Instagram token could not be verified.");
            }

            setAccount(data.account);
            await reloadMedia();
        } finally {
            setIsSavingAccount(false);
        }
    }

    async function disconnectAccount() {
        setIsSavingAccount(true);
        setError(null);

        try {
            const response = await fetch("/api/instagram/connect", {
                method: "DELETE",
            });
            const data = (await response.json()) as InstagramAccountResponse;

            if (!response.ok || data.error) {
                throw new Error(data.error || "Instagram account could not be disconnected.");
            }

            setAccount(null);
            setPosts([]);
            setIsLive(false);
        } finally {
            setIsSavingAccount(false);
        }
    }

    useEffect(() => {
        void reloadMedia();
    }, []);

    const username = useMemo(() => {
        if (account?.username) {
            return account.username;
        }

        const liveUsername = posts.find((post) => post.username)?.username;

        return liveUsername || "instagram.account";
    }, [account, posts]);

    return {
        account,
        connectWithToken,
        connectAccount,
        disconnectAccount,
        error,
        isLive,
        isLoading,
        isOAuthConfigured,
        isSavingAccount,
        posts,
        reloadMedia,
        username,
    };
}
