let doll;
let bgImage;
let tryonTitleGif;
let ootdTitleGif;
let bgMusic;
let cnv;
let outfits = [];
/**reaction Happy / Unhappy */
let reactionPrompt = null;
/** choice */
let happyCelebration = false;
let celebrationOutfit = null;

// start screen
let gameState = "start"; // "start" | "play"
let playerName = "";
let nameInputEl;
let enterButtonEl;

//(scale theo viewport)
const DESIGN_W = 1200;
const DESIGN_H = 750;
const VIEW_HEIGHT_RATIO = 0.9;
const VIEW_WIDTH_MARGIN = 0.98;

// scale for fit
const OUTFIT_SCALE = 0.32 * 1.04;
const DOLL_SCALE = OUTFIT_SCALE;
const HOVER_SHAKE_PX = 2; // rung nhẹ
let musicVolume = 0.4;
/** sfx/vol */
let sfxVolume = 0.55;
let volumeSliderDragging = null;

// celebration particle trail system (rainbow / firework-like)
let particles = [];
let particleHue = 0; // cycles hue for rainbow effect
const MAX_PARTICLES = 300;
let followDrawActive = false; // when true, emit particles at pointer each frame during celebration


function preload() {
  const safeLoad = (path) =>
    loadImage(
      path,
      () => {},
      () => console.error("[loadImage failed]", path)
    );

  doll = safeLoad("assets/doll.png");
  bgImage = safeLoad("assets/background.png");
  tryonTitleGif = safeLoad("assets/tryon.GIF");
  ootdTitleGif = safeLoad("assets/ootd.gif");
  bgMusic = loadSound(
    "assets/sound.mp3",
    () => {},
    () => console.error("[loadSound failed]", "assets/sound.mp3")
  );

  const paths = [
    "assets/blue.png",
    "assets/cream.png",
    "assets/green.png",
    "assets/grey.png",
    "assets/pink.png"
  ];

  outfits = paths.map((p) => ({
    img: safeLoad(p),
    placed: false,
    dragging: false,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    offsetX: 0,
    offsetY: 0,
    relX: 0,
    relY: 0,
    lastReaction: null
  }));
}

function canvasDims() {
  const maxW = window.innerWidth * VIEW_WIDTH_MARGIN;
  let h = window.innerHeight * VIEW_HEIGHT_RATIO;
  let w = h * (DESIGN_W / DESIGN_H);
  if (w > maxW) {
    w = maxW;
    h = w * (DESIGN_H / DESIGN_W);
  }
  return { w: max(240, floor(w)), h: max(200, floor(h)) };
}

function startUiLayout() {
  const rowW = min(560, width * 0.84);
  const h = max(44, min(56, height * 0.08));
  const gap = 14;
  const enterW = min(130, max(96, rowW * 0.22));
  const inputW = rowW - enterW - gap;
  const x = (width - rowW) / 2;
  const y = height / 2 - h / 2;
  return {
    input: { x, y, w: inputW, h },
    enter: { x: x + inputW + gap, y, w: enterW, h }
  };
}

/** GIF OOTD */
function ootdStartTitleLayout() {
  if (!ootdTitleGif || ootdTitleGif.width <= 0) return null;
  const L = startUiLayout();
  const rowTop = L.input.y;
  const gap = 18;
  const topPad = 10;
  const maxH = rowTop - gap - topPad;
  if (maxH < 28) return null;
  const maxW = width * 0.82;
  let dw = ootdTitleGif.width;
  let dh = ootdTitleGif.height;
  const sc = min(maxW / dw, maxH / dh);
  const OOTD_START_TITLE_MULT = 1.5;
  dw *= sc * OOTD_START_TITLE_MULT;
  dh *= sc * OOTD_START_TITLE_MULT;
  if (dw > width * 0.96) {
    const r = (width * 0.96) / dw;
    dw *= r;
    dh *= r;
  }
  const x = (width - dw) / 2;
  let y = rowTop - gap - dh;
  if (y < 0) y = 0;
  return { x, y, w: dw, h: dh };
}

function drawOotdStartTitle() {
  const box = ootdStartTitleLayout();
  if (!box) return;
  image(ootdTitleGif, box.x, box.y, box.w, box.h);
}

