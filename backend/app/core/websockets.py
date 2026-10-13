from typing import Dict, List, Set
from fastapi import WebSocket
import json

class WebSocketManager:
    def __init__(self):
        # Workshop rooms: workshop_id -> set of active WebSockets
        self.workshop_connections: Dict[str, Set[WebSocket]] = {}
        # OBD telemetry channels: vehicle_id -> set of active WebSockets
        self.obd_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_workshop(self, websocket: WebSocket, workshop_id: str):
        await websocket.accept()
        if workshop_id not in self.workshop_connections:
            self.workshop_connections[workshop_id] = set()
        self.workshop_connections[workshop_id].add(websocket)

    def disconnect_workshop(self, websocket: WebSocket, workshop_id: str):
        if workshop_id in self.workshop_connections:
            self.workshop_connections[workshop_id].discard(websocket)
            if not self.workshop_connections[workshop_id]:
                del self.workshop_connections[workshop_id]

    async def broadcast_workshop(self, workshop_id: str, message: dict):
        if workshop_id in self.workshop_connections:
            payload = json.dumps(message)
            dead_sockets = set()
            for ws in self.workshop_connections[workshop_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.workshop_connections[workshop_id].discard(ws)

    async def connect_obd(self, websocket: WebSocket, vehicle_id: str):
        await websocket.accept()
        if vehicle_id not in self.obd_connections:
            self.obd_connections[vehicle_id] = set()
        self.obd_connections[vehicle_id].add(websocket)

    def disconnect_obd(self, websocket: WebSocket, vehicle_id: str):
        if vehicle_id in self.obd_connections:
            self.obd_connections[vehicle_id].discard(websocket)
            if not self.obd_connections[vehicle_id]:
                del self.obd_connections[vehicle_id]

    async def broadcast_obd(self, vehicle_id: str, data: dict):
        if vehicle_id in self.obd_connections:
            payload = json.dumps(data)
            dead_sockets = set()
            for ws in self.obd_connections[vehicle_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.obd_connections[vehicle_id].discard(ws)

ws_manager = WebSocketManager()
