# Atualiza cotações e proventos dos ativos do app Finanças do Casal.
# Busca no Yahoo Finance (sem token) e grava cotacoes.js, que o app lê ao abrir.
# Tickers: um por linha em tickers.txt (mesma pasta). Uso: .\Atualizar-Cotacoes.ps1 [-Tickers VGIA11,MXRF11]
param([string[]]$Tickers)
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$lista = Join-Path $dir "tickers.txt"
if (-not $Tickers -or -not $Tickers.Count) {
  if (Test-Path $lista) { $Tickers = Get-Content $lista -Encoding UTF8 | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ -match '^[A-Z]{4}\d{1,2}$' } }
  if (-not $Tickers) { $Tickers = @("VGIA11") }
} else {
  $Tickers = $Tickers | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ }
  # novos tickers passam a fazer parte da lista
  $atuais = @(); if (Test-Path $lista) { $atuais = Get-Content $lista -Encoding UTF8 | ForEach-Object { $_.Trim().ToUpper() } | Where-Object { $_ } }
  $todos = @($atuais + $Tickers | Select-Object -Unique); Set-Content $lista $todos -Encoding UTF8
  $Tickers = $todos
}
$saida = [ordered]@{ gerado = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz"); fonte = "Yahoo Finance"; ativos = [ordered]@{} }
$ok = 0
foreach ($tk in $Tickers) {
  try {
    $u = "https://query1.finance.yahoo.com/v8/finance/chart/$tk.SA?range=2y&interval=1mo&events=div"
    $r = Invoke-RestMethod $u -Headers @{ "User-Agent" = "Mozilla/5.0" } -TimeoutSec 30
    $res = $r.chart.result[0]; $m = $res.meta
    if (-not $m.regularMarketPrice) { throw "sem cotação" }
    $prev = if ($m.chartPreviousClose) { $m.chartPreviousClose } else { $m.previousClose }
    $divs = @()
    if ($res.events -and $res.events.dividends) {
      $divs = @($res.events.dividends.PSObject.Properties | ForEach-Object {
        [ordered]@{ ex = [DateTimeOffset]::FromUnixTimeSeconds($_.Value.date).ToOffset([TimeSpan]::FromHours(-3)).ToString("yyyy-MM-dd"); rate = [double]$_.Value.amount }
      } | Sort-Object { $_.ex })
    }
    $saida.ativos[$tk] = [ordered]@{
      preco = [double]$m.regularMarketPrice
      anterior = [double]$prev
      time = [DateTimeOffset]::FromUnixTimeSeconds($m.regularMarketTime).ToOffset([TimeSpan]::FromHours(-3)).ToString("yyyy-MM-ddTHH:mm:sszzz")
      divs = $divs
    }
    $ok++
    Write-Host ("{0}: R$ {1:N2} ({2} proventos)" -f $tk, $m.regularMarketPrice, $divs.Count)
  } catch { Write-Host "${tk}: não foi possível buscar ($($_.Exception.Message))" -ForegroundColor Yellow }
}
if (-not $ok) { Write-Host "Nada atualizado." -ForegroundColor Red; exit 1 }
$json = $saida | ConvertTo-Json -Depth 6 -Compress
[IO.File]::WriteAllText((Join-Path $dir "cotacoes.js"), "window.FC_COTACOES=$json;", (New-Object Text.UTF8Encoding $false))
Write-Host "cotacoes.js gravado. Com o app aberto aguardando, a cotação entra sozinha; se não, recarregue (F5)." -ForegroundColor Green
