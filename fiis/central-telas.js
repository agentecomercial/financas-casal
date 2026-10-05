/* Central de FIIs — telas, rotas e microinterações */
"use strict";
const S = { view: "painel", q: "", tipos: [], seg: "", dyMin: "", dyMax: "", pvpMax: "", liqMin: "0", cotMin: "", sort: "liq", desc: true, lim: 50,
  rk: "dy", rkSeg: "", rkLiq: "500000", sim: null, per: 12, fonte: null, zk: "liq", mapaTipos: TIPOS.slice(), mapaTodos: false };
const API = {};
const go = (v, arg) => { location.hash = arg ? v + "/" + arg : v };
const ctrls = (id, persp, ini) => `<div class="ctrl"><div class="seg" data-persp="${id}">${persp.map(([k, t]) => `<button data-k="${k}" class="${k === ini ? "on" : ""}">${t}</button>`).join("")}</div>
  <button class="ic" data-zoom="${id}" data-f=".78" title="Aproximar" aria-label="Aproximar">+</button><button class="ic" data-zoom="${id}" data-f="1.28" title="Afastar" aria-label="Afastar">−</button>
  ${TOQUE ? `<button class="ic" data-giro="${id}" title="Girar com o dedo" aria-label="Girar com o dedo">⟲</button>` : ""}</div>`;
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
  const pat = c.reduce((s, p) => s + (p.atual || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), liq = F.filter(f => (f.liq || 0) >= 500000);
  const kp = temC ? [["Patrimônio em FIIs", pat, brl, `${c.length} ${c.length === 1 ? "posição" : "posições"} · ${T("calc")}`], ["Renda mensal estimada", rm, brl, `média 12 meses ${T("calc")}`], ["Fundos na carteira", c.length, int, `de ${int(F.length)} na base ${T("real")}`], ["Dividend Yield da carteira", pat ? rm * 12 / pat * 100 : 0, v => pct(v), `rendimentos 12m ÷ valor ${T("calc")}`]]
    : [["FIIs na base", F.length, int, `negociados em bolsa ${T("real")}`], ["DY 12m mediano", med(liq.map(f => f.dy12)), v => pct(v), `fundos líquidos ${T("calc")}`], ["P/VP mediano", med(liq.filter(f => !f.sus).map(f => f.pvp)), v => nf(v), `fundos líquidos ${T("calc")}`], ["Liquidez somada/dia", F.reduce((s, f) => s + (f.liq || 0), 0), big, `21 pregões ${T("calc")}`]];
  return `<p class="eyebrow">Patrimônio · Fundos imobiliários</p><h2 class="ttl">Visão geral</h2><p class="lead">Sua posição em FIIs e o mercado em profundidade. Gire os gráficos, troque o período e aproxime para explorar.</p>
  <section class="glass stage" id="st-hero" style="height:500px"><div class="hud"><div><div class="lbl" id="heroL">${S.fonte === "cart" ? "Patrimônio em FIIs" : "Índice de mercado · 30 FIIs mais líquidos · base R$ 100 mil"}</div>
      <div class="big num" id="heroV">R$ 0</div><div class="delta" id="heroD">&nbsp;</div></div>
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><div class="seg" id="per">${[[6, "6M"], [12, "12M"], [24, "24M"]].map(([v, t]) => `<button data-v="${v}" class="${S.per === v ? "on" : ""}">${t}</button>`).join("")}</div>
      ${temC ? `<div class="seg" id="fonte"><button data-v="cart" class="${S.fonte === "cart" ? "on" : ""}">Minha carteira</button><button data-v="merc" class="${S.fonte === "merc" ? "on" : ""}">Mercado</button></div>` : ""}
      <span class="cnt" id="heroS">${S.fonte === "cart" ? T("calc", "cotas × fechamento do mês") : T("sim", "simulação sobre dados reais")}</span></div></div>
    ${ctrls("hero", [["perspectiva", "Perspectiva"], ["frente", "Frontal"], ["lado", "Lateral"], ["topo", "Topo"]], "perspectiva")}${dica()}</section>
  <div class="grid g4" style="margin-top:18px">${kp.map(([l, v, f, s], i) => `<div class="glass tilt kpi"><div class="lbl">${l}</div><div class="v num" data-k="${i}">${f(0)}</div><small>${s}</small></div>`).join("")}</div>
  <section style="margin-top:34px"><p class="eyebrow">Mercado</p><h2 class="ttl" style="font-size:2rem">Mapa tridimensional</h2>
    <p class="lead">Cada esfera é um FII: <b>P/VP</b> na largura, <b>DY 12 meses</b> na altura e a terceira dimensão à sua escolha. Tamanho = patrimônio. O plano verde marca P/VP = 1. Clique numa esfera para voar até ela e abrir a ficha.</p>
    <div class="toolbar"><div class="seg" id="zk">${Object.entries(EIXOZ).map(([k, v]) => `<button data-v="${k}" class="${S.zk === k ? "on" : ""}">${v[0]}</button>`).join("")}</div>
      ${TIPOS.map(t => `<button class="pill${S.mapaTipos.includes(t) ? " on" : ""}" data-mt="${t}">${tp(t)}</button>`).join("")}
      <label class="switch" style="margin-left:auto"><input type="checkbox" id="mtodos"${S.mapaTodos ? " checked" : ""}> Incluir fundos de baixa liquidez</label></div>
    <div class="glass stage" id="st-mapa" style="height:600px">${ctrls("mapa", [["perspectiva", "Perspectiva"], ["frente", "P/VP × DY"], ["lado", "DY × " + EIXOZ[S.zk][0]], ["topo", "Topo"]], "perspectiva")}${dica()}</div>
    <p class="foot">${T("real")} cotação, patrimônio e cotistas · ${T("calc")} DY 12m, P/VP, liquidez e retorno. Valores fora das faixas do mapa ficam encostados nas bordas.</p></section>
  <section class="grid g3" style="margin-top:26px">${mini("Maior liquidez", F.slice().sort((a, b) => (b.liq || 0) - (a.liq || 0)).slice(0, 5), f => big(f.liq) + "/dia")}${mini("Mais cotistas", F.slice().sort((a, b) => (b.cotistas || 0) - (a.cotistas || 0)).slice(0, 5), f => int(f.cotistas))}${mini("Maior patrimônio", F.slice().sort((a, b) => (b.pl || 0) - (a.pl || 0)).slice(0, 5), f => big(f.pl))}</section>` };
