import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ClickUpService } from './clickup.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private clickUpService: ClickUpService,
  ) {}

  async postTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    const savedTicket = await this.ticketRepository.save(ticket);
    try {
      const clickupTask =
        await this.clickUpService.createTaskFromTicket(savedTicket);
      savedTicket.clickupId = clickupTask.id;
      return await this.ticketRepository.save(savedTicket);
    } catch (error) {
      console.error('Failed to create ClickUp task:', error.message);
      return savedTicket;
    }
  }

  async getTicket(id: string): Promise<Ticket> {
    return await this.ticketRepository.findOne({ where: { id } });
  }

  async listTickets(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
