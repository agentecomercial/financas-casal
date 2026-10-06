/* Central de FIIs — dados, formatação, carteira, simulação e efeitos de atmosfera */
"use strict";
const DB = window.FC_FIIS || { fundos: [], gerado: null };
const TIPOS = ["Tijolo", "Papel", "Híbrido", "Fundo de fundos", "Fiagro", "Outros"];
const TCOR = { "Tijolo": "#D6BE8A", "Papel": "#7FA7D9", "Híbrido": "#46C2A6", "Fundo de fundos": "#A895E0", "Fiagro": "#A7BF6B", "Outros": "#7C848C" };
/* volta para a aba Patrimônio do app (local: financas-casal.html; site: index.html) */
const APP = location.protocol === "file:" ? "../financas-casal.html#patri" : "../#patri";
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches, TOQUE = matchMedia("(pointer: coarse)").matches;

const curto = n => { let s = (n || "").replace(/FUNDO DE INVESTIMENTO IMOBILI[AÁ]RIO|FUNDO DE INVESTIMENTO NAS CADEIAS PRODUTIVAS AGROINDUSTRIAIS|RESPONSABILIDADE LIMITADA|RESPONSABIL\w*|\bFII\b|\bFIAGRO\b|\bRL\b|\bRESP\b|\bLTDA\b|\bIMOBILI[AÁ]RIO\b|-+/gi, " ").replace(/\s+/g, " ").trim();
  return s.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, w => w.toLowerCase()) };
/* o Yahoo repete o mês corrente (barra mensal + barra do dia): fica o último de cada mês */
DB.fundos.forEach(f => { if (f.precos) f.precos = Object.entries(Object.fromEntries(f.precos)).map(([m, p]) => [m, p]).sort((a, b) => a[0].localeCompare(b[0])) });
const F = DB.fundos.map(f => { const p12 = (f.precos || []).length > 12 ? f.precos[f.precos.length - 13][1] : null;
  return Object.assign({}, f, { nm: curto(f.nome), ret12: p12 ? ((f.preco + (f.div12 || 0)) / p12 - 1) * 100 : null, var1: f.ant ? (f.preco / f.ant - 1) * 100 : null,
    sus: f.pvp != null && (f.pvp < .3 || f.pvp > 3), dyMes: f.dyMesCvm != null ? f.dyMesCvm * 100 : null, tx: f.taxaAdm != null ? f.taxaAdm * 100 : null }) });
const BY = Object.fromEntries(F.map(f => [f.t, f]));
const SEGS = [...new Set(F.map(f => f.seg))].sort();

/* formatação */
const nf = (v, d = 2) => v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const brl = (v, d = 2) => v == null || !isFinite(v) ? "—" : "R$ " + nf(v, d);
const pct = (v, d = 2) => v == null || !isFinite(v) ? "—" : nf(v, d) + "%";
const big = v => { if (v == null || !isFinite(v)) return "—"; const a = Math.abs(v); return a >= 1e9 ? "R$ " + nf(v / 1e9, 2) + " bi" : a >= 1e6 ? "R$ " + nf(v / 1e6, 1) + " mi" : a >= 1e3 ? "R$ " + nf(v / 1e3, 0) + " mil" : brl(v) };
const int = v => v == null ? "—" : Math.round(v).toLocaleString("pt-BR");
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mes = m => { if (!m) return "—"; const [y, mm] = m.split("-"); return MES[+mm - 1] + "/" + y.slice(2) };
const dt = d => d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(2, 4) : "—";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const med = a => { const b = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2 };
const tp = t => `<span class="tp" style="color:${TCOR[t] || TCOR.Outros}"><i style="background:${TCOR[t] || TCOR.Outros}"></i><span style="color:var(--ink2)">${esc(t)}</span></span>`;
const T = (k, txt) => `<span class="tag ${k}">${txt || { real: "dado real", calc: "calculado", sim: "simulação" }[k]}</span>`;
const sgn = v => (v >= 0 ? "+" : "−");

