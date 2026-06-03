import crypto from "node:crypto";
import fs from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";

type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

type InstagramApiPost = {
  id: string;
  caption?: string;
  comments_count?: number;
  like_count?: number;
  media_type: InstagramMediaType;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
};

type InstagramMediaResponse = {
  data?: InstagramApiPost[];
  error?: {
    message?: string;
  };
  paging?: {
    next?: string;
  };
};

type InstagramAccount = {
  account_type?: string;
  id?: string;
  media_count?: number;
  profile_picture_url?: string;
  username?: string;
  error?: {
    message?: string;
  };
};

type InstagramShortTokenResponse = {
  access_token?: string;
  error_message?: string;
  user_id?: string;
};

type InstagramLongTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: {
    message?: string;
  };
};

type TokenConnectBody = {
  accessToken?: string;
};

type StoredInstagramConnection = {
  account: InstagramAccount;
  encryptedAccessToken: string;
  tokenExpiresAt: string | null;
  updatedAt: string;
};

type PrivateEnv = Record<string, string>;

const cwd = process.cwd();
const dataDir = path.join(cwd, ".data");
const connectionPath = path.join(dataDir, "instagram-account.json");
const defaultScopes = "instagram_business_basic";
const pendingOAuthStates = new Set<string>();

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseEnvFile(contents: string) {
  return contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce<PrivateEnv>((env, line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");

      env[key] = value;
      return env;
    }, {});
}

async function loadPrivateEnv() {
  const env: PrivateEnv = {};

  for (const file of [".env", ".env.local"]) {
    try {
      const contents = await fs.readFile(path.join(cwd, file), "utf-8");
      Object.assign(env, parseEnvFile(contents));
    } catch {
      // Optional env files are ignored.
    }
  }

  return {
    ...env,
    ...process.env,
  } as PrivateEnv;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

async function redirectToFrontend(res: ServerResponse, query: string) {
  const env = await loadPrivateEnv();
  const frontendUrl = env.FRONTEND_URL || "http://127.0.0.1:5173";

  redirect(res, `${frontendUrl}/?${query}`);
}

function requireEnv(env: PrivateEnv, key: string) {
  const value = env[key];

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function getInstagramClientId(env: PrivateEnv) {
  return env.INSTAGRAM_CLIENT_ID || env.META_APP_ID || "";
}

function getInstagramClientSecret(env: PrivateEnv) {
  return env.INSTAGRAM_CLIENT_SECRET || env.META_APP_SECRET || "";
}

function requireInstagramClientId(env: PrivateEnv) {
  const value = getInstagramClientId(env);

  if (!value) {
    throw new Error("INSTAGRAM_CLIENT_ID is required.");
  }

  return value;
}

function requireInstagramClientSecret(env: PrivateEnv) {
  const value = getInstagramClientSecret(env);

  if (!value) {
    throw new Error("INSTAGRAM_CLIENT_SECRET is required.");
  }

  return value;
}

function encryptionKey(env: PrivateEnv) {
  const secret = env.TOKEN_ENCRYPTION_KEY || env.SESSION_SECRET || "local-dev-secret";

  return crypto.createHash("sha256").update(secret).digest();
}

function encryptToken(token: string, env: PrivateEnv) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(env), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptToken(payload: string, env: PrivateEnv) {
  const [ivValue, authTagValue, encryptedValue] = payload.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Stored Instagram token is invalid.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(env),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf-8");
}

async function loadStoredConnection() {
  try {
    const contents = await fs.readFile(connectionPath, "utf-8");

    return JSON.parse(contents) as StoredInstagramConnection;
  } catch {
    return null;
  }
}

async function saveStoredConnection(connection: StoredInstagramConnection) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(connectionPath, `${JSON.stringify(connection, null, 2)}\n`, "utf-8");
}

async function removeStoredConnection() {
  try {
    await fs.unlink(connectionPath);
  } catch {
    // Missing connection is already disconnected.
  }
}

function toPlannerFormat(post: InstagramApiPost) {
  const imageUrl =
    post.media_type === "VIDEO"
      ? post.thumbnail_url || post.media_url
      : post.media_url || post.thumbnail_url;

  return {
    id: post.id,
    imageUrl,
    caption: post.caption || "Instagram post",
    date: post.timestamp || new Date().toISOString(),
    format:
      post.media_type === "CAROUSEL_ALBUM"
        ? "Carousel"
        : post.media_type === "VIDEO"
          ? "Reel"
          : "Post",
    permalink: post.permalink,
    username: post.username,
    engagement: {
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
    },
  };
}

async function getAccessToken(env: PrivateEnv) {
  const storedConnection = await loadStoredConnection();

  if (storedConnection) {
    return decryptToken(storedConnection.encryptedAccessToken, env);
  }

  return null;
}

async function fetchInstagramAccount(accessToken: string) {
  async function fetchAccount(fields: string) {
    const url = new URL("https://graph.instagram.com/me");
    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url);
    const data = (await response.json()) as InstagramAccount;

    return { data, ok: response.ok };
  }

  const result = await fetchAccount("id,username,account_type,media_count,profile_picture_url");

  if (result.ok) {
    return result;
  }

  return fetchAccount("id,username,account_type,media_count");
}

