# Operations

## Systemd user service for render worker

Create `~/.hermes/graphics-lab/.env`:

```bash
AGL_API_BASE=https://animated-graphics-lab-api.<account>.workers.dev
AGL_RENDER_WORKER_TOKEN=gl_worker_or_raw_generated_token
AGL_WORKER_ID=vps-us03
AGL_JOBS_ROOT=/path/to/agl/jobs
```

Create `~/.config/systemd/user/graphics-lab-render-worker.service`:

```ini
[Unit]
Description=Animated Graphics Lab Render Worker
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/path/to/animated-graphics-lab/packages/render-worker
EnvironmentFile=/path/to/agl/.env
ExecStart=/usr/bin/node src/worker.mjs --concurrency 1
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

Commands:

```bash
systemctl --user daemon-reload
systemctl --user enable --now graphics-lab-render-worker.service
systemctl --user status graphics-lab-render-worker.service
journalctl --user -u graphics-lab-render-worker.service -n 100 --no-pager
```

## Queue recovery

V1 marks jobs as claimed/rendering and displays them. Add a scheduled Worker later to requeue stale claimed/rendering jobs when `claimed_at` is older than 30 minutes.

## Artifact delivery

V1 local worker reports `file://` URLs after render. Production next step is uploading `out.gif`, `out.mp4`, and `index.html` to R2 or Google Drive and posting public URLs in the final status update.
