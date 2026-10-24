from pathlib import Path
import struct

p = Path(r"C:\Users\lsbongabong\Documents\SongHub\SongHub Songs\songs\000001 - Trust in Me - Francesca Beghe.mid")
data = p.read_bytes()

print("File:", p.name)
print("Size:", len(data), "bytes")

if data[:4] != b"MThd":
    raise SystemExit("Not a standard MIDI file.")

header_len = int.from_bytes(data[4:8], "big")
fmt, tracks, division = struct.unpack(">HHH", data[8:14])
print("Format:", fmt, "| Tracks:", tracks, "| Ticks/quarter:", division)

def vlq(buf, i):
    value = 0
    while i < len(buf):
        b = buf[i]
        i += 1
        value = (value << 7) | (b & 127)
        if not b & 128:
            return value, i
    return value, i

pos = 8 + header_len
events = []

for tn in range(tracks):
    if data[pos:pos+4] != b"MTrk":
        raise SystemExit("Invalid MIDI track header.")
    size = int.from_bytes(data[pos+4:pos+8], "big")
    buf = data[pos+8:pos+8+size]
    pos += 8 + size
    i = ticks = 0
    running = None

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
            if meta in (1, 5, 6, 7):
                text = payload.decode("latin-1", errors="replace").strip()
                if text:
                    events.append((ticks, tn, meta, text))
            if meta == 47:
                break
        elif status in (240, 247):
            n, i = vlq(buf, i)
            i += n
        else:
            kind = status & 240
            i += 1 if kind in (192, 208) else 2

print("Lyrics/text events:", len(events))
for tick, tn, kind, text in events[:60]:
    label = {1: "TEXT", 5: "LYRIC", 6: "MARKER", 7: "CUE"}.get(kind, str(kind))
    print(f"tick={tick} track={tn} {label}: {text}")
