/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import nodemailer from "nodemailer";

import HttpStatus from "http-status";

import AppError from "../errors/AppError";
import { appConfig } from "../config";
import logger from "./logger";

export async function sendEmail(email: string, subject: string, text: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: appConfig.email.host,
      port: Number(appConfig.email.port),
      secure: false,
      auth: {
        user: appConfig.email.user,
        pass: appConfig.email.pass,
      },
    });

    // Check if this is an OTP-related email
    const isOtpEmail =
      subject.includes("Verification Code") ||
      subject.includes("Reset Password");

    // Create appropriate HTML content based on email type
    let htmlContent;

    if (isOtpEmail) {
      // Extract OTP code from the text
      const otpMatch = text.match(/(?:CODE:|Your OTP code is:)\s*(\d+)/i);
      const otp = otpMatch ? otpMatch[1] : "N/A";
      const validityText = text.includes("valid for")
        ? "Valid for 5 minutes"
        : "";

      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background-color: #ffffff;
              color: #333333;
              line-height: 1.5;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            
            .header {
              background-color: #5E35B1;
              padding: 20px;
              color: #ffffff;
              text-align: center;
            }
            
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            
            .content {
              padding: 30px 20px;
              text-align: center;
              background-color: #ffffff;
            }
            
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              color: #333333;
            }
            
            .otp-container {
              margin: 25px auto;
              text-align: center;
            }
            
            .otp-code {
              background-color: #F0EBFA;
              color: #5E35B1;
              font-size: 28px;
              font-weight: bold;
              padding: 15px 25px;
              border-radius: 5px;
              display: inline-block;
              border: 2px solid #5E35B1;
            }
            
            .validity {
              font-size: 14px;
              color: #D32F2F;
              font-weight: 600;
              margin-top: 10px;
            }
            
            .note {
              background-color: #FFF9E0;
              border-left: 4px solid #FFC107;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #555555;
              text-align: left;
            }
            
            .footer {
              padding: 20px;
              text-align: center;
              color: #666666;
              font-size: 12px;
              border-top: 1px solid #eeeeee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            
            <div class="content">
              <p>Here is your verification code:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
                ${
                  validityText
                    ? `<div class="validity">${validityText}</div>`
                    : ""
                }
              </div>
              
              <div class="note">
                <strong>Security Note:</strong> Never share this code with anyone. Sound Explores Library representatives will never ask for your verification code.
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sound Explores Library. All rights reserved.</p>
              <p>If you didn't request this code, please ignore this email or contact support.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Standard email template for non-OTP emails
      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              background-color: #ffffff;
              color: #333333;
              line-height: 1.5;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            
            .header {
              background-color: #5E35B1;
              padding: 20px;
              color: #ffffff;
              text-align: center;
            }
            
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            
            .content {
              padding: 30px 20px;
              text-align: left;
              background-color: #ffffff;
            }
            
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              color: #333333;
            }
            
            .btn-container {
              text-align: center;
              margin: 25px 0;
            }
            
            .btn {
              display: inline-block;
              padding: 12px 25px;
              background-color: #5E35B1;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 600;
              font-size: 16px;
            }
            
            .footer {
              padding: 20px;
              text-align: center;
              color: #666666;
              font-size: 12px;
              border-top: 1px solid #eeeeee;
            }
            
            .footer-links {
              margin: 15px 0;
            }
            
            .footer-links a {
              color: #5E35B1;
              text-decoration: none;
              margin: 0 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            
            <div class="content">
              <p>${text}</p>
              
              <div class="btn-container">
                <a href="#" class="btn">Explore Music</a>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
              
              <p>&copy; ${new Date().getFullYear()} Sound Explores Library. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const info = await transporter.sendMail({
      from: `"Sound Explores Library" ${appConfig.email.from}`, // Sender address
      to: email, // Recipient's email
      subject: `${subject}`,
      text: text,
      html: htmlContent,
    });

    return info;
  } catch (error: any) {
    logger.error("Error sending email", error);
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "Error sending email");
  }
}
