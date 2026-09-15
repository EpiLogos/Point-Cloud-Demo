# Native glyph coverage repair

Implementation evidence, 2026-09-15. Starting owner main:
`22c02d543dfee2c6eb30ded1f4a0a62225200eeb`.

## Defect and change

`GlyphSampler.rasterizeSpatialNode` returns candidates in raster-row order.
`EntityRuntime.writeCandidates` used a prefix of that pool for ordinary
formations, including `extent.normalized: false`. A particle allocation smaller
than the pool therefore expressed an upper fragment of the glyph. The normalized
extent path already used a deterministic low-discrepancy stride through the whole
pool.

The repair uses that existing stride for every formation. The normalization-only
argument was removed from this private method; the geometry normalization,
partition shares, stable entity IDs, source shapes, jitter and physics remain in
their existing owners. Changed target placement is intentional when an ordinary
formation is next baked.

## Measured reproduction

Real Chromium Canvas2D rasterization into the real `EntityRuntime` target textures;
no sampler or engine substitute. The test checks both sequence targets, two
partitions, vertical and horizontal planes, and absent/false/true normalized
extents at 1,024 and 8,192 total particles: 48 allocation cases.

Example ordinary vertical allocation results on the same machine:

| Shape | Raster candidates | Allocated | Height before | Height after | Quadrants before → after |
| --- | ---: | ---: | ---: | ---: | --- |
| O | 15,446 | 512 | 4.42% | 100% | 2 → 4 |
| O | 15,446 | 4,096 | 23.20% | 100% | 2 → 4 |
| ● | 8,304 | 512 | 10.78% | 100% | 2 → 4 |
| ● | 8,304 | 4,096 | 49.02% | 100% | 2 → 4 |

All 48 repaired cases cover at least 97% of both source dimensions and all four
quadrants. Repeated zero-time updates do not rebake; reallocating the same count
retains identical A/B shape targets. The regression failed on the unmodified
starting engine before applying the repair. Raster counts are platform/font
observations, not fixed test expectations.

## Executed checks

- `npm run lint`
- `npm test`: 112 passed
- `npm run build`: passed; existing large-bundle warning remains
- `npm run test:journeys`: 50 passed
- `npm run test:gpu`: 8 passed, including the 48-case coverage regression
- `npm run test:browser`
- `npm run test:workspace`
- `python field-studies-journeys/tests/module_browser.py`
- `git diff --check`

Browser checks used installed Chrome with the existing software-WebGL harness on
macOS. Native GPU state, sequence, no-reseed, capture and projection assertions
passed without browser errors. The existing editor suites declare their local
origin-storage test doubles; this repair's sampler/runtime regression does not
replace either owner with a double. Reports and images are generated under
`field-studies-journeys/evidence-native/` and collected by native acceptance CI.

## Intake boundary

This is the canonical repair on current native main. O:I currently consumes an
older native engine at `9443f58fa8599f903d6affa61bc6fbed7109f640`. A separately
verified native compatibility branch may carry this same bounded correction
onto that exact revision while O:I's broader engine refresh proceeds. That
compatibility commit is provisional intake source, not a claim that the newer
native semantic/schema changes have been integrated into O:I.
