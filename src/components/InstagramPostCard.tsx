import type { InstagramPost } from "../types/instagram";

type InstagramPostCardProps = {
    post: InstagramPost;
};

export function InstagramPostCard({ post }: InstagramPostCardProps) {
    const content = (
        <>
            <img
                src={post.imageUrl}
                alt={post.caption}
                className="h-full w-full object-cover"
                loading="lazy"
            />

            <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                <span>{post.engagement.likes} likes</span>
                <span>{post.engagement.comments} comments</span>
            </div>

            {post.format !== "Post" && (
                <span className="absolute right-2 top-2 rounded-sm bg-black/65 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {post.format}
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
