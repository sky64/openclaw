# Sky64 Dashboard

Modern web dashboard for Sky64 agent orchestration system.

## Features

- Real-time chat interface
- CLI terminal
- Process monitoring
- Skills browser
- Configuration management
- Command palette (Cmd+K)
- Mobile-first responsive design

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS 4
- Framer Motion
- Phosphor Icons
- WebSocket RPC

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Deployment

Built for Cloudflare Pages with static export.

```bash
pnpm build
# Output in `out/` directory
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_GATEWAY_URL` - Gateway WebSocket URL
- `NEXT_PUBLIC_GATEWAY_TOKEN` - Authentication token