function showStartUI() {
  if (!nameInputEl || !enterButtonEl) return;
  const L = startUiLayout();
  const r = cnv?.elt?.getBoundingClientRect?.();
  const baseX = (r?.left ?? 0) + window.scrollX;
  const baseY = (r?.top ?? 0) + window.scrollY;

  nameInputEl.position(baseX + L.input.x, baseY + L.input.y);
  nameInputEl.size(L.input.w, L.input.h);
  enterButtonEl.position(baseX + L.enter.x, baseY + L.enter.y);
  enterButtonEl.size(L.enter.w, L.enter.h);
  nameInputEl.show();
  enterButtonEl.show();
}

function hideStartUI() {
  if (nameInputEl) nameInputEl.hide();
  if (enterButtonEl) enterButtonEl.hide();
}

function startGameFromStartScreen() {
  playerName = nameInputEl ? (nameInputEl.value() || "").trim() : "";
  gameState = "play";
  hideStartUI();
  layoutPalette();
  startBackgroundMusic();
  sfxUiTap();
}

function applyMusicVolume() {
  if (!bgMusic || !bgMusic.isLoaded()) return;
  bgMusic.setVolume(musicVolume);
}

function startBackgroundMusic() {
  if (!bgMusic || !bgMusic.isLoaded()) return;
  if (bgMusic.isPlaying()) return;
  applyMusicVolume();
  bgMusic.loop();
}

function volumePanelsLayout() {
  const m = min(14, width * 0.018);
  const trackW = min(120, width * 0.2);
  const trackH = max(8, min(11, height * 0.014));
  const labelW = 44;
  const pad = 6;
  const rowGap = 10;
  const totalW = labelW + pad + trackW;
  const x0 = width - m - totalW;
  const yTop = m + 2;

  const musicTrackY = yTop + 6;
  const sfxTrackY = musicTrackY + trackH + rowGap + 8;

  const music = {
    trackX: x0 + labelW + pad,
    trackY: musicTrackY,
    trackW,
    trackH,
    labelX: x0
  };
  const sfx = {
    trackX: x0 + labelW + pad,
    trackY: sfxTrackY,
    trackW,
    trackH,
    labelX: x0
  };

  return { music, sfx, hitPad: 12 };
}

function volumeFromMouseX(mx, row) {
  return constrain((mx - row.trackX) / row.trackW, 0, 1);
}

function drawVolumeRow(row, value, label, fillHi) {
  const kx = row.trackX + row.trackW * value;
  const cy = row.trackY + row.trackH / 2;

  push();
  fill(35, 65, 130);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(max(11, width * 0.02));
  text(label, row.labelX, cy);

  fill(255, 252, 255, 230);
  stroke(70, 110, 170);
  strokeWeight(1.5);
  rect(row.trackX - 3, row.trackY - 3, row.trackW + 6, row.trackH + 6, 5);

  noStroke();
  fill(200, 215, 245);
  rect(row.trackX, row.trackY, row.trackW, row.trackH, 3);
  fill(fillHi);
  rect(row.trackX, row.trackY, row.trackW * value, row.trackH, 3);

  fill(255);
  stroke(70, 110, 170);
  strokeWeight(2);
  circle(kx, cy, 16);
  pop();
}

function drawVolumeControl() {
  const L = volumePanelsLayout();
  drawVolumeRow(L.music, musicVolume, "Vol", color(90, 140, 220));
  drawVolumeRow(L.sfx, sfxVolume, "SFX", color(80, 190, 160));
}

/** name tag */
function drawPlayerNameTag() {
  if (gameState !== "play" || !playerName) return;

  const display =
    playerName.length > 28 ? `${playerName.slice(0, 25)}…` : playerName;
  const m = min(14, width * 0.018);
  const padX = 12;
  const padY = 9;

  push();
  textAlign(LEFT, CENTER);
  textSize(max(12, min(18, width * 0.024)));
  const tw = textWidth(display);
  const boxW = min(width * 0.42, tw + padX * 2);
  const boxH = max(34, textAscent() + textDescent() + padY * 2);

  fill(255, 252, 255, 235);
  stroke(70, 110, 170);
  strokeWeight(2);
  rect(m, m, boxW, boxH, 12);

  fill(35, 65, 130);
  noStroke();
  text(display, m + padX, m + boxH / 2);
  pop();
}

