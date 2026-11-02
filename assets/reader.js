/* EDITORIAL NKS - Enhancements only; original book, gallery and text remain intact. */
(() => {
  'use strict';
  const chapters=[...document.querySelectorAll('.chapter[id^="lectura-"]')];
  const cover=document.querySelector('.cover');
  const dedication=document.querySelector('.dedication');
  const ending=document.querySelector('.end');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!chapters.length) return;
  const go=(el)=>el?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
  let active=0;
  let lastFocused=null;
  const storageKey='editorial-nks-el-cuestionamiento-lectura-v1';
  const readSaved=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null')}catch(_){return null}};
  const store=(i)=>{try{localStorage.setItem(storageKey,JSON.stringify({chapter:i+1,at:Date.now()}))}catch(_){}};
  const notification=document.createElement('div');
  notification.className='nks-notice';
  notification.setAttribute('role','status');
  notification.setAttribute('aria-live','polite');
  notification.hidden=true;
  document.body.append(notification);
  let hideNotice;
  function notify(text){
    notification.textContent=text; notification.hidden=false;
    clearTimeout(hideNotice);hideNotice=setTimeout(()=>{notification.hidden=true},3200);
  }
  const dock=document.createElement('nav');
  dock.className='nks-dock';
  dock.setAttribute('aria-label','Navegación del libro');
  dock.innerHTML=`
    <button type="button" class="nks-prev" aria-label="Tramo anterior" title="Tramo anterior">←</button>
    <button type="button" class="nks-current" aria-haspopup="dialog" aria-label="Abrir índice de tramos"><span>TRAMO</span> <span class="nks-current-value">01 / 10</span> <span aria-hidden="true">⌄</span></button>
    <button type="button" class="nks-next" aria-label="Tramo siguiente" title="Tramo siguiente">→</button>
    <button type="button" class="nks-share" aria-label="Compartir libro" title="Compartir libro"><span class="nks-icon" aria-hidden="true">↗</span></button>`;
  document.body.append(dock);
  const previous=dock.querySelector('.nks-prev');
  const next=dock.querySelector('.nks-next');
  const currentValue=dock.querySelector('.nks-current-value');
  const indexDialog=document.createElement('dialog');
  indexDialog.className='nks-index-dialog';
  indexDialog.setAttribute('aria-labelledby','nks-index-title');
  indexDialog.innerHTML=`
    <div class="nks-index-top"><div><span class="eyebrow">EDITORIAL NKS</span><h2 id="nks-index-title">Recorrido de lectura</h2></div>
      <button class="nks-close-index" type="button" aria-label="Cerrar índice">×</button></div>
    <p>Diez tramos. Una lectura continua. Selecciona dónde quieres continuar.</p>
    <nav class="nks-index-grid" aria-label="Elegir tramo">${chapters.map((c,i)=>`<a href="#${c.id}" data-nks-chapter="${i}">${String(i+1).padStart(2,'0')}</a>`).join('')}</nav>
    <div class="nks-index-small"><a href="#inicio">Portada</a><a href="#nks-dedicatoria">Dedicatoria</a><a href="#nks-final">Créditos</a></div>`;
  document.body.append(indexDialog);
  if(dedication) dedication.id='nks-dedicatoria';
  if(ending) ending.id='nks-final';
  const indexLinks=[...indexDialog.querySelectorAll('[data-nks-chapter]')];
  const closeIndex=()=>indexDialog.close();
  indexDialog.querySelector('.nks-close-index').addEventListener('click',closeIndex);
  indexDialog.addEventListener('click',e=>{if(e.target===indexDialog)closeIndex()});
  indexDialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href').slice(1);
    const target=document.getElementById(id);
    if(target){e.preventDefault();closeIndex();go(target)}
  }));
  indexDialog.addEventListener('close',()=>lastFocused?.focus({preventScroll:true}));
  dock.querySelector('.nks-current').addEventListener('click',e=>{
    lastFocused=e.currentTarget;
    indexLinks.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
    indexDialog.showModal();
  });
  previous.addEventListener('click',()=>go(active===0?cover:chapters[active-1]));
  next.addEventListener('click',()=>go(active===chapters.length-1?dedication:chapters[active+1]));
  // Resume reading is opt-in and stored only in the reader's own browser.
  const saved=readSaved();
  if(saved && Number.isInteger(saved.chapter) && saved.chapter>=1 && saved.chapter<=chapters.length){
    const resume=document.createElement('a');
    resume.className='nks-continue is-ready';resume.textContent=`Continuar en tramo ${String(saved.chapter).padStart(2,'0')} ↗`;
    resume.href='#'+chapters[saved.chapter-1].id;
    resume.addEventListener('click',e=>{e.preventDefault();go(chapters[saved.chapter-1])});
    cover.querySelector('.read')?.insertAdjacentElement('afterend',resume);
  }
  function refresh(){
    const threshold=Math.min(innerHeight*.45,280);
    for(let i=0;i<chapters.length;i++) if(chapters[i].getBoundingClientRect().top<=threshold)active=i;
    const first=chapters[0].getBoundingClientRect();
    const last=chapters[chapters.length-1].getBoundingClientRect();
    const onPages=first.top<innerHeight*.70 && last.bottom>innerHeight*.12;
    dock.classList.toggle('is-active',onPages);
    dock.setAttribute('aria-hidden',String(!onPages));
    if('inert' in dock) dock.inert=!onPages;
    currentValue.textContent=String(active+1).padStart(2,'0')+' / '+chapters.length;
    previous.setAttribute('aria-label',active===0?'Volver a la portada':'Ir al tramo '+active);
    next.setAttribute('aria-label',active===chapters.length-1?'Ir a la dedicatoria':'Ir al tramo '+(active+2));
    if(onPages)store(active);
  }
  let ticking=false;
  const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{refresh();ticking=false})}};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule);
  refresh();
  if('IntersectionObserver' in window && !reduceMotion){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('page-revealed');observer.unobserve(e.target)}
      })
    },{threshold:.055});
    chapters.forEach(c=>observer.observe(c));
  }
  async function share(){
    if(location.protocol==='file:'){notify('El enlace se podrá compartir cuando publiquemos el libro.');return}
    const payload={title:'El cuestionamiento a lo natural | Editorial NKS',text:'Una lectura de Editorial NKS',url:location.href.split('#')[0]};
    if(navigator.share){try{await navigator.share(payload);return}catch(e){if(e?.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(payload.url);notify('Enlace copiado para compartir.')}catch(_){notify('Comparte esta dirección: '+payload.url)}
  }
  dock.querySelector('.nks-share').addEventListener('click',share);
  if(ending){
    const footerShare=document.createElement('button');
    footerShare.type='button';footerShare.className='nks-footer-share';
    footerShare.textContent='Compartir esta lectura ↗';
    footerShare.style.cssText='display:block;margin:25px auto 10px;min-height:44px;border:1px solid #ad5a2d;background:transparent;color:#914318;border-radius:100px;padding:10px 24px;font-size:14px';
    footerShare.addEventListener('click',share);ending.append(footerShare);
  }
})();
