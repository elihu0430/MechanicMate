const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

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
