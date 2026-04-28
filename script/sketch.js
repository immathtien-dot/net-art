const ASSETS = {
  gifs: ["images/1.GIF", "images/2.GIF", "images/3.GIF"],
  emptyCup: "images/empty-cup.PNG",
  fillGif: "images/fill.GIF",
  fillCup: "images/fill-cup.PNG",
  sip: "images/sip.GIF",
  end: "images/end.PNG",
};

const FILL_GIF_MS = 2200;

const Stage = Object.freeze({
  REVEAL_GIFS: "REVEAL_GIFS",
  CUP_WAIT_CLICK: "CUP_WAIT_CLICK",
  CUP_ZOOMED_WAIT_FILL: "CUP_ZOOMED_WAIT_FILL",
  FILLING: "FILLING",
  FILLED_WAIT_CLICK: "FILLED_WAIT_CLICK",
  SIP_WAIT_CLICK: "SIP_WAIT_CLICK",
  END: "END",
});

let stage = Stage.REVEAL_GIFS;
let shownGifs = 0;
let gifImgs = [];

let cupRootEl = null;
let cupWrapEl = null;
let emptyCupEl = null;
let fillMaskEl = null;
let fillImgEl = null;
let fillGifEl = null;
let filledCupEl = null;
let sipEl = null;
let endEl = null;

// fireworks
let fwCanvas = null;
let fwActive = false;
let bursts = [];
let lastSpawnMs = 0;

