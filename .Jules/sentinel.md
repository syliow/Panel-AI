# Sentinel's Journal

## 2024-05-22 - Turnstile Verification Gap
**Vulnerability:** The `/api/live-session` endpoint exposed the raw Google Gemini API key via a GET request without any authentication or bot protection, despite documentation claiming otherwise.
**Learning:** Documentation (`SECURITY.md`) can drift from implementation. Always verify security claims against the actual code.
**Prevention:** Implement automated security tests that verify authentication mechanisms are actually enforced on sensitive endpoints.
