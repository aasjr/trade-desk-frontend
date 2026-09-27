let currentRoute = "dashboard";
let performanceChart = null;
let assetChart = null;

const views = {
  dashboard: document.getElementById("view-dashboard"),
  operacoes: document.getElementById("view-operacoes"),
  ativos: document.getElementById("view-ativos")
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.route));
});

function navigate(route){
  currentRoute=route;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.route===route));
  Object.entries(views).forEach(([k,v])=>v.classList.toggle("active",k===route));
  document.getElementById("pageTitle").textContent={dashboard:"Dashboard",operacoes:"Operações",ativos:"Ativos"}[route];
  if(route==="dashboard") loadDashboard();
  if(route==="operacoes") loadOperations();
  if(route==="ativos") renderAssets();
}

async function loadDashboard(){
  try{
    const [summary, ops] = await Promise.all([api("/carteira/consolidado"),api("/operacoes?status=ABERTA")]);
    views.dashboard.innerHTML=`
      <div class="grid grid-5">
        ${metric("P&L aberto",money(summary.resultado_aberto),"Mark-to-market",cls(summary.resultado_aberto))}
        ${metric("P&L fechado",money(summary.resultado_fechado),"Resultado realizado",cls(summary.resultado_fechado))}
        ${metric("P&L total",money(summary.resultado_total),"Consolidado",cls(summary.resultado_total))}
        ${metric("Taxa de acerto",num(summary.taxa_acerto)+"%","Operações fechadas","neutral")}
        ${metric("Profit Factor",summary.profit_factor==null?"—":num(summary.profit_factor),"Resultado / perdas","neutral")}
      </div>
      <div class="grid grid-2" style="margin-top:18px">
        <div class="panel"><div class="panel-head"><h2>Resultado acumulado</h2><span>Visão das operações</span></div><div class="chart-wrap"><canvas id="performanceChart"></canvas></div></div>
        <div class="panel"><div class="panel-head"><h2>Resumo da carteira</h2><span>${summary.operacoes_abertas} abertas</span></div>
          <div class="grid grid-2">
            ${metric("Capital em posições",money(summary.capital_em_posicoes_abertas),"Exposição atual","neutral")}
            ${metric("Maior ganho",money(summary.maior_ganho),"Operação fechada","positive")}
            ${metric("Maior perda",money(summary.maior_perda),"Operação fechada","negative")}
            ${metric("Operações",summary.operacoes_fechadas,"Fechadas","neutral")}
          </div>
        </div>
      </div>
      <div class="panel" style="margin-top:18px">
        <div class="panel-head"><h2>Posições abertas</h2><button class="mini-btn" onclick="updateQuotes()">↻ Atualizar cotações</button></div>
        ${openTable(ops)}
      </div>`;
    drawPerformance(summary,ops);
    stamp();
  }catch(e){views.dashboard.innerHTML=`<div class="panel empty">Não foi possível carregar o dashboard.<br>${e.message}</div>`}
}
function metric(label,value,sub,color){return `<div class="card metric"><div class="label">${label}</div><div class="value ${color}">${value}</div><div class="sub">${sub}</div></div>`}
function openTable(ops){
 if(!ops.length)return `<div class="empty">Nenhuma posição aberta no momento.</div>`;
 return `<div class="table-wrap"><table><thead><tr><th>Ativo</th><th>Tipo</th><th>Qtd.</th><th>Entrada</th><th>Atual</th><th>P&L</th><th>Retorno</th></tr></thead><tbody>
 ${ops.map(o=>`<tr><td class="ticker">${o.ticker}</td><td><span class="badge ${o.tipo==="BUY"?"buy":"sell"}">${o.tipo==="BUY"?"COMPRA":"VENDA"}</span></td><td>${num(o.quantidade)}</td><td>${money(o.preco_entrada)}</td><td>${money(o.preco_atual)}</td><td class="${cls(o.resultado)}">${money(o.resultado)}</td><td class="${cls(o.resultado_percentual)}">${num(o.resultado_percentual)}%</td></tr>`).join("")}
 </tbody></table></div>`;
}
function drawPerformance(summary,ops){
 const ctx=document.getElementById("performanceChart"); if(!ctx)return;
 if(performanceChart)performanceChart.destroy();
 performanceChart=new Chart(ctx,{type:"line",data:{labels:["Realizado","Aberto","Total"],datasets:[{data:[summary.resultado_fechado,summary.resultado_aberto,summary.resultado_total],borderWidth:2,tension:.35,fill:true,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:"#edf0f4"}}}}});
}
async function updateQuotes(){try{await api("/operacoes/atualizar",{method:"POST"});toast("Cotações atualizadas.");loadDashboard()}catch(e){toast(e.message)}}

