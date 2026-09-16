/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The 3D medium's tiling law. These cases pin the contract the GLSL in
 * mediumShaders.ts (and the §7C coupling) re-implements on the GPU: an N×N×N
 * voxel volume packed into an N²×N² texture as N×N row-major tiles of N×N,
 * with tile (tx, ty) holding depth slice z = tx + ty·N. If the node math and
 * the shader math drift — tile decode, uv mapping, trilinear weights, the
 * splat's hat kernel — momentum lands in the wrong slice and the volume
 * silently corrupts, so every mapping here is pinned from both directions.
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import {
  MEDIUM3_MAX_N,
  MEDIUM3_MIN_N,
  mediumSliceTile,
  mediumTrilinearWeights,
  mediumUvToVoxel,
  mediumVolumeSideFor,
  mediumVolumeTextureSide,
  mediumVoxelClamp,
  mediumVoxelTexel,
  mediumVoxelUv,
  mediumSplatSliceWeight,
} from '../src/engine/mediumGrid.ts';

test('medium grid: default gridRes maps to a 32³ volume on a 1024² texture', () => {
  assert.equal(mediumVolumeSideFor(192), 32);
  assert.equal(mediumVolumeTextureSide(32), 1024);
});

test('medium grid: side mapping is clamped, guard-capped and monotone', () => {
  assert.equal(mediumVolumeSideFor(16), MEDIUM3_MIN_N, 'tiny grids floor at the minimum side');
  assert.equal(mediumVolumeSideFor(0), MEDIUM3_MIN_N);
  assert.equal(mediumVolumeSideFor(-50), MEDIUM3_MIN_N);
  assert.equal(mediumVolumeSideFor(1024), MEDIUM3_MAX_N, 'the largest legal gridRes caps at N = 64');
  assert.equal(mediumVolumeSideFor(100000), MEDIUM3_MAX_N, 'absurd settings still respect the cap');
  let prev = 0;
  for (let res = 0; res <= 1100; res++) {
    const n = mediumVolumeSideFor(res);
    assert.ok(n >= prev, `side is monotone non-decreasing at res ${res}`);
    prev = n;
    assert.ok(n >= MEDIUM3_MIN_N && n <= MEDIUM3_MAX_N);
    // The packed texture guard: N² texels per side, RGBA32F → 16 B/texel.
    const texSide = mediumVolumeTextureSide(n);
    assert.ok(texSide <= 4096, `packed texture stays ≤ 4096² (got ${texSide}² at res ${res})`);
  }
});

test('medium grid: depth slices tile row-major with no gaps or overlaps', () => {
  const n = 4;
  const origins = new Set<string>();
  for (let z = 0; z < n * n; z++) {
    const tile = mediumSliceTile(n, z);
    assert.ok(tile.tx >= 0 && tile.tx < n && tile.ty >= 0 && tile.ty < n);
    assert.ok(!origins.has(`${tile.tx},${tile.ty}`), 'each slice owns exactly one tile');
    origins.add(`${tile.tx},${tile.ty}`);
  }
  assert.equal(origins.size, n * n);
  // Seam cases: slice N starts row 2 of tiles; the last slice sits in the corner.
  assert.deepEqual(mediumSliceTile(n, 0), { tx: 0, ty: 0 });
  assert.deepEqual(mediumSliceTile(n, n), { tx: 0, ty: 1 });
  assert.deepEqual(mediumSliceTile(n, n * n - 1), { tx: n - 1, ty: n - 1 });
});

test('medium grid: voxel → texel → uv → voxel round-trips exactly', () => {
  const n = 32;
  for (const z of [0, 1, 15, 31, 32, 500, 1023]) {
    for (const [x, y] of [[0, 0], [17, 3], [31, 31], [5, 26]]) {
      const uv = mediumVoxelUv(n, x, y, z);
      assert.ok(uv.u > 0 && uv.u < 1 && uv.v > 0 && uv.v < 1, 'uv stays inside the packed texture');
      const back = mediumUvToVoxel(n, uv.u, uv.v);
      assert.deepEqual(back, { x, y, z: z % (n * n) }, `voxel ${x},${y},${z} survives the round trip`);
    }
  }
});

