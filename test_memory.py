import asyncio
import gc
import sys

async def dummy_task():
    try:
        await asyncio.sleep(100)
    except asyncio.CancelledError:
        pass

async def test_leak():
    # If we don't await the cancelled tasks, they leave behind "Task was destroyed but it is pending!"
    # warnings, which means they are orphaned and eventually GC'd, but during their lifecycle they
    # might consume more memory or block resources.
    # Also, if they use files or sockets, not awaiting them can leak file descriptors.
    pass

asyncio.run(test_leak())
