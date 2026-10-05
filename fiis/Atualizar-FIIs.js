// Atualizar-FIIs.js — monta a base de FIIs do módulo "Central de FIIs" (fiis.js).
//
// Fontes (públicas, sem token):
//   1. CVM — dados abertos, Informe Mensal de FII (dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL):
//      nome, segmento, mandato, gestão, administrador, ISIN, cotistas, patrimônio líquido,
//      valor patrimonial da cota, DY do mês, rentabilidade, taxa de administração.
//   2. Yahoo Finance (query1.finance.yahoo.com/v8/finance/chart, .SA): cotação, histórico mensal
//      de preço e volume, rendimentos pagos (eventos de dividendo).
// Tratamento: último informe de cada fundo (maior Data_Referencia e Versao); ticker = 4 letras do
// ISIN + "11"; P/VP = cotação ÷ VP da cota; DY 12m = rendimentos pagos em 12 meses ÷ cotação;
// liquidez diária = média de (volume × preço) dos últimos 3 meses ÷ 21 pregões.
// Saída: fiis.js (window.FC_FIIS), lido pelo módulo ao abrir. Roda local (Windows) ou no GitHub Actions.
//
// Uso: node Atualizar-FIIs.js            (todos os FIIs negociados em bolsa)
//      node Atualizar-FIIs.js MXRF11,HGLG11   (só alguns, para teste)
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const OUT = path.join(__dirname, "fiis.js");
const so = (process.argv[2] || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const num = s => { if (s == null || s === "") return null; const n = Number(String(s).replace(",", ".")); return isFinite(n) ? n : null };

async function baixarZip(url, pasta) {
  const r = await fetch(url); if (!r.ok) throw new Error(url + " → " + r.status);
  const zip = path.join(pasta, path.basename(url)); fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  const dest = zip.replace(/\.zip$/, ""); fs.mkdirSync(dest, { recursive: true });
  if (process.platform === "win32") execFileSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${dest}' -Force`]);
  else execFileSync("unzip", ["-o", "-q", zip, "-d", dest]);
  return dest;
}
function lerCsv(arq) {
  const txt = new TextDecoder("latin1").decode(fs.readFileSync(arq)); const [cab, ...ls] = txt.split(/\r?\n/).filter(Boolean);
  const c = cab.split(";"); return ls.map(l => { const v = l.split(";"), o = {}; c.forEach((k, i) => o[k] = v[i]); return o });
}
function ultimo(rows) { // por CNPJ: maior data, depois maior versão
  const m = new Map(); for (const r of rows) { const k = r.CNPJ_Fundo_Classe, a = m.get(k);
    if (!a || r.Data_Referencia > a.Data_Referencia || (r.Data_Referencia === a.Data_Referencia && +r.Versao > +a.Versao)) m.set(k, r) } return m;
}

async function yahoo(t) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${t}.SA?range=2y&interval=1mo&events=div`;
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (r.status === 429) { await sleep(2000 * (i + 1)); continue } if (!r.ok) return null;
      const j = await r.json(), res = j.chart && j.chart.result && j.chart.result[0]; if (!res || !res.meta || !res.meta.regularMarketPrice) return null;
      const q = res.indicators.quote[0] || {}, ts = res.timestamp || [];
      const porMes = new Map(); ts.forEach((s, k) => { if (q.close[k]) porMes.set(new Date(s * 1000).toISOString().slice(0, 7), { p: q.close[k], v: q.volume[k] }) }); // o mês corrente vem duplicado
      const meses = [...porMes].map(([m, x]) => ({ m, p: x.p, v: x.v })).sort((a, b) => a.m.localeCompare(b.m));
      const divs = Object.values((res.events && res.events.dividends) || {}).map(d => ({ d: new Date(d.date * 1000).toISOString().slice(0, 10), v: d.amount })).sort((a, b) => a.d.localeCompare(b.d));
      // diário (3 meses): fechamento anterior de verdade (no mensal, chartPreviousClose é de 2 anos atrás) e liquidez dos últimos 21 pregões
      let ant = null, liq = null;
      try { const r2 = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}.SA?range=3mo&interval=1d`, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (r2.ok) { const d = (await r2.json()).chart.result[0], qd = d.indicators.quote[0] || {}, dias = (d.timestamp || []).map((s, k) => ({ p: qd.close[k], v: qd.volume[k] })).filter(x => x.p);
          if (dias.length >= 2) ant = dias[dias.length - 2].p; const ult = dias.slice(-21).filter(x => x.v != null);
          if (ult.length) liq = Math.round(ult.reduce((s, x) => s + x.v * x.p, 0) / ult.length) } } catch (e) {}
      return { preco: res.meta.regularMarketPrice, ant, liq, quando: new Date(res.meta.regularMarketTime * 1000).toISOString(), meses, divs };
    } catch (e) { await sleep(1000) }
  } return null;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fii-")), ano = new Date().getFullYear();
  const base = "https://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_";
  const geral = [], comp = [], ativo = [];
  for (const a of [ano - 1, ano]) {
    try { const p = await baixarZip(base + a + ".zip", tmp);
      for (const f of fs.readdirSync(p)) { if (/geral/.test(f)) geral.push(...lerCsv(path.join(p, f))); if (/complemento/.test(f)) comp.push(...lerCsv(path.join(p, f))); if (/ativo_passivo/.test(f)) ativo.push(...lerCsv(path.join(p, f))) }
      console.log(`CVM ${a}: ok`) } catch (e) { console.log(`CVM ${a}: ${e.message}`) }
  }
  const g = ultimo(geral), c = ultimo(comp), at = ultimo(ativo);
  // tipo pela carteira declarada (o "Segmento_Atuacao" da CVM é autodeclarado e pouco confiável: MXRF11 aparece como Logística)
  const tipoDe = (cnpj, nome) => { const r = at.get(cnpj) || {}, v = k => num(r[k]) || 0;
    if (/FIAGRO/i.test(nome)) return "Fiagro";
    const imov = v("Direitos_Bens_Imoveis") + v("Acoes_Sociedades_Atividades_FII") + v("Cotas_Sociedades_Atividades_FII"),
      papel = v("CRI") + v("CRI_CRA") + v("LCI") + v("LCI_LCA") + v("LIG") + v("Letras_Hipotecarias"), fof = v("FII"), tot = imov + papel + fof;
    if (!tot) return "Outros"; if (fof / tot > .5) return "Fundo de fundos"; if (papel / tot > .6) return "Papel"; if (imov / tot > .6) return "Tijolo"; return "Híbrido" };
  const SEG_NOME = [[/LOG|GALP|INDUSTRIAL|ARMAZ/i, "Logística"], [/MALL|SHOP/i, "Shoppings"], [/CORP|ESCRIT|OFFICE|LAJE|EDIF|TORRE/i, "Escritórios"],
    [/HOSP|SAUDE|SAÚDE/i, "Hospital"], [/HOTEL/i, "Hotel"], [/\b(AGRO|FIAGRO)/i, "Agro"], [/RESID|HABIT/i, "Residencial"], [/EDUC/i, "Educacional"], [/VAREJO|RENDA URBANA|AGENC/i, "Varejo"]];
  const segDe = (tipo, segCvm, nome) => { if (tipo === "Papel") return "Recebíveis"; if (tipo === "Fundo de fundos") return "Fundo de fundos"; if (tipo === "Fiagro") return "Agro";
    const n = SEG_NOME.find(([re]) => re.test(nome)); if (n) return n[1]; return segCvm && !/Multicategoria|Outros/.test(segCvm) ? segCvm : (tipo === "Híbrido" ? "Híbrido" : "Multicategoria") };
  // histórico de DY mensal informado à CVM (últimos 12 informes)
  const hist = new Map(); for (const r of comp) { const k = r.CNPJ_Fundo_Classe, dy = num(r.Percentual_Dividend_Yield_Mes); if (dy == null) continue;
    const m = r.Data_Referencia.slice(0, 7), h = hist.get(k) || {}; if (!h[m] || +r.Versao >= h[m].ver) h[m] = { dy, ver: +r.Versao }; hist.set(k, h) }

  let fundos = [];
  for (const [cnpj, r] of g) {
    const isin = (r.Codigo_ISIN || "").trim(); if (r.Mercado_Negociacao_Bolsa !== "S" || !/^BR[A-Z0-9]{4}CTF/.test(isin)) continue;
    const t = isin.slice(2, 6) + "11"; if (so.length && !so.includes(t)) continue;
    const k = c.get(cnpj) || {}, h = hist.get(cnpj) || {};
    const nome = (r.Nome_Fundo_Classe || "").trim(), tipo = tipoDe(cnpj, nome);
    fundos.push({ t, cnpj, nome, tipo, seg: segDe(tipo, r.Segmento_Atuacao, nome), segCvm: r.Segmento_Atuacao || "", gestao: r.Tipo_Gestao || "",
      adm: (r.Nome_Administrador || "").trim(), publico: r.Publico_Alvo || "", inicio: r.Data_Funcionamento || "", ref: (k.Data_Referencia || r.Data_Referencia).slice(0, 7),
      cotistas: num(k.Total_Numero_Cotistas), pl: num(k.Patrimonio_Liquido), cotas: num(k.Cotas_Emitidas), vpa: num(k.Valor_Patrimonial_Cotas),
      dyMesCvm: num(k.Percentual_Dividend_Yield_Mes), rentMes: num(k.Percentual_Rentabilidade_Efetiva_Mes), taxaAdm: num(k.Percentual_Despesas_Taxa_Administracao),
      dyHist: Object.entries(h).sort().slice(-12).map(([m, x]) => [m, x.dy]) });
  }
  // um ticker por fundo (classes repetidas viram duplicatas): fica o de maior PL
  const porT = new Map(); for (const f of fundos) { const a = porT.get(f.t); if (!a || (f.pl || 0) > (a.pl || 0)) porT.set(f.t, f) } fundos = [...porT.values()];
  console.log(`${fundos.length} FIIs em bolsa na CVM; buscando cotações...`);

  let i = 0, ok = 0, fila = fundos, pausa = 120;
  const trab = async () => { while (i < fila.length) { const f = fila[i++]; const y = await yahoo(f.t); await sleep(pausa);
    if (!y) continue; ok++;
    const cut = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10), d12 = y.divs.filter(d => d.d >= cut);
    const ult3 = y.meses.slice(-4, -1).filter(x => x.v);
    Object.assign(f, { preco: y.preco, ant: y.ant, cotEm: y.quando, precos: y.meses.map(x => [x.m, +x.p.toFixed(2)]), divs: y.divs.map(d => [d.d, +d.v.toFixed(4)]),
      div12: +d12.reduce((s, d) => s + d.v, 0).toFixed(4), nDiv12: d12.length, ultDiv: y.divs.length ? y.divs[y.divs.length - 1] : null,
      liq: y.liq != null ? y.liq : ult3.length ? Math.round(ult3.reduce((s, x) => s + x.v * x.p, 0) / ult3.length / 21) : null });
    f.dy12 = f.preco ? +(f.div12 / f.preco * 100).toFixed(2) : null; f.pvp = f.vpa ? +(f.preco / f.vpa).toFixed(2) : null;
    if (ok % 50 === 0) console.log(`  ${ok} cotações...`) } };
  await Promise.all(Array.from({ length: 6 }, trab));
  // segunda passada, mais lenta, só para quem falhou (limite de requisições do Yahoo)
  fila = fundos.filter(f => !f.preco); i = 0; pausa = 400; console.log(`segunda tentativa: ${fila.length} sem cotação`);
  await Promise.all(Array.from({ length: 2 }, trab));
  const saida = fundos.filter(f => f.preco).sort((a, b) => (b.liq || 0) - (a.liq || 0));
  const dados = { gerado: new Date().toISOString(), fontes: { cadastro: "CVM — Informe Mensal de FII (dados abertos)", mercado: "Yahoo Finance" },
    refCvm: saida.reduce((m, f) => f.ref > m ? f.ref : m, ""), total: saida.length, semCotacao: fundos.length - saida.length, fundos: saida };
  fs.writeFileSync(OUT, "window.FC_FIIS=" + JSON.stringify(dados) + ";");
  console.log(`fiis.js: ${saida.length} FIIs com cotação (${fundos.length - saida.length} sem cotação no Yahoo), ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
})();
