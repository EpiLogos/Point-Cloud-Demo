"""Manual verification: automation transport, loop, menu memory, 3D section.

Run with the dev server up:  /usr/local/bin/python3 tests/verify_studio_ux.py
"""
from pathlib import Path
import json, os, sys, time

sys.path.insert(0, str(Path(__file__).resolve().parent))
from harness import browser_session

URL = os.environ.get('OI_TEST_URL', 'http://localhost:4173/')
results = []

def check(name, ok, detail=''):
    results.append({'ok': bool(ok), 'name': name, 'detail': str(detail)})
    print(('PASS ' if ok else 'FAIL ') + name + ((' — ' + str(detail)) if detail else ''))

def click_section(page, value):
    page.evaluate(f"""() => {{
      const b = document.querySelector('[data-action="studio-section"][data-value="{value}"]');
      if (b) b.click();
    }}""")

def section_current(page):
    return page.evaluate("""() => document.querySelector('[data-action="studio-section"][aria-current="page"]')?.dataset.value ?? null""")

def play_button(page):
    return page.evaluate("""() => {
      const b = document.getElementById('studio-play');
      return {label: b?.textContent.trim(), pressed: b?.getAttribute('aria-pressed'), title: b?.title};
    }""")

with browser_session({'width': 1280, 'height': 900}) as (_, ctx, page):
    errors = []
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.goto(URL, wait_until='load')
    page.wait_for_function('() => !!window.__FIELD_STUDIES__', timeout=45000)
    page.wait_for_timeout(3500)

    # ---- 1. Menu memory: open, move somewhere, scroll, close, reopen ---------
    page.evaluate("""() => document.querySelector('[data-action="studio"]').click()""")
    page.wait_for_timeout(400)
    first = section_current(page)
    check('first studio open lands on a section', first is not None, first)

    click_section(page, 'resonance')
    page.wait_for_timeout(300)
    # Expand a group and scroll the content deliberately
    page.evaluate("""() => {
      const c = document.getElementById('inspector-content');
      c.scrollTop = 340;
    }""")
    page.wait_for_timeout(300)
    scroll_before = page.evaluate("() => document.getElementById('inspector-content').scrollTop")
    page.evaluate("""() => document.querySelector('[data-action="close-studio"]').click()""")
    page.wait_for_timeout(300)
    page.evaluate("""() => document.querySelector('[data-action="studio"]').click()""")
    page.wait_for_timeout(400)
    check('reopen returns to the same studio section', section_current(page) == 'resonance', section_current(page))
    scroll_after = page.evaluate("() => document.getElementById('inspector-content').scrollTop")
    check('reopen restores the scroll position', abs(scroll_after - scroll_before) <= 30, f'{scroll_before} → {scroll_after}')

    # ---- 2. 3D body & depth has its own section ------------------------------
    click_section(page, 'volume')
    page.wait_for_timeout(300)
    vol = page.evaluate("""() => {
      const g = document.querySelector('[data-detail="volume"]');
      return {present: !!g, binds: g ? [...g.querySelectorAll('[data-bind]')].map(e => e.getAttribute('data-bind')) : []};
    }""")
    check('the volume group lives in its own section', vol['present'])
    check('it still carries the volume master toggle', 'engine.volumeEnabled' in vol['binds'])
    check('it still carries the depth profile select', 'engine.volumeProfile' in vol['binds'])
    click_section(page, 'appearance')
    page.wait_for_timeout(300)
    app_now = page.evaluate("""() => ({
      volume: !!document.querySelector('[data-detail="volume"]'),
      palette: !!document.querySelector('[data-detail="palette"]'),
      material: !!document.querySelector('[data-detail="material"]'),
    })""")
    check('Colour & material no longer contains the 3D group', not app_now['volume'], app_now)
    check('Colour & material keeps palette and material', app_now['palette'] and app_now['material'])

    # ---- 3. Automation transport: fire, run, return to play; physics untouched
    click_section(page, 'automation')
    page.wait_for_timeout(300)
    # Create a lane through the authoring UI, then make it a short one-shot.
    page.evaluate("""() => document.querySelector('[data-action="add-lane"]')?.click()""")
    page.wait_for_timeout(300)
    created = page.evaluate("""() => {
      const sel = document.getElementById('assignment-target');
      if (!sel) return false;
      sel.value = sel.options[0].value;
      sel.dispatchEvent(new Event('change', {bubbles: true}));
      const confirm = document.querySelector('[data-action="confirm-group-target"]');
      confirm?.click();
      return true;
    }""")
    check('a new automation lane was authored', created)
    page.wait_for_timeout(400)
    lane = page.evaluate("""() => {
      const s = window.__FIELD_STUDIES__.getDocument().scenes[0];
      const lane = s.automation.at(-1);
      return lane ? {id: lane.id, type: lane.type, duration: lane.duration, loop: lane.loop} : null;
    }""")
    check('the lane exists on the scene', lane is not None, lane)
    # Flip it to a 1.2s one-shot through the editor's own controls.
    page.evaluate("""(lane) => {
      const type = document.querySelector(`select[data-bind="lane.${lane.id}.type"]`);
      if (type) { type.value = 'ramp'; type.dispatchEvent(new Event('change', {bubbles: true})); }
      const dur = document.querySelector(`input[data-bind="lane.${lane.id}.duration"]`);
      if (dur) { dur.value = '1.2'; dur.dispatchEvent(new Event('input', {bubbles: true})); dur.dispatchEvent(new Event('change', {bubbles: true})); }
    }""", lane)
    page.wait_for_timeout(400)
    lane = page.evaluate("""() => {
      const s = window.__FIELD_STUDIES__.getDocument().scenes[0];
      const lane = s.automation.at(-1);
      return {id: lane.id, type: lane.type, duration: lane.duration};
    }""")
    check('the lane is now a one-shot ramp', lane['type'] == 'ramp', lane)

    page.evaluate('window.__FIELD_STUDIES__.play()')
    page.wait_for_timeout(300)
    playing_before = page.evaluate("() => window.__FIELD_STUDIES__.getState().playing")
    sim_before = page.evaluate("() => window.__FIELD_STUDIES__.getState().simTime")

    page.evaluate("""() => document.getElementById('studio-play').click()""")
    page.wait_for_timeout(400)
    during = play_button(page)
    state = page.evaluate("() => window.__FIELD_STUDIES__.getState()")
    check('pressing the transport starts the automation (button shows running)', during['pressed'] == 'true', during)
    check('the physics clock is untouched by the transport', state['playing'] == playing_before, state['playing'])

    # Software WebGL advances sim time several times slower than wall time, so poll
    # until the transport actually returns to Play rather than waiting a fixed gap.
    def wait_for_play(max_ms=30000):
        try:
            page.wait_for_function("() => document.getElementById('studio-play').getAttribute('aria-pressed') === 'false'", timeout=max_ms)
            return True
        except Exception:
            return False

    sim_after = page.evaluate("() => window.__FIELD_STUDIES__.getState()")
    settled = wait_for_play()
    after = play_button(page)
    sim_done = page.evaluate("() => window.__FIELD_STUDIES__.getState()")
    check('the transport returns to Play when the automation finishes', settled and after['pressed'] == 'false', after)
    check('the forces keep playing after the automation finished', sim_done['playing'] and sim_done['simTime'] > sim_after['simTime'], f"sim {sim_after['simTime']:.2f} → {sim_done['simTime']:.2f}")

    # ---- 4. Loop: the automation re-arms on completion ------------------------
    page.evaluate("""() => document.getElementById('automation-loop').click()""")
    page.wait_for_timeout(200)
    check('the loop latch reports on', page.evaluate("() => window.__FIELD_STUDIES__.getState().automationLoop"))
    trace = page.evaluate("""() => new Promise(res => {
      const lane = window.__FIELD_STUDIES__.getDocument().scenes[0].automation.at(-1);
      const nativeId = lane.nativeId ?? lane.id;
      const phases = [];
      const t0 = performance.now();
      const step = () => {
        const live = (window.__FIELD_STUDIES__.telemetry()?.live ?? []).find(v => v.id === nativeId);
        phases.push(live ? live.phase : -1);
        const wraps = phases.slice(1).filter((p, i) => p < 0.5 && phases[i] > 0.8).length;
        (wraps < 2 && performance.now() - t0 < 40000) ? setTimeout(step, 150) : res({phases, wraps, ms: performance.now() - t0});
      };
      step();
    })""")
    check('loop re-arms the finished ramp (phase wraps)', trace['wraps'] >= 2, f"{trace['wraps']} wraps in {trace['ms']:.0f}ms")
    during_loop = play_button(page)
    check('while looping, the transport shows running', during_loop['pressed'] == 'true', during_loop)

    # ---- 5. Health ------------------------------------------------------------
    check('no page errors were reported', not errors, errors[:3])

print()
failed = [r for r in results if not r['ok']]
print(json.dumps({'results': results}, indent=2))
sys.exit(1 if failed else 0)
