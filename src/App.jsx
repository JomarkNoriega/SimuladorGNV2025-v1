import React, { useMemo, useState } from "react";
// -------------------------------
// 1) Tablas embebidas (del Excel)
// -------------------------------

// Q3:R53  (Monto -> TEA)
// VLOOKUP aproximado (largest monto <= total)
const TEA_TABLE = [
  { monto: 1000, tea: 96.99 },
  { monto: 1100, tea: 96.99 },
  { monto: 1200, tea: 96.99 },
  { monto: 1300, tea: 96.99 },
  { monto: 1400, tea: 96.99 },
  { monto: 1500, tea: 96.99 },
  { monto: 1600, tea: 96.99 },
  { monto: 1700, tea: 96.99 },
  { monto: 1800, tea: 96.99 },
  { monto: 1900, tea: 96.99 },
  { monto: 2000, tea: 95.99 },
  { monto: 2100, tea: 95.99 },
  { monto: 2200, tea: 95.99 },
  { monto: 2300, tea: 95.99 },
  { monto: 2400, tea: 95.99 },
  { monto: 2500, tea: 95.99 },
  { monto: 2600, tea: 95.99 },
  { monto: 2700, tea: 95.99 },
  { monto: 2800, tea: 95.99 },
  { monto: 2900, tea: 95.99 },
  { monto: 3000, tea: 95.99 },
  { monto: 3100, tea: 94.99 },
  { monto: 3200, tea: 94.99 },
  { monto: 3300, tea: 94.99 },
  { monto: 3400, tea: 94.99 },
  { monto: 3500, tea: 94.99 },
  { monto: 3600, tea: 94.99 },
  { monto: 3700, tea: 94.99 },
  { monto: 3800, tea: 94.99 },
  { monto: 3900, tea: 94.99 },
  { monto: 4000, tea: 94.99 },
  { monto: 4100, tea: 93.99 },
  { monto: 4200, tea: 93.99 },
  { monto: 4300, tea: 93.99 },
  { monto: 4400, tea: 93.99 },
  { monto: 4500, tea: 93.99 },
  { monto: 4600, tea: 93.99 },
  { monto: 4700, tea: 93.99 },
  { monto: 4800, tea: 93.99 },
  { monto: 4900, tea: 93.99 },
  { monto: 5000, tea: 93.99 },
  { monto: 5100, tea: 92.99 },
  { monto: 5200, tea: 92.99 },
  { monto: 5300, tea: 92.99 },
  { monto: 5400, tea: 92.99 },
  { monto: 5500, tea: 92.99 },
  { monto: 5600, tea: 92.99 },
  { monto: 5700, tea: 92.99 },
  { monto: 5800, tea: 92.99 },
  { monto: 5900, tea: 92.99 },
  { monto: 6000, tea: 92.99 },
];

// Factor (% recaudo) aproximado por actividad (derivado de AG:AI)
// En el Excel: dias_laborables = 24
// Informal: monto_recarga_dia = 20  => AG = 20 * % * 24
// Formal/APP: monto_recarga_dia = 35 => AG = 35 * % * 24
// VLOOKUP devuelve la columna % (AI).
// Factor (% recaudo) aproximado por actividad (según Excel V2)
// VLOOKUP aproximado usando 'Cuota' como entrada.
// Nota: el Excel incluye una última fila con texto '>85%' para marcar el umbral de alerta (no es un factor numérico).
const FACTOR_TABLE = {
  Informal: [
  {
    "cuotaMin": 0.0,
    "factor": 0.5
  },
  {
    "cuotaMin": 200.0,
    "factor": 0.55
  },
  {
    "cuotaMin": 220.0,
    "factor": 0.6
  },
  {
    "cuotaMin": 240.0,
    "factor": 0.65
  },
  {
    "cuotaMin": 260.0,
    "factor": 0.7
  },
  {
    "cuotaMin": 280.0,
    "factor": 0.75
  },
  {
    "cuotaMin": 300.0,
    "factor": 0.8
  },
  {
    "cuotaMin": 320.0,
    "factor": 0.85
  }
],
  "Formal/APP": [
  {
    "cuotaMin": 0.0,
    "factor": 0.5
  },
  {
    "cuotaMin": 350.0,
    "factor": 0.55
  },
  {
    "cuotaMin": 385.0,
    "factor": 0.6
  },
  {
    "cuotaMin": 420.0,
    "factor": 0.65
  },
  {
    "cuotaMin": 455.0,
    "factor": 0.7
  },
  {
    "cuotaMin": 490.0,
    "factor": 0.75
  },
  {
    "cuotaMin": 525.0,
    "factor": 0.8
  },
  {
    "cuotaMin": 560.0,
    "factor": 0.85
  }
],
};

const ALERTA_CUOTA_MIN = {
  Informal: 340,
  "Formal/APP": 595,
};



// -------------------------------
// 2) Utilidades (VLOOKUP/PMT)
// -------------------------------
function vlookupApprox(x, rows, key) {
  // rows: array sorted asc by key
  // returns last row with row[key] <= x
  let best = rows[0];
  for (const r of rows) {
    if (r[key] <= x) best = r;
    else break;
  }
  return best;
}

function teaFromTotal(total) {
  const row = vlookupApprox(total, TEA_TABLE, "monto");
  return row.tea;
}

function monthlyRateFromTEA(teaPercent) {
  const eff = teaPercent / 100;
  // NOMINAL(eff,12)/12  == (1+eff)^(1/12) - 1
  return Math.pow(1 + eff, 1 / 12) - 1;
}

