import { createTransport, type Transporter } from 'nodemailer';
import { mailEnv, parseEnv } from './env.ts';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

interface Connection {
  transport: Transporter;
  from: string;
}

let connection: Connection | undefined;

function connect(): Connection {
  if (!connection) {
    const env = parseEnv(mailEnv, process.env);
    connection = { transport: createTransport(env.SMTP_URL), from: env.MAIL_FROM };
  }
  return connection;
}

export async function sendMail(mail: Mail): Promise<void> {
  const { transport, from } = connect();
  await transport.sendMail({ from, ...mail });
}
