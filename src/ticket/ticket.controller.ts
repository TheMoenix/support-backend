import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './ticket.entity';
import { TicketService } from './services/ticket.service';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('')
  postTicket(@Body() createTicketDto: CreateTicketDto): Promise<Ticket> {
    return this.ticketService.postTicket(createTicketDto);
  }

  @Get(':id')
  getTicket(@Param('id') id: string): Promise<Ticket> {
    return this.ticketService.getTicket(id);
  }

  @Get('')
  listTickets(): Promise<Ticket[]> {
    return this.ticketService.listTickets();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any): Promise<{ success: boolean }> {
    try {
      await this.ticketService.handleWebhook(payload);
      return { success: true };
    } catch (error) {
      console.error('Webhook processing failed:', error.message);
      return { success: false };
    }
  }
}
