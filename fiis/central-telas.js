/* Central de FIIs — telas, rotas e microinterações */
"use strict";
const S = { view: "painel", q: "", tipos: [], seg: "", dyMin: "", dyMax: "", pvpMax: "", liqMin: "0", cotMin: "", sort: "liq", desc: true, lim: 50,
  rk: "dy", rkSeg: "", rkLiq: "500000", sim: null, per: 12, fonte: null, zk: "liq", mapaTipos: TIPOS.slice(), mapaTodos: false };
const API = {};
/* celular: até 760 px a tabela vira lista de cartões e os filtros recolhem; ao cruzar o limite a tela é redesenhada */
const MQ = matchMedia("(max-width: 760px)"), MOB = () => MQ.matches;
const go = (v, arg) => { location.hash = arg ? v + "/" + arg : v };
const ctrls = (id, persp, ini) => `<div class="ctrl"><div class="seg" data-persp="${id}">${persp.map(([k, t]) => `<button data-k="${k}" class="${k === ini ? "on" : ""}">${t}</button>`).join("")}</div>
  <button class="ic" data-zoom="${id}" data-f=".78" title="Aproximar" aria-label="Aproximar">+</button><button class="ic" data-zoom="${id}" data-f="1.28" title="Afastar" aria-label="Afastar">−</button>
  ${TOQUE ? `<button class="ic" data-giro="${id}" title="Girar com o dedo" aria-label="Girar com o dedo">⟲</button>` : ""}</div>`;
/* tela cheia: qualquer palco 3D com este botão vira tela inteira (e volta) */
const xp = () => `<button class="ic xp" data-full title="Abrir em tela cheia (Esc para sair)" aria-label="Abrir em tela cheia">⛶</button>`;
function cheia(st, on) { const bt = st.querySelector("[data-full]"), pal = C3.find(x => x.el === st); const run = () => { st.classList.toggle("full", on); document.body.classList.toggle("noscroll", on); if (pal && pal.cheia) pal.cheia(on);
    const h = st.querySelector(".hint"); if (h && TOQUE) h.textContent = on ? "Arraste para girar · pinça para aproximar · toque nos pontos" : "Toque nos pontos para ver os dados · ⟲ libera o giro";
    if (bt) { bt.textContent = on ? "✕" : "⛶"; bt.title = on ? "Sair da tela cheia (Esc)" : "Abrir em tela cheia (Esc para sair)"; bt.setAttribute("aria-label", bt.title) } };
  if (document.startViewTransition && !RM) { document.documentElement.classList.add("vt-palco"); st.style.viewTransitionName = "palco"; const tr = document.startViewTransition(run); tr.ready.catch(() => { });
    tr.finished.catch(() => { }).then(() => { st.style.viewTransitionName = ""; document.documentElement.classList.remove("vt-palco") }) } else run() }
function ligarCheia() { document.querySelectorAll(".stage [data-full]").forEach(b => { const st = b.closest(".stage"); b.onclick = e => { e.stopPropagation(); cheia(st, !st.classList.contains("full")) } }) }
const sairCheia = () => { const st = document.querySelector(".stage.full"); if (st) { cheia(st, false); return true } return false };
const dica = t => `<div class="hint">${TOQUE ? "Toque nos pontos para ver os dados · ⟲ libera o giro" : t || "Arraste para girar · duplo clique aproxima · passe o mouse nos pontos"}</div>`;
function ligarCtrls(id) { const api = API[id]; if (!api) return;
  document.querySelectorAll(`[data-persp="${id}"] button`).forEach(b => b.onclick = () => { document.querySelectorAll(`[data-persp="${id}"] button`).forEach(x => x.classList.toggle("on", x === b)); api.persp && api.persp(b.dataset.k) });
  document.querySelectorAll(`[data-zoom="${id}"]`).forEach(b => b.onclick = () => api.S.zoom(+b.dataset.f));
  document.querySelectorAll(`[data-giro="${id}"]`).forEach(b => b.onclick = () => { const on = !b.classList.contains("on"); b.classList.toggle("on", on); api.S.girar(on); toast(on ? "Giro liberado: arraste com o dedo" : "Giro travado: a página volta a rolar") }) }
const spark = ps => { if (!ps || ps.length < 2) return ""; const v = ps.map(x => x[1]), mn = Math.min(...v), mx = Math.max(...v), up = v[v.length - 1] >= v[0];
  const d = v.map((y, i) => (i ? "L" : "M") + (i / (v.length - 1) * 84).toFixed(1) + " " + (22 - (y - mn) / ((mx - mn) || 1) * 20).toFixed(1)).join(" ");
  return `<svg class="spark" viewBox="0 0 84 24"><path d="${d}" fill="none" stroke="${up ? "#46C2A6" : "#E8857A"}" stroke-width="1.4" stroke-linejoin="round"/></svg>` };

