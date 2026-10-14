function getBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

const API_BASE_URL = getBaseUrl();

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

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
