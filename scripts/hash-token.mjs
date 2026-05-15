#!/usr/bin/env node
const [raw, pepper=''] = process.argv.slice(2);
if (!raw) { console.error('usage: node scripts/hash-token.mjs <raw-token> [pepper]'); process.exit(2); }
const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pepper}${raw}`));
console.log([...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join(''));
