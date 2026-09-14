#!/usr/bin/env python3
"""Build Physis using installed GTK/WebKit headers and a pinned local layer-shell library.
No system packages are installed. The dependency's source and LGPL license remain in build/.
"""
from pathlib import Path
import subprocess, shlex
root = Path(__file__).resolve().parents[1]
out = root / 'build'
out.mkdir(exist_ok=True)
src = out / 'gtk-layer-shell'
revision = "eb7876471dea74697c0212198d1a8e6d83aa5583"
def run(args): subprocess.run([str(a) for a in args], check=True)
if not (src / '.git').exists(): run(['git','clone','https://github.com/wmww/gtk-layer-shell.git',src])
run(['git','-C',src,'checkout','--detach',revision])
protocols = Path(subprocess.check_output(['pkg-config','--variable=pkgdatadir','wayland-protocols'],text=True).strip())
for p in [src/'protocol/wlr-layer-shell-unstable-v1.xml', protocols/'stable/xdg-shell/xdg-shell.xml', protocols/'staging/ext-session-lock/ext-session-lock-v1.xml']:
    for mode,suffix in [('client-header','-client.h'),('private-code','.c')]: run(['wayland-scanner','-c',mode,p,out/(p.stem+suffix)])
def flags(*packages): return shlex.split(subprocess.check_output(['pkg-config','--cflags','--libs',*packages],text=True))
run(['cc','-shared','-fPIC','-O2','-DGTK_LAYER_SHELL_MAJOR=0','-DGTK_LAYER_SHELL_MINOR=10','-DGTK_LAYER_SHELL_MICRO=1','-I'+str(src/'include'),'-I'+str(src/'gtk-priv/h'),'-I'+str(out),*sorted((src/'src').glob('*.c')),*sorted(out.glob('*.c')),*flags('gtk+-3.0','wayland-client'),'-o',out/'libgtk-layer-shell.so'])
run(['cc','-O2',root/'desktop/overlay.c','-I'+str(src/'include'),'-L'+str(out),'-Wl,-rpath,$ORIGIN','-lgtk-layer-shell',*flags('gtk+-3.0','webkit2gtk-4.1'),'-o',out/'physis-overlay'])
