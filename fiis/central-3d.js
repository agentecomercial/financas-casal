/* Central de FIIs — motor 3D (three.js r147 + OrbitControls) e as cinco visualizações */
"use strict";
const C3 = [];
function limpar3D() { while (C3.length) C3.pop().dispose(); tipOff() }
const easeOut = t => 1 - Math.pow(1 - t, 3);
const hex = s => new THREE.Color(s);

function palco(el, o = {}) {
  if (!window.THREE || !THREE.OrbitControls) { el.insertAdjacentHTML("afterbegin", '<div class="loading3d">Visualização 3D indisponível: sem conexão com a biblioteca gráfica.</div>'); return null }
  const w = el.clientWidth || 600, h = el.clientHeight || 400;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, TOQUE ? 1.5 : 2)); renderer.setSize(w, h, false); renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = o.semTom ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .92; el.prepend(renderer.domElement);
  const cw = renderer.domElement.clientWidth || w, chh = renderer.domElement.clientHeight || h; if (cw !== w || chh !== h) renderer.setSize(cw, chh, false);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x05070a, o.fog || .02);
  const camera = new THREE.PerspectiveCamera(o.fov || 36, (renderer.domElement.clientWidth || w) / (renderer.domElement.clientHeight || h), .1, 300); camera.position.set(...(o.cam || [0, 6, 20]));
  const ctl = new THREE.OrbitControls(camera, renderer.domElement); ctl.target.set(...(o.alvo || [0, 2, 0]));
  const fator = () => camera.aspect < 1.2 ? Math.min(2.6, Math.pow(1.2 / camera.aspect, .85)) : 1, afasta = (pos, alvo) => { const a = new THREE.Vector3(...alvo); return new THREE.Vector3(...pos).sub(a).multiplyScalar(fator()).add(a).toArray() };
  camera.position.set(...afasta(o.cam || [0, 6, 20], o.alvo || [0, 2, 0]));
  Object.assign(ctl, { enableDamping: true, dampingFactor: .07, enablePan: false, rotateSpeed: .55, enableZoom: false, minDistance: o.minD || 6, maxDistance: (o.maxD || 45) * fator(), minPolarAngle: o.minP ?? .05, maxPolarAngle: o.maxP ?? 1.48 });
  ctl.enabled = !TOQUE; renderer.domElement.style.touchAction = TOQUE ? "pan-y" : "none"; if (o.giro && !RM) { ctl.autoRotate = true; ctl.autoRotateSpeed = o.giro }
  ctl.addEventListener("start", () => { ctl.autoRotate = false });
  scene.add(new THREE.AmbientLight(0xffffff, .28), new THREE.HemisphereLight(0xf3e7cf, 0x0a0d12, .55));
  const sol = new THREE.DirectionalLight(0xffe2b0, 1.25); sol.position.set(6, 14, 10); scene.add(sol);
  const rim = new THREE.DirectionalLight(0x7fd8c4, .55); rim.position.set(-12, 5, -10); scene.add(rim);
  const S = { el, scene, camera, ctl, renderer, hov: [], tw: [], loopFns: [], cur: null };
  S.tween = (dur, fn, done) => S.tw.push({ t0: performance.now(), dur: RM ? 1 : dur, fn, done });
  S.voar = (pos, alvo, dur = 1100, perto) => { const p0 = camera.position.clone(), a0 = ctl.target.clone(), p1 = new THREE.Vector3(...(perto ? pos : afasta(pos, alvo))), a1 = new THREE.Vector3(...alvo); ctl.autoRotate = false;
    S.tween(dur, e => { camera.position.lerpVectors(p0, p1, e); ctl.target.lerpVectors(a0, a1, e) }) };
  S.zoom = f => { const d = camera.position.clone().sub(ctl.target), nd = Math.min(ctl.maxDistance, Math.max(ctl.minDistance, d.length() * f)); S.voar(ctl.target.clone().add(d.setLength(nd)).toArray(), ctl.target.toArray(), 450, true) };
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  const pick = e => { const b = renderer.domElement.getBoundingClientRect(); pt.x = (e.clientX - b.left) / b.width * 2 - 1; pt.y = -(e.clientY - b.top) / b.height * 2 + 1; ray.setFromCamera(pt, camera);
    return ray.intersectObjects(S.hov.filter(x => x.visible), false)[0] };
  const mover = e => { const hit = pick(e), ob = hit ? hit.object : null;
    if (ob !== S.cur) { if (S.cur && S.onLeave) S.onLeave(S.cur); S.cur = ob; if (ob && S.onEnter) S.onEnter(ob, hit) }
    if (ob && S.onHover) { S.onHover(ob, e, hit); renderer.domElement.style.cursor = "pointer" } else { tipOff(); renderer.domElement.style.cursor = "" } };
  renderer.domElement.addEventListener("pointermove", mover);
  renderer.domElement.addEventListener("pointerleave", e => { if (e.pointerType === "touch") return; if (S.cur && S.onLeave) S.onLeave(S.cur); S.cur = null; tipOff() }); // no toque o balão fica até o próximo toque
  let down = null; renderer.domElement.addEventListener("pointerdown", e => down = [e.clientX, e.clientY]);
  renderer.domElement.addEventListener("pointerup", e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const hit = pick(e); if (TOQUE) mover(e); if (hit && S.onClick) S.onClick(hit.object, e, hit) } down = null });
  renderer.domElement.addEventListener("dblclick", () => S.zoom(.7));
  let raf; const loop = t => { raf = requestAnimationFrame(loop);
    S.tw = S.tw.filter(x => { const p = Math.min(1, (t - x.t0) / x.dur); x.fn(easeOut(p), p); if (p >= 1) { x.done && x.done(); return false } return true });
    S.loopFns.forEach(f => f(t)); ctl.update(); renderer.render(scene, camera) }; raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(() => { const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }); ro.observe(renderer.domElement);
  const liberar = g => g.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose() }) });
  S.limpar = g => { if (!g) return; scene.remove(g); liberar(g) };
  S.dispose = () => { cancelAnimationFrame(raf); ro.disconnect(); ctl.dispose(); liberar(scene); renderer.dispose(); renderer.domElement.remove() };
  S.girar = on => { ctl.enabled = on || !TOQUE; renderer.domElement.style.touchAction = on || !TOQUE ? "none" : "pan-y" };
  /* ao entrar/sair da tela cheia o formato muda: reenquadra a câmera para a cena inteira caber */
  S.cheia = on => { ctl.enableZoom = on; S.girar(on); setTimeout(() => S.voar(o.cam || [0, 6, 20], o.alvo || [0, 2, 0], 700), 380) };
  C3.push(S); return S;
}
/* rótulo em sprite (texto sempre de frente para a câmera) */
function rotulo(txt, { cor = "#8a8f97", px = 24, alt = .38, peso = 500, fonte = "Inter", esq = false } = {}) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), f = `${peso} ${px * 2}px ${fonte}`; x.font = f;
  const w = Math.ceil(x.measureText(txt).width) + 8; c.width = w; c.height = Math.ceil(px * 2.6); x.font = f; x.fillStyle = cor; x.textBaseline = "middle"; x.fillText(txt, 4, c.height / 2);
  const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; tx.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); alt *= innerWidth <= 760 ? 1.55 : 1; /* celular: câmera mais longe, rótulos maiores */ s.scale.set(alt * w / c.height, alt, 1); if (esq) s.center.set(0, .5); return s }
