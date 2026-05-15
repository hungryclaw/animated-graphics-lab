import { aglDesignSystems, stylePresets } from '@agl/composition-schema';

const banned = /apple|claude|stripe|linear|vercel|runway|notion|supabase|figma|anthropic/i;
const failures = [];

for (const item of [...Object.values(stylePresets), ...Object.values(aglDesignSystems)]) {
  if (banned.test(item.label || '') || banned.test(item.description || '')) failures.push(item);
}

if (failures.length) {
  console.error('Brand-like names found in user-facing design labels/descriptions:');
  for (const failure of failures) console.error(`- ${failure.id}: ${failure.label}`);
  process.exit(1);
}

console.log(`Design labels OK: checked ${Object.keys(stylePresets).length} presets and ${Object.keys(aglDesignSystems).length} normalized systems.`);
