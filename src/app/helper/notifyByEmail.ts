// src/app/helper/notifyByEmail.ts
import nodemailer from "nodemailer";
import { htmlToText } from "html-to-text";

// Type definitions
interface User {
  email: string;
  name?: string;
  profile?: {
    fullName?: string;
  };
  subscription?: {
    plan?: string;
  };
}

interface SubscriptionDetails {
  plan?: string;
  price?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
}

interface EmailTemplateData {
  name?: string;
  plan?: string;
  price?: string | number;
  startDate?: string;
  endDate?: string;
  cancelDate?: string;
  [key: string]: string | number | undefined;
}

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Environment variables validation
const requiredEnvVars = [
  "EMAIL_HOST",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
] as const;

const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

// Initialize and validate environment
validateEnvironment();

// Nodemailer transporter configuration using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

// Company constants
const COMPANY_CONFIG = {
  name: "Poop Alert",
  supportEmail: "poopalert.fun@gmail.com",
  year: new Date().getFullYear(),
  colors: {
    primary: "#FF6B35",
    accent: "#FF8E53",
    lightGray: "#f8f9fa",
    darkGray: "#343a40",
    highlight: "#32D74B",
    warning: "#FF9500",
  },
  urls: {
    dashboard: "https://poopalert.fun",
    account: "https://poopalert.fun/account",
    payment: "https://poopalert.fun/payment",
    privacy: "https://poopalert.fun/privacy",
    support: "https://poopalert.fun/support",
  },
} as const;

// Utility functions
const formatDate = (date: string | Date | undefined): string => {
  if (!date)
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getDefaultEndDate = (): string => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return formatDate(futureDate);
};

const getUserDisplayName = (user: User): string => user.name || user.profile?.fullName || "Valued User";

// Function to replace placeholders in templates
const replacePlaceholders = (
  template: string,
  data: EmailTemplateData
): string => {
  let result = template;

  // Replace custom placeholders
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value));
    }
  });

  // Replace company placeholders
  result = result.replace(/\[Your Service Name\]/g, COMPANY_CONFIG.name);
  result = result.replace(/\[support email\]/g, COMPANY_CONFIG.supportEmail);
  result = result.replace(/\[Year\]/g, COMPANY_CONFIG.year.toString());

  return result;
};

