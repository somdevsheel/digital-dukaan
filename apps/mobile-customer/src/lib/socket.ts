import { io, type Socket } from "socket.io-client";
import { REALTIME_URL } from "./config";
import { getAccessToken } from "./token-store";

// One shared connection for the whole app session — screens join/leave rooms as they
// mount/unmount rather than each opening its own socket (Architecture §14: order:{orderId},
// delivery:{partnerId}, business:{businessId} rooms, scoped-join authorized against the same
// JWT the REST API uses).
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(REALTIME_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

export function joinOrderTracking(orderId: string): void {
  connectSocket().emit("join", { room: orderRoom(orderId) });
}

export function leaveOrderTracking(orderId: string): void {
  socket?.emit("leave", { room: orderRoom(orderId) });
}