function toClientAccount(account: InstagramAccount) {
  return {
    account_type: account.account_type,
    id: account.id,
    media_count: account.media_count,
    profilePictureUrl: account.profile_picture_url,
    username: account.username,
  };
}

async function exchangeCodeForShortToken(env: PrivateEnv, code: string) {
  const form = new URLSearchParams();
  form.set("client_id", requireInstagramClientId(env));
  form.set("client_secret", requireInstagramClientSecret(env));
  form.set("grant_type", "authorization_code");
  form.set("redirect_uri", requireEnv(env, "INSTAGRAM_REDIRECT_URI"));
  form.set("code", code);

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    body: form,
    method: "POST",
  });
  const data = (await response.json()) as InstagramShortTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_message || "Instagram authorization failed.");
  }

  return data.access_token;
}

async function exchangeForLongLivedToken(env: PrivateEnv, shortToken: string) {
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", requireInstagramClientSecret(env));
  url.searchParams.set("access_token", shortToken);

  const response = await fetch(url);
  const data = (await response.json()) as InstagramLongTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message || "Instagram token exchange failed.");
  }

  return data;
}

async function handleAuthStart(res: ServerResponse) {
  const env = await loadPrivateEnv();

  if (!getInstagramClientId(env) || !getInstagramClientSecret(env) || !env.INSTAGRAM_REDIRECT_URI) {
    redirect(res, "/?instagram_error=instagram_oauth_not_configured");
    return;
  }

  const appId = getInstagramClientId(env);
  const redirectUri = env.INSTAGRAM_REDIRECT_URI;
  const state = crypto.randomBytes(24).toString("base64url");
  const url = new URL(env.INSTAGRAM_AUTH_URL || "https://www.instagram.com/oauth/authorize");

  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", env.INSTAGRAM_SCOPES || defaultScopes);
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");

  pendingOAuthStates.add(state);
  redirect(res, url.toString());
}

async function handleAuthCallback(res: ServerResponse, url: URL) {
  const returnedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (error) {
    redirectToFrontend(res, `instagram_error=${encodeURIComponent(error)}`);
    return;
  }

  if (!code || !returnedState || !pendingOAuthStates.has(returnedState)) {
    redirectToFrontend(res, "instagram_error=invalid_oauth_state");
    return;
  }

  pendingOAuthStates.delete(returnedState);

  try {
    const env = await loadPrivateEnv();
    const shortToken = await exchangeCodeForShortToken(env, code);
    const longToken = await exchangeForLongLivedToken(env, shortToken);
    const longAccessToken = longToken.access_token;

    if (!longAccessToken) {
      throw new Error("Instagram token exchange did not return an access token.");
    }

    const accountResult = await fetchInstagramAccount(longAccessToken);

    if (!accountResult.ok) {
      throw new Error(accountResult.data.error?.message || "Instagram account could not be loaded.");
    }

    const tokenExpiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null;

    await saveStoredConnection({
      account: accountResult.data,
      encryptedAccessToken: encryptToken(longAccessToken, env),
      tokenExpiresAt,
      updatedAt: new Date().toISOString(),
    });

    redirectToFrontend(res, "instagram_connected=true");
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Instagram account could not be connected.";
    redirectToFrontend(res, `instagram_error=${encodeURIComponent(message)}`);
  }
}

async function handleAccount(res: ServerResponse) {
  const env = await loadPrivateEnv();
  const storedConnection = await loadStoredConnection();
  const accessToken = await getAccessToken(env);
  const oauthConfigured = Boolean(
    getInstagramClientId(env) && getInstagramClientSecret(env) && env.INSTAGRAM_REDIRECT_URI,
  );

  if (!accessToken) {
    sendJson(res, 200, {
      configured: false,
      oauthConfigured,
      account: null,
    });
    return;
  }

  if (storedConnection) {
    const accountResult = await fetchInstagramAccount(accessToken);
    const account = accountResult.ok ? accountResult.data : storedConnection.account;

    if (accountResult.ok) {
      await saveStoredConnection({
        ...storedConnection,
        account,
        updatedAt: new Date().toISOString(),
      });
    }

    sendJson(res, 200, {
      configured: true,
      oauthConfigured,
      account: toClientAccount(account),
      tokenExpiresAt: storedConnection.tokenExpiresAt,
    });
    return;
  }

  const result = await fetchInstagramAccount(accessToken);

  if (!result.ok) {
    sendJson(res, 502, {
      configured: true,
      account: null,
      error: result.data.error?.message || "Instagram account could not be loaded.",
    });
    return;
  }

  sendJson(res, 200, {
    configured: true,
    oauthConfigured,
    account: toClientAccount(result.data),
  });
}

