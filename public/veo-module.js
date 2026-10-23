/* CLARA 3.0 : module Veo Pro (réabonnement, facture, commissions, retrait). Passe par le relais Netlify /.netlify/functions/veo */
(function () {
  const FN = "/.netlify/functions/veo", $q = id => document.getElementById(id);
  const E = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = n => Number(n || 0).toLocaleString("fr-FR") + " FCFA";
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) { return ""; } };
  const fdt = t => { const n = +t || Date.parse(t); return n ? new Date(n).toLocaleDateString("fr-FR") : "—"; };
  let vt = null, vc = null, PEND = "", RN = null; const ITEMS = {};
  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], fdc = d => d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear();
  const pdate = s => { const m = /(\d+)\/(\d+)\/(\d+)/.exec(s || ""); return m ? new Date(+m[3], m[2] - 1, +m[1]) : null; };
  try { vt = sessionStorage.getItem("veo_tk"); } catch (e) {}

  async function api(path, method = "GET", body, blob) {
    const go = () => fetch(FN, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, method, body, token: vt }) });
    let r = await go();
    if (r.status === 401 && vc && path !== "/auth/login") { await login(vc.u, vc.p); r = await go(); }
    if (!r.ok) { let m = ""; try { m = String((await r.json()).message || ""); } catch (e) {} throw new Error(r.status === 401 ? "Session Veo expirée : reconnectez-vous" : (m || "Erreur " + r.status)); }
    return blob ? r.blob() : r.json();
  }
  async function login(u, p) { const j = await api("/auth/login", "POST", { username: u, password: p }); vt = j.token; vc = { u, p }; try { sessionStorage.setItem("veo_tk", vt); } catch (e) {} }

  /* ---- interface ---- */
  const sec = document.createElement("section"); sec.dataset.p = "veo"; sec.hidden = true;
  (document.querySelector("main") || document.body).appendChild(sec);
  const nb = document.createElement("button"); nb.type = "button"; nb.title = "Veo Pro"; nb.dataset.to = "veo";
  nb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l8 11 8-11"/></svg><span>Veo</span>'; nb.onclick = () => go("veo");
  $q("nav").appendChild(nb);
  { const cf = $q("cvf"); if (cf) cf.addEventListener("load", () => { cf.dataset.ok = "1"; }); }
  const g0 = window.go; window.go = function (p) { const r = g0.apply(this, arguments); if (p === "veo" && !sec.hidden) show(); return r; };

  function show() {
    if (!vt) {
      sec.innerHTML = `<h1>Veo Pro</h1><div class="card" style="padding:14px 16px"><label for="vu">Numéro de téléphone Veo Pro</label><input id="vu" type="tel" inputmode="tel" autocomplete="username" value="${E(ls("veo_user"))}"><label for="vp">Mot de passe</label><input id="vp" type="password" autocomplete="current-password"><div class="acts"><button class="btn" id="vl" type="button">Connexion</button></div><div class="msg" id="vm" role="status"></div></div>`;
      $q("vl").onclick = async () => { const m = $q("vm"); try { m.textContent = "Connexion…"; await login($q("vu").value.trim(), $q("vp").value); ls("veo_user", $q("vu").value.trim()); show(); } catch (e) { m.textContent = e.message; } };
      return;
    }
    sec.innerHTML = `<h1>Veo Pro</h1><h2>Réabonnement</h2><div class="card" style="padding:14px 16px"><label for="vd">N° décodeur</label><input id="vd" inputmode="numeric" value="${E(PEND)}" placeholder="Numéro de décodeur"><div class="acts"><button class="btn" id="vg" type="button">Préparer</button></div><div id="vr"></div></div>
    <h2>Relance fiable</h2><div class="card" style="padding:14px 16px"><div class="msg" style="margin:0 0 8px">Reprend chez Veo la date de fin et le forfait des clients à relancer, pour que la relance soit identique à Veo.</div><div class="acts"><button class="btn" id="vv" type="button">Vérifier les dates avec Veo</button></div><div class="msg" id="va" role="status"></div></div><h2>Opérations récentes</h2><div class="card" id="vh" style="padding:14px 16px">Chargement…</div>
    <h2>Commissions et retrait</h2><div class="card" id="vc" style="padding:14px 16px">Chargement…</div>
    <div class="acts"><button class="btn ghost" id="vx" type="button">Déconnexion Veo</button></div>`;
    $q("vg").onclick = () => prep($q("vd").value.replace(/\D/g, ""));
    $q("vv").onclick = vall; $q("vx").onclick = () => { vt = null; vc = null; try { sessionStorage.removeItem("veo_tk"); } catch (e) {} show(); };
    if (PEND) { const d = PEND; PEND = ""; prep(d); }
    recent(); acc();
  }

  /* Veo = source de vérité pour l'échéance : met à jour la fiche CLARA (date de fin, forfait) sans toucher au contact */
  async function vsync(dec) {
    const j = await api("/cga-subs/init/v2", "POST", { decoder_number: dec }), sb = j.subscriber || {}, d = pdate(sb.subscription_date?.end);
    if (!d) throw new Error("Date de fin introuvable chez Veo");
    const r = recFor({ numdecabo: String(dec) }), n = iso(d); if (!r) return { d, changed: false, none: true };
    const old = r.fin, ch = old !== n || (sb.option && r.f !== String(sb.option));
    r.fin = n; if (sb.option) r.f = String(sb.option); r.vok = Date.now();
    if (ch) { r.mod = Date.now(); try { logAct("Fin d’abonnement vérifiée (Veo)", r, { detail: (old || "?") + " → " + n }); } catch (e) {} }
    putCli(); return { d, changed: ch };
  }
  async function vall() {
    const o = $q("va"), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const lim = t0.getTime() + (jr() + 4) * 864e5, old = t0.getTime() - 120 * 864e5;
    const list = Object.values(cli()).filter(r => r.dec && (!r.fin || (parseD(r.fin) && parseD(r.fin).getTime() <= lim && parseD(r.fin).getTime() >= old))).slice(0, 80);
    if (!list.length) { o.textContent = "Aucun client à vérifier."; return; }
    let ok = 0, ch = 0, ko = 0;
    for (let i = 0; i < list.length; i++) {
      o.textContent = "Vérification " + (i + 1) + " / " + list.length + "…";
      try { const r = await vsync(list[i].dec); ok++; if (r.changed) ch++; } catch (e) { ko++; if (/expirée|Identifiants/.test(e.message)) { o.textContent = e.message; return; } }
      await new Promise(z => setTimeout(z, 350));
    }
    o.textContent = ok + " vérifié(s) chez Veo, " + ch + " date(s) corrigée(s), " + ko + " introuvable(s) (non gérés par votre compte Veo).";
  }
  async function prep(d) {
    const box = $q("vr"); if (!d) { box.innerHTML = '<div class="msg">Saisissez un numéro de décodeur.</div>'; return; }
    box.innerHTML = '<div class="msg">Chargement…</div>';
    try {
      const j = await api("/cga-subs/init/v2", "POST", { decoder_number: d }), sb = j.subscriber || {}, P = sb.packs?.packs || {}, O = sb.packs?.options || {};
      const types = ["RENEWAL", "UPGRADE"].filter(t => (P[t] || []).length);
      if (!types.length) throw new Error("Aucune offre disponible chez Veo pour ce décodeur.");
      RN = { id: j.identifier, d, P, O, types, type: types[0], sel: new Set(), name: ((sb.customer?.first_name || "") + " " + (sb.customer?.last_name || "")).trim() };
      box.innerHTML = `<div class="msg" style="margin:8px 0">${E(RN.name)} • offre ${E(sb.option)} • fin ${E(sb.subscription_date?.end || "")} • ${E(sb.contract?.active?.label || "")}${sb.contract?.promo?.length ? "<br><b>Promotion :</b> " + E(JSON.stringify(sb.contract.promo)) : ""}</div>
      <label>Type de souscription</label><div class="seg" id="vty" role="group" aria-label="Type de souscription">${types.map(t => `<button type="button" data-t="${t}" aria-pressed="${t === RN.type}">${TL[t]}</button>`).join("")}</div>
      <label for="vpk">Offre</label><select id="vpk"></select>
      <label for="vdu">Durée</label><select id="vdu">${[1, 2, 3, 6, 12].map(n => `<option value="${n}">${n} mois</option>`).join("")}</select>
      <label>Options (touchez pour choisir)</label><div class="seg" id="vop" role="group" aria-label="Options" style="flex-wrap:wrap"></div>
      <label for="vmt">Paiement</label><select id="vmt"><option value="MOMO">MTN Mobile Money</option><option value="OM">Orange Money</option></select>
      <label for="vnp">Numéro qui paie (9 chiffres)</label><input id="vnp" type="tel" inputmode="tel" value="${E(ls("veo_payer"))}" placeholder="6XXXXXXXX">
      <div class="msg" id="vtt" style="margin:8px 0"></div><div class="acts"><button class="btn" id="vpay" type="button">Payer</button></div><div class="msg" id="vst" role="status"></div>`;
      $q("vty").querySelectorAll("button").forEach(b => b.onclick = () => setType(b.dataset.t));
      $q("vpk").onchange = () => { RN.sel.clear(); opts(); }; $q("vdu").onchange = tot; $q("vpay").onclick = pay; setType(RN.type);
    } catch (e) { box.innerHTML = `<div class="msg err">${E(e.message)}</div>`; }
  }
  const TL = { RENEWAL: "Réabonnement", UPGRADE: "Migration" };
  function setType(t) {
    RN.type = t; RN.sel.clear();
    $q("vty").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.t === t)));
    $q("vpk").innerHTML = RN.P[t].map(p => `<option value="${E(p.identifier)}">${E(p.label)} — ${p.price} FCFA</option>`).join(""); opts();
  }
  const curPack = () => (RN.P[RN.type] || []).find(x => x.identifier === $q("vpk").value);
  const curOpts = () => { const p = curPack(); return (RN.O[RN.type] || []).filter(o => !o.allowed_for_pack || o.allowed_for_pack === p?.identifier); };
  function opts() {
    const box = $q("vop"), L = curOpts();
    box.innerHTML = L.length ? L.map(o => `<button type="button" data-id="${E(o.identifier)}" aria-pressed="${RN.sel.has(o.identifier)}">${RN.sel.has(o.identifier) ? "✓ " : ""}${E(o.label)} +${o.price}</button>`).join("") : '<span class="msg">Aucune option pour cette offre.</span>';
    box.querySelectorAll("button").forEach(b => b.onclick = () => { const id = b.dataset.id; RN.sel.has(id) ? RN.sel.delete(id) : RN.sel.add(id); opts(); }); tot();
  }
  function tot() {
    const p = curPack(), n = +$q("vdu").value, o = curOpts().filter(x => RN.sel.has(x.identifier)).reduce((s, x) => s + x.price, 0);
    $q("vtt").textContent = p ? TL[RN.type] + " : total estimé " + money((p.price + o) * n) + " (montant final confirmé par Veo)" : "";
  }
  async function pay() {
    const p = curPack(), n = +$q("vdu").value, m = $q("vmt").value, s = $q("vst"), type = RN.type,
      num = $q("vnp").value.replace(/\D/g, "").replace(/^237/, ""), op = curOpts().filter(x => RN.sel.has(x.identifier)).map(x => x.identifier);
    if (num.length !== 9) { s.textContent = "Numéro de paiement invalide (9 chiffres)."; return; }
    if (!confirm("Confirmer le paiement ?\n" + TL[type] + " : " + p.label + " × " + n + " mois" + (op.length ? " + " + op.length + " option(s)" : "") + "\nDécodeur " + RN.d + "\n" + (m === "OM" ? "Orange Money " : "MTN MoMo ") + num)) return;
    $q("vpay").disabled = true; ls("veo_payer", num);
    try {
      const r = await api("/cga-subs/confirm/v2", "POST", { identifier: RN.id, duration: n, pack_identifier: p.identifier, pack_options: op, payment_account_number: num, payment_method: m, subscription_type: type, source: "MOBILE_APP", phone: num });
      s.textContent = "Demande envoyée (" + money(r.amount) + "). Validez le paiement sur votre téléphone…";
      for (let i = 0; i < 24; i++) {
        await new Promise(z => setTimeout(z, 5000));
        const l = await api("/cga-subs?page=1&limit=5&sort=id,DESC"), x = (l.data || []).find(y => y.id === r.id), st = x?.transaction?.status || x?.subscription_status;
        s.textContent = "Statut : " + st;
        if (x && st !== "PENDING") {
          ITEMS[r.id] = x; s.innerHTML = "Statut : " + E(st) + ` <button class="btn alt sm" type="button" id="vfa">Facture Veo</button> <button class="btn sm" type="button" id="vfe">Facture entreprise</button>`; $q("vfa").onclick = () => inv(r.id); $q("vfe").onclick = () => facEnt(r.id);
          if (st === "SUCCESSFUL") { note(TL[type] + " : " + p.label + " × " + n + " mois"); vsync(RN.d).catch(() => {}); } recent(); return;
        }
      }
      s.textContent += " — toujours en attente : ne relancez pas le paiement, vérifiez dans Opérations récentes.";
    } catch (e) { s.textContent = e.message + " (vérifiez dans Opérations récentes avant de réessayer)"; }
  }
  /* trace dans CLARA : fiche client + activité (sans toucher au contact enregistré) */
  function note(detail) {
    try { if (typeof cur !== "undefined" && cur && String(cur.numdecabo) === RN.d) { const r = recFor(cur) || ensureRec(); if (r) { logAct("Réabonnement Veo", r, { detail }); putCli(); } } } catch (e) {}
  }
  /* facture au nom de l'entreprise : le convertisseur de CLARA est rempli directement, sans import d'image */
  async function facEnt(id) {
    const t = ITEMS[id]; if (!t) { alert("Opération introuvable : rechargez la liste."); return; }
    try {
      const at = new Date(+t.created_at || Date.parse(t.created_at)), prev = pdate(t.data?.subscription_end), per = t.period || 1,
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
  async function recent() {
    const h = $q("vh"); if (!h) return;
    try {
      const j = await api("/cga-subs?page=1&limit=10&sort=id,DESC"); (j.data || []).forEach(t => ITEMS[t.id] = t);
      h.innerHTML = (j.data || []).map(t => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:8px 0"><span>${E(fdt(t.created_at))} • ${E(t.data?.customer_name || t.decoder_number)}<br><small>${E(t.pack_label)} • ${money(t.amount)} • ${E(t.transaction?.status || t.subscription_status)}</small></span><span style="display:flex;gap:6px"><button class="btn alt sm" type="button" data-i="${t.id}">Veo</button><button class="btn sm" type="button" data-e="${t.id}">Entreprise</button></span></div>`).join("") || "Aucune opération.";
      h.querySelectorAll("button[data-i]").forEach(b => b.onclick = () => inv(b.dataset.i)); h.querySelectorAll("button[data-e]").forEach(b => b.onclick = () => facEnt(b.dataset.e));
    } catch (e) { h.textContent = e.message; }
  }
  async function acc() {
    const c = $q("vc"); if (!c) return;
    try {
      const [h, t] = await Promise.all([api("/users/balance-histories?limit=30"), api("/transfers?page=1&limit=6&sort=id,DESC&sub_merchant_id=-1")]), b = {};
      for (const x of h.data || []) b[x.balance_type] ??= x.balance_after;
      c.innerHTML = (Object.entries(b).map(([k, v]) => "<b>" + E(k) + "</b> : " + money(v)).join(" • ") || "Aucun solde trouvé") + "<br><small>" + (t.data || []).map(x => E(fdt(x.created_at)) + " " + money(x.amount) + " " + E(x.balance_type) + " " + E(x.transaction?.status)).join("<br>") + `</small>
      <label for="vwt">Retrait</label><select id="vwt"><option value="COMMISSION">Commission</option><option value="BALANCE">Solde</option></select><input id="vwa" type="number" inputmode="numeric" placeholder="Montant (FCFA)"><div class="acts"><button class="btn" id="vwg" type="button">Retirer vers mon numéro</button></div>`;
      $q("vwg").onclick = async () => {
        const a = Math.floor(+$q("vwa").value), ty = $q("vwt").value; if (!(a > 0)) return alert("Montant invalide");
        if (!confirm("Retirer " + money(a) + " (" + ty + ") vers votre numéro " + (vc?.u || "") + " ?\nFrais ≈ 2 % : " + money(Math.round(a * 2) / 100))) return;
        try { const r = await api("/transfers/user-balance", "POST", { amount: a, balance_type: ty }); alert("Retrait lancé : " + (r.transaction?.status || "ok")); acc(); } catch (e) { alert(e.message); }
      };
    } catch (e) { c.textContent = e.message; }
  }

  /* boutons « Réabonner (Veo) » sur la fiche de recherche et sur la page Enregistrement */
  function open(dec) { PEND = String(dec || "").replace(/\D/g, ""); go("veo"); }
  function btn(parentId, id) {
    const p = $q(parentId); if (!p || $q(id)) return;
    const x = document.createElement("button"); x.type = "button"; x.id = id; x.className = "btn alt"; x.textContent = "Réabonner (Veo)";
    x.onclick = () => open(typeof cur !== "undefined" && cur ? cur.numdecabo : ""); p.appendChild(x);
  }
  function chk(id, parent, before) {
    const p = $q(parent); if (!p || $q(id)) return;
    const x = document.createElement("button"); x.type = "button"; x.id = id; x.className = "btn alt"; x.textContent = "Vérifier (Veo)";
    x.onclick = async () => {
      const d = typeof cur !== "undefined" && cur ? cur.numdecabo : ""; if (!d) return;
      if (!vt) { alert("Connectez-vous d’abord dans l’onglet Veo."); return; }
      try { const r = await vsync(d); try { const rc = recFor({ numdecabo: String(d) }); if (rc) cur = curOf(rc); } catch (e) {} alert("Fin d’abonnement chez Veo : " + r.d.toLocaleDateString("fr-FR") + (r.changed ? "\nLa fiche a été corrigée." : "\nLa fiche était déjà exacte.") + (r.none ? "\n(Client non enregistré dans CLARA.)" : "")); } catch (e) { alert(e.message); }
    };
    if (before && $q(before)) p.insertBefore(x, $q(before)); else p.appendChild(x);
  }
  chk("vc1", "fa");
  btn("fa", "vb1"); const rr = $q("rrl"); if (rr && rr.parentNode && !$q("vb2")) { const x = document.createElement("button"); x.type = "button"; x.id = "vb2"; x.className = "btn alt"; x.textContent = "Réabonner (Veo)"; x.onclick = () => open(typeof cur !== "undefined" && cur ? cur.numdecabo : ""); rr.parentNode.insertBefore(x, rr); }

  /* Première connexion : proposer l'identification Veo (une seule fois par appareil, sauf si déjà identifié) */
  const dg = document.createElement("dialog"); dg.id = "vinv";
  dg.innerHTML = '<h2>Identification Veo Pro</h2><p class="msg">Identifiez-vous sur Veo Pro pour réabonner vos clients, obtenir les factures et vérifier les dates de fin.</p><div class="acts"><button class="btn" id="vi1" type="button">S’identifier maintenant</button><button class="btn alt" id="vi2" type="button">Plus tard</button></div>';
  document.body.appendChild(dg);
  $q("vi1").onclick = () => { dg.close(); go("veo"); };
  $q("vi2").onclick = () => { dg.close(); ls("veo_later", "1"); };
  let asked = false;
  setInterval(() => { try { if (!asked && typeof token !== "undefined" && token && !vt && !ls("veo_user") && !ls("veo_later")) { asked = true; dg.showModal(); } } catch (e) {} }, 1500);
})();
