(() => {
  const $ = s => document.querySelector(s), frame = $('#demo-frame'), niche = $('#niche'), naslov = $('#glavni-naslov'), frameWrap = $('.demo-frame');
  document.documentElement.classList.add('js');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let session = {mode: 'unknown', authenticated: false}, history = [];
  // Genitivi za dinamički H1 „Ovako bi izgledao sajt <genitiv>." — ključ je value opcije iz #niche.
  const GENITIVI = {
    restoran: 'vašeg restorana', kafic: 'vašeg kafića', pekara: 'vaše pekare', 'auto-servis': 'vašeg auto-servisa',
    'tehnicki-pregled': 'vašeg centra za tehnički pregled',
    frizer: 'vašeg salona', 'pet-grooming': 'vašeg salona za ljubimce', namestaj: 'vašeg salona nameštaja',
    fitness: 'vašeg fitness centra', igraonica: 'vaše dečje igraonice', cvecara: 'vaše cvećare', hotel: 'vašeg hotela',
    stomatolog: 'vaše ordinacije', mesara: 'vaše mesare', poslasticarnica: 'vaše poslastičarnice', 'burger-bar': 'vašeg burger bara',
    'auto-perionica': 'vaše auto perionice', vulkanizer: 'vaše vulkanizerske radnje', racunovodstvo: 'vaše računovodstvene agencije',
    advokat: 'vaše advokatske kancelarije', nekretnine: 'vaše agencije za nekretnine', fotograf: 'vašeg foto studija',
    'svadbena-sala': 'vaše svadbene sale', 'skola-jezika': 'vaše škole jezika', 'muzicka-skola': 'vaše muzičke škole',
    butik: 'vašeg butika', knjizara: 'vaše knjižare', 'servis-racunara': 'vašeg servisa računara',
    elektricar: 'vaše električarske radnje', vodoinstalater: 'vašeg vodoinstalaterskog servisa', 'rent-a-car': 'vaše rent-a-car agencije',
  };
  function updateNaslov() {
    const gen = GENITIVI[niche.value];
    naslov.textContent = gen ? `Ovako bi izgledao sajt ${gen}.` : 'Ovako bi izgledao vaš sajt.';
  }
  const metaDesc = document.querySelector('meta[name="description"]');
  // Tekst po niši: dopuna demo-note, title i meta description prate izabrani demo.
  function updateNicheText() {
    const optionText = niche.options[niche.selectedIndex]?.text || '';
    if (!optionText) return;
    const noteNiche = $('#demo-note-niche');
    if (noteNiche) noteNiche.textContent = `Prikazan demo: ${optionText}. Fiktivan primer — vaš sajt pravimo od vaših odobrenih podataka.`;
    document.title = `Sajt za ${optionText} · NIDZP — 600 € godišnje ili Premium 2.500 €`;
    if (metaDesc) metaDesc.content = `Gotov demo sajta za ${optionText} — pogledajte odmah. Sajt 600 EUR godišnje, Premium sa Ninom 2.500 EUR godišnje, ista cena pri obnovi.`;
  }
  const PRIVACY_KEY = 'nidzp-privacy-v1';
  const privacy = $('#privacy-banner'), privacyDialog = $('#privacy-dialog');
  function showPrivacyIfNeeded() {
    let saved = false;
    try { saved = localStorage.getItem(PRIVACY_KEY) === 'necessary'; } catch { /* Bez storage-a prikazujemo objašnjenje. */ }
    privacy.hidden = saved;
    document.body.classList.toggle('privacy-open', !saved);
  }
  function acceptPrivacy() {
    try { localStorage.setItem(PRIVACY_KEY, 'necessary'); } catch { /* Izbor važi bar za tekući prikaz. */ }
    privacy.hidden = true;
    document.body.classList.remove('privacy-open');
    if (privacyDialog.open) privacyDialog.close();
  }
  showPrivacyIfNeeded();
  $('#privacy-accept').onclick = acceptPrivacy;
  $('#privacy-save').onclick = acceptPrivacy;
  $('#privacy-details').onclick = () => privacyDialog.showModal();
  $('#privacy-open').onclick = () => privacyDialog.showModal();
  $('#privacy-close').onclick = () => privacyDialog.close();
  // KPI beaconi: anonimni brojači događaja (bez ličnih podataka, bez kolačića). Neuspeh je tiho ignorisan.
  function kpi(event) {
    try { navigator.sendBeacon('/api/kpi', new Blob([JSON.stringify({event})], {type: 'text/plain'})); } catch { /* Bez brojanja ne pada ništa drugo. */ }
  }
  kpi('pageview');
  document.querySelectorAll('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => kpi('tel')));
  document.querySelectorAll('a[href^="viber:"]').forEach(a => a.addEventListener('click', () => kpi('viber')));
  // Scroll-reveal: sekcije dobijaju .in kad uđu u vidni deo; bez JS-a ili uz reduced-motion ostaju vidljive.
  const revealEls = document.querySelectorAll('.reveal');
  if (REDUCED || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const revealIo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealIo.unobserve(entry.target);
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -40px 0px'});
    revealEls.forEach(el => revealIo.observe(el));
  }
  async function api(path, body) {
    const r = await fetch(path, {method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000)});
    const d = await r.json(); if (!r.ok) throw new Error(r.status === 429 ? 'Kratka pauza zbog ograničenja. Pokušajte za minut.' : d.error || 'Zahtev nije uspeo.'); return d;
  }
  function fmtCena(v) { return new Intl.NumberFormat('sr-RS').format(v); }
  function animirajCenu(node, target) {
    if (REDUCED) { node.textContent = fmtCena(target); return; }
    const start = performance.now(), trajanje = 600;
    function korak(now) {
      const p = Math.min(1, (now - start) / trajanje);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmtCena(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(korak);
    }
    requestAnimationFrame(korak);
  }
  async function loadCommercial() {try {const c = await api('/commercial.json'); for(const k of ['site','premium']) {if(!Number.isFinite(c[k]?.annual)) throw Error(); document.querySelectorAll(`[data-price="${k}"]`).forEach(n => animirajCenu(n, c[k].annual));} } catch {document.querySelectorAll('[data-price]').forEach(n => n.textContent = '—'); $('.scope-grid').textContent = 'Cena trenutno nije učitana. Za potvrdu ponude kontaktirajte NIDZP.';}}
  function demoSlug() { return niche.value === 'tehnicki-pregled' ? 'auto-servis' : niche.value; }
  function demoUrl(pack) {return `/demo/${encodeURIComponent(demoSlug())}/${pack}/`;}
  // Lazy demo iframe: src se postavlja tek kad se frejm približi vidljivom delu (fallback: odmah); is-loading drži shimmer dok učitava.
  let currentPack = 'paket-1', frameStarted = false;
  function startFrame() {
    if (frameStarted) return;
    frameStarted = true;
    frameWrap.classList.add('is-loading');
    frame.src = demoUrl(currentPack);
    kpi('demo-open');
  }
  frame.addEventListener('load', () => {if (frameStarted) frameWrap.classList.remove('is-loading');});
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {if (entries.some(e => e.isIntersecting)) {startFrame(); io.disconnect();}}, {rootMargin: '240px 0px'});
    io.observe(frame);
  } else startFrame();
  function setFrame(pack) {
    currentPack = pack;
    if (frameStarted) {frameWrap.classList.add('is-loading'); frame.src = demoUrl(pack); kpi('demo-open');}
    $('#frame-label').textContent = pack === 'paket-2' ? 'Premium · Paket 2' : 'Sajt · Paket 1';
    $('#frame-full').href = demoUrl(pack);
    $('#demo-top-full').href = demoUrl(pack);
    $('#nina-full').href = `${demoUrl('paket-2')}nina/`;
    $('#active-niche').textContent = niche.options[niche.selectedIndex].text;
    $('#p1').classList.toggle('active', pack === 'paket-1'); $('#p2').classList.toggle('active', pack === 'paket-2');
    history = [];
  }
  niche.addEventListener('change', () => {updateNaslov();updateNicheText();setFrame($('#p2').classList.contains('active') ? 'paket-2' : 'paket-1');if(session.role==='admin')loadAdmin();});
  $('#p1').onclick = () => setFrame('paket-1'); $('#p2').onclick = () => setFrame('paket-2');
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => setFrame(b.dataset.premium ? 'paket-2' : 'paket-1'));
  // Brzi izbor niše (čipovi „Najčešći:") iznad selecta.
  const ctaPrimary = $('.quick-start .button.primary');
  document.querySelectorAll('[data-pick]').forEach(btn => btn.onclick = () => {
    if (niche.value === btn.dataset.pick) return;
    niche.value = btn.dataset.pick;
    niche.dispatchEvent(new Event('change'));
    ctaPrimary?.scrollIntoView({behavior: REDUCED ? 'auto' : 'smooth', block: 'nearest'});
  });
  // Prekidač prikaza računar/telefon nad demo frejmom.
  const deviceDesktop = $('#device-desktop'), devicePhone = $('#device-phone');
  function setDevice(phone) {
    frameWrap.classList.toggle('is-phone', phone);
    deviceDesktop.setAttribute('aria-pressed', String(!phone));
    devicePhone.setAttribute('aria-pressed', String(phone));
  }
  deviceDesktop.onclick = () => setDevice(false);
  devicePhone.onclick = () => setDevice(true);
  // Kopiranje deljivog linka na trenutni demo (sa izborom niše).
  $('#copy-link').onclick = async () => {
    const status = $('#action-status');
    const url = `${location.origin}/sales/?delatnost=${encodeURIComponent(niche.value)}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const tmp = document.createElement('textarea');
        tmp.value = url;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'fixed';
        tmp.style.opacity = '0';
        document.body.append(tmp);
        tmp.select();
        ok = document.execCommand('copy');
        tmp.remove();
      } catch { ok = false; }
    }
    if (ok) { status.textContent = 'Link kopiran — pošaljite kom treba.'; kpi('copy'); }
    else status.textContent = `Kopiranje nije uspelo u ovom pregledaču — link možete ručno iskopirati: ${url}`;
  };
  function applyAction(action) {
    const doc=frame.contentDocument; if(!doc) return;
    doc.getElementById('nidzp-guided-style')?.remove();
    if(action!=='reset'){const style=doc.createElement('style');style.id='nidzp-guided-style';style.textContent=action==='gold'?'header{background:#0b0b0b!important;color:#fff!important;border-bottom:1px solid #fff!important}header a,header button{color:#fff!important}':action==='focus'?'.button,.btn,button[type="submit"]{box-shadow:0 0 0 3px #fff!important;transform:scale(1.02)}':'[class*="hero"]{border-radius:0!important;box-shadow:inset 0 -2px #fff!important}';doc.head.append(style);}
    $('#action-status').textContent=action==='reset'?'Originalni prikaz je vraćen.':'Primenjeno samo u ovom pregledu — ništa nije objavljeno.';
  }
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>applyAction(b.dataset.action));
  const guide=$('#guide-dialog'), guideSteps=[...guide.querySelectorAll('.guide-step')], guideDots=[...guide.querySelectorAll('.guide-dot')], guideBack=$('#guide-back'), guideNext=$('#guide-next');
  let guideStep=1;
  function renderGuide() {
    guideSteps.forEach((step, i) => step.classList.toggle('is-active', i === guideStep - 1));
    guideDots.forEach((dot, i) => {
      const active = i === guideStep - 1;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
    guideBack.hidden = guideStep === 1;
    guideNext.textContent = guideStep === guideSteps.length ? 'Razumem' : 'Dalje';
  }
  guideDots.forEach((dot, index) => {
    dot.onclick = () => {
      guideStep = index + 1;
      renderGuide();
    };
  });
  guideBack.onclick=()=>{guideStep=Math.max(1,guideStep-1);renderGuide();};
  guideNext.onclick=()=>{if(guideStep===guideSteps.length){guide.close();return;}guideStep=Math.min(guideSteps.length,guideStep+1);renderGuide();};
  $('#guide-open').onclick=()=>{guideStep=1;renderGuide();guide.showModal();};
  const dialog=$('#access-dialog'); $('#access-open').onclick=()=>{dialog.hidden=false;$('#access-pin').focus();};
  $('#access-close').onclick=()=>{dialog.hidden=true;$('#access-open').focus();};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden)$('#access-close').click();if(e.key==='Tab'&&!dialog.hidden){const focusable=[...dialog.querySelectorAll('button,input,select')].filter(n=>!n.hidden);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  function renderSession(){
    const authed=session.authenticated;
    document.documentElement.dataset.mode=session.mode;
    $('#access-open').hidden=!(session.mode==='private'&&!authed);
    $('#logout').hidden=!authed;
    $('#live-panel').hidden=!authed;
    $('#admin-panel').hidden=session.role!=='admin';
    $('#nina-mode').textContent=authed?'Nina odgovara uživo iz odobrenih podataka izabranog demo brenda.':'Javni pregled ne troši AI pozive. Živa Nina je dostupna u zaštićenom režimu.';
    if(session.role==='admin')loadAdmin();
  }
  async function refreshSession(){session=await api('/api/access/session');renderSession();}
  $('#access-form').onsubmit=async e=>{e.preventDefault();$('#access-status').textContent='Provera pristupa…';try{await api('/api/access/login',{pin:$('#access-pin').value,role:$('#access-role').value});$('#access-pin').value='';await refreshSession();$('#access-status').textContent='';dialog.hidden=true;}catch(error){$('#access-status').textContent=error.message;}};
  $('#logout').onclick=async()=>{try{await api('/api/access/logout',{});history=[];$('#live-answer').textContent='';await refreshSession();}catch{$('#health').textContent='Odjava nije potvrđena. Pokušajte ponovo.';}};
  function renderAnswer(el, text) {
    el.textContent = '';
    String(text ?? '').split(/\r?\n/).forEach((line, i) => {
      if (i) el.append(document.createElement('br'));
      el.append(document.createTextNode(line));
    });
  }
  let poslednjePitanje = '';
  async function pitajNinu(message) {
    const answer = $('#live-answer'), typing = $('#live-typing'), retry = $('#live-retry'), button = $('#live-send');
    button.disabled = true;
    answer.hidden = true;
    typing.hidden = false;
    retry.hidden = true;
    try {
      const d = await api('/api/nina', {brand: demoSlug(), message, history});
      renderAnswer(answer, d.odgovor);
      history = [...history, {role: 'user', content: message}, {role: 'assistant', content: d.odgovor}].slice(-12);
      $('#live-question').value = '';
    } catch (error) {
      renderAnswer(answer, error.message);
      retry.hidden = false;
    } finally {
      typing.hidden = true;
      answer.hidden = false;
      button.disabled = false;
    }
  }
  $('#live-form').onsubmit = async e => {
    e.preventDefault();
    const message = $('#live-question').value.trim();
    if (!message) return;
    poslednjePitanje = message;
    await pitajNinu(message);
  };
  $('#live-retry').onclick = () => { if (poslednjePitanje) pitajNinu(poslednjePitanje); };
  function draftKey(){return `nidzp-content-draft:${niche.value}`;}
  async function loadAdmin(){try{const d=await api('/api/admin/preview');$('#admin-status').textContent=d.message;$('#admin-brand').textContent=niche.options[niche.selectedIndex].text;$('#admin-content').value=sessionStorage.getItem(draftKey())||'Tema: predstavite najtraženiju uslugu ovog meseca.\nStatus: nacrt, čeka odobrenje.';}catch(error){$('#admin-status').textContent=error.message;}}
  $('#admin-save').onclick=()=>{sessionStorage.setItem(draftKey(),$('#admin-content').value);$('#admin-status').textContent='Demo nacrt je sačuvan samo u ovoj sesiji pregleda za izabranu delatnost. Ništa nije objavljeno.';};
  // Preporučeni demo iz mejla: /sales/?delatnost=<slug> otvara odmah pravu nišu.
  let primenjenParametar = false;
  try {
    const requested = new URLSearchParams(location.search).get('delatnost');
    if (requested && [...niche.options].some(option => option.value === requested)) { niche.value = requested; primenjenParametar = true; }
  } catch { /* Preporuka je dodatak; pregled radi i bez nje. */ }
  updateNaslov();
  if (primenjenParametar) updateNicheText();
  // Prodajni pregled je otvoren po osnovi; privatne API rute i dalje štiti server.
  setFrame('paket-1');
  document.body.classList.remove('initializing');
  loadCommercial();
  refreshSession().catch(()=>{session={mode:'public',authenticated:false,role:null};renderSession();});
  api('/api/health').then(d=>$('#health').textContent=d.mode==='public'?'Otvoren pregled · bez PIN-a':d.mode==='private'?'Otvoren pregled · živa Nina uz pristup':'Javni demo · servis nije potvrđen').catch(()=>{$('#health').textContent='Javni demo · servis nije potvrđen';});
  // Javni Nina demo razgovor (#public-nina): odgovori iz engine baze izabranog brenda (POST /api/nina
  // {brand, poruka, istorija} → proxy bira port brenda). Nezavisan od PIN-gated #live-panel.
  // Limit: 10 poruka po danu, brojač u localStorage pod 'nina-demo-count' ({datum, broj}); reset na novi dan.
  const PUB_LIMIT = 10;
  const PUB_STORAGE = 'nina-demo-count';
  const pubOpen = $('#public-nina-open'), pubPanel = $('#public-nina'), pubLog = $('#public-nina-log');
  const pubTyping = $('#public-nina-typing'), pubForm = $('#public-nina-form'), pubText = $('#public-nina-question');
  const pubSend = $('#public-nina-send'), pubOstalo = $('#public-nina-ostalo'), pubStatus = $('#public-nina-status');
  const pubRetry = $('#public-nina-retry'), pubBrandline = $('#public-nina-brandline'), pubNicheEl = $('#public-nina-niche');
  let pubIstorija = [], pubPoslednjaPoruka = '', pubPrvoSlanje = false;
  function pubDanas() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function pubBrojac() {
    try {
      const sacuvano = JSON.parse(localStorage.getItem(PUB_STORAGE));
      if (sacuvano?.datum === pubDanas() && Number.isInteger(sacuvano?.broj) && sacuvano.broj >= 0) return Math.min(sacuvano.broj, PUB_LIMIT);
    } catch { /* bez storage-a brojač ne može da se pamti — razgovor i dalje radi. */ }
    return 0;
  }
  function pubSacuvajBrojac(broj) {
    try { localStorage.setItem(PUB_STORAGE, JSON.stringify({ datum: pubDanas(), broj })); } catch { /* bez storage-a preskačemo. */ }
  }
  function pubOsveziLimit() {
    const preostalo = PUB_LIMIT - pubBrojac();
    pubText.disabled = preostalo <= 0;
    pubSend.disabled = preostalo <= 0;
    pubOstalo.textContent = preostalo <= 0
      ? 'Demo limit dostignut (10 poruka). Za više — pozovite 063 745 6770.'
      : `Preostalo poruka: ${preostalo}/${PUB_LIMIT}`;
  }
  function pubNicheNaziv() { return niche.options[niche.selectedIndex]?.text || ''; }
  function pubDodajPoruku(uloga, tekst) {
    const red = document.createElement('div');
    red.className = `pub-msg ${uloga}`;
    if (uloga === 'nina') {
      const tacka = document.createElement('span');
      tacka.className = 'pub-dot';
      tacka.setAttribute('aria-hidden', 'true');
      red.append(tacka);
    }
    const balon = document.createElement('p');
    balon.className = 'pub-balon';
    renderAnswer(balon, tekst); // escapovan tekst, <br> po redu
    red.append(balon);
    pubLog.append(red);
    pubLog.scrollTop = pubLog.scrollHeight;
  }
  async function pubPosalji(poruka) {
    pubStatus.hidden = true;
    pubRetry.hidden = true;
    pubSend.disabled = true;
    pubText.disabled = true;
    pubTyping.hidden = false;
    if (!pubPrvoSlanje) { pubPrvoSlanje = true; kpi('nina-public'); }
    try {
      const d = await api('/api/nina', { brand: demoSlug(), poruka, istorija: pubIstorija });
      pubIstorija = [...pubIstorija, { role: 'user', content: poruka }, { role: 'assistant', content: d.odgovor }].slice(-6);
      pubSacuvajBrojac(pubBrojac() + 1);
      pubDodajPoruku('user', poruka);
      pubDodajPoruku('nina', d.odgovor);
      pubText.value = '';
      pubPoslednjaPoruka = '';
    } catch (error) {
      pubStatus.textContent = error.message;
      pubStatus.hidden = false;
      pubRetry.hidden = false;
      pubPoslednjaPoruka = poruka;
    } finally {
      pubTyping.hidden = true;
      pubOsveziLimit();
    }
  }
  pubForm.onsubmit = e => {
    e.preventDefault();
    const poruka = pubText.value.trim();
    if (!poruka || pubText.disabled) return;
    pubPosalji(poruka);
  };
  pubRetry.onclick = () => { if (pubPoslednjaPoruka) pubPosalji(pubPoslednjaPoruka); };
  pubOpen.onclick = () => {
    const otvaramo = pubPanel.hidden;
    pubPanel.hidden = otvaramo;
    pubOpen.setAttribute('aria-expanded', String(otvaramo));
    if (otvaramo) { pubOsveziLimit(); pubText.focus(); }
  };
  // Promena delatnosti: javna istorija se briše i panel jasno kaže iz koje baze Nina sada odgovara.
  niche.addEventListener('change', () => {
    pubIstorija = [];
    pubPoslednjaPoruka = '';
    pubNicheEl.textContent = pubNicheNaziv();
    pubBrandline.textContent = `Nina sada odgovara iz demo baze: ${pubNicheNaziv()}`;
    pubBrandline.hidden = false;
    pubStatus.hidden = true;
    pubRetry.hidden = true;
  });
  pubNicheEl.textContent = pubNicheNaziv();
  pubOsveziLimit();
})();
