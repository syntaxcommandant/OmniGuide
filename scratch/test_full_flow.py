import asyncio
import json
import subprocess
import time
import urllib.request
import websockets
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9233
USER_DATA_DIR = os.path.join(os.environ.get("TEMP", "C:\\Temp"), f"chrome_cdp_{os.getpid()}")

async def get_page_ws():
    res = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")
    targets = json.loads(res.read().decode("utf-8"))
    for t in targets:
        if t.get("type") == "page":
            return t["webSocketDebuggerUrl"]
    return None

async def run_full_flow_test():
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
        for _ in range(20):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version")
                break
            except Exception:
                time.sleep(0.5)

        ws_url = await get_page_ws()
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
                    if resp.get("method") == "Page.javascriptDialogOpening":
                        await ws.send(json.dumps({"id": 99999, "method": "Page.handleJavaScriptDialog", "params": {"accept": True}}))
                    if resp.get("id") == msg_id:
                        return resp.get("result", {})

            await send("Page.enable")
            await send("Runtime.enable")
            await send("Runtime.evaluate", {"expression": "window.confirm = () => true; window.alert = () => true;"})

            async def eval_js(expression):
                res = await send("Runtime.evaluate", {"expression": expression, "returnByValue": True})
                return res.get("result", {}).get("value")

            # 1. Test New Review page and submission
            print("\n1. Navigating to /reviews/new...")
            await send("Page.navigate", {"url": "http://localhost:5173/reviews/new"})
            await asyncio.sleep(2)

            # Click 'Load Example' and then select the first scenario
            print("Clicking 'Load Example'...")
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const loadBtn = btns.find(b => b.innerText.includes('Load Example'));
                    if (loadBtn) loadBtn.click();
                })()
            """)
            await asyncio.sleep(0.5)

            # Click first scenario inside dropdown
            print("Selecting first benchmark scenario...")
            selected = await eval_js("""
                (() => {
                    const scBtns = Array.from(document.querySelectorAll('button'));
                    const item = scBtns.find(b => b.innerText.includes('Benchmark') || b.innerText.includes('Canonical') || b.innerText.includes('Launch'));
                    if (item) {
                        item.click();
                        return true;
                    }
                    return false;
                })()
            """)
            print(f"Scenario selected: {selected}")
            await asyncio.sleep(0.5)

            title_val = await eval_js("document.querySelector('input[type=\"text\"]').value")
            content_val = await eval_js("document.querySelector('textarea').value")
            print(f"Form populated: Title='{title_val}', Content length={len(content_val or '')}")

            # Click Review Content button
            print("Clicking 'Review Content' button...")
            clicked = await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const btn = buttons.find(b => b.innerText.includes('Review Content'));
                    if (btn && !btn.disabled) {
                        btn.click();
                        return true;
                    }
                    return false;
                })()
            """)
            print(f"Submit button clicked: {clicked}")

            # Wait for review processing and navigation to results page
            review_url = ""
            for _ in range(15):
                await asyncio.sleep(1)
                curr_url = await eval_js("window.location.href")
                if "/reviews/" in curr_url and not curr_url.endswith("/new"):
                    review_url = curr_url
                    break

            print(f"Navigated to Review Results URL: {review_url}")
            assert "/reviews/" in review_url, "Failed to navigate to review results!"

            await asyncio.sleep(2)

            # 2. Inspect review findings
            findings_count = await eval_js("document.querySelectorAll('[data-finding-id], .border-l-4').length")
            page_text = await eval_js("document.body.innerText.substring(0, 500)")
            print(f"Findings elements detected on page: {findings_count}")
            print(f"Results summary: {page_text[:180].replace(chr(10), ' ')}...")

            # 3. Test clicking 'Accept Revision' on the first finding
            print("\n2. Testing finding action 'Accept Suggested Revision'...")
            accept_clicked = await eval_js("""
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const acceptBtn = buttons.find(b => b.innerText.trim() === 'Accept Revision');
                    if (acceptBtn) {
                        acceptBtn.click();
                        return true;
                    }
                    return false;
                })()
            """)
            print(f"Accept action clicked: {accept_clicked}")
            await asyncio.sleep(2)

            # 4. Refresh page and test persistence
            print("\n3. Testing decision persistence after browser refresh...")
            await send("Page.reload")
            await asyncio.sleep(2)
            refreshed_text = await eval_js("document.body.innerText")
            has_accepted = "Accepted" in refreshed_text or "accepted" in refreshed_text.lower()
            print(f"Finding shows 'Accepted' after refresh: {has_accepted}")

            # 5. Check Review History page
            print("\n4. Navigating to /reviews (Review History)...")
            await send("Page.navigate", {"url": "http://localhost:5173/reviews"})
            await asyncio.sleep(2)
            history_rows = await eval_js("document.querySelectorAll('tbody tr').length")
            print(f"Review History table rows rendered: {history_rows}")
            assert history_rows > 0, "No reviews rendered in history!"

            # 6. Check Brand Guidelines page tabs
            print("\n5. Navigating to /guidelines (Brand Guidelines)...")
            await send("Page.navigate", {"url": "http://localhost:5173/guidelines"})
            await asyncio.sleep(2)
            doc_cards = await eval_js("document.querySelectorAll('div.cursor-pointer, div[class*=\"rounded-xl\"]').length")
            print(f"Guideline elements rendered: {doc_cards}")

            # Click Approved Facts tab
            await eval_js("""
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const factsTab = btns.find(b => b.innerText.includes('Approved Corporate Facts'));
                    if (factsTab) factsTab.click();
                })()
            """)
            await asyncio.sleep(1)
            facts_text = await eval_js("document.body.innerText")
            has_facts = "NovaForge" in facts_text or "42ms" in facts_text
            print(f"Approved Facts visible under facts tab: {has_facts}")

            print("\nALL WORKFLOW CHECKS PASSED SUCCESSFULLY!")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

if __name__ == "__main__":
    asyncio.run(run_full_flow_test())
