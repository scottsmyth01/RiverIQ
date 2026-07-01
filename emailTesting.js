const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// const test1 = `curl -X GET "https://api.cloudflare.com/client/v4/accounts/a6dbd6263cba6aeb30176d034c765748/tokens/verify" \
//      -H "Authorization: Bearer cfat_FseQUw0CgpYSmDRXNq23PUSS4RoVr6PZzF0bPe4E1e6641bc"`;

const welcomeEmail = readFileSync(join(__dirname, 'welcome-email.html'), 'utf8')
  .replaceAll('{{customer_name}}', 'Scott')
  .replaceAll('{{dashboard_url}}', 'https://riveriq.app/dashboard')
  .replaceAll('{{current_year}}', new Date().getFullYear().toString());

const test2Payload = JSON.stringify({
  to: 'ssmythw@outlook.com',
  from: 'admin@riveriq.app',
  subject: 'Welcome to RiverIQ!',
  html: welcomeEmail,
  text: 'Welcome to RiverIQ! Your account is ready. Visit https://riveriq.app/dashboard to get started.',
});

const test2 = `curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/a6dbd6263cba6aeb30176d034c765748/email/sending/send" \
  -H "Authorization: Bearer cfat_FseQUw0CgpYSmDRXNq23PUSS4RoVr6PZzF0bPe4E1e6641bc" \
  -H "Content-Type: application/json" \
  --data-raw ${JSON.stringify(test2Payload)}`;
console.log(test2);
