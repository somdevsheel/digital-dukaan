export interface ChannelSendInput {
  to: string; // phone number, email address, or push token depending on channel
  templateKey: string;
  payload: Record<string, unknown>;
}

export interface ChannelSenderPort {
  send(input: ChannelSendInput): Promise<void>;
}

export const PUSH_SENDER = Symbol("PUSH_SENDER");
export const EMAIL_SENDER = Symbol("EMAIL_SENDER");
export const SMS_SENDER = Symbol("SMS_SENDER");