function pmt(rate, nper, pv) {
  // Excel PMT(rate, nper, pv)
  if (rate === 0) return pv / nper;
  const r1 = Math.pow(1 + rate, nper);
  return (rate * pv * r1) / (r1 - 1);
}

function factorFromCuota(activity, cuota) {
  const table = FACTOR_TABLE[activity] ?? FACTOR_TABLE["Informal"];
  const row = vlookupApprox(cuota, table, "cuotaMin");
  return row.factor;
}

function formatPEN(x) {
  if (!isFinite(x)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(x);
}

function formatPct(x) {
  if (!isFinite(x)) return "—";
  return `${(x * 100).toFixed(2)}%`;
}

// -------------------------------
// 3) UI (Simulador)
// -------------------------------
export default function App() {
  const [activity, setActivity] = useState("Formal/APP");
  const [plazo, setPlazo] = useState(24);
  const [solicitado, setSolicitado] = useState(2000);

  // Permitir elegir seguros (pero NO mostrar sus valores resultantes)
  const [seguroObliga, setSeguroObliga] = useState("Vida Integral");
  const [seguroVol, setSeguroVol] = useState("Ruta");

  const limits = useMemo(() => {
    const montoMin = 1000;
    const montoMax = activity === "Informal" ? 3000 : 5000;
    const plazoMin = 12;
    const plazoMax = activity === "Informal" ? 24 : 30;
    return { montoMin, montoMax, plazoMin, plazoMax };
  }, [activity]);

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // Ajuste automático si el usuario cambia actividad y queda fuera de límites
  React.useEffect(() => {
    setSolicitado((prev) => clamp(prev, limits.montoMin, limits.montoMax));
    setPlazo((prev) => clamp(prev, limits.plazoMin, limits.plazoMax));
  }, [limits.montoMin, limits.montoMax, limits.plazoMin, limits.plazoMax]);

  const calc = useMemo(() => {
    // Seguro obligatorio (Excel: Vida Integral = 10% * solicitado)
    const costoObliga =
      seguroObliga === "Vida Integral" ? 0.1 * solicitado : 0;

    // Seguro voluntario (Excel):
    // Solidario = plazo * 8 ; Ruta = 60 ; Solidario+Ruta = plazo*8 + 60 ; Ninguno = 0
    let costoVol = 0;
    if (seguroVol === "Solidario") costoVol = plazo * 8;
    else if (seguroVol === "Ruta") costoVol = 60;
    else if (seguroVol === "Solidario + Ruta") costoVol = plazo * 8 + 60;
    else costoVol = 0;

    const total = solicitado + costoObliga + costoVol;

    const tea = teaFromTotal(total);
    const tasaMensual = monthlyRateFromTEA(tea);
    const cuota = pmt(tasaMensual, plazo, total);

    const factor = factorFromCuota(activity, cuota);

    // Alerta si la cuota cae en el tramo eliminado del Excel (fila '>85%')
    const umbral = ALERTA_CUOTA_MIN[activity] ?? ALERTA_CUOTA_MIN["Informal"];
    const alerta = cuota >= umbral;
return {
      // Se mantiene para lógica, pero NO se muestra en UI
      costoObliga,
      costoVol,
      total,
      tea,
      tasaMensual,
      cuota,
      factor,
      alerta,
    };
  }, [activity, plazo, solicitado, seguroObliga, seguroVol]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Simulador GNV - 2025.12.18</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>Entradas</h3>

          <label style={{ display: "block", marginTop: 10 }}>
            Actividad
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Formal/APP">Formal/APP</option>
              <option value="Informal">Informal</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            Plazo (meses)
            <input
              type="number"
              min={limits.plazoMin}
              max={limits.plazoMax}
              value={plazo}
              onChange={(e) => setPlazo(Number(e.target.value))}
              onBlur={() =>
                setPlazo(clamp(plazo, limits.plazoMin, limits.plazoMax))
              }
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            />
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
              Mín: {limits.plazoMin} | Máx: {limits.plazoMax}
            </div>
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            Monto solicitado (S/)
            <input
              type="number"
              min={limits.montoMin}
              max={limits.montoMax}
              step={50}
              value={solicitado}
              onChange={(e) => setSolicitado(Number(e.target.value))}
              onBlur={() =>
                setSolicitado(clamp(solicitado, limits.montoMin, limits.montoMax))
              }
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            />
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
              Mín: {limits.montoMin} | Máx: {limits.montoMax}
            </div>
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            Seguro obligatorio
            <select
              value={seguroObliga}
              onChange={(e) => setSeguroObliga(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Vida Integral">Vida Integral</option>
              <option value="Ninguno">Ninguno</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            Seguro voluntario
            <select
              value={seguroVol}
              onChange={(e) => setSeguroVol(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 6 }}
            >
              <option value="Solidario">Solidario</option>
              <option value="Ruta">Ruta</option>
              <option value="Solidario + Ruta">Solidario + Ruta</option>
              <option value="Ninguno">Ninguno</option>
            </select>
          </label>

          
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h3>Resultados</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
            <div>
              <div>Cuota</div>
              <b>{formatPEN(calc.cuota)}</b>
            </div>
            <div>
              <div>Factor</div>
              <b>{formatPct(calc.factor)}</b>
            </div>
          </div>

          {calc.alerta && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #cc0000",
                color: "#cc0000",
                fontWeight: 600,
              }}
            >
              Alerta: La cuota supera el rango permitido para {activity}.
            </div>
          )}

        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: "#444" }}>
        Nota: Se mantiene la lógica del Excel (cálculo de cuota y factor). Los valores internos de seguros/TEA/tasa no se muestran.
      </div>
    </div>
  );
}
