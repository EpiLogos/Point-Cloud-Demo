/**
 * Path-proof fixture for the bimba namespace (engineering evidence, NOT
 * admitted corpus content).
 *
 * Proves the headless production path end to end with the real authoring API:
 *
 *   blankJourney / blankScene / entity / pin   (field-studies-journeys/src/model.ts)
 *     → validateJourney                        (strict schema gate)
 *     → write production/bimba/path-proof/<slug>.journey.json
 *     → importDocuments                        (field-studies-journeys/src/nativeBridge.ts —
 *                                               the exact gate the app's Import uses)
 *
 * Output is deterministic (fixed ids, fixed updatedAt) so re-running produces
 * no diff noise. Copy this script and change the document body to mint new
 * headless corpus work; keep the validate + import steps in the loop.
 *
 * Run: npx tsx scripts/bimba-path-proof.ts
 */
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	blankJourney, blankScene, entity, pin, validateJourney,
	type Entity, type Journey, type Vec3,
} from '../field-studies-journeys/src/model.ts';
import {importDocuments} from '../field-studies-journeys/src/nativeBridge.ts';

const STAMP = '2026-09-17T00:00:00.000Z';
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

/** Mirrors the app's export slug (field-studies-journeys/src/capture.ts). */
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'field-study';

/** Deterministic step ids: every entity's default sequence steps get fixed names. */
function fixStepIds(...entities: Entity[]): void {
	for (const e of entities) e.sequence.steps.forEach((step, i) => { step.id = `${e.id}-step-${i + 1}`; });
}

function at(x: number, y: number, z = 0): Vec3 {
	return {x, y, z};
}

/** Bimba-shaped: coordinate label glyphs, yantra + cymatic forms, two-state sequence, still-centre pin. */
function bimbaFixture(): Journey {
	const j = blankJourney();
	j.id = 'bimba-path-proof-fixture';
	j.name = 'Bimba path-proof fixture';
	j.description = 'PATH-PROOF FIXTURE — namespace-path evidence, not admitted corpus content. '
		+ 'Proves the bimba namespace path: model API, validateJourney, importDocuments. '
		+ 'Bimba-shaped: coordinate label glyphs (#M2-5-9, #C0-Bimba), a yantra and a cymatic form, '
		+ 'a two-state sequence, a still-centre pin. Corpus: bimba (QL/Bimba-owned).';
	j.loop = true;
	j.updatedAt = STAMP;

	const assembly = blankScene('Coordinate assembly');
	assembly.id = 'bimba-path-proof-s1';
	assembly.character = 'Coordinate labels held around a still centre.';
	assembly.duration = 14;

	const glyph = entity('M2-5-9', '#M2-5-9', at(-.34, .08));
	glyph.id = 'bimba-glyph-m2';
	glyph.size = {x: .92, y: .5};
	glyph.tint = '#3d4b8f';
	glyph.tintWeight = .9;
	glyph.sequence = {
		sourcesVersion: 1,
		enabled: true,
		clock: 'seconds',
		manual: false,
		order: 'loop',
		easing: 'smoothstep',
		steps: [
			{
				id: 'bimba-glyph-m2-step-1', text: '#M2-5-9', shape: 'text', hold: 4, transition: 1, position: null,
				objectState: {size: {x: .92, y: .5}, rotation: 0, tint: '#3d4b8f', tintWeight: .9, force: {kind: 'none', strength: 0, radius: .4, spin: 0}},
			},
			{
				id: 'bimba-glyph-m2-step-2', text: '#C0-Bimba', shape: 'text', hold: 4, transition: 1, position: null,
				objectState: {size: {x: .8, y: .46}, rotation: 0, tint: '#8f3d52', tintWeight: .85, force: {kind: 'none', strength: 0, radius: .4, spin: 0}},
			},
		],
	};

	const yantra = entity('Yantra', '', at(.34, .02));
	yantra.id = 'bimba-yantra';
	yantra.shape = 'yantra';
	yantra.yantraId = 'anahata';
	yantra.size = {x: .5, y: .5};
	yantra.tint = '#7a5ca8';
	yantra.tintWeight = .8;

	const centre = pin(at(0, 0));
	centre.id = 'bimba-pin-centre';
	centre.name = 'Still centre';

	assembly.entities = [glyph, yantra, centre];
	fixStepIds(yantra, centre);

	const rest = blankScene('Cymatic state');
	rest.id = 'bimba-path-proof-s2';
	rest.character = 'One cymatic form at rest.';
	rest.duration = 12;
	const cymatic = entity('Cymatic 396', '', at(0, 0));
	cymatic.id = 'bimba-cymatic';
	cymatic.shape = 'cymatic';
	cymatic.templateFrequency = 396;
	cymatic.templateGeometry = 'square';
	cymatic.templateDimension = '2D';
	cymatic.size = {x: .6, y: .6};
	cymatic.tint = '#2e6f6c';
	cymatic.tintWeight = .8;
	rest.entities = [cymatic];
	fixStepIds(cymatic);

	j.scenes = [assembly, rest];
	return j;
}

const validated = validateJourney(bimbaFixture()); // throws loudly on any schema violation
validated.updatedAt = STAMP;
const file = slug(validated.name) + '.journey.json';
const outPath = path.join(repoRoot, 'production', 'bimba', 'path-proof', file);
mkdirSync(path.dirname(outPath), {recursive: true});
writeFileSync(outPath, JSON.stringify(validated, null, 2) + '\n');
console.log('wrote  ' + path.relative(repoRoot, outPath));

// Re-import through the app's real gate; per-entry errors must be empty.
const result = importDocuments(JSON.parse(readFileSync(outPath, 'utf8')));
if (result.errors.length || result.journeys.length !== 1) {
	console.error('IMPORT FAILED for ' + file + ': ' + JSON.stringify(result.errors));
	process.exit(1);
}
const imported = result.journeys[0]!;
console.log('import ok: "' + imported.name + '" (' + imported.scenes.length + ' scenes)');
console.log('path proof complete: generate → validateJourney → write → importDocuments');
