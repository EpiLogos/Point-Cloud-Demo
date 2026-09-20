/**
 * Cross-namespace production health check (guard-rail only — not a production
 * tool).
 *
 * Creation needs no helper: authoring happens in the editor (rung a) or
 * headlessly via the model API (rung b, see scripts/bimba-path-proof.ts).
 * What no existing path covers is cross-namespace hygiene, which is repeated
 * mechanical work whenever corpus files land or are hand-edited:
 *
 *   1. every journey file under production/ still passes importDocuments —
 *      the exact gate the app's Import uses — so a hand-edited or
 *      schema-drifted file fails loudly instead of silently;
 *   2. a derived .native-scene.json always has its .journey.json /
 *      .expression.json sibling (the journey is the authoring truth);
 *   3. the namespaces stay disjoint (no cross-namespace path references).
 *
 * Each namespace's own tools may enforce more (bindings, covers, profiles);
 * this script is the shared floor, not a replacement.
 *
 * Run before landing production changes:  npx tsx scripts/production-inventory.ts
 */
import {readdirSync, readFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importDocuments} from '../field-studies-journeys/src/nativeBridge.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const productionRoot = path.join(repoRoot, 'production');

const problems: string[] = [];
const fail = (message: string): void => { problems.push(message); };

if (!existsSync(productionRoot)) {
	console.error('production/ does not exist — nothing to inventory.');
	process.exit(1);
}

/** Every *.journey.json / *.expression.json under one namespace, recursively.
 *  Namespace-internal conventions (bindings/, profiles/, tools/) are the
 *  namespaces' own business and are not descended into; only journey files
 *  are the shared floor. */
const INTERNAL_DIRS = new Set(['bindings', 'profiles', 'tools', 'node_modules']);
function walkJourneys(dir: string): string[] {
	const found: string[] = [];
	for (const entry of readdirSync(dir, {withFileTypes: true})) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!INTERNAL_DIRS.has(entry.name)) found.push(...walkJourneys(full));
		} else if (entry.name.endsWith('.journey.json') || entry.name.endsWith('.expression.json')) {
			found.push(full);
		} else if (entry.name.endsWith('.json') && !entry.name.endsWith('.native-scene.json')) {
			// A stray JSON outside the namespace-internal directories is worth
			// naming: either it is a misplaced document or it belongs in bindings/.
			fail(path.relative(productionRoot, full) + ': .json file outside bindings/profiles/tools that is not a journey document — place or name it');
		}
	}
	return found;
}

const namespaces = readdirSync(productionRoot, {withFileTypes: true})
	.filter((e) => e.isDirectory() && !e.name.startsWith('.'))
	.map((e) => e.name)
	.sort();

if (!namespaces.length) fail('no production namespaces found');

for (const namespace of namespaces) {
	const nsDir = path.join(productionRoot, namespace);
	console.log('namespace ' + namespace + '/');
	const files = walkJourneys(nsDir).sort();
	if (!files.length) fail(namespace + '/: no journey documents found');

	for (const file of files) {
		const rel = path.relative(nsDir, file);
		if (file.endsWith('.native-scene.json')) {
			const base = file.replace(/\.native-scene\.json$/, '');
			if (!existsSync(base + '.journey.json') && !existsSync(base + '.expression.json')) {
				fail(namespace + '/' + rel + ': native snapshot without its journey sibling (the journey is the authoring truth)');
			}
			continue; // derived snapshot; not validated as a journey
		}
		let raw: unknown;
		try {
			raw = JSON.parse(readFileSync(file, 'utf8'));
		} catch (e) {
			fail(namespace + '/' + rel + ': not valid JSON — ' + (e instanceof Error ? e.message : String(e)));
			continue;
		}
		const result = importDocuments(raw);
		if (result.errors.length || result.journeys.length !== 1) {
			fail(namespace + '/' + rel + ': FAILED importDocuments — ' + result.errors.map((e) => e.message).join('; '));
			continue;
		}
		console.log('  ok  ' + rel + ' → "' + result.journeys[0]!.name + '" (' + result.journeys[0]!.scenes.length + ' scenes)');
	}

	// Namespace disjointness: no journey document references another namespace's path.
	const others = namespaces.filter((n) => n !== namespace);
	for (const file of files) {
		const rel = path.relative(nsDir, file);
		const text = readFileSync(file, 'utf8');
		for (const other of others) {
			const pattern = new RegExp(other.replace(/[^a-z0-9-]/g, '.') + '/');
			if (pattern.test(text)) fail(namespace + '/' + rel + ': references other namespace path "' + other + '/" — namespaces must stay disjoint');
		}
	}
}

if (problems.length) {
	console.error('\nproduction inventory FAILED (' + problems.length + ' problem' + (problems.length === 1 ? '' : 's') + '):');
	for (const p of problems) console.error('  - ' + p);
	process.exit(1);
}
console.log('\nproduction inventory OK: ' + namespaces.length + ' namespace(s), every journey file imports, namespaces disjoint');
