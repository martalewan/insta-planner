export type InstagramPost = {
    id: string;
    imageUrl: string;
    caption: string;
    date: string;
    format: "Post" | "Carousel" | "Reel";
    permalink?: string;
    username?: string;
    engagement: {
        likes: number;
        comments: number;
    };
};