function hitVolumeRow(px, py, row, hitPad) {
  const left = row.labelX - 4;
  const top = row.trackY - hitPad;
  const right = row.trackX + row.trackW + hitPad;
  const bottom = row.trackY + row.trackH + hitPad;
  return px >= left && px <= right && py >= top && py <= bottom;
}

/** @returns {"music" | "sfx" | null} */
function hitWhichVolumeSlider(px, py) {
  const L = volumePanelsLayout();
  const hp = L.hitPad;
  if (hitVolumeRow(px, py, L.music, hp)) return "music";
  if (hitVolumeRow(px, py, L.sfx, hp)) return "sfx";
  return null;
}

function setup() {
  const { w, h } = canvasDims();
  cnv = createCanvas(w, h);
  // ensure the canvas sits inside our responsive container
  const container = document.getElementById('game-container');
  if (container && cnv && cnv.elt) {
    container.appendChild(cnv.elt);
  }
  layoutPalette();

  if (typeof userStartAudio === "function") {
    userStartAudio().then(() => startBackgroundMusic()).catch(() => {});
  }

  // start screen UI (DOM)
  nameInputEl = createInput("");
  // add classes for responsive CSS
  nameInputEl.elt.classList.add('p5-ui','p5-input');
  nameInputEl.attribute("placeholder", "Type the name");
  nameInputEl.elt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGameFromStartScreen();
  });

  enterButtonEl = createButton("Enter");
  enterButtonEl.elt.classList.add('p5-ui','p5-button');
  enterButtonEl.mousePressed(() => startGameFromStartScreen());

  showStartUI();
}

function windowResized() {
  const { w, h } = canvasDims();
  resizeCanvas(w, h);
  layoutPalette();
  if (gameState === "start") showStartUI();
}

function dollLayout() {
  const dw = (doll?.width ?? 260) * DOLL_SCALE;
  const dh = (doll?.height ?? 520) * DOLL_SCALE;

  if (happyCelebration && celebrationOutfit) {
    const o = celebrationOutfit;
    const ow = o.w || getScaledOutfitSize(o.img).w;
    const oh = o.h || getScaledOutfitSize(o.img).h;
    const rx = o.relX;
    const ry = o.relY;
    const left = min(0, rx);
    const right = max(dw, rx + ow);
    const top = min(0, ry);
    const bottom = max(dh, ry + oh);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    return {
      x: width / 2 - cx,
      y: height / 2 - cy,
      w: dw,
      h: dh
    };
  }

  return {
    x: (width - dw) / 2,
    y: height - dh,
    w: dw,
    h: dh
  };
}

function getScaledOutfitSize(img) {
  const iw = img?.width ?? 0;
  const ih = img?.height ?? 0;
  return { w: iw * OUTFIT_SCALE, h: ih * OUTFIT_SCALE };
}

function cssRemToPx(rem = 1) {
  let rootPx = 16;
  if (typeof document !== "undefined") {
    const fs = getComputedStyle(document.documentElement).fontSize;
    const n = parseFloat(fs);
    if (Number.isFinite(n)) rootPx = n;
  }
  return rem * rootPx;
}


function tryonTitleLayout() {
  if (!tryonTitleGif || tryonTitleGif.width <= 0) {
    return { x: 0, y: 0, w: 0, h: 0, bottom: 0 };
  }
  const maxW = min(width * 0.96, width * 0.72 * 1.3 * 1.7);
  const maxH = min(height * 0.32, height * 0.13 * 1.3 * 1.7);
  let dw = tryonTitleGif.width;
  let dh = tryonTitleGif.height;
  const sc = min(maxW / dw, maxH / dh);
  dw *= sc;
  dh *= sc;

  // 
  const SIZE_MULT = 0.7; // 70%
  const STRETCH_X = 1.1; // +10% width
  dw *= SIZE_MULT * STRETCH_X;
  dh *= SIZE_MULT;

  const x = (width - dw) / 2;
  const oneRem = cssRemToPx(1);
  const y = height * 0.065 - dh / 2 - oneRem;
  return { x, y, w: dw, h: dh, bottom: y + dh + 6 };
}

function drawTryonTitleBanner() {
  if (gameState !== "play") return;
  if (reactionPrompt || outfits.some((o) => o.placed)) return;
  const L = tryonTitleLayout();
  if (L.w <= 0 || L.h <= 0) return;
  image(tryonTitleGif, L.x, L.y, L.w, L.h);
}

