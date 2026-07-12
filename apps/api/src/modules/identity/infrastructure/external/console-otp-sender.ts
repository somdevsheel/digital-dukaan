import { Injectable, Logger } from "@nestjs/common";
import type { OtpSenderPort } from "../../domain/services/otp-sender.port";

// Local-dev default (SMS_PROVIDER=console). A real MSG91/Twilio adapter is a drop-in
// replacement behind the same OtpSenderPort — see Architecture §12.
@Injectable()
export class ConsoleOtpSender implements OtpSenderPort {
  private readonly logger = new Logger("OTP");

  async send(phone: string, code: string): Promise<void> {
    this.logger.log(`OTP for ${phone}: ${code}`);
  }
}
