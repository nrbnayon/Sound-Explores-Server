// twilio.sms.ts
import twilio from "twilio";
import { appConfig } from "../../config";
import logger from "../../utils/logger";

const accountSid = appConfig.twilio.accountSid!;
const authToken = appConfig.twilio.authToken!;
const from = appConfig.twilio.phoneNumber!;

// Initialize Twilio client, add error handling for missing config
if (!accountSid || !authToken || !from) {
  logger.error("Missing Twilio configuration. Check environment variables.");
}

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

  logger.info(`Sending SMS to ${to} with message length: ${body.length}`);

  try {
    const result = await client.messages.create({
      body,
      from,
      to,
    });
    logger.info(
      `SMS sent successfully to ${to.substring(0, 6)}***, SID: ${result.sid}`
    );
  } catch (error) {
    logger.error(`Failed to send SMS to ${to.substring(0, 6)}***`, error);
    throw error; // Re-throw for upstream handling
  }
};

export const sendBulkSMS = async (
  recipients: string[],
  senderName: string,
  message: string,
  link: string,
  soundTitle?: string
): Promise<{ successCount: number; failedNumbers: string[] }> => {
  const body = generateSMSBody(senderName, message, link, soundTitle);
  logger.info(
    `Sending bulk SMS to ${recipients.length} recipients. Message body length: ${body.length}`
  );
  logger.debug(`Message body: ${body}`);

  const failedNumbers: string[] = [];
  let successCount = 0;

  // Process in batches to avoid rate limiting
  const batchSize = 10; // Adjust based on your Twilio limits
  const totalBatches = Math.ceil(recipients.length / batchSize);

  logger.info(
    `Processing ${totalBatches} batches with batch size ${batchSize}`
  );

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1;
    const batch = recipients.slice(i, i + batchSize);

    logger.info(
      `Processing batch ${batchNumber}/${totalBatches} with ${batch.length} recipients`
    );

    const batchPromises = batch.map((to) =>
      client.messages
        .create({ body, from, to })
        .then((result) => {
          logger.debug(
            `SMS sent successfully to ${to.substring(0, 6)}***, SID: ${
              result.sid
            }`
          );
          successCount++;
          return true;
        })
        .catch((err) => {
          logger.error(`Failed to send SMS to ${to.substring(0, 6)}***:`, err);
          failedNumbers.push(to);
          return false;
        })
    );

    const batchResults = await Promise.all(batchPromises);
    const batchSuccessCount = batchResults.filter(Boolean).length;
    logger.info(
      `Batch ${batchNumber}/${totalBatches} completed: ${batchSuccessCount}/${batch.length} successful`
    );

    // Add delay between batches if needed
    if (i + batchSize < recipients.length) {
      logger.debug("Waiting 1 second before processing next batch");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  logger.info(
    `Bulk SMS sending completed: ${successCount}/${recipients.length} successful, ${failedNumbers.length} failed`
  );
  return { successCount, failedNumbers };
};
