import asyncio
import time
import tracemalloc

async def dummy_task():
    try:
        await asyncio.sleep(10)
    except asyncio.CancelledError:
        # simulate some async cleanup that takes time
        await asyncio.sleep(0.01)

async def test_without_await(num_tasks):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(num_tasks)]
    await asyncio.sleep(0.01)

    start_time = time.perf_counter()
    for task in tasks:
        task.cancel()
    duration = time.perf_counter() - start_time

    # We don't await, tasks are orphaned
    pending = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])
    return duration, pending, tasks

async def test_with_await(num_tasks):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(num_tasks)]
    await asyncio.sleep(0.01)

    start_time = time.perf_counter()
    tasks_to_cancel = [t for t in tasks if not t.done()]
    for task in tasks_to_cancel:
        task.cancel()
    if tasks_to_cancel:
        await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
    duration = time.perf_counter() - start_time

    pending = len([t for t in asyncio.all_tasks() if t is not asyncio.current_task()])
    return duration, pending

async def main():
    print("Testing without await (current behavior):")
    tracemalloc.start()
    t1, p1, orphaned = await test_without_await(5000)
    _, peak1 = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    print(f"Time: {t1:.4f}s, Orphaned Tasks: {p1}, Peak Memory: {peak1/1024/1024:.2f} MB")

    # Clean up for next test
    await asyncio.gather(*orphaned, return_exceptions=True)
    await asyncio.sleep(0.1)

    print("\nTesting with await (optimized behavior):")
    tracemalloc.start()
    t2, p2 = await test_with_await(5000)
    _, peak2 = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    print(f"Time: {t2:.4f}s, Orphaned Tasks: {p2}, Peak Memory: {peak2/1024/1024:.2f} MB")

asyncio.run(main())
