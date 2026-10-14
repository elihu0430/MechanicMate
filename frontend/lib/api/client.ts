function getBaseUrl(): string {
  // If explicitly configured with a remote URL, prioritize it
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl.length > 0 && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    let url = envUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, "");
  }

  // If in browser on any remote preview or production deployment (*.vercel.app)
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://fastapibackend-production-b599.up.railway.app";
  }

  if (process.env.NODE_ENV === "production") {
    return "https://fastapibackend-production-b599.up.railway.app";
  }

  return (envUrl || "http://localhost:8000").replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token && typeof token === "string" && token.trim().length > 0 && token !== "undefined" && token !== "null") {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    headers,
    ...rest,
  });

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON error
    }
    const message = errorData?.detail || `API request failed with status ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  return response.json();
}
