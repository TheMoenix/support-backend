import { Injectable } from '@nestjs/common';

@Injectable()
export class TicketService {
  postTicket(body: any) {
    return { message: 'Ticket created', data: body };
  }

  getTicket(id: string) {
    return { message: 'Ticket retrieved', id };
  }

  listTickets() {
    return { message: 'All tickets', tickets: [] };
  }
}
