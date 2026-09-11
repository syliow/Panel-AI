# Security notes

The API routes retain their existing rate limits and input validation, including resume file size/type checks and transcript length limits. Rate-limit counters and caches are in memory, independent per replica, and reset when a pod restarts.

Keep `GEMINI_API_KEY` in an ignored environment file locally and a Kubernetes Secret on EC2. Do not commit it or include it in a Docker build. The existing `/api/live-session` endpoint returns this key to the browser for direct Gemini Live connections; it is therefore visible to clients using that endpoint. Other Gemini requests run through server-side API routes. Moving Live sessions to short-lived credentials is a separate application change.

The EC2 deployment uses a non-root application container and does not mount a Kubernetes service-account token. Restrict SSH to your own IP and keep the Kubernetes API private. See [the deployment guide](docs/deployment.md) for configuration and access commands.