async function handleMedia(res: ServerResponse) {
  const env = await loadPrivateEnv();
  const accessToken = await getAccessToken(env);

  if (!accessToken) {
    sendJson(res, 200, {
      configured: false,
      posts: [],
    });
    return;
  }

  const token = accessToken;
  const fieldsWithEngagement =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count";
  const fieldsWithoutEngagement =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username";
  const mediaLimit = readPositiveInteger(env.INSTAGRAM_MEDIA_LIMIT, 500);

  async function fetchInstagramPage(fields: string, nextUrl?: string) {
    const url = new URL("https://graph.instagram.com/me/media");
    const requestUrl = nextUrl ? new URL(nextUrl) : url;

    if (!nextUrl) {
      requestUrl.searchParams.set("fields", fields);
      requestUrl.searchParams.set("limit", "100");
      requestUrl.searchParams.set("access_token", token);
    }

    const response = await fetch(requestUrl);
    const data = (await response.json()) as InstagramMediaResponse;

    return { data, ok: response.ok };
  }

  async function fetchInstagramMedia(fields: string) {
    const posts: InstagramApiPost[] = [];
    let nextUrl: string | undefined;
    let result = await fetchInstagramPage(fields);

    if (!result.ok) {
      return result;
    }

    posts.push(...(result.data.data || []));
    nextUrl = result.data.paging?.next;

    while (nextUrl && posts.length < mediaLimit) {
      result = await fetchInstagramPage(fields, nextUrl);

      if (!result.ok) {
        return result;
      }

      posts.push(...(result.data.data || []));
      nextUrl = result.data.paging?.next;
    }

    return {
      data: {
        data: posts.slice(0, mediaLimit),
      },
      ok: true,
    };
  }

  try {
    let result = await fetchInstagramMedia(fieldsWithEngagement);

    if (!result.ok) {
      result = await fetchInstagramMedia(fieldsWithoutEngagement);
    }

    if (!result.ok) {
      sendJson(res, 502, {
        configured: true,
        error: result.data?.error?.message || "Instagram media could not be loaded.",
      });
      return;
    }

    const posts = (result.data?.data || [])
      .map(toPlannerFormat)
      .filter((post) => Boolean(post.imageUrl));

    sendJson(res, 200, {
      configured: true,
      total: posts.length,
      posts,
    });
  } catch (error) {
    sendJson(res, 500, {
      configured: true,
      error:
        error instanceof Error
          ? error.message
          : "Instagram media could not be loaded.",
    });
  }
}

async function handleDisconnect(res: ServerResponse) {
  await removeStoredConnection();
  sendJson(res, 200, { configured: false, account: null });
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8")) as T;
}

async function handleTokenConnect(req: IncomingMessage, res: ServerResponse) {
  try {
    const env = await loadPrivateEnv();
    const body = await readJsonBody<TokenConnectBody>(req);
    const accessToken = body.accessToken?.trim();

    if (!accessToken) {
      sendJson(res, 400, { error: "Access token is required." });
      return;
    }

    if (accessToken.includes("•") || accessToken.toLowerCase().includes("secret")) {
      sendJson(res, 400, {
        error: "Paste the generated Instagram access token, not the app secret or hidden dots.",
      });
      return;
    }

    const accountResult = await fetchInstagramAccount(accessToken);

    if (!accountResult.ok) {
      sendJson(res, 400, {
        error: accountResult.data.error?.message || "Instagram token could not be verified.",
      });
      return;
    }

    await saveStoredConnection({
      account: accountResult.data,
      encryptedAccessToken: encryptToken(accessToken, env),
      tokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
    });

    sendJson(res, 200, {
      configured: true,
      account: toClientAccount(accountResult.data),
    });
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Instagram account could not be connected.",
    });
  }
}

async function handleWebhookVerification(res: ServerResponse, url: URL) {
  const env = await loadPrivateEnv();
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "insta_planner_verify_token_2026";

  if (mode === "subscribe" && token === verifyToken && challenge) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end(challenge);
    return;
  }

  sendJson(res, 403, { error: "Webhook verification failed." });
}

async function handleWebhookEvent(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  console.log("Instagram webhook event:", Buffer.concat(chunks).toString("utf-8"));
  sendJson(res, 200, { received: true });
}

async function route(req: IncomingMessage, res: ServerResponse) {
  const requestUrl = new URL(req.url || "/", "http://localhost");

  try {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/instagram/auth/start") {
      await handleAuthStart(res);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/instagram/auth/callback") {
      await handleAuthCallback(res, requestUrl);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/instagram/account") {
      await handleAccount(res);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/instagram/media") {
      await handleMedia(res);
      return;
    }

    if (req.method === "DELETE" && requestUrl.pathname === "/api/instagram/connect") {
      await handleDisconnect(res);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/instagram/connect") {
      await handleTokenConnect(req, res);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/instagram/webhook") {
      await handleWebhookVerification(res, requestUrl);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/instagram/webhook") {
      await handleWebhookEvent(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected server error.",
    });
  }
}

const port = Number(process.env.PORT || 4000);

http.createServer((req, res) => {
  void route(req, res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Instagram API server running on http://localhost:${port}`);
});
