import asyncio
import time

async def test():
    tasks = []
    # simulate background tasks that are not wrapped in an outer gather
    # wait, the code is:
    # asyncio.wait_for(asyncio.gather(*self._background_tasks, ...), timeout)
    # This means wait_for wraps gather, and gather wraps the tasks.

    # Let's create actual tasks
    async def dummy():
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            print("dummy cancelled")
            await asyncio.sleep(0.5)
            print("dummy cleaned up")

    # create tasks but don't gather them yet
    t1 = asyncio.create_task(dummy())
    t2 = asyncio.create_task(dummy())
    tasks = [t1, t2]

    await asyncio.sleep(0.1) # let them start

    try:
        # what happens if gather times out?
        # wait_for cancels gather.
        # when gather is cancelled, does it cancel its children AND WAIT for them?
        await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=0.1)
    except asyncio.TimeoutError:
        print("wait_for timed out")
        print(f"Are tasks done? t1:{t1.done()} t2:{t2.done()}")
        print(f"Are tasks cancelled? t1:{t1.cancelled()} t2:{t2.cancelled()}")

        # in the codebase it does:
        for t in tasks:
            if not t.done():
                t.cancel()
                print("called cancel on task")

    print(f"Are tasks done now? t1:{t1.done()} t2:{t2.done()}")

    # Wait to see if "dummy cleaned up" prints
    await asyncio.sleep(1)

asyncio.run(test())
