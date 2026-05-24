import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('EventsGateway');
  private connectedClients = new Map<string, { userId: string; organizationId: string }>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuth(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string; organizationId: string }) {
    this.connectedClients.set(client.id, { userId: data.userId, organizationId: data.organizationId });
    client.join(`org:${data.organizationId}`);
    client.join(`user:${data.userId}`);
    client.emit('authenticated', { status: 'ok' });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { channel: string }) {
    client.join(data.channel);
    client.emit('subscribed', { channel: data.channel });
  }

  emitToOrganization(organizationId: string, event: string, data: unknown) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToChannel(channel: string, event: string, data: unknown) {
    this.server.to(channel).emit(event, data);
  }

  notifyDataUpdate(organizationId: string, entityType: string, action: string, entityId: string) {
    this.emitToOrganization(organizationId, 'data:update', {
      entityType,
      action,
      entityId,
      timestamp: new Date().toISOString(),
    });
  }

  notifyNotification(userId: string, notification: { title: string; message: string; type: string }) {
    this.emitToUser(userId, 'notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  getConnectedCount(organizationId?: string): number {
    if (!organizationId) return this.connectedClients.size;
    return Array.from(this.connectedClients.values()).filter((c) => c.organizationId === organizationId).length;
  }
}
