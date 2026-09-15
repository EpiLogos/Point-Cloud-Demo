#!/usr/bin/env python3
"""Install or remove the Physis web app: CLI shim, launcher, loopback service.

The web-app delivery needs only three user files: the `physis` command, a
launcher desktop entry, and a user service that keeps the loopback host
running. No bar widget, idle-plugin change, or native overlay is installed;
`/usr/share/omarchy` is untouched.
"""
import argparse, os, pathlib, shutil, subprocess, sys

root = pathlib.Path(__file__).resolve().parents[1]
home = pathlib.Path.home()
shim = home / '.local/bin/physis'
desktop = home / '.local/share/applications/physis.desktop'
unit = home / '.config/systemd/user/physis.service'

UNIT = f"""[Unit]
Description=Physis web app service (loopback studio and capture library)
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
WorkingDirectory={root}
ExecStart={shutil.which('node') and os.path.realpath(shutil.which('node')) or 'node'} {root}/server/index.mjs
Restart=on-failure
RestartSec=2
TimeoutStopSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=graphical-session.target
"""

DESKTOP = f"""[Desktop Entry]
Type=Application
Name=Physis
Comment=Point-cloud studio web app
Exec={shim} open
Icon=applications-graphics
Terminal=false
Categories=Graphics;AudioVideo;
StartupNotify=true
"""

def user(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(args, check=True)

def install(serve: bool) -> None:
    shim.parent.mkdir(parents=True, exist_ok=True)
    shim.write_text(f'#!/bin/sh\nexec {sys.executable} {root}/scripts/physis "$@"\n')
    shim.chmod(0o755)
    desktop.parent.mkdir(parents=True, exist_ok=True)
    desktop.write_text(DESKTOP)
    unit.parent.mkdir(parents=True, exist_ok=True)
    unit.write_text(UNIT)
    user('systemctl', '--user', 'daemon-reload')
    if serve:
        user('systemctl', '--user', 'enable', '--now', 'physis.service')
        print('Physis service enabled and started.')
    else:
        print('Installed. Start the service with: systemctl --user enable --now physis.service')
    print(f'Launcher: {desktop} · command: {shim}')

def uninstall() -> None:
    subprocess.run(['systemctl', '--user', 'disable', '--now', 'physis.service'], check=False)
    for path in (unit, desktop, shim):
        try: path.unlink()
        except FileNotFoundError: pass
    user('systemctl', '--user', 'daemon-reload')
    print('Physis web app removed. The media library under ~/.local/share/physis was kept.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--uninstall', action='store_true', help='remove shim, launcher, and service')
    parser.add_argument('--no-start', action='store_true', help='install without enabling the service')
    args = parser.parse_args()
    uninstall() if args.uninstall else install(serve=not args.no_start)