async function loadOperations(){
 views.operacoes.innerHTML=`<div class="panel"><div class="panel-head"><h2>Livro de operações</h2><button class="primary-btn" onclick="openTradeModal()">+ Nova operação</button></div><div class="searchbar"><input id="opSearch" placeholder="Filtrar por ativo..." oninput="filterOps()"><select id="opStatus" onchange="filterOps()"><option value="">Todos os status</option><option value="ABERTA">Abertas</option><option value="FECHADA">Fechadas</option></select></div><div id="opsTable">Carregando...</div></div>`;
 const ops=await api("/operacoes"); window.allOps=ops; renderOps(ops);
}
function renderOps(ops){
 document.getElementById("opsTable").innerHTML=ops.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Ativo</th><th>Tipo</th><th>Qtd.</th><th>Entrada</th><th>Atual/Saída</th><th>Status</th><th>P&L</th><th>Ações</th></tr></thead><tbody>${ops.map(o=>`<tr><td>#${o.id}</td><td class="ticker">${o.ticker}</td><td><span class="badge ${o.tipo==="BUY"?"buy":"sell"}">${o.tipo}</span></td><td>${num(o.quantidade)}</td><td>${money(o.preco_entrada)}</td><td>${money(o.status==="FECHADA"?o.preco_saida:o.preco_atual)}</td><td><span class="badge ${o.status==="ABERTA"?"open":"closed"}">${o.status}</span></td><td class="${cls(o.resultado)}">${money(o.resultado)}</td><td>${o.status==="ABERTA"?`<button class="mini-btn" onclick="closeTrade(${o.id})">Fechar</button>`:""} <button class="mini-btn danger" onclick="deleteTrade(${o.id})">Excluir</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Nenhuma operação encontrada.</div>`;
}
function filterOps(){const q=(document.getElementById("opSearch").value||"").toUpperCase(),s=document.getElementById("opStatus").value;renderOps(window.allOps.filter(o=>(!q||o.ticker.includes(q))&&(!s||o.status===s)))}
async function closeTrade(id){const p=prompt("Preço de saída (vazio = cotação Yahoo Finance):");try{await api(`/operacoes/${id}/fechar`,{method:"POST",body:JSON.stringify(p?{preco_saida:Number(p)}:{})});toast("Operação fechada.");loadOperations()}catch(e){toast(e.message)}}
async function deleteTrade(id){if(!confirm("Excluir esta operação?"))return;await api(`/operacoes/${id}`,{method:"DELETE"});toast("Operação excluída.");loadOperations()}

function renderAssets(){
 views.ativos.innerHTML=`<div class="panel"><div class="panel-head"><h2>Pesquisa de ativo</h2><span>Yahoo Finance</span></div><div class="searchbar"><input id="assetTicker" placeholder="Digite o ticker, ex.: PETR4" value="${window.lastTicker||""}"><select id="assetPeriod"><option value="1mo">1 mês</option><option value="6mo">6 meses</option><option value="1y" selected>1 ano</option><option value="5y">5 anos</option></select><button class="primary-btn" onclick="searchAsset()">Consultar</button></div><div id="assetResult"></div></div>`;
 if(window.lastTicker)searchAsset();
}
async function searchAsset(){
 const ticker=document.getElementById("assetTicker").value.trim().toUpperCase(); if(!ticker)return;
 window.lastTicker=ticker;
 try{
  const [data,hist]=await Promise.all([api(`/ativos/${ticker}`),api(`/ativos/${ticker}/historico?periodo=${document.getElementById("assetPeriod").value}`)]);
  const c=data.cotacao,f=data.fundamentos;
  document.getElementById("assetResult").innerHTML=`<div class="asset-header"><div><div class="eyebrow">${f.longName||ticker}</div><div class="asset-price">${money(c.preco)}</div><span class="positive">Mercado · ${c.symbol}</span></div><div><button class="mini-btn" onclick="openTradeWith('${ticker}')">+ Abrir operação</button></div></div>
  <div class="panel" style="box-shadow:none;border:1px solid var(--line);margin-bottom:18px"><div class="panel-head"><h2>Histórico de preços</h2><span>Fechamento</span></div><div class="chart-wrap"><canvas id="assetChart"></canvas></div></div>
  <div class="panel" style="box-shadow:none"><div class="panel-head"><h2>Fundamentos</h2><span>Dados disponíveis no Yahoo Finance</span></div><div class="fund-grid">${fundamentals(f)}</div></div>`;
  if(assetChart)assetChart.destroy();
  assetChart=new Chart(document.getElementById("assetChart"),{type:"line",data:{labels:hist.map(x=>new Date(x.data).toLocaleDateString("pt-BR")),datasets:[{label:ticker,data:hist.map(x=>x.fechamento),borderWidth:2,pointRadius:0,tension:.25}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:"#edf0f4"}}}}});
 }catch(e){document.getElementById("assetResult").innerHTML=`<div class="empty">${e.message}</div>`}
}
function fundamentals(f){const map={trailingPE:"P/L",forwardPE:"P/L futuro",priceToBook:"P/VP",dividendYield:"Dividend Yield",returnOnEquity:"ROE",returnOnAssets:"ROA",profitMargins:"Margem líquida",debtToEquity:"Dívida/Patrimônio",currentRatio:"Liquidez corrente",beta:"Beta",marketCap:"Market Cap",fiftyTwoWeekHigh:"Máx. 52 semanas",fiftyTwoWeekLow:"Mín. 52 semanas",targetMeanPrice:"Preço-alvo médio",sector:"Setor",industry:"Indústria"};
 return Object.entries(map).filter(([k])=>f[k]!=null).map(([k,n])=>`<div class="fund"><small>${n}</small><b>${["dividendYield","returnOnEquity","returnOnAssets","profitMargins"].includes(k)?num(f[k]*100)+"%":["marketCap"].includes(k)?money(f[k]):typeof f[k]==="number"?num(f[k]):f[k]}</b></div>`).join("")}
function openTradeWith(t){openTradeModal(t)}
function openTradeModal(ticker=""){document.getElementById("modal").classList.remove("hidden");document.querySelector('#tradeForm [name="ticker"]').value=ticker}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.getElementById("tradeForm").addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));["quantidade","preco_entrada","corretagem","taxas"].forEach(k=>d[k]=Number(d[k]||0));try{await api("/operacoes",{method:"POST",body:JSON.stringify(d)});closeModal();e.target.reset();toast("Operação registrada.");if(currentRoute==="operacoes")loadOperations();else loadDashboard()}catch(err){toast(err.message)}})
function stamp(){document.getElementById("lastUpdate").textContent="Atualizado às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
function refreshCurrentPage(){if(currentRoute==="dashboard")loadDashboard();if(currentRoute==="operacoes")loadOperations();if(currentRoute==="ativos")renderAssets()}
navigate("dashboard");
