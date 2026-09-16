#!/usr/bin/env python3
"""Apply a changed keepLoaded idle plugin after the user unlocks the session."""
import subprocess
import time

while True:
    try:
        state = subprocess.run(
            ['omarchy-shell', 'lock', 'isLocked'],
            capture_output=True, text=True, timeout=5,
        )
        if state.returncode == 0 and state.stdout.strip() == 'false':
            break
    except subprocess.TimeoutExpired:
        pass
    time.sleep(5)

# The supported restart command rechecks the compositor lock before stopping
# the shell, closing the race if the user locks again after the query above.
subprocess.run(['omarchy', 'restart', 'shell'], check=True)
