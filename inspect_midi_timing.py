from pathlib import Path
import struct

p = Path(r"C:\Users\lsbongabong\Documents\SongHub\SongHub Songs\songs\000001 - Trust in Me - Francesca Beghe.mid")
data = p.read_bytes()

header_len = int.from_bytes(data[4:8], "big")
fmt, tracks, division = struct.unpack(">HHH", data[8:14])
pos = 8 + header_len

def vlq(buf, i):
    value = 0
    while i < len(buf):
        b = buf[i]
        i += 1
        value = (value << 7) | (b & 127)
        if not b & 128:
            return value, i
    return value, i

print("File:", p.name)
print("Ticks per quarter:", division)

for tn in range(tracks):
    size = int.from_bytes(data[pos+4:pos+8], "big")
    buf = data[pos+8:pos+8+size]
    pos += 8 + size
    i = ticks = 0
    running = None
    lyric_count = 0
    tempos = []

    while i < len(buf):
        delta, i = vlq(buf, i)
        ticks += delta
        if i >= len(buf):
            break

        status = buf[i]
        if status & 128:
            i += 1
            if status < 240:
                running = status
        else:
            if running is None:
                break
            status = running

        if status == 255:
            if i >= len(buf):
                break
            meta = buf[i]
            i += 1
            n, i = vlq(buf, i)
            payload = buf[i:i+n]
            i += n

            if meta == 0x51 and n == 3:
                us = int.from_bytes(payload, "big")
                tempos.append((ticks, us, round(60_000_000/us, 2)))

            if meta == 0x05:
                lyric_count += 1

            if meta == 0x2F:
                break
        elif status in (240, 247):
            n, i = vlq(buf, i)
            i += n
        else:
            i += 1 if (status & 240) in (192, 208) else 2

    if lyric_count or tempos:
        print(f"Track {tn}: lyric events={lyric_count}, tempo events={len(tempos)}")
        for tick, us, bpm in tempos[:10]:
            print(f"  tempo at tick {tick}: {bpm} BPM")
