import asyncio
import time

async def background_task(task_id):
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        print(f"[{task_id}] Caught CancelledError!")
        # Simulate an unexpected error during cleanup
        raise ValueError("Cleanup error")

class Simulator:
    def __init__(self):
        self._background_tasks = set()

    def add_task(self, i):
        t = asyncio.create_task(background_task(i))
        self._background_tasks.add(t)
        def cb(task):
            self._background_tasks.discard(task)
            print(f"Task {i} done, exception: {task.exception()}")
        t.add_done_callback(cb)
        return t

    async def wait_current(self, timeout):
        try:
            # THIS IS A BIG PROBLEM. If a task is added AFTER gather starts, gather won't track it!
            # But the prompt specifically says:
            # "The method cancels background tasks synchronously instead of using asyncio.gather or similar mechanism to wait for cancellation."
            await asyncio.wait_for(
                asyncio.gather(*self._background_tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            print("Current: Timeout error raised. Cancelling remaining tasks...")
            for task in self._background_tasks.copy():
                if not task.done():
                    task.cancel()
                    print(f"Current: Called cancel()")
            raise

    async def wait_optimized(self, timeout):
        try:
            await asyncio.wait_for(
                asyncio.gather(*self._background_tasks, return_exceptions=True),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            print("Optimized: Timeout error raised. Cancelling remaining tasks...")
            tasks_to_cancel = [t for t in self._background_tasks if not t.done()]
            for task in tasks_to_cancel:
                task.cancel()

            if tasks_to_cancel:
                await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
            raise

async def test_with(method_name):
    print(f"\n--- Testing {method_name} ---")
    sim = Simulator()
    t1 = sim.add_task(1)

    # Simulate a task being added *during* the wait_for
    async def add_late():
        await asyncio.sleep(0.05)
        sim.add_task(2)
        print("Added task 2 late")

    asyncio.create_task(add_late())

    try:
        method = getattr(sim, method_name)
        await method(0.1)
    except asyncio.TimeoutError:
        print("Caught TimeoutError in main")

    print(f"Pending tasks inside sim immediately after: {len(sim._background_tasks)}")
    pending_total = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])
    print(f"Total pending tasks: {pending_total}")
    await asyncio.sleep(0.5)

async def main():
    await test_with('wait_current')
    await test_with('wait_optimized')

asyncio.run(main())
