(function(){
  var root=document.documentElement;
  // ---- theme ----
  function applyTheme(t){
    if(t==='dark'){root.setAttribute('data-theme','dark');}
    else{root.removeAttribute('data-theme');}
    var btn=document.getElementById('themeBtn');
    if(btn) btn.textContent = (t==='dark') ? '☀️' : '🌙';
  }
  var saved=null;
  try{saved=localStorage.getItem('rm-theme');}catch(e){}
  if(!saved){saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light';}
  applyTheme(saved);
  var tb=document.getElementById('themeBtn');
  if(tb) tb.addEventListener('click',function(){
    var cur=root.getAttribute('data-theme')==='dark'?'dark':'light';
    var nt=cur==='dark'?'light':'dark';
    applyTheme(nt); try{localStorage.setItem('rm-theme',nt);}catch(e){}
  });
  // ---- font size ----
  var fs=18;
  try{var f=parseInt(localStorage.getItem('rm-fs'));if(f)fs=f;}catch(e){}
  function setFs(v){fs=Math.max(15,Math.min(24,v));root.style.setProperty('--fs',fs+'px');try{localStorage.setItem('rm-fs',fs);}catch(e){}}
  setFs(fs);
  var fp=document.getElementById('fontPlus'),fm=document.getElementById('fontMinus');
  if(fp)fp.addEventListener('click',function(){setFs(fs+1);});
  if(fm)fm.addEventListener('click',function(){setFs(fs-1);});
  // ---- book search (index) ----
  var bs=document.getElementById('bookSearch');
  if(bs){bs.addEventListener('input',function(){
    var q=this.value.trim().toLowerCase();
    document.querySelectorAll('.book-card').forEach(function(c){
      var t=(c.getAttribute('data-search')||'').toLowerCase();
      c.style.display=(!q||t.indexOf(q)>-1)?'':'none';
    });
  });}
  // ---- glossary search ----
  var gs=document.getElementById('glossSearch');
  if(gs){gs.addEventListener('input',function(){
    var q=this.value.trim().toLowerCase();
    document.querySelectorAll('.gterm').forEach(function(c){
      var t=(c.getAttribute('data-search')||'').toLowerCase()+' '+c.textContent.toLowerCase();
      c.style.display=(!q||t.indexOf(q)>-1)?'':'none';
    });
  });}
  // ---- reading progress + remember position ----
  var bar=document.getElementById('rp-bar');
  if(bar){
    var key='rm-pos-'+location.pathname;
    window.addEventListener('scroll',function(){
      var h=document.documentElement.scrollHeight-window.innerHeight;
      var p=h>0?(window.scrollY/h*100):0;
      bar.style.width=p+'%';
      try{localStorage.setItem(key,window.scrollY);}catch(e){}
    },{passive:true});
    if(!location.hash){
      try{
        var y=parseInt(localStorage.getItem(key));
        if(y>200){
          window.scrollTo(0,y);
          var toast=document.createElement('div');
          toast.className='pos-toast';
          toast.innerHTML='Вы вернулись к месту, где остановились. <button type="button">↑ В начало</button>';
          document.body.appendChild(toast);
          toast.querySelector('button').addEventListener('click',function(){
            window.scrollTo({top:0,behavior:'smooth'});
            try{localStorage.removeItem(key);}catch(e){}
            toast.remove();
          });
          setTimeout(function(){toast.classList.add('hide');setTimeout(function(){toast.remove();},600);},7000);
        }
      }catch(e){}
    }
  }
})();

/* ===== v2: read marks + full-text search ===== */
(function(){
  var cbs=document.querySelectorAll('.read-cb');
  cbs.forEach(function(cb){
    var n=cb.getAttribute('data-book'), card=cb.closest('.book-card');
    var on=false; try{on=localStorage.getItem('rm-read-'+n)==='1';}catch(e){}
    cb.checked=on; if(on&&card)card.classList.add('is-read');
    cb.addEventListener('change',function(){
      try{localStorage.setItem('rm-read-'+n,cb.checked?'1':'0');}catch(e){}
      if(card)card.classList.toggle('is-read',cb.checked);
    });
  });
  var inp=document.getElementById('ftSearch');
  if(!inp||!window.RM_SEARCH) return;
  var box=document.getElementById('ftResults'), st=document.getElementById('ftStatus'), tm=null;
  function escq(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function snip(x,i,qlen){
    var a=Math.max(0,i-90), b=Math.min(x.length,i+qlen+90);
    return (a>0?'…':'')+escq(x.slice(a,i))+'<mark>'+escq(x.slice(i,i+qlen))+'</mark>'+escq(x.slice(i+qlen,b))+(b<x.length?'…':'');
  }
  function run(){
    var q=inp.value.trim();
    box.innerHTML='';
    if(q.length<3){st.textContent=q?'Введите хотя бы 3 символа.':'';return;}
    var ql=q.toLowerCase(), hits=0, out=[];
    for(var k=0;k<window.RM_SEARCH.length && hits<60;k++){
      var ch=window.RM_SEARCH[k], xl=ch.x.toLowerCase(), i=xl.indexOf(ql), per=0, sn=[];
      while(i>-1 && per<3 && hits<60){
        sn.push('<p class="ft-snip">'+snip(ch.x,i,q.length)+'</p>');
        hits++; per++;
        i=xl.indexOf(ql,i+ql.length);
      }
      if(sn.length){
        var href='Главы/'+encodeURIComponent(ch.f)+'/index.html#g'+ch.g;
        out.push('<div class="ft-hit"><h3><a href="'+href+'">Книга '+ch.r+', глава '+ch.g+'. '+escq(ch.t)+'</a></h3>'+sn.join('')+'</div>');
      }
    }
    st.textContent=hits?('Найдено совпадений: '+hits+(hits>=60?' (показаны первые 60)':'')):'Ничего не найдено.';
    box.innerHTML=out.join('');
  }
  inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,250);});
})();

