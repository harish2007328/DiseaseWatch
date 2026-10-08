"""
Keep-Alive Service for Render Free Tier

Render Free Tier Web Services spin down after 15 minutes of inactivity.
This service periodically pings the public endpoint (using Render's
automatically injected RENDER_EXTERNAL_URL or custom APP_URL) to keep the
instance warm and awake 24/7 without cold-start delays.
"""
import os
import asyncio
import urllib.request
import logging

logger = logging.getLogger("keep_alive")
logger.setLevel(logging.INFO)


async def start_keep_alive(interval_seconds: int = 600):
    """
    Background worker that runs every `interval_seconds` (default 10 mins).
    Pings the public /api/health endpoint to prevent Render from going to sleep.
    """
    # Render automatically sets RENDER_EXTERNAL_URL for web services
    # e.g., https://diseasewatch-api.onrender.com
    public_url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("APP_URL")

    if not public_url:
        logger.info("[KeepAlive] Cloud keep-alive disabled in local dev environment (Render URL not detected).")
        return

    ping_target = f"{public_url.rstrip('/')}/api/health"
    logger.info(f"[KeepAlive] Initiated keep-alive monitor for: {ping_target} (interval: {interval_seconds}s)")

    # Wait 60 seconds after startup before starting ping loop
    await asyncio.sleep(60)

    while True:
        try:
            req = urllib.request.Request(
                ping_target,
                headers={"User-Agent": "DiseaseWatch-KeepAlive/1.0"}
            )
            # Run blocking urllib request in asyncio thread pool
            loop = asyncio.get_running_loop()
            status_code = await loop.run_in_executor(None, lambda: _ping(req))
            logger.info(f"[KeepAlive] Ping successful to {ping_target} -> HTTP {status_code}")
        except Exception as e:
            logger.warning(f"[KeepAlive] Ping check error: {e}")

        await asyncio.sleep(interval_seconds)


def _ping(req) -> int:
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.getcode()
