#!/usr/bin/env python3
"""Play complete Physis exports with Omarchy's existing screensaver lifecycle."""
import fcntl, json, os, pathlib, signal, subprocess, tempfile
home=pathlib.Path.home()
library=pathlib.Path(os.environ.get('PHYSIS_DATA_DIR',str(pathlib.Path(os.environ.get('XDG_DATA_HOME',str(home/'.local/share')))/'physis')))
lock=open(pathlib.Path(os.environ.get('XDG_RUNTIME_DIR','/tmp'))/'physis-screensaver.lock','w')
try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
except BlockingIOError: raise SystemExit(0)
videos=[]
for metadata in (library/'videos').glob('*.json'):
    try:
        item=json.loads(metadata.read_text());filename=item['filename']
        if pathlib.Path(filename).name!=filename: continue
        video=library/'videos'/filename
        if video.suffix in ('.mp4','.webm') and video.is_file() and video.stat().st_size: videos.append(video)
    except (OSError,KeyError,ValueError): pass
if not videos:
    # Preserve the user's existing themed collection until they record a Physis scene.
    subprocess.run([str(home/'.local/bin/oi-screensaver')]);raise SystemExit(0)
root=pathlib.Path(__file__).resolve().parents[1]
player=None
with tempfile.TemporaryDirectory(prefix='physis-saver-') as temp:
    playlist=pathlib.Path(temp)/'playlist.m3u';playlist.write_text('\n'.join(str(p) for p in videos)+'\n')
    args=['mpv','--no-config','--fullscreen','--wayland-app-id=org.omarchy.screensaver','--stop-screensaver=no','--loop-playlist=inf','--shuffle','--audio=no','--panscan=1.0','--hwdec=auto-safe','--osc=no','--osd-level=0','--cursor-autohide=always','--input-default-bindings=no','--input-conf='+str(root/'desktop/screensaver-input.conf'),'--script='+str(root/'desktop/screensaver.lua'),'--playlist='+str(playlist)]
    def terminate(signum,frame):
        if player: player.terminate()
    signal.signal(signal.SIGTERM,terminate);signal.signal(signal.SIGINT,terminate)
    player=subprocess.Popen(args)
    try: player.wait()
    finally:
        if player.poll() is None: player.terminate();player.wait()
