1. Please build the entire project as described in agent.md and don't stop until all success criteria are reached. Don't stop and be ready for me to test.

# Personal CRM — Step by Step

## 1. Open the project in the dev container (one time)

1. Open this folder in VS Code or Cursor.
2. Make sure **Docker Desktop** is running.
3. Command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Dev Containers: Reopen in Container**.
4. The first build takes a few minutes. Later starts are instant.
5. If you change `.devcontainer/Dockerfile` or `devcontainer.json`, run **Dev Containers: Rebuild Container** instead. Your `.env` file persists.

Port **5173** is forwarded automatically, so you can open the app at `http://localhost:5173` from your host browser.

## 2. Install dependencies (first time, or after a fresh clone)

From a terminal in the project folder:

```bash
cd /workspaces/crm
npm install
```

## 3. Start the app

**Normal use (recommended):**

```bash
npm start
```

Then open **http://localhost:5173** in your browser.

**While developing (hot reload):**

```bash
npm run dev
```

Same URL: **http://localhost:5173**. The API runs on port 3001 and is proxied through Vite.

## 4. Restart the app

- Stop the running server with `Ctrl+C` in the terminal, then run `npm start` or `npm run dev` again.
- To restart the container: command palette → **Dev Containers: Reopen in Container**.
- After changing devcontainer config: **Dev Containers: Rebuild Container**.

## 5. Other useful commands

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm test`          | Run unit tests                                       |
| `npm run seed`      | Reset database to sample data                        |
| `npm run build`     | Build frontend (needed before `npm start` after UI changes) |
| `npm run typecheck` | Type-check the whole project                         |

## 6. Notes

- On first run, the app creates `data/crm.sqlite` and loads sample data automatically.
- To reset data: run `npm run seed`, or delete `data/crm.sqlite` and restart.
- No login, no cloud — everything runs locally on your machine.
- If port 5173 is already in use, stop the old process and start again.
