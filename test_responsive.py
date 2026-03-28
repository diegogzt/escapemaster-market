from playwright.sync_api import sync_playwright

# Pages to test
PAGES = [
    "/es/privacidad",
    "/es/terminos",
    "/es/ayuda",
    "/es/faq",
    "/es/contacto",
    "/es/",
    "/es/search",
    "/es/marketplace",
    "/es/teams",
    "/es/offers",
]

# Viewport sizes
VIEWPORTS = {
    "mobile": {"width": 375, "height": 812},
    "tablet": {"width": 768, "height": 1024},
    "desktop": {"width": 1280, "height": 800},
}

def test_page(page, url, viewport_name, viewport_size):
    print(f"\n📱 Testing {url} at {viewport_name} ({viewport_size['width']}x{viewport_size['height']})")
    
    page.set_viewport_size(viewport_size)
    page.goto(f"http://localhost:4321{url}", wait_until="networkidle", timeout=30000)
    
    # Check for console errors
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    # Check page title
    title = page.title()
    print(f"   Title: {title}")
    
    # Check for any horizontal overflow (common responsive issue)
    body_width = page.evaluate("document.body.scrollWidth")
    window_width = page.evaluate("window.innerWidth")
    has_overflow = body_width > window_width
    if has_overflow:
        print(f"   ⚠️  Horizontal overflow detected: bodyWidth={body_width}, windowWidth={window_width}")
    
    # Check for visible elements
    h1_count = page.locator("h1").count()
    print(f"   H1 elements: {h1_count}")
    
    # Check for any text truncation issues
    truncated_elements = page.evaluate("""
        Array.from(document.querySelectorAll('*')).filter(el => {
            return el.scrollWidth > el.clientWidth && getComputedStyle(el).overflow !== 'hidden';
        }).length
    """)
    if truncated_elements > 0:
        print(f"   ⚠️  {truncated_elements} potentially truncated elements")
    
    return errors

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        console_errors = []
        
        for url in PAGES:
            for viewport_name, viewport_size in VIEWPORTS.items():
                page = browser.new_page()
                page.on("console", lambda msg: console_errors.append(f"{url} [{viewport_name}]: {msg.text}") if msg.type == "error" else None)
                
                try:
                    errors = test_page(page, url, viewport_name, viewport_size)
                    if errors:
                        console_errors.extend(errors)
                except Exception as e:
                    print(f"   ❌ Error testing {url}: {e}")
                finally:
                    page.close()
        
        browser.close()
        
        if console_errors:
            print("\n\n⚠️  Console Errors Found:")
            for err in set(console_errors):
                print(f"  - {err}")
        else:
            print("\n\n✅ No console errors found!")
        
        print("\n✅ Responsive testing complete!")

if __name__ == "__main__":
    main()