function paletteRowGeometry() {
  if (gameState !== "play") return null;
  if (happyCelebration) return null;

  const d = dollLayout();
  const outfitGap = 14;
  const topMargin = 6;
  const aboveDollGap = 8;

  const paletteLift = min(90, max(40, height * 0.07));

  const paletteItems = outfits.filter((o) => !o.placed);
  if (paletteItems.length === 0) return null;

  const scaledW = paletteItems.map((o) => getScaledOutfitSize(o.img).w);
  const scaledH = paletteItems.map((o) => getScaledOutfitSize(o.img).h);

  const totalW =
    scaledW.reduce((sum, w) => sum + w, 0) + outfitGap * (paletteItems.length - 1);

  let ox = (width - totalW) / 2;
  const maxOutfitH = max(0, ...scaledH);
  const oy = max(topMargin, d.y - maxOutfitH - aboveDollGap - paletteLift);

  const slots = [];
  for (let i = 0; i < paletteItems.length; i++) {
    slots.push({ x: ox, y: oy, w: scaledW[i], h: scaledH[i] });
    ox += scaledW[i] + outfitGap;
  }
  return { paletteItems, scaledW, scaledH, slots };
}

function layoutPalette() {
  const geom = paletteRowGeometry();
  if (!geom) return;

  const { paletteItems, scaledW, scaledH, slots } = geom;
  for (let i = 0; i < paletteItems.length; i++) {
    const o = paletteItems[i];
    const w = scaledW[i];
    const h = scaledH[i];
    const slot = slots[i];
    if (!o.dragging) {
      o.x = slot.x;
      o.y = slot.y;
    }
    o.w = w;
    o.h = h;
  }
}

function isMouseOverRect(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function backButtonLayout() {
  const bw = min(140, width * 0.2);
  const bh = max(34, min(46, height * 0.058));
  const m = min(14, width * 0.018);
  return { x: m, y: m, w: bw, h: bh };
}

function drawBackRestartButton() {
  if (!happyCelebration) return;

  const B = backButtonLayout();
  const hover = isMouseOverRect(B.x, B.y, B.w, B.h);

  push();
  fill(hover ? 248 : 255, hover ? 252 : 255, 255, 240);
  stroke(70, 110, 170);
  strokeWeight(2);
  rect(B.x, B.y, B.w, B.h, 12);

  fill(35, 65, 130);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(max(13, min(18, width * 0.026)));
  text("↺  Back", B.x + B.w / 2, B.y + B.h / 2);
  pop();
}

function restartGame() {
  gameState = "start";
  happyCelebration = false;
  celebrationOutfit = null;
  reactionPrompt = null;
  for (const o of outfits) {
    o.placed = false;
    o.dragging = false;
    o.lastReaction = null;
    o.relX = 0;
    o.relY = 0;
  }
  layoutPalette();
  showStartUI();
  followDrawActive = false;
}

function reactionButtonLayout() {
  const d = dollLayout();
  const bw = min(160, width * 0.22);
  const bh = max(36, min(50, height * 0.065));
  const gap = min(18, width * 0.02);
  const totalW = bw * 2 + gap;
  const bx = (width - totalW) / 2;
  const gapAboveDoll = 22;
  let by = d.y - bh - gapAboveDoll;
  const topSafe = 8;
  if (by < topSafe) {
    by = topSafe;
  }
  return {
    happy: { x: bx, y: by, w: bw, h: bh },
    unhappy: { x: bx + bw + gap, y: by, w: bw, h: bh }
  };
}

function drawReactionPrompt() {
  if (!reactionPrompt) return;

  const L = reactionButtonLayout();
  const pad = 14;
  const titleBar = 26;
  const panelX = L.happy.x - pad;
  const panelY = L.happy.y - pad - titleBar;
  const panelW = L.unhappy.x + L.unhappy.w - L.happy.x + pad * 2;
  const panelH = titleBar + L.happy.h + pad * 2;

  push();
  fill(20, 20, 25, 100);
  noStroke();
  rect(0, 0, width, height);

  fill(255, 252, 254, 245);
  stroke(255);
  strokeWeight(2);
  rect(panelX, panelY, panelW, panelH, 14);

  fill(55, 55, 70);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(max(12, width * 0.024));
  text("How does this look?", panelX + panelW / 2, panelY + titleBar / 2 + 2);

  textAlign(CENTER, CENTER);
  const ts = max(13, min(20, width * 0.028));
  textSize(ts);

  fill(95, 180, 120);
  stroke(60, 120, 80);
  strokeWeight(1.5);
  rect(L.happy.x, L.happy.y, L.happy.w, L.happy.h, 10);
  fill(255);
  noStroke();
  text("Happy", L.happy.x + L.happy.w / 2, L.happy.y + L.happy.h / 2);

  fill(200, 130, 160);
  stroke(140, 80, 100);
  strokeWeight(1.5);
  rect(L.unhappy.x, L.unhappy.y, L.unhappy.w, L.unhappy.h, 10);
  fill(255);
  noStroke();
  text("Unhappy", L.unhappy.x + L.unhappy.w / 2, L.unhappy.y + L.unhappy.h / 2);
  pop();
}

function hoverShakeOffset(seed) {
  const t = frameCount * 0.25;
  const dx = sin(t + seed) * HOVER_SHAKE_PX;
  const dy = cos(t * 1.1 + seed) * (HOVER_SHAKE_PX * 0.6);
  return { dx, dy };
}

function drawOutfit(o, seed) {
  if (!o.img) return;

  const hovering = !o.dragging && isMouseOverRect(o.x, o.y, o.w, o.h);
  const { dx, dy } = hovering ? hoverShakeOffset(seed) : { dx: 0, dy: 0 };
  image(o.img, o.x + dx, o.y + dy, o.w, o.h);
}

/** Bao hàng palette theo ô cố định — không dùng vị trí đang drag nên khung không bám theo. */
function paletteRowSlotBounds() {
  const geom = paletteRowGeometry();
  if (!geom) return null;
  const { slots } = geom;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of slots) {
    minX = min(minX, s.x);
    minY = min(minY, s.y);
    maxX = max(maxX, s.x + s.w);
    maxY = max(maxY, s.y + s.h);
  }
  return { minX, minY, maxX, maxY };
}

