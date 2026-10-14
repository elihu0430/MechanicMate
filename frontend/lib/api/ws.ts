function getWsBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_WS_URL || "").trim();
  if (!url) {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim();
    if (apiUrl.startsWith("https://")) {
      url = apiUrl.replace(/^https:\/\//i, "wss://");
    } else if (apiUrl.startsWith("http://")) {
      url = apiUrl.replace(/^http:\/\//i, "ws://");
    } else {
      url = `wss://${apiUrl}`;
    }
  } else {
    if (url.startsWith("https://")) {
      url = url.replace(/^https:\/\//i, "wss://");
    } else if (url.startsWith("http://")) {
      url = url.replace(/^http:\/\//i, "ws://");
    } else if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      url = `wss://${url}`;
    }
  }
  return url.replace(/\/+$/, "");
}

const WS_BASE_URL = getWsBaseUrl();

export function createWorkshopWebSocket(
  workshopId: string,
  onMessage: (data: any) => void,
  onError?: (err: Event) => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/workshop/${workshopId}`);

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch {
      onMessage(event.data);
    }
  };

  if (onError) ws.onerror = onError;
  return ws;
}

export function createObdWebSocket(
  vehicleId: string,
  onPidData: (pids: any) => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/obd/${vehicleId}`);

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onPidData(parsed);
    } catch {
      onPidData(event.data);
    }
  };

  return ws;
}
