import asyncio
import time

async def dummy_task():
    try:
        await asyncio.sleep(1)
    except asyncio.CancelledError:
        # Simulate some synchronous or async work
        await asyncio.sleep(0.01)
        pass

async def test_sync_cancel(n):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(n)]
    await asyncio.sleep(0)  # let tasks start

    start = time.perf_counter()
    for task in tasks:
        task.cancel()
    duration = time.perf_counter() - start

    # We must wait for tasks to finish cancelling to avoid bleeding into next test
    await asyncio.gather(*tasks, return_exceptions=True)
    return duration

async def test_async_gather(n):
    tasks = [asyncio.create_task(dummy_task()) for _ in range(n)]
    await asyncio.sleep(0)  # let tasks start

    start = time.perf_counter()
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    duration = time.perf_counter() - start
    return duration

async def main():
    print("Benchmarking cancellation of 1000 tasks")

    # Warmup
    await test_sync_cancel(100)
    await test_async_gather(100)

    sync_times = []
    async_times = []

    for _ in range(5):
        sync_times.append(await test_sync_cancel(10000))
        async_times.append(await test_async_gather(10000))

    print(f"Sync cancel avg:  {sum(sync_times)/len(sync_times):.4f}s (Just requests cancellation)")
    print(f"Async cancel avg: {sum(async_times)/len(async_times):.4f}s (Awaits actual cancellation)")

asyncio.run(main())
