import nodemailer, { type Transporter } from "nodemailer";

export interface MailMessage {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export const testOutbox: MailMessage[] = [];

let transporter: Transporter | undefined;

function getTransporter(): Transporter | null {
    if (!process.env.SMTP_HOST) return null;

    if (!transporter) {
        const port = Number(process.env.SMTP_PORT ?? 587);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: process.env.SMTP_USER
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined,
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 15_000,
        });

        transporter.verify((error, success) => {
            if (error) {
                console.log("SMTP connection failed!");
                console.log(error);
            } else {
                console.log("SMTP server is ready to send emails!");
            }
        });
    }
    return transporter;
}

export async function sendMail(message: MailMessage): Promise<boolean> {
    if (process.env.NODE_ENV === "test") {
        testOutbox.push(message);
        return true;
    }

    const transport = getTransporter();
    if (!transport) {
        if (process.env.NODE_ENV === "production") {
            console.warn("Email is not configured (SMTP_HOST is empty), nothing was sent");
        } else {
            console.log(`[email not configured] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
        }
        return false;
    }

    try {
        await transport?.sendMail({
            from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
            ...message,
        });
        return true;
    } catch (err) {
        console.error("Sending email failed:", err);
        return false;
    }
}