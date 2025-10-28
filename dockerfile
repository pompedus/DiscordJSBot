# Dockerfile
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python
RUN apt update && apt install -y --no-install-recommends \
      python3 python3-venv python3-pip ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Optional Python venv (handy if you later add deps)
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# Install Python deps
COPY py/requirements.txt /app/py/requirements.txt
RUN pip install --no-cache-dir -r /app/py/requirements.txt

# Bring in the rest of your code
COPY . .

# If you add Python deps, put them in commands/requirements.txt
# and they'll be installed automatically:
RUN if [ -f py/requirements.txt ]; then \
      pip install --no-cache-dir -r py/requirements.txt; \
    fi

# Drop privileges if you like (uncomment to use UID/GID 568)
# RUN useradd -m -u 568 appuser && chown -R appuser:appuser /app /opt/venv
# USER appuser

# Ensure your package.json "start" points to the right filename/case
CMD ["npm", "start"]
