import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tickets',
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`[TicketsGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[TicketsGateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinOrganization')
  handleJoinOrganization(
    @ConnectedSocket() client: Socket,
    @MessageBody() organizationId: string,
  ) {
    console.log(`[TicketsGateway] Client ${client.id} joining room ${organizationId}`);
    if (organizationId) {
      client.join(organizationId);
    }
  }

  broadcastTicketUpdate(organizationId: string, event: string, payload: any) {
    console.log(`[TicketsGateway] Broadcasting ${event} to room ${organizationId}`);
    this.server.to(organizationId).emit(event, payload);
  }
}
