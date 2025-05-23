"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBulkSMS = exports.sendSMS = exports.generateSMSBody = void 0;
// twilio.sms.ts
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
const accountSid = config_1.appConfig.twilio.accountSid;
const authToken = config_1.appConfig.twilio.authToken;
const from = config_1.appConfig.twilio.phoneNumber;
// Initialize Twilio client, add error handling for missing config
if (!accountSid || !authToken || !from) {
    logger_1.default.error("Missing Twilio configuration. Check environment variables.");
}
const client = (0, twilio_1.default)(accountSid, authToken);
const generateSMSBody = (sender, message, link, soundTitle) => {
    // Include sound title in the message if provided
    const titleText = soundTitle ? `"${soundTitle}"` : "this sound";
    return `From: ${sender}\n\n${message}\n\nCheck out ${titleText}\n\nLink: ${link}`;
};
exports.generateSMSBody = generateSMSBody;
const sendSMS = (to, senderName, message, link, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    const body = (0, exports.generateSMSBody)(senderName, message, link, soundTitle);
    logger_1.default.info(`Sending SMS to ${to} with message length: ${body.length}`);
    try {
        const result = yield client.messages.create({
            body,
            from,
            to,
        });
        logger_1.default.info(`SMS sent successfully to ${to.substring(0, 6)}***, SID: ${result.sid}`);
    }
    catch (error) {
        logger_1.default.error(`Failed to send SMS to ${to.substring(0, 6)}***`, error);
        throw error; // Re-throw for upstream handling
    }
});
exports.sendSMS = sendSMS;
const sendBulkSMS = (recipients, senderName, message, link, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    const body = (0, exports.generateSMSBody)(senderName, message, link, soundTitle);
    logger_1.default.info(`Sending bulk SMS to ${recipients.length} recipients. Message body length: ${body.length}`);
    logger_1.default.debug(`Message body: ${body}`);
    const failedNumbers = [];
    let successCount = 0;
    // Process in batches to avoid rate limiting
    const batchSize = 10; // Adjust based on your Twilio limits
    const totalBatches = Math.ceil(recipients.length / batchSize);
    logger_1.default.info(`Processing ${totalBatches} batches with batch size ${batchSize}`);
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        const batch = recipients.slice(i, i + batchSize);
        logger_1.default.info(`Processing batch ${batchNumber}/${totalBatches} with ${batch.length} recipients`);
        const batchPromises = batch.map((to) => client.messages
            .create({ body, from, to })
            .then((result) => {
            logger_1.default.debug(`SMS sent successfully to ${to.substring(0, 6)}***, SID: ${result.sid}`);
            successCount++;
            return true;
        })
            .catch((err) => {
            logger_1.default.error(`Failed to send SMS to ${to.substring(0, 6)}***:`, err);
            failedNumbers.push(to);
            return false;
        }));
        const batchResults = yield Promise.all(batchPromises);
        const batchSuccessCount = batchResults.filter(Boolean).length;
        logger_1.default.info(`Batch ${batchNumber}/${totalBatches} completed: ${batchSuccessCount}/${batch.length} successful`);
        // Add delay between batches if needed
        if (i + batchSize < recipients.length) {
            logger_1.default.debug("Waiting 1 second before processing next batch");
            yield new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    logger_1.default.info(`Bulk SMS sending completed: ${successCount}/${recipients.length} successful, ${failedNumbers.length} failed`);
    return { successCount, failedNumbers };
});
exports.sendBulkSMS = sendBulkSMS;
