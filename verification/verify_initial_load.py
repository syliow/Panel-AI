import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Wait for Setup Screen
        page.wait_for_selector("text=Target Role")
        page.screenshot(path="verification/setup.png")
        print("Setup screen captured.")

        # Fill Job Title
        page.fill("input#target-role", "Software Engineer")

        # Click Begin Interview
        page.click("button:has-text('Begin Interview')")

        # Wait for Interview Screen (which has "Start Interview" button)
        # Note: InterviewScreen renders "Start Interview" button initially.
        page.wait_for_selector("button:has-text('Start Interview')")
        page.screenshot(path="verification/interview_start.png")
        print("Interview start screen captured.")

        # Click Start Interview
        page.click("button:has-text('Start Interview')")

        # Wait for connecting state
        # useInterviewSession sets status='connecting' immediately.
        page.wait_for_selector("text=Connecting to interviewer...")
        time.sleep(1)
        page.screenshot(path="verification/connecting.png")
        print("Connecting state screenshot captured.")

        browser.close()

if __name__ == "__main__":
    run()