function piso(S, tam = 30) { const g = new THREE.GridHelper(tam, tam, 0x2b2720, 0x15181d); g.material.transparent = true; g.material.opacity = .5; S.scene.add(g);
  const pl = new THREE.Mesh(new THREE.CircleGeometry(tam * .55, 64), new THREE.MeshBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .025, depthWrite: false })); pl.rotation.x = -Math.PI / 2; pl.position.y = .005; S.scene.add(pl) }
/* gradiente vertical por vértice: luminoso no topo, quase transparente na base */
function gradienteY(geo, base, topo, yMax) { const p = geo.attributes.position, c = new Float32Array(p.count * 3), b = hex(base), t = hex(topo), k = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = Math.max(0, Math.min(1, p.getY(i) / (yMax || 1))); k.copy(b).lerp(t, Math.pow(y, 1.6)); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)) }
const PERSP = (S, mapa) => k => { const p = mapa[k]; if (p) S.voar(p[0], p[1]) };

/* ============ 1. Evolução patrimonial: volume + linha + pontos + rendimentos do mês ============ */
function hero3D(el, serie, { aoPonto } = {}) {
  const S = palco(el, { cam: [13, 8.5, 16.5], alvo: [0, 2.4, 0], minD: 10, maxD: 36, maxP: 1.45 }); if (!S) return null; piso(S);
  const feixe = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 8), new THREE.MeshBasicMaterial({ color: 0xf2e3bd, transparent: true, opacity: .55 })); feixe.visible = false; S.scene.add(feixe);
  let grupo = null, dados = [];
  const build = sr => { if (grupo) S.limpar(grupo); grupo = new THREE.Group(); S.hov = []; dados = sr; const n = sr.length; if (n < 2) return;
    const W = 19, X = i => -W / 2 + i * W / (n - 1), vs = sr.map(s => s.pat), mx = Math.max(...vs), mn = Math.min(...vs), amp = (mx - mn) || mx * .1 || 1;
    const lo = Math.max(0, mn - amp * .7), hi = mx + amp * .12, H = 5.4, Y = v => .3 + (v - lo) / ((hi - lo) || 1) * H;
    const pts = sr.map((s, i) => new THREE.Vector3(X(i), Y(s.pat), 0)), curva = new THREE.CatmullRomCurve3(pts, false, "centripetal", .4), amostra = curva.getPoints(n * 10);
    const sh = new THREE.Shape(); sh.moveTo(amostra[0].x, 0); amostra.forEach(p => sh.lineTo(p.x, p.y)); sh.lineTo(amostra[amostra.length - 1].x, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); geo.translate(0, 0, -.6);
    gradienteY(geo, "#05070a", "#9c7f4a", H + .3);
    grupo.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })));
    grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curva, n * 14, .05, 10), new THREE.MeshBasicMaterial({ color: 0xf6e8c4 })));
    grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curva, n * 14, .17, 10), new THREE.MeshBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false })));
    const linhaFrente = new THREE.Line(new THREE.BufferGeometry().setFromPoints(amostra.map(p => new THREE.Vector3(p.x, p.y, .6))), new THREE.LineBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .35 })); grupo.add(linhaFrente);
    const sg = new THREE.SphereGeometry(.14, 20, 14), rmax = Math.max(...sr.map(s => s.rend)) || 1;
    sr.forEach((s, i) => { const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xf2e3bd, emissive: 0xd6be8a, emissiveIntensity: .45, metalness: .5, roughness: .25 }));
      m.position.copy(pts[i]); m.userData = { i, tipo: "p" }; grupo.add(m); S.hov.push(m);
      if (s.rend > 0) { const hgt = Math.max(.04, s.rend / rmax * 1.9), b = new THREE.Mesh(new THREE.BoxGeometry(.2, 1, .2), new THREE.MeshStandardMaterial({ color: 0x15624f, emissive: 0x2fb495, emissiveIntensity: .55, metalness: .3, roughness: .35, transparent: true, opacity: .95 }));
        b.scale.y = .001; b.position.set(X(i), 0, 2.2); b.userData = { i, tipo: "r", h: hgt }; grupo.add(b); S.hov.push(b);
        S.tween(900 + i * 40, e => { b.scale.y = Math.max(.001, hgt * e); b.position.y = b.scale.y / 2 }) } });
    const passo = Math.ceil(n / 8); sr.forEach((s, i) => { if (i % passo && i !== n - 1) return; const l = rotulo(mes(s.m), { alt: .46, cor: "#8f959d" }); l.position.set(X(i), -.05, 3.7); grupo.add(l) });
    [lo + (hi - lo) * .25, lo + (hi - lo) * .6, hi].forEach(v => { const yy = Y(v); const g = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2 - .3, yy, -.62), new THREE.Vector3(W / 2 + .3, yy, -.62)]), new THREE.LineBasicMaterial({ color: 0x2a2f36, transparent: true, opacity: .8 })); grupo.add(g);
      const l = rotulo(big(v), { esq: true, cor: "#6c737c", alt: .34 }); l.position.set(W / 2 + .45, yy, -.62); grupo.add(l) });
    const lr = rotulo("rendimentos do mês · escala própria", { cor: "#46c2a6", alt: .34 }); lr.center.set(1, .5); lr.position.set(-W / 2 - .5, .6, 2.2); grupo.add(lr);
    const lp = rotulo("patrimônio", { cor: "#d6be8a", alt: .34 }); lp.center.set(1, .5); lp.position.set(-W / 2 - .5, Y(sr[0].pat), 0); grupo.add(lp);
    grupo.scale.y = .001; S.scene.add(grupo); S.tween(1200, e => { grupo.scale.y = Math.max(.001, e) }) };
  const realce = (ob, on) => { if (ob.userData.tipo === "p") { ob.scale.setScalar(on ? 2 : 1); ob.material.emissiveIntensity = on ? 1.3 : .45 } else ob.material.emissiveIntensity = on ? 1.4 : .55 };
  S.onEnter = ob => { realce(ob, true); const s = dados[ob.userData.i], p = ob.userData.tipo === "p" ? ob.position : new THREE.Vector3(ob.position.x, 0, 0);
    if (ob.userData.tipo === "p") { feixe.visible = true; feixe.scale.y = p.y; feixe.position.set(p.x, p.y / 2, 0) } if (aoPonto) aoPonto(ob.userData.i) };
  S.onLeave = ob => { realce(ob, false); feixe.visible = false; if (aoPonto) aoPonto(null) };
  S.onHover = (ob, e) => { const i = ob.userData.i, s = dados[i], a = dados[i - 1];
    tipOn(e.clientX, e.clientY, tipLinhas(mes(s.m), [["Patrimônio", brl(s.pat, 0)], ["No mês", a ? `<span class="${s.pat >= a.pat ? "pos" : "neg"}">${sgn(s.pat - a.pat)}${brl(Math.abs(s.pat - a.pat), 0)}</span>` : "—"], ["Rendimentos", `<span class="pos">${brl(s.rend)}</span>`]])) };
  S.onClick = (ob, e) => S.onHover(ob, e);
  build(serie);
  return { S, set: build, persp: PERSP(S, { frente: [[0, 3.6, 20.5], [0, 2.7, 0]], perspectiva: [[13, 8.5, 16.5], [0, 2.4, 0]], topo: [[0, 26, 3], [0, 0, 0]], lado: [[23, 5, 5], [0, 2.4, 0]] }) } }

