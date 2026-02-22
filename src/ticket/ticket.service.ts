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

  async handleWebhook(payload: any): Promise<void> {
    try {
      const taskId = payload.task_id;
      const newStatus = payload.history_items?.[0]?.after?.status;

      if (!taskId || !newStatus) {
        console.warn('Invalid webhook payload: missing task_id or status');
        return;
      }

      const ticket = await this.ticketRepository.findOne({
        where: { clickupId: taskId },
      });
      if (!ticket) {
        console.warn(`No ticket found for ClickUp task ID: ${taskId}`);
        return;
      }

      const statusMapping: Record<string, Ticket['status']> = {
        'to do': 'open',
        'in progress': 'in-progress',
        complete: 'closed',
      };

      const mappedStatus =
        statusMapping[newStatus.toLowerCase()] || ticket.status;

      if (mappedStatus !== ticket.status) {
        ticket.status = mappedStatus;
        await this.ticketRepository.save(ticket);
        console.log(`Updated ticket ${ticket.id} status to ${mappedStatus}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook:', error.message);
      throw error;
    }
  }
}
