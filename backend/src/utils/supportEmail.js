import Cloudflare from 'cloudflare/index.js';
import { escapeHtml } from './escapeHtml.js';

const CLOUDFLARE_ACCOUNT_ID = 'a6dbd6263cba6aeb30176d034c765748';
const SUPPORT_INBOX_PATH = '/dashboard/support';

function getSupportInboxUrl(conversationId) {
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const query = conversationId ? `?conversation=${encodeURIComponent(conversationId)}` : '';

  return frontendUrl ? `${frontendUrl}${SUPPORT_INBOX_PATH}${query}` : `${SUPPORT_INBOX_PATH}${query}`;
}

export async function notifyNewSupportConversation(conversation) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const to = process.env.SUPPORT_NOTIFY_EMAIL;
  const apiToken = process.env.CLOUDFLARE_KEY;

  if (!to || !apiToken) {
    return;
  }

  const customer = conversation.user || {};
  const firstMessage = conversation.messages?.[conversation.messages.length - 1];
  const inboxUrl = getSupportInboxUrl(conversation._id);
  const customerName = customer.username || customer.email || 'RiverIQ customer';
  const messagePreview = firstMessage?.body || '';

  const client = new Cloudflare({
    apiToken,
  });

  await client.emailSending.send({
    account_id: CLOUDFLARE_ACCOUNT_ID,
    from: 'RiverIQ Support <support@riveriq.app>',
    to,
    subject: `New RiverIQ support message from ${customerName}`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background: #0a111b; color: #dce2e8; padding: 28px">
        <div style="max-width: 620px; margin: 0 auto; background: #111a24; border: 1px solid #243241; border-radius: 14px; overflow: hidden">
          <div style="padding: 22px 24px; border-bottom: 1px solid #243241">
            <h1 style="margin: 0; color: #ffffff; font-size: 22px">New RiverIQ support message</h1>
          </div>
          <div style="padding: 24px">
            <p style="margin: 0 0 12px"><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
            <p style="margin: 0 0 12px"><strong>Email:</strong> ${escapeHtml(customer.email || 'Unknown')}</p>
            <p style="margin: 0 0 12px"><strong>Topic:</strong> ${escapeHtml(conversation.topic || 'General')}</p>
            <p style="margin: 0 0 18px"><strong>Page:</strong> ${escapeHtml(conversation.page || 'Unknown')}</p>
            <div style="padding: 14px 16px; background: #0d1722; border: 1px solid #243241; border-radius: 10px; line-height: 1.5">
              ${escapeHtml(messagePreview)}
            </div>
            <p style="margin: 22px 0 0">
              <a href="${escapeHtml(inboxUrl)}" style="display: inline-block; padding: 12px 16px; background: #39ff64; color: #04180b; border-radius: 9px; font-weight: 700; text-decoration: none">
                Open support inbox
              </a>
            </p>
          </div>
        </div>
      </div>
    `,
    text: [
      'New RiverIQ support message',
      `Customer: ${customerName}`,
      `Email: ${customer.email || 'Unknown'}`,
      `Topic: ${conversation.topic || 'General'}`,
      `Page: ${conversation.page || 'Unknown'}`,
      '',
      messagePreview,
      '',
      `Open inbox: ${inboxUrl}`,
    ].join('\n'),
  });
}