// Common email styles
const commonStyles = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
`;

// Email templates
const createSubscriptionSuccessTemplate = (): string => `
<table width="100%" cellspacing="0" cellpadding="0" style="${commonStyles}">
  <tr>
    <td align="center" style="background-color: #f4f5f7; padding: 20px;">
      <table width="600" cellspacing="0" cellpadding="0" style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, ${
            COMPANY_CONFIG.colors.primary
          }, ${
  COMPANY_CONFIG.colors.accent
}); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🔊 ${
              COMPANY_CONFIG.name
            }</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Sound Alert Companion</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: ${
              COMPANY_CONFIG.colors.accent
            }; margin-top: 0; font-weight: 600; font-size: 28px;">Welcome to Premium! 🎉</h2>
            <p style="color: #555; font-size: 16px;">Hello {{name}},</p>
            <p style="color: #555; font-size: 16px;">Fantastic! Your <strong>{{plan}} Plan</strong> subscription has been successfully activated. Get ready to experience the full power of ${
              COMPANY_CONFIG.name
            } with unlimited sound alerts and premium features!</p>
            
            <div style="background-color: ${
              COMPANY_CONFIG.colors.lightGray
            }; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid ${
  COMPANY_CONFIG.colors.highlight
};">
              <h3 style="color: ${
                COMPANY_CONFIG.colors.accent
              }; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📋 Subscription Details</h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Plan:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px; text-transform: capitalize;">{{plan}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Price:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px;">3.99/month</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Start Date:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px;">{{startDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Next Billing:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px;">{{endDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Auto-Renewal:</td>
                  <td style="padding: 12px 0; color: ${
                    COMPANY_CONFIG.colors.highlight
                  }; text-align: right; font-size: 15px; font-weight: 600;">✓ Enabled</td>
                </tr>
              </table>
            </div>

            <h3 style="color: ${
              COMPANY_CONFIG.colors.accent
            }; margin-top: 35px; font-size: 22px;">🚀 What's Included in Premium:</h3>
            <div style="background-color: white; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">🔔</span>
                <div style="display: inline-block; vertical-align: top;">
                  <h4 style="color: ${
                    COMPANY_CONFIG.colors.darkGray
                  }; margin: 0; font-size: 16px;">Unlimited Sound Alerts</h4>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Create and customize as many sound alerts as you need</p>
                </div>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">🎵</span>
                <div style="display: inline-block; vertical-align: top;">
                  <h4 style="color: ${
                    COMPANY_CONFIG.colors.darkGray
                  }; margin: 0; font-size: 16px;">Premium Sound Library</h4>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Access to exclusive high-quality sound collections</p>
                </div>
              </div>
              <div style="margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 15px;">⚙️</span>
                <div style="display: inline-block; vertical-align: top;">
                  <h4 style="color: ${
                    COMPANY_CONFIG.colors.darkGray
                  }; margin: 0; font-size: 16px;">Advanced Customization</h4>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Fine-tune volume, timing, and sound mixing options</p>
                </div>
              </div>
              <div>
                <span style="font-size: 24px; margin-right: 15px;">🎯</span>
                <div style="display: inline-block; vertical-align: top;">
                  <h4 style="color: ${
                    COMPANY_CONFIG.colors.darkGray
                  }; margin: 0; font-size: 16px;">Priority Support</h4>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Get help faster with our premium support queue</p>
                </div>
              </div>
            </div>

            <p style="color: #555; font-size: 16px; margin: 30px 0;">Ready to make some noise? Start exploring your premium features now:</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${
                COMPANY_CONFIG.urls.dashboard
              }" style="background: linear-gradient(135deg, ${
  COMPANY_CONFIG.colors.primary
}, ${
  COMPANY_CONFIG.colors.accent
}); color: white; padding: 16px 36px; text-decoration: none; display: inline-block; border-radius: 8px; font-weight: 600; letter-spacing: 0.5px; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;">🚀 Launch Dashboard</a>
            </div>

            <div style="background-color: #fff9f5; border: 1px solid ${
              COMPANY_CONFIG.colors.primary
            }20; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="color: #555; margin: 0; font-size: 15px;">
                <strong>💡 Pro Tip:</strong> Make sure to enable notifications in your device settings to never miss your custom sound alerts!
              </p>
            </div>

            <p style="color: #555; font-size: 15px;">Questions about your subscription? Our support team is here to help at <a href="mailto:${
              COMPANY_CONFIG.supportEmail
            }" style="color: ${
  COMPANY_CONFIG.colors.primary
}; text-decoration: none; font-weight: 600;">${
  COMPANY_CONFIG.supportEmail
}</a></p>
            
            <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e9ecef;">
              <p style="color: #666; font-style: italic; font-size: 15px; margin: 0;">Thanks for choosing ${
                COMPANY_CONFIG.name
              }! Let's make every moment sound amazing! 🎶</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: ${
            COMPANY_CONFIG.colors.lightGray
          }; padding: 30px; text-align: center; color: ${
  COMPANY_CONFIG.colors.darkGray
};">
            <p style="margin-bottom: 15px; font-size: 14px; font-weight: 600;">© ${
              COMPANY_CONFIG.year
            } ${COMPANY_CONFIG.name}. All rights reserved.</p>
            <p style="margin: 0; font-size: 14px;">
              <a href="${COMPANY_CONFIG.urls.account}" style="color: ${
  COMPANY_CONFIG.colors.primary
}; text-decoration: none; margin: 0 12px; font-weight: 500;">Manage Subscription</a> | 
              <a href="${COMPANY_CONFIG.urls.privacy}" style="color: ${
  COMPANY_CONFIG.colors.primary
}; text-decoration: none; margin: 0 12px; font-weight: 500;">Privacy Policy</a> |
              <a href="${COMPANY_CONFIG.urls.support}" style="color: ${
  COMPANY_CONFIG.colors.primary
}; text-decoration: none; margin: 0 12px; font-weight: 500;">Support</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

