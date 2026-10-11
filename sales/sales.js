(() => {
  const $ = s => document.querySelector(s), frame = $('#demo-frame'), niche = $('#niche');
  let session = {mode: 'unknown', authenticated: false}, history = [];
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
  async function api(path, body) {
    const r = await fetch(path, {method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: {'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(55000)});
    const d = await r.json(); if (!r.ok) throw new Error(r.status === 429 ? 'Kratka pauza zbog ograničenja. Pokušajte za minut.' : d.error || 'Zahtev nije uspeo.'); return d;
  }
  async function loadCommercial() {try {const c = await api('/commercial.json'); for(const k of ['site','premium']) {if(!Number.isFinite(c[k]?.annual)) throw Error(); document.querySelectorAll(`[data-price="${k}"]`).forEach(n => n.textContent = new Intl.NumberFormat('sr-RS').format(c[k].annual));} } catch {document.querySelectorAll('[data-price]').forEach(n => n.textContent = '—'); $('.scope-grid').textContent = 'Cena trenutno nije učitana. Za potvrdu ponude kontaktirajte NIDZP.';}}
  function demoUrl(pack) {return `/demo/${encodeURIComponent(niche.value)}/${pack}/`;}
  function setFrame(pack) {
    frame.src = demoUrl(pack);
    $('#frame-label').textContent = pack === 'paket-2' ? 'Premium · Paket 2' : 'Sajt · Paket 1';
    $('#frame-full').href = demoUrl(pack);
    $('#demo-top-full').href = demoUrl(pack);
    $('#nina-full').href = `${demoUrl('paket-2')}nina/`;
    $('#active-niche').textContent = niche.options[niche.selectedIndex].text;
    $('#p1').classList.toggle('active', pack === 'paket-1'); $('#p2').classList.toggle('active', pack === 'paket-2');
    history = [];
  }
  niche.addEventListener('change', () => {setFrame($('#p2').classList.contains('active') ? 'paket-2' : 'paket-1');if(session.role==='admin')loadAdmin();});
  $('#p1').onclick = () => setFrame('paket-1'); $('#p2').onclick = () => setFrame('paket-2');
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = () => setFrame(b.dataset.premium ? 'paket-2' : 'paket-1'));
  function applyAction(action) {
    const doc=frame.contentDocument; if(!doc) return;
    doc.getElementById('nidzp-guided-style')?.remove();
    if(action!=='reset'){const style=doc.createElement('style');style.id='nidzp-guided-style';style.textContent=action==='gold'?'header{background:#0b0b0b!important;color:#fff!important;border-bottom:1px solid #fff!important}header a,header button{color:#fff!important}':action==='focus'?'.button,.btn,button[type="submit"]{box-shadow:0 0 0 3px #fff!important;transform:scale(1.02)}':'[class*="hero"]{border-radius:0!important;box-shadow:inset 0 -2px #fff!important}';doc.head.append(style);}
    $('#action-status').textContent=action==='reset'?'Originalni prikaz je vraćen.':'Primenjeno samo u ovom pregledu — ništa nije objavljeno.';
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
    $('#nina-mode').textContent=authed?'Nina odgovara uživo iz odobrenih podataka izabranog demo brenda.':'Javni pregled ne troši AI pozive. Živa Nina je dostupna u zaštićenom režimu.';
    if(session.role==='admin')loadAdmin();
  }
  async function refreshSession(){session=await api('/api/access/session');renderSession();}
  $('#access-form').onsubmit=async e=>{e.preventDefault();$('#access-status').textContent='Provera pristupa…';try{await api('/api/access/login',{pin:$('#access-pin').value,role:$('#access-role').value});$('#access-pin').value='';await refreshSession();$('#access-status').textContent='';dialog.hidden=true;}catch(error){$('#access-status').textContent=error.message;}};
  $('#logout').onclick=async()=>{try{await api('/api/access/logout',{});history=[];$('#live-answer').textContent='';await refreshSession();}catch{$('#health').textContent='Odjava nije potvrđena. Pokušajte ponovo.';}};
  $('#live-form').onsubmit=async e=>{e.preventDefault();const message=$('#live-question').value.trim();if(!message)return;const button=$('#live-send');button.disabled=true;$('#live-answer').textContent='Nina priprema odgovor…';try{const d=await api('/api/nina',{brand:niche.value,message,history});$('#live-answer').textContent=d.odgovor;history=[...history,{role:'user',content:message},{role:'assistant',content:d.odgovor}].slice(-12);$('#live-question').value='';}catch(error){$('#live-answer').textContent=error.message;}finally{button.disabled=false;}};
  function draftKey(){return `nidzp-content-draft:${niche.value}`;}
  async function loadAdmin(){try{const d=await api('/api/admin/preview');$('#admin-status').textContent=d.message;$('#admin-brand').textContent=niche.options[niche.selectedIndex].text;$('#admin-content').value=sessionStorage.getItem(draftKey())||'Tema: predstavite najtraženiju uslugu ovog meseca.\nStatus: nacrt, čeka odobrenje.';}catch(error){$('#admin-status').textContent=error.message;}}
  $('#admin-save').onclick=()=>{sessionStorage.setItem(draftKey(),$('#admin-content').value);$('#admin-status').textContent='Demo nacrt je sačuvan samo u ovoj sesiji pregleda za izabranu delatnost. Ništa nije objavljeno.';};
  // Preporučeni demo iz mejla: /sales/?delatnost=<slug> otvara odmah pravu nišu.
  try {
    const requested = new URLSearchParams(location.search).get('delatnost');
    if (requested && [...niche.options].some(option => option.value === requested)) niche.value = requested;
  } catch { /* Preporuka je dodatak; pregled radi i bez nje. */ }
  // Prodajni pregled je otvoren po osnovi; privatne API rute i dalje štiti server.
  setFrame('paket-1');
  document.body.classList.remove('initializing');
  loadCommercial();
  refreshSession().catch(()=>{session={mode:'public',authenticated:false,role:null};renderSession();});
  api('/api/health').then(d=>$('#health').textContent=d.mode==='public'?'Otvoren pregled · bez PIN-a':d.mode==='private'?'Otvoren pregled · živa Nina uz pristup':'Javni demo · servis nije potvrđen').catch(()=>{$('#health').textContent='Javni demo · servis nije potvrđen';});
})();
