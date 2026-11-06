import fs from "node:fs";
import path from "node:path";
import { ladeDaten, warnungenText } from "../../skripte/lib/daten.mjs";

export default async function () {
  const daten = await ladeDaten();
  const text = warnungenText(daten.warnungen, daten.heute);
  fs.writeFileSync(path.join(process.env.DATEN_ORDNER ?? "daten", "WARNUNGEN.md"), text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  for (const w of daten.warnungen) console.warn(`[Warnung] ${w}`);
  return daten;
}