function toast(m) { const t = document.getElementById("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2600) }
const tipEl = document.getElementById("tip");
function tipOn(x, y, html) { tipEl.innerHTML = html; tipEl.classList.add("on"); const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 18)) + "px"; tipEl.style.top = Math.max(8, Math.min(innerHeight - h - 8, y + 18)) + "px" }
function tipOff() { tipEl.classList.remove("on") }
/* toque: o balão fecha ao rolar ou ao tocar fora de um gráfico */
addEventListener("scroll", () => { if (TOQUE) tipOff() }, { passive: true });
document.addEventListener("pointerdown", e => { if (e.pointerType === "touch" && !e.target.closest("canvas,.hv")) tipOff() });
const tipLinhas = (titulo, linhas) => `<div class="h">${titulo}</div>` + linhas.map(([k, v]) => `<div class="r"><span>${k}</span><b>${v}</b></div>`).join("");

/* número que "chega" suavemente ao valor */
function contar(el, para, fmt, ms = 1100) { if (!el) return; const de = +(el.dataset.v || 0); el.dataset.v = para;
  if (RM || de === para) { el.textContent = fmt(para); return } const t0 = performance.now();
  (function f(t) { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(de + (para - de) * e); if (p < 1) requestAnimationFrame(f) })(t0) }

/* ---------- carteira: FIIs cadastrados no Patrimônio do app (mesmo endereço → mesmo armazenamento), somente leitura ---------- */
function lsj(k) { try { return JSON.parse(localStorage.getItem(k) || "null") } catch (e) { return null } }
function carteira() { const out = [], at = lsj("fc_ativos_v1") || {}, mv = Object.values(lsj("fc_movs_v1") || {});
  for (const a of Object.values(at)) { if (a.tipo !== "fii") continue; const m = (a.nome || "").toUpperCase().match(/\b([A-Z]{4}1[1-3])\b/); if (!m) continue;
    const ms = mv.filter(x => x.ativoId === a.id).sort((x, y) => (x.data || "").localeCompare(y.data || "") || (x.ord || 0) - (y.ord || 0));
    let qtd = 0, inv = 0, qInv = 0, prov = 0; const hq = [];
    for (const x of ms) { if (x.tipo === "aporte") { qtd += x.qtd || 0; if (!x.inicial) { inv += x.valor || 0; qInv += x.qtd || 0 } } else if (x.tipo === "resgate") qtd -= x.qtd || 0;
      else if (x.tipo === "saldo" && x.qtd) qtd = x.qtd; else if (x.tipo === "provento") prov += x.valor || 0;
      if (x.data && x.tipo !== "provento") hq.push([x.data.slice(0, 7), qtd]) }
    if (qtd > 0) out.push({ t: m[1], qtd, pm: qInv ? inv / qInv / 100 : null, prov: prov / 100, origem: "app", hq }) }
  return out.map(p => { const f = BY[p.t], atual = f ? f.preco * p.qtd : null, invest = p.pm ? p.pm * p.qtd : null, rendMes = f && f.div12 ? f.div12 / 12 * p.qtd : null, rendUlt = f && f.ultDiv ? f.ultDiv.v * p.qtd : null; /* média 12m × cotas | último pagamento × cotas */
    return Object.assign(p, { f, atual, invest, rendMes, rendUlt }) }) }
/* evolução mês a mês: cotas que você tinha em cada mês × fechamento do mês; rendimentos = cotas × pagamentos do mês */
function historico(cart, n) { const fim = new Date().toISOString().slice(0, 7), meses = []; let [y, m] = fim.split("-").map(Number);
  for (let i = 0; i < n; i++) { meses.unshift(y + "-" + String(m).padStart(2, "0")); m--; if (!m) { m = 12; y-- } }
  return meses.map((mm, i) => { let pat = 0, rend = 0;
    for (const p of cart) { const f = p.f; if (!f) continue; let q = p.qtd; if (p.hq && p.hq.length) { q = 0; for (const [hm, hq] of p.hq) if (hm <= mm) q = hq }
      if (!q) continue; const pr = i === meses.length - 1 ? f.preco : ((f.precos || []).find(x => x[0] === mm) || [])[1]; if (pr) pat += q * pr;
      rend += q * (f.divs || []).filter(d => d[0].slice(0, 7) === mm).reduce((s, d) => s + d[1], 0) }
    return { m: mm, pat, rend } }) }
