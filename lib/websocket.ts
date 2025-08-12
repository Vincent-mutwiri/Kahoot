import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface GameRoom {
  gameCode: string;
  clients: Set<WebSocket>;
}

const gameRooms = new Map<string, GameRoom>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const { query } = parse(request.url || '', true);
    const gameCode = query.gameCode as string;

    if (!gameCode) {
      ws.close(1008, 'Game code required');
      return;
    }

    // Join game room
    if (!gameRooms.has(gameCode)) {
      gameRooms.set(gameCode, { gameCode, clients: new Set() });
    }
    
    const room = gameRooms.get(gameCode)!;
    room.clients.add(ws);

    console.log(`Client joined game ${gameCode}. Room size: ${room.clients.size}`);

    ws.on('close', () => {
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        gameRooms.delete(gameCode);
      }
      console.log(`Client left game ${gameCode}. Room size: ${room.clients.size}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      room.clients.delete(ws);
    });
  });

  return wss;
}

export function broadcastToGame(gameCode: string, message: any) {
  const room = gameRooms.get(gameCode);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
    }
  });
}