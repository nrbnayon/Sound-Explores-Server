/* eslint-disable arrow-body-style */
import twilio from "twilio";
import { appConfig } from "../../config";

const accountSid = appConfig.twilio.accountSid!;
const authToken = appConfig.twilio.authToken!;
const from = appConfig.twilio.phoneNumber!;

const client = twilio(accountSid, authToken);

export const generateSMSBody = (
  sender: string,
  message: string,
  link: string
): string => {
  return `${sender}\n\nCheck this sound\n\nLink: ${link}`;
};

export const sendSMS = async (
  to: string,
  senderName: string,
  message: string,
  link: string
): Promise<void> => {
  const body = generateSMSBody(senderName, message, link);
  await client.messages.create({
    body,
    from,
    to,
  });
};