const createSubscriptionCancelTemplate = (): string => `
<table width="100%" cellspacing="0" cellpadding="0" style="${commonStyles}">
  <tr>
    <td align="center" style="background-color: #f4f5f7; padding: 20px;">
      <table width="600" cellspacing="0" cellpadding="0" style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, ${COMPANY_CONFIG.colors.primary}, ${COMPANY_CONFIG.colors.accent}); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🔊 ${COMPANY_CONFIG.name}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Sound Alert Companion</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: ${COMPANY_CONFIG.colors.accent}; margin-top: 0; font-weight: 600; font-size: 28px;">Subscription Cancelled 😢</h2>
            <p style="color: #555; font-size: 16px;">Hello {{name}},</p>
            <p style="color: #555; font-size: 16px;">We're sorry to see you go! Your premium subscription with ${COMPANY_CONFIG.name} has been cancelled and will remain active until the end of your current billing period.</p>
            
            <div style="background-color: ${COMPANY_CONFIG.colors.lightGray}; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid ${COMPANY_CONFIG.colors.warning};">
              <h3 style="color: ${COMPANY_CONFIG.colors.accent}; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📋 Cancellation Details</h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Plan:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px; text-transform: capitalize;">{{plan}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Cancellation Date:</td>
                  <td style="padding: 12px 0; color: #555; text-align: right; font-size: 15px;">{{cancelDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Service Until:</td>
                  <td style="padding: 12px 0; color: ${COMPANY_CONFIG.colors.warning}; text-align: right; font-size: 15px; font-weight: 600;">{{endDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #555; font-weight: 600; font-size: 15px;">Auto-Renewal:</td>
                  <td style="padding: 12px 0; color: #999; text-align: right; font-size: 15px;">✗ Disabled</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fff4e6; border: 2px solid ${COMPANY_CONFIG.colors.warning}40; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="color: ${COMPANY_CONFIG.colors.accent}; margin-top: 0; margin-bottom: 15px; font-size: 18px;">⚠️ What Happens Next?</h3>
              <ul style="color: #555; padding-left: 20px; margin: 0; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 8px;">You'll continue to have full premium access until <strong>{{endDate}}</strong></li>
                <li style="margin-bottom: 8px;">After that, your account will switch to our free plan</li>
                <li style="margin-bottom: 8px;">Your sound alerts and settings will be preserved</li>
                <li>You can resubscribe anytime to regain premium features</li>
              </ul>
            </div>

            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h4 style="color: ${COMPANY_CONFIG.colors.accent}; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💬 We'd Love Your Feedback</h4>
              <p style="color: #555; margin: 0; font-size: 15px; line-height: 1.6;">Help us improve ${COMPANY_CONFIG.name}! Could you spare a moment to tell us why you decided to cancel? Your feedback helps us make the app better for everyone.</p>
              <div style="text-align: center; margin: 20px 0 0 0;">
                <a href="mailto:${COMPANY_CONFIG.supportEmail}?subject=Feedback on Cancellation" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 14px;">Share Feedback</a>
              </div>
            </div>

            <h3 style="color: ${COMPANY_CONFIG.colors.accent}; margin-top: 35px; font-size: 20px;">🔄 Want to Come Back?</h3>
            <p style="color: #555; font-size: 16px;">Miss the premium features? You can reactivate your subscription anytime with just one click:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${COMPANY_CONFIG.urls.payment}" style="background: linear-gradient(135deg, ${COMPANY_CONFIG.colors.primary}, ${COMPANY_CONFIG.colors.accent}); color: white; padding: 16px 36px; text-decoration: none; display: inline-block; border-radius: 8px; font-weight: 600; letter-spacing: 0.5px; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);">🚀 Resubscribe Now</a>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="color: #555; margin: 0; font-size: 15px;">
                <strong>🎵 Remember:</strong> Even on the free plan, you can still enjoy ${COMPANY_CONFIG.name}'s core sound alert features. We're here whenever you're ready to upgrade again!
              </p>
            </div>

            <p style="color: #555; font-size: 15px;">Have questions or need help? Contact us at <a href="mailto:${COMPANY_CONFIG.supportEmail}" style="color: ${COMPANY_CONFIG.colors.primary}; text-decoration: none; font-weight: 600;">${COMPANY_CONFIG.supportEmail}</a></p>
            
            <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e9ecef;">
              <p style="color: #666; font-style: italic; font-size: 15px; margin: 0;">Thank you for being part of the ${COMPANY_CONFIG.name} community. We hope to serve you again soon! 🎶</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color: ${COMPANY_CONFIG.colors.lightGray}; padding: 30px; text-align: center; color: ${COMPANY_CONFIG.colors.darkGray};">
            <p style="margin-bottom: 15px; font-size: 14px; font-weight: 600;">© ${COMPANY_CONFIG.year} ${COMPANY_CONFIG.name}. All rights reserved.</p>
            <p style="margin: 0; font-size: 14px;">
              <a href="${COMPANY_CONFIG.urls.account}" style="color: ${COMPANY_CONFIG.colors.primary}; text-decoration: none; margin: 0 12px; font-weight: 500;">Manage Account</a> | 
              <a href="${COMPANY_CONFIG.urls.privacy}" style="color: ${COMPANY_CONFIG.colors.primary}; text-decoration: none; margin: 0 12px; font-weight: 500;">Privacy Policy</a> |
              <a href="${COMPANY_CONFIG.urls.support}" style="color: ${COMPANY_CONFIG.colors.primary}; text-decoration: none; margin: 0 12px; font-weight: 500;">Support</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

// Email sending functions
export const sendSubscriptionSuccessEmail = async (
  user: User,
  subscriptionDetails: SubscriptionDetails
): Promise<void> => {
  try {
    const templateData: EmailTemplateData = {
      name: getUserDisplayName(user),
      plan: subscriptionDetails.plan || "Premium",
      price: subscriptionDetails.price || "3.99",
      startDate: formatDate(subscriptionDetails.startDate),
      endDate: formatDate(subscriptionDetails.endDate) || getDefaultEndDate(),
    };

    const html = replacePlaceholders(
      createSubscriptionSuccessTemplate(),
      templateData
    );
    const text = htmlToText(html, { wordwrap: 130 });

    const mailOptions: MailOptions = {
      from: `"${COMPANY_CONFIG.name}" <${process.env.EMAIL_FROM!}>`,
      to: user.email,
      subject: `🎉 Welcome to ${COMPANY_CONFIG.name} Premium!`,
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription success email sent to ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send subscription success email to ${user.email}:`,
      error
    );
    throw new Error(
      `Failed to send subscription success email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const sendSubscriptionCancelEmail = async (
  user: User,
  subscriptionDetails?: SubscriptionDetails
): Promise<void> => {
  try {
    const templateData: EmailTemplateData = {
      name: getUserDisplayName(user),
      plan: subscriptionDetails?.plan || user.subscription?.plan || "Premium",
      cancelDate: formatDate(new Date()),
      endDate: subscriptionDetails?.endDate
        ? formatDate(subscriptionDetails.endDate)
        : "End of current billing period",
    };

    const html = replacePlaceholders(
      createSubscriptionCancelTemplate(),
      templateData
    );
    const text = htmlToText(html, { wordwrap: 130 });

    const mailOptions: MailOptions = {
      from: `"${COMPANY_CONFIG.name}" <${process.env.EMAIL_FROM!}>`,
      to: user.email,
      subject: "Subscription Cancelled - We'll Miss You!",
      html,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Subscription cancellation email sent to ${user.email}`);
  } catch (error) {
    console.error(
      `❌ Failed to send subscription cancellation email to ${user.email}:`,
      error
    );
    throw new Error(
      `Failed to send subscription cancellation email: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email transporter verification failed:", error);
    return false;
  }
};

// Health check function
export const getEmailServiceHealth = async (): Promise<{
  status: "healthy" | "unhealthy";
  error?: string;
}> => {
  try {
    const isHealthy = await testEmailConnection();
    return { status: isHealthy ? "healthy" : "unhealthy" };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
