/* CLARA 4.0 : module Veo Pro. Même organisation que Veo Pro : Accueil (chiffre d'affaires, réabonnement), Souscriptions, Commissions.
   Passe par le relais Netlify /.netlify/functions/veo */
(function () {
  const FN = "/.netlify/functions/veo", $q = id => document.getElementById(id);
  const E = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = n => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) { return ""; } };
  const ts = t => +t || Date.parse(t) || 0, fdt = t => { const n = ts(t); return n ? new Date(n).toLocaleDateString("fr-FR") : "—"; };
  const n9 = v => String(v || "").replace(/\D/g, "").replace(/^237/, "").slice(-9);
  const opDet = n => /^(67|68|65[0-4])/.test(n) ? "MOMO" : /^(69|65[5-9]|640)/.test(n) ? "OM" : "";
  const OPN = { MOMO: "MTN Mobile Money", OM: "Orange Money" }, TL = { RENEWAL: "Réabonnement", UPGRADE: "Migration" };
  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], fdc = d => d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear();
  const pdate = s => { const m = /(\d+)\/(\d+)\/(\d+)/.exec(s || ""); return m ? new Date(+m[3], m[2] - 1, +m[1]) : null; };
  const fnd = (o, k, r = []) => { if (o && typeof o === "object") for (const x in o) { if (x === k && o[x]) r.push(String(o[x])); else fnd(o[x], k, r); } return r; };
  let vt = null, vc = null, PEND = "", RN = null, VTAB = "h", PAGE = 0, CAC = {}; const ITEMS = {};
  try { vt = sessionStorage.getItem("veo_tk"); } catch (e) {}

  const css = document.createElement("style");
  css.textContent = `.vseg{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}.vseg button{flex:1 1 auto;min-width:0;white-space:nowrap;border:1.5px solid var(--line,#ccc);background:var(--card,#fff);color:var(--ink,#111);border-radius:999px;padding:10px 14px;font:inherit;font-weight:600;cursor:pointer}
  .vseg button[aria-pressed=true]{background:var(--red,#d52b3a);border-color:var(--red,#d52b3a);color:#fff}
  .vca{background:linear-gradient(135deg,var(--red,#d52b3a),#7a1020);color:#fff;border-radius:22px;padding:18px 18px 16px;margin:8px 0}.vca small{opacity:.85;display:block}.vca b{font-size:30px;display:block;margin:6px 0 2px}.vca select{background:#ffffff26;color:#fff;border:0;border-radius:12px;padding:8px 10px;width:auto;margin:6px 0 0}.vca option{color:#111}
  .vrow{border:1px solid var(--line,#ddd);background:var(--card,#fff);border-radius:18px;padding:12px 14px;margin:8px 0}.vrow .a{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.vrow .a b{overflow-wrap:anywhere}.vrow .a span{white-space:nowrap;font-weight:700}.vrow small{display:block;color:var(--mute,#777);margin-top:4px;overflow-wrap:anywhere}
  .vrow .sca{margin-top:10px}.vp{font-weight:700}.vp.ok{color:#248a3d}.vp.warn{color:#d9822b}.vp.ko{color:#d94646}
  .vpay{width:100%;white-space:nowrap}.vbox{border:1px solid var(--line,#ddd);background:var(--card,#fff);border-radius:20px;padding:14px 16px;margin:10px 0}`;
  document.head.appendChild(css);

  async function api(path, method = "GET", body, blob) {
    const go = () => fetch(FN, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, method, body, token: vt }) });
    let r = await go();
    if (r.status === 401 && vc && path !== "/auth/login") { await login(vc.u, vc.p); r = await go(); }
    if (!r.ok) { let m = ""; try { m = String((await r.json()).message || ""); } catch (e) {} throw new Error(path === "/auth/login" ? (m || "Identifiants Veo Pro incorrects.") : r.status === 401 ? "Session Veo expirée : reconnectez-vous" : (m || "Erreur " + r.status)); }
    return blob ? r.blob() : r.json();
  }
  const conn = () => { try { return JSON.parse(localStorage.getItem(K("clara_conn")) || "{}") || {}; } catch (e) { return {}; } };
  let lastTry = 0;
  async function autoLogin() {
    const c = conn().veo; if (vt || !c || !c.id || !c.pw || Date.now() - lastTry < 6e4) return !!vt; lastTry = Date.now();
    try { await login(c.id, c.pw); return true; } catch (e) { return false; }
  }
  async function login(u, p) { const j = await api("/auth/login", "POST", { username: u, password: p }); vt = j.token; vc = { u, p }; try { sessionStorage.setItem("veo_tk", vt); } catch (e) {} }
  window.veoLogin = async (u, p) => { await login(u, p); ls("veo_user", u); };

  /* ---------- structure ---------- */
  const sec = document.createElement("section"); sec.dataset.p = "veo"; sec.hidden = true;
  (document.querySelector("main") || document.body).appendChild(sec);
  const nb = document.createElement("button"); nb.type = "button"; nb.title = "Veo Pro"; nb.dataset.to = "veo";
  nb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8 11 8-11"/></svg><span>Veo</span>'; nb.onclick = () => go("veo");
  $q("nav").insertBefore(nb, $q("nav").querySelector('[data-to="reabo"]'));
  { const cf = $q("cvf"); if (cf) cf.addEventListener("load", () => { cf.dataset.ok = "1"; }); }
  const g0 = window.go; window.go = function (p) {
    const r = g0.apply(this, arguments); if (p === "veo" && !sec.hidden) show();
    if (vt && (p === "suivi" || p === "relance" || p === "home")) autoThrottle();
    else if (!vt && ["suivi", "relance", "home", "veo"].includes(p) && typeof token !== "undefined" && token) autoLogin().then(ok => { if (ok && p === "veo" && !sec.hidden) show(); else if (ok) autoThrottle(); });
    return r; };
  /* déconnexion de CLARA : la session Veo est fermée aussi */
  const lo0 = window.logout; window.logout = function () { vt = null; vc = null; CAC = {}; Object.keys(ITEMS).forEach(k => delete ITEMS[k]); try { sessionStorage.removeItem("veo_tk"); } catch (e) {} return lo0.apply(this, arguments); };

  function show() {
    if (!vt) {
      sec.innerHTML = `<h1>Veo Pro</h1><div class="vbox"><div class="msg" style="margin:0 0 10px">Identifiez-vous avec votre compte revendeur Veo Pro pour réabonner vos clients, obtenir les factures et suivre vos commissions.</div><label for="vu">Numéro de téléphone Veo Pro</label><input id="vu" type="tel" inputmode="tel" autocomplete="username" value="${E((conn().veo && conn().veo.id) || ls("veo_user"))}"><label for="vp">Mot de passe</label><input id="vp" type="password" autocomplete="current-password"><div class="acts"><button class="btn" id="vl" type="button">Connexion</button></div><div class="msg" id="vm" role="status"></div></div>`;
      $q("vl").onclick = async () => { const m = $q("vm"); try { m.textContent = "Connexion…"; await login($q("vu").value.trim(), $q("vp").value); ls("veo_user", $q("vu").value.trim()); show(); autoThrottle(); } catch (e) { m.textContent = e.message; } };
      return;
    }
    sec.innerHTML = `<h1>Veo Pro</h1><div class="vseg" id="vtabs" role="group" aria-label="Rubriques Veo">${[["h", "Accueil"], ["s", "Souscriptions"], ["c", "Commissions"]].map(([k, t]) => `<button type="button" data-t="${k}" aria-pressed="${VTAB === k}">${t}</button>`).join("")}</div><div id="vbody"></div><div class="acts"><button class="btn ghost sm" id="vx" type="button">Déconnexion Veo</button></div>`;
    $q("vtabs").querySelectorAll("button").forEach(b => b.onclick = () => { VTAB = b.dataset.t; show(); });
    $q("vx").onclick = () => { vt = null; vc = null; try { sessionStorage.removeItem("veo_tk"); } catch (e) {} show(); };
    ({ h: vHome, s: vSubs, c: vComm })[VTAB]();
  }

  /* ---------- Accueil : chiffre d'affaires + réabonnement ---------- */
  function vHome() {
    $q("vbody").innerHTML = `<div class="vca"><small>Chiffre d’affaires</small><small id="vcp"></small><select id="vcs" aria-label="Période"><option value="m">Ce mois</option><option value="d">Aujourd’hui</option><option value="w">30 derniers jours</option></select><b id="vcv">…</b><small id="vcn"></small></div>
    <div class="vbox"><h2 style="margin:0 0 6px">Effectuer un réabonnement</h2><div class="msg" style="margin:0 0 8px">Numéro de décodeur, nom ou téléphone d’un client enregistré.</div><input id="vd" inputmode="search" value="${E(PEND)}" placeholder="Rechercher un décodeur ou un client"><div class="acts"><button class="btn" id="vg" type="button">Rechercher</button></div><div id="vlist"></div><div id="vr"></div></div>
    <div class="vbox"><h2 style="margin:0 0 6px">Relance fiable</h2><div class="msg" style="margin:0 0 8px">Reprend chez Veo la date de fin et le forfait des clients à relancer.</div><div class="acts"><button class="btn alt" id="vv" type="button">Vérifier les dates avec Veo</button></div><div class="msg" id="va" role="status"></div><div class="acts"><button class="btn alt" id="vdp" type="button">Contrôler les contacts en double</button></div></div>`;
    $q("vcs").onchange = ca; $q("vg").onclick = search; $q("vd").onkeydown = e => { if (e.key === "Enter") search(); }; $q("vv").onclick = () => vall($q("va")); $q("vdp").onclick = dupTel; ca();
    if (PEND) { const d = PEND; PEND = ""; prep(d); }
  }
  async function ca() {
    const per = $q("vcs").value, t = new Date(); t.setHours(0, 0, 0, 0);
    const from = per === "d" ? t.getTime() : per === "m" ? new Date(t.getFullYear(), t.getMonth(), 1).getTime() : t.getTime() - 29 * 864e5;
    $q("vcp").textContent = "Du " + new Date(from).toLocaleDateString("fr-FR") + " au " + new Date().toLocaleDateString("fr-FR");
    const c = CAC[per]; if (c && Date.now() - c.at < 3e5) { paint(c); return; }
    $q("vcv").textContent = "…"; $q("vcn").textContent = "";
    try {
      let sum = 0, cnt = 0;
      for (let p = 1; p <= 30; p++) {
        const j = await api("/cga-subs?page=" + p + "&limit=100&sort=id,DESC"), d = j.data || []; if (!d.length) break; let old = false;
        for (const x of d) { if (ts(x.created_at) < from) { old = true; continue; } if ((x.transaction?.status || x.subscription_status) === "SUCCESSFUL") { sum += +x.amount || 0; cnt++; } }
        if (old) break;
      }
      CAC[per] = { sum, cnt, at: Date.now() }; if ($q("vcs") && $q("vcs").value === per) paint(CAC[per]);
    } catch (e) { if ($q("vcn")) $q("vcn").textContent = e.message; }
  }
  const paint = c => { if (!$q("vcv")) return; $q("vcv").textContent = money(c.sum); $q("vcn").textContent = c.cnt + " souscription(s) réussie(s)"; };
  async function search() {
    const v = $q("vd").value.trim(), box = $q("vlist"); if (!v) return;
    if (/^\d{10,}$/.test(v)) { box.innerHTML = ""; prep(v); return; }
    const f = v.toLowerCase(), L = typeof cli === "function" ? Object.values(cli()).filter(r => r && r.dec && [r.nom, r.tel, r.t0, r.ab, r.dec].join(" ").toLowerCase().includes(f)).slice(0, 8) : [];
    box.innerHTML = L.map(r => `<button type="button" class="vrow" style="display:block;width:100%;text-align:left" data-d="${E(r.dec)}"><b>${E(r.nom)}</b><small>Décodeur ${E(r.dec)}${r.fin ? " • fin " + E(fdt(Date.parse(r.fin))) : ""}</small></button>`).join("") || '<div class="msg">Aucun client enregistré trouvé.</div>';
    box.querySelectorAll("button[data-d]").forEach(b => b.onclick = () => { box.innerHTML = ""; prep(b.dataset.d); });
  }

  /* ---------- préparation d'un réabonnement ---------- */
  async function prep(d) {
    const box = $q("vr"); if (!box) { PEND = d; show(); return; }
    box.innerHTML = '<div class="msg">Chargement…</div>';
    try {
      const j = await api("/cga-subs/init/v2", "POST", { decoder_number: d }), sb = j.subscriber || {}, P = sb.packs?.packs || {}, O = sb.packs?.options || {};
      const types = ["RENEWAL", "UPGRADE"].filter(t => (P[t] || []).length);
      if (!types.length) throw new Error("Aucune offre disponible chez Veo pour ce décodeur.");
      const rec = typeof recFor === "function" ? recFor({ numdecabo: String(d) }) : null, contact = n9(rec && (rec.tel || rec.t0));
      RN = { id: j.identifier, d, P, O, types, type: types[0], sel: new Set(), sb, sub: fnd(sb, "subscriber_number")[0] || fnd(sb, "numabo")[0] || "", name: ((sb.customer?.first_name || "") + " " + (sb.customer?.last_name || "")).trim(), op: "", hadRec: !!rec, prevEnd: pdate(sb.subscription_date?.end) };
      box.innerHTML = `<div class="vrow" style="margin-top:12px"><div class="a"><b>${E(RN.name || "Client")}</b><span>${E(sb.option || "")}</span></div><small>Décodeur ${E(d)} • fin ${E(sb.subscription_date?.end || "—")} • ${E(sb.contract?.active?.label || "")}${rec ? "" : " • nouveau client : il sera enregistré après le paiement"}</small>${sb.contract?.promo?.length ? "<small><b>Promotion :</b> " + E(JSON.stringify(sb.contract.promo)) + "</small>" : ""}</div>
      <label>Type de souscription</label><div class="vseg" id="vty" role="group" aria-label="Type de souscription">${types.map(t => `<button type="button" data-t="${t}" aria-pressed="${t === RN.type}">${TL[t]}</button>`).join("")}</div>
      <label for="vpk">Offre</label><select id="vpk"></select>
      <label for="vdu">Durée</label><select id="vdu">${[1, 2, 3, 6, 12].map(n => `<option value="${n}">${n} mois</option>`).join("")}</select>
      <label>Options</label><div class="vseg" id="vop" role="group" aria-label="Options"></div>
      ${rec ? "" : `<label for="vct">Téléphone du client (contact de relance, obligatoire)</label><input id="vct" type="tel" inputmode="tel" placeholder="6XXXXXXXX">`}
      <label for="vnp">Numéro de paiement${contact ? " (contact du client)" : ""}</label><input id="vnp" type="tel" inputmode="tel" value="${E(contact)}" placeholder="6XXXXXXXX">
      <div class="vseg" id="vmt" role="group" aria-label="Moyen de paiement">${Object.keys(OPN).map(k => `<button type="button" data-m="${k}" aria-pressed="false">${OPN[k]}</button>`).join("")}</div><div class="msg" id="vdt"></div>
      <div class="acts"><button class="btn vpay" id="vpay" type="button">Payer</button></div><div class="msg" id="vst" role="status"></div>`;
      $q("vty").querySelectorAll("button").forEach(b => b.onclick = () => setType(b.dataset.t));
      $q("vmt").querySelectorAll("button").forEach(b => b.onclick = () => { RN.op = b.dataset.m; ops(); });
      RN.edited = false; $q("vnp").oninput = () => { RN.edited = true; detect(); };
      if ($q("vct")) $q("vct").oninput = () => { if (!RN.edited) { $q("vnp").value = n9($q("vct").value); detect(); } }; $q("vpk").onchange = () => { RN.sel.clear(); opts(); }; $q("vdu").onchange = tot; $q("vpay").onclick = pay;
      setType(RN.type); detect(); box.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) { box.innerHTML = `<div class="msg err">${E(e.message)}</div>`; }
  }
  function detect() {
    const n = n9($q("vnp").value), o = opDet(n);
    RN.op = o;
    if (o) { $q("vdt").textContent = OPN[o] + " détecté automatiquement."; } else { $q("vdt").textContent = n.length >= 3 ? "Opérateur non reconnu : choisissez le moyen de paiement." : "Saisissez le numéro de paiement : l’opérateur est détecté automatiquement."; }
    ops();
  }
  const ops = () => $q("vmt").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === RN.op)));
  function setType(t) {
    RN.type = t; RN.sel.clear(); $q("vty").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.t === t)));
    $q("vpk").innerHTML = RN.P[t].map(p => `<option value="${E(p.identifier)}">${E(p.label)} — ${p.price} FCFA</option>`).join(""); opts();
  }
  const curPack = () => (RN.P[RN.type] || []).find(x => x.identifier === $q("vpk").value);
  const curOpts = () => { const p = curPack(); return (RN.O[RN.type] || []).filter(o => !o.allowed_for_pack || o.allowed_for_pack === p?.identifier); };
  function opts() {
    const box = $q("vop"), L = curOpts();
    box.innerHTML = L.length ? L.map(o => `<button type="button" data-id="${E(o.identifier)}" aria-pressed="${RN.sel.has(o.identifier)}">${RN.sel.has(o.identifier) ? "✓ " : ""}${E(o.label)} +${o.price}</button>`).join("") : '<span class="msg">Aucune option pour cette offre.</span>';
    box.querySelectorAll("button").forEach(b => b.onclick = () => { const id = b.dataset.id; RN.sel.has(id) ? RN.sel.delete(id) : RN.sel.add(id); opts(); }); tot();
  }
  const total = () => { const p = curPack(), n = +$q("vdu").value, o = curOpts().filter(x => RN.sel.has(x.identifier)).reduce((s, x) => s + x.price, 0); return p ? (p.price + o) * n : 0; };
  function tot() { $q("vpay").textContent = "Payer · " + money(total()) + " (estimé)"; }
  async function pay() {
    const p = curPack(), n = +$q("vdu").value, s = $q("vst"), type = RN.type, num = n9($q("vnp").value), m = RN.op, op = curOpts().filter(x => RN.sel.has(x.identifier)).map(x => x.identifier);
    const ct = RN.hadRec ? "" : n9($q("vct") ? $q("vct").value : "");
    if (!RN.hadRec && ct.length !== 9) { s.textContent = "Le téléphone du client est obligatoire (9 chiffres) pour l’enregistrer et le relancer."; return; }
    if (num.length !== 9) { s.textContent = "Numéro de paiement invalide (9 chiffres)."; return; }
    if (!m) { s.textContent = "Choisissez le moyen de paiement."; return; }
    if (!confirm("Confirmer le paiement ?\n" + TL[type] + " : " + p.label + " × " + n + " mois" + (op.length ? " + " + op.length + " option(s)" : "") + "\nDécodeur " + RN.d + "\n" + OPN[m] + " " + num)) return;
    $q("vpay").disabled = true;
    try {
      const r = await api("/cga-subs/confirm/v2", "POST", { identifier: RN.id, duration: n, pack_identifier: p.identifier, pack_options: op, payment_account_number: num, payment_method: m, subscription_type: type, source: "MOBILE_APP", phone: num });
      s.textContent = "Demande envoyée (" + money(r.amount) + "). Validez le paiement sur votre téléphone…";
      for (let i = 0; i < 24; i++) {
        await new Promise(z => setTimeout(z, 5000));
        const l = await api("/cga-subs?page=1&limit=5&sort=id,DESC"), x = (l.data || []).find(y => y.id === r.id), st = x?.transaction?.status || x?.subscription_status;
        s.textContent = "Statut : " + st;
        if (x && st !== "PENDING") {
          ITEMS[r.id] = x; CAC = {}; s.innerHTML = "Statut : <b>" + E(st) + `</b><div class="sca"><button class="btn alt sm" type="button" id="vfa">Facture Veo</button><button class="btn sm" type="button" id="vfe">Facture entreprise</button></div>`; $q("vfa").onclick = () => inv(r.id); $q("vfe").onclick = () => facEnt(r.id);
          if (st === "SUCCESSFUL") { markApplied(r.id); enreg(TL[type] + " : " + p.label + " × " + n + " mois", ct); s.insertAdjacentHTML("beforeend", '<div class="msg" id="vup">Mise à jour de la fiche client…</div>'); afterPay(RN.d, RN.prevEnd, n, $q("vup")); } return;
        }
      }
      s.textContent += " — toujours en attente : ne relancez pas le paiement, vérifiez dans Souscriptions.";
    } catch (e) { s.textContent = e.message + " (vérifiez dans Souscriptions avant de réessayer)"; }
  }
  /* Après un réabonnement réussi : le client est enregistré s'il ne l'est pas encore (relance et suivi possibles) */
  function enreg(detail, contact) {
    try {
      let r = recFor({ numabo: RN.sub, numdecabo: RN.d });
      if (!r) {
        const k = String(RN.sub || RN.d), now = Date.now(), tel = contact || "";
        r = { k, tel, t0: "", tmod: tel ? now : 0, ts: now, mod: now, up: now, src: "man", nom: RN.name || "Client Veo", ab: String(RN.sub || ""), dec: String(RN.d), mail: "", adr: "", f: String(RN.sb.option || ""), deb: "", fin: "", st: "actif", ctr: "" };
        cli()[k] = r; if (!putCli()) { delete cli()[k]; return; } logAct("Client enregistré (réabonnement Veo)", r);
      }
      logAct("Réabonnement Veo", r, { detail }); putCli(); try { lstRefresh(); } catch (e) {}
    } catch (e) {}
  }

  /* ---------- Souscriptions ---------- */
  function vSubs() {
    PAGE = 0; $q("vbody").innerHTML = '<div id="vsl"></div><div class="acts"><button class="btn alt" id="vmore" type="button">Charger plus</button></div><div class="msg" id="vsm"></div>';
    $q("vmore").onclick = more; more();
  }
  async function more() {
    const m = $q("vsm"); try {
      m.textContent = "Chargement…"; const j = await api("/cga-subs?page=" + (++PAGE) + "&limit=15&sort=id,DESC"), d = j.data || [];
      $q("vsl").insertAdjacentHTML("beforeend", d.map(t => { ITEMS[t.id] = t; const st = t.transaction?.status || t.subscription_status, c = st === "SUCCESSFUL" ? "ok" : st === "PENDING" ? "warn" : "ko";
        return `<div class="vrow"><div class="a"><b>${E(t.data?.customer_name || t.decoder_number)}</b><span>${money(t.amount)}</span></div><small>${E(fdt(t.created_at))} • ${E(t.pack_label)} • <span class="vp ${c}">${E(st)}</span></small><div class="sca"><button class="btn alt sm" type="button" data-i="${t.id}">Facture Veo</button><button class="btn sm" type="button" data-e="${t.id}">Facture entreprise</button></div></div>`; }).join(""));
      $q("vsl").querySelectorAll("button[data-i]").forEach(b => b.onclick = () => inv(b.dataset.i)); $q("vsl").querySelectorAll("button[data-e]").forEach(b => b.onclick = () => facEnt(b.dataset.e));
      m.textContent = d.length ? "" : "Plus aucune opération."; if (!d.length) $q("vmore").hidden = true;
    } catch (e) { m.textContent = e.message; }
  }

  /* ---------- Commissions et retrait ---------- */
  async function vComm() {
    const c = $q("vbody"); c.innerHTML = '<div class="vbox" id="vcm">Chargement…</div>';
    try {
      const [h, t] = await Promise.all([api("/users/balance-histories?limit=30"), api("/transfers?page=1&limit=8&sort=id,DESC&sub_merchant_id=-1")]), b = {};
      for (const x of h.data || []) b[x.balance_type] ??= x.balance_after;
      $q("vcm").innerHTML = `<h2 style="margin:0 0 8px">Mes soldes</h2>${Object.entries(b).map(([k, v]) => `<div class="a" style="display:flex;justify-content:space-between"><span>${E(k)}</span><b>${money(v)}</b></div>`).join("") || "Aucun solde trouvé."}
      <h2 style="margin:16px 0 6px">Retrait vers mon numéro</h2><div class="vseg" id="vwt" role="group"><button type="button" data-t="COMMISSION" aria-pressed="true">Commission</button><button type="button" data-t="BALANCE" aria-pressed="false">Solde</button></div>
      <input id="vwa" type="number" inputmode="numeric" placeholder="Montant (FCFA)"><div class="acts"><button class="btn" id="vwg" type="button">Retirer</button></div>
      <h2 style="margin:16px 0 6px">Derniers retraits</h2>${(t.data || []).map(x => `<div class="vrow"><div class="a"><b>${money(x.amount)}</b><span>${E(x.transaction?.status || "")}</span></div><small>${E(fdt(x.created_at))} • ${E(x.balance_type)}</small></div>`).join("") || "Aucun retrait."}`;
      let ty = "COMMISSION"; $q("vwt").querySelectorAll("button").forEach(bt => bt.onclick = () => { ty = bt.dataset.t; $q("vwt").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === bt))); });
      $q("vwg").onclick = async () => {
        const a = Math.floor(+$q("vwa").value); if (!(a > 0)) return alert("Montant invalide");
        if (!confirm("Retirer " + money(a) + " (" + ty + ") vers votre numéro " + (vc?.u || "") + " ?\nFrais ≈ 2 % : " + money(Math.round(a * 2) / 100))) return;
        try { const r = await api("/transfers/user-balance", "POST", { amount: a, balance_type: ty }); alert("Retrait lancé : " + (r.transaction?.status || "ok")); vComm(); } catch (e) { alert(e.message); }
      };
    } catch (e) { $q("vcm").textContent = e.message; }
  }

  /* ---------- Veo = source de vérité pour l'échéance ---------- */
  const sleep = ms => new Promise(z => setTimeout(z, ms));
  const applied = () => { try { return new Set(JSON.parse(ls("veo_applied") || "[]")); } catch (e) { return new Set(); } };
  const markApplied = id => { const a = applied(); a.add(id); ls("veo_applied", JSON.stringify([...a].slice(-300))); };
  async function vsync(dec) {
    const j = await api("/cga-subs/init/v2", "POST", { decoder_number: dec }), sb = j.subscriber || {}, d = pdate(sb.subscription_date?.end);
    if (!d) throw new Error("Date de fin introuvable chez Veo");
    const r = recFor({ numdecabo: String(dec) }), n = iso(d); if (!r) return { d, changed: false, none: true };
    if (r.est && parseD(r.fin) && d.getTime() < parseD(r.fin).getTime()) return { d, changed: false, pending: true };
    const old = r.fin, ch = old !== n || (sb.option && r.f !== String(sb.option));
    r.fin = n; r.est = 0; if (sb.option) r.f = String(sb.option); r.vok = Date.now();
    if (ch) { r.mod = Date.now(); try { logAct("Fin d’abonnement vérifiée (Veo)", r, { detail: (old || "?") + " → " + n }); } catch (e) {} }
    putCli(); return { d, changed: ch };
  }
  /* Après un réabonnement : la fiche est mise à jour dès que Veo a pris en compte la nouvelle échéance */
  async function afterPay(dec, prev, months, el) {
    const say2 = t => { if (el) el.textContent = t; };
    for (let i = 0; i < 8; i++) {
      try { const r = await vsync(dec); if (r.d && (!prev || r.d.getTime() > prev.getTime())) { say2("Fiche client mise à jour : fin d’abonnement le " + r.d.toLocaleDateString("fr-FR") + "."); try { lstRefresh(); } catch (e) {} return; } } catch (e) {}
      say2("Veo met à jour l’échéance… (" + (i + 1) + "/8)"); await sleep(6000);
    }
    const rec = recFor({ numdecabo: String(dec) });
    if (rec) { rec.fin = iso(new Date(Math.max(prev ? prev.getTime() : 0, Date.now()) + 30 * (months || 1) * 864e5)); rec.est = 1; rec.mod = Date.now(); putCli(); try { lstRefresh(); } catch (e) {} }
    say2("Veo n’a pas encore mis à jour l’échéance : la fiche porte une date estimée (" + (rec ? fdt(Date.parse(rec.fin)) : "—") + "), recontrôlée avec « Actualiser les dates ».");
  }
  /* Réabonnements faits dans Veo (même en dehors de CLARA) : appliqués aux fiches */
  let autoBusy = false;
  async function autoSync() {
    if (autoBusy) return { n: 0, created: 0 }; autoBusy = true;
    try { return await autoSync0(); } finally { autoBusy = false; }
  }
  async function autoSync0() {
    const j = await api("/cga-subs?page=1&limit=40&sort=id,DESC"), done = applied(), lim = Date.now() - 10 * 864e5, seen = new Set(); let n = 0, created = 0;
    for (const x of (j.data || [])) {
      if ((x.transaction?.status || x.subscription_status) !== "SUCCESSFUL" || ts(x.created_at) < lim || done.has(x.id)) continue;
      ITEMS[x.id] = x; const dec = String(x.decoder_number || ""); if (!dec) continue;
      if (!seen.has(dec)) {
        seen.add(dec);
        let r = recFor({ numabo: String(x.subscriber_number || ""), numdecabo: dec });
        if (!r) {
          const k = String(x.subscriber_number || dec), now = Date.now();
          r = { k, tel: "", t0: "", tmod: 0, ts: now, mod: now, up: now, src: "man", nom: x.data?.customer_name || "Client Veo", ab: String(x.subscriber_number || ""), dec, mail: "", adr: "", f: String(x.pack_label || ""), deb: "", fin: "", st: "actif", ctr: "", noc: 1 };
          cli()[k] = r; if (!putCli()) { delete cli()[k]; continue; } created++; try { logAct("Client enregistré (réabonnement Veo détecté)", r); } catch (e) {}
        }
        try { await vsync(dec); } catch (e) { continue; }
        try { logAct("Réabonnement Veo (détecté)", r, { detail: (x.pack_label || "") + " · " + money(x.amount) }); } catch (e) {}
        n++; await sleep(300);
      }
      markApplied(x.id);
    }
    putCli(); return { n, created };
  }
  let lastAuto = 0;
  const autoThrottle = () => { if (Date.now() - lastAuto < 18e4) return; lastAuto = Date.now(); autoSync().then(r => { if (r.n) { try { lstRefresh(); } catch (e) {} } }).catch(() => {}); };
  async function vall(out) {
    out = (out && out.nodeType) ? out : $q("va"); const say2 = t => { if (out) out.textContent = t; };
    let det = 0, cre = 0;
    if (vt) { try { say2("Recherche des réabonnements Veo récents…"); const r = await autoSync(); det = r.n; cre = r.created; } catch (e) { if (/expirée|Identifiants/.test(e.message)) say2(e.message + " — actualisation depuis le serveur CLARA uniquement."); } }
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const lim = t0.getTime() + (jr() + 4) * 864e5, old = t0.getTime() - 120 * 864e5;
    const list = Object.values(cli()).filter(r => (r.dec || r.ab) && (r.est || !r.fin || (parseD(r.fin) && parseD(r.fin).getTime() <= lim && parseD(r.fin).getTime() >= old))).slice(0, 80);
    let ok = 0, ch = 0, ko = 0, veoOn = !!vt;
    for (let i = 0; i < list.length; i++) {
      say2("Actualisation " + (i + 1) + " / " + list.length + "…"); const r = list[i]; let done = false;
      if (veoOn && r.dec) { try { const o = await vsync(r.dec); ok++; if (o.changed) ch++; done = true; } catch (e) { if (/expirée|Identifiants/.test(e.message)) veoOn = false; } }
      if (!done) { try { const o = await refreshRec(r); if (!o.err) { ok++; if (o.ch) ch++; done = true; } else if (o.err === "auth") { say2("Session CLARA expirée : reconnectez-vous."); return; } } catch (e) {} }
      if (!done) ko++; await sleep(350);
    }
    say2((det ? det + " réabonnement(s) Veo appliqué(s). " : "") + (cre ? cre + " nouveau(x) client(s) à compléter (contact). " : "") + ok + " fiche(s) actualisée(s)" + (ch ? ", " + ch + " modifiée(s)" : "") + (ko ? ", " + ko + " introuvable(s)" : "") + ".");
    try { lstRefresh(); } catch (e) {}
  }

  /* ---------- contacts : un même numéro sur plusieurs fiches est presque toujours une erreur ---------- */
  function dupTel() {
    const o = $q("va"), g = {}; Object.values(cli()).forEach(r => { const n = n9(r.tel); if (n.length === 9) (g[n] = g[n] || []).push(r); });
    const L = Object.entries(g).filter(([, a]) => a.length >= 3).sort((a, b) => b[1].length - a[1].length);
    if (!L.length) { o.textContent = "Aucun numéro n’est partagé par 3 clients ou plus."; return; }
    let fixed = 0;
    for (const [n, a] of L) {
      if (!confirm("Le numéro " + n + " est enregistré sur " + a.length + " fiches (" + a.slice(0, 4).map(r => r.nom).join(", ") + (a.length > 4 ? "…" : "") + ").\nLe retirer de ces fiches ?\n(Le numéro fourni par le serveur est rétabli quand il existe.)")) continue;
      a.forEach(r => { const t0 = n9(r.t0); r.tel = t0 && t0 !== n ? r.t0 : ""; r.tmod = 0; r.mod = Date.now(); fixed++; });
    }
    if (fixed) { putCli(); try { lstRefresh(); } catch (e) {} }
    o.textContent = fixed + " fiche(s) corrigée(s). Les clients sans contact sont à compléter dans leur fiche.";
  }

  /* ---------- factures ---------- */
  async function facEnt(id) {
    const t = ITEMS[id]; if (!t) { alert("Opération introuvable : rechargez la liste."); return; }
    try {
      const at = new Date(ts(t.created_at)), prev = pdate(t.data?.subscription_end), per = t.period || 1,
        fin = new Date(Math.max(prev ? prev.getTime() : 0, at.getTime()) + 30 * per * 864e5),
        rec = typeof recFor === "function" ? recFor({ numabo: String(t.subscriber_number || ""), numdecabo: String(t.decoder_number || "") }) : null,
        f = { date: fdc(at), ref: "VEO-" + t.id, nom: t.data?.customer_name || "", tel: rec?.tel || "", adresse: rec?.adr || "", abonne: String(t.subscriber_number || "-"), decodeur: String(t.decoder_number || ""),
          forfait: (t.pack_label || "") + " (" + Math.round(t.amount || 0) + " FCFA)", option: "-", duree: per === 1 ? "1 mois" : per + " mois", fin: fdc(fin), prix: String(Math.round(t.amount || 0)) };
      const same = Object.values(ITEMS).filter(x => String(x.decoder_number) === String(t.decoder_number) && (x.transaction?.status || x.subscription_status) === "SUCCESSFUL");
      if (same.every(x => x.id <= t.id)) { try { const e = await api("/cga-subs/init/v2", "POST", { decoder_number: String(t.decoder_number) }), d = pdate(e.subscriber?.subscription_date?.end); if (d) f.fin = fdc(d); } catch (e) {} }
      let pdf = null; try { pdf = await api("/cga-subs/" + id + "/pdf", "GET", null, true); } catch (e) {}
      if (document.body.dataset.mode === "simple" && typeof applyMode === "function") applyMode("adv", false);
      go("convert"); const fr = $q("cvf"), send = () => fr.contentWindow.postMessage({ clara: "veo-invoice", f, pdf }, "*");
      if (fr.dataset.ok === "1") send(); else fr.addEventListener("load", send, { once: true });
    } catch (e) { alert(e.message); }
  }
  async function inv(id) { try { const b = await api("/cga-subs/" + id + "/pdf", "GET", null, true), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "facture-" + id + ".pdf"; a.click(); } catch (e) { alert(e.message); } }

  /* ---------- raccourcis dans CLARA ---------- */
  function open(dec) { PEND = String(dec || "").replace(/\D/g, ""); VTAB = "h"; go("veo"); }
  window.veoOpen = open;
  function addBtn(parentId, id, label, fn, before) {
    const p = $q(parentId); if (!p || $q(id)) return;
    const x = document.createElement("button"); x.type = "button"; x.id = id; x.className = "btn alt"; x.textContent = label; x.onclick = fn;
    if (before && $q(before)) p.insertBefore(x, $q(before)); else p.appendChild(x);
  }
  const curDec = () => (typeof cur !== "undefined" && cur ? cur.numdecabo : "");
  const chkFn = async () => {
    const d = curDec(); if (!d) return; if (!vt) { alert("Connectez-vous d’abord dans l’onglet Veo."); return; }
    try { const r = await vsync(d); try { const rc = recFor({ numdecabo: String(d) }); if (rc) cur = curOf(rc); } catch (e) {} alert("Fin d’abonnement chez Veo : " + r.d.toLocaleDateString("fr-FR") + (r.changed ? "\nLa fiche a été corrigée." : "\nLa fiche était déjà exacte.") + (r.none ? "\n(Client non enregistré dans CLARA.)" : "")); } catch (e) { alert(e.message); }
  };
    { const rr = $q("rrl"); if (rr && rr.parentNode) { [["vb2", "Réabonner (Veo)", () => open(curDec())], ["vc2", "Vérifier (Veo)", chkFn]].forEach(([id, t, fn]) => { if ($q(id)) return; const x = document.createElement("button"); x.type = "button"; x.id = id; x.className = id === "vb2" ? "btn" : "btn alt"; x.textContent = t; x.onclick = fn; rr.parentNode.insertBefore(x, rr); }); } }

  { const sb = $q("sref"); if (sb) sb.onclick = () => vall($q("srefm")); }
  if (vt) setTimeout(autoThrottle, 2500); else if (typeof token !== "undefined" && token) setTimeout(() => autoLogin().then(ok => { if (ok) autoThrottle(); }), 1500);
})();