function drawWardrobePaletteBox() {
  if (gameState !== "play" || happyCelebration) return;
  const B = paletteRowSlotBounds();
  if (!B) return;

  const padX = min(22, width * 0.022);
  const padY = min(18, height * 0.028);
  const x = B.minX - padX;
  const y = B.minY - padY;
  const w = B.maxX - B.minX + padX * 2;
  const h = B.maxY - B.minY + padY * 2;
  const r = min(32, min(w, h) * 0.22);

  push();
  fill(255, 250, 252, 230);
  stroke(200, 150, 175);
  strokeWeight(2.5);
  rect(x, y, w, h, r);
  pop();
}

function drawBackground() {
  if (bgImage && bgImage.width > 0) {
    // center-crop like CSS `background-size: cover`
    const iw = bgImage.width;
    const ih = bgImage.height;
    const scale = max(width / iw, height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    image(bgImage, dx, dy, dw, dh);
  } else {
    background(255, 220, 240);
  }
}

function draw() {
  drawBackground();

  if (gameState === "start") {
    // keep DOM UI locked to canvas center
    showStartUI();

    drawOotdStartTitle();
    return;
  }

  layoutPalette();

  drawWardrobePaletteBox();

  drawTryonTitleBanner();

  const d = dollLayout();
  const anyDragging = outfits.some((o) => o.dragging);
  const hoveringDoll =
    !happyCelebration && !anyDragging && isMouseOverRect(d.x, d.y, d.w, d.h);
  const { dx: ddx, dy: ddy } = hoveringDoll
    ? hoverShakeOffset(99.3)
    : { dx: 0, dy: 0 };

  // doll (base)
  image(doll, d.x + ddx, d.y + ddy, d.w, d.h);

  // placed outfits (on top of doll = "worn")
  for (let i = 0; i < outfits.length; i++) {
    const o = outfits[i];
    if (!o.placed) continue;
    if (happyCelebration && o !== celebrationOutfit) continue;

    // keep stuck to doll even when doll uses a visual shake offset
    const baseX = d.x + o.relX;
    const baseY = d.y + o.relY;
    const ox = o.dragging ? o.x : baseX + ddx;
    const oy = o.dragging ? o.y : baseY + ddy;

    const hovering = !o.dragging && isMouseOverRect(ox, oy, o.w, o.h);
    const { dx, dy } = hovering ? hoverShakeOffset(i * 10.7 + 20) : { dx: 0, dy: 0 };
    if (!o.img) continue;
    image(o.img, ox + dx, oy + dy, o.w, o.h);
  }

  // palette outfits last (easy to grab)
  if (!happyCelebration) {
    for (let i = 0; i < outfits.length; i++) {
      const o = outfits[i];
      if (o.placed) continue;
      drawOutfit(o, i * 10.7);
    }
  }

  

  // follow-draw: emit at pointer when active
  if (happyCelebration && followDrawActive) {
    const px = constrain(mouseX, 0, width);
    const py = constrain(mouseY, 0, height);
    // emit trail density scaled to device
    for (let i = 0; i < 6; i++) emitParticle(px + random(-6, 6), py + random(-6, 6));
  }

  // draw particles on top
  updateAndDrawParticles();

  drawReactionPrompt();
  drawBackRestartButton();
  drawVolumeControl();
  drawPlayerNameTag();
}

function mousePressed() {
  startBackgroundMusic();

  if (gameState === "start") {
    return;
  }

  const volHit = hitWhichVolumeSlider(mouseX, mouseY);
  if (volHit === "music") {
    volumeSliderDragging = "music";
    const L = volumePanelsLayout();
    musicVolume = volumeFromMouseX(mouseX, L.music);
    applyMusicVolume();
    sfxUiTap();
    return;
  }
  if (volHit === "sfx") {
    volumeSliderDragging = "sfx";
    const L = volumePanelsLayout();
    sfxVolume = volumeFromMouseX(mouseX, L.sfx);
    sfxUiTap();
    return;
  }

  if (happyCelebration) {
    const B = backButtonLayout();
    if (isMouseOverRect(B.x, B.y, B.w, B.h)) {
      sfxWoodClick();
      restartGame();
    }
    // start follow-draw mode when clicking anywhere else during celebration
    followDrawActive = true;
    // small burst at click point
    for (let i = 0; i < 12; i++) emitParticle(mouseX + random(-12, 12), mouseY + random(-12, 12));
    return;
  }

  if (reactionPrompt) {
    const L = reactionButtonLayout();
    if (isMouseOverRect(L.happy.x, L.happy.y, L.happy.w, L.happy.h)) {
      reactionPrompt.outfit.lastReaction = "happy";
      celebrationOutfit = reactionPrompt.outfit;
      happyCelebration = true;
      reactionPrompt = null;
      sfxBubblePop();
      return;
    }
    if (isMouseOverRect(L.unhappy.x, L.unhappy.y, L.unhappy.w, L.unhappy.h)) {
      reactionPrompt.outfit.lastReaction = "unhappy";
      reactionPrompt = null;
      sfxUnhappyTap();
      return;
    }
    return;
  }

  // top-most first: placed outfits, then palette outfits
  for (let pass = 0; pass < 2; pass++) {
    for (let i = outfits.length - 1; i >= 0; i--) {
      const o = outfits[i];
      if (!o.img) continue;
      const wantPlaced = pass === 0;
      if (o.placed !== wantPlaced) continue;

      let hitX = o.x;
      let hitY = o.y;
      if (o.placed && !o.dragging) {
        const d = dollLayout();
        const hoveringDoll = isMouseOverRect(d.x, d.y, d.w, d.h);
        const { dx: ddx, dy: ddy } = hoveringDoll
          ? hoverShakeOffset(99.3)
          : { dx: 0, dy: 0 };
        hitX = d.x + o.relX + ddx;
        hitY = d.y + o.relY + ddy;
      }

      if (isMouseOverRect(hitX, hitY, o.w, o.h)) {
        o.dragging = true;
        // start drag from the actual on-screen position
        o.x = hitX;
        o.y = hitY;
        o.offsetX = mouseX - o.x;
        o.offsetY = mouseY - o.y;
        sfxPop();
        return;
      }
    }
  }
}

function mouseDragged() {
  if (gameState === "start") return;
  if (volumeSliderDragging === "music") {
    const L = volumePanelsLayout();
    musicVolume = volumeFromMouseX(mouseX, L.music);
    applyMusicVolume();
    return;
  }
  if (volumeSliderDragging === "sfx") {
    const L = volumePanelsLayout();
    sfxVolume = volumeFromMouseX(mouseX, L.sfx);
    return;
  }

  if (happyCelebration) return;

  for (const o of outfits) {
    if (!o.dragging) continue;
    o.x = mouseX - o.offsetX;
    o.y = mouseY - o.offsetY;
  }
}

function mouseReleased() {
  if (gameState === "start") return;
  if (volumeSliderDragging) {
    volumeSliderDragging = null;
    return;
  }

  if (happyCelebration) return;

  const d = dollLayout();

  for (const o of outfits) {
    if (!o.dragging) continue;
    const wasPlaced = o.placed;
    o.dragging = false;

    const cx = mouseX;
    const cy = mouseY;
    const overDoll = cx >= d.x && cx <= d.x + d.w && cy >= d.y && cy <= d.y + d.h;
    const becamePlaced = !wasPlaced && overDoll;

    if (overDoll) {
      o.placed = true;
      o.relX = o.x - d.x;
      o.relY = o.y - d.y;
      if (becamePlaced) {
        reactionPrompt = { outfit: o };
      }
    } else {
      o.placed = false;
    }

    if (overDoll && becamePlaced) {
      sfxPop();
    } else if (overDoll && wasPlaced) {
      sfxUiTap();
    } else {
      sfxSoftClick();
    }
  }

  layoutPalette();
}

function touchStarted() {
  // treat touch like a click in celebration: enable follow mode
  if (happyCelebration) {
    followDrawActive = true;
    return false; // prevent default
  }
  return true;
}

function touchEnded() {
  if (followDrawActive) followDrawActive = false;
  return false;
}

// ----------------- Particle system for celebration trails -----------------
class Particle {
  constructor(x, y, vx, vy, hue) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = random(700, 1200); // milliseconds — confetti linger a bit then fall
    this.birth = millis();
    this.hue = hue;
    this.size = random(2, 5.2); // slightly larger for confetti dots
    this.history = [];
  }

  update(dt) {
    // gravity-ish and drag
    this.vy += 0.06;
    this.vx *= 0.995;
    this.vy *= 0.995;
    this.x += this.vx * dt * 0.06;
    this.y += this.vy * dt * 0.06;

    // record short history (tiny ghost) for subtle overlap
    this.history.push({ x: this.x, y: this.y, t: millis() });
    if (this.history.length > 3) this.history.shift();
  }

  isDead() {
    return millis() - this.birth > this.life;
  }

  draw() {
    noStroke();
    // pastel confetti: low saturation, high brightness
    const sat = random(30, 48);
    const bri = random(88, 98);
    const age = millis() - this.birth;
    const alpha = map(this.life - age, 0, this.life, 18, 210);
    fill((this.hue) % 360, sat, bri, alpha);
    ellipse(this.x, this.y, this.size, this.size);
    // small highlight for sheen
    fill(0, 0, 100, alpha * 0.26);
    ellipse(this.x - this.size * 0.22, this.y - this.size * 0.22, this.size * 0.45, this.size * 0.45);
  }
}

