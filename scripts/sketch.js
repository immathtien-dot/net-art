/* global p5 */

// Custom cursor drawn by p5.js.
// Canvas is fixed, transparent, and ignores pointer events.

let cursorTrail = [];
const TRAIL_MAX = 18;

function setup() {
  const c = createCanvas(windowWidth, windowHeight);
  c.addClass("p5CursorCanvas");
  clear();

  // Draw at 60fps for smooth cursor
  frameRate(60);
  noCursor(); // p5's own cursor
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  clear();
}

function draw() {
  clear();

  const x = mouseX;
  const y = mouseY;

  // Keep a short trail (doll-house sparkle vibe)
  cursorTrail.unshift({ x, y, t: millis() });
  if (cursorTrail.length > TRAIL_MAX) cursorTrail.pop();

  // Trail
  noStroke();
  for (let i = 0; i < cursorTrail.length; i++) {
    const p = cursorTrail[i];
    const age = (millis() - p.t) / 260;
    const a = constrain(1 - age, 0, 1);
    const size = lerp(18, 2, i / (TRAIL_MAX - 1));
    fill(42, 36, 29, 90 * a);
    circle(p.x, p.y, size);

    fill(255, 255, 255, 130 * a);
    circle(p.x - 4, p.y - 4, size * 0.35);
  }

  // Main cursor dot
  const pulse = 0.5 + 0.5 * sin(millis() / 180);
  const r = 12 + pulse * 2.5;
  fill(42, 36, 29, 220);
  circle(x, y, r);

  // Highlight
  fill(255, 255, 255, 180);
  circle(x - r * 0.22, y - r * 0.22, r * 0.35);

  // Tiny cross sparkle
  stroke(255, 255, 255, 170);
  strokeWeight(2);
  const s = 10 + pulse * 4;
  line(x + 18, y - 18 - s, x + 18, y - 18 + s);
  line(x + 18 - s, y - 18, x + 18 + s, y - 18);
}
