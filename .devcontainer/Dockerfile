# Dev container for building Personal CRM with the Pi coding agent.
# Installs Node, Pi, agent-browser + headless Chromium, and the web-search tool,
# so the whole toolchain lives inside the sandbox. See ../README.md.
FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

# Headless Chromium for agent-browser. The apt package pulls in every shared
# library Chrome needs, so we don't have to enumerate them.
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium \
 && rm -rf /var/lib/apt/lists/*

# Point agent-browser at the system Chromium and run it headless without the
# sandbox (standard and safe inside an already-isolated container).
ENV AGENT_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium \
    AGENT_BROWSER_ARGS=--no-sandbox

# Auto-load the gitignored project .env into every shell so `pi` sees
# $OPENROUTER_API_KEY. Covers bash (login + interactive) and zsh.
RUN printf '%s\n' \
      'set -a' \
      '[ -f /workspaces/crm/.env ] && . /workspaces/crm/.env' \
      'set +a' \
      > /etc/profile.d/10-crm-dotenv.sh \
 && chmod 0644 /etc/profile.d/10-crm-dotenv.sh \
 && echo '[ -f /etc/profile.d/10-crm-dotenv.sh ] && . /etc/profile.d/10-crm-dotenv.sh' >> /etc/bash.bashrc \
 && echo '[ -f /etc/profile.d/10-crm-dotenv.sh ] && . /etc/profile.d/10-crm-dotenv.sh' >> /etc/zsh/zshrc

# Install the agent toolchain as the non-root runtime user.
# Pi follows its docs (--ignore-scripts); agent-browser must run its install
# script so the native binary is set up.
USER node
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent \
 && npm install -g agent-browser
