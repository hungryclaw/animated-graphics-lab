import { GraphicDirectiveSchema, graphicGrammars } from '@agl/composition-schema';
const DIRECTIVE_RE = /<!--\s*AGL_GRAPHIC([\s\S]*?)-->/g;
function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 72) || 'graphic';
}
function paragraphIndexAt(articleText, offset) {
    const before = articleText.slice(0, offset).trim();
    if (!before)
        return 0;
    return before.split(/\n\s*\n/g).filter(Boolean).length;
}
function surroundingExcerpt(articleText, paragraphIndex) {
    const paragraphs = articleText.split(/\n\s*\n/g).map(p => p.trim()).filter(Boolean);
    const start = Math.max(0, paragraphIndex - 2);
    const end = Math.min(paragraphs.length, paragraphIndex + 2);
    return paragraphs.slice(start, end).filter(p => !/<!--\s*AGL_GRAPHIC/.test(p)).join('\n\n').slice(0, 1500) || 'Article section around the requested graphic.';
}
function parseScalar(value) {
    return value.trim().replace(/^['"]|['"]$/g, '');
}
function parseYamlish(body) {
    const out = {};
    const lines = body.split(/\r?\n/);
    let listKey = null;
    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim())
            continue;
        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch && listKey) {
            out[listKey].push(parseScalar(listMatch[1]));
            continue;
        }
        const match = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
        if (!match)
            continue;
        const key = match[1].replace(/-/g, '_');
        const value = match[2];
        if (value === '') {
            out[key] = [];
            listKey = key;
        }
        else {
            out[key] = key === 'duration' || key === 'priority' ? Number(value) : parseScalar(value);
            listKey = null;
        }
    }
    return out;
}
function parseDirectiveBody(body) {
    const trimmed = body.trim();
    if (trimmed.startsWith(':'))
        return { description: trimmed.slice(1).trim() };
    if (trimmed.startsWith('{'))
        return JSON.parse(trimmed);
    return parseYamlish(trimmed);
}
function normalizeDirective(parsed, raw, start, end, paragraphIndex) {
    const candidate = {
        id: typeof parsed.id === 'string' ? parsed.id : undefined,
        type: typeof parsed.type === 'string' ? parsed.type : typeof parsed.grammar === 'string' ? parsed.grammar : 'metaphor',
        priority: typeof parsed.priority === 'number' && Number.isFinite(parsed.priority) ? parsed.priority : undefined,
        placement: parsed.placement,
        aspect: parsed.aspect || parsed.aspectPreset,
        duration: parsed.duration || parsed.durationSeconds,
        style: parsed.style,
        anchor: parsed.anchor,
        description: parsed.description || parsed.visualIdea || parsed.conceptText,
        caption: parsed.caption || parsed.captionSuggestion,
        must_include: Array.isArray(parsed.must_include) ? parsed.must_include : [],
        avoid: Array.isArray(parsed.avoid) ? parsed.avoid : [],
        raw
    };
    const result = GraphicDirectiveSchema.safeParse(candidate);
    if (!result.success) {
        const description = typeof candidate.description === 'string' && candidate.description.trim() ? candidate.description.trim() : `Invalid graphic directive near paragraph ${paragraphIndex}.`;
        return {
            id: typeof candidate.id === 'string' ? candidate.id : slug(description),
            type: graphicGrammars.includes(candidate.type) ? String(candidate.type) : 'metaphor',
            placement: 'replace',
            aspect: 'articleBanner',
            duration: 7,
            style: 'article-native',
            description,
            caption: typeof candidate.caption === 'string' ? candidate.caption : '',
            must_include: [],
            avoid: [],
            raw,
            start,
            end,
            paragraphIndex,
            parseStatus: 'error',
            parseMessage: result.error.issues[0]?.path?.join('.') || result.error.issues[0]?.message || 'Invalid graphic directive'
        };
    }
    const data = result.data;
    return {
        id: data.id || slug(data.description),
        type: data.type || 'metaphor',
        priority: data.priority,
        placement: data.placement,
        aspect: data.aspect,
        duration: data.duration,
        style: data.style,
        anchor: data.anchor,
        description: data.description,
        caption: data.caption,
        must_include: data.must_include,
        avoid: data.avoid,
        raw,
        start,
        end,
        paragraphIndex,
        parseStatus: 'ok'
    };
}
export function extractGraphicDirectives(articleText) {
    const directives = [];
    for (const match of articleText.matchAll(DIRECTIVE_RE)) {
        const raw = match[0];
        const body = match[1] || '';
        const start = match.index || 0;
        const end = start + raw.length;
        const paragraphIndex = paragraphIndexAt(articleText, start);
        try {
            directives.push(normalizeDirective(parseDirectiveBody(body), raw, start, end, paragraphIndex));
        }
        catch (err) {
            const description = body.replace(/^\s*[:{]?/, '').trim().slice(0, 240) || 'Malformed graphic directive.';
            directives.push({
                id: slug(description),
                type: 'metaphor',
                placement: 'replace',
                aspect: 'articleBanner',
                duration: 7,
                style: 'article-native',
                description,
                caption: '',
                must_include: [],
                avoid: [],
                raw,
                start,
                end,
                paragraphIndex,
                parseStatus: 'error',
                parseMessage: err instanceof Error ? err.message : String(err)
            });
        }
    }
    return directives;
}
export function stripGraphicDirectives(articleText) {
    return articleText.replace(DIRECTIVE_RE, '').replace(/\n{3,}/g, '\n\n').trim();
}
export function inferTitle(articleText) {
    return articleText.split(/\r?\n/).find(line => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim() || 'Visualized article';
}
export function directiveToSpot(directive, articleText, priority = 1) {
    const includes = directive.must_include.length ? `\nMust include: ${directive.must_include.join('; ')}` : '';
    const avoid = directive.avoid.length ? `\nAvoid: ${directive.avoid.join('; ')}` : '';
    const caption = directive.caption ? `\nCaption/alt intent: ${directive.caption}` : '';
    const excerpt = surroundingExcerpt(articleText, directive.paragraphIndex);
    return {
        id: directive.id,
        priority: directive.priority || priority,
        anchorText: directive.anchor || excerpt.slice(0, 300),
        insertAfterParagraph: Math.max(0, directive.paragraphIndex - 1),
        articleExcerpt: excerpt,
        visualIdea: directive.description,
        conceptText: `Article-native graphic placeholder from another agent.\nDescription: ${directive.description}${includes}${avoid}${caption}\nUse transparent stage/background and no surrounding card.`.slice(0, 1500),
        grammar: directive.type,
        aspectPreset: directive.aspect,
        durationSeconds: directive.duration,
        rationale: directive.parseStatus === 'ok' ? 'Imported from an AGL_GRAPHIC placeholder in the article draft.' : `Directive needs review: ${directive.parseMessage || 'invalid directive'}`,
        captionSuggestion: directive.caption || '',
        accepted: directive.parseStatus !== 'error',
        directive: { raw: directive.raw, start: directive.start, end: directive.end, placement: directive.placement, parseStatus: directive.parseStatus, parseMessage: directive.parseMessage },
        error: directive.parseStatus === 'error' ? directive.parseMessage : undefined,
        changePrompt: ''
    };
}
