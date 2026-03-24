import subprocess
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.channels.router import router as channels_router
from app.collector.router import router as collector_router
from app.cvs.router import router as cvs_router
from app.jobs.router import router as jobs_router
from app.matches.router import router as matches_router
from app.outreach.router import router as outreach_router
from app.settings.router import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.auth.service import bootstrap_admin
    from app.settings.service import seed_defaults

    subprocess.run(["uv", "run", "alembic", "upgrade", "head"], check=True)
    await bootstrap_admin()
    await seed_defaults()
    yield


app = FastAPI(title="tg-job-collector", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(channels_router, prefix="/channels", tags=["channels"])
app.include_router(cvs_router, prefix="/cvs", tags=["cvs"])
app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
app.include_router(matches_router, prefix="/matches", tags=["matches"])
app.include_router(outreach_router, prefix="/outreach", tags=["outreach"])
app.include_router(settings_router, prefix="/settings", tags=["settings"])
app.include_router(collector_router, tags=["collector"])
