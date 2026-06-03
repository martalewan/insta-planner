import { FiHash, FiImage } from "react-icons/fi";
import type { PlannedPost } from "../types/plannedPost";

type PlannedPostGridCardProps = {
    post: PlannedPost;
};

export function PlannedPostGridCard({ post }: PlannedPostGridCardProps) {
    return (
        <article className="group relative aspect-square overflow-hidden bg-zinc-100 text-left">
            {post.imageUrl ? (
                <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-text-secondary">
                    <FiImage className="text-2xl" />
                </div>
            )}

            <span className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase text-text-primary shadow-soft">
                Planned
            </span>

            <div className="absolute inset-0 flex flex-col justify-end gap-3 bg-black/0 p-4 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                <p className="line-clamp-4 text-sm font-medium leading-5">
                    {post.caption || "No description yet"}
                </p>

                {post.hashtags.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <FiHash aria-hidden="true" />
                        <span className="line-clamp-1">
                            {post.hashtags.map((tag) => `#${tag}`).join(" ")}
                        </span>
                    </div>
                )}
            </div>
        </article>
    );
}
