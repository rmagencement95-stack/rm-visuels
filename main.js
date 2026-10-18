(function () {
  // Menu mobile
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = menu.getAttribute("data-open") === "true";
      menu.setAttribute("data-open", open ? "false" : "true");
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }

  // Comparateur avant / après
  document.querySelectorAll(".compare").forEach(function (box) {
    var range = box.querySelector("input[type=range]");
    if (!range) return;
    var set = function () { box.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", set);
    set();
  });

  // Formulaire de devis : prépare un message WhatsApp ou un e-mail
  var form = document.getElementById("devis-form");
  if (form) {
    var status = document.getElementById("form-status");
    var build = function () {
      var v = function (id) { return (document.getElementById(id).value || "").trim(); };
      return "Bonjour, je souhaite un devis.\n" +
        "Nom : " + v("f-nom") + "\n" +
        "Téléphone : " + v("f-tel") + "\n" +
        "Ville : " + v("f-ville") + "\n" +
        "Travaux : " + v("f-type") + "\n" +
        (v("f-msg") ? "Projet : " + v("f-msg") : "");
    };
    var check = function () {
      var ok = true;
      ["f-nom", "f-tel", "f-ville"].forEach(function (id) {
        var el = document.getElementById(id);
        var err = document.getElementById(id + "-err");
        var bad = !el.value.trim() || (id === "f-tel" && el.value.replace(/\D/g, "").length < 10);
        err.hidden = !bad;
        el.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      return ok;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!check()) { status.textContent = "Il manque une information, voir les champs en rouge."; return; }
      var url = "https://wa.me/" + form.dataset.wa + "?text=" + encodeURIComponent(build());
      var a = document.getElementById("wa-link");
      a.href = url;
      a.hidden = false;
      status.textContent = "Votre message est prêt. Ouvrez WhatsApp pour l'envoyer.";
      a.click();
    });
    var mail = document.getElementById("mail-btn");
    if (mail) {
      mail.addEventListener("click", function () {
        if (!check()) { status.textContent = "Il manque une information, voir les champs en rouge."; return; }
        location.href = "mailto:" + form.dataset.mail + "?subject=" + encodeURIComponent("Demande de devis") + "&body=" + encodeURIComponent(build());
      });
    }
  }

  // Carrousel des réalisations
  var car = document.getElementById("carousel");
  document.querySelectorAll("[data-car]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!car) return;
      var fig = car.querySelector("figure");
      var step = fig ? fig.getBoundingClientRect().width + 22 : car.clientWidth;
      car.scrollBy({ left: step * Number(b.dataset.car), behavior: "smooth" });
    });
  });


  // Effets au défilement (GSAP ScrollTrigger) : hero qui s'agrandit, galerie zoom
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    var xh = document.getElementById("xhero");
    if (xh) {
      var st = xh.querySelector(".xhero-sticky");
      ScrollTrigger.create({ trigger: xh, start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: function (self) { st.style.setProperty("--p", self.progress.toFixed(4)); st.classList.toggle("done", self.progress > 0.85); } });
    }
    var zp = document.getElementById("zp");
    if (zp) {
      var zs = zp.querySelector(".zp-sticky");
      ScrollTrigger.create({ trigger: zp, start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: function (self) { zs.style.setProperty("--p", self.progress.toFixed(4)); } });
    }
  } else {
    var stt = document.querySelector(".xhero-sticky");
    if (stt) stt.classList.add("done");
  }

  // Carte des chantiers
  var tip = document.getElementById("map-tip");
  document.querySelectorAll(".map-wrap").forEach(function (wrap) {
    var pins = wrap.querySelectorAll(".pin"), lis = wrap.querySelectorAll(".map-list li"), t = wrap.querySelector(".map-tip");
    var show = function (i) {
      pins.forEach(function (p) { p.classList.toggle("active", p.dataset.i === String(i)); });
      lis.forEach(function (l) { l.classList.toggle("active", l.dataset.i === String(i)); });
      var li = wrap.querySelector('.map-list li[data-i="' + i + '"]');
      if (li && t) t.textContent = li.querySelector("strong").textContent + " : " + li.querySelector("span").textContent;
    };
    pins.forEach(function (p) {
      p.addEventListener("mouseenter", function () { show(p.dataset.i); });
      p.addEventListener("focus", function () { show(p.dataset.i); });
      p.addEventListener("click", function () { show(p.dataset.i); });
    });
    lis.forEach(function (l) { l.addEventListener("mouseenter", function () { show(l.dataset.i); }); l.addEventListener("click", function () { show(l.dataset.i); }); });
  });

  // Assistant « Rémi » : questions guidées, puis envoi à Mickael
  var chat = document.getElementById("chat");
  if (chat) {
    var body = document.getElementById("chat-body"), form = document.getElementById("chat-form"), input = document.getElementById("chat-text");
    var data = {}, step = 0, started = false;
    var STEPS = [
      { key: "travaux", q: "Bonjour ! Je suis Rémi, l’assistant automatique de RM Agencement. Je prends quelques infos sur votre projet, et Mickael vous rappelle. C’est pour quels travaux ?", chips: ["Cuisine", "Salle de bain", "Sols / parquet", "Rénovation complète", "Autre"] },
      { key: "ville", q: "D’accord. Le logement se trouve dans quelle ville ?", text: true },
      { key: "logement", q: "C’est une maison ou un appartement ?", chips: ["Appartement", "Maison", "Local commercial"] },
      { key: "surface", q: "Quelle surface à peu près ? (la pièce ou tout le logement)", text: true, skip: "Je ne sais pas" },
      { key: "delai", q: "Vous aimeriez commencer quand ?", chips: ["Dès que possible", "Dans 1 à 3 mois", "Plus tard", "Je ne sais pas encore"] },
      { key: "budget", q: "Vous avez une idée du budget ?", chips: ["Moins de 10 000 €", "10 000 à 30 000 €", "Plus de 30 000 €", "Pas encore"] },
      { key: "nom", q: "C’est noté. À quel nom ?", text: true },
      { key: "tel", q: "Et un numéro pour vous rappeler ?", text: true, tel: true },
      { key: "details", q: "Un détail à ajouter ? (photos, contraintes, accès…) Sinon, passez.", text: true, skip: "Passer" }
    ];
    var say = function (txt, who) { var d = document.createElement("div"); d.className = "msg " + (who || "bot"); d.textContent = txt; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; };
    var chips = function (list, cb) {
      var w = document.createElement("div"); w.className = "chips";
      list.forEach(function (c) { var b = document.createElement("button"); b.type = "button"; b.textContent = c; b.addEventListener("click", function () { w.remove(); cb(c); }); w.appendChild(b); });
      body.appendChild(w); body.scrollTop = body.scrollHeight;
    };
    var ask = function () {
      var s = STEPS[step];
      if (!s) return finish();
      setTimeout(function () {
        say(s.q);
        if (s.chips) { form.hidden = true; chips(s.chips, answer); }
        else { form.hidden = false; input.value = ""; input.type = s.tel ? "tel" : "text"; input.focus(); if (s.skip) chips([s.skip], answer); }
      }, 350);
    };
    var answer = function (v) {
      var s = STEPS[step];
      if (s.tel && v.replace(/\D/g, "").length < 10) { say(v, "me"); say("Je n’ai pas compris ce numéro. Il me faut 10 chiffres, par exemple 06 12 34 56 78."); return; }
      say(v, "me"); data[s.key] = v; step++; ask();
    };
    var summary = function () {
      return "Nouvelle demande via le site\nTravaux : " + data.travaux + "\nVille : " + data.ville + "\nLogement : " + data.logement +
        "\nSurface : " + data.surface + "\nDémarrage : " + data.delai + "\nBudget : " + data.budget + "\nNom : " + data.nom + "\nTéléphone : " + data.tel +
        (data.details && data.details !== "Passer" ? "\nDétails : " + data.details : "");
    };
    var finish = function () {
      form.hidden = true;
      var key = chat.dataset.key;
      if (key) {
        say("Merci " + data.nom + ". J’envoie votre demande à Mickael…");
        fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ access_key: key, subject: "Demande de devis : " + data.travaux + " à " + data.ville, from_name: "Site RM Agencement", message: summary() }) })
          .then(function (r) { return r.json(); })
          .then(function (r) { if (r.success) say("C’est envoyé. Mickael vous rappelle sous 48 h, en semaine."); else throw 0; })
          .catch(function () { say("L’envoi n’a pas marché. Vous pouvez nous l’envoyer directement :"); manual(); });
      } else {
        say("Merci " + data.nom + ". Votre demande est prête. Choisissez comment nous l’envoyer :"); manual();
      }
    };
    var manual = function () {
      var w = document.createElement("div"); w.className = "chips";
      var wa = document.createElement("a"); wa.href = "https://wa.me/" + chat.dataset.wa + "?text=" + encodeURIComponent(summary()); wa.target = "_blank"; wa.rel = "noopener"; wa.textContent = "Envoyer par WhatsApp";
      var ml = document.createElement("a"); ml.href = "mailto:" + chat.dataset.mail + "?subject=" + encodeURIComponent("Demande de devis") + "&body=" + encodeURIComponent(summary()); ml.textContent = "Envoyer par e-mail";
      w.appendChild(wa); w.appendChild(ml); body.appendChild(w); body.scrollTop = body.scrollHeight;
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value.trim(); if (!v) return; var w = body.querySelector(".chips:last-child"); if (w) w.remove(); answer(v); });
    var openBtn = document.getElementById("chat-open");
    openBtn.addEventListener("click", function () { chat.hidden = false; openBtn.parentNode.hidden = true; if (!started) { started = true; ask(); } });
    document.getElementById("chat-close").addEventListener("click", function () { chat.hidden = true; openBtn.parentNode.hidden = false; });
  }

  // Menu de l'accueil : fond plein une fois la grande photo passée
  var hdr = document.querySelector(".home .site-header"), xhs = document.getElementById("xhero");
  if (hdr && xhs && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { hdr.classList.toggle("solid", !en[0].isIntersecting); }, { rootMargin: "-90px 0px 0px 0px" }).observe(xhs);
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