/* índice de mercado (retorno total dos 30 FIIs mais líquidos, base R$ 100 mil) — usado quando a carteira está vazia */
function indiceMercado(n) { const top = F.filter(f => (f.precos || []).length >= n).slice(0, 30), meses = top.length ? top[0].precos.slice(-n).map(x => x[0]) : [];
  let v = 100000; return meses.map((mm, i) => { if (i) { const r = med(top.map(f => { const a = f.precos.find(x => x[0] === meses[i - 1]), b = f.precos.find(x => x[0] === mm); if (!a || !b) return null;
    const dv = (f.divs || []).filter(d => d[0].slice(0, 7) === mm).reduce((s, d) => s + d[1], 0); return (b[1] + dv) / a[1] - 1 })) || 0; v *= 1 + r }
    const rend = i ? v * (med(top.map(f => { const dv = (f.divs || []).filter(d => d[0].slice(0, 7) === mm).reduce((s, d) => s + d[1], 0), b = f.precos.find(x => x[0] === mm); return b ? dv / b[1] : null })) || 0) : 0;
    return { m: mm, pat: v, rend } }) }

/* ---------- simulação ---------- */
/* motor único do simulador — mês a mês:
   renda = cotas × preço × DY ÷ 12 · preço do mês seguinte = preço × (1 + valorização)^(1/12)
   aporte vai para o caixa de aportes; renda vai para o caixa de rendimentos (se reinvestir) ou é recebida;
   cada caixa compra cotas inteiras ao preço do mês e a sobra fica para o mês seguinte */
function simular(x, mesesMax) {
  const meses = mesesMax || Math.round(x.anos * 12), taxa = x.dy / 1200, cresce = Math.pow(1 + x.valor / 100, 1 / 12);
  const cotIni = x.modo === "cotas" ? Math.max(0, Math.floor(x.qtd)) : Math.max(0, Math.floor(x.cap / x.preco));
  let preco = x.preco, cA = 0, cR = 0, cxA = 0, cxR = 0, aport = cotIni * x.preco, rendTot = 0, recebido = 0;
  const capIni = cotIni * x.preco, serie = [{ m: 0, pat: capIni, aport, rendTot: 0, cotas: cotIni, preco, renda: cotIni * preco * taxa }];
  for (let m = 1; m <= meses; m++) {
    const cot = cotIni + cA + cR, renda = cot * preco * taxa; rendTot += renda;
    preco *= cresce; cxA += x.aporte; aport += x.aporte;
    if (x.reinv) cxR += renda; else recebido += renda;
    const nA = Math.floor(cxA / preco), nR = Math.floor(cxR / preco); cA += nA; cR += nR; cxA -= nA * preco; cxR -= nR * preco;
    const c2 = cotIni + cA + cR; serie.push({ m, pat: c2 * preco + cxA + cxR, aport, rendTot, cotas: c2, preco, renda: c2 * preco * taxa, recebido });
  }
  const f = serie[serie.length - 1], rendReinv = x.reinv ? rendTot : 0;
  return { cotIni, capIni, rendaHoje: cotIni * x.preco * taxa, serie, fim: f, cotasA: cA, cotasR: cR, patFim: f.pat, rendaFim: f.renda, aportado: f.aport, rendTot, recebido,
    valoriz: Math.abs(f.pat - f.aport - rendReinv) < .5 ? 0 : f.pat - f.aport - rendReinv, rendReinv };
}
/* a Superfície 3D chama projetar(): passa a usar o mesmo motor */
function projetar(x) { const r = simular(x); return { ini: { cotas: r.cotIni, inv: r.capIni }, serie: r.serie.map(p => [p.m, p.pat, p.aport, p.rendTot]),
  anual: r.serie.filter(p => p.m && p.m % 12 === 0).map(p => ({ ano: p.m / 12, cotas: p.cotas, pat: p.pat, aportado: p.aport, rendAc: p.rendTot, rendMes: p.renda })), fim: [r.fim.m, r.patFim, r.aportado, r.rendTot], rendMesFim: r.rendaFim } };
