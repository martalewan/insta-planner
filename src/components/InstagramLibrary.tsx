import { useMemo, useState } from "react";
import type { InstagramPost } from "../types/instagram";
import { InstagramPostCard } from "./InstagramPostCard";

type InstagramLibraryProps = {
    accountType?: string;
    error?: string | null;
    isConnected?: boolean;
    isLoading?: boolean;
    mediaCount?: number;
    posts: InstagramPost[];
    profileImageUrl?: string;
    username: string;
};

type LibraryFilter = "All" | InstagramPost["format"];

const filters: LibraryFilter[] = ["All", "Post", "Carousel", "Reel"];

export function InstagramLibrary({
    accountType,
    error,
    isConnected = false,
    isLoading = false,
    mediaCount,
    posts,
    profileImageUrl,
    username,
}: InstagramLibraryProps) {
    const [activeFilter, setActiveFilter] = useState<LibraryFilter>("All");
    const visiblePosts = useMemo(
        () =>
            activeFilter === "All"
                ? posts
                : posts.filter((post) => post.format === activeFilter),
        [activeFilter, posts],
    );

    return (
        <section className="space-y-6">
            <div className="grid gap-6 border-b border-border pb-8 md:grid-cols-[160px_1fr] md:items-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-zinc-100 sm:h-32 sm:w-32 md:mx-auto">
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <span className="text-4xl font-semibold text-text-secondary">
                            @
                        </span>
                    )}
                </div>

                <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <h2 className="text-2xl font-semibold tracking-normal text-text-primary">
                            {username}
                        </h2>

                        <button
                            type="button"
                            className="w-fit rounded-md border border-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-zinc-50"
                        >
                            View profile
                        </button>
                    </div>

                    <div className="flex gap-7 text-sm text-text-primary">
                        <span>
                            <strong>{mediaCount ?? posts.length}</strong> media
                        </span>
                        <span>
                            <strong>{accountType || "not connected"}</strong> account
                        </span>
                    </div>

                    <div className="max-w-xl text-sm leading-6 text-text-secondary">
                        {isConnected
                            ? "Connected with Instagram."
                            : "Connect an Instagram account to load real posts."}
                    </div>

                    {(isLoading || error) && (
                        <p className="text-sm text-text-secondary">
                            {isLoading ? "Loading Instagram..." : error}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-8 border-b border-border text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {filters.map((filter) => {
                    const isActive = activeFilter === filter;

                    return (
                        <button
                            key={filter}
                            type="button"
                            className={`border-t py-4 transition ${
                                isActive
                                    ? "border-text-primary text-text-primary"
                                    : "border-transparent hover:text-text-primary"
                            }`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-1 md:grid-cols-4 md:gap-2">
                {visiblePosts.map((post) => (
                    <InstagramPostCard key={post.id} post={post} />
                ))}
            </div>

            {!isLoading && visiblePosts.length === 0 && (
                <div className="flex min-h-72 items-center justify-center border border-dashed border-border text-center">
                    <p className="max-w-sm text-sm leading-6 text-text-secondary">
                        Connect an Instagram account to display posts here.
                    </p>
                </div>
            )}
        </section>
    );
}
