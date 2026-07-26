from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_content('<html><body><input type="file" id="gpm-upload-bypass"></body></html>')
    
    client = page.context.new_cdp_session(page)
    try:
        # client.send("DOM.enable")
        res = client.send("DOM.performSearch", {"query": "#gpm-upload-bypass"})
        print("Success without DOM.enable:", res)
    except Exception as e:
        print("Error without DOM.enable:", e)

    try:
        client.send("DOM.enable")
        res = client.send("DOM.performSearch", {"query": "#gpm-upload-bypass"})
        print("Success with DOM.enable:", res)
    except Exception as e:
        print("Error with DOM.enable:", e)
        
    try:
        client.send("DOM.getDocument")
        res = client.send("DOM.performSearch", {"query": "#gpm-upload-bypass"})
        print("Success with getDocument:", res)
    except Exception as e:
        print("Error with getDocument:", e)

    browser.close()
