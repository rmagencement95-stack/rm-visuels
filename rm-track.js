/* RM Agencement — suivi des demandes de devis et consentement.
   Un seul fichier, aucune dépendance. Rien n'est envoyé tant que le visiteur
   n'a pas accepté. Pour désactiver tout le suivi : supprimer la balise
   <script src="rm-track.js"> des pages. */
(function () {
  "use strict";

  /* ---- À REMPLIR une fois la conversion créée dans Google Ads ---- */
  var CFG = {
    adsId: "",                 // ex. "AW-123456789"
    labels: {
      devis: "",               // conversion « Demande de devis »
      appel: "",               // conversion « Clic sur le téléphone »
      whatsapp: ""             // conversion « Clic WhatsApp »
    }
  };
  /* ---------------------------------------------------------------- */

  var STORE = "rm-consent";          // "oui" / "non"
  var ONCE = "rm-devis-envoye";      // une demande de devis comptée une fois
  var d = document;

  function lu(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } }
  function ec(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }

  /* --- Consentement : par défaut tout est refusé (mode consentement v2) --- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  });

  var charge = false;
  function chargerGoogle() {
    if (charge || !CFG.adsId) return;
    charge = true;
    var s = d.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + CFG.adsId;
    d.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", CFG.adsId);
  }

  function accepter() {
    ec(STORE, "oui");
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted"
    });
    chargerGoogle();
    fermerBandeau();
  }

  function refuser() { ec(STORE, "non"); fermerBandeau(); }

  /* --- Envoi d'une conversion --- */
  function envoyer(nom) {
    var label = CFG.labels[nom];
    if (!CFG.adsId || !label) return;            // rien n'est configuré : on ne fait rien
    if (lu(STORE) !== "oui") return;             // pas de consentement : rien
    if (nom === "devis") {
      if (lu(ONCE, true)) return;                // comptée une seule fois par visite
      ec(ONCE, "1", true);
    }
    gtag("event", "conversion", { send_to: CFG.adsId + "/" + label });
  }

  window.rmTrack = envoyer;

  /* --- Bandeau --- */
  var bandeau = null;
  function fermerBandeau() { if (bandeau) { bandeau.remove(); bandeau = null; } }

  function afficherBandeau() {
    var css = d.createElement("style");
    css.textContent =
      "#rm-cookies{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;" +
      "background:#fff;color:#1a1a1a;border:1px solid rgba(0,0,0,.14);border-radius:14px;padding:16px 18px;" +
      "box-shadow:0 10px 36px rgba(0,0,0,.18);font:400 15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
      "#rm-cookies p{margin:0 0 12px}#rm-cookies a{color:inherit}" +
      "#rm-cookies .rm-b{display:flex;gap:10px;flex-wrap:wrap}" +
      "#rm-cookies button{flex:1 1 auto;min-width:128px;cursor:pointer;border-radius:10px;padding:11px 14px;" +
      "font:inherit;font-weight:600;border:1px solid #1a1a1a;background:#1a1a1a;color:#fff}" +
      "#rm-cookies button.rm-no{background:#fff;color:#1a1a1a}" +
      "@media(prefers-color-scheme:dark){#rm-cookies{background:#161616;color:#f2f2f2;border-color:rgba(255,255,255,.16)}" +
      "#rm-cookies button{background:#f2f2f2;color:#111;border-color:#f2f2f2}" +
      "#rm-cookies button.rm-no{background:transparent;color:#f2f2f2;border-color:rgba(255,255,255,.4)}}";
    d.head.appendChild(css);

    bandeau = d.createElement("div");
    bandeau.id = "rm-cookies";
    bandeau.setAttribute("role", "dialog");
    bandeau.setAttribute("aria-label", "Cookies de mesure");
    bandeau.innerHTML =
      '<p>On mesure si nos annonces amènent de vraies demandes de devis. ' +
      'Rien d\'autre, et jamais de revente de données. ' +
      '<a href="mentions-legales.html">En savoir plus</a></p>' +
      '<div class="rm-b"><button type="button" id="rm-ok">Accepter</button>' +
      '<button type="button" class="rm-no" id="rm-non">Refuser</button></div>';
    d.body.appendChild(bandeau);
    d.getElementById("rm-ok").addEventListener("click", accepter);
    d.getElementById("rm-non").addEventListener("click", refuser);
  }

  /* --- Démarrage --- */
  function demarrer() {
    var choix = lu(STORE);
    if (choix === "oui") {
      gtag("consent", "update", {
        ad_storage: "granted", ad_user_data: "granted",
        ad_personalization: "granted", analytics_storage: "granted"
      });
      chargerGoogle();
    } else if (choix !== "non" && CFG.adsId) {
      afficherBandeau();
    }

    /* Clics sur le téléphone et sur WhatsApp */
    d.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var h = a.getAttribute("href") || "";
      if (h.indexOf("tel:") === 0) envoyer("appel");
      else if (h.indexOf("wa.me") > -1 || h.indexOf("whatsapp") > -1) envoyer("whatsapp");
    }, true);
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", demarrer);
  else demarrer();
})();
