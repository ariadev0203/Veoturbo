// Moteur « CGA Canal (MyPOS) » : recherche d'abonné et réactivation de décodeur.
// Les identifiants sont envoyés à chaque appel par l'application (rien n'est conservé ici).
const CGA = "https://cgaweb-afrique.canal-plus.com", API = CGA + "/api/rest/onlinesales/v1", OS = API + "/cgaOnlineSales/";
const UA = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36", "accept-language": "fr-FR,fr;q=0.9" };
const J = (status, body) => ({ statusCode: status, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) });
const jar = {}; // cookies de l'appel en cours
const addCookies = (res) => { for (const s of (res.headers.getSetCookie ? res.headers.getSetCookie() : [])) { const kv = s.split(";")[0], i = kv.indexOf("="); jar[kv.slice(0, i).trim()] = kv.slice(i + 1); } };
const cookie = () => Object.entries(jar).map(([k, v]) => k + "=" + v).join("; ");
async function http(url, { method = "GET", headers = {}, body } = {}) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { method, body, redirect: "manual", signal: AbortSignal.timeout(15000), headers: { ...UA, ...headers, ...(cookie() && { cookie: cookie() }) } });
    addCookies(res);
    if ([301, 302, 303, 307, 308].includes(res.status)) { url = new URL(res.headers.get("location"), url).href; if (![307, 308].includes(res.status)) { method = "GET"; body = undefined; } continue; }
    return res;
  }
  throw new Error("Trop de redirections");
}
async function login(user, pass) {
  const res = await http(API + "/cgaAuthentication/authenticate", { method: "POST", headers: { "content-type": "application/json;charset=UTF-8", accept: "application/json", origin: CGA, referer: CGA + "/mypos/" }, body: JSON.stringify({ userName: user, password: pass }) });
  const d = await res.json().catch(() => ({}));
  if (d.returnCode !== "AUT-0001" || !d.token) { const e = new Error(d.message || "Connexion refusée par CGA Canal"); e.auth = true; throw e; }
  const pl = JSON.parse(Buffer.from(d.token.split(".")[1], "base64url").toString());
  const t = await http(OS + "getDistributors", { headers: { accept: "application/json", authorization: "Bearer " + d.token, referer: CGA + "/mypos/" } });
  const dist = await t.json().catch(() => ({})), dd = dist.distributors && dist.distributors[0];
  return { token: d.token, userId: pl.sub, dist: dd ? dd.code : "" };
}
async function call(s, path, body) {
  const res = await http(OS + path, { method: body ? "POST" : "GET", body: body ? JSON.stringify(body) : undefined, headers: { accept: "application/json, text/plain, */*", authorization: "Bearer " + s.token, origin: CGA, referer: CGA + "/mypos/", ...(body && { "content-type": "application/json;charset=UTF-8" }) } });
  const d = await res.json().catch(() => null);
  if (!d) throw new Error("Réponse inattendue de CGA Canal");
  if (d.severity && d.severity !== "SUCCESS") throw new Error(d.message || "Refusé par CGA Canal");
  return d;
}
const fr = (v) => { if (!v) return ""; const d = new Date(Number(v)); return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear(); };

async function search(s, value) {
  const v = String(value || "").trim(); if (v.length < 5) throw new Error("Saisissez au moins 5 caractères");
  const digits = v.replace(/\D/g, ""), cands = [];
  if (v.includes("@")) cands.push(v.toLowerCase());
  else { if (/^6\d{8}$/.test(digits)) cands.push("00237" + digits); else if (/^2376\d{8}$/.test(digits)) cands.push("00" + digits); cands.push(digits); }
  for (const c of [...new Set(cands)]) {
    const qs = new URLSearchParams({ userId: s.userId, distributorNumber: s.dist, subscriberNumber: c, phoneNumber: c, materialNumber: c, email: c });
    let d; try { d = await call(s, "getSubscribers?" + qs); } catch (e) { if (/no matching|not found|aucun|introuvable/i.test(e.message)) continue; throw e; }
    const list = (d.subscribers || []).slice(0, 5);
    if (!list.length) continue;
    const out = [];
    for (const x of list) {
      let dec = "", deb = "";
      try { const h = await call(s, "contractHistory?subscriberNumber=" + x.subscriberNumber + "&contractNumber=" + (x.subscriptionNumber || 1)); dec = (h.currentMaterials && h.currentMaterials[0] && h.currentMaterials[0].materialNumber) || ""; const last = (h.subscriptionHistory || [])[0]; deb = last ? fr(last.start) : ""; } catch (e) {}
      out.push({ name: [x.subscriberFirstName, x.subscriberLastName].filter((t) => t && t !== ".").join(" "), numabo: String(x.subscriberNumber), numdecabo: String(dec), telephone: "", email: "", address: [x.subscriberAddress, x.city, x.country].filter(Boolean).join(", "), bouquet: x.mainOffer || "", debutAbonnement: deb, finAbonnement: fr(x.endOfSubscription), numeroContrat: String(x.subscriptionNumber || ""), status: x.activityCode === "1" ? "actif" : (x.activityLabel || "inactif") });
    }
    return out;
  }
  return [];
}
async function reactivate(s, numero, contrat) {
  const n = parseInt(String(numero || "").replace(/\D/g, ""), 10), c = parseInt(String(contrat || "1").replace(/\D/g, ""), 10) || 1;
  if (!n) throw new Error("Numéro d'abonné manquant");
  if (!(await call(s, "isPossibleToReactivate/" + n + "/" + c)).actionPossible) throw new Error("Réactivation impossible pour ce contrat");
  const d = await call(s, "reactivateSubscription", { numabo: n, numabont: c, user: s.userId });
  return { message: d.message || "Activation en cours" };
}
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return J(405, { message: "Méthode non autorisée" });
  let q; try { q = JSON.parse(event.body || "{}"); } catch (e) { return J(400, { message: "Requête invalide" }); }
  for (const k in jar) delete jar[k];
  if (!q.user || !q.pass) return J(401, { message: "Identifiants CGA Canal manquants" });
  try {
    const s = await login(String(q.user), String(q.pass));
    if (q.action === "test") return J(200, { success: true, message: s.dist ? "Connecté (distributeur " + s.dist + ")" : "Connecté" });
    if (q.action === "search") return J(200, { success: true, abonnes: await search(s, q.value) });
    if (q.action === "reactivate") return J(200, { success: true, ...(await reactivate(s, q.numero, q.contrat)) });
    return J(400, { message: "Action inconnue" });
  } catch (e) { return J(e.auth ? 401 : 502, { success: false, message: e.message || "Erreur CGA Canal" }); }
};
