import asyncio
import base64
import io
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum

import qrcode
from telethon import TelegramClient
from telethon.sessions import SQLiteSession

from app.config import settings

logger = logging.getLogger(__name__)


class SessionStatus(str, Enum):
    DISCONNECTED = "disconnected"
    WAITING_QR = "waiting_qr"
    AUTHENTICATED = "authenticated"


@dataclass
class CollectorState:
    status: SessionStatus = SessionStatus.DISCONNECTED
    qr_base64: str | None = None
    qr_expires_at: datetime | None = None
    monitored_ids: set[int] = field(default_factory=set)
    _qr_task: asyncio.Task | None = None


state = CollectorState()
client: TelegramClient | None = None


def get_client() -> TelegramClient:
    global client
    if client is None:
        import os

        os.makedirs("session", exist_ok=True)
        client = TelegramClient(
            SQLiteSession(settings.session_path),
            settings.telegram_api_id,
            settings.telegram_api_hash,
        )
    return client


async def connect() -> None:
    """Connect and check if already authorized."""
    c = get_client()
    await c.connect()
    if await c.is_user_authorized():
        state.status = SessionStatus.AUTHENTICATED
        logger.info("Telethon: already authorized")
        from app.listener import register_handler

        register_handler(c)
    else:
        state.status = SessionStatus.DISCONNECTED
        logger.info("Telethon: not authorized, QR login required")


async def start_qr_login() -> dict:
    """Start or refresh QR login, return QR image as base64."""
    c = get_client()
    if not c.is_connected():
        await c.connect()

    # Cancel previous QR wait task
    if state._qr_task and not state._qr_task.done():
        state._qr_task.cancel()

    qr_login = await c.qr_login()
    _update_qr_image(qr_login.url)
    state.status = SessionStatus.WAITING_QR

    state._qr_task = asyncio.create_task(_wait_for_scan(c, qr_login))

    return {
        "qr_base64": state.qr_base64,
        "expires_at": state.qr_expires_at.isoformat() if state.qr_expires_at else None,
    }


async def _wait_for_scan(c: TelegramClient, qr_login) -> None:
    """Wait for QR scan. Auto-recreate if expired."""
    while True:
        try:
            await qr_login.wait(timeout=25)
            state.status = SessionStatus.AUTHENTICATED
            logger.info("Telethon: QR login successful")
            from app.listener import register_handler

            register_handler(c)
            return
        except asyncio.TimeoutError:
            # QR expired — recreate
            try:
                await qr_login.recreate()
                _update_qr_image(qr_login.url)
                logger.debug("QR token refreshed")
            except Exception as e:
                logger.error("QR recreate failed: %s", e)
                state.status = SessionStatus.DISCONNECTED
                return
        except Exception as e:
            logger.error("QR wait error: %s", e)
            state.status = SessionStatus.DISCONNECTED
            return


def _update_qr_image(url: str) -> None:
    img = qrcode.make(url)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    state.qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    state.qr_expires_at = datetime.now(timezone.utc) + timedelta(seconds=30)


async def disconnect() -> None:
    c = get_client()
    if c.is_connected():
        await c.disconnect()
    state.status = SessionStatus.DISCONNECTED
