import asyncio
import json
import subprocess
import time
import urllib.request
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9222
USER_DATA_DIR = os.path.join(os.environ.get("TEMP", "C:\\Temp"), "chrome_cdp_profile")

async def get_page_ws():
    res = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")
    targets = json.loads(res.read().decode("utf-8"))
    for t in targets:
        if t.get("type") == "page":
            return t["webSocketDebuggerUrl"]
    return None

async def run_audit():
    # Start Chrome
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={USER_DATA_DIR}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "about:blank"
    ]
    proc = subprocess.Popen(cmd)
    try:
        # Wait for port to open
        for _ in range(20):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version")
                break
            except Exception:
                time.sleep(0.5)
        
        ws_url = await get_page_ws()
        if not ws_url:
            print("Failed to find page WebSocket URL")
            return

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            msg_id = 0
            
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp_raw = await ws.recv()
                    resp = json.loads(resp_raw)
                    if resp.get("id") == msg_id:
                        return resp.get("result", {})

            # Enable events
            await send("Page.enable")
            await send("Runtime.enable")
            await send("Console.enable")

            routes = [
                "/",
                "/reviews/new",
                "/reviews",
                "/guidelines",
                "/settings"
            ]

            console_messages = []
            exceptions = []

            async def listen_events(duration=1.5):
                start = time.time()
                while time.time() - start < duration:
                    try:
                        msg_str = await asyncio.wait_for(ws.recv(), timeout=0.3)
                        msg = json.loads(msg_str)
                        if msg.get("method") == "Console.messageAdded":
                            m = msg["params"]["message"]
                            console_messages.append(f"[{m.get('level')}] {m.get('text')}")
                        elif msg.get("method") == "Runtime.exceptionThrown":
                            details = msg["params"]["exceptionDetails"]
                            exceptions.append(f"EXCEPTION: {details.get('text')} - {details.get('exception', {}).get('description', '')}")
                    except asyncio.TimeoutError:
                        pass

            for route in routes:
                url = f"http://localhost:5173{route}"
                print(f"\n--- Testing Route: {url} ---")
                console_messages.clear()
                exceptions.clear()

                nav_res = await send("Page.navigate", {"url": url})
                await listen_events(2.0)

                # Get Document Title and evaluate root text
                eval_title = await send("Runtime.evaluate", {"expression": "document.title"})
                title = eval_title.get("result", {}).get("value", "")

                eval_body = await send("Runtime.evaluate", {
                    "expression": "document.body.innerText.substring(0, 300)"
                })
                body_snippet = eval_body.get("result", {}).get("value", "").replace("\n", " ")

                # Check if logo exists in DOM
                eval_logo = await send("Runtime.evaluate", {
                    "expression": "document.querySelectorAll('img[src*=\"logo\"]').length"
                })
                logo_count = eval_logo.get("result", {}).get("value", 0)

                print(f"Title: {title}")
                print(f"Logos found on page: {logo_count}")
                print(f"Body snippet: {body_snippet[:120]}...")
                
                if exceptions:
                    print("ERRORS DETECTED:")
                    for e in exceptions:
                        print("  !", e)
                else:
                    print("Zero runtime exceptions.")

                if console_messages:
                    print("Console logs:")
                    for c in console_messages:
                        print("  >", c)
                else:
                    print("Zero console warnings/errors.")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run_audit())