/* ============ 2. Mapa do mercado: P/VP × DY × terceira dimensão ============ */
const EIXOZ = { liq: ["Liquidez/dia", f => f.liq ? Math.log10(f.liq) : null, [4.5, 8], v => big(Math.pow(10, v))], ret: ["Retorno 12m", f => f.ret12, [-25, 30], v => pct(v, 0)], cot: ["Cotistas", f => f.cotistas ? Math.log10(f.cotistas) : null, [2.5, 6.3], v => int(Math.pow(10, v))] };
function mapa3D(el, lista, { z = "liq", aoAbrir } = {}) {
  const S = palco(el, { cam: [14, 8.5, 17], alvo: [0, 3.6, 0], minD: 9, maxD: 42, giro: .45, semTom: true }); if (!S) return null; piso(S, 36);
  const XR = [.5, 1.5], YR = [4, 20], X = v => -7 + (Math.min(XR[1], Math.max(XR[0], v)) - XR[0]) / (XR[1] - XR[0]) * 14, Y = v => (Math.min(YR[1], Math.max(YR[0], v)) - YR[0]) / (YR[1] - YR[0]) * 8;
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(14, 8, 10)), new THREE.LineBasicMaterial({ color: 0x3a342a, transparent: true, opacity: .6 })); box.position.y = 4; S.scene.add(box);
  const pv = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshBasicMaterial({ color: 0x46c2a6, transparent: true, opacity: .05, side: THREE.DoubleSide, depthWrite: false })); pv.rotation.y = Math.PI / 2; pv.position.set(X(1), 4, 0); S.scene.add(pv);
  const lp = rotulo("P/VP = 1", { cor: "#46c2a6", alt: .34 }); lp.position.set(X(1), 8.4, 5); S.scene.add(lp);
  [.5, .75, 1, 1.25, 1.5].forEach(v => { const l = rotulo(nf(v, 2)); l.position.set(X(v), -.35, 5.6); S.scene.add(l) });
  [4, 8, 12, 16, 20].forEach(v => { const l = rotulo(v + "%"); l.position.set(-7.6, Y(v), 5.2); S.scene.add(l) });
  const tX = rotulo("P/VP", { cor: "#d6be8a", alt: .42 }); tX.position.set(0, -1, 6.3); S.scene.add(tX);
  const tY = rotulo("DY 12 meses", { cor: "#d6be8a", alt: .42 }); tY.position.set(-8.6, 8.6, 5.2); S.scene.add(tY);
  let zLbl = new THREE.Group(); S.scene.add(zLbl); let zk = z;
  const zPos = f => { const [, fn, r] = EIXOZ[zk], v = fn(f); return v == null ? 0 : 5 - (Math.min(r[1], Math.max(r[0], v)) - r[0]) / (r[1] - r[0]) * 10 };
  const rotZ = () => { S.limpar(zLbl); zLbl = new THREE.Group(); const [nome, , r, fmt] = EIXOZ[zk];
    [0, .5, 1].forEach(t => { const v = r[0] + (r[1] - r[0]) * t, l = rotulo(fmt(v), { esq: true }); l.position.set(7.4, -.35, 5 - t * 10); zLbl.add(l) });
    const t = rotulo(nome, { cor: "#d6be8a", alt: .42, esq: true }); t.position.set(7.4, .5, -5.4); zLbl.add(t); S.scene.add(zLbl) }; rotZ();
  const sg = new THREE.SphereGeometry(1, 28, 18), mxpl = Math.max(...lista.map(f => f.pl || 0)) || 1;
  const queda = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineDashedMaterial({ color: 0xd6be8a, dashSize: .15, gapSize: .1, transparent: true, opacity: .7 })); queda.visible = false; S.scene.add(queda);
  const sombra = new THREE.Mesh(new THREE.RingGeometry(.25, .32, 32), new THREE.MeshBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .6, side: THREE.DoubleSide })); sombra.rotation.x = -Math.PI / 2; sombra.visible = false; S.scene.add(sombra);
  let nomeTk = null;
  const bolas = lista.map((f, i) => { const c = hex(TCOR[f.tipo] || TCOR.Outros), m = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ color: c, emissive: c, emissiveIntensity: .12, metalness: .15, roughness: .32, clearcoat: 1, clearcoatRoughness: .1, transparent: true, opacity: .96 }));
    const r = .14 + Math.sqrt((f.pl || 0) / mxpl) * .5; m.userData = { f, r }; m.position.set(X(f.pvp), Y(f.dy12), zPos(f)); m.scale.setScalar(.001); S.scene.add(m); S.hov.push(m);
    S.tween(700 + i * 6, e => m.scale.setScalar(Math.max(.001, r * e))); return m });
  S.onEnter = ob => { ob.scale.setScalar(ob.userData.r * 1.7); ob.material.emissiveIntensity = .7; const p = ob.position;
    queda.visible = sombra.visible = true; queda.geometry.setFromPoints([p.clone(), new THREE.Vector3(p.x, 0, p.z)]); queda.computeLineDistances(); sombra.position.set(p.x, .02, p.z);
    nomeTk = rotulo(ob.userData.f.t, { cor: "#f2e3bd", alt: .5, peso: 600 }); nomeTk.position.set(p.x, p.y + ob.userData.r * 1.7 + .45, p.z); S.scene.add(nomeTk) };
  S.onLeave = ob => { ob.scale.setScalar(ob.userData.r); ob.material.emissiveIntensity = .12; queda.visible = sombra.visible = false; if (nomeTk) { S.limpar(nomeTk); nomeTk = null } };
  S.onHover = (ob, e) => { const f = ob.userData.f;
    tipOn(e.clientX, e.clientY, tipLinhas(`${f.t} <span style="font-size:.8rem;color:${TCOR[f.tipo]}">· ${esc(f.tipo)}</span>`, [["DY 12m", pct(f.dy12)], ["P/VP", nf(f.pvp)], [EIXOZ[zk][0], zk === "liq" ? big(f.liq) : zk === "ret" ? pct(f.ret12, 1) : int(f.cotistas)], ["Patrimônio", big(f.pl)]]) + `<div class="r" style="margin-top:6px;color:var(--champ)">Clique para abrir a ficha</div>`) };
  S.onClick = ob => { const p = ob.position; tipOff(); S.voar([p.x + 2.2, p.y + 1.4, p.z + 3.2], [p.x, p.y, p.z], 850, true); setTimeout(() => aoAbrir && aoAbrir(ob.userData.f), 820) };
  return { S, persp: PERSP(S, { frente: [[0, 4.2, 21], [0, 4, 0]], perspectiva: [[14, 8.5, 17], [0, 3.6, 0]], topo: [[0, 24, .5], [0, 0, 0]], lado: [[22, 4.5, 0], [0, 4, 0]] }),
    setZ: k => { zk = k; rotZ(); bolas.forEach(m => { const z0 = m.position.z, z1 = zPos(m.userData.f); S.tween(800, e => m.position.z = z0 + (z1 - z0) * e) }) },
    tipos: on => bolas.forEach(m => { const vis = on.includes(m.userData.f.tipo); if (vis === m.visible) return; const r = m.userData.r;
      if (vis) { m.visible = true; S.tween(450, e => m.scale.setScalar(Math.max(.001, r * e))) } else S.tween(350, e => m.scale.setScalar(Math.max(.001, r * (1 - e))), () => m.visible = false) }) } }

