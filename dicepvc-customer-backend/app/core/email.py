import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.core.config import settings

logger = logging.getLogger("email_service")

# Setup template environment
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


def render_template(template_name: str, context: dict) -> str:
    """Renders HTML from Jinja2 templates."""
    try:
        template = jinja_env.get_template(template_name)
        return template.render(**context)
    except Exception as err:
        logger.error(f"[EmailEngine] Failed to render template {template_name}: {err}")
        raise err


def send_smtp_email(to_email: str, subject: str, html_content: str):
    """Sends email using SMTP starttls connection."""
    # Skip actual delivery if SMTP is not configured
    if not settings.SMTP_HOST or not settings.SMTP_PORT:
        logger.info(f"[EmailEngine] SMTP not configured. Mocking send to {to_email}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    msg.attach(MIMEText(html_content, "html"))

    try:
        # Establish Connection
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
            if settings.SMTP_PORT == 587:
                server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            logger.info(f"[EmailEngine] Email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"[EmailEngine] SMTP connection failed: {e}")
        raise e
