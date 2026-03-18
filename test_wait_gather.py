import asyncio
import time

async def slow_cleanup_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("Starting slow cleanup...")
        await asyncio.sleep(0.5)
        print("Slow cleanup done.")

async def test():
    tasks = [asyncio.create_task(slow_cleanup_task()) for _ in range(3)]
    await asyncio.sleep(0) # start tasks

    try:
        await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=0.1)
    except asyncio.TimeoutError:
        print("Timeout raised!")
        # Notice what happens if we just raise or exit now.
        for t in tasks:
            if not t.done():
                t.cancel()

    pending = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    print(f"Pending tasks after TimeoutError: {len(pending)}")

    await asyncio.sleep(1)
    print("Done")

asyncio.run(test())