/* ============ 3. Ficha: rendimentos por cota (colunas) × cotação (linha ao fundo) ============ */
function ficha3D(el, f) {
  const S = palco(el, { cam: [12, 8, 19], alvo: [0, 2.6, 0], minD: 9, maxD: 34, giro: .3 }); if (!S) return null; piso(S, 26);
  const dv = (f.divs || []).slice(-24), pr = (f.precos || []).slice(-24), n = Math.max(dv.length, 2), W = 16, X = i => -W / 2 + i * W / (n - 1);
  const mxd = Math.max(...dv.map(d => d[1])) || 1;
  dv.forEach(([d, v], i) => { const h = v / mxd * 2.4, b = new THREE.Mesh(new THREE.BoxGeometry(.28, 1, .28), new THREE.MeshPhysicalMaterial({ color: 0x15624f, emissive: 0x2fb495, emissiveIntensity: .45, metalness: .45, roughness: .25, clearcoat: .8, transparent: true, opacity: .95 }));
    b.scale.y = .001; b.position.set(X(i), 0, 1.4); const p = pr.find(x => x[0] === d.slice(0, 7)); b.userData = { d, v, p: p ? p[1] : f.preco }; S.scene.add(b); S.hov.push(b);
    S.tween(800 + i * 45, e => { b.scale.y = Math.max(.001, h * e); b.position.y = b.scale.y / 2 }) });
  if (pr.length > 1) { const ps = pr.map(x => x[1]), mn = Math.min(...ps), mx = Math.max(...ps), Xp = i => -W / 2 + i * W / (pr.length - 1), Yp = v => 3.3 + (v - mn) / ((mx - mn) || 1) * 2.6;
    const cv = new THREE.CatmullRomCurve3(pr.map((x, i) => new THREE.Vector3(Xp(i), Yp(x[1]), 0)), false, "centripetal", .3);
    const sp = cv.getPoints(pr.length * 10), shp = new THREE.Shape(); shp.moveTo(sp[0].x, 3.05); sp.forEach(q => shp.lineTo(q.x, q.y)); shp.lineTo(sp[sp.length - 1].x, 3.05); shp.closePath();
    const cg = new THREE.ShapeGeometry(shp); gradienteY(cg, "#05070a", "#9c7f4a", 6); S.scene.add(new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })));
    const base = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, 3.05, 0), new THREE.Vector3(W / 2, 3.05, 0)]), new THREE.LineBasicMaterial({ color: 0x2a2f36 })); S.scene.add(base);
    S.scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv, pr.length * 12, .05, 10), new THREE.MeshBasicMaterial({ color: 0xf2e3bd })));
    S.scene.add(new THREE.Mesh(new THREE.TubeGeometry(cv, pr.length * 12, .16, 10), new THREE.MeshBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false })));
    const lm = rotulo("cotação · " + brl(mn) + " a " + brl(mx), { cor: "#d6be8a", alt: .34, esq: true }); lm.position.set(-W / 2, Yp(mx) + .6, 0); S.scene.add(lm) }
  const lr = rotulo("rendimento por cota", { cor: "#46c2a6", alt: .34, esq: true }); lr.position.set(-W / 2, 2.75, 1.4); S.scene.add(lr);
  const passo = Math.ceil(n / 8); dv.forEach(([d], i) => { if (i % passo && i !== dv.length - 1) return; const l = rotulo(mes(d.slice(0, 7))); l.position.set(X(i), -.05, 2.8); S.scene.add(l) });
  S.onEnter = ob => { ob.material.emissiveIntensity = 1.2 }; S.onLeave = ob => { ob.material.emissiveIntensity = .45 };
  S.onHover = (ob, e) => { const u = ob.userData; tipOn(e.clientX, e.clientY, tipLinhas(dt(u.d), [["Rendimento/cota", `<span class="pos">${brl(u.v, 4)}</span>`], ["Cotação no mês", brl(u.p)], ["Yield do mês", pct(u.v / u.p * 100, 2)], ["Anualizado", pct(u.v / u.p * 1200, 1)]])) };
  S.onClick = (ob, e) => S.onHover(ob, e);
  return { S, persp: PERSP(S, { frente: [[0, 3.2, 21], [0, 2.8, 0]], perspectiva: [[12, 8, 19], [0, 2.6, 0]], topo: [[0, 24, 2], [0, 0, 0]] }) } }

