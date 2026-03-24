from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.router import router
from app.session import connect, disconnect


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()


app = FastAPI(title="tg-job-collector-collector", lifespan=lifespan)
app.include_router(router)


@app.get("/health")
async def health():
    from app.session import state

    return {"status": "ok", "session": state.status.value}
