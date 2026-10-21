# Ollama Remote Access

A modern, fast web interface and proxy for connecting to local or remote Ollama servers.

## Features

- **Direct Web UI**: Designed with Swiss typography tokens and Geist Mono.
- **Serverless Ready (Vercel)**: Streaming proxy API routes (`/api/chat`, `/api/tags`) ready for zero-configuration Vercel deployment.
- **Zero Dependencies**: Native Node.js HTTP/fetch implementation with no external runtime packages.
- **Private Access Control**: Optional passcode lock via `ACCESS_PASSWORD` environment variable.
- **Dark & Light Modes**: Full theme support based on system preference.

## Local Running

```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to Vercel

1. Import this repository into Vercel.
2. (Optional) Set `ACCESS_PASSWORD` under **Project Settings → Environment Variables** to password-protect your proxy.
3. Deploy!

## Connecting to Ollama

Ensure Ollama is running and listening on all interfaces:
```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```
If connecting remotely over the internet, ensure port `11434` is forwarded on your router or exposed through a tunnel (Cloudflare Tunnel, ngrok, Tailscale).
