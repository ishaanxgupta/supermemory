import asyncio
import time

async def mock_background_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        pass

class MiddlewareSimulator:
    def __init__(self, num_tasks):
        self._background_tasks = set()
        for _ in range(num_tasks):
            t = asyncio.create_task(mock_background_task())
            self._background_tasks.add(t)

    async def wait_for_background_tasks_current(self, timeout: float = 0.01):
        try:
            await asyncio.wait_for(
                asyncio.gather(*self._background_tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            for task in self._background_tasks:
                if not task.done():
                    task.cancel()
            raise

    async def wait_for_background_tasks_optimized(self, timeout: float = 0.01):
        try:
            await asyncio.wait_for(
                asyncio.gather(*self._background_tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            tasks_to_cancel = [t for t in self._background_tasks if not t.done()]
            for task in tasks_to_cancel:
                task.cancel()

            if tasks_to_cancel:
                await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
            raise

async def measure_orphaned_tasks():
    # Test current
    mw = MiddlewareSimulator(5000)
    await asyncio.sleep(0) # tasks start
    try:
        await mw.wait_for_background_tasks_current(timeout=0)
    except asyncio.TimeoutError:
        pass

    pending_current = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])

    # Wait for them to actually clear so we don't contaminate
    await asyncio.gather(*[t for t in asyncio.all_tasks() if t is not asyncio.current_task()], return_exceptions=True)

    # Test optimized
    mw2 = MiddlewareSimulator(5000)
    await asyncio.sleep(0)
    try:
        await mw2.wait_for_background_tasks_optimized(timeout=0)
    except asyncio.TimeoutError:
        pass

    pending_optimized = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])

    print(f"Pending tasks after current: {pending_current}")
    print(f"Pending tasks after optimized: {pending_optimized}")

asyncio.run(measure_orphaned_tasks())
