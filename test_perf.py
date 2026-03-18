import asyncio
import time
import sys

async def dummy_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # Simulate some asynchronous cleanup that takes 100ms
        await asyncio.sleep(0.1)

async def test_without_await(num_tasks):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(num_tasks)]
    await asyncio.sleep(0.01) # let them start

    start_time = time.time()
    try:
        await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=0.01)
    except asyncio.TimeoutError:
        for task in tasks:
            task.cancel()
        # No await here

    # We return the time taken and number of pending tasks
    pending = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])
    return time.time() - start_time, pending

async def test_with_await(num_tasks):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(num_tasks)]
    await asyncio.sleep(0.01) # let them start

    start_time = time.time()
    try:
        await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=0.01)
    except asyncio.TimeoutError:
        tasks_to_cancel = [t for t in tasks if not t.done()]
        for task in tasks_to_cancel:
            task.cancel()
        if tasks_to_cancel:
            await asyncio.gather(*tasks_to_cancel, return_exceptions=True)

    pending = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])
    return time.time() - start_time, pending

async def main():
    print("Without await:")
    t, p = await test_without_await(1000)
    print(f"Time: {t:.4f}s, Pending Tasks: {p}")

    # Let cleanup finish
    await asyncio.sleep(0.2)

    print("With await:")
    t, p = await test_with_await(1000)
    print(f"Time: {t:.4f}s, Pending Tasks: {p}")

asyncio.run(main())