test('medium grid: uv decode reverses the tile encode, seam texels included', () => {
  const n = 8;
  const side = n * n;
  // Walk across a tile-row boundary: the texel just above ty=n−1 belongs to
  // the next slice's tile, so the pair must decode to voxels of adjacent
  // slices sharing the same in-tile cell — never a phantom in-tile step.
  const vA = mediumUvToVoxel(n, (n - 1 + 0.5) / side, (n - 1 + 0.5) / side);
  const vB = mediumUvToVoxel(n, (n - 1 + 0.5) / side, (n + 0.5) / side);
  assert.deepEqual(vA, { x: n - 1, y: n - 1, z: 0 }, "texel (N−1, N−1) is slice 0's last corner voxel");
  assert.deepEqual(vB, { x: n - 1, y: 0, z: n }, "texel (N−1, N) is slice N's first in-tile voxel");
  // Encoding the same voxels lands on exactly those texels.
  assert.deepEqual(mediumVoxelTexel(n, n - 1, n - 1, 0), { tx: n - 1, ty: n - 1 });
  assert.deepEqual(mediumVoxelTexel(n, n - 1, 0, n), { tx: n - 1, ty: n });
});

test('medium grid: voxel clamp repeats edge cells (free-slip wall)', () => {
  assert.deepEqual(mediumVoxelClamp(16, -3, 0, 200), { x: 0, y: 0, z: 15 });
  assert.deepEqual(mediumVoxelClamp(16, 5, 6, 7), { x: 5, y: 6, z: 7 });
});

test('medium grid: trilinear weights are a partition of unity and peak on the nearest corner', () => {
  const order: [number, number, number][] = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ];
  for (let s = 0; s <= 20; s++) {
    for (let t = 0; t <= 20; t++) {
      const fx = s / 20, fy = t / 20, fz = 1 - fx;
      const w = mediumTrilinearWeights(fx, fy, fz);
      assert.equal(w.length, 8);
      const sum = w.reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, `weights sum to 1 at (${fx},${fy},${fz}), got ${sum}`);
      for (let i = 0; i < 8; i++) assert.ok(w[i] >= 0 && w[i] <= 1);
    }
  }
  // At an integer position the whole weight sits on that corner.
  assert.deepEqual(mediumTrilinearWeights(0, 0, 0), [1, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(mediumTrilinearWeights(1, 0, 1), [0, 0, 0, 0, 0, 1, 0, 0]);
  // Linear field reconstruction: trilinear of x + 2y + 3z is exact.
  const field = (x: number, y: number, z: number) => x + 2 * y + 3 * z;
  for (const [cx, cy, cz] of [[0.25, 0.5, 0.75], [0.9, 0.1, 0.4]]) {
    const w = mediumTrilinearWeights(cx, cy, cz);
    let acc = 0;
    order.forEach(([ox, oy, oz], i) => { acc += w[i] * field(ox, oy, oz); });
    const exact = field(cx, cy, cz);
    assert.ok(Math.abs(acc - exact) < 1e-9, `linear field reconstructs exactly (${acc} vs ${exact})`);
  }
});

test('medium grid: splat hat kernel partitions momentum across the nearest slices', () => {
  const n = 32;
  for (const fz of [0, 0.2, 0.5, 4.3, 15, 30.7, 31, 31.98]) {
    // The three draws: offsets −1/0/+1. Interior positions sum to exactly 1;
    // at the walls the virtual outside slice folds onto the edge cell (the
    // weight keeps measuring against the unclamped target), still summing 1.
    let total = 0;
    for (const offset of [-1, 0, 1]) total += mediumSplatSliceWeight(fz, n, offset);
    assert.ok(Math.abs(total - 1) < 1e-9, `offsets −1/0/+1 carry the whole momentum at fz=${fz}, got ${total}`);
  }
  // Zero exactly once the slice is a full cell away.
  assert.equal(mediumSplatSliceWeight(4.0, n, 2), 0);
  assert.equal(mediumSplatSliceWeight(0, n, -1), 0, 'nothing leaks into the virtual slice below the floor');
  assert.equal(mediumSplatSliceWeight(31, n, 1), 0, 'nothing leaks into the virtual slice above the ceiling');
  assert.equal(mediumSplatSliceWeight(0, n, 0), 1);
  assert.equal(mediumSplatSliceWeight(4.5, n, -1), 0.5);
  assert.equal(mediumSplatSliceWeight(4.5, n, 0), 0.5);
  assert.equal(mediumSplatSliceWeight(4.5, n, 1), 0);
});
