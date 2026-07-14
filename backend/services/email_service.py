"""Email delivery with SMTP or console fallback."""
from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM)


def send_email(
    *,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: Optional[str] = None,
) -> dict:
    """Send an email via SMTP. Falls back to console logging when SMTP is unset."""
    if not smtp_configured():
        logger.info(
            "EMAIL (console fallback)\nTo: %s\nSubject: %s\n\n%s",
            to_email,
            subject,
            text_body,
        )
        return {"delivered": False, "mode": "console"}

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    if html_body:
        message.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_email], message.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                if settings.SMTP_USER:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, [to_email], message.as_string())
        logger.info("Email sent to %s (%s)", to_email, subject)
        return {"delivered": True, "mode": "smtp"}
    except Exception as exc:
        logger.exception("Failed to send email to %s: %s", to_email, exc)
        raise


def send_verification_email(*, to_email: str, verification_token: str) -> dict:
    verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={verification_token}"
    subject = "Verify your VitalPlan email"
    text_body = (
        "Welcome to VitalPlan!\n\n"
        f"Confirm your email address by opening this link (expires in 24 hours):\n{verify_url}\n\n"
        "If you did not create an account, you can ignore this email."
    )
    html_body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="color: #059669;">Verify your VitalPlan email</h2>
      <p>Thanks for signing up. Confirm your email to start using VitalPlan.</p>
      <p>
        <a href="{verify_url}"
           style="display:inline-block;background:#059669;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;">
          Verify email
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">This link expires in 24 hours.</p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all;">{verify_url}</p>
    </div>
    """
    return send_email(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)


def send_password_reset_email(*, to_email: str, reset_token: str) -> dict:
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={reset_token}"
    subject = "Reset your VitalPlan password"
    text_body = (
        "We received a request to reset your VitalPlan password.\n\n"
        f"Open this link to choose a new password (expires in 1 hour):\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )
    html_body = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="color: #059669;">Reset your VitalPlan password</h2>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="{reset_url}"
           style="display:inline-block;background:#059669;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;">
          Choose a new password
        </a>
      </p>
      <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
      <p style="color:#9ca3af;font-size:12px;word-break:break-all;">{reset_url}</p>
    </div>
    """
    return send_email(to_email=to_email, subject=subject, text_body=text_body, html_body=html_body)