const mini = (t, l, fv) => `<div class="glass tilt"><div class="pad" style="padding-bottom:6px"><div class="lbl">${t}</div></div><ul class="rlist">${l.map((f, i) => `<li data-tk="${f.t}"><span class="n">${i + 1}</span><span><span class="tkb">${f.t}</span><span class="nm">${esc(f.nm)}</span></span><b>${fv(f)}</b></li>`).join("")}</ul></div>`;
AFTER.painel = () => { const c = carteira();
  const serie = () => S.fonte === "cart" ? historico(c, S.per) : indiceMercado(S.per);
  const heroV = document.getElementById("heroV"), heroD = document.getElementById("heroD"); let sr = serie();
  const resumo = () => { const a = sr.find(x => x.pat > 0) || sr[0], b = sr[sr.length - 1]; /* a carteira pode ter começado no meio do período */ if (!b) return; contar(heroV, b.pat, v => brl(v, 0)); const d = b.pat - a.pat, r = sr.reduce((s, x) => s + x.rend, 0);
    heroD.innerHTML = `<span class="${d >= 0 ? "pos" : "neg"}">${sgn(d)} ${brl(Math.abs(d), 0)} no período (${sgn(d)}${pct(Math.abs(a.pat ? d / a.pat * 100 : 0), 1)})</span> <span class="cnt">· ${brl(r, 0)} em rendimentos</span>` };
  API.hero = hero3D(document.getElementById("st-hero"), sr, { aoPonto: i => { if (i == null) return resumo(); const p = sr[i], a = sr[i - 1]; contar(heroV, p.pat, v => brl(v, 0), 450);
    heroD.innerHTML = `<span class="cnt">em ${mes(p.m)}</span> ${a ? `<span class="${p.pat >= a.pat ? "pos" : "neg"}">${sgn(p.pat - a.pat)} ${brl(Math.abs(p.pat - a.pat), 0)} no mês</span>` : ""} <span class="cnt">· ${brl(p.rend, 2)} de rendimentos</span>` } });
  resumo(); ligarCtrls("hero");
  document.querySelectorAll("#per button").forEach(b => b.onclick = () => { S.per = +b.dataset.v; document.querySelectorAll("#per button").forEach(x => x.classList.toggle("on", x === b)); sr = serie(); API.hero && API.hero.set(sr); resumo() });
  document.querySelectorAll("#fonte button").forEach(b => b.onclick = () => { S.fonte = b.dataset.v; document.querySelectorAll("#fonte button").forEach(x => x.classList.toggle("on", x === b));
    document.getElementById("heroL").textContent = S.fonte === "cart" ? "Patrimônio em FIIs" : "Índice de mercado · 30 FIIs mais líquidos · base R$ 100 mil";
    document.getElementById("heroS").innerHTML = S.fonte === "cart" ? T("calc", "cotas × fechamento do mês") : T("sim", "simulação sobre dados reais"); heroV.dataset.v = 0; sr = serie(); API.hero && API.hero.set(sr); resumo() });
  const kpv = [...document.querySelectorAll(".kpi .v")], pat = c.reduce((s, p) => s + (p.atual || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), liq = F.filter(f => (f.liq || 0) >= 500000);
  const vals = c.length ? [[pat, brl], [rm, brl], [c.length, int], [pat ? rm * 12 / pat * 100 : 0, v => pct(v)]] : [[F.length, int], [med(liq.map(f => f.dy12)), v => pct(v)], [med(liq.filter(f => !f.sus).map(f => f.pvp)), v => nf(v)], [F.reduce((s, f) => s + (f.liq || 0), 0), big]];
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
  <div class="toolbar">${TIPOS.map(t => `<button class="pill${S.tipos.includes(t) ? " on" : ""}" data-tipo="${t}">${tp(t)}</button>`).join("")}</div>
  <div class="filters"><label><span class="lbl">Segmento</span><select id="fseg"><option value="">Todos</option>${SEGS.map(s => `<option${S.seg === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
    <label><span class="lbl">DY 12m mín. %</span><input id="fdymin" inputmode="decimal" value="${esc(S.dyMin)}" placeholder="8"></label><label><span class="lbl">DY 12m máx. %</span><input id="fdymax" inputmode="decimal" value="${esc(S.dyMax)}" placeholder="16"></label>
    <label><span class="lbl">P/VP máximo</span><input id="fpvp" inputmode="decimal" value="${esc(S.pvpMax)}" placeholder="1,00"></label>
    <label><span class="lbl">Liquidez mín./dia</span><select id="fliq">${[["0", "Qualquer"], ["100000", "R$ 100 mil"], ["500000", "R$ 500 mil"], ["1000000", "R$ 1 milhão"], ["5000000", "R$ 5 milhões"]].map(([v, t]) => `<option value="${v}"${S.liqMin === v ? " selected" : ""}>${t}</option>`).join("")}</select></label>
    <label><span class="lbl">Cotistas mín.</span><input id="fcot" inputmode="numeric" value="${esc(S.cotMin)}" placeholder="10000"></label></div>
  <div id="tbl"></div>`;
function tabela() { const l = filtrados(), vis = l.slice(0, S.lim), c0 = COLS.find(c => c[0] === S.sort);
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
  <div class="rkpick">${RANKS.map(r => `<button class="pill${r[0] === S.rk ? " on" : ""}" data-rk="${r[0]}">${r[1]}</button>`).join("")}</div>
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
      ${ctrls("ficha", [["perspectiva", "Perspectiva"], ["frente", "Frontal"], ["topo", "Topo"]], "perspectiva")}${dica("Arraste para girar · passe o mouse nas colunas")}</section></div>
  <div class="grid g2" style="margin-top:18px"><section class="glass pad"><div class="lbl" style="margin-bottom:14px">Cadastro · CVM, referência ${mes(f.ref)}</div><dl class="dl">
      <dt>Nome</dt><dd>${esc(f.nome)}</dd><dt>CNPJ</dt><dd>${esc(f.cnpj)}</dd><dt>Administrador</dt><dd>${esc(f.adm)}</dd><dt>Gestão</dt><dd>${esc(f.gestao || "—")}</dd><dt>Início</dt><dd>${dt(f.inicio)}</dd>
      <dt>Público-alvo</dt><dd>${esc((f.publico || "").toLowerCase())}</dd><dt>Cotas emitidas</dt><dd>${int(f.cotas)}</dd><dt>DY do mês (CVM)</dt><dd>${pct(f.dyMes, 3)}</dd><dt>Taxa adm. no mês</dt><dd>${pct(f.tx, 3)}</dd><dt>Segmento (CVM)</dt><dd>${esc(f.segCvm || "—")}</dd></dl></section>
    <section class="glass pad" style="display:flex;flex-direction:column;gap:14px;justify-content:space-between"><div><div class="lbl">Próximos passos</div><p class="lead" style="margin:10px 0 0;font-size:.9rem">Simule uma compra com a cotação e o DY de hoje. Para registrar uma compra de verdade, lance o aporte no Patrimônio${carteira().some(p => p.t === f.t) ? " — este fundo já está na sua carteira" : ""}.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="simf">Simular compra de ${f.t}</button><a class="btn ghost" href="${APP}" style="text-decoration:none">Ir para o Patrimônio</a></div>
      ${f.sus ? `<p class="note">⚠ P/VP de ${nf(f.pvp)} está fora da faixa usual — costuma indicar grupamento ou desdobramento ainda não refletido no VP/cota da CVM. O fundo fica fora do ranking de menor P/VP.</p>` : ""}</section></div>
  <p class="foot">Fontes: cadastro, PL, VP/cota, cotistas e DY do mês — CVM, Informe Mensal (ref. ${mes(f.ref)}). Cotação, histórico e rendimentos — Yahoo Finance. DY 12m, P/VP, liquidez e retorno são calculados pelo app.</p>` };
AFTER.fii = () => { const f = BY[(S.arg || "").toUpperCase()]; if (!f) return; const st = document.getElementById("st-ficha"); st.style.height = Math.max(470, st.previousElementSibling.offsetHeight) + "px";
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

/* ============ Simulador ============ */
function simDefault(t) { const f = BY[t] || BY.MXRF11 || F[0]; return { t: f.t, modo: "cotas", qtd: 100, cap: Math.round(f.preco * 100), preco: f.preco, dy: f.dy12 || 10, aporte: 500, anos: 10, reinv: true, valor: 0 } }
const rng = (id, rot, v, mn, mx, st, fmt) => `<label class="full"><span class="rv"><span class="lbl">${rot}</span><b id="${id}v">${fmt(v)}</b></span><input type="range" id="${id}" min="${mn}" max="${mx}" step="${st}" value="${v}" style="--p:${(v - mn) / (mx - mn) * 100}%"></label>`;
VIEWS.simulador = () => { if (!S.sim || (S.arg && S.sim.t !== S.arg.toUpperCase())) S.sim = simDefault((S.arg || "MXRF11").toUpperCase()); const s = S.sim, f = BY[s.t];
  return `<p class="eyebrow">Simulação ${T("sim")}</p><h2 class="ttl">Simulador de compra</h2><p class="lead">Monte a compra e explore os cenários. As projeções partem do DY dos últimos 12 meses e <b style="color:var(--ink)">não são garantia de retorno</b>.</p>
  <div class="grid g32"><section class="glass pad"><div class="form">
      <label class="full"><span class="lbl">Fundo</span><div class="ac"><input id="sfii" value="${esc(s.t)}${f ? " — " + esc(f.nm) : ""}" autocomplete="off"><div class="list" id="sacl" hidden></div></div></label>
      <div class="full"><div class="seg" id="smodo" style="width:100%">${[["cotas", "Por quantidade de cotas"], ["cap", "Por capital"]].map(([v, t]) => `<button data-v="${v}" class="${s.modo === v ? "on" : ""}" style="flex:1">${t}</button>`).join("")}</div></div>
      ${s.modo === "cotas" ? `<label><span class="lbl">Cotas</span><input id="sqtd" inputmode="numeric" value="${s.qtd}"></label>` : `<label><span class="lbl">Capital (R$)</span><input id="scap" inputmode="decimal" value="${nf(s.cap, 2)}"></label>`}
      <label><span class="lbl">Preço por cota (R$)</span><input id="sprec" inputmode="decimal" value="${nf(s.preco, 2)}"></label>
      ${rng("sap", "Aporte mensal", s.aporte, 0, 5000, 50, v => brl(+v, 0))}${rng("sanos", "Prazo", s.anos, 1, 40, 1, v => v + (v == 1 ? " ano" : " anos"))}
      ${rng("sdy", "DY anual usado", s.dy, 0, 25, .1, v => pct(+v, 1))}${rng("sval", "Valorização anual da cota", s.valor, -5, 10, .5, v => pct(+v, 1))}
      <label class="full switch"><input type="checkbox" id="sreinv"${s.reinv ? " checked" : ""}> Reinvestir os rendimentos todo mês</label></div>
      <p class="cnt" style="margin:14px 0 0">Valores iniciais: cotação de ${f ? dt((f.cotEm || "").slice(0, 10)) : "—"} e DY 12m de ${f ? pct(f.dy12) : "—"} ${T("real")} — ajuste à vontade.</p></section>
    <section class="glass pad" style="display:flex;flex-direction:column;gap:14px"><div class="lbl">Resultado</div><div class="res">
      <div><span class="lbl">Valor investido</span><b class="num" id="r1">—</b></div><div><span class="lbl">Cotas</span><b class="num" id="r2">—</b></div>
      <div><span class="lbl">Renda mensal hoje</span><b class="num pos" id="r3">—</b></div><div><span class="lbl">Renda anual hoje</span><b class="num pos" id="r4">—</b></div>
      <div class="hl"><span class="lbl">Patrimônio ao final</span><b class="num" id="r5">—</b></div><div class="hl"><span class="lbl">Renda mensal ao final</span><b class="num" id="r6">—</b></div></div>
      <p class="note" id="rnota"></p></section></div>
  <section class="glass stage" id="st-sup" style="height:560px;margin-top:18px"><div class="hud"><div><div class="lbl">Superfície de cenários ${T("sim")}</div><div class="cnt" style="margin-top:4px;max-width:420px">Patrimônio projetado para cada combinação de aporte mensal (R$ 0 a R$ 3.000) e prazo (1 a 30 anos). A esfera branca é o seu cenário. Clique na superfície para aplicar outro.</div></div></div>
    <button class="ic xp" id="supFull" title="Abrir em tela cheia (Esc para sair)" aria-label="Abrir em tela cheia">⛶</button>
    <div class="dock" id="supDock"><div class="lbl" style="color:var(--champ)">Seu cenário ${T("sim")}</div>
      ${rng("dap", "Aporte mensal", s.aporte, 0, 5000, 50, v => brl(+v, 0))}${rng("danos", "Prazo", s.anos, 1, 40, 1, v => v + (v == 1 ? " ano" : " anos"))}${rng("ddy", "DY anual usado", s.dy, 0, 25, .1, v => pct(+v, 1))}
      <div class="dres"><div><span class="lbl">Patrimônio ao final</span><b class="num" id="d5">—</b></div><div><span class="lbl">Renda/mês ao final</span><b class="num" id="d6" style="color:var(--em)">—</b></div></div></div>
    ${ctrls("sup", [["perspectiva", "Perspectiva"], ["frente", "Por aporte"], ["lado", "Por prazo"], ["topo", "Mapa de calor"]], "perspectiva")}${dica("Arraste para girar · passe o mouse na superfície · clique para aplicar")}</section>
  <div class="grid g2" style="margin-top:18px"><section class="glass pad"><div class="lbl" style="margin-bottom:12px">Cenários comparados ${T("sim")}</div><div id="scen"></div></section>
    <section class="glass pad"><div class="lbl" style="margin-bottom:6px">Ano a ano ${T("sim")}</div><div style="overflow:auto;max-height:330px" id="sano"></div></section></div>
  <p class="foot">Premissas: DY constante; rendimento mensal = valor das cotas × DY ÷ 12; reinvestimento compra cotas inteiras ao preço do mês; sobras ficam em caixa; sem impostos (rendimentos de FII para pessoa física costumam ser isentos de IR, mas o ganho de capital na venda é tributado) e sem corretagem. Rendimentos de FII variam mês a mês.</p>` };
function simRender(mexeuSup) { const s = S.sim, p = projetar(s), inv = p.ini.inv, rm = inv * s.dy / 1200;
  contar(document.getElementById("r1"), inv, v => brl(v), 600); contar(document.getElementById("r2"), p.ini.cotas, int, 600); contar(document.getElementById("r3"), rm, v => brl(v), 600);
  contar(document.getElementById("r4"), rm * 12, v => brl(v), 600); contar(document.getElementById("r5"), p.fim[1], v => brl(v, 0), 800); contar(document.getElementById("r6"), p.rendMesFim, v => brl(v), 800);
  contar(document.getElementById("d5"), p.fim[1], v => brl(v, 0), 600); contar(document.getElementById("d6"), p.rendMesFim, v => brl(v), 600);
  document.getElementById("rnota").innerHTML = `Em <b>${s.anos} ${s.anos === 1 ? "ano" : "anos"}</b>, com <b>${brl(s.aporte, 0)}/mês</b>${s.reinv ? " e reinvestindo" : " sem reinvestir"}: ${brl(p.fim[2], 0)} aportados e ${brl(p.fim[3], 0)} em rendimentos acumulados. Simulação — não é promessa de retorno.`;
  const cen = [["Só a compra", 0, false], ["Só a compra, reinvestindo", 0, true], [`+ ${brl(s.aporte, 0)}/mês`, s.aporte, false], [`+ ${brl(s.aporte, 0)}/mês, reinvestindo`, s.aporte, true]].map(([t, a, r]) => [t, projetar(Object.assign({}, s, { aporte: a, reinv: r })).fim]), top = Math.max(...cen.map(c => c[1][1])) || 1;
  document.getElementById("scen").innerHTML = cen.map(([t, fim]) => `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:.84rem"><span style="color:var(--ink2)">${t}</span><b style="font-weight:500">${brl(fim[1], 0)}</b></div>
    <div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-top:8px"><i style="display:block;height:100%;width:${fim[1] / top * 100}%;background:linear-gradient(90deg,var(--champ),var(--champ2));transition:width .7s var(--ease)"></i></div><div class="cnt" style="margin-top:4px">aportado ${brl(fim[2], 0)} · rendimentos ${brl(fim[3], 0)}</div></div>`).join("");
  document.getElementById("sano").innerHTML = `<table class="yt"><thead><tr><th>Ano</th><th class="n">Cotas</th><th class="n">Patrimônio</th><th class="n">Aportado</th><th class="n">Renda/mês</th></tr></thead><tbody>${p.anual.map(a => `<tr><td>${a.ano}</td><td class="n">${int(a.cotas)}</td><td class="n">${brl(a.pat, 0)}</td><td class="n">${brl(a.aportado, 0)}</td><td class="n pos">${brl(a.rendMes)}</td></tr>`).join("")}</tbody></table>`;
  if (mexeuSup && API.sup) API.sup.set(s) }
AFTER.simulador = () => { const s = S.sim, n = v => +String(v).replace(/\./g, "").replace(",", "."), g = id => document.getElementById(id);
  /* controles do formulário e do painel flutuante (tela cheia) andam juntos */
  const PAR = { sap: "dap", sanos: "danos", sdy: "ddy", dap: "sap", danos: "sanos", ddy: "sdy" };
  const poe = (id, v, fmt) => { const el = g(id); if (!el) return; el.value = v; el.style.setProperty("--p", (v - el.min) / (el.max - el.min) * 100 + "%"); g(id + "v").textContent = fmt(+v) };
  const sl = (id, k, fmt) => { const el = g(id); if (!el) return; el.oninput = () => { s[k] = +el.value; poe(id, el.value, fmt); if (PAR[id]) poe(PAR[id], el.value, fmt); simRender(true) } };
  const fA = v => brl(v, 0), fY = v => v + (v === 1 ? " ano" : " anos"), fD = v => pct(v, 1);
  sl("sap", "aporte", fA); sl("sanos", "anos", fY); sl("sdy", "dy", fD); sl("sval", "valor", fD); sl("dap", "aporte", fA); sl("danos", "anos", fY); sl("ddy", "dy", fD);
  const st = g("st-sup"), bt = g("supFull");
  const cheia = on => { const run = () => { st.classList.toggle("full", on); document.body.classList.toggle("noscroll", on); bt.textContent = on ? "✕" : "⛶"; bt.title = on ? "Sair da tela cheia (Esc)" : "Abrir em tela cheia (Esc para sair)"; bt.setAttribute("aria-label", bt.title) };
    if (document.startViewTransition && !RM) { document.documentElement.classList.add("vt-sup"); st.style.viewTransitionName = "sup"; const tr = document.startViewTransition(run); tr.ready.catch(() => { });
      tr.finished.catch(() => { }).then(() => { st.style.viewTransitionName = ""; document.documentElement.classList.remove("vt-sup") }) } else run() };
  bt.onclick = () => cheia(!st.classList.contains("full"));
  sairCheia = () => { if (st.classList.contains("full")) { cheia(false); return true } return false };
  const tx = () => { if (g("sqtd")) s.qtd = Math.max(1, Math.floor(n(g("sqtd").value)) || 1); if (g("scap")) s.cap = n(g("scap").value) || 0; s.preco = n(g("sprec").value) || s.preco; s.reinv = g("sreinv").checked; simRender(true) };
  ["sqtd", "scap", "sprec", "sreinv"].forEach(id => { const el = g(id); if (el) el.oninput = el.onchange = tx });
  document.querySelectorAll("#smodo button").forEach(b => b.onclick = () => { s.modo = b.dataset.v; if (s.modo === "cap") s.cap = Math.round(s.qtd * s.preco); rota() });
  const inp = g("sfii"), acl = g("sacl"); inp.onfocus = () => inp.select();
  inp.oninput = () => { const q = inp.value.trim().toLowerCase(), l = F.filter(f => f.t.toLowerCase().startsWith(q) || f.nm.toLowerCase().includes(q)).slice(0, 8);
    acl.innerHTML = l.map(f => `<button data-tk="${f.t}"><span><b>${f.t}</b> <span class="cnt">${esc(f.nm)}</span></span><span class="cnt">${brl(f.preco)} · DY ${pct(f.dy12, 1)}</span></button>`).join(""); acl.hidden = !l.length;
    acl.querySelectorAll("button").forEach(b => b.onmousedown = e => { e.preventDefault(); const k = { aporte: s.aporte, anos: s.anos, reinv: s.reinv, valor: s.valor }; S.sim = Object.assign(simDefault(b.dataset.tk), k); go("simulador", b.dataset.tk) }) };
  inp.onblur = () => setTimeout(() => acl.hidden = true, 150);
  API.sup = superficie3D(g("st-sup"), s, { aoEscolher: (a, y) => { s.aporte = a; s.anos = y; [["sap", a, fA], ["dap", a, fA], ["sanos", y, fY], ["danos", y, fY]].forEach(([id, v, fmt]) => poe(id, v, fmt)); simRender(true); toast(`Cenário aplicado: ${brl(a, 0)}/mês por ${y} ${y === 1 ? "ano" : "anos"}`) } });
  ligarCtrls("sup"); simRender(false) };

/* ============ Minha carteira ============ */
VIEWS.carteira = () => { const c = carteira(), pat = c.reduce((s, p) => s + (p.atual || 0), 0), inv = c.reduce((s, p) => s + (p.invest || 0), 0), rm = c.reduce((s, p) => s + (p.rendMes || 0), 0), prov = c.reduce((s, p) => s + (p.prov || 0), 0);
  return `<p class="eyebrow">Patrimônio · FIIs</p><h2 class="ttl">Minha carteira</h2><p class="lead">Os FIIs que você cadastrou no Patrimônio, com a cotação de hoje. Para comprar, vender ou lançar proventos, use o Patrimônio.</p>
  <div class="grid g4">${[["Valor atual", brl(pat), `cotação de hoje ${T("calc")}`], ["Valor investido", brl(inv), inv ? `<span class="${pat - inv >= 0 ? "pos" : "neg"}">${sgn(pat - inv)}${brl(Math.abs(pat - inv))} (${pct(Math.abs((pat / inv - 1) * 100), 1)})</span>` : "preço médio × cotas"],
    ["Rendimentos recebidos", brl(prov), `proventos lançados no app ${T("real")}`], ["Renda mensal projetada", brl(rm), `DY da carteira ${pct(pat ? rm * 12 / pat * 100 : null)} ${T("calc")}`]].map(([l, v, s]) => `<div class="glass tilt kpi"><div class="lbl">${l}</div><div class="v num">${v}</div><small>${s}</small></div>`).join("")}</div>
  <div class="grid g32" style="margin-top:18px"><section class="glass"><div class="pad" style="padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="lbl">Posições</div><a class="pill" href="${APP}" style="text-decoration:none">Abrir o Patrimônio</a></div>
      ${c.length ? `<div class="dgrid" style="border-radius:0"><table><thead><tr><th class="tk">Fundo</th><th class="n">Cotas</th><th class="n">Preço médio</th><th class="n">Investido</th><th class="n">Valor atual</th><th class="n">Resultado</th><th class="n">Renda/mês</th></tr></thead>
        <tbody>${c.map(p => `<tr data-tk="${p.t}"><td class="tk"><span class="tkb">${p.t}</span><span class="nm">${p.f ? esc(p.f.nm) : "fora da base de FIIs"}</span></td>
          <td class="n">${int(p.qtd)}</td><td class="n">${brl(p.pm)}</td><td class="n">${brl(p.invest)}</td><td class="n">${brl(p.atual)}</td><td class="n">${p.invest && p.atual ? `<span class="${p.atual - p.invest >= 0 ? "pos" : "neg"}">${pct((p.atual / p.invest - 1) * 100, 1)}</span>` : "—"}</td><td class="n pos">${brl(p.rendMes)}</td></tr>`).join("")}</tbody></table></div>`
        : `<p class="empty">Nenhum FII no Patrimônio ainda.<br>Cadastre o fundo no Patrimônio com o ticker no nome (ex.: <b>MXRF11</b>) e ele aparece aqui.</p>`}</section>
    <section class="glass stage" id="st-anel" style="height:480px"><div class="hud"><div><div class="lbl">Composição ${T("calc")}</div><div class="cnt" style="margin-top:4px">Ângulo = valor atual · altura = renda mensal estimada</div></div></div>${c.length ? "" : `<p class="empty" style="position:absolute;inset:40% 0 auto">Sem posições.</p>`}${dica("Arraste para girar · passe o mouse nos segmentos")}</section></div>` };
AFTER.carteira = () => { const c = carteira(); ligarLinhas();
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
let sairCheia = () => false;
addEventListener("keydown", e => { if (e.key === "Escape") sairCheia() });
function rota() { const [v, arg] = (location.hash.slice(1) || "painel").split("/"); const run = () => { limpar3D(); document.body.classList.remove("noscroll"); sairCheia = () => false; for (const k in API) delete API[k]; S.view = v; S.arg = arg ? decodeURIComponent(arg) : null;
    const ab = v === "fii" ? "explorar" : v; document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === ab)); moverTinta();
    document.getElementById("main").innerHTML = `<div class="view">${(VIEWS[v] || VIEWS.painel)()}</div>`; window.scrollTo({ top: 0, behavior: "instant" }); (AFTER[v] || (() => { }))() };
  if (document.startViewTransition && !RM) { const t = document.startViewTransition(run); t.ready.catch(() => { }); t.finished.catch(() => { }).then(() => document.querySelectorAll("[style*='view-transition-name']").forEach(e => { if (!e.classList.contains("ftk")) e.style.viewTransitionName = "" })) } else run() }
function moverTinta() { const b = document.querySelector("#tabs button.on"), ink = document.getElementById("ink"); if (!b) { ink.style.width = 0; return } ink.style.left = b.offsetLeft + "px"; ink.style.width = b.offsetWidth + "px" }
addEventListener("hashchange", rota); addEventListener("resize", moverTinta);
document.getElementById("tabs").onclick = e => { const b = e.target.closest("button[data-v]"); if (b) go(b.dataset.v) };
document.getElementById("voltar").onclick = () => { location.href = APP };
document.getElementById("fresh").innerHTML = DB.gerado ? `<span class="chip"><i></i>Cotações ${new Date(DB.gerado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span><span class="chip"><i></i>CVM ${mes(DB.refCvm)}</span>` : `<span class="chip" style="color:var(--rose)">Base não carregada</span>`;
(function fita() { const l = F.slice(0, 26).map(f => `<span><b>${f.t}</b>${brl(f.preco)} <span class="${(f.var1 || 0) >= 0 ? "pos" : "neg"}">${f.var1 == null ? "" : sgn(f.var1) + pct(Math.abs(f.var1))}</span></span>`).join("");
  document.getElementById("tape").innerHTML = `<div class="run">${l}${l}</div>` })();
rota();
