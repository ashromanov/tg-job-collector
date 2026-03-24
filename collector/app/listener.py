import logging

import httpx
from telethon import TelegramClient, events

from app.config import settings
from app.session import state

logger = logging.getLogger(__name__)


def register_handler(client: TelegramClient) -> None:
    """Register the NewMessage event handler. Filters by monitored_ids at runtime."""

    @client.on(events.NewMessage)
    async def handle_new_message(event: events.NewMessage.Event) -> None:
        chat_id = event.chat_id
        if not chat_id or chat_id not in state.monitored_ids:
            return

        text = event.raw_text
        if not text or len(text.strip()) < 50:
            return  # Skip very short messages, unlikely to be job posts

        try:
            chat = await event.get_chat()
            username = getattr(chat, "username", None)
            post_link = None
            if username:
                post_link = f"https://t.me/{username}/{event.id}"

            async with httpx.AsyncClient() as client_http:
                await client_http.post(
                    f"{settings.backend_url}/internal/ingest",
                    json={
                        "channel_tg_id": chat_id,
                        "message_id": event.id,
                        "text": text,
                        "post_date": event.date.isoformat(),
                        "post_link": post_link,
                    },
                    headers={"X-Internal-Secret": settings.internal_secret},
                    timeout=10.0,
                )
        except Exception as e:
            logger.error(
                "Failed to ingest message %s from channel %s: %s", event.id, chat_id, e
            )

    logger.info("Message handler registered")
