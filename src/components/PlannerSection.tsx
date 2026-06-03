import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { FiHash, FiImage, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import type { PlannedPost } from "../types/plannedPost";

type PlannerSectionProps = {
    onAddPost: (post: Omit<PlannedPost, "id">) => void;
    onDeletePost: (postId: string) => void;
    plannedPosts: PlannedPost[];
    storageError?: string | null;
};

function parseHashtags(value: string) {
    return value
        .split(/[,\s]+/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean);
}

export function PlannerSection({
    onAddPost,
    onDeletePost,
    plannedPosts,
    storageError,
}: PlannerSectionProps) {
    const [caption, setCaption] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageName, setImageName] = useState("");

    const stats = useMemo(
        () => ({
            total: plannedPosts.length,
        }),
        [plannedPosts],
    );

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!caption.trim() && !hashtags.trim() && !imageUrl.trim()) {
            return;
        }

        onAddPost({
            caption: caption.trim(),
            hashtags: parseHashtags(hashtags),
            imageUrl: imageUrl.trim(),
        });

        setCaption("");
        setHashtags("");
        setImageUrl("");
        setImageName("");
    }

    function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result === "string") {
                setImageUrl(reader.result);
                setImageName(file.name);
            }
        });
        reader.readAsDataURL(file);
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-text-secondary">Planning</p>
                    <h2 className="mt-1 text-2xl font-semibold text-text-primary">
                        Next posts
                    </h2>
                </div>

                <div className="flex gap-5 text-sm text-text-primary">
                    <span>
                        <strong>{stats.total}</strong> planned
                    </span>
                </div>
            </div>

            {storageError && (
                <p className="rounded-card border border-border bg-surface p-4 text-sm text-text-secondary shadow-soft">
                    {storageError}
                </p>
            )}

            <form
                className="grid gap-4 rounded-card border border-border bg-surface p-5 shadow-soft lg:grid-cols-[220px_1fr]"
                onSubmit={handleSubmit}
            >
                <div className="space-y-3">
                    <div className="aspect-square overflow-hidden rounded-md bg-zinc-100">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-text-secondary">
                                <FiImage className="text-2xl" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-zinc-50">
                            <FiUpload />
                            <span className="min-w-0 truncate">
                                {imageName || "Upload image"}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleImageUpload}
                            />
                        </label>

                        {imageUrl && (
                            <button
                                type="button"
                                className="flex h-12 w-12 items-center justify-center rounded-md border border-border text-text-secondary transition hover:bg-zinc-50 hover:text-text-primary"
                                aria-label="Remove uploaded image"
                                onClick={() => {
                                    setImageUrl("");
                                    setImageName("");
                                }}
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <textarea
                        value={caption}
                        onChange={(event) => setCaption(event.target.value)}
                        placeholder="Description"
                        className="min-h-40 w-full resize-none rounded-md border border-border px-4 py-3 text-sm leading-6 outline-none transition focus:border-text-primary"
                    />

                    <label className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
                        <FiHash className="text-text-secondary" />
                        <input
                            value={hashtags}
                            onChange={(event) => setHashtags(event.target.value)}
                            placeholder="hashtags, comma separated"
                            className="min-w-0 flex-1 text-sm outline-none"
                        />
                    </label>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                    >
                        Add to plan
                    </button>
                </div>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
                {plannedPosts.map((post) => (
                    <article
                        key={post.id}
                        className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-soft sm:grid-cols-[112px_1fr]"
                    >
                        <div className="aspect-square overflow-hidden rounded-md bg-zinc-100">
                            {post.imageUrl ? (
                                <img
                                    src={post.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-text-secondary">
                                    <FiImage className="text-2xl" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-xs font-semibold uppercase text-text-secondary">
                                    Planned post
                                </p>
                                <button
                                    type="button"
                                    className="rounded-md p-2 text-text-secondary transition hover:bg-zinc-50 hover:text-text-primary"
                                    aria-label="Delete draft"
                                    onClick={() => onDeletePost(post.id)}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                            <p className="line-clamp-3 text-sm leading-6 text-text-primary">
                                {post.caption || "No caption yet"}
                            </p>

                            {post.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {post.hashtags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-text-secondary"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
