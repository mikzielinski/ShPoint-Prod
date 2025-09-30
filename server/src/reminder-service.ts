import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email.js';
import { createIcsEvent, createGoogleCalendarUrl, createOutlookCalendarUrl } from './calendar-generator.js';

const prisma = new PrismaClient();

export interface ReminderData {
  id: string;
  gameId: string;
  userId: string;
  type: 'EMAIL' | 'PUSH_NOTIFICATION' | 'BOTH';
  reminderTime: Date;
  game: {
    id: string;
    scheduledDate: Date;
    location: string;
    mission: {
      name: string;
    };
    player1: {
      name?: string;
      username?: string;
      email: string;
    };
    player2: {
      name?: string;
      username?: string;
      email: string;
    };
  };
}

export async function sendGameReminder(reminderData: ReminderData): Promise<boolean> {
  try {
    const { game, type } = reminderData;
    
    // Generate calendar events
    const calendarEvents = {
      ics: createIcsEvent(game),
      google: createGoogleCalendarUrl(game),
      outlook: createOutlookCalendarUrl(game)
    };

    if (type === 'EMAIL' || type === 'BOTH') {
      await sendReminderEmail(game, calendarEvents);
    }

    if (type === 'PUSH_NOTIFICATION' || type === 'BOTH') {
      await sendPushNotification(game);
    }

    // Mark reminder as sent
    await prisma.gameReminder.update({
      where: { id: reminderData.id },
      data: {
        isSent: true,
        sentAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending game reminder:', error);
    return false;
  }
}

async function sendReminderEmail(game: any, calendarEvents: any): Promise<void> {
  const player1Name = game.player1.name || game.player1.username || 'Player 1';
  const player2Name = game.player2.name || game.player2.username || 'Player 2';
  const gameDate = new Date(game.scheduledDate).toLocaleString();
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Game Reminder - ShPoint</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .game-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #007bff; }
        .calendar-links { margin: 20px 0; }
        .calendar-btn { 
          display: inline-block; 
          padding: 10px 20px; 
          margin: 5px; 
          background: #007bff; 
          color: white; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
        }
        .google-btn { background: #4285f4; }
        .outlook-btn { background: #0078d4; }
        .ics-btn { background: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎮 Game Reminder</h1>
          <p>Your ShPoint game is coming up!</p>
        </div>
        
        <div class="content">
          <div class="game-info">
            <h3>Game Details</h3>
            <p><strong>Players:</strong> ${player1Name} vs ${player2Name}</p>
            <p><strong>Mission:</strong> ${game.mission.name}</p>
            <p><strong>Date & Time:</strong> ${gameDate}</p>
            <p><strong>Location:</strong> ${game.location || 'TBD'}</p>
          </div>
          
          <div class="calendar-links">
            <h3>📅 Add to Calendar</h3>
            <a href="${calendarEvents.google}" class="calendar-btn google-btn" target="_blank">
              📅 Google Calendar
            </a>
            <a href="${calendarEvents.outlook}" class="calendar-btn outlook-btn" target="_blank">
              📅 Outlook
            </a>
            <a href="data:text/calendar;charset=utf8,${encodeURIComponent(calendarEvents.ics)}" 
               class="calendar-btn ics-btn" download="shpoint-game.ics">
              📅 Download ICS
            </a>
          </div>
          
          <p>Good luck and may the Force be with you!</p>
        </div>
        
        <div class="footer">
          <p>This is an automated reminder from ShPoint</p>
          <p>Visit us at <a href="https://shpoint.org">shpoint.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: [game.player1.email, game.player2.email],
    subject: `🎮 Game Reminder: ${game.mission.name} - ${gameDate}`,
    html: emailHtml
  });
}

async function sendPushNotification(game: any): Promise<void> {
  // TODO: Implement push notifications
  // This would integrate with Firebase Cloud Messaging or similar service
  console.log('Push notification would be sent for game:', game.id);
}

export async function processScheduledReminders(): Promise<void> {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find reminders that should be sent
    const reminders = await prisma.gameReminder.findMany({
      where: {
        isSent: false,
        reminderTime: {
          gte: now,
          lte: fiveMinutesFromNow
        }
      },
      include: {
        game: {
          include: {
            mission: {
              select: {
                name: true
              }
            },
            player1: {
              select: {
                name: true,
                username: true,
                email: true
              }
            },
            player2: {
              select: {
                name: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log(`Processing ${reminders.length} scheduled reminders`);

    for (const reminder of reminders) {
      await sendGameReminder({
        id: reminder.id,
        gameId: reminder.gameId,
        userId: reminder.userId,
        type: reminder.type as any,
        reminderTime: reminder.reminderTime,
        game: reminder.game
      });
    }
  } catch (error) {
    console.error('Error processing scheduled reminders:', error);
  }
}

// Run reminder processor every 5 minutes
setInterval(processScheduledReminders, 5 * 60 * 1000);

export default {
  sendGameReminder,
  processScheduledReminders
};
