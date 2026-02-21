import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('')
  postTicket(@Body() body: any) {
    return this.ticketService.postTicket(body);
  }

  @Get(':id')
  getTicket(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @Get('')
  listTickets() {
    return this.ticketService.listTickets();
  }
}
