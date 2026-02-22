import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Ticket } from './ticket.entity';
import { ClickUpService } from './clickup.service';

@Injectable()
export class TicketCronService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private clickUpService: ClickUpService,
  ) {}

  /**
   * Cron job to send tickets without ClickUp ID to ClickUp
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncTicketsToClickUp() {
    console.log('Starting sync: Sending tickets without ClickUp ID...');

    try {
      // Find all tickets that don't have a ClickUp ID
      const ticketsWithoutClickUpId = await this.ticketRepository.find({
        where: { clickupId: IsNull() },
      });

      if (ticketsWithoutClickUpId.length === 0) {
        console.log('No tickets to sync to ClickUp');
        return;
      }

      console.log(
        `Found ${ticketsWithoutClickUpId.length} tickets to sync to ClickUp`,
      );

      for (const ticket of ticketsWithoutClickUpId) {
        try {
          const clickupTask =
            await this.clickUpService.createTaskFromTicket(ticket);
          ticket.clickupId = clickupTask.id;
          await this.ticketRepository.save(ticket);
          console.log(
            `Successfully synced ticket ${ticket.id} to ClickUp (Task ID: ${clickupTask.id})`,
          );
        } catch (error) {
          console.error(
            `Failed to sync ticket ${ticket.id} to ClickUp: ${error.message}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `Error during ClickUp sync job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cron job to sync ticket status from ClickUp
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncStatusFromClickUp() {
    console.log('Starting sync: Updating ticket statuses from ClickUp...');

    try {
      // Find all tickets that have a ClickUp ID
      const ticketsWithClickUpId = await this.ticketRepository.find({
        where: { clickupId: Not(IsNull()) },
      });

      if (ticketsWithClickUpId.length === 0) {
        console.log('No tickets with ClickUp ID to sync');
        return;
      }

      console.log(
        `Found ${ticketsWithClickUpId.length} tickets to sync from ClickUp`,
      );

      for (const ticket of ticketsWithClickUpId) {
        try {
          const clickupTask = await this.clickUpService.getTaskById(
            ticket.clickupId,
          );
          const clickupStatus = clickupTask.status?.status?.toLowerCase();

          if (!clickupStatus) {
            console.log(`No status found for ClickUp task ${ticket.clickupId}`);
            continue;
          }

          // Map ClickUp status to local status
          const statusMapping: Record<string, Ticket['status']> = {
            'to do': 'open',
            open: 'open',
            'in progress': 'in-progress',
            'in-progress': 'in-progress',
            complete: 'closed',
            completed: 'closed',
            closed: 'closed',
            resolved: 'resolved',
          };

          const mappedStatus = statusMapping[clickupStatus] || ticket.status;

          if (mappedStatus !== ticket.status) {
            const oldStatus = ticket.status;
            ticket.status = mappedStatus;
            await this.ticketRepository.save(ticket);
            console.log(
              `Updated ticket ${ticket.id} status from ${oldStatus} to ${mappedStatus} (ClickUp: ${clickupStatus})`,
            );
          }
        } catch (error) {
          console.error(
            `Failed to sync status for ticket ${ticket.id} from ClickUp: ${error.message}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `Error during status sync job: ${error.message}`,
        error.stack,
      );
    }
  }
}