function setup() {
  fwCanvas = createCanvas(windowWidth, windowHeight);
  fwCanvas.hide();
  clear();
  noLoop();

  const gifRoot = select("#gif-root");
  cupRootEl = document.getElementById("cup-root");
  if (!gifRoot || !cupRootEl) return;

  gifImgs = ASSETS.gifs.map((src, i) => {
    const img = createImg(src, `GIF ${i + 1}`);
    img.addClass("gif");
    img.parent(gifRoot);
    if (i !== 0) img.hide();
    return img;
  });

  shownGifs = 1;

  buildCupDom();
  hideAllCup();

  document.addEventListener("click", onAnyClick);
  cupRootEl.addEventListener("click", onCupClick);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function onAnyClick() {
  if (stage === Stage.REVEAL_GIFS) {
    revealNextGif();
    return;
  }

  if (stage === Stage.CUP_ZOOMED_WAIT_FILL) {
    stage = Stage.FILLING;
    startFillAnimation();
    return;
  }

  if (stage === Stage.FILLING) return;

  if (stage === Stage.FILLED_WAIT_CLICK) {
    showSip();
    stage = Stage.SIP_WAIT_CLICK;
    return;
  }

  if (stage === Stage.SIP_WAIT_CLICK) {
    showEnd();
    stage = Stage.END;
    return;
  }
}

function onCupClick(e) {
  if (
    stage !== Stage.CUP_WAIT_CLICK ||
    !cupWrapEl ||
    !cupWrapEl.contains(e.target)
  ) {
    return;
  }

  e.stopPropagation();

  // zoom cup + hide gifs
  const gifRoot = document.getElementById("gif-root");
  if (gifRoot) gifRoot.style.display = "none";
  cupWrapEl.classList.add("zoom");

  stage = Stage.CUP_ZOOMED_WAIT_FILL;
}

function revealNextGif() {
  if (shownGifs >= gifImgs.length) {
    showEmptyCup();
    stage = Stage.CUP_WAIT_CLICK;
    return;
  }

  gifImgs[shownGifs].show();
  shownGifs += 1;

  if (shownGifs >= gifImgs.length) {
    showEmptyCup();
    stage = Stage.CUP_WAIT_CLICK;
  }
}

function buildCupDom() {
  cupRootEl.innerHTML = "";

  cupWrapEl = document.createElement("div");
  cupWrapEl.className = "cup-wrap";

  emptyCupEl = document.createElement("img");
  emptyCupEl.className = "cup-img";
  emptyCupEl.src = ASSETS.emptyCup;
  emptyCupEl.alt = "Empty cup";
  cupWrapEl.appendChild(emptyCupEl);

  // overlay fill animation gif aligned with empty cup
  fillGifEl = document.createElement("img");
  fillGifEl.className = "cup-overlay-img";
  fillGifEl.src = ASSETS.fillGif;
  fillGifEl.alt = "Filling";
  cupWrapEl.appendChild(fillGifEl);

  fillMaskEl = document.createElement("div");
  fillMaskEl.className = "fill-mask";
  fillImgEl = document.createElement("img");
  fillImgEl.className = "cup-img";
  fillImgEl.src = ASSETS.fillCup;
  fillImgEl.alt = "Filling cup";
  fillMaskEl.appendChild(fillImgEl);
  cupWrapEl.appendChild(fillMaskEl);

  filledCupEl = document.createElement("img");
  filledCupEl.className = "cup-img";
  filledCupEl.src = ASSETS.fillCup;
  filledCupEl.alt = "Filled cup";
  cupWrapEl.appendChild(filledCupEl);

  sipEl = document.createElement("img");
  sipEl.className = "cup-img";
  sipEl.src = ASSETS.sip;
  sipEl.alt = "Take a sip";
  cupWrapEl.appendChild(sipEl);

  endEl = document.createElement("img");
  endEl.className = "cup-img";
  endEl.src = ASSETS.end;
  endEl.alt = "The end";
  cupWrapEl.appendChild(endEl);

  cupRootEl.appendChild(cupWrapEl);
}

function hideAllCup() {
  if (!cupWrapEl) return;
  cupWrapEl.style.display = "none";
  emptyCupEl.style.display = "none";
  fillGifEl.style.display = "none";
  fillMaskEl.style.display = "none";
  filledCupEl.style.display = "none";
  sipEl.style.display = "none";
  endEl.style.display = "none";
}

function showEmptyCup() {
  hideAllCup();
  cupWrapEl.style.display = "inline-block";
  emptyCupEl.style.display = "block";
  fillGifEl.style.display = "none";
  fillMaskEl.style.display = "none";
  filledCupEl.style.display = "none";
  sipEl.style.display = "none";
  endEl.style.display = "none";
}

function startFillAnimation() {
  // show fill.GIF overlay aligned with empty cup
  emptyCupEl.style.display = "block";
  fillGifEl.style.display = "block";
  fillMaskEl.style.display = "none";
  filledCupEl.style.display = "none";
  sipEl.style.display = "none";
  endEl.style.display = "none";

  // restart gif by resetting src (helps when revisiting)
  const src = fillGifEl.src;
  fillGifEl.src = "";
  fillGifEl.src = src;

  window.setTimeout(() => {
    fillGifEl.style.display = "none";
    emptyCupEl.style.display = "none";
    filledCupEl.style.display = "block";
    stage = Stage.FILLED_WAIT_CLICK;
  }, FILL_GIF_MS);
}

function showSip() {
  hideAllCup();
  cupWrapEl.style.display = "inline-block";
  sipEl.style.display = "block";
}

function showEnd() {
  hideAllCup();
  cupWrapEl.style.display = "inline-block";
  endEl.style.display = "block";
  startFireworks();
}

function startFireworks() {
  if (fwActive) return;
  fwActive = true;
  fwCanvas.show();
  loop();
}

function draw() {
  if (!fwActive) return;

  clear();
  const now = millis();

  if (now - lastSpawnMs > 650) {
    spawnBurst(random(width * 0.2, width * 0.8), random(height * 0.15, height * 0.5));
    lastSpawnMs = now;
  }

  updateBursts();
  renderBursts();
}

function spawnBurst(x, y) {
  const hue = random(0, 360);
  const count = 110;
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const a = random(TWO_PI);
    const s = random(2.5, 10);
    parts.push({
      x,
      y,
      vx: cos(a) * s,
      vy: sin(a) * s,
      life: 255,
      hue,
      r: random(3, 6.5),
    });
  }
  bursts.push(parts);
}

function updateBursts() {
  const g = 0.06;
  for (const parts of bursts) {
    for (const p of parts) {
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 3.5;
    }
  }
  bursts = bursts.filter((parts) => parts.some((p) => p.life > 0));
}

function renderBursts() {
  colorMode(HSB, 360, 100, 100, 255);
  noStroke();
  for (const parts of bursts) {
    for (const p of parts) {
      if (p.life <= 0) continue;
      // soft glow + core dot
      fill(p.hue, 80, 100, p.life * 0.45);
      circle(p.x, p.y, p.r * 2.6);
      fill(p.hue, 95, 100, p.life);
      circle(p.x, p.y, p.r);
    }
  }
  colorMode(RGB, 255);
}

