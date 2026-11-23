import { pino, type DestinationStream, type Level, type Logger } from 'pino';

interface RequestLike {
  method?: string;
  url?: string;
  host?: string;
  ip?: string;
}

interface ReplyLike {
  statusCode?: number;
}

export function stripQuery(url: string | undefined): string | undefined {
  return url?.split('?', 1)[0];
}

export function createLogger(options: { level: Level | 'silent' }, destination?: DestinationStream): Logger {
  return pino(
    {
      level: options.level,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[redacted]',
      },
      serializers: {
        req: (req: RequestLike) => ({
          method: req.method,
          url: stripQuery(req.url),
          host: req.host,
          remoteAddress: req.ip,
        }),
        res: (reply: ReplyLike) => ({ statusCode: reply.statusCode }),
        err: pino.stdSerializers.err,
      },
    },
    destination,
  );
}
