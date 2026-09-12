"""Apply the hash-verified, byte-exact source delta to this isolated branch only."""
from pathlib import Path, PurePosixPath
import base64, hashlib, json, lzma, struct, subprocess
ROOT = Path.cwd().resolve()
BASE = '1a77ed7abf25e7fc4b92d4b94fe5f285429a5164'
EXPECTED = 'd80156e5b0ec1bac55d41f76306ba739fd688ebc1aa829dbdf558c9635124854'
def sha(data): return hashlib.sha256(data).hexdigest()
def require(condition, message):
    if not condition: raise RuntimeError(message)
parts = [ROOT / f'.handoff/source.part{i:02d}.xzb64' for i in range(6)]
encoded = ''.join(p.read_text().strip() for p in parts)
require(len(encoded) == 77744, 'Transport length mismatch')
raw = lzma.decompress(base64.b64decode(encoded, validate=True))
require(sha(raw) == EXPECTED, 'Transport SHA256 mismatch')
header_size = struct.unpack('>I', raw[:4])[0]
header = json.loads(raw[4:4 + header_size])
require(header['format'] == 'oi.source-delta.v1' and header['baseline'] == BASE, 'Unexpected manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', BASE, 'HEAD'], check=True)
streams = raw[4 + header_size:]
pending = []
seen = set()
for spec in header['files']:
    rel = PurePosixPath(spec['path'])
    require(not rel.is_absolute() and '..' not in rel.parts and rel.parts[0] not in ('.git', '.handoff'), 'Unsafe path')
    path = ROOT / rel
    require(path.resolve().is_relative_to(ROOT), 'Path escapes source root')
    require(str(rel) not in seen, 'Duplicate path')
    seen.add(str(rel))
    old = path.read_bytes() if path.exists() else b''
    require(sha(old) == spec['old'], f'Baseline mismatch: {rel}')
    start, length = spec['offset'], spec['length']
    require(start >= 0 and length >= 0 and start + length <= len(streams), 'Invalid stream range')
    ops = streams[start:start + length]
    cursor = 0
    output = bytearray()
    while cursor < len(ops):
        op = ops[cursor:cursor+1]
        cursor += 1
        if op == b'L':
            require(cursor + 4 <= len(ops), 'Truncated literal header')
            n = struct.unpack('>I', ops[cursor:cursor+4])[0]
            cursor += 4
            require(cursor + n <= len(ops), 'Truncated literal')
            output.extend(ops[cursor:cursor+n])
            cursor += n
        elif op == b'C':
            require(cursor + 8 <= len(ops), 'Truncated copy header')
            offset, n = struct.unpack('>II', ops[cursor:cursor+8])
            cursor += 8
            require(offset + n <= len(old), 'Copy exceeds baseline')
            output.extend(old[offset:offset+n])
        else:
            raise RuntimeError('Unknown delta instruction')
        require(len(output) <= 2000000, 'Unreasonable output size')
    require(len(output) == spec['size'] and sha(output) == spec['new'], f'Output mismatch: {rel}')
    pending.append((path, bytes(output)))
# All inputs and outputs are verified before any source file changes.
for path, data in pending:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
print(f'Applied {len(pending)} byte-exact source files; payload SHA256 {EXPECTED}')
