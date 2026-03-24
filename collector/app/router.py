from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.session import SessionStatus, start_qr_login, state

router = APIRouter()


class MonitorUpdate(BaseModel):
    monitored: bool


class SendDMRequest(BaseModel):
    contact: str
    message: str


@router.get("/qr/start")
async def qr_start():
    """Initiate QR login flow. Returns base64 QR image."""
    if state.status == SessionStatus.AUTHENTICATED:
        return {"status": "already_authenticated"}
    result = await start_qr_login()
    return result


@router.get("/qr/status")
async def qr_status():
    return {
        "status": state.status.value,
        "qr_base64": state.qr_base64
        if state.status == SessionStatus.WAITING_QR
        else None,
        "expires_at": state.qr_expires_at.isoformat() if state.qr_expires_at else None,
    }


@router.get("/channels")
async def list_channels():
    """Return all dialogs (channels/groups) the user is in."""
    from app.session import get_client

    client = get_client()
    if state.status != SessionStatus.AUTHENTICATED:
        raise HTTPException(status_code=400, detail="Not authenticated")

    channels = []
    async for dialog in client.iter_dialogs():
        if dialog.is_channel or dialog.is_group:
            entity = dialog.entity
            channels.append(
                {
                    "tg_id": dialog.id,
                    "username": getattr(entity, "username", None),
                    "title": dialog.title,
                }
            )
    return channels


@router.patch("/channels/{tg_id}/monitor")
async def set_channel_monitor(tg_id: int, body: MonitorUpdate):
    """Update the in-memory monitored channels set."""
    if body.monitored:
        state.monitored_ids.add(tg_id)
    else:
        state.monitored_ids.discard(tg_id)
    return {"tg_id": tg_id, "monitored": body.monitored}


@router.post("/send-dm")
async def send_dm(body: SendDMRequest):
    """Send a direct message via the authenticated Telegram account."""
    from app.session import get_client

    client = get_client()
    if state.status != SessionStatus.AUTHENTICATED:
        raise HTTPException(status_code=400, detail="Not authenticated")

    try:
        await client.send_message(body.contact, body.message)
        return {"sent": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
