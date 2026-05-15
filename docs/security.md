# Security Notes

- Hermes is not exposed publicly.
- The render worker pulls jobs from Cloudflare using `x-worker-token`.
- Master submitter key is sent by the browser only as `x-master-key`; Worker stores/verifies only a hash.
- BYOK key is not persisted by the frontend code. It is passed only for the create-job request; current Worker only verifies presence for BYOK mode and does not store it.
- Uploaded reference files are size/MIME checked.
- Generated compositions use safe templates, not user-supplied JavaScript.
- Preview HTML should be sandboxed if served as standalone artifact.
- Do not commit raw keys. Use `scripts/hash-token.mjs` and Worker secrets.
