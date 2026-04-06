import { SESClient, SendEmailCommand, type SendEmailCommandInput } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: import.meta.env.AWS_REGION ?? "eu-west-3",
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<string> {
  const {
    to,
    subject,
    html,
    text,
    from = import.meta.env.EMAIL_FROM_NOREPLY,
    replyTo,
  } = options;

  const toAddresses = Array.isArray(to) ? to : [to];

  const params: SendEmailCommandInput = {
    Source: from,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
        ...(text && {
          Text: {
            Data: text,
            Charset: "UTF-8",
          },
        }),
      },
    },
    ...(replyTo && {
      ReplyToAddresses: [replyTo],
    }),
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    if (!result.MessageId) {
      throw new Error("SES no devolvió MessageId");
    }

    console.log(`[SES] Email sent to ${toAddresses.join(", ")} | MessageId: ${result.MessageId}`);
    return result.MessageId;
  } catch (error: any) {
    console.error(`[SES] Error sending to ${toAddresses.join(", ")}:`, error.message);
    throw error;
  }
}