/* ============ Visão geral ============ */
const VIEWS = {}, AFTER = {};
VIEWS.painel = () => { const c = carteira(), temC = c.length > 0; if (S.fonte == null) S.fonte = temC ? "cart" : "merc";
  const pat = c.reduce((s, p) => s + (p.atual || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), ru = c.reduce((s, p) => s + (p.rendUlt || 0), 0), liq = F.filter(f => (f.liq || 0) >= 500000);
  const kp = temC ? [["Patrimônio em FIIs", pat, brl, `${c.length} ${c.length === 1 ? "posição" : "posições"} · ${T("calc")}`], ["Próximo pagamento (est.)", ru, brl, `último rendimento × cotas · média 12m ${brl(rm)}/mês ${T("calc")}`], ["Fundos na carteira", c.length, int, `de ${int(F.length)} na base ${T("real")}`], ["Dividend Yield da carteira", pat ? rm * 12 / pat * 100 : 0, v => pct(v), `rendimentos 12m ÷ valor ${T("calc")}`]]
    : [["FIIs na base", F.length, int, `negociados em bolsa ${T("real")}`], ["DY 12m mediano", med(liq.map(f => f.dy12)), v => pct(v), `fundos líquidos ${T("calc")}`], ["P/VP mediano", med(liq.filter(f => !f.sus).map(f => f.pvp)), v => nf(v), `fundos líquidos ${T("calc")}`], ["Liquidez somada/dia", F.reduce((s, f) => s + (f.liq || 0), 0), big, `21 pregões ${T("calc")}`]];
  return `<p class="eyebrow">Patrimônio · Fundos imobiliários</p><h2 class="ttl">Visão geral</h2><p class="lead">Sua posição em FIIs e o mercado em profundidade. Gire os gráficos, troque o período e aproxime para explorar.</p>
  <section class="glass stage" id="st-hero" style="height:500px"><div class="hud"><div><div class="lbl" id="heroL">${S.fonte === "cart" ? "Patrimônio em FIIs" : "Índice de mercado · 30 FIIs mais líquidos · base R$ 100 mil"}</div>
      <div class="big num" id="heroV">R$ 0</div><div class="delta" id="heroD">&nbsp;</div></div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><div class="seg" id="per">${[[6, "6M"], [12, "12M"], [24, "24M"]].map(([v, t]) => `<button data-v="${v}" class="${S.per === v ? "on" : ""}">${t}</button>`).join("")}</div>
      ${temC ? `<div class="seg" id="fonte"><button data-v="cart" class="${S.fonte === "cart" ? "on" : ""}">Minha carteira</button><button data-v="merc" class="${S.fonte === "merc" ? "on" : ""}">Mercado</button></div>` : ""}
      <span class="cnt" id="heroS">${S.fonte === "cart" ? T("calc", "cotas × fechamento do mês") : T("sim", "simulação sobre dados reais")}</span></div></div>
    ${xp()}${ctrls("hero", [["perspectiva", "Perspectiva"], ["frente", "Frontal"], ["lado", "Lateral"], ["topo", "Topo"]], "perspectiva")}${dica()}</section>
  <div class="grid g4" style="margin-top:18px">${kp.map(([l, v, f, s], i) => `<div class="glass tilt kpi"><div class="lbl">${l}</div><div class="v num" data-k="${i}">${f(0)}</div><small>${s}</small></div>`).join("")}</div>
  <section style="margin-top:34px"><p class="eyebrow">Mercado</p><h2 class="ttl" style="font-size:2rem">Mapa tridimensional</h2>
    <p class="lead">Cada esfera é um FII: <b>P/VP</b> na largura, <b>DY 12 meses</b> na altura e a terceira dimensão à sua escolha. Tamanho = patrimônio. O plano verde marca P/VP = 1. Clique numa esfera para voar até ela e abrir a ficha.</p>
    <div class="toolbar"><div class="seg" id="zk">${Object.entries(EIXOZ).map(([k, v]) => `<button data-v="${k}" class="${S.zk === k ? "on" : ""}">${v[0]}</button>`).join("")}</div>
      ${TIPOS.map(t => `<button class="pill${S.mapaTipos.includes(t) ? " on" : ""}" data-mt="${t}">${tp(t)}</button>`).join("")}
      <label class="switch" style="margin-left:auto"><input type="checkbox" id="mtodos"${S.mapaTodos ? " checked" : ""}> Incluir fundos de baixa liquidez</label></div>
    <div class="glass stage" id="st-mapa" style="height:600px">${xp()}${ctrls("mapa", [["perspectiva", "Perspectiva"], ["frente", "P/VP × DY"], ["lado", "DY × " + EIXOZ[S.zk][0]], ["topo", "Topo"]], "perspectiva")}${dica()}</div>
    <p class="foot">${T("real")} cotação, patrimônio e cotistas · ${T("calc")} DY 12m, P/VP, liquidez e retorno. Valores fora das faixas do mapa ficam encostados nas bordas.</p></section>
  <section class="grid g3" style="margin-top:26px">${mini("Maior liquidez", F.slice().sort((a, b) => (b.liq || 0) - (a.liq || 0)).slice(0, 5), f => big(f.liq) + "/dia")}${mini("Mais cotistas", F.slice().sort((a, b) => (b.cotistas || 0) - (a.cotistas || 0)).slice(0, 5), f => int(f.cotistas))}${mini("Maior patrimônio", F.slice().sort((a, b) => (b.pl || 0) - (a.pl || 0)).slice(0, 5), f => big(f.pl))}</section>` };
const mini = (t, l, fv) => `<div class="glass tilt"><div class="pad" style="padding-bottom:6px"><div class="lbl">${t}</div></div><ul class="rlist">${l.map((f, i) => `<li data-tk="${f.t}"><span class="n">${i + 1}</span><span><span class="tkb">${f.t}</span><span class="nm">${esc(f.nm)}</span></span><b>${fv(f)}</b></li>`).join("")}</ul></div>`;
AFTER.painel = () => { const c = carteira();
  const serie = () => S.fonte === "cart" ? historico(c, S.per) : indiceMercado(S.per);
  const heroV = document.getElementById("heroV"), heroD = document.getElementById("heroD"); let sr = serie();
  const resumo = () => { const a = sr.find(x => x.pat > 0) || sr[0], b = sr[sr.length - 1]; /* a carteira pode ter começado no meio do período */ if (!b) return; contar(heroV, b.pat, v => brl(v, 0)); const d = b.pat - a.pat, r = sr.reduce((s, x) => s + x.rend, 0);
    /* na carteira a variação mistura aportes com valorização: sem %, para não exagerar (ex.: de 1 para 15 cotas) */
    heroD.innerHTML = `<span class="${d >= 0 ? "pos" : "neg"}">${sgn(d)} ${brl(Math.abs(d), 0)} no período${S.fonte === "cart" ? "" : ` (${sgn(d)}${pct(Math.abs(a.pat ? d / a.pat * 100 : 0), 1)})`}</span> <span class="cnt">${S.fonte === "cart" ? "inclui novos aportes · " : "· "}${brl(r, 0)} em rendimentos</span>` };
  API.hero = hero3D(document.getElementById("st-hero"), sr, { aoPonto: i => { if (i == null) return resumo(); const p = sr[i], a = sr[i - 1]; contar(heroV, p.pat, v => brl(v, 0), 450);
    heroD.innerHTML = `<span class="cnt">em ${mes(p.m)}</span> ${a ? `<span class="${p.pat >= a.pat ? "pos" : "neg"}">${sgn(p.pat - a.pat)} ${brl(Math.abs(p.pat - a.pat), 0)} no mês</span>` : ""} <span class="cnt">· ${brl(p.rend, 2)} de rendimentos</span>` } });
  resumo(); ligarCtrls("hero");
  document.querySelectorAll("#per button").forEach(b => b.onclick = () => { S.per = +b.dataset.v; document.querySelectorAll("#per button").forEach(x => x.classList.toggle("on", x === b)); sr = serie(); API.hero && API.hero.set(sr); resumo() });
  document.querySelectorAll("#fonte button").forEach(b => b.onclick = () => { S.fonte = b.dataset.v; document.querySelectorAll("#fonte button").forEach(x => x.classList.toggle("on", x === b));
    document.getElementById("heroL").textContent = S.fonte === "cart" ? "Patrimônio em FIIs" : "Índice de mercado · 30 FIIs mais líquidos · base R$ 100 mil";
    document.getElementById("heroS").innerHTML = S.fonte === "cart" ? T("calc", "cotas × fechamento do mês") : T("sim", "simulação sobre dados reais"); heroV.dataset.v = 0; sr = serie(); API.hero && API.hero.set(sr); resumo() });
  const kpv = [...document.querySelectorAll(".kpi .v")], pat = c.reduce((s, p) => s + (p.atual || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), liq = F.filter(f => (f.liq || 0) >= 500000);
  const vals = c.length ? [[pat, brl], [c.reduce((s, p) => s + (p.rendUlt || 0), 0), brl], [c.length, int], [pat ? rm * 12 / pat * 100 : 0, v => pct(v)]] : [[F.length, int], [med(liq.map(f => f.dy12)), v => pct(v)], [med(liq.filter(f => !f.sus).map(f => f.pvp)), v => nf(v)], [F.reduce((s, f) => s + (f.liq || 0), 0), big]];
  kpv.forEach((el, i) => setTimeout(() => contar(el, vals[i][0] || 0, vals[i][1], 1300), 250 + i * 120));
  const montaMapa = () => { if (API.mapa) { const i = C3.indexOf(API.mapa.S); if (i >= 0) C3.splice(i, 1)[0].dispose() }
    const base = F.filter(f => f.pvp && f.dy12 && !f.sus && (S.mapaTodos || (f.liq || 0) >= 500000));
    API.mapa = mapa3D(document.getElementById("st-mapa"), base, { z: S.zk, aoAbrir: f => go("fii", f.t) }); if (API.mapa) API.mapa.tipos(S.mapaTipos); ligarCtrls("mapa") };
  montaMapa();
  document.querySelectorAll("#zk button").forEach(b => b.onclick = () => { S.zk = b.dataset.v; document.querySelectorAll("#zk button").forEach(x => x.classList.toggle("on", x === b)); API.mapa && API.mapa.setZ(S.zk);
    const lado = document.querySelector('[data-persp="mapa"] [data-k="lado"]'); if (lado) lado.textContent = "DY × " + EIXOZ[S.zk][0] });
  document.querySelectorAll("[data-mt]").forEach(b => b.onclick = () => { const t = b.dataset.mt; S.mapaTipos = S.mapaTipos.includes(t) ? S.mapaTipos.filter(x => x !== t) : S.mapaTipos.concat(t); b.classList.toggle("on"); API.mapa && API.mapa.tipos(S.mapaTipos) });
  document.getElementById("mtodos").onchange = e => { S.mapaTodos = e.target.checked; montaMapa() };
  ligarLinhas() };
function ligarLinhas() { document.querySelectorAll("[data-tk]").forEach(el => { if (el.closest("#st-mapa")) return; el.onclick = () => abrirFicha(el.dataset.tk, el.querySelector(".tkb") || el) }) }
function abrirFicha(t, el) { if (el && document.startViewTransition) el.style.viewTransitionName = "fiitk"; go("fii", t) }

/* ============ Explorar ============ */
const COLS = [["t", "Fundo", "", f => `<span class="tkb">${f.t}</span><span class="nm">${esc(f.nm)}</span>`], ["tipo", "Tipo", "", f => tp(f.tipo)], ["seg", "Segmento", "", f => `<span style="color:var(--ink2)">${esc(f.seg)}</span>`],
  ["preco", "Cotação", "n", f => brl(f.preco)], ["var1", "Dia", "n", f => f.var1 == null ? "—" : `<span class="${f.var1 >= 0 ? "pos" : "neg"}">${sgn(f.var1)}${pct(Math.abs(f.var1))}</span>`], ["sp", "12 meses", "", f => spark((f.precos || []).slice(-12))],
  ["dy12", "DY 12m", "n", f => `<span class="dybar"><i style="width:${Math.min(60, (f.dy12 || 0) * 3)}px"></i>${pct(f.dy12)}</span>`], ["pvp", "P/VP", "n", f => f.pvp == null ? "—" : `<span class="pvp ${f.pvp < 1 ? "d" : "p"}">${nf(f.pvp)}</span>${f.sus ? `<span class="flag" title="VP/cota da CVM pode estar defasado">⚠</span>` : ""}`],
  ["vpa", "VP/cota", "n", f => brl(f.vpa)], ["pl", "Patrimônio", "n", f => big(f.pl)], ["liq", "Liquidez", "n", f => big(f.liq)], ["cotistas", "Cotistas", "n", f => int(f.cotistas)],
  ["ultDiv", "Últ. rend.", "n", f => f.ultDiv ? `${brl(f.ultDiv.v, 2)}<span class="sub2">${pct(f.ultDiv.v / f.preco * 100, 2)}</span>` : "—"], ["ret12", "Retorno 12m", "n", f => f.ret12 == null ? "—" : `<span class="${f.ret12 >= 0 ? "pos" : "neg"}">${pct(f.ret12, 1)}</span>`], ["dyMes", "DY mês CVM", "n", f => pct(f.dyMes)], ["tx", "Taxa adm.", "n", f => pct(f.tx, 3)]];
function filtrados() { const q = S.q.trim().toLowerCase(), n = v => v === "" ? null : +String(v).replace(",", "."), dmin = n(S.dyMin), dmax = n(S.dyMax), pmax = n(S.pvpMax), lmin = +S.liqMin || 0, cmin = n(S.cotMin);
  const l = F.filter(f => (!q || f.t.toLowerCase().includes(q) || f.nm.toLowerCase().includes(q) || (f.nome || "").toLowerCase().includes(q)) && (!S.tipos.length || S.tipos.includes(f.tipo)) && (!S.seg || f.seg === S.seg)
    && (dmin == null || (f.dy12 || 0) >= dmin) && (dmax == null || (f.dy12 || 0) <= dmax) && (pmax == null || (f.pvp != null && f.pvp <= pmax)) && ((f.liq || 0) >= lmin) && (cmin == null || (f.cotistas || 0) >= cmin));
  const k = S.sort, sg = S.desc ? -1 : 1, val = f => k === "ultDiv" ? (f.ultDiv ? f.ultDiv.v : null) : k === "sp" ? f.ret12 : f[k];
  return l.sort((a, b) => { const x = val(a), y = val(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === "string" ? x.localeCompare(y) : x - y) * sg }) }
VIEWS.explorar = () => `<p class="eyebrow">Base de ${int(F.length)} fundos</p><h2 class="ttl">Explorar</h2><p class="lead">Pesquise, combine filtros e ordene qualquer coluna. Toque num fundo para abrir a ficha.</p>
  <div class="toolbar"><div class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" placeholder="Ticker ou nome (ex.: MXRF, logística, Kinea)" value="${esc(S.q)}" autocomplete="off"></div><button class="pill" id="limpar">Limpar filtros</button></div>
  <details class="mfilt"${MOB() ? "" : " open"}><summary>Filtros${(() => { const n = S.tipos.length + ["seg", "dyMin", "dyMax", "pvpMax", "cotMin"].filter(k => S[k]).length + (S.liqMin !== "0" ? 1 : 0); return n ? ` <span class="badge">${n}</span>` : "" })()}</summary>
  <div class="toolbar scrollx">${TIPOS.map(t => `<button class="pill${S.tipos.includes(t) ? " on" : ""}" data-tipo="${t}">${tp(t)}</button>`).join("")}</div>
  <div class="filters"><label><span class="lbl">Segmento</span><select id="fseg"><option value="">Todos</option>${SEGS.map(s => `<option${S.seg === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
    <label><span class="lbl">DY 12m mín. %</span><input id="fdymin" inputmode="decimal" value="${esc(S.dyMin)}" placeholder="8"></label><label><span class="lbl">DY 12m máx. %</span><input id="fdymax" inputmode="decimal" value="${esc(S.dyMax)}" placeholder="16"></label>
    <label><span class="lbl">P/VP máximo</span><input id="fpvp" inputmode="decimal" value="${esc(S.pvpMax)}" placeholder="1,00"></label>
    <label><span class="lbl">Liquidez mín./dia</span><select id="fliq">${[["0", "Qualquer"], ["100000", "R$ 100 mil"], ["500000", "R$ 500 mil"], ["1000000", "R$ 1 milhão"], ["5000000", "R$ 5 milhões"]].map(([v, t]) => `<option value="${v}"${S.liqMin === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
    <label><span class="lbl">Cotistas mín.</span><input id="fcot" inputmode="numeric" value="${esc(S.cotMin)}" placeholder="10000"></label></div></details>
  <div id="tbl"></div>`;
function tabelaMob(l, vis, c0) { const kv = (k, v) => `<div><span class="lbl">${k}</span><b>${v}</b></div>`;
  document.getElementById("tbl").innerHTML = `<div class="msort"><span class="cnt">${int(l.length)} de ${int(F.length)}</span><label class="ms-s"><span class="lbl">Ordenar</span><select id="msort">${COLS.filter(c => c[0] !== "sp").map(c => `<option value="${c[0]}"${S.sort === c[0] ? " selected" : ""}>${c[1]}</option>`).join("")}</select></label>
    <button class="ic" id="mdir" aria-label="Inverter a ordem">${S.desc ? "↓" : "↑"}</button></div>
  <div class="mlist">${vis.map((f, i) => `<article class="mcard" data-mtk="${f.t}" style="animation:rise .4s var(--ease) both;animation-delay:${Math.min(i, 12) * 22}ms">
    <button class="mc-h" data-mx aria-expanded="false"><span class="mc-id"><span class="tkb">${f.t}</span><span class="nm">${esc(f.nm)}</span></span><span class="mc-px"><b class="num">${brl(f.preco)}</b>${COLS.find(c => c[0] === "var1")[3](f)}</span><span class="mc-ch" aria-hidden="true">›</span></button>
    <div class="mc-k">${kv("DY 12m", pct(f.dy12))}${kv("P/VP", COLS.find(c => c[0] === "pvp")[3](f))}${kv(S.sort && !["preco", "var1", "dy12", "pvp", "t", "tipo", "seg", "sp"].includes(S.sort) && c0 ? c0[1] : "Liquidez", S.sort && !["preco", "var1", "dy12", "pvp", "t", "tipo", "seg", "sp"].includes(S.sort) && c0 ? c0[3](f) : big(f.liq))}</div>
    <div class="mc-x" hidden><div class="mc-sp">${tp(f.tipo)}<span class="cnt">${esc(f.seg)}</span>${spark((f.precos || []).slice(-12))}</div>
      <div class="mc-g">${kv("VP/cota", brl(f.vpa))}${kv("Patrimônio", big(f.pl))}${kv("Liquidez", big(f.liq))}${kv("Cotistas", int(f.cotistas))}${kv("Últ. rend.", COLS.find(c => c[0] === "ultDiv")[3](f))}${kv("Retorno 12m", COLS.find(c => c[0] === "ret12")[3](f))}${kv("DY mês CVM", pct(f.dyMes))}${kv("Taxa adm.", pct(f.tx, 3))}</div>
      <button class="btn" data-abre="${f.t}" style="width:100%">Abrir ficha de ${f.t} →</button></div></article>`).join("") || `<p class="empty">Nenhum fundo com esses filtros.</p>`}</div>
  ${l.length > S.lim ? `<button class="more" id="mais">Mostrar mais ${Math.min(50, l.length - S.lim)}</button>` : ""}
  <p class="cnt" style="margin-top:12px">${T("real")} cotação, cadastro e PL · ${T("calc")} DY 12m, P/VP, liquidez e retorno</p>`;
  document.getElementById("msort").onchange = e => { const k = e.target.value; S.sort = k; S.desc = !["t", "tipo", "seg", "pvp", "tx"].includes(k); tabela() };
  document.getElementById("mdir").onclick = () => { S.desc = !S.desc; tabela() };
  document.querySelectorAll("[data-mx]").forEach(b => b.onclick = () => { const c = b.closest(".mcard"), x = c.querySelector(".mc-x"), ab = x.hidden; x.hidden = !ab; c.classList.toggle("open", ab); b.setAttribute("aria-expanded", ab) });
  document.querySelectorAll("[data-abre]").forEach(b => b.onclick = () => abrirFicha(b.dataset.abre, b.closest(".mcard").querySelector(".tkb")));
  const m = document.getElementById("mais"); if (m) m.onclick = () => { S.lim += 50; tabela() } }
function tabela() { const l = filtrados(), vis = l.slice(0, S.lim), c0 = COLS.find(c => c[0] === S.sort); if (MOB()) return tabelaMob(l, vis, c0);
  document.getElementById("tbl").innerHTML = `<p class="cnt" style="margin:0 0 10px">${int(l.length)} de ${int(F.length)} fundos · ordem: <b style="color:var(--champ)">${c0 ? c0[1] : ""}</b> ${S.desc ? "↓" : "↑"} · ${T("real")} cotação, cadastro e PL · ${T("calc")} DY 12m, P/VP, liquidez e retorno</p>
  <div class="glass dgrid"><table><thead><tr>${COLS.map(c => `<th class="${c[2]}${c[0] === "t" ? " tk" : ""}${S.sort === c[0] ? " on" + (S.desc ? " desc" : "") : ""}" data-k="${c[0]}">${c[1]}${S.sort === c[0] ? '<span class="ar">▲</span>' : ""}</th>`).join("")}</tr></thead>
  <tbody>${vis.map((f, i) => `<tr data-tk="${f.t}" style="animation:rise .45s var(--ease) both;animation-delay:${Math.min(i, 18) * 16}ms">${COLS.map(c => `<td class="${c[2]}${c[0] === "t" ? " tk" : ""}">${c[3](f)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${COLS.length}" class="empty">Nenhum fundo com esses filtros.</td></tr>`}</tbody></table></div>
  ${l.length > S.lim ? `<button class="more" id="mais">Mostrar mais ${Math.min(50, l.length - S.lim)}</button>` : ""}`;
  document.querySelectorAll("th[data-k]").forEach(th => th.onclick = () => { const k = th.dataset.k; if (S.sort === k) S.desc = !S.desc; else { S.sort = k; S.desc = !["t", "tipo", "seg", "pvp", "tx"].includes(k) } tabela() });
  document.querySelectorAll("tbody tr[data-tk]").forEach(tr => tr.onclick = () => abrirFicha(tr.dataset.tk, tr.querySelector(".tkb")));
  const m = document.getElementById("mais"); if (m) m.onclick = () => { S.lim += 50; tabela() } }
AFTER.explorar = () => { const q = document.getElementById("q"); if (!TOQUE) q.focus(); q.oninput = () => { S.q = q.value; S.lim = 50; tabela() };
  const bind = (id, k) => { const el = document.getElementById(id); el.oninput = el.onchange = () => { S[k] = el.value; S.lim = 50; tabela() } };
  bind("fseg", "seg"); bind("fdymin", "dyMin"); bind("fdymax", "dyMax"); bind("fpvp", "pvpMax"); bind("fliq", "liqMin"); bind("fcot", "cotMin");
  document.querySelectorAll("[data-tipo]").forEach(b => b.onclick = () => { const t = b.dataset.tipo; S.tipos = S.tipos.includes(t) ? S.tipos.filter(x => x !== t) : S.tipos.concat(t); b.classList.toggle("on"); S.lim = 50; tabela() });
  document.getElementById("limpar").onclick = () => { Object.assign(S, { q: "", tipos: [], seg: "", dyMin: "", dyMax: "", pvpMax: "", liqMin: "0", cotMin: "", lim: 50 }); rota() }; tabela() };

/* ============ Rankings ============ */
VIEWS.melhores = () => { const R = RANKS.find(r => r[0] === S.rk) || RANKS[0], [, titulo, crit, fv, fmt, desc] = R;
  const base = F.filter(f => (f.liq || 0) >= +S.rkLiq && (!S.rkSeg || f.seg === S.rkSeg || f.tipo === S.rkSeg));
  const l = base.filter(f => fv(f) != null && isFinite(fv(f))).sort((a, b) => (fv(a) - fv(b)) * (desc ? -1 : 1)).slice(0, 15), ref = l.length ? Math.max(...l.map(f => Math.abs(fv(f)))) : 1;
  const pod = (f, k) => f ? `<div class="glass tilt pod${k === 1 ? " p1" : ""}" data-tk="${f.t}"><div class="pos1">${["", "I", "II", "III"][k]}</div><div class="tk tkb">${f.t}</div><div class="cnt">${esc(f.nm)}</div><div style="margin:10px 0 4px">${tp(f.tipo)}</div><div class="val">${fmt(f)}</div></div>` : "<div></div>";
  return `<p class="eyebrow">Rankings por critério</p><h2 class="ttl">${titulo}</h2><p class="lead">Não existe "melhor" absoluto: cada ranking diz exatamente qual indicador usa. Ponto de partida para estudar, não recomendação.</p>
  <div class="rkpick scrollx">${RANKS.map(r => `<button class="pill${r[0] === S.rk ? " on" : ""}" data-rk="${r[0]}">${r[1]}</button>`).join("")}</div>
  <div class="toolbar"><select class="fsel" id="rkseg"><option value="">Todos os tipos e segmentos</option><optgroup label="Tipo">${TIPOS.map(t => `<option${S.rkSeg === t ? " selected" : ""}>${t}</option>`).join("")}</optgroup><optgroup label="Segmento">${SEGS.map(s => `<option${S.rkSeg === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</optgroup></select>
    <select class="fsel" id="rkliq">${[["0", "Sem filtro de liquidez"], ["100000", "Liquidez ≥ R$ 100 mil/dia"], ["500000", "Liquidez ≥ R$ 500 mil/dia"], ["1000000", "Liquidez ≥ R$ 1 milhão/dia"]].map(([v, t]) => `<option value="${v}"${S.rkLiq === v ? " selected" : ""}>${t}</option>`).join("")}</select><span class="cnt">${int(base.length)} fundos concorrem</span></div>
  <p class="crit"><b style="color:var(--champ2)">Critério:</b> ${crit}</p>
  <div class="podium">${pod(l[1], 2)}${pod(l[0], 1)}${pod(l[2], 3)}</div>
  <div class="glass"><ul class="rlist">${l.slice(3).map((f, i) => `<li data-tk="${f.t}"><span class="n">${i + 4}</span><span><span class="tkb">${f.t}</span> <span class="cnt">${esc(f.nm)}</span> ${tp(f.tipo)}</span><b>${fmt(f)}</b><span class="bar"><i style="width:${Math.abs(fv(f)) / ref * 100}%;animation-delay:${i * 40}ms"></i></span></li>`).join("") || `<li class="empty">Nenhum outro fundo.</li>`}</ul></div>
  <p class="foot">Liquidez baixa distorce DY e P/VP — por isso o filtro padrão é R$ 500 mil/dia. Rankings recalculados a cada atualização da base.</p>` };
AFTER.melhores = () => { ligarLinhas(); document.querySelectorAll("[data-rk]").forEach(b => b.onclick = () => { S.rk = b.dataset.rk; rota() });
  document.getElementById("rkseg").onchange = e => { S.rkSeg = e.target.value; rota() }; document.getElementById("rkliq").onchange = e => { S.rkLiq = e.target.value; rota() } };

/* ============ Ficha ============ */
VIEWS.fii = () => { const f = BY[(S.arg || "").toUpperCase()]; if (!f) return `<p class="empty">FII não encontrado na base.</p>`;
  return `<button class="back" onclick="history.back()" style="margin-bottom:18px">← Voltar</button>
  <div class="fhero"><section class="glass pad"><p class="eyebrow">${esc(f.tipo)} · ${esc(f.seg)}</p><div class="ftk">${f.t}</div><div style="color:var(--ink2);margin:8px 0 18px;font-weight:300">${esc(f.nm)}</div>
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap"><span class="big num" id="fpx">${brl(f.preco)}</span><span class="${(f.var1 || 0) >= 0 ? "pos" : "neg"}">${f.var1 == null ? "" : sgn(f.var1) + pct(Math.abs(f.var1)) + " no dia"}</span></div>
      <div class="cnt" style="margin-top:6px">cotação de ${dt((f.cotEm || "").slice(0, 10))} · ${T("real")}${f.sus ? ` · <span style="color:var(--warn)">⚠ P/VP a conferir</span>` : ""}</div>
      ${faixaRend(f)}
      <div class="facts">${[["DY 12 meses", pct(f.dy12), "calc"], ["P/VP", nf(f.pvp), "calc"], ["VP por cota", brl(f.vpa), "real"], ["Patrimônio", big(f.pl), "real"], ["Liquidez/dia", big(f.liq), "calc"], ["Cotistas", int(f.cotistas), "real"],
        ["Rend. 12m/cota", brl(f.div12, 4), "calc"], ["DY mês CVM", pct(f.dyMes), "real"], ["Retorno 12m", f.ret12 == null ? "—" : `<span class="${f.ret12 >= 0 ? "pos" : "neg"}">${pct(f.ret12, 1)}</span>`, "calc"]]
        .map(([k, v, t]) => `<div class="fact"><div class="lbl">${k} ${T(t)}</div><b class="num">${v}</b></div>`).join("")}</div></section>
    <section class="glass stage" id="st-ficha" style="height:auto;min-height:470px"><div class="hud"><div><div class="lbl">Rendimentos × cotação</div><div class="cnt" style="margin-top:4px">24 meses · Yahoo Finance · ${T("real")}</div></div></div>
      ${xp()}${ctrls("ficha", [["perspectiva", "Perspectiva"], ["frente", "Frontal"], ["topo", "Topo"]], "perspectiva")}${dica("Arraste para girar · passe o mouse nas colunas")}</section></div>
  <div class="grid g2" style="margin-top:18px"><section class="glass pad"><div class="lbl" style="margin-bottom:14px">Cadastro · CVM, referência ${mes(f.ref)}</div><dl class="dl">
      <dt>Nome</dt><dd>${esc(f.nome)}</dd><dt>CNPJ</dt><dd>${esc(f.cnpj)}</dd><dt>Administrador</dt><dd>${esc(f.adm)}</dd><dt>Gestão</dt><dd>${esc(f.gestao || "—")}</dd><dt>Início</dt><dd>${dt(f.inicio)}</dd>
      <dt>Público-alvo</dt><dd>${esc((f.publico || "").toLowerCase())}</dd><dt>Cotas emitidas</dt><dd>${int(f.cotas)}</dd><dt>DY do mês (CVM)</dt><dd>${pct(f.dyMes, 3)}</dd><dt>Taxa adm. no mês</dt><dd>${pct(f.tx, 3)}</dd><dt>Segmento (CVM)</dt><dd>${esc(f.segCvm || "—")}</dd></dl></section>
    <section class="glass pad" style="display:flex;flex-direction:column;gap:14px;justify-content:space-between"><div><div class="lbl">Próximos passos</div><p class="lead" style="margin:10px 0 0;font-size:.9rem">Simule uma compra com a cotação e o DY de hoje. Para registrar uma compra de verdade, lance o aporte no Patrimônio${carteira().some(p => p.t === f.t) ? " — este fundo já está na sua carteira" : ""}.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="simf">Simular compra de ${f.t}</button><a class="btn ghost" href="${APP}" style="text-decoration:none">Ir para o Patrimônio</a></div>
      ${f.sus ? `<p class="note">⚠ P/VP de ${nf(f.pvp)} está fora da faixa usual — costuma indicar grupamento ou desdobramento ainda não refletido no VP/cota da CVM. O fundo fica fora do ranking de menor P/VP.</p>` : ""}</section></div>
  <p class="foot">Fontes: cadastro, PL, VP/cota, cotistas e DY do mês — CVM, Informe Mensal (ref. ${mes(f.ref)}). Cotação, histórico e rendimentos — Yahoo Finance. DY 12m, P/VP, liquidez e retorno são calculados pelo app.</p>` };
AFTER.fii = () => { const f = BY[(S.arg || "").toUpperCase()]; if (!f) return; const st = document.getElementById("st-ficha"); st.style.height = (MOB() ? 440 : Math.max(470, st.previousElementSibling.offsetHeight)) + "px";
  API.ficha = ficha3D(st, f); ligarCtrls("ficha");
  document.getElementById("simf").onclick = () => { S.sim = null; go("simulador", f.t) };
 };

/* faixa "Rendimentos": último pagamento, rendimento sobre a cotação e os 12 últimos pagamentos */
function faixaRend(f) { const u = f.ultDiv; if (!u) return "";
  const y = u.v / f.preco * 100, ult = (f.divs || []).slice(-12), media = ult.length ? ult.reduce((s, d) => s + d[1], 0) / ult.length : null, vsm = media ? (u.v / media - 1) * 100 : null, mx = Math.max(...ult.map(d => d[1])) || 1;
  return `<div class="yband" aria-label="Rendimentos">
    <div><div class="lbl">Último rendimento ${T("real")}</div><div class="yv num">${brl(u.v, 2)}</div><small>por cota · pago em ${dt(u.d)}</small></div>
    <div><div class="lbl">Rendimento ${T("calc")}</div><div class="yv num em">${pct(y, 2)}</div><small>sobre a cotação de ${brl(f.preco)} · ≈ ${pct(y * 12, 1)} ao ano</small></div>
    <div><div class="lbl">Últimos 12 pagamentos</div><div class="ybars" title="Rendimento por cota, do mais antigo ao mais recente">${ult.map((d, i) => `<i style="height:${Math.max(6, d[1] / mx * 100)}%;animation-delay:${i * 35}ms" title="${dt(d[0])}: ${brl(d[1], 4)}"></i>`).join("")}</div>
      <small>${vsm == null ? "" : `<span class="${vsm >= 0 ? "pos" : "neg"}">${sgn(vsm)}${pct(Math.abs(vsm), 1)}</span> vs. média de 12 meses (${brl(media, 4)})`}</small></div></div>` }

/* ============ Simulador — calculadora conectada: tudo sai de simular() (central-dados.js) ============ */
function simDefault(t) { const f = BY[t] || BY.MXRF11 || F[0]; return { t: f.t, modo: "cotas", qtd: 100, cap: Math.round(f.preco * 100), preco: f.preco, dy: f.dy12 || 10, aporte: 500, anos: 10, reinv: true, valor: 0, obj: "renda", meta: 2000 } }
/* cálculo inverso: quanto investir para receber R$ X por mês com o FII e o DY escolhidos */
function calcMeta(s) { const f = BY[s.t], rc = s.preco * s.dy / 1200; if (!(rc > 0) || !(s.meta > 0)) return null;
  const cotas = Math.ceil(s.meta / rc), inv = cotas * s.preco, rm = cotas * rc, ult = f && f.ultDiv ? f.ultDiv.v : null, cotasU = ult ? Math.ceil(s.meta / ult) : null;
  const hit = simular(s, 480).serie.find(p => p.renda >= s.meta);
  return { cotas, inv, rm, ra: rm * 12, ult, cotasU, invU: cotasU ? cotasU * s.preco : null, mes: hit ? hit.m : null } }
const prazoTxt = m => m == null ? "mais de 40 anos" : m === 0 ? "já na compra" : (m >= 12 ? Math.floor(m / 12) + (m >= 24 ? " anos" : " ano") : "") + (m % 12 ? (m >= 12 ? " e " : "") + (m % 12) + (m % 12 === 1 ? " mês" : " meses") : "");
const rng = (id, rot, v, mn, mx, st, fmt) => `<label class="full"><span class="rv"><span class="lbl">${rot}</span><b id="${id}v">${fmt(v)}</b></span><input type="range" id="${id}" min="${mn}" max="${mx}" step="${st}" value="${v}" style="--p:${(v - mn) / (mx - mn) * 100}%"></label>`;
/* controles: chave, nome, mín, máx, passo, formato · SDOCK = o mesmo controle no painel flutuante da superfície */
const SCTL = [["aporte", "Aporte mensal", 0, 5000, 50, v => brl(+v, 0)], ["anos", "Prazo", 1, 40, 1, v => +v + (+v === 1 ? " ano" : " anos")], ["dy", "DY anual usado", 0, 25, .1, v => pct(+v, 1)], ["valor", "Valorização anual da cota", -5, 10, .5, v => pct(+v, 1)]];
const SDOCK = { aporte: "dap", anos: "danos", dy: "ddy" };
const SCOR = { ini: "#D6BE8A", aport: "#7FA7D9", rend: "#46C2A6", valor: "#A895E0" };
const SFMT = { patFim: v => brl(v, 0), rendaFim: v => brl(v), rendaHoje: v => brl(v), rendaAnoFim: v => brl(v, 0), rendaAnoHoje: v => brl(v), cotFim: v => int(v), rendTot: v => brl(v, 0), mInv: v => brl(v, 0), mCot: v => int(v) };
let SR = null, SANT = null, SMEX = "", sTR = 0;
const numBR = v => { v = String(v).trim(); if (!v) return NaN; if (v.includes(",")) v = v.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ""); return +v };
const cap1 = t => t.replace(/^./, c => c.toUpperCase());

VIEWS.simulador = () => { if (!S.sim || (S.arg && S.sim.t !== S.arg.toUpperCase())) S.sim = simDefault((S.arg || "MXRF11").toUpperCase()); const s = S.sim, f = BY[s.t];
  return `<p class="eyebrow">Simulação ${T("sim")}</p><h2 class="ttl">Simulador de compra</h2><p class="lead">Calculadora conectada: mexa em qualquer variável e veja o resultado <b style="color:var(--ink)">antes → agora</b> e o futuro redesenhado na projeção. As projeções partem do DY dos últimos 12 meses e <b style="color:var(--ink)">não são garantia de retorno</b>.</p>
  <div class="lay">
    <section class="glass pad">
      <label style="display:flex;flex-direction:column;gap:6px"><span class="lbl">Fundo</span><div class="ac"><input id="sfii" class="fsel" style="width:100%;font-size:1rem;padding:11px 13px" value="${esc(s.t)}${f ? " — " + esc(f.nm) : ""}" autocomplete="off"><div class="list" id="sacl" hidden></div></div></label>
      <div class="seg" id="smodo" style="width:100%;margin:14px 0 12px">${[["cotas", "Por quantidade de cotas"], ["cap", "Por capital"]].map(([v, t]) => `<button data-v="${v}" class="${s.modo === v ? "on" : ""}" style="flex:1">${t}</button>`).join("")}</div>
      <div class="dup"><label><span class="lbl" id="lA">${s.modo === "cotas" ? "Cotas" : "Capital (R$)"}</span><input id="inA" inputmode="decimal"></label><span class="op" id="opA">${s.modo === "cotas" ? "×" : "÷"}</span><label><span class="lbl">Preço por cota (R$)</span><input id="inP" inputmode="decimal"></label></div>
      <div class="capital" id="capBox"></div>
      ${SCTL.map(([k, n, mn, mx, st, fmt]) => `<div class="ctl" id="c_${k}"><span class="nome">${n}</span><span class="val" id="v_${k}">${fmt(s[k])}</span><input type="range" id="r_${k}" min="${mn}" max="${mx}" step="${st}" value="${s[k]}" style="--p:${(s[k] - mn) / (mx - mn) * 100}%"><span class="efe" id="e_${k}"></span></div>`).join("")}
      <div class="ctl" id="c_reinv"><label class="switch" style="grid-column:1/-1"><input type="checkbox" id="r_reinv"${s.reinv ? " checked" : ""}> Reinvestir os rendimentos todo mês</label><span class="efe" id="e_reinv"></span></div>
      <div class="sub3"><span class="lbl">E se… (mostra o efeito antes de aplicar)</span><div class="ese" id="ese"></div></div>
      <p class="cnt" style="margin:14px 0 0">Valores iniciais: cotação de ${f ? dt((f.cotEm || "").slice(0, 10)) : "—"} e DY 12m de ${f ? pct(f.dy12) : "—"} ${T("real")} — ajuste à vontade.</p>
    </section>
    <section class="glass pad vivo">
      <div class="seg" id="sobj" style="width:100%;margin-bottom:14px">${[["renda", "💰 Quanto vou receber"], ["meta", "🎯 Quanto preciso investir"]].map(([v, x]) => `<button data-v="${v}" class="${s.obj === v ? "on" : ""}" style="flex:1">${x}</button>`).join("")}</div>
      <div id="pRenda"${s.obj === "meta" ? " hidden" : ""}>
        <div class="dup" style="margin-bottom:14px"><label><span class="lbl">Valor investido (R$)</span><input id="inInv" inputmode="decimal"></label><span class="op">=</span><label><span class="lbl">Cotas</span><input id="inCot" inputmode="numeric"></label></div>
        <div class="kbig">
          <div id="k_patFim" class="hero"><span class="lbl">Patrimônio ao final</span><span class="v num" id="o_patFim">—</span><span class="ant" id="a_patFim"></span></div>
          <div id="k_rendaFim"><span class="lbl">Renda mensal ao final</span><span class="v num" id="o_rendaFim">—</span><span class="ant" id="a_rendaFim"></span></div>
          <div id="k_rendaHoje"><span class="lbl">Renda mensal hoje</span><span class="v num" id="o_rendaHoje">—</span><span class="ant" id="a_rendaHoje"></span></div>
          <div id="k_rendaAnoFim"><span class="lbl">Renda anual ao final</span><span class="v num" id="o_rendaAnoFim">—</span><span class="ant" id="a_rendaAnoFim"></span></div></div>
        <div class="kmini"><div id="k_rendaAnoHoje"><span class="lbl">Renda anual hoje</span><b id="o_rendaAnoHoje">—</b><span class="ant" id="a_rendaAnoHoje"></span></div>
          <div id="k_cotFim"><span class="lbl">Cotas ao final</span><b id="o_cotFim">—</b><span class="ant" id="a_cotFim"></span></div>
          <div id="k_rendTot"><span class="lbl">Rendimentos no período</span><b id="o_rendTot">—</b><span class="ant" id="a_rendTot"></span></div></div>
        <div class="sub3"><span class="lbl">De onde vem o patrimônio final</span><div class="barra" id="bPat"></div><div class="leg" id="lPat"></div></div>
        <div class="sub3"><span class="lbl">De onde vêm as cotas</span><div class="barra" id="bCot"></div><div class="leg" id="lCot"></div></div>
      </div>
      <div id="pMeta"${s.obj === "meta" ? "" : " hidden"}>
        <span class="lbl">🎯 Rendimento mensal desejado</span><div class="metachips">${[500, 1000, 2000, 5000].map(v => `<button class="pill${s.meta === v ? " on" : ""}" data-meta="${v}">${brl(v, 0)}</button>`).join("")}<label class="mfree"><span>R$</span><input id="smeta" inputmode="decimal" value="${nf(s.meta, 0)}" aria-label="Outro valor por mês"><span>/mês</span></label></div>
        <div class="kbig" style="margin-top:14px"><div class="hero" id="k_mInv"><span class="lbl">💰 Investimento necessário</span><span class="v num" id="o_mInv">—</span><span class="ant" id="a_mInv"></span></div>
          <div id="k_mCot"><span class="lbl">Cotas necessárias</span><span class="v num" id="o_mCot">—</span><span class="ant" id="a_mCot"></span></div>
          <div id="k_mPrazo" style="grid-column:1/-1"><span class="lbl" id="l_mPrazo"></span><span class="v num" id="o_mPrazo" style="font-size:1.7rem">—</span><span class="ant" id="msub"></span></div></div>
        <p class="cnt" id="mult" style="margin:12px 0 0"></p>
        <p class="note" style="margin:10px 0 0">Estimativa baseada no DY usado — não é garantia de recebimento. Rendimentos de FII variam mês a mês.</p>
      </div>
      <details class="prem sub3"><summary>Premissas do cálculo</summary><ul id="sprem"></ul></details>
    </section></div>
  <section class="glass stage" id="st-proj" style="height:540px;margin-top:18px"><div class="hud"><div><div class="lbl"><span id="pjL">Patrimônio projetado · ao final</span> ${T("sim")}</div><div class="big num" id="pjV">R$ 0</div><div class="delta" id="pjD">&nbsp;</div></div>
      <div class="pjleg"><span><i style="background:#F2E3BD"></i>Patrimônio</span><span><i style="background:#46C2A6;opacity:.7"></i>Rendimentos reinvestidos</span><span><i class="tr" style="border-color:#7FA7D9"></i>Total aportado</span><span><i class="tr" style="border-color:rgba(255,255,255,.4)"></i>Cenário anterior</span></div></div>
    ${xp()}${ctrls("proj", [["perspectiva", "Perspectiva"], ["frente", "Frontal"], ["lado", "Lateral"], ["topo", "Topo"]], "perspectiva")}${dica("Arraste para girar · passe o mouse pelos meses · duplo clique aproxima")}</section>
  <section class="glass stage" id="st-sup" style="height:560px;margin-top:18px"><div class="hud"><div><div class="lbl">Superfície de cenários ${T("sim")}</div><div class="cnt" style="margin-top:4px;max-width:420px">Mesmo cálculo: patrimônio para cada aporte mensal (R$ 0 a R$ 3.000) × prazo (1 a 30 anos) com as suas cotas, DY, valorização e reinvestimento. A esfera branca é o seu cenário. Clique na superfície para aplicar outro.</div></div></div>
    ${xp()}
    <div class="dock${MOB() ? " min" : ""}" id="supDock"><div class="dk-h"><div class="lbl" style="color:var(--champ)">Seu cenário ${T("sim")}</div><button class="dk-tg" id="dkTg" aria-label="Recolher ou abrir os controles">${MOB() ? "▴" : "▾"}</button></div>
      ${rng("dap", "Aporte mensal", s.aporte, 0, 5000, 50, SCTL[0][5])}${rng("danos", "Prazo", s.anos, 1, 40, 1, SCTL[1][5])}${rng("ddy", "DY anual usado", s.dy, 0, 25, .1, SCTL[2][5])}
      <div class="dres"><div><span class="lbl" id="dl5">Patrimônio ao final</span><b class="num" id="d5">—</b></div><div><span class="lbl" id="dl6">Renda/mês ao final</span><b class="num" id="d6" style="color:var(--em)">—</b></div></div></div>
    ${ctrls("sup", [["perspectiva", "Perspectiva"], ["frente", "Por aporte"], ["lado", "Por prazo"], ["topo", "Mapa de calor"]], "perspectiva")}${dica("Arraste para girar · passe o mouse na superfície · clique para aplicar")}</section>
  <div class="grid g2" style="margin-top:18px"><section class="glass pad"><div class="lbl" style="margin-bottom:12px">Cenários comparados ${T("sim")}</div><div id="scen"></div></section>
    <section class="glass pad"><div class="lbl" style="margin-bottom:6px">Ano a ano ${T("sim")}</div><div style="overflow:auto;max-height:330px" id="sano"></div></section></div>
  <p class="foot">Premissas: DY constante; rendimento mensal = cotas × preço do mês × DY ÷ 12; aportes e rendimentos reinvestidos compram cotas inteiras ao preço do mês e a sobra fica em caixa para o mês seguinte; sem impostos (rendimentos de FII para pessoa física costumam ser isentos de IR, mas o ganho de capital na venda é tributado) e sem corretagem. Rendimentos de FII variam mês a mês.</p>
  <div class="barvivo" id="barvivo"></div><div class="barvivo-sp"></div>` };

/* "antes → agora" embaixo de cada número */
function simAntes(k, novo, velho) { const el = document.getElementById("a_" + k), box = document.getElementById("k_" + k); if (!el) return;
  if (velho == null || Math.abs(novo - velho) < .005) { if (velho == null) el.innerHTML = ""; return }
  const d = novo - velho, p = velho ? d / velho * 100 : null;
  el.innerHTML = `antes ${SFMT[k](velho)} → <span class="${d > 0 ? "up" : "dn"}">${d > 0 ? "▲" : "▼"} ${SFMT[k](Math.abs(d))}${p != null && isFinite(p) ? ` (${d > 0 ? "+" : "−"}${pct(Math.abs(p), 1)})` : ""}</span>`;
  if (box) { box.classList.add("flash"); clearTimeout(box._h); box._h = setTimeout(() => box.classList.remove("flash"), 900) } }
function simPoe(k) { const s = S.sim, g = id => document.getElementById(id); if (k === "reinv") { if (g("r_reinv")) g("r_reinv").checked = s.reinv; return }
  const c = SCTL.find(x => x[0] === k); if (!c) return;
  [["r_" + k, "v_" + k], SDOCK[k] ? [SDOCK[k], SDOCK[k] + "v"] : null].forEach(par => { if (!par) return; const el = g(par[0]); if (!el) return; el.value = s[k]; el.style.setProperty("--p", (s[k] - c[2]) / (c[3] - c[2]) * 100 + "%"); g(par[1]).textContent = c[5](s[k]) }) }
function simCampos() { const s = S.sim, r = simular(s), g = id => document.getElementById(id); if (!g("inA")) return; g("inA").value = s.modo === "cotas" ? nf(s.qtd, 0) : nf(s.cap, 2); g("inP").value = nf(s.preco, 2); g("inInv").value = nf(s.modo === "cap" ? s.cap : r.capIni, 2); g("inCot").value = nf(r.cotIni, 0) }
function simModo(m) { const s = S.sim; if (m === s.modo) return; const r = simular(s); if (m === "cap") s.cap = Math.round(r.capIni * 100) / 100; else s.qtd = r.cotIni; s.modo = m;
  document.querySelectorAll("#smodo button").forEach(x => x.classList.toggle("on", x.dataset.v === m)); document.getElementById("lA").textContent = m === "cotas" ? "Cotas" : "Capital (R$)"; document.getElementById("opA").textContent = m === "cotas" ? "×" : "÷" }

function simAtualizar(primeira) { const s = S.sim, g = id => document.getElementById(id), r = simular(s), M = s.obj === "meta" ? calcMeta(s) : null, f = BY[s.t];
  SANT = SR ? SR.serie : null; /* o cenário anterior vira a linha tracejada da projeção */
  const V = { patFim: r.patFim, rendaFim: r.rendaFim, rendaHoje: r.rendaHoje, rendaAnoFim: r.rendaFim * 12, rendaAnoHoje: r.rendaHoje * 12, cotFim: r.fim.cotas, rendTot: r.rendTot, mInv: M ? M.inv : null, mCot: M ? M.cotas : null };
  for (const k of Object.keys(V)) { const el = g("o_" + k); if (!el || V[k] == null) continue; contar(el, V[k], SFMT[k], primeira ? 900 : 380); if (!primeira) simAntes(k, V[k], SR ? SR[k] : null) }
  // 🎯 quanto preciso investir
  g("l_mPrazo").textContent = `Com o seu plano (capital + aportes${s.reinv ? " + reinvestimento" : ""}), chega lá em`;
  if (M) { g("o_mPrazo").textContent = prazoTxt(M.mes); g("msub").innerHTML = `para receber <b style="color:var(--ink)">${brl(s.meta, 0)}/mês</b> com ${esc(s.t)} · renda estimada ${brl(M.rm)}/mês (${brl(M.ra, 0)}/ano)`;
    g("mult").innerHTML = M.ult ? `Pelo último rendimento (${brl(M.ult, 2)}/cota em ${dt(f.ultDiv.d)}): <b style="color:var(--ink)">${int(M.cotasU)} cotas · ${brl(M.invU, 0)}</b>.` : "" }
  else if (s.obj === "meta") { ["o_mInv", "o_mCot", "o_mPrazo"].forEach(id => g(id).textContent = "—"); g("msub").textContent = "Informe um DY maior que zero e uma meta."; g("mult").textContent = "" }
  // capital inicial explícito
  g("capBox").innerHTML = s.modo === "cotas" ? `<span>Capital inicial = <b style="font-family:Inter;font-size:.8rem;color:var(--ink)">${int(r.cotIni)} × ${brl(s.preco)}</b></span><b class="num">${brl(r.capIni)}</b>`
    : `<span>${brl(s.cap)} ÷ ${brl(s.preco)} = <b style="font-family:Inter;font-size:.8rem;color:var(--ink)">${int(r.cotIni)} cotas</b>${s.cap - r.capIni >= .01 ? ` · sobra ${brl(s.cap - r.capIni)}` : ""}</span><b class="num">${brl(r.capIni)}</b>`;
  // campos espelhados (não mexe no que está sendo digitado)
  const set = (id, v) => { const e = g(id); if (e && document.activeElement !== e) e.value = v };
  set("inA", s.modo === "cotas" ? nf(s.qtd, 0) : nf(s.cap, 2)); set("inP", nf(s.preco, 2)); set("inInv", nf(s.modo === "cap" ? s.cap : r.capIni, 2)); set("inCot", nf(r.cotIni, 0));
  // composição do patrimônio e das cotas
  const tot = Math.max(1, r.patFim), partes = [["Capital inicial", r.capIni, SCOR.ini], ["Aportes mensais", r.aportado - r.capIni, SCOR.aport], ["Rendimentos reinvestidos", r.rendReinv, SCOR.rend], ["Valorização da cota", r.valoriz, SCOR.valor]];
  g("bPat").innerHTML = partes.map(([, v, c]) => `<i style="width:${Math.max(0, v) / tot * 100}%;background:${c}"></i>`).join("");
  g("lPat").innerHTML = partes.map(([n, v, c]) => `<span><i style="background:${c}"></i>${n} <b style="color:var(--ink)">${brl(v, 0)}</b></span>`).join("") + (s.reinv ? "" : `<span style="color:var(--mute)">· rendimentos recebidos em dinheiro (fora do patrimônio): <b style="color:var(--ink)">${brl(r.recebido, 0)}</b></span>`);
  const ct = Math.max(1, r.fim.cotas), cs = [["Iniciais", r.cotIni, SCOR.ini], ["Compradas com aportes", r.cotasA, SCOR.aport], ["Compradas com rendimentos", r.cotasR, SCOR.rend]];
  g("bCot").innerHTML = cs.map(([, v, c]) => `<i style="width:${v / ct * 100}%;background:${c}"></i>`).join("");
  g("lCot").innerHTML = cs.map(([n, v, c]) => `<span><i style="background:${c}"></i>${n} <b style="color:var(--ink)">${int(v)}</b></span>`).join("") + (s.reinv ? `<span style="color:var(--em)">· efeito bola de neve: ${int(r.cotasR)} cotas vieram só dos rendimentos</span>` : `<span style="color:var(--mute)">· sem reinvestir, nenhuma cota vem dos rendimentos</span>`);
  // o que cada controle está fazendo no resultado
  const sem = k => simular(Object.assign({}, s, k)), d = (a, b) => `${a >= b ? "+" : "−"}${brl(Math.abs(a - b), 0)}`;
  g("e_aporte").innerHTML = `Aportes somam <b>${brl(r.aportado - r.capIni, 0)}</b> no período → <b>${d(r.patFim, sem({ aporte: 0 }).patFim)}</b> no patrimônio final`;
  g("e_anos").innerHTML = `${s.anos * 12} meses de aportes e rendimentos · cada ano a mais: <b>${d(sem({ anos: s.anos + 1 }).patFim, r.patFim)}</b>`;
  g("e_dy").innerHTML = `Renda por cota: <b>${brl(s.preco * s.dy / 1200, 4)}/mês</b> hoje · 1 ponto de DY = <b>${d(sem({ dy: s.dy + 1 }).patFim, r.patFim)}</b> no final`;
  g("e_valor").innerHTML = `Cota vai de ${brl(s.preco)} para <b>${brl(r.fim.preco)}</b> → valorização soma <b>${brl(r.valoriz, 0)}</b>`;
  g("e_reinv").innerHTML = s.reinv ? `Reinvestindo: <b>${int(r.cotasR)}</b> cotas extras → <b>${d(r.patFim, sem({ reinv: false }).patFim)}</b> no patrimônio vs. sem reinvestir` : `Sem reinvestir: ${brl(r.recebido, 0)} recebidos em dinheiro · reinvestindo seriam <b>${d(sem({ reinv: true }).patFim, r.patFim)}</b> a mais de patrimônio`;
  document.querySelectorAll(".ctl").forEach(e => e.classList.toggle("ativo", e.id === "c_" + SMEX));
  // e se… (cards com o efeito antes de aplicar)
  const ES = [["+ R$ 500/mês de aporte", { aporte: s.aporte + 500 }], ["+ 5 anos de prazo", { anos: Math.min(40, s.anos + 5) }], ["+ 1 ponto de DY", { dy: +(s.dy + 1).toFixed(1) }], ["Cota valorizando 3%/ano", { valor: 3 }], [s.reinv ? "Sem reinvestir" : "Reinvestindo", { reinv: !s.reinv }], ["Dobrar as cotas iniciais", s.modo === "cotas" ? { qtd: s.qtd * 2 } : { cap: s.cap * 2 }]];
  const EI = ['<path d="M12 5v14M5 12h14"/>', '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', '<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>', '<path d="M3 20h18"/><path d="M6 16V11M11 16V7M16 16V4"/>',
    s.reinv ? '<path d="M4 4l16 16"/><path d="M20 12a8 8 0 0 1-12.5 6.6M4 12a8 8 0 0 1 12.5-6.6"/>' : '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>', '<rect x="4" y="9" width="9" height="9" rx="2"/><rect x="11" y="5" width="9" height="9" rx="2"/>'];
  const EO = ES.map(([n, k]) => { const o = sem(k); return { n, o, dd: o.patFim - r.patFim } }), EMX = Math.max(1, ...EO.map(e => Math.abs(e.dd)));
  g("ese").innerHTML = EO.map(({ n, o, dd }, i) => { const z = Math.abs(dd) < .5, ng = dd < 0, cl = z ? "zero" : ng ? "neg" : "pos", p = r.patFim > 0 ? dd / r.patFim * 100 : 0;
    return `<button data-ese="${i}" class="${cl}"><span class="go">Aplicar →</span><span class="hd"><span class="ico"><svg viewBox="0 0 24 24">${EI[i]}</svg></span><span class="nm">${n}</span></span>
      <span class="dl ${cl}">${z ? "= sem mudança" : `${ng ? "▼" : "▲"} ${big(Math.abs(dd))}<small>${ng ? "−" : "+"}${nf(Math.abs(p), Math.abs(p) < 10 ? 1 : 0)}%</small>`}</span>
      <span class="bar"><i style="width:${Math.abs(dd) / EMX * 100}%"></i></span><span class="rd">Renda final <b>${brl(o.rendaFim)}</b>/mês</span></button>` }).join("");
  g("ese").querySelectorAll("button").forEach(b => b.onclick = () => { const k = ES[+b.dataset.ese][1], k0 = Object.keys(k)[0]; Object.assign(s, k); SMEX = k0 === "qtd" || k0 === "cap" ? "" : k0; Object.keys(k).forEach(simPoe); simAtualizar() });
  // premissas
  g("sprem").innerHTML = [`Fundo <b>${esc(s.t)}</b>${f ? " — " + esc(f.nm) : ""}, cotação inicial <b>${brl(s.preco)}</b>; ${s.modo === "cotas" ? `<b>${int(s.qtd)}</b> cotas` : `capital de <b>${brl(s.cap)}</b>`} → capital investido <b>${brl(r.capIni)}</b>.`,
    `DY usado: <b>${pct(s.dy, 2)}</b> ao ano${f && Math.abs(s.dy - (f.dy12 || 0)) < .05 ? " (rendimentos reais dos últimos 12 meses ÷ cotação)" : " (ajustado por você)"}, constante no tempo.`,
    `Renda do mês = cotas × preço do mês × DY ÷ 12 (hoje ${brl(s.preco * s.dy / 1200, 4)} por cota).`, `Preço da cota cresce <b>${pct(s.valor, 1)}</b> ao ano (composto mês a mês).`,
    `Aporte de <b>${brl(s.aporte, 0)}</b> todo mês, por <b>${s.anos} ${s.anos === 1 ? "ano" : "anos"}</b>; compra só cotas inteiras, a sobra fica guardada para o mês seguinte.`,
    s.reinv ? "Rendimentos <b>reinvestidos</b>: compram novas cotas, que passam a render também." : "Rendimentos <b>não reinvestidos</b>: são recebidos em dinheiro e não entram no patrimônio.",
    ...(s.obj === "meta" ? ["Cotas necessárias = meta ÷ renda por cota, arredondado para cima (cotas inteiras)."] : []),
    "Sem impostos, corretagem ou vacância. Estimativa — rendimentos de FII variam mês a mês."].map(x => `<li>${x}</li>`).join("");
  // painel flutuante da superfície
  if (s.obj === "meta") { g("dl5").textContent = "Investimento necessário"; g("dl6").textContent = "Chega lá em"; if (M) { contar(g("d5"), M.inv, v => brl(v, 0), 600); g("d6").textContent = prazoTxt(M.mes) } }
  else { g("dl5").textContent = "Patrimônio ao final"; g("dl6").textContent = "Renda/mês ao final"; contar(g("d5"), r.patFim, v => brl(v, 0), 600); contar(g("d6"), r.rendaFim, v => brl(v), 600) }
  // cenários comparados e ano a ano (mesmo cálculo)
  const cen = [["Só a compra", 0, false], ["Só a compra, reinvestindo", 0, true], [`+ ${brl(s.aporte, 0)}/mês`, s.aporte, false], [`+ ${brl(s.aporte, 0)}/mês, reinvestindo`, s.aporte, true]].map(([t, a, re]) => [t, simular(Object.assign({}, s, { aporte: a, reinv: re }))]), top = Math.max(...cen.map(c => c[1].patFim)) || 1;
  g("scen").innerHTML = cen.map(([t, x]) => `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:.84rem"><span style="color:var(--ink2)">${t}</span><b style="font-weight:500">${brl(x.patFim, 0)}</b></div>
    <div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-top:8px"><i style="display:block;height:100%;width:${x.patFim / top * 100}%;background:linear-gradient(90deg,var(--champ),var(--champ2));transition:width .7s var(--ease)"></i></div><div class="cnt" style="margin-top:4px">aportado ${brl(x.aportado, 0)} · rendimentos ${brl(x.rendTot, 0)}</div></div>`).join("");
  g("sano").innerHTML = `<table class="yt"><thead><tr><th>Ano</th><th class="n">Cotas</th><th class="n">Patrimônio</th><th class="n">Aportado</th><th class="n">Renda/mês</th></tr></thead><tbody>${r.serie.filter(p => p.m && p.m % 12 === 0).map(p => `<tr><td>${p.m / 12}</td><td class="n">${int(p.cotas)}</td><td class="n">${brl(p.pat, 0)}</td><td class="n">${brl(p.aport, 0)}</td><td class="n pos">${brl(p.renda)}</td></tr>`).join("")}</tbody></table>`;
  // projeção 3D, barra fixa do celular e superfície
  if (API.proj) API.proj.set(r, SANT, s.reinv);
  g("barvivo").innerHTML = `<div><small>Patrimônio final</small><b>${brl(r.patFim, 0)}</b><span class="ant">${SR && Math.abs(r.patFim - SR.patFim) > .5 ? `<span class="${r.patFim > SR.patFim ? "up" : "dn"}">${r.patFim > SR.patFim ? "▲" : "▼"} ${brl(Math.abs(r.patFim - SR.patFim), 0)}</span>` : "&nbsp;"}</span></div><div><small>Renda/mês final</small><b>${brl(r.rendaFim)}</b><span class="ant">&nbsp;</span></div><div><small>Renda/mês hoje</small><b>${brl(r.rendaHoje)}</b><span class="ant">&nbsp;</span></div>`;
  if (API.sup) { if (!primeira) API.sup.set(Object.assign({}, s)); if (API.sup.meta) API.sup.meta(M ? M.inv : null) }
  SR = Object.assign({ serie: r.serie }, V); if (API.proj && API.proj.resumo) API.proj.resumo() }

/* projeção mês a mês: HUD mostra o final (e a diferença para o cenário anterior) ou o mês sob o mouse/dedo */
function simProj() { const g = id => document.getElementById(id), st = g("st-proj"), P = projecao3D(st); if (!P) return; API.proj = P;
  const vV = g("pjV"), vL = g("pjL"), vD = g("pjD");
  P.resumo = () => { if (!SR) return; const fim = SR.serie[SR.serie.length - 1]; vL.textContent = "Patrimônio projetado · ao final"; contar(vV, fim.pat, v => brl(v, 0), 500);
    vD.innerHTML = SANT ? (() => { const d = fim.pat - SANT[SANT.length - 1].pat; return Math.abs(d) < .5 ? `<span class="cnt">igual ao cenário anterior</span>` : `<span class="${d > 0 ? "pos" : "neg"}">${d > 0 ? "▲" : "▼"} ${brl(Math.abs(d), 0)}</span> <span class="cnt">vs. cenário anterior (${brl(SANT[SANT.length - 1].pat, 0)})</span>` })() : `<span class="cnt">${brl(fim.aport, 0)} aportados · ${brl(fim.rendTot, 0)} em rendimentos</span>` };
  P.aoHover(i => { if (i == null) return P.resumo(); const p = SR.serie[i]; vL.textContent = "Patrimônio em " + cap1(mes(mesesReais(SR.serie.length - 1)[i])); contar(vV, p.pat, v => brl(v, 0), 260);
    vD.innerHTML = `<span class="cnt">${int(p.cotas)} cotas · renda de ${brl(p.renda)}/mês</span>` });
  P.enq = () => P.persp((document.querySelector('[data-persp="proj"] button.on') || {}).dataset?.k || "perspectiva"); setTimeout(P.enq, 250);
  const c0 = P.S.cheia; P.S.cheia = on => { if (c0) c0(on); setTimeout(P.enq, 420) } }
addEventListener("resize", () => { clearTimeout(sTR); sTR = setTimeout(() => { if (API.proj && API.proj.enq) API.proj.enq() }, 300) });

AFTER.simulador = () => { const s = S.sim, g = id => document.getElementById(id); SR = null; SANT = null; SMEX = "";
  g("inA").oninput = () => { const v = numBR(g("inA").value); if (!(v >= 0)) return; if (s.modo === "cotas") s.qtd = Math.floor(v); else s.cap = v; SMEX = ""; simAtualizar() };
  g("inP").oninput = () => { const v = numBR(g("inP").value); if (!(v > 0)) return; s.preco = v; SMEX = ""; simAtualizar() };
  g("inInv").oninput = () => { const v = numBR(g("inInv").value); if (!(v >= 0)) return; simModo("cap"); s.cap = v; SMEX = ""; simAtualizar() };
  g("inCot").oninput = () => { const v = numBR(g("inCot").value); if (!(v >= 0)) return; simModo("cotas"); s.qtd = Math.floor(v); SMEX = ""; simAtualizar() };
  ["inA", "inP", "inInv", "inCot"].forEach(id => g(id).addEventListener("blur", () => setTimeout(simCampos, 0)));
  SCTL.forEach(([k]) => { [g("r_" + k), SDOCK[k] && g(SDOCK[k])].forEach(el => { if (el) el.oninput = () => { s[k] = +el.value; simPoe(k); SMEX = k; simAtualizar() } }) });
  g("r_reinv").onchange = () => { s.reinv = g("r_reinv").checked; SMEX = "reinv"; simAtualizar() };
  document.querySelectorAll("#smodo button").forEach(b => b.onclick = () => { simModo(b.dataset.v); simAtualizar() });
  document.querySelectorAll("#sobj button").forEach(b => b.onclick = () => { s.obj = b.dataset.v; document.querySelectorAll("#sobj button").forEach(x => x.classList.toggle("on", x === b)); g("pRenda").hidden = s.obj === "meta"; g("pMeta").hidden = s.obj !== "meta"; simAtualizar() });
  const poeMeta = v => { s.meta = v; document.querySelectorAll("[data-meta]").forEach(x => x.classList.toggle("on", +x.dataset.meta === v)); simAtualizar() };
  document.querySelectorAll("[data-meta]").forEach(b => b.onclick = () => { g("smeta").value = nf(+b.dataset.meta, 0); poeMeta(+b.dataset.meta) });
  g("smeta").oninput = () => { const v = numBR(g("smeta").value); if (v > 0) poeMeta(v) };
  const inp = g("sfii"), acl = g("sacl"); inp.onfocus = () => inp.select();
  inp.oninput = () => { const q = inp.value.trim().toLowerCase(), l = F.filter(f => f.t.toLowerCase().startsWith(q) || f.nm.toLowerCase().includes(q)).slice(0, 8);
    acl.innerHTML = l.map(f => `<button data-tk="${f.t}"><span><b>${f.t}</b> <span class="cnt">${esc(f.nm)}</span></span><span class="cnt">${brl(f.preco)} · DY ${pct(f.dy12, 1)}</span></button>`).join(""); acl.hidden = !l.length;
    acl.querySelectorAll("button").forEach(b => b.onmousedown = e => { e.preventDefault(); const k = { aporte: s.aporte, anos: s.anos, reinv: s.reinv, valor: s.valor, obj: s.obj, meta: s.meta }; S.sim = Object.assign(simDefault(b.dataset.tk), k); go("simulador", b.dataset.tk) }) };
  inp.onblur = () => setTimeout(() => acl.hidden = true, 150);
  g("dkTg").onclick = () => { const d = g("supDock"), m = d.classList.toggle("min"); g("dkTg").textContent = m ? "▴" : "▾" };
  simProj(); simCampos();
  API.sup = superficie3D(g("st-sup"), Object.assign({}, s), { aoEscolher: (a, y) => { s.aporte = a; s.anos = y; simPoe("aporte"); simPoe("anos"); SMEX = "aporte"; simAtualizar(); toast(`Cenário aplicado: ${brl(a, 0)}/mês por ${y} ${y === 1 ? "ano" : "anos"}`) } });
  ligarCtrls("sup"); ligarCtrls("proj"); simAtualizar(true) };

/* ============ Minha carteira ============ */
VIEWS.carteira = () => { const c = carteira(), pat = c.reduce((s, p) => s + (p.atual || 0), 0), inv = c.reduce((s, p) => s + (p.invest || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), prov = c.reduce((s, p) => s + (p.prov || 0), 0);
  return `<p class="eyebrow">Patrimônio · FIIs</p><h2 class="ttl">Minha carteira</h2><p class="lead">Os FIIs que você cadastrou no Patrimônio, com a cotação de hoje. Para comprar, vender ou lançar proventos, use o Patrimônio.</p>
  <div class="grid g4">${[["Valor atual", brl(pat), `cotação de hoje ${T("calc")}`], ["Valor investido", brl(inv), inv ? `<span class="${pat - inv >= 0 ? "pos" : "neg"}">${sgn(pat - inv)}${brl(Math.abs(pat - inv))} (${pct(Math.abs((pat / inv - 1) * 100), 1)})</span>` : "preço médio × cotas"],
    ["Rendimentos recebidos", brl(prov), `proventos lançados no app ${T("real")}`], ["Próximo pagamento (est.)", brl(c.reduce((s, p) => s + (p.rendUlt || 0), 0)), `último rendimento × cotas · média 12m ${brl(rm)}/mês ${T("calc")}`]].map(([l, v, s]) => `<div class="glass tilt kpi"><div class="lbl">${l}</div><div class="v num">${v}</div><small>${s}</small></div>`).join("")}</div>
  <div class="grid g32" style="margin-top:18px"><section class="glass"><div class="pad" style="padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="lbl">Posições</div><a class="pill" href="${APP}" style="text-decoration:none">Abrir o Patrimônio</a></div>
      ${c.length && MOB() ? `<div class="mlist" style="padding:0 14px 6px">${c.map(p => `<article class="mcard"><button class="mc-h" data-tk="${p.t}"><span class="mc-id"><span class="tkb">${p.t}</span><span class="nm">${p.f ? esc(p.f.nm) : "fora da base de FIIs"}</span></span><span class="mc-px"><b class="num">${brl(p.atual)}</b>${p.invest && p.atual ? `<span class="${p.atual - p.invest >= 0 ? "pos" : "neg"}">${pct((p.atual / p.invest - 1) * 100, 1)}</span>` : ""}</span><span class="mc-ch" aria-hidden="true">›</span></button>
        <div class="mc-g">${[["Cotas", int(p.qtd)], ["Preço médio", brl(p.pm)], ["Média 12m/mês", `<span style="color:var(--ink2)">${brl(p.rendMes)}</span>`], ["Próximo (est.)", p.f && p.f.ultDiv ? `<span class="hv pos" tabindex="0" data-hv="${esc(tipLinhas("Próximo (est.) · " + p.t, [["Rendimento por cota", brl(p.f.ultDiv.v, 2)], ["Suas cotas", int(p.qtd)], ["Último pagamento", dt(p.f.ultDiv.d)], ["Estimativa", `<span class="pos">${brl(p.rendUlt)}</span>`]]) + `<div class="r" style="margin-top:6px;color:var(--mute)">O fundo anuncia o valor real perto do pagamento.</div>`)}">${brl(p.rendUlt)}</span>` : "—"]].map(([k, v]) => `<div><span class="lbl">${k}</span><b>${v}</b></div>`).join("")}</div></article>`).join("")}</div>
        <p class="cnt" style="margin:4px 18px 14px">${T("calc")} <b>Próximo</b>: toque no valor para ver a conta</p>`
      : c.length ? `<div class="dgrid" style="border-radius:0"><table><thead><tr><th class="tk">Fundo</th><th class="n">Cotas</th><th class="n">Preço médio</th><th class="n">Valor atual</th><th class="n">Resultado</th><th class="n" title="Média dos rendimentos dos últimos 12 meses × suas cotas">Média 12m/mês</th><th class="n" title="Último rendimento pago por cota × suas cotas: o mais perto do que você deve receber no próximo pagamento">Próximo (est.)</th></tr></thead>
        <tbody>${c.map(p => `<tr data-tk="${p.t}"><td class="tk"><span class="tkb">${p.t}</span><span class="nm">${p.f ? esc(p.f.nm) : "fora da base de FIIs"}</span></td>
          <td class="n">${int(p.qtd)}</td><td class="n">${brl(p.pm)}</td><td class="n">${brl(p.atual)}</td><td class="n">${p.invest && p.atual ? `<span class="${p.atual - p.invest >= 0 ? "pos" : "neg"}">${pct((p.atual / p.invest - 1) * 100, 1)}</span>` : "—"}</td><td class="n" style="color:var(--ink2)">${brl(p.rendMes)}</td><td class="n pos">${p.f && p.f.ultDiv ? `<span class="hv" tabindex="0" data-hv="${esc(tipLinhas("Próximo (est.) · " + p.t, [["Rendimento por cota", brl(p.f.ultDiv.v, 2)], ["Suas cotas", int(p.qtd)], ["Último pagamento", dt(p.f.ultDiv.d)], ["Estimativa", `<span class="pos">${brl(p.rendUlt)}</span>`]]) + `<div class="r" style="margin-top:6px;color:var(--mute)">O fundo anuncia o valor real perto do pagamento.</div>`)}">${brl(p.rendUlt)}</span>` : "—"}</td></tr>`).join("")}</tbody></table></div>
        <p class="cnt" style="margin:10px 18px 14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${T("calc")} <b>Média 12m</b> = últimos 12 meses ÷ 12 × cotas · <b>Próximo</b>: ${TOQUE ? "toque" : "passe o mouse"} no valor para ver a conta</p>`
        : `<p class="empty">Nenhum FII no Patrimônio ainda.<br>Cadastre o fundo no Patrimônio com o ticker no nome (ex.: <b>MXRF11</b>) e ele aparece aqui.</p>`}</section>
    <section class="glass stage" id="st-anel" style="height:480px"><div class="hud"><div><div class="lbl">Composição ${T("calc")}</div><div class="cnt" style="margin-top:4px">Ângulo = valor atual · altura = renda mensal estimada</div></div></div>${c.length ? `${xp()}` : `<p class="empty" style="position:absolute;inset:40% 0 auto">Sem posições.</p>`}${dica("Arraste para girar · passe o mouse nos segmentos")}</section></div>` };
AFTER.carteira = () => { const c = carteira(); ligarLinhas();
  document.querySelectorAll(".hv[data-hv]").forEach(el => { const abre = e => { const b = el.getBoundingClientRect(); tipOn(e && e.clientX != null ? e.clientX : b.right, e && e.clientY != null ? e.clientY : b.bottom, el.dataset.hv) };
    el.onmouseenter = el.onmousemove = abre; el.onmouseleave = tipOff; el.onfocus = () => abre(); el.onblur = tipOff;
    el.onclick = e => { if (TOQUE) { e.stopPropagation(); abre(e) } } });
  if (c.length) { const seg = {}; c.forEach(p => { const k = p.t; seg[k] = seg[k] || { k: p.t + (p.f ? " · " + p.f.seg : ""), v: 0, renda: 0, c: p.f ? TCOR[p.f.tipo] : "#7C848C" }; seg[k].v += p.atual || 0; seg[k].renda += p.rendMes || 0 }); API.anel = anel3D(document.getElementById("st-anel"), Object.values(seg)) } };

/* ============ Dados ============ */
VIEWS.fontes = () => `<p class="eyebrow">Transparência</p><h2 class="ttl">De onde vêm os dados</h2><p class="lead">Nenhum número desta área é inventado. Veja de onde vem cada dado, como é atualizado e o que é cálculo ou simulação do app.</p>
  <div class="pipe">${[["Fonte", "CVM — Informe Mensal de FII (dados abertos) e Yahoo Finance (cotações e rendimentos)."], ["Atualização", "Atualizar-FIIs.js, diário após o pregão (GitHub Actions). A CVM muda 1× por mês."], ["Armazenamento", `Um arquivo, fiis.js (${Math.round(JSON.stringify(DB).length / 1024)} KB), publicado junto do app.`], ["Tratamento", "Último informe por fundo, ticker pelo ISIN, tipo pela carteira declarada, sanidade do P/VP."], ["Exibição", "Tudo é filtrado, ordenado e desenhado no seu navegador."], ["Indicadores", "DY 12m, P/VP, liquidez e retorno recalculados a cada atualização."]].map(([t, p], i) => `<div><b>${i + 1} · ${t}</b><p>${p}</p></div>`).join("")}</div>
  <div class="grid g3" style="margin-top:18px">${[["real", "Dados reais", "Copiados da fonte, sem alteração.", ["Cotação, variação e histórico", "Rendimentos pagos por cota", "Nome, CNPJ, administrador, gestão", "Patrimônio líquido, VP/cota, cotas", "Cotistas, DY do mês e taxa de adm. (CVM)"]],
    ["calc", "Calculados pelo app", "Derivados dos dados reais.", ["DY 12m = rendimentos 12m ÷ cotação", "P/VP = cotação ÷ VP/cota", "Liquidez = média de 21 pregões", "Retorno 12m = cota + rendimentos", "Tipo e segmento (carteira + nome)", "Valores da sua carteira"]],
    ["sim", "Simulações", "Cenários hipotéticos — nunca misturados aos dados reais.", ["Simulador e superfície de cenários", "Renda mensal estimada", "Índice de mercado (base R$ 100 mil)"]]].map(([k, t, s, l]) => `<section class="glass pad"><div style="margin-bottom:10px">${T(k)}</div><div class="disp" style="font-size:1.5rem">${t}</div><p class="cnt">${s}</p><ul style="margin:10px 0 0;padding-left:18px;color:var(--ink2);font-size:.84rem;line-height:1.8">${l.map(x => `<li>${x}</li>`).join("")}</ul></section>`).join("")}</div>
  <section class="glass pad" style="margin-top:18px"><div class="lbl" style="margin-bottom:12px">Situação desta base</div><dl class="dl"><dt>Gerada em</dt><dd>${DB.gerado ? new Date(DB.gerado).toLocaleString("pt-BR") : "—"}</dd><dt>Informe CVM mais recente</dt><dd>${mes(DB.refCvm)}</dd>
    <dt>Fundos com cotação</dt><dd>${int(DB.total)}</dd><dt>Sem negociação no Yahoo</dt><dd>${int(DB.semCotacao)} (ficam de fora)</dd><dt>P/VP a conferir</dt><dd>${F.filter(f => f.sus).length} fundos</dd></dl>
    <p class="foot">Limites: vacância e lista de imóveis/CRIs vêm do Informe Trimestral da CVM — próxima etapa. O informe mensal sai até ~15 dias após o mês; PL e VP podem estar 1 a 2 meses atrás da cotação.</p></section>`;

/* ============ rotas com transição cinematográfica ============ */
addEventListener("keydown", e => { if (e.key === "Escape") sairCheia() });
function rota() { const [v, arg] = (location.hash.slice(1) || "painel").split("/"); const run = () => { limpar3D(); document.body.classList.remove("noscroll"); for (const k in API) delete API[k]; S.view = v; S.arg = arg ? decodeURIComponent(arg) : null;
    const ab = v === "fii" ? "explorar" : v; document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === ab)); moverTinta();
    document.getElementById("main").innerHTML = `<div class="view">${(VIEWS[v] || VIEWS.painel)()}</div>`; window.scrollTo({ top: 0, behavior: "instant" }); (AFTER[v] || (() => { }))(); ligarCheia() };
  if (document.startViewTransition && !RM) { const t = document.startViewTransition(run); t.ready.catch(() => { }); t.finished.catch(() => { }).then(() => document.querySelectorAll("[style*='view-transition-name']").forEach(e => { if (!e.classList.contains("ftk")) e.style.viewTransitionName = "" })) } else run() }
function moverTinta() { const b = document.querySelector("#tabs button.on"), ink = document.getElementById("ink"), nav = document.getElementById("tabs"); if (!b) { ink.style.width = 0; return } ink.style.left = b.offsetLeft + "px"; ink.style.width = b.offsetWidth + "px";
  if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2, behavior: RM ? "auto" : "smooth" }) }
MQ.addEventListener("change", () => { if (!document.querySelector(".stage.full")) rota() });
addEventListener("hashchange", rota); addEventListener("resize", moverTinta);
document.getElementById("tabs").onclick = e => { const b = e.target.closest("button[data-v]"); if (b) go(b.dataset.v) };
document.getElementById("voltar").onclick = () => { location.href = APP };
document.getElementById("fresh").innerHTML = DB.gerado ? `<span class="chip"><i></i>Cotações ${new Date(DB.gerado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span><span class="chip"><i></i>CVM ${mes(DB.refCvm)}</span>` : `<span class="chip" style="color:var(--rose)">Base não carregada</span>`;
(function fita() { const l = F.slice(0, 26).map(f => `<span><b>${f.t}</b>${brl(f.preco)} <span class="${(f.var1 || 0) >= 0 ? "pos" : "neg"}">${f.var1 == null ? "" : sgn(f.var1) + pct(Math.abs(f.var1))}</span></span>`).join("");
  document.getElementById("tape").innerHTML = `<div class="run">${l}${l}</div>` })();
rota();