/* ===== v3: вкладки карты миров ===== */
(function(){
  var tabs=document.getElementById('mapTabs');
  if(!tabs) return;
  document.body.classList.add('has-js');
  var panels=document.querySelectorAll('.map-panel');
  var links=tabs.querySelectorAll('.map-tab');
  var ids=Array.prototype.map.call(panels,function(p){return p.id;});
  function show(id){
    if(ids.indexOf(id)<0) id=ids[0];
    panels.forEach(function(p){p.classList.toggle('active',p.id===id);});
    links.forEach(function(l){l.classList.toggle('active',l.getAttribute('data-tab')===id);});
  }
  function fromHash(){show((location.hash||'#'+ids[0]).slice(1));}
  window.addEventListener('hashchange',fromHash);
  fromHash();
})();

/* ===== v4: кнопка «наверх» ===== */
(function(){
  var btn=document.createElement('button');
  btn.id='toTop'; btn.type='button'; btn.title='Наверх'; btn.setAttribute('aria-label','Наверх');
  btn.textContent='↑';
  document.body.appendChild(btn);
  btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});
  function check(){btn.classList.toggle('show',window.scrollY>600);}
  window.addEventListener('scroll',check,{passive:true});
  check();
})();

/* ===== v5: возврат к книге со страниц схем/словаря ===== */
(function(){
  try{
    var here=decodeURIComponent(location.pathname);
    var onBook=here.indexOf('/Главы/')>-1;
    if(onBook){
      // страница книги запоминает себя (работает и при открытии с диска)
      sessionStorage.setItem('rm-last-book',location.href);
      var mm=here.match(/\/Главы\/Книга (\d+)[^/]*\//);
      if(mm) sessionStorage.setItem('rm-last-book-num',mm[1]);
      return;
    }
    var saved=sessionStorage.getItem('rm-last-book');
    if(!saved) return;
    var num=sessionStorage.getItem('rm-last-book-num')||'';
    var ROM={1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI',12:'XII'};
    var btn=document.createElement('button');
    btn.id='backToBook'; btn.type='button';
    btn.textContent='← Вернуться к книге '+(ROM[num]||num);
    btn.addEventListener('click',function(){
      // если пришли прямо с книги — назад по истории (вернёт на то же место),
      // иначе — переход по сохранённой ссылке (позицию восстановит читалка)
      var ref=document.referrer;
      if(ref && decodeURIComponent(ref).indexOf('/Главы/')>-1){history.back();}
      else{location.href=saved;}
    });
    document.body.appendChild(btn);
  }catch(e){}
})();
