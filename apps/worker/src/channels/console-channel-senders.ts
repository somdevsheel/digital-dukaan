import { Injectable, Logger } from "@nestjs/common";
import type { ChannelSenderPort, ChannelSendInput } from "./channel-sender.port";

// Local-dev/default implementations — logs instead of calling Firebase/Resend/an SMS
// provider. Real integrations are a swap-in behind ChannelSenderPort (same pattern as
// apps/api's ConsoleOtpSender): this is what makes the queue consumer genuinely
// functional today rather than a stub that silently drops jobs, while being honest that
// no message actually reaches a device yet.
@Injectable()
export class ConsolePushSender implements ChannelSenderPort {
  private readonly logger = new Logger("PushSender");
  async send(input: ChannelSendInput): Promise<void> {
    this.logger.log(`PUSH -> ${input.to} [${input.templateKey}] ${JSON.stringify(input.payload)}`);
  }
}

@Injectable()
export class ConsoleEmailSender implements ChannelSenderPort {
  private readonly logger = new Logger("EmailSender");
  async send(input: ChannelSendInput): Promise<void> {
    this.logger.log(`EMAIL -> ${input.to} [${input.templateKey}] ${JSON.stringify(input.payload)}`);
  }
}

@Injectable()
export class ConsoleSmsSender implements ChannelSenderPort {
  private readonly logger = new Logger("SmsSender");
  async send(input: ChannelSendInput): Promise<void> {
    this.logger.log(`SMS -> ${input.to} [${input.templateKey}] ${JSON.stringify(input.payload)}`);
  }
}
