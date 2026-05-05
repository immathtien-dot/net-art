/**
 * (p5.sound) — Pop / Bubble / UI tap / Wood…
 */

function sfxAmp(base) {
  const v =
    typeof sfxVolume !== "undefined" ? constrain(sfxVolume, 0, 1) : 0.5;
  return base * v;
}

function _stopOscLater(o, ms, fadeMs) {
  setTimeout(() => {
    try {
      o.amp(0, fadeMs / 1000);
      setTimeout(() => {
        try {
          o.stop();
        } catch (e) {}
      }, fadeMs + 15);
    } catch (e) {}
  }, ms);
}

/** Click */
function sfxSoftClick() {
  try {
    const o = new p5.Oscillator();
    o.setType("triangle");
    o.freq(920);
    o.amp(0);
    o.start();
    o.amp(sfxAmp(0.14), 0.003);
    _stopOscLater(o, 28, 35);
  } catch (e) {}
}

/** Tap */
function sfxUiTap() {
  try {
    const o = new p5.Oscillator();
    o.setType("sine");
    o.freq(1320);
    o.amp(0);
    o.start();
    o.amp(sfxAmp(0.16), 0.002);
    _stopOscLater(o, 22, 28);
  } catch (e) {}
}

/** Drag */
function sfxPop() {
  try {
    const o = new p5.Oscillator();
    o.setType("sine");
    o.freq(360);
    o.amp(0);
    o.start();
    o.amp(sfxAmp(0.17), 0.006);
    o.freq(620, 0.05);
    _stopOscLater(o, 42, 42);
  } catch (e) {}
}

/** Pop */
function sfxBubblePop() {
  try {
    const o = new p5.Oscillator();
    o.setType("sine");
    o.freq(520);
    o.amp(0);
    o.start();
    o.amp(sfxAmp(0.2), 0.004);
    o.freq(1050, 0.08);
    _stopOscLater(o, 78, 55);
  } catch (e) {}
}

/** WoodClick */
function sfxWoodClick() {
  try {
    const n = new p5.Noise("brown");
    n.amp(0);
    n.start();
    n.amp(sfxAmp(0.28), 0.004);
    _noiseStopLater(n, 48, 45);
  } catch (e) {
    try {
      const o = new p5.Oscillator();
      o.setType("triangle");
      o.freq(410);
      o.amp(0);
      o.start();
      o.amp(sfxAmp(0.18), 0.005);
      _stopOscLater(o, 55, 50);
    } catch (e2) {}
  }
}

function _noiseStopLater(n, ms, fadeMs) {
  setTimeout(() => {
    try {
      n.amp(0, fadeMs / 1000);
      setTimeout(() => {
        try {
          n.stop();
        } catch (e) {}
      }, fadeMs + 20);
    } catch (e) {}
  }, ms);
}

/** Unhappy */
function sfxUnhappyTap() {
  try {
    const o = new p5.Oscillator();
    o.setType("triangle");
    o.freq(220);
    o.amp(0);
    o.start();
    o.amp(sfxAmp(0.15), 0.005);
    o.freq(140, 0.12);
    _stopOscLater(o, 100, 70);
  } catch (e) {}
}
