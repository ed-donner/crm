# Personal CRM — Setup

Setup for building **Personal CRM** with the [Pi coding agent](https://pi.dev) and open-source models
(DeepSeek V4 Pro / GLM 5.2) via OpenRouter. Everything runs inside a **VS Code Dev Container**, so the
agent is sandboxed to this project and the whole toolchain installs itself.

What we're building is in **[AGENTS.md](./AGENTS.md)** — Pi reads this automatically at session start.

## What you need

- **VS Code** with the **Dev Containers** extension (`ms-vscode-remote.remote-containers`)
- **Docker Desktop**, installed and running
- An **OpenRouter API key** — https://openrouter.ai/keys

Works the same on **macOS and Windows**.

## Setup (one time)

1. Open this folder in VS Code.
2. Run **"Dev Containers: Reopen in Container"** (Ctrl+Shift+P on PC, Cmd+Shift+P on Mac, type in that command). The first build takes a few
   minutes — it installs Node, Pi, agent-browser + Chromium, and the web-search tool. Later starts are
   instant.
3. Add your API key: create a file named **`.env`** in the project root with one line:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
   `.env` is gitignored, so your key is never committed.
4. Open a **new terminal** so it picks up the key.
5. Add the **agent-browser skill** to Pi (one time, interactive — it asks which agent to attach to,
   so pick **Pi**):
   ```bash
   npx skills add vercel-labs/agent-browser
   ```

That's everything — Pi reads your key and finds both models natively through OpenRouter.

## Run Pi

```bash
pi --models "openrouter/deepseek/deepseek-v4-pro,openrouter/z-ai/glm-5.2"
```

- **Ctrl+P** flips between **GLM 5.2** (fast/cheap, text-driven checks) and **DeepSeek V4 Pro**
  (vision — for checking how screens actually look against the design rules).
- **/model** or **Ctrl+L** opens the model picker.

Pi can start the dev server, run the tests, and drive the browser itself — all inside the container.
The CRM runs on port 5173, which is forwarded so you can also open it in your own browser.

## What the container sets up for you

- **Node**, **Pi** (`@earendil-works/pi-coding-agent`), **agent-browser** + headless **Chromium**, and
  **pi-web-access** (the `web_search` tool).
- **OpenRouter, natively.** Pi has OpenRouter built in and reads your `$OPENROUTER_API_KEY` from the
  environment — no `models.json` needed. Its model registry already aggregates OpenRouter's catalog,
  so you reference any model as `openrouter/<slug>` and Pi knows its capabilities (incl. DeepSeek V4
  Pro's vision).
- The **agent-browser skill** is added by you in step 5. Pi drives the browser through its `bash` tool
  and loads full usage on demand with `agent-browser skills get core`.

## How the sandboxing works

- Everything runs in the container. Only this project folder is mounted, so Pi cannot see or touch the
  rest of your machine, and every shell command — including `git` — runs inside the container.
- Your key lives only in the gitignored `.env`. The container auto-loads it into every terminal
  (exported as an environment variable), and Pi reads `$OPENROUTER_API_KEY` from there.

## Notes

- **GLM 5.2 is text-only**: when running on it, verify with `agent-browser snapshot -i` (accessibility
  text) plus console output rather than screenshots. **DeepSeek V4 Pro has vision**: use
  `agent-browser screenshot --annotate page.png` for the visual look-and-feel pass.
- **If Pi doesn't recognize a model slug** (its registry snapshot can lag a brand-new model), define it
  yourself in `~/.pi/agent/models.json` under an `openrouter` provider — that's the documented escape
  hatch. `pi --list-models` shows what your installed Pi already resolves.
  `deepseek/deepseek-v4-flash` is a cheaper DeepSeek variant.
- To rebuild after changing the dev container: **"Dev Containers: Rebuild Container"**. Your `.env`
  (in the project) persists.
- If the browser ever fails to launch, run `agent-browser doctor`; as a fallback,
  `agent-browser install --with-deps` downloads its own Chrome.
