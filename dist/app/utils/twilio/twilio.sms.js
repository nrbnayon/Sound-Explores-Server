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
/* eslint-disable arrow-body-style */
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../config");
const accountSid = config_1.appConfig.twilio.accountSid;
const authToken = config_1.appConfig.twilio.authToken;
const from = config_1.appConfig.twilio.phoneNumber;
const client = (0, twilio_1.default)(accountSid, authToken);
const generateSMSBody = (sender, message, link, soundTitle) => {
    // Include sound title in the message if provided
    const titleText = soundTitle ? `"${soundTitle}"` : "this sound";
    return `From: ${sender}\n\n${message}\n\nCheck out ${titleText}\n\nLink: ${link}`;
};
exports.generateSMSBody = generateSMSBody;
const sendSMS = (to, senderName, message, link, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    const body = (0, exports.generateSMSBody)(senderName, message, link, soundTitle);
    yield client.messages.create({
        body,
        from,
        to,
    });
});
exports.sendSMS = sendSMS;
const sendBulkSMS = (recipients, senderName, message, link, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    const body = (0, exports.generateSMSBody)(senderName, message, link, soundTitle);
    const failedNumbers = [];
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
        yield Promise.all(batchPromises);
        // Add delay between batches if needed
        if (i + batchSize < recipients.length) {
            yield new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    return { successCount, failedNumbers };
});
exports.sendBulkSMS = sendBulkSMS;
