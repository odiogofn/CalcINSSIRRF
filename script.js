// ===== Helpers =====
const trunc2 = (n) => Math.trunc(n * 100) / 100;
const fmt = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const fmtPct = (p) => `${(p * 100).toFixed(0)}%`;

// ===== Tabelas INSS =====
const INSS_TABELAS = {
  2020: [{lim:1045.00,rate:0.075},{lim:2089.60,rate:0.09},{lim:3134.40,rate:0.12},{lim:6101.06,rate:0.14}],
  2021: [{lim:1100.00,rate:0.075},{lim:2203.48,rate:0.09},{lim:3305.22,rate:0.12},{lim:6433.57,rate:0.14}],
  2022: [{lim:1212.00,rate:0.075},{lim:2427.35,rate:0.09},{lim:3641.03,rate:0.12},{lim:7087.22,rate:0.14}],
  2023: [{lim:1302.00,rate:0.075},{lim:2571.29,rate:0.09},{lim:3856.94,rate:0.12},{lim:7507.49,rate:0.14}],
  2024: [{lim:1412.00,rate:0.075},{lim:2666.68,rate:0.09},{lim:4000.03,rate:0.12},{lim:7786.02,rate:0.14}],
  2025: [{lim:1518.00,rate:0.075},{lim:2793.88,rate:0.09},{lim:4190.83,rate:0.12},{lim:8157.41,rate:0.14}]
};

// ===== Tabelas IRRF =====
const IRRF_TABELAS = {
  2020:[{lim:1903.98,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:142.80},{lim:3751.05,aliq:0.15,ded:354.80},{lim:4664.68,aliq:0.225,ded:636.13},{lim:Infinity,aliq:0.275,ded:869.36}],
  2021:[{lim:1903.98,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:142.80},{lim:3751.05,aliq:0.15,ded:354.80},{lim:4664.68,aliq:0.225,ded:636.13},{lim:Infinity,aliq:0.275,ded:869.36}],
  2022:[{lim:1903.98,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:142.80},{lim:3751.05,aliq:0.15,ded:354.80},{lim:4664.68,aliq:0.225,ded:636.13},{lim:Infinity,aliq:0.275,ded:869.36}],
  "2023_ATEABR":[{lim:1903.98,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:142.80},{lim:3751.05,aliq:0.15,ded:354.80},{lim:4664.68,aliq:0.225,ded:636.13},{lim:Infinity,aliq:0.275,ded:869.36}],
  "2023_APOSMAI":[{lim:2112.00,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:158.40},{lim:3751.05,aliq:0.15,ded:370.40},{lim:4664.68,aliq:0.225,ded:651.73},{lim:Infinity,aliq:0.275,ded:884.96}],
  "2024_ATEJAN":[{lim:2112.00,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:158.40},{lim:3751.05,aliq:0.15,ded:370.40},{lim:4664.68,aliq:0.225,ded:651.73},{lim:Infinity,aliq:0.275,ded:884.96}],
  "2024_APOSFEV":[{lim:2259.20,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:142.80},{lim:3751.05,aliq:0.15,ded:354.80},{lim:4664.68,aliq:0.225,ded:636.13},{lim:Infinity,aliq:0.275,ded:869.36}],
  "2025_ATEABR":[{lim:2259.20,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:169.44},{lim:3751.05,aliq:0.15,ded:381.44},{lim:4664.68,aliq:0.225,ded:662.77},{lim:Infinity,aliq:0.275,ded:896.00}],
  "2025_APOSMAI":[{lim:2428.80,aliq:0,ded:0},{lim:2826.65,aliq:0.075,ded:182.16},{lim:3751.05,aliq:0.15,ded:394.16},{lim:4664.68,aliq:0.225,ded:675.49},{lim:Infinity,aliq:0.275,ded:908.73}]
};

// ===== Dedução simplificada =====
function getDeducaoLegal(ano, mes) {
  // 2024 inteiro: 564,80 | 2025 até abril: 564,80 | 2025 maio em diante: 607,20 | demais anos: 0
  if (ano === 2024) return 564.80;
  if (ano === 2025 && mes <= 4) return 564.80;
  if (ano === 2025 && mes >= 5) return 607.20;
  return 0;
}

// ===== Seleção da tabela IRRF conforme ano/mês =====
function getTabelaIRRF(ano, mes) {
  if (ano <= 2022) return IRRF_TABELAS[ano];
  if (ano === 2023) return (mes <= 4) ? IRRF_TABELAS["2023_ATEABR"] : IRRF_TABELAS["2023_APOSMAI"];
  if (ano === 2024) return (mes === 1) ? IRRF_TABELAS["2024_ATEJAN"] : IRRF_TABELAS["2024_APOSFEV"];
  if (ano === 2025) return (mes <= 4) ? IRRF_TABELAS["2025_ATEABR"] : IRRF_TABELAS["2025_APOSMAI"];
  return IRRF_TABELAS[2025];
}

// ===== Cálculo INSS (RGPS) com truncamento por faixa =====
function calcularINSS_RGPS(remuneracao, ano) {
  const tabela = INSS_TABELAS[ano];
  let anterior = 0;
  let total = 0;
  const linhas = [];

  for (const faixa of tabela) {
    const baseFaixa = Math.max(0, Math.min(remuneracao, faixa.lim) - anterior);
    if (baseFaixa > 0) {
      const descFaixa = trunc2(baseFaixa * faixa.rate); // truncado
      total += descFaixa;
      linhas.push(`Faixa até ${fmt(faixa.lim)}: ${fmt(baseFaixa)} × ${(faixa.rate*100).toFixed(2)}% = ${fmt(descFaixa)}`);
    }
    anterior = faixa.lim;
    if (remuneracao <= anterior) break;
  }
  return { total: trunc2(total), memoria: linhas, label: "INSS (RGPS)" };
}

