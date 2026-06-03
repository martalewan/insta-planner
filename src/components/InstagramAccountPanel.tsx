import { useState } from "react";
import type { InstagramAccount } from "../hooks/useInstagramMedia";

type InstagramAccountPanelProps = {
    account: InstagramAccount | null;
    error?: string | null;
    isLive: boolean;
    isOAuthConfigured: boolean;
    isSaving: boolean;
    onConnectWithToken: (accessToken: string) => Promise<void>;
    onConnect: () => void;
    onDisconnect: () => Promise<void>;
};

export function InstagramAccountPanel({
    account,
    error,
    isLive,
    isOAuthConfigured,
    isSaving,
    onConnectWithToken,
    onConnect,
    onDisconnect,
}: InstagramAccountPanelProps) {
    const [formError, setFormError] = useState<string | null>(null);
    const [isTokenFormOpen, setIsTokenFormOpen] = useState(false);
    const [accessToken, setAccessToken] = useState("");

    async function handleTokenConnect() {
        setFormError(null);

        try {
            await onConnectWithToken(accessToken);
            setAccessToken("");
            setIsTokenFormOpen(false);
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : "Instagram token could not be verified.",
            );
        }
    }

    async function handleDisconnect() {
        setFormError(null);

        try {
            await onDisconnect();
        } catch (error) {
            setFormError(
                error instanceof Error
                    ? error.message
                    : "Instagram account could not be disconnected.",
            );
        }
    }

    return (
        <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-text-primary">
                        {account?.username ? `@${account.username}` : "No Instagram account connected"}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                        {isLive
                            ? `${account?.media_count ?? 0} posts available from Instagram`
                            : account
                                ? `${account.media_count ?? 0} media available from Instagram`
                            : isOAuthConfigured
                                ? "Connect Instagram to show real posts."
                                : "Instagram connection is not available yet."}
                    </p>
                </div>

                {account ? (
                    <button
                        type="button"
                        className="w-fit rounded-md border border-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-zinc-50"
                        disabled={isSaving}
                        onClick={handleDisconnect}
                    >
                        Disconnect
                    </button>
                ) : (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="group relative w-fit">
                            <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-text-primary bg-white text-xs font-semibold text-text-primary shadow-soft transition hover:bg-primary hover:text-white focus:bg-primary focus:text-white focus:outline-none"
                                aria-label="How Instagram connection works"
                            >
                                i
                            </button>

                            <div className="pointer-events-none absolute right-0 top-8 z-10 w-72 rounded-card border border-border bg-white p-3 text-xs leading-5 text-text-secondary opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-within:opacity-100">
                                <strong className="mb-1 block text-text-primary">
                                    Production connection
                                </strong>
                                Users approve access through Meta/Instagram OAuth. No one should paste tokens manually.
                            </div>
                        </div>

                        <button
                            type="button"
                            className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSaving}
                            onClick={onConnect}
                        >
                            Connect Instagram
                        </button>

                        <button
                            type="button"
                            className="w-fit rounded-md border border-border px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-zinc-50"
                            onClick={() => setIsTokenFormOpen((isOpen) => !isOpen)}
                        >
                            Use access token
                        </button>
                    </div>
                )}
            </div>

            {!account && isTokenFormOpen && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                    <input
                        type="password"
                        value={accessToken}
                        onChange={(event) => setAccessToken(event.target.value)}
                        placeholder="Paste generated Instagram access token"
                        className="min-h-11 flex-1 rounded-md border border-border px-4 text-sm outline-none transition focus:border-text-primary"
                    />
                    <button
                        type="button"
                        className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSaving || !accessToken.trim()}
                        onClick={() => void handleTokenConnect()}
                    >
                        {isSaving ? "Connecting" : "Save token"}
                    </button>
                </div>
            )}

            {(formError || error) && (
                <p className="mt-4 text-sm text-text-secondary">
                    {formError || error}
                </p>
            )}
        </section>
    );
}
