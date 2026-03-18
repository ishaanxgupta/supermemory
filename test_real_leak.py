import asyncio
import time

async def background_task(task_id):
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print(f"[{task_id}] Cleanup started")
        await asyncio.sleep(0.5)
        print(f"[{task_id}] Cleanup done")

class Simulator:
    def __init__(self):
        self._background_tasks = set()

    def add_task(self, i):
        t = asyncio.create_task(background_task(i))
        self._background_tasks.add(t)
        t.add_done_callback(self._background_tasks.discard)
        return t

    async def wait_current(self, timeout):
        if not self._background_tasks:
            return

        try:
            await asyncio.wait_for(
                asyncio.gather(*self._background_tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            print("Current: Timeout error raised. Cancelling remaining tasks...")
            # Cancel remaining tasks
            for task in self._background_tasks:
                if not task.done():
                    task.cancel()
                    print(f"Current: Called cancel() on {task.get_coro().__name__}")
            raise

async def main():
    sim = Simulator()
    t1 = sim.add_task(1)

    await asyncio.sleep(0.1)

    try:
        await sim.wait_current(0.1)
    except asyncio.TimeoutError:
        print("Timeout caught in main.")

    print(f"Tasks pending right after timeout: {len(sim._background_tasks)}")

    await asyncio.sleep(1)

asyncio.run(main())
