/* eslint-disable @typescript-eslint/no-unsafe-function-type */
"use client";
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";
    this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const listeners = this.listeners.get(message.type) || [];
      listeners.forEach((listener) => listener(message.data));
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(token), 3000); // Reconnect
    };
  }

  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  unsubscribe(eventType: string, callback: Function) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new WebSocketClient();
