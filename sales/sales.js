(() => {
  const $ = s => document.querySelector(s), frame = $('#demo-frame'), niche = $('#niche');
  let session = {mode: 'unknown', authenticated: false}, history = [];
  const INTRO_KEY = 'nidzp-sales-intro-v2', PRIVACY_KEY = 'nidzp-privacy-v1';
  const intro = $('#site-intro'), privacy = $('#privacy-banner'), privacyDialog = $('#privacy-dialog');
  let introTimer;
  function finishIntro() {
    if (intro.hidden) return;
    clearTimeout(introTimer);
    intro.classList.add('is-leaving');
    try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch { /* Uvod radi i bez storage-a. */ }
    window.setTimeout(() => {
      intro.hidden = true;
      document.body.classList.remove('intro-open');
      showPrivacyIfNeeded();
    }, 420);
  }
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
  let introSeen = false;
  try { introSeen = sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch { /* Prikaži kratak uvod. */ }
  if (introSeen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.hidden = true;
    showPrivacyIfNeeded();
  } else {
    document.body.classList.add('intro-open');
    introTimer = window.setTimeout(finishIntro, 1800);
  }
  $('#intro-skip').onclick = finishIntro;
  $('#privacy-accept').onclick = acceptPrivacy;
  $('#privacy-save').onclick = acceptPrivacy;
  $('#privacy-details').onclick = () => privacyDialog.showModal();
  $('#privacy-open').onclick = () => privacyDialog.showModal();
  $('#privacy-close').onclick = () => privacyDialog.close();
  async function api(path, body) {
    const r = await fetch(path, {method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000)});
    const d = await r.json(); if (!r.ok) throw new Error(r.status === 429 ? 'Kratka pauza zbog ograničenja. Pokušajte za minut.' : d.error || 'Zahtev nije uspeo.'); return d;
  }
  async function loadCommercial() {try {const c = await api('/commercial.json'); for(const k of ['site','premium']) {if(!Number.isFinite(c[k]?.annual)) throw Error(); document.querySelectorAll(`[data-price="${k}"]`).forEach(n => n.textContent = new Intl.NumberFormat('sr-RS').format(c[k].annual));} } catch {document.querySelectorAll('[data-price]').forEach(n => n.textContent = '—'); $('.scope-grid').textContent = 'Cena trenutno nije učitana. Za potvrdu ponude kontaktirajte NIDZP.';}}
  function demoUrl(pack) {return `/demo/${encodeURIComponent(niche.value)}/${pack}`;}
  function setFrame(pack) {
    frame.src = demoUrl(pack);
    $('#frame-label').textContent = pack === 'paket-2' ? 'Premium · Paket 2' : 'Sajt · Paket 1';
    $('#frame-full').href = demoUrl(pack);
    $('#demo-top-full').href = demoUrl(pack);
    $('#nina-full').href = `${demoUrl('paket-2')}/nina`;
    $('#active-niche').textContent = niche.options[niche.selectedIndex].text;
    $('#p1').classList.toggle('active', pack === 'paket-1'); $('#p2').classList.toggle('active', pack === 'paket-2');
    history = [];
  }
  niche.addEventListener('change', () => {setFrame($('#p2').classList.contains('active') ? 'paket-2' : 'paket-1');if(session.role==='admin')loadAdmin();});
  $('#p1').onclick = () => setFrame('paket-1'); $('#p2').onclick = () => setFrame('paket-2');
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => {niche.value=b.dataset.demo;setFrame(b.dataset.premium ? 'paket-2' : 'paket-1');});
  function applyAction(action) {
    const doc=frame.contentDocument; if(!doc) return;
    doc.getElementById('nidzp-guided-style')?.remove();
    if(action!=='reset'){const style=doc.createElement('style');style.id='nidzp-guided-style';style.textContent=action==='gold'?'header{background:linear-gradient(110deg,#102958,#193e80)!important;color:#ffe3a0!important}header a,header button{color:#ffe3a0!important}':action==='focus'?'.button,.btn,button[type="submit"]{box-shadow:0 0 0 3px #f5c96b!important;transform:scale(1.02)}':'[class*="hero"]{border-radius:0 0 36px 36px!important;box-shadow:inset 0 -5px #e2bd6c!important}';doc.head.append(style);}
    $('#action-status').textContent=action==='reset'?'Originalni prikaz je vraćen.':'Promena je primenjena na demo iznad. Ovo je vođena demonstracija, bez objavljivanja izmena.';
  }
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>applyAction(b.dataset.action));
  const guide=$('#guide-dialog'); $('#guide-open').onclick=()=>guide.showModal(); $('#guide-close').onclick=()=>guide.close();
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
    $('#nina-mode').textContent=authed?'Otključan pregled: Nina odgovara uživo kao AI asistentkinja izabranog fiktivnog brenda. Vođene promene ispod su demonstracija.':'Javni pregled radi bez AI poziva. Živi Nina razgovor dostupan je u privatnom pregledu kada server odobri režim.';
    if(session.role==='admin')loadAdmin();
  }
  async function refreshSession(){session=await api('/api/access/session');renderSession();}
  $('#access-form').onsubmit=async e=>{e.preventDefault();$('#access-status').textContent='Provera pristupa…';try{await api('/api/access/login',{pin:$('#access-pin').value,role:$('#access-role').value});$('#access-pin').value='';await refreshSession();$('#access-status').textContent='';dialog.hidden=true;}catch(error){$('#access-status').textContent=error.message;}};
  $('#logout').onclick=async()=>{try{await api('/api/access/logout',{});history=[];$('#live-answer').textContent='';await refreshSession();}catch{$('#health').textContent='Odjava nije potvrđena. Pokušajte ponovo.';}};
  $('#live-form').onsubmit=async e=>{e.preventDefault();const message=$('#live-question').value.trim();if(!message)return;const button=$('#live-send');button.disabled=true;$('#live-answer').textContent='Nina priprema odgovor…';try{const d=await api('/api/nina',{brand:niche.value,message,history});$('#live-answer').textContent=d.odgovor;history=[...history,{role:'user',content:message},{role:'assistant',content:d.odgovor}].slice(-12);$('#live-question').value='';}catch(error){$('#live-answer').textContent=error.message;}finally{button.disabled=false;}};
  function draftKey(){return `nidzp-content-draft:${niche.value}`;}
  async function loadAdmin(){try{const d=await api('/api/admin/preview');$('#admin-status').textContent=d.message;$('#admin-brand').textContent=niche.options[niche.selectedIndex].text;$('#admin-content').value=sessionStorage.getItem(draftKey())||'Tema: predstavite najtraženiju uslugu ovog meseca.\nStatus: nacrt, čeka odobrenje.';}catch(error){$('#admin-status').textContent=error.message;}}
  $('#admin-save').onclick=()=>{sessionStorage.setItem(draftKey(),$('#admin-content').value);$('#admin-status').textContent='Demo nacrt je sačuvan samo u ovoj sesiji pregleda za izabranu delatnost. Ništa nije objavljeno.';};
  // Prodajni pregled je otvoren po osnovi; privatne API rute i dalje štiti server.
  setFrame('paket-1');
  document.body.classList.remove('initializing');
  loadCommercial();
  refreshSession().catch(()=>{session={mode:'public',authenticated:false,role:null};renderSession();});
  api('/api/health').then(d=>$('#health').textContent=d.mode==='public'?'Otvoren prodajni pregled · bez PIN-a':d.mode==='private'?'Pregled otvoren · privatni pristup dodaje živu Ninu':'Pregled radi u javnom režimu · status servisa nije potvrđen').catch(()=>{$('#health').textContent='Pregled radi u javnom režimu · status servisa nije potvrđen';});
})();
