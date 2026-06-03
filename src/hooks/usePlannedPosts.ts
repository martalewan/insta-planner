import { useEffect, useState } from "react";
import type { PlannedPost } from "../types/plannedPost";

const storageKey = "insta-planner.planned-posts";
const databaseName = "insta-planner";
const databaseVersion = 1;
const storeName = "planned-posts";

const initialPosts: PlannedPost[] = [
    {
        id: "sample-1",
        caption: "Morning reset in Paris. A soft reminder to start small and move with intention.",
        hashtags: ["parislife", "mindfulmoments", "slowmorning"],
        imageUrl: "",
    },
];

function normalizePost(post: PlannedPost): PlannedPost {
    return {
        id: post.id,
        caption: post.caption || "",
        hashtags: post.hashtags || [],
        imageUrl: post.imageUrl || "",
    };
}

function openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(storeName)) {
                database.createObjectStore(storeName, {
                    keyPath: "id",
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllPlannedPosts() {
    const database = await openDatabase();

    return new Promise<PlannedPost[]>((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve((request.result as PlannedPost[]).map(normalizePost));
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

async function savePlannedPost(post: PlannedPost) {
    const database = await openDatabase();

    return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        store.put(normalizePost(post));

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}

async function removePlannedPost(postId: string) {
    const database = await openDatabase();

    return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        store.delete(postId);

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}

function readLegacyLocalStoragePosts() {
    const storedPosts = window.localStorage.getItem(storageKey);

    if (!storedPosts) {
        return [];
    }

    try {
        return (JSON.parse(storedPosts) as PlannedPost[]).map(normalizePost);
    } catch {
        return [];
    }
}

export function usePlannedPosts() {
    const [plannedPosts, setPlannedPosts] = useState<PlannedPost[]>([]);
    const [storageError, setStorageError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadPlannedPosts() {
            try {
                const posts = await getAllPlannedPosts();
                const legacyPosts = readLegacyLocalStoragePosts();

                if (posts.length === 0 && legacyPosts.length > 0) {
                    await Promise.all(legacyPosts.map(savePlannedPost));
                    window.localStorage.removeItem(storageKey);
                }

                if (isMounted) {
                    setPlannedPosts(
                        posts.length > 0
                            ? posts
                            : legacyPosts.length > 0
                              ? legacyPosts
                              : initialPosts,
                    );
                }
            } catch {
                if (isMounted) {
                    setPlannedPosts(initialPosts);
                    setStorageError("Planned posts storage could not be loaded.");
                }
            }
        }

        void loadPlannedPosts();

        return () => {
            isMounted = false;
        };
    }, []);

    function addPlannedPost(post: Omit<PlannedPost, "id">) {
        const nextPost = {
            ...post,
            id: crypto.randomUUID(),
        };

        setPlannedPosts((posts) => [nextPost, ...posts]);
        void savePlannedPost(nextPost).catch(() => {
            setStorageError("This image could not be saved locally.");
        });
    }

    function deletePlannedPost(postId: string) {
        setPlannedPosts((posts) => posts.filter((post) => post.id !== postId));
        void removePlannedPost(postId).catch(() => {
            setStorageError("This planned post could not be deleted locally.");
        });
    }

    return {
        addPlannedPost,
        deletePlannedPost,
        plannedPosts,
        storageError,
    };
}
