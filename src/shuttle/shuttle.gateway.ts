import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ShuttleGateway {
  @WebSocketServer()
  server: Server;

  // รับพิกัดจากคนขับรถ แล้วกระจายให้ผู้โดยสารทุกคนที่ดูแผนที่อยู่
  @SubscribeMessage('updateLocation')
  handleLocationUpdate(@MessageBody() data: { shuttleId: string; lat: number; lng: number }) {
    // ส่งพิกัดออกไปให้ทุกคนที่ฟัง Event 'locationUpdated' อยู่
    this.server.emit('locationUpdated', data);
    return { event: 'locationUpdated', status: 'success' };
  }
}