/* meses reais da projeção, a partir do mês que vem (AAAA-MM) */
const mesesReais = n => { const d = new Date(); d.setDate(1); const out = []; for (let i = 0; i <= n; i++) { const x = new Date(d.getFullYear(), d.getMonth() + 1 + i, 1); out.push(x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0")) } return out };

const RANKS = [
  ["dy", "Maior Dividend Yield", "Rendimentos pagos nos últimos 12 meses ÷ cotação atual. DY alto pode refletir queda da cota ou rendimento não recorrente.", f => f.dy12, f => pct(f.dy12), true],
  ["pvp", "Menor P/VP", "Cotação ÷ valor patrimonial da cota informado à CVM. Abaixo de 1 = negociado com desconto. Fundos com VP possivelmente defasado ficam de fora.", f => f.sus ? null : f.pvp, f => nf(f.pvp), false],
  ["liq", "Maior liquidez", "Média de volume × preço dos últimos 21 pregões.", f => f.liq, f => big(f.liq) + "/dia", true],
  ["pl", "Maior patrimônio", "Patrimônio líquido do último informe mensal à CVM.", f => f.pl, f => big(f.pl), true],
  ["ret", "Melhor desempenho 12m", "Retorno total: variação da cota em 12 meses + rendimentos pagos no período.", f => f.ret12, f => pct(f.ret12, 1), true],
  ["rend", "Maior rendimento por cota", "Último rendimento pago por cota. Cotas mais caras pagam mais em reais: compare com o preço.", f => f.ultDiv ? f.ultDiv.v : null, f => f.ultDiv ? brl(f.ultDiv.v, 4) : "—", true],
  ["cot", "Mais cotistas", "Total de cotistas no último informe à CVM: popularidade, não qualidade.", f => f.cotistas, f => int(f.cotistas), true],
  ["tx", "Menor taxa de administração", "Despesa de taxa de administração no mês ÷ patrimônio (informe CVM).", f => f.tx > 0 ? f.tx : null, f => pct(f.tx, 3), false]];

/* ---------- atmosfera: partículas douradas, luz que segue o mouse, parallax nos cartões ---------- */
(function atmosfera() { const c = document.getElementById("atmo"), x = c.getContext("2d"); let W, H, P = [];
  const rs = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    P = Array.from({ length: Math.round(innerWidth / (TOQUE ? 34 : 22)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.2 + .3) * devicePixelRatio, v: Math.random() * .18 + .04, a: Math.random() * .5 + .15, f: Math.random() * 6 })) };
  rs(); addEventListener("resize", rs); let mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; document.body.style.setProperty("--lx", (50 + mx * 40) + "%"); document.body.style.setProperty("--ly", (-10 + my * 20) + "%") });
  if (RM) return;
  (function loop(t) { x.clearRect(0, 0, W, H); for (const p of P) { p.y -= p.v * devicePixelRatio; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W }
      const tw = .55 + .45 * Math.sin(t / 1400 + p.f); x.beginPath(); x.arc(p.x + mx * 14 * p.r, p.y + my * 10 * p.r, p.r, 0, 6.283); x.fillStyle = `rgba(242,227,189,${p.a * tw})`; x.fill() }
    requestAnimationFrame(loop) })(0) })();
document.addEventListener("pointermove", e => { const el = e.target.closest && e.target.closest(".glass"); if (!el) return; const b = el.getBoundingClientRect();
  el.style.setProperty("--mx", ((e.clientX - b.left) / b.width * 100) + "%"); el.style.setProperty("--my", ((e.clientY - b.top) / b.height * 100) + "%");
  if (el.classList.contains("tilt") && !RM && !TOQUE) { el.style.setProperty("--ry", (((e.clientX - b.left) / b.width) - .5) * 5 + "deg"); el.style.setProperty("--rx", -(((e.clientY - b.top) / b.height) - .5) * 5 + "deg") } });
document.addEventListener("pointerout", e => { const el = e.target.closest && e.target.closest(".tilt"); if (el && !el.contains(e.relatedTarget)) { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg") } });
