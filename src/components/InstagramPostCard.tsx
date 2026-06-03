import { FiHeart, FiLayers, FiMessageCircle, FiPlay } from "react-icons/fi";
import type { InstagramPost } from "../types/instagram";

type InstagramPostCardProps = {
    post: InstagramPost;
};

export function InstagramPostCard({ post }: InstagramPostCardProps) {
    const formatIcon =
        post.format === "Carousel" ? (
            <FiLayers aria-label="Carousel" />
        ) : post.format === "Reel" ? (
            <FiPlay aria-label="Reel" />
        ) : null;

    const content = (
        <>
            <img
                src={post.imageUrl}
                alt={post.caption}
                className="h-full w-full object-cover"
                loading="lazy"
            />

            <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/0 text-base font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                <span className="flex items-center gap-2">
                    <FiHeart aria-hidden="true" className="text-xl" />
                    {post.engagement.likes}
                </span>
                <span className="flex items-center gap-2">
                    <FiMessageCircle aria-hidden="true" className="text-xl" />
                    {post.engagement.comments}
                </span>
            </div>

            {formatIcon && (
                <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-lg text-white backdrop-blur-sm">
                    {formatIcon}
                </span>
            )}
        </>
    );

    if (post.permalink) {
        return (
            <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden bg-zinc-100 text-left"
                aria-label={post.caption}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            type="button"
            className="group relative aspect-square overflow-hidden bg-zinc-100 text-left"
            aria-label={post.caption}
        >
            {content}
        </button>
    );
}
