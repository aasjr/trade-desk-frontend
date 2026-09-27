const API = "http://127.0.0.1:5000/api";

async function api(url, options = {}) {
  const response = await fetch(API + url, {
    headers: {"Content-Type": "application/json"},
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || "Erro na API");
  return data;
}
function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function num(v,d=2){return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});}
function cls(v){return Number(v)>=0?"positive":"negative";}
function toast(msg){const e=document.getElementById("toast");e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600);}