/* ============ 4. Simulador: superfície de cenários (aporte mensal × prazo × patrimônio) ============ */
const APS = Array.from({ length: 13 }, (_, i) => i * 250), ANOS = 30;
function superficie3D(el, base, { aoEscolher } = {}) {
  const S = palco(el, { cam: [17, 12, 19], alvo: [0, 2.6, 0], minD: 10, maxD: 44, giro: .25 }); if (!S) return null; piso(S, 30);
  const nx = APS.length, nz = ANOS, X = i => -7 + i * 14 / (nx - 1), Z = j => 6 - j * 12 / (nz - 1);
  const pos = new Float32Array(nx * nz * 3), cor = new Float32Array(nx * nz * 3), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos[k] = X(i); pos[k + 2] = Z(j) }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d) }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(cor, 3)); geo.setIndex(idx);
  const sup = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: .78, depthWrite: false })); S.scene.add(sup); S.hov.push(sup);
  const fio = new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: 0xf2e3bd, transparent: true, opacity: .16 })); S.scene.add(fio);
  const marca = new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf2e3bd, emissiveIntensity: 1.2 })); S.scene.add(marca);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.35, .44, 40), new THREE.MeshBasicMaterial({ color: 0xf2e3bd, transparent: true, opacity: .6, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; S.scene.add(halo);
  const haste = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineDashedMaterial({ color: 0xf2e3bd, dashSize: .15, gapSize: .1 })); S.scene.add(haste);
  const mira = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), new THREE.MeshBasicMaterial({ color: 0x46c2a6 })); mira.visible = false; S.scene.add(mira);
  S.loopFns.push(t => { halo.scale.setScalar(1 + .15 * Math.sin(t / 380)) });
  [0, 1000, 2000, 3000].forEach(a => { const l = rotulo(a ? "R$ " + nf(a, 0) : "R$ 0"); l.position.set(X(a / 250), -.35, 7); S.scene.add(l) });
  [1, 10, 20, 30].forEach(y => { const l = rotulo(y + (y === 1 ? " ano" : " anos"), { esq: true }); l.position.set(7.5, -.35, Z(y - 1)); S.scene.add(l) });
  const tA = rotulo("aporte mensal", { cor: "#d6be8a", alt: .42 }); tA.position.set(0, -1.1, 7.6); S.scene.add(tA);
  const tP = rotulo("prazo", { cor: "#d6be8a", alt: .42, esq: true }); tP.position.set(7.5, .5, -6.6); S.scene.add(tP);
  const tH = rotulo("altura = patrimônio projetado (escala de raiz)", { cor: "#6c737c", alt: .3, esq: true }); tH.position.set(-7, 7.9, -6); S.scene.add(tH);
  let alvo = new Float32Array(nx * nz), atual = new Float32Array(nx * nz), vals = [], mxv = 1, cfg = base, escala = 1, metaPat = null;
  /* plano dourado da meta: altura = patrimônio necessário para a renda desejada; a superfície que passa dele acende */
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 12.4), new THREE.MeshBasicMaterial({ color: 0xf2d79a, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false }));
  plano.rotation.x = -Math.PI / 2; plano.visible = false; S.scene.add(plano);
  const borda = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7.2, 0, -6.2), new THREE.Vector3(7.2, 0, -6.2), new THREE.Vector3(7.2, 0, 6.2), new THREE.Vector3(-7.2, 0, 6.2)]), new THREE.LineBasicMaterial({ color: 0xf2d79a, transparent: true, opacity: .7 }));
  borda.visible = false; S.scene.add(borda); let rotMeta = null;
  const hMeta = () => metaPat ? Math.min(7.6, Math.sqrt(metaPat / mxv) * 7.2) : 0;
  const poePlano = () => { const on = !!metaPat; plano.visible = borda.visible = on; if (rotMeta) { S.limpar(rotMeta); rotMeta = null } if (!on) return;
    const y = hMeta(); plano.position.y = borda.position.y = y;
    rotMeta = rotulo(`meta · ${big(metaPat)}${metaPat > mxv ? " (acima do alcance da superfície)" : ""}`, { cor: "#f6dc9c", alt: .55, peso: 600 }); rotMeta.center.set(1, .5); rotMeta.position.set(7.2, y + .45, 6.2); S.scene.add(rotMeta) };
  const ouro = hex("#e2b04a");
  const lo = hex("#0b2c2a"), md = hex("#1f8f76"), hi = hex("#e2c88f"), tmp = new THREE.Color();
  const pinta = () => { for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = j * nx + i, k = q * 3, h = atual[q]; pos[k + 1] = h; const t = h / 7.2;
      if (t < .5) tmp.copy(lo).lerp(md, t * 2); else tmp.copy(md).lerp(hi, (t - .5) * 2);
      if (metaPat && vals[i] && vals[i][j] >= metaPat) tmp.lerp(ouro, .78); cor[k] = tmp.r; cor[k + 1] = tmp.g; cor[k + 2] = tmp.b }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); fio.geometry.dispose(); fio.geometry = new THREE.WireframeGeometry(geo) };
  const poeMarca = () => { const i = Math.min(nx - 1, Math.max(0, cfg.aporte / 250)), j = Math.min(nz - 1, Math.max(0, cfg.anos - 1)), i0 = Math.floor(i), j0 = Math.floor(j);
    const h = atual[Math.round(j) * nx + Math.round(i)] || 0, x = -7 + i * 14 / (nx - 1), z = 6 - j * 12 / (nz - 1); marca.position.set(x, h + .22, z); halo.position.set(x, .02, z);
    haste.geometry.setFromPoints([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, h, z)]); haste.computeLineDistances() };
  const calc = b => { cfg = b; vals = APS.map(a => { const p = projetar(Object.assign({}, b, { aporte: a, anos: ANOS })); return p.anual.map(x => x.pat) });
    mxv = Math.max(...vals.map(c => c[ANOS - 1])) || 1;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) alvo[j * nx + i] = Math.sqrt((vals[i][j] || 0) / mxv) * 7.2;
    const de = atual.slice(); poePlano(); S.tween(700, e => { for (let q = 0; q < atual.length; q++) atual[q] = de[q] + (alvo[q] - de[q]) * e; pinta(); poeMarca() }) };
  const ponto = hit => { const i = Math.round((hit.point.x + 7) / 14 * (nx - 1)), j = Math.round((6 - hit.point.z) / 12 * (nz - 1)); return [Math.min(nx - 1, Math.max(0, i)), Math.min(nz - 1, Math.max(0, j))] };
  S.onHover = (ob, e, hit) => { const [i, j] = ponto(hit), v = vals[i][j], q = j * nx + i; mira.visible = true; mira.position.set(X(i), atual[q] + .14, Z(j));
    tipOn(e.clientX, e.clientY, tipLinhas(`${brl(APS[i], 0)}/mês · ${j + 1} ${j ? "anos" : "ano"}`, [["Patrimônio projetado", `<span style="color:var(--champ2)">${brl(v, 0)}</span>`], ["Renda/mês ao final", `<span class="pos">${brl(v * cfg.dy / 1200)}</span>`]].concat(metaPat ? [["Meta", v >= metaPat ? `<span style="color:#f6dc9c">✓ atinge</span>` : `faltam ${brl(metaPat - v, 0)}`]] : [])) + `<div class="r" style="margin-top:6px;color:var(--champ)">Clique para usar este cenário · simulação</div>`) };
  S.onLeave = () => { mira.visible = false };
  S.onClick = (ob, e, hit) => { const [i, j] = ponto(hit); if (aoEscolher) aoEscolher(APS[i], j + 1) };
  calc(base);
  return { S, set: calc, meta: v => { metaPat = v > 0 ? v : null; poePlano(); pinta() }, persp: PERSP(S, { perspectiva: [[15, 11, 15], [0, 3, 0]], frente: [[0, 5, 22], [0, 3, 0]], lado: [[22, 6, 0], [0, 3, 0]], topo: [[0, 24, .5], [0, 0, 0]] }) } }

