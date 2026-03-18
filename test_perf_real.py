import asyncio
import time
import tracemalloc

async def mock_background_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # Simulate network or database cleanup taking some time
        await asyncio.sleep(0.05)

class MiddlewareSimulator:
    def __init__(self, num_tasks):
        self._background_tasks = set()
        for _ in range(num_tasks):
            t = asyncio.create_task(mock_background_task())
            self._background_tasks.add(t)
            t.add_done_callback(self._background_tasks.discard)

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

            # Wait for cancellation to complete
            if tasks_to_cancel:
                await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
            raise

async def main():
    print("Simulating middleware cleanup behavior")

    # 1. Current Behavior (Unawaited cancellation)
    mw1 = MiddlewareSimulator(1000)
    await asyncio.sleep(0.01) # let tasks start

    start_time = time.perf_counter()
    try:
        await mw1.wait_for_background_tasks_current(timeout=0.01)
    except asyncio.TimeoutError:
        pass
    t_current = time.perf_counter() - start_time

    # Observe pending tasks after "cleanup"
    pending_current = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])

    # Clean up for next test
    await asyncio.gather(*[t for t in asyncio.all_tasks() if t is not asyncio.current_task()], return_exceptions=True)
    await asyncio.sleep(0.1)

    # 2. Optimized Behavior (Awaited cancellation)
    mw2 = MiddlewareSimulator(1000)
    await asyncio.sleep(0.01)

    start_time = time.perf_counter()
    try:
        await mw2.wait_for_background_tasks_optimized(timeout=0.01)
    except asyncio.TimeoutError:
        pass
    t_optimized = time.perf_counter() - start_time

    pending_optimized = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])

    print(f"\nCurrent (Sync Cancel):")
    print(f"Time: {t_current:.4f}s")
    print(f"Orphaned Tasks: {pending_current} (Resource Leak)")

    print(f"\nOptimized (Async Cancel):")
    print(f"Time: {t_optimized:.4f}s")
    print(f"Orphaned Tasks: {pending_optimized} (Clean state)")
    print("\nConclusion: While async cancellation takes slightly more time, it prevents task/resource leaking and ensures proper async state cleanup.")

asyncio.run(main())
