import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Ticket } from './ticket.entity';

@Injectable()
export class ClickUpService {
  private readonly clickupApiUrl = 'https://api.clickup.com/api/v2';
  private readonly clickupApiKey: string;
  private readonly clickupListId: string;

  constructor() {
    this.clickupApiKey = process.env.CLICKUP_API_KEY || '';
    this.clickupListId = process.env.CLICKUP_LIST_ID || '';
  }

  async createTaskFromTicket(ticket: Ticket): Promise<any> {
    const response = await axios.post(
      `${this.clickupApiUrl}/list/${this.clickupListId}/task`,
      {
        name: ticket.subject,
        description: `From: ${ticket.name} (${ticket.email})\n\nMessage:\n${ticket.message}`,
      },
      {
        headers: {
          Authorization: this.clickupApiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }
}