function emitParticle(x, y) {
  if (particles.length > MAX_PARTICLES) return;
  const ang = random(TWO_PI);
  // confetti: slower spread, gentle fall
  const sp = random(0.8, 3.2);
  const vx = cos(ang) * sp + random(-0.3, 0.3);
  const vy = sin(ang) * sp + random(-0.3, 0.3) - random(0.6, 1.4);
  // pastel-friendly hue with jitter
  const hue = (particleHue + random(-30, 30) + 360) % 360;
  particles.push(new Particle(x, y, vx, vy, hue));
}


function updateAndDrawParticles() {
  // use HSB color mode for rainbow hues
  colorMode(HSB, 360, 100, 100, 255);
  const now = millis();
  const dt = constrain(now - (this._lastNow || now), 0, 60);
  this._lastNow = now;

  // step: update physics and cull dead
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(dt);
    if (p.isDead()) particles.splice(i, 1);
  }

  // draw confetti normally (pastel colors look better with normal blend)
  push();
  blendMode(NORMAL);
  for (let i = 0; i < particles.length; i++) {
    particles[i].draw();
  }
  pop();

  // slowly advance global hue
  particleHue = (particleHue + 0.45) % 360;
  // restore RGB mode for the rest of the sketch
  colorMode(RGB, 255);
}

