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
  link: string,
  soundTitle?: string
): string => {
  // Include sound title in the message if provided
  const titleText = soundTitle ? `"${soundTitle}"` : "this sound";
  return `From: ${sender}\n\n${message}\n\nCheck out ${titleText}\n\nLink: ${link}`;
};

export const sendSMS = async (
  to: string,
  senderName: string,
  message: string,
  link: string,
  soundTitle?: string
): Promise<void> => {
  const body = generateSMSBody(senderName, message, link, soundTitle);
  await client.messages.create({
    body,
    from,
    to,
  });
};

export const sendBulkSMS = async (
  recipients: string[],
  senderName: string,
  message: string,
  link: string,
  soundTitle?: string
): Promise<{ successCount: number; failedNumbers: string[] }> => {
  const body = generateSMSBody(senderName, message, link, soundTitle);
  const failedNumbers: string[] = [];
  let successCount = 0;

  // Process in batches to avoid rate limiting
  const batchSize = 10; // Adjust based on your Twilio limits
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map((to) => {
      return client.messages
        .create({ body, from, to })
        .then(() => successCount++)
        .catch((err) => {
          console.log(err);
          failedNumbers.push(to);
        });
    });

    await Promise.all(batchPromises);

    // Add delay between batches if needed
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { successCount, failedNumbers };
};