// ===== Cálculo Previdência Municipal (RPPS) =====
function calcularPrevidenciaMunicipal(remuneracao, aliquotaPct) {
  const aliquota = Number(aliquotaPct) / 100; // entrada em %
  const valor = trunc2(remuneracao * aliquota); // truncado
  const memoria = [
    `Previdência Municipal: ${fmt(remuneracao)} × ${aliquotaPct.toFixed(2)}% = ${fmt(valor)}`
  ];
  return { total: valor, memoria, label: "Previdência Municipal (RPPS)" };
}

// ===== Cálculo IRRF =====
function calcularIRRF(remuneracao, descontoPrev, dependentes, ano, mes, usarDeducaoLegal, prevLabel) {
  const tabela = getTabelaIRRF(ano, mes);
  const dedLegal = usarDeducaoLegal ? getDeducaoLegal(ano, mes) : 0;
  const dedDepend = usarDeducaoLegal ? 0 : (dependentes * 189.59);

  // Base
  const base = Math.max(
    0,
    usarDeducaoLegal ? (remuneracao - dedLegal) : (remuneracao - descontoPrev - dedDepend)
  );

  // Faixa
  const faixa = tabela.find(f => base <= f.lim) || tabela[tabela.length - 1];

  // Imposto
  let imposto = trunc2(base * faixa.aliq - faixa.ded);
  if (imposto < 0) imposto = 0;

  // Memória
  const mem = [];
  if (usarDeducaoLegal) {
    mem.push(`Base = Remuneração − Dedução legal = ${fmt(remuneracao)} − ${fmt(dedLegal)} = ${fmt(base)}`);
  } else {
    mem.push(`Base = Remuneração − ${prevLabel} − Dependentes×189,59 = ${fmt(remuneracao)} − ${fmt(descontoPrev)} − ${fmt(dedDepend)} = ${fmt(base)}`);
  }
  mem.push(`Faixa até ${fmt(faixa.lim)} | Alíquota ${fmtPct(faixa.aliq)} | Parcela a deduzir ${fmt(faixa.ded)}`);
  mem.push(`IRRF = (${fmt(base)} × ${fmtPct(faixa.aliq)}) − ${fmt(faixa.ded)} = ${fmt(imposto)}`);

  return { total: imposto, memoria: mem };
}

// ===== Integração com a página =====
document.addEventListener("DOMContentLoaded", () => {
  const regimeSel = document.getElementById("regime");
  const campoAliq = document.getElementById("campoAliquotaMunicipal");
  if (regimeSel) {
    const toggleAliq = () => {
      campoAliq.style.display = (regimeSel.value === "RPPS") ? "block" : "none";
    };
    regimeSel.addEventListener("change", toggleAliq);
    toggleAliq(); // estado inicial
  }

  const btn = document.getElementById("btnCalcular");
  if (btn) btn.addEventListener("click", onCalcularClick);
});

function onCalcularClick() {
  const ano = parseInt(document.getElementById("ano").value, 10);
  const mes = parseInt(document.getElementById("mes").value, 10);
  const remuneracao = parseFloat(document.getElementById("remuneracao").value);
  const dependentes = parseInt(document.getElementById("dependentes").value || "0", 10);
  const usarDeducaoLegal = document.getElementById("deducaoSimplificada").checked;
  const regime = document.getElementById("regime").value;

  const out = document.getElementById("resultado");

  if (!remuneracao || remuneracao <= 0 || isNaN(remuneracao)) {
    out.textContent = "Informe uma remuneração válida.";
    return;
  }

  let prev, prevLabel;
  if (regime === "RGPS") {
    prev = calcularINSS_RGPS(remuneracao, ano);
    prevLabel = prev.label;
  } else {
    const aliqInput = document.getElementById("aliquotaMunicipal");
    const aliqPct = parseFloat(aliqInput.value);
    if (isNaN(aliqPct) || aliqPct < 0) {
      out.textContent = "Informe uma alíquota de Previdência Municipal válida.";
      return;
    }
    prev = calcularPrevidenciaMunicipal(remuneracao, aliqPct);
    prevLabel = prev.label;
  }

  const rIRRF = calcularIRRF(remuneracao, prev.total, dependentes, ano, mes, usarDeducaoLegal, prevLabel);
  const liquido = trunc2(remuneracao - prev.total - rIRRF.total);

  // legenda da tabela IRRF usada
  const legendaTabelaIR =
    (ano <= 2022) ? `IRRF ${ano}` :
    (ano === 2023 ? (mes <= 4 ? "IRRF 2023 até abril" : "IRRF 2023 após maio") :
    (ano === 2024 ? (mes === 1 ? "IRRF 2024 até janeiro" : "IRRF 2024 após fevereiro") :
    (mes <= 4 ? "IRRF 2025 até abril" : "IRRF 2025 após maio")));

  const memPrev = Array.isArray(prev.memoria) ? prev.memoria.join("\n") : String(prev.memoria || "");
  const memIrrf = Array.isArray(rIRRF.memoria) ? rIRRF.memoria.join("\n") : String(rIRRF.memoria || "");

  out.textContent =
`Salário bruto: ${fmt(remuneracao)}
Dependentes: ${dependentes}

=== ${prevLabel} ===
${memPrev}
Total ${prevLabel}: ${fmt(prev.total)}

=== ${legendaTabelaIR} ===
${memIrrf}

Salário líquido (Bruto − ${prevLabel} − IRRF): ${fmt(liquido)}`;
}
