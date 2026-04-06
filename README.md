# PA Latency Lab

**Interactive demo for the Medium article:**
*"What Capital Markets Taught Me About Designing AI Systems Under Latency Constraints"*

By [Neelima V](https://github.com/neelima156)

---

## What this demonstrates

Three architectural lessons from high-volume FX/wire processing systems at Wells Fargo, applied to a healthcare prior authorization AI agent:

| Capital markets lesson | AI pipeline equivalent |
|---|---|
| Cache pricing lookups or bleed at market open | Semantic cache on PA requests cuts latency ~94% |
| Parallel thread/data structures over sequential locks | Parallel tool calls (patient history + formulary + coverage) |
| Design for p99, not average latency | Token streaming + circuit breakers for LLM fallback |

The demo runs a mock prior authorization request through both **sequential** and **parallel** tool execution patterns, then fires a real Claude API call for the PA decision. Clicking "Run same request again" triggers the semantic cache path.

---

## Latency numbers (representative)

| Approach | Typical end-to-end |
|---|---|
| Sequential tool calls + LLM | ~3,200–4,000ms |
| Parallel tool calls + LLM | ~1,400–1,800ms |
| Semantic cache hit | ~185ms |

---

## Local setup

```bash
git clone https://github.com/neelima156/pa-latency-lab
cd pa-latency-lab
npm install

cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `pa-latency-lab`
3. Vercel auto-detects Next.js — click **Deploy**
4. Go to **Settings → Environment Variables** → add `ANTHROPIC_API_KEY`
5. Redeploy → your live URL is ready to paste into your article

---

## Project structure

```
pa-latency-lab/
├── app/
│   ├── api/
│   │   └── pa-decision/
│   │       └── route.ts      # Server-side Claude API call (key stays private)
│   ├── globals.css           # Design tokens + dark mode
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── PALatencyLab.tsx      # Main interactive component
│   └── PALatencyLab.module.css
├── lib/
│   ├── constants.ts          # Scenarios, tools, mock data
│   └── types.ts              # TypeScript interfaces
└── README.md
```

**Key architectural decision:** The Anthropic API key never touches the client. All LLM calls go through `/api/pa-decision` — a Next.js Route Handler that runs server-side.

---

## The article

Read the full breakdown of how capital markets latency discipline maps to AI pipeline design on Medium.

---

## Tech stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Anthropic SDK** (`@anthropic-ai/sdk`)
- CSS Modules with dark mode support
- Deployed on Vercel