/* ============ 5. Carteira: anel (ângulo = valor, altura = renda mensal) ============ */
function anel3D(el, partes) {
  const S = palco(el, { cam: [0, 8.5, 12.5], alvo: [0, .4, 0], minD: 7, maxD: 26, giro: .6 }); if (!S) return null; piso(S, 20);
  const tot = partes.reduce((s, p) => s + p.v, 0) || 1, mr = Math.max(...partes.map(p => p.renda || 0)) || 1, R = 3.2, r = 1.9; let a = 0;
  partes.forEach((p, i) => { const a0 = a, a1 = a + p.v / tot * Math.PI * 2 - .025; a += p.v / tot * Math.PI * 2; const sh = new THREE.Shape();
    sh.absarc(0, 0, R, a0, a1, false); sh.absarc(0, 0, r, a1, a0, true); const h = .22 + (p.renda || 0) / mr * .9, meio = (a0 + a1) / 2, et = rotulo(p.k.split(" · ")[0], { cor: "#eee8dc", alt: .4, peso: 600 }); et.position.set(Math.cos(meio) * (R + .9), h + .25, -Math.sin(meio) * (R + .9)); S.scene.add(et);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 3, curveSegments: 48 }),
      new THREE.MeshPhysicalMaterial({ color: hex(p.c).multiplyScalar(.75), emissive: hex(p.c), emissiveIntensity: .08, metalness: .7, roughness: .3, clearcoat: 1, clearcoatRoughness: .15 }));
    m.rotation.x = -Math.PI / 2; m.scale.z = .001; m.userData = { p, h }; S.scene.add(m); S.hov.push(m); S.tween(900 + i * 120, e => m.scale.z = Math.max(.001, e)) });
  S.onEnter = ob => { S.tween(260, e => ob.position.y = .35 * e); ob.material.emissiveIntensity = .45 };
  S.onLeave = ob => { const y0 = ob.position.y; S.tween(260, e => ob.position.y = y0 * (1 - e)); ob.material.emissiveIntensity = .12 };
  S.onHover = (ob, e) => { const p = ob.userData.p; tipOn(e.clientX, e.clientY, tipLinhas(esc(p.k), [["Valor atual", brl(p.v, 0)], ["Peso", pct(p.v / tot * 100, 1)], ["Renda/mês est.", `<span class="pos">${brl(p.renda)}</span>`]])) };
  S.onClick = (ob, e) => S.onHover(ob, e);
  return { S } }

