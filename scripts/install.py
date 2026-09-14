#!/usr/bin/env python3
"""Install reversible, user-owned Physis integration. Preserve existing Omarchy customizations."""
import datetime, json, os, pathlib, shutil, subprocess
root=pathlib.Path(__file__).resolve().parents[1];home=pathlib.Path.home()
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
backup=home/'.local/state/physis/backups'/stamp
changes=[]
def write(target,content,executable=False):
    target=pathlib.Path(target)
    if target.exists() and target.read_text()==content: return
    if target.exists():
        saved=backup/target.relative_to(home);saved.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,saved)
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
    if executable: target.chmod(0o755)
    changes.append(str(target))
def quote(value): return '"'+str(value).replace('\\','\\\\').replace('"','\\"')+'"'
for required in [root/'dist/index.html',root/'build/physis-overlay']:
    if not required.exists(): raise SystemExit('Build first: npm run build && npm run desktop:build')
# Use absolute paths so shell widgets and desktop launchers do not depend on interactive shell setup.
import shlex
write(home/'.local/bin/physis','#!/bin/sh\nexec '+shlex.quote(str(root/'scripts/physis'))+' "$@"\n',True)
node=shutil.which('node')
write(home/'.config/systemd/user/physis.service',f'''[Unit]
Description=Physis studio and desktop renderer
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
WorkingDirectory={root}
ExecStart={quote(node)} {quote(root/'server/index.mjs')}
Restart=on-failure
RestartSec=2
TimeoutStopSec=5
KillMode=control-group
Environment=NODE_ENV=production

[Install]
WantedBy=graphical-session.target
''')
write(home/'.local/share/applications/physis.desktop',f'''[Desktop Entry]
Type=Application
Name=Physis
Comment=Point-cloud studio and desktop overlay
Exec={home}/.local/bin/physis
Icon=applications-graphics
Terminal=false
Categories=Graphics;AudioVideo;
StartupWMClass=physis
''')
for source in (root/'desktop/omarchy').iterdir():
    content=source.read_text()
    if source.suffix=='.qml': content=content.replace('"physis', '"'+str(home/'.local/bin/physis'))
    write(home/'.config/omarchy/plugins/org.epilogos.physis'/source.name,content)
shell=home/'.config/omarchy/shell.json';config=json.loads(shell.read_text())
right=config.setdefault('bar',{}).setdefault('layout',{}).setdefault('right',[])
if not any(item.get('id')=='org.epilogos.physis' for item in right):
    right.insert(1,{'id':'org.epilogos.physis'});write(shell,json.dumps(config,indent=2)+'\n')
idle=home/'.config/omarchy/plugins/frank.idle/Service.qml'
old='\\"$HOME/.local/bin/oi-screensaver\\"';new='\\"$HOME/.local/bin/physis\\" screensaver'
if idle.exists():
    text=idle.read_text()
    if old in text:
        text=text.replace(old,new).replace('// O:I: run the pointcloud video screensaver (mpv) instead of the','// Physis: run the pointcloud video screensaver (mpv) instead of the')
        write(idle,text)
    elif new not in text: raise SystemExit('Unexpected idle launcher; install stopped before replacing it.')
else: raise SystemExit('Expected existing frank.idle plugin; inspect idle integration before installing.')
backup.mkdir(parents=True,exist_ok=True);(backup/'changed-files.json').write_text(json.dumps(changes,indent=2)+'\n')
subprocess.run(['systemctl','--user','daemon-reload'],check=True)
subprocess.run(['systemctl','--user','enable','--now','physis.service'],check=True)
subprocess.run(['omarchy-shell','shell','rescanPlugins'],check=True)
print('Installed Physis. Backups:',backup)
