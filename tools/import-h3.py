#!/usr/bin/env python3
"""Convert a user's H3 LOD archives into PNG assets. No game executable is run.
Own decoder implementation; binary format facts checked against VCMI docs.
Requires Pillow. Usage: python import-h3.py DATA_DIRECTORY OUTPUT_DIRECTORY
"""
import json, struct, sys, zlib
from pathlib import Path
from PIL import Image


def u32(b, p):
    return struct.unpack_from('<I', b, p)[0]


def archive(path):
    b = path.read_bytes()
    if b[:3] != b'LOD':
        raise ValueError('Not a Heroes III LOD archive')
    out = {}
    for i in range(u32(b, 8)):
        p = 92 + i * 32
        name = b[p:p+16].split(b'\0')[0].decode('ascii').lower()
        start, size, _, compressed = struct.unpack_from('<4I', b, p+16)
        raw = b[start:start+(compressed or size)]
        out[name] = zlib.decompress(raw) if compressed else raw
        assert len(out[name]) == size, name
    return out


def pcx(b):
    size, w, h = struct.unpack_from('<3I', b)
    if size == w*h:
        im = Image.frombytes('P', (w, h), b[12:12+size])
        im.putpalette(b[12+size:12+size+768])
        return im.convert('RGB')
    if size == w*h*3:
        return Image.frombytes('RGB', (w, h), b[12:12+size], 'raw', 'BGR')
    raise ValueError('Unexpected H3 PCX size')


def frames(b):
    _, _, _, count = struct.unpack_from('<4I', b)
    palette = b[16:784]
    cursor = 784
    offsets = []
    for _ in range(count):
        entries = u32(b, cursor+4)
        cursor += 16 + entries*13
        offsets.extend(struct.unpack_from('<'+'I'*entries, b, cursor))
        cursor += entries*4
    result = []
    for offset in offsets:
        _, fmt, fw, fh, w, h, left, top = struct.unpack_from('<6I2i', b, offset)
        base = offset+32
        pixels = bytearray()
        row_cursor = base
        for y in range(h):
            if fmt == 0:
                pixels.extend(b[base+y*w:base+(y+1)*w]); continue
            if fmt == 1:
                row_cursor = base+u32(b, base+y*4)
            elif fmt == 2 and y == 0:
                row_cursor = base+struct.unpack_from('<H', b, base)[0]
            elif fmt == 3:
                row_cursor = base+struct.unpack_from('<H', b, base+y*2*(w//32))[0]
            elif fmt not in (2,):
                raise ValueError(f'Unsupported DEF compression {fmt}')
            row = bytearray()
            while len(row) < w:
                code = b[row_cursor]; row_cursor += 1
                if fmt == 1:
                    length = b[row_cursor]+1; row_cursor += 1
                    literal = code == 255
                else:
                    length = (code & 31)+1; code >>= 5
                    literal = code == 7
                if literal:
                    row.extend(b[row_cursor:row_cursor+length]); row_cursor += length
                else:
                    row.extend(bytes([code])*length)
            assert len(row) == w
            pixels.extend(row)
        rgba = bytearray()
        for idx in pixels:
            if idx == 0: rgba.extend((0, 0, 0, 0))
            elif idx in (1, 4, 5, 6, 7):
                rgba.extend((0, 0, 0, {1:75,4:100,5:75,6:50,7:25}[idx]))
            elif idx in (2, 3): rgba.extend((0, 0, 0, 0))
            else: rgba.extend((*palette[idx*3:idx*3+3], 255))
        image = Image.new('RGBA', (fw, fh))
        image.paste(Image.frombytes('RGBA', (w, h), bytes(rgba)), (left, top))
        result.append(image)
    return result


def main():
    data, dest = map(Path, sys.argv[1:3])
    dest.mkdir(parents=True, exist_ok=True)
    resources = {}
    for p in data.iterdir():
        if p.suffix.lower() == '.lod': resources.update(archive(p))
    # Only surfaces are imported. Buildings and creatures are volumetric 3D meshes.
    frames(resources['tbcscas3.def'])[0].save(dest/'tbcscas3-0.png')
    for name, source in [('battle-grass','cmbkgrtr.pcx'),('battle-mountain','cmbkgrmt.pcx')]:
        pcx(resources[source]).save(dest/(name+'.png'))
    terrain = {}
    # Native full-terrain frames; earlier indices of grass/water are shore transitions.
    for kind, source, indices in [('grass','grastl.def',range(49,65)), ('sand','sandtl.def',range(0,12)), ('water','watrtl.def',range(21,33))]:
        images = frames(resources[source]); names = []
        for i in indices:
            name = f'adventure-{kind}-{i}.png'; images[i].save(dest/name); names.append(name)
        terrain[kind] = {'source': source, 'frames': names}
    (dest/'adventure.json').write_text(json.dumps(terrain,indent=2)+'\n')
    print(f'Converted {sum(len(t["frames"]) for t in terrain.values())+3} surface textures into {dest}')

if __name__ == '__main__': main()
