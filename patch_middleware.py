with open("packages/openai-sdk-python/src/supermemory_openai/middleware.py", "r") as f:
    content = f.read()

search = """        except asyncio.TimeoutError:
            self._logger.warn(
                f"Background tasks did not complete within {timeout}s timeout"
            )
            # Cancel remaining tasks
            for task in self._background_tasks:
                if not task.done():
                    task.cancel()
            raise"""

replace = """        except asyncio.TimeoutError:
            self._logger.warn(
                f"Background tasks did not complete within {timeout}s timeout"
            )
            # Cancel remaining tasks and wait for cancellation to complete
            tasks_to_cancel = [task for task in self._background_tasks if not task.done()]
            for task in tasks_to_cancel:
                task.cancel()

            if tasks_to_cancel:
                await asyncio.gather(*tasks_to_cancel, return_exceptions=True)
            raise"""

if search in content:
    content = content.replace(search, replace)
    with open("packages/openai-sdk-python/src/supermemory_openai/middleware.py", "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find search block")
