
from playwright.sync_api import sync_playwright, expect
import json
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Debug console logs
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        try:
            # Mock the API response
            print("Setting up API mock...")

            def handle_route(route):
                print(f"Intercepted request to {route.request.url}")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"suggestions": ["Software Engineer", "Software Developer", "Solution Architect"]})
                )

            page.route("**/api/suggestions", handle_route)

            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            # Wait for the input to be visible
            print("Waiting for input...")
            input_locator = page.get_by_label("Target Role")
            expect(input_locator).to_be_visible()

            # Type to trigger suggestions
            print("Typing 'Sof'...")
            input_locator.focus()
            # Type slowly to simulate user input and trigger onChange events properly
            input_locator.press_sequentially("Sof", delay=100)

            # Wait for suggestions to appear
            print("Waiting for suggestions listbox...")
            listbox = page.get_by_role("listbox")
            expect(listbox).to_be_visible(timeout=10000)

            # Press ArrowDown to select the first suggestion
            print("Pressing ArrowDown...")
            input_locator.press("ArrowDown")

            # Verify the first option is selected (aria-selected="true")
            # We need to explicitly find the selected option.
            selected_option = listbox.locator('role=option[selected=true]')
            expect(selected_option).to_be_visible()

            print(f"Selected option text: {selected_option.inner_text()}")
            expect(selected_option).to_have_text("Software Engineer")

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/keyboard_nav_highlight.png")

            # Press Enter to select
            print("Pressing Enter...")
            input_locator.press("Enter")

            # Verify the input value
            expect(input_locator).to_have_value("Software Engineer")

            print("Verification successful!")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="verification/error.png")
            except:
                pass
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
