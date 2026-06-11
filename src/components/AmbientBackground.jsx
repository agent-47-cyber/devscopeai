import { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   AmbientBackground — Enterprise-Grade Ambient Motion
   All effects target ≤ 4% opacity and sub-1px movement to stay imperceptible
   until the user has spent time on the page.
───────────────────────────────────────────────────────────────────────────── */

// Colour palette pulled from design tokens
const ORANGE = 'rgba(249,115,22,'; // F97316
const GRID_LINE = 'rgba(255,255,255,';
const BLUEPRINT = 'rgba(249,115,22,';

/* ── Seeded Deterministic RNG (no flicker on re-mount) ───────────────────── */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ── Particle factory ────────────────────────────────────────────────────── */
function createParticle(rng, w, h, paths) {
  const pathIdx = Math.floor(rng() * paths.length);
  const path    = paths[pathIdx];
  const t       = rng(); // position along path [0,1]
  return {
    pathIdx,
    t,
    speed: 0.00008 + rng() * 0.00012,  // very slow
    size:  0.8 + rng() * 1.2,
    alpha: 0.25 + rng() * 0.45,
    x: 0, y: 0,
  };
}

/* ── Path interpolation ───────────────────────────────────────────────────── */
function lerpPath(path, t) {
  const idx = Math.min(Math.floor(t * (path.length - 1)), path.length - 2);
  const local = (t * (path.length - 1)) - idx;
  const a = path[idx], b = path[idx + 1];
  return { x: a[0] + (b[0] - a[0]) * local, y: a[1] + (b[1] - a[1]) * local };
}

/* ── Blueprint static overlays ────────────────────────────────────────────── */
function buildBlueprints(w, h) {
  const items = [];

  // Low-opacity guide rectangles (engineering drafting style)
  const rects = [
    [0.05, 0.08, 0.18, 0.25],
    [0.76, 0.12, 0.18, 0.20],
    [0.05, 0.68, 0.14, 0.20],
    [0.80, 0.72, 0.14, 0.18],
    [0.42, 0.03, 0.16, 0.10],
  ];
  rects.forEach(([fx, fy, fw, fh]) => {
    items.push({ type: 'rect', x: fx*w, y: fy*h, width: fw*w, height: fh*h });
  });

  // Technical circles (like a drafting compass arc)
  const circles = [
    [0.08, 0.15, 0.06, 0, Math.PI * 0.7],
    [0.92, 0.20, 0.05, Math.PI * 0.3, Math.PI * 1.1],
    [0.08, 0.85, 0.05, Math.PI * 1.2, Math.PI * 2.0],
    [0.92, 0.80, 0.06, Math.PI * 0.8, Math.PI * 1.7],
  ];
  circles.forEach(([fx, fy, fr, startA, endA]) => {
    items.push({ type: 'arc', x: fx*w, y: fy*h, r: fr*Math.min(w,h), startA, endA });
  });

  // Guide lines (horizontal engineering rules)
  const lines = [
    [0.02, 0.33, 0.22, 0.33],
    [0.78, 0.33, 0.98, 0.33],
    [0.02, 0.66, 0.22, 0.66],
    [0.78, 0.66, 0.98, 0.66],
    [0.38, 0.02, 0.62, 0.02],
    [0.38, 0.97, 0.62, 0.97],
  ];
  lines.forEach(([fx1, fy1, fx2, fy2]) => {
    items.push({ type: 'line', x1: fx1*w, y1: fy1*h, x2: fx2*w, y2: fy2*h });
  });

  // Corner crosshair marks
  const corners = [[0.03, 0.04], [0.97, 0.04], [0.03, 0.96], [0.97, 0.96]];
  corners.forEach(([fx, fy]) => {
    items.push({ type: 'crosshair', x: fx*w, y: fy*h, size: 12 });
  });

  return items;
}

/* ══════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════ */
export default function AmbientBackground() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({});
  const rafRef     = useRef(null);
  const mouseRef   = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  /* ── On mount: initialise everything ─────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rng = mulberry32(0xD3753C0E);  // deterministic seed

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);

      const W = window.innerWidth;
      const H = window.innerHeight;

      /* Build data-flow paths (Resume → Engine, GitHub → Engine, etc.) */
      const engineX = W * 0.52;
      const engineY = H * 0.48;
      const paths = [
        // Resume (left, mid)
        [[W*0.03, H*0.45], [W*0.18, H*0.44], [W*0.34, H*0.47], [engineX, engineY]],
        // GitHub (top-left)
        [[W*0.08, H*0.20], [W*0.22, H*0.28], [W*0.38, H*0.38], [engineX, engineY]],
        // LinkedIn (bottom-left)
        [[W*0.06, H*0.72], [W*0.20, H*0.64], [W*0.38, H*0.55], [engineX, engineY]],
        // Job Role (top-right)
        [[W*0.94, H*0.18], [W*0.80, H*0.28], [W*0.65, H*0.40], [engineX, engineY]],
        // Secondary resume path variation
        [[W*0.04, H*0.52], [W*0.22, H*0.50], [W*0.40, H*0.49], [engineX, engineY]],
      ];

      // Create / recreate particles
      const PARTICLE_COUNT = 28;
      const particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(rng, W, H, paths)
      );

      stateRef.current = {
        W, H, ctx, paths,
        particles,
        blueprints: buildBlueprints(W, H),
        gridOffsetY: 0,
        scanY: 0,
        time: 0,
      };
    };

    resize();
    window.addEventListener('resize', resize);

    /* ── Mouse parallax listener ───────────────────────────────────────── */
    const onMouse = (e) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener('mousemove', onMouse);

    /* ── Animation loop ────────────────────────────────────────────────── */
    let last = performance.now();

    const draw = (now) => {
      const dt   = Math.min(now - last, 50); // clamp to avoid jumps
      last = now;
      const s    = stateRef.current;
      if (!s.ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      const { W, H, ctx, paths, particles, blueprints } = s;

      s.time       += dt;
      s.gridOffsetY = (s.gridOffsetY + 0.008 * dt * 0.06) % 60; // extremely slow scroll
      s.scanY       = (s.scanY + 0.004 * dt * 0.06) % H;

      /* Smooth mouse interpolation (very lazy follow — parallax depth) */
      const m = mouseRef.current;
      m.x += (m.tx - m.x) * 0.012;
      m.y += (m.ty - m.y) * 0.012;
      const px = (m.x - 0.5) * 6;  // max ±3px shift
      const py = (m.y - 0.5) * 4;

      ctx.clearRect(0, 0, W, H);

      /* ─── 1. TECHNICAL GRID ───────────────────────────────────────── */
      ctx.save();
      ctx.translate(px * 0.5, py * 0.5);

      const GRID = 60;
      const GRID_ALPHA_BASE = 0.028;

      // Vertical lines
      ctx.beginPath();
      for (let x = -GRID; x <= W + GRID; x += GRID) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      // Horizontal lines with slow vertical drift
      for (let y = (-GRID + s.gridOffsetY) % GRID - GRID; y <= H + GRID; y += GRID) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.strokeStyle = GRID_LINE + GRID_ALPHA_BASE + ')';
      ctx.lineWidth   = 0.4;
      ctx.stroke();

      // Sub-grid (half size, even dimmer)
      ctx.beginPath();
      for (let x = -GRID/2; x <= W + GRID; x += GRID/2) {
        if (x % GRID === 0) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = (-GRID/2 + s.gridOffsetY * 0.5) % (GRID/2) - GRID/2; y <= H + GRID; y += GRID/2) {
        if (Math.round(y - s.gridOffsetY * 0.5) % GRID === 0) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.strokeStyle = GRID_LINE + (GRID_ALPHA_BASE * 0.45) + ')';
      ctx.lineWidth   = 0.25;
      ctx.stroke();

      // Dot intersections at major grid nodes
      ctx.fillStyle = GRID_LINE + '0.06)';
      for (let x = 0; x <= W; x += GRID) {
        for (let y = (-GRID + s.gridOffsetY) % GRID; y <= H; y += GRID) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      /* ─── 2. SCAN-LINE ────────────────────────────────────────────── */
      const scanGrad = ctx.createLinearGradient(0, s.scanY - 40, 0, s.scanY + 40);
      scanGrad.addColorStop(0,   'rgba(255,255,255,0)');
      scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.012)');
      scanGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, s.scanY - 40, W, 80);

      /* ─── 3. BLUEPRINT OVERLAYS ───────────────────────────────────── */
      ctx.save();
      ctx.translate(px * 0.8, py * 0.8);
      blueprints.forEach(bp => {
        ctx.strokeStyle = BLUEPRINT + '0.035)';
        ctx.lineWidth   = 0.6;
        ctx.setLineDash([4, 8]);

        if (bp.type === 'rect') {
          ctx.strokeRect(bp.x, bp.y, bp.width, bp.height);
        } else if (bp.type === 'arc') {
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, bp.r, bp.startA, bp.endA);
          ctx.stroke();
        } else if (bp.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(bp.x1, bp.y1);
          ctx.lineTo(bp.x2, bp.y2);
          ctx.stroke();
        } else if (bp.type === 'crosshair') {
          ctx.setLineDash([]);
          const { x, y, size } = bp;
          ctx.beginPath();
          ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
          ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.setLineDash([]);
      });
      ctx.restore();

      /* ─── 4. CONNECTION PATHS (faint) ────────────────────────────── */
      ctx.save();
      ctx.translate(px, py);
      paths.forEach(path => {
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
          const prev = path[i-1], curr = path[i];
          const cpx  = (prev[0] + curr[0]) / 2;
          const cpy  = (prev[1] + curr[1]) / 2;
          ctx.quadraticCurveTo(prev[0], prev[1], cpx, cpy);
        }
        ctx.lineTo(path[path.length-1][0], path[path.length-1][1]);
        ctx.strokeStyle = ORANGE + '0.035)';
        ctx.lineWidth   = 0.5;
        ctx.setLineDash([3, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      /* ─── 5. DATA PARTICLES ───────────────────────────────────────── */
      particles.forEach(p => {
        p.t += p.speed * dt;
        if (p.t >= 1) {
          p.t = 0;
          p.pathIdx = Math.floor(Math.random() * paths.length);
          // Randomise slightly so they don't all restart together
          p.t = Math.random() * 0.05;
        }
        const pos = lerpPath(paths[p.pathIdx], p.t);
        p.x = pos.x;
        p.y = pos.y;

        // Fade in at start and out near engine
        const fadeT = p.t < 0.1 ? p.t / 0.1 : p.t > 0.85 ? (1 - p.t) / 0.15 : 1;
        const alpha = p.alpha * fadeT;

        // Tiny glow
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grd.addColorStop(0, ORANGE + (alpha * 0.9) + ')');
        grd.addColorStop(1, ORANGE + '0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = ORANGE + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      /* ─── 6. AMBIENT GLOW VIGNETTE on edges ─────────────────────── */
      // Very soft orange on bottom-left corner to imply depth
      const vign = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.4);
      vign.addColorStop(0, 'rgba(249,115,22,0.018)');
      vign.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
