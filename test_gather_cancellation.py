import asyncio
import time

async def slow_cleanup():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print("Started cleanup")
        await asyncio.sleep(0.5)
        print("Finished cleanup")

async def test():
    t1 = asyncio.create_task(slow_cleanup())
    t2 = asyncio.create_task(slow_cleanup())

    # Wait for starts
    await asyncio.sleep(0.1)

    # gather WITH return_exceptions=True
    try:
        await asyncio.wait_for(asyncio.gather(t1, t2, return_exceptions=True), timeout=0.1)
    except asyncio.TimeoutError:
        print("Timeout! Tasks done:", t1.done(), t2.done())

    print("Done block")

    # wait a bit to see if cleanup continues
    await asyncio.sleep(1)

asyncio.run(test())
