export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { out._.push(arg); continue; }
    const eq = arg.indexOf('=');
    if (eq > 2) { out[arg.slice(2, eq)] = arg.slice(eq + 1); continue; }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

export function hasFlag(args, name) {
  return args[name] === true || args[name] === 'true';
}