/* ---------- Projeção mês a mês (Simulador) ----------
   volume champanhe = patrimônio · faixa verde = rendimentos reinvestidos · área/linha azul = total aportado
   · linha clara tracejada = cenário anterior. Só apresentação: os números vêm de simular(). */
function projecao3D(el) {
  const S = palco(el, { cam: [5.5, 5.2, 19.5], alvo: [0, 2.6, 0], minD: 10, maxD: 38, maxP: 1.45 }); if (!S) return null; piso(S);
  const W = 19, H = 5.6, grupo = { g: null }, feixe = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 8), new THREE.MeshBasicMaterial({ color: 0xf2e3bd, transparent: true, opacity: .6 }));
  const pPat = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), new THREE.MeshStandardMaterial({ color: 0xf2e3bd, emissive: 0xd6be8a, emissiveIntensity: 1.1 }));
  const pApo = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7fa7d9 }));
  [feixe, pPat, pApo].forEach(o => { o.visible = false; S.scene.add(o) });
  let atual = null, dados = null, ultimo = null, aoHover = null;
  const desenhar = (v, mx) => { if (grupo.g) S.limpar(grupo.g); const g = new THREE.Group(), n = v.pat.length - 1, X = i => -W / 2 + i * W / n, Y = x => .02 + x / mx * H;
    const pts = v.pat.map((x, i) => new THREE.Vector3(X(i), Y(x), 0)), passoA = Math.max(1, Math.round(n / 160)), am = pts.filter((_, i) => i % passoA === 0 || i === n);
    const sh = new THREE.Shape(); sh.moveTo(am[0].x, 0); am.forEach(q => sh.lineTo(q.x, q.y)); sh.lineTo(am[am.length - 1].x, 0); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: false }); geo.translate(0, 0, -.55); gradienteY(geo, "#0b0d10", "#7a6238", H + .2);
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .42, side: THREE.FrontSide, depthWrite: false })));
    const cv = new THREE.CatmullRomCurve3(am, false, "centripetal", .2);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, am.length * 3, .05, 8), new THREE.MeshBasicMaterial({ color: 0xf6e8c4 })));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(cv, am.length * 3, .17, 8), new THREE.MeshBasicMaterial({ color: 0xd6be8a, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false })));
    // faixa dos rendimentos reinvestidos (entre aportado e aportado + rendimentos), na face da frente
    const fr = .56, ia = v.apo.map((x, i) => [X(i), Y(Math.min(x, v.pat[i]))]).filter((_, i) => i % passoA === 0 || i === n), ib = v.ar.map((x, i) => [X(i), Y(Math.min(x, v.pat[i]))]).filter((_, i) => i % passoA === 0 || i === n);
    if (v.ar.some((x, i) => x - v.apo[i] > mx * .002)) { const bs = new THREE.Shape(); bs.moveTo(ia[0][0], ia[0][1]); ib.forEach(q => bs.lineTo(q[0], q[1])); for (let k = ia.length - 1; k >= 0; k--) bs.lineTo(ia[k][0], ia[k][1]); bs.closePath();
      const bm = new THREE.Mesh(new THREE.ShapeGeometry(bs), new THREE.MeshBasicMaterial({ color: 0x2f9c84, transparent: true, opacity: .34, side: THREE.DoubleSide, depthWrite: false })); bm.position.z = fr; g.add(bm);
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ib.map(q => new THREE.Vector3(q[0], q[1], fr + .01))), new THREE.LineBasicMaterial({ color: 0x6fe0c4, transparent: true, opacity: .9 }))) }
    { const as = new THREE.Shape(); as.moveTo(ia[0][0], 0); ia.forEach(q => as.lineTo(q[0], q[1])); as.lineTo(ia[ia.length - 1][0], 0); as.closePath();
      const amh = new THREE.Mesh(new THREE.ShapeGeometry(as), new THREE.MeshBasicMaterial({ color: 0x3b5578, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false })); amh.position.z = fr - .005; g.add(amh) }
    const la = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ia.map(q => new THREE.Vector3(q[0], q[1], fr + .02))), new THREE.LineDashedMaterial({ color: 0x7fa7d9, dashSize: .22, gapSize: .14, transparent: true, opacity: .95 })); la.computeLineDistances(); g.add(la);
    // cenário anterior: linha clara, fina, logo atrás
    if (v.fant) { const fp = v.fant.map((x, i) => new THREE.Vector3(-W / 2 + i * W / (v.fant.length - 1), Y(x), fr + .04)).filter((_, i) => i % passoA === 0 || i === v.fant.length - 1);
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(fp), new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: .12, gapSize: .1, transparent: true, opacity: .55 })).computeLineDistances()) }
    // eixo: meses reais, espaçamento automático
    const passo = [1, 2, 3, 6, 12, 24, 36, 60].find(p => n / p <= 9) || 60;
    v.ms.forEach((m, i) => { if (i % passo && i !== n) return; if (i !== n && n - i < passo * .6) return; const l = rotulo(mes(m).replace(/^./, c => c.toUpperCase()), { alt: .42, cor: "#8f959d" }); l.position.set(X(i), -.05, 1.6); g.add(l) });
    [.33, .66, 1].forEach(t => { const yy = .02 + t * H; g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2 - .3, yy, -.57), new THREE.Vector3(W / 2 + .3, yy, -.57)]), new THREE.LineBasicMaterial({ color: 0x2a2f36, transparent: true, opacity: .8 })));
      const l = rotulo(big(mx * t), { esq: true, cor: "#6c737c", alt: .34 }); l.position.set(W / 2 + .45, yy, -.57); g.add(l) });
    // alvo invisível para o mouse/dedo escolher o mês
    const alvo = new THREE.Mesh(new THREE.PlaneGeometry(W + .6, H + 1.4), new THREE.MeshBasicMaterial({ visible: false })); alvo.position.set(0, H / 2 + .2, .6); g.add(alvo); S.hov = [alvo];
    S.scene.add(g); grupo.g = g; return { X, Y, n } };
  let geom = null, mxAtual = 1;
  const mostrar = i => { if (!dados || i == null) { [feixe, pPat, pApo].forEach(o => o.visible = false); aoHover && aoHover(null); return } const x = geom.X(i), yP = geom.Y(dados.pat[i]);
    feixe.visible = pPat.visible = pApo.visible = true; feixe.scale.y = yP; feixe.position.set(x, yP / 2, .58); pPat.position.set(x, yP, 0); pApo.position.set(x, geom.Y(Math.min(dados.apo[i], dados.pat[i])), .58); aoHover && aoHover(i) };
  S.onHover = (ob, e, hit) => { if (!dados) return; const i = Math.max(0, Math.min(geom.n, Math.round((hit.point.x + W / 2) / W * geom.n))), r = dados.r.serie[i], ant = dados.r0 && dados.r0[i];
    mostrar(i); const reinv = dados.reinv, rendR = reinv ? r.rendTot : 0, val = r.pat - r.aport - rendR;
    tipOn(e.clientX, e.clientY, tipLinhas(mes(dados.ms[i]).replace(/^./, c => c.toUpperCase()), [["Patrimônio", `<span style="color:var(--champ2)">${brl(r.pat, 0)}</span>`], ["Total aportado", brl(r.aport, 0)], ["Rendimentos acumulados", `<span class="pos">${brl(r.rendTot, 0)}</span>${reinv ? "" : " <span style='color:var(--mute)'>(recebidos)</span>"}`],
      ["Valorização", `${val >= 0 ? "" : "−"}${brl(Math.abs(Math.abs(val) < .5 ? 0 : val), 0)}`], ["Cotas", int(r.cotas)], ["Renda mensal estimada", `<span class="pos">${brl(r.renda)}</span>`]].concat(ant ? [["Cenário anterior", `<span style="color:var(--mute)">${brl(ant.pat, 0)}</span>`]] : []))) };
  S.onLeave = () => { mostrar(null); tipOff() }; S.onClick = (ob, e, hit) => S.onHover(ob, e, hit);
  return { S, aoHover: f => aoHover = f,
    set(r, ant, reinv) { const ms = mesesReais(r.serie.length - 1), novo = { pat: r.serie.map(p => p.pat), apo: r.serie.map(p => p.aport), ar: r.serie.map(p => p.aport + (reinv ? p.rendTot : 0)) };
      const fant = ant ? ant.map(p => p.pat) : null, mx = Math.max(...novo.pat, ...(fant || [0])) * 1.08 || 1;
      dados = { pat: novo.pat, apo: novo.apo, ms, r, r0: ant, reinv };
      // transição: a curva se transforma do cenário anterior para o novo (mesmo nº de meses), senão cresce do chão
      const de = ultimo && ultimo.pat.length === novo.pat.length ? ultimo : { pat: novo.pat.map(() => 0), apo: novo.apo.map(() => 0), ar: novo.ar.map(() => 0) }, mx0 = ultimo ? mxAtual : mx;
      ultimo = novo; S.tw.length = 0;
      S.tween(RM ? 1 : 560, e => { const mix = (a, b) => a.map((x, i) => x + (b[i] - x) * e); geom = desenhar({ pat: mix(de.pat, novo.pat), apo: mix(de.apo, novo.apo), ar: mix(de.ar, novo.ar), fant, ms }, mx0 + (mx - mx0) * e) }, () => { mxAtual = mx }) },
    persp: k => { const P = { perspectiva: [[5.5, 5.2, 19.5], [.6, 2.6, 0]], frente: [[.6, 3.4, 20], [.6, 2.8, 0]], lado: [[22, 5, 5], [0, 2.6, 0]], topo: [[.6, 25, 3], [.6, 0, 0]] }[k]; if (!P) return;
      // tela mais "alta" que o card (tela cheia, notebook): afasta a câmera para os rótulos de valor não saírem do quadro
      const asp = el.clientWidth / Math.max(1, el.clientHeight), f = Math.max(1, Math.pow(2.4 / asp, .66) / (asp < 1.2 ? Math.min(2.6, Math.pow(1.2 / asp, .85)) : 1)), A = P[1];
      S.voar(P[0].map((c, j) => A[j] + (c - A[j]) * f), A) } } }
