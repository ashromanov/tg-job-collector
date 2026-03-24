import httpx

from app.config import settings


async def get_collector_channels() -> list[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.collector_url}/channels", timeout=10.0)
        resp.raise_for_status()
        return resp.json()


async def set_channel_monitored(tg_id: int, monitored: bool) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{settings.collector_url}/channels/{tg_id}/monitor",
            json={"monitored": monitored},
            timeout=10.0,
        )
        resp.raise_for_status()


async def send_dm(tg_contact: str, message: str, file_path: str | None = None) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.collector_url}/send-dm",
            json={"contact": tg_contact, "message": message, "file_path": file_path},
            timeout=30.0,
        )
        resp.raise_for_status()


async def get_qr_start() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.collector_url}/qr/start", timeout=35.0)
        resp.raise_for_status()
        return resp.json()


async def get_qr_status() -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.collector_url}/qr/status", timeout=10.0)
        resp.raise_for_status()
        return resp.json()
