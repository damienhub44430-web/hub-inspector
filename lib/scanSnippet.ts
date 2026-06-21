// Script autonome à coller dans la console du navigateur, sur l'app à importer.
// Il extrait le DOM rendu (positions, styles calculés, textes, images), le
// regroupe en sections et télécharge un hub-scan.json importable via « Session JSON ».
// Aucune dépendance, aucune clé, aucun cloud — tourne dans la page de l'utilisateur.

export const SCAN_SNIPPET = `(function(){
  var SEL=['nav','header','footer','h1','h2','h3','h4','p','li','blockquote','button','a[href]','[class*="cta"]','[class*="btn"]','[class*="hero"]','[class*="card"]','[class*="feature"]','[class*="pricing"]','img','section','article','main > div','form','input','label'];
  var TM={H1:'heading',H2:'heading',H3:'heading',H4:'heading',P:'text',LI:'text',BLOCKQUOTE:'text',BUTTON:'cta',A:'cta',NAV:'navbar',HEADER:'navbar',FOOTER:'footer',SECTION:'section',ARTICLE:'section',IMG:'image',FORM:'form',INPUT:'form',LABEL:'form'};
  var KIND={heading:'heading',text:'text',cta:'button',image:'image',navbar:'section',footer:'footer',section:'section',form:'form',unknown:'text'};
  var _i=0; function uid(p){return p+'-'+Date.now()+'-'+(_i++);}
  function clean(c){ if(!c) return undefined; var t=(''+c).trim().toLowerCase(); if(t==='transparent'||t==='none'||/rgba?\\([^)]*,\\s*0\\s*\\)$/.test(t)) return undefined; return c; }
  var seen=new Set(), els=[];
  var pageH=Math.max(document.body.scrollHeight, window.innerHeight);
  var pageW=document.documentElement.scrollWidth||document.body.scrollWidth||window.innerWidth;
  SEL.forEach(function(s){ document.querySelectorAll(s).forEach(function(el){
    if(seen.has(el)) return; seen.add(el);
    var r=el.getBoundingClientRect(); var top=r.top+(window.scrollY||0), left=r.left+(window.scrollX||0);
    if(r.width<10||r.height<4) return; if(top<0||left<-10) return;
    var tag=el.tagName, type=TM[tag]||'unknown', text='', src='';
    if(['H1','H2','H3','H4','P','LI','BUTTON','A','LABEL','BLOCKQUOTE'].indexOf(tag)>=0) text=(el.innerText||el.textContent||'').trim().slice(0,200);
    if(tag==='IMG'){ text=el.getAttribute('alt')||''; src=el.currentSrc||el.getAttribute('src')||''; }
    if(!text && tag!=='IMG' && ['SECTION','ARTICLE','NAV','HEADER','FOOTER','DIV'].indexOf(tag)<0) return;
    var cs=getComputedStyle(el);
    els.push({tag:tag,type:type,text:text,src:src,x:Math.round(left),y:Math.round(top),w:Math.round(r.width),h:Math.round(r.height),styles:{bgColor:cs.backgroundColor,color:cs.color,fontSize:parseFloat(cs.fontSize)||16,fontWeight:cs.fontWeight}});
  }); });
  els.sort(function(a,b){return a.y-b.y;});
  var secEls=els.filter(function(e){ return ['navbar','section','footer'].indexOf(e.type)>=0; });
  var bands = secEls.length>1 ? secEls : [
    {type:'navbar',y:0,h:Math.round(pageH*0.07),styles:{}},
    {type:'section',y:Math.round(pageH*0.07),h:Math.round(pageH*0.33),styles:{}},
    {type:'section',y:Math.round(pageH*0.40),h:Math.round(pageH*0.35),styles:{}},
    {type:'footer',y:Math.round(pageH*0.75),h:Math.round(pageH*0.25),styles:{}}
  ];
  function childBlock(b){
    var kind=KIND[b.type]||'text', st=b.styles||{}, color=clean(st.color);
    var blk={id:uid('b'),kind:kind,x:Math.round(b.x),y:Math.round(b.y),width:Math.max(8,Math.round(b.w)),height:Math.max(8,Math.round(b.h)),style:{},visible:true,locked:false};
    if(kind==='image'){ blk.src=b.src||''; blk.alt=b.text||''; blk.style={borderRadius:6,backgroundColor:'#1a1a26'}; }
    else if(kind==='button'){ blk.text=b.text||'Bouton'; blk.style={fontSize:st.fontSize||14,fontWeight:st.fontWeight||'600',color:color||'#ffffff',backgroundColor:clean(st.bgColor)||'#7c6af7',borderRadius:8,textAlign:'center'}; }
    else if(kind==='heading'){ var fs=st.fontSize||24; blk.text=b.text||''; blk.level=fs>=34?1:(fs>=24?2:3); blk.style={fontSize:fs,fontWeight:st.fontWeight||'700',color:color||'#111111',lineHeight:1.2}; }
    else { blk.text=b.text||''; blk.style={fontSize:st.fontSize||15,fontWeight:st.fontWeight||'400',color:color||'#444444',lineHeight:1.5,backgroundColor:clean(st.bgColor)}; }
    return blk;
  }
  var blocks=bands.map(function(band){
    var top=band.y, h=band.h||band.height||120;
    var kids=els.filter(function(e){ return e.y>=top && e.y<top+h && ['navbar','section','footer'].indexOf(e.type)<0; });
    return {id:uid('b'),kind:'section',x:0,y:Math.round(top),width:pageW,height:Math.max(40,Math.round(h)),style:{backgroundColor:clean((band.styles||{}).bgColor)},visible:true,locked:false,children:kids.map(childBlock)};
  });
  var screen={id:uid('scr'),name:(location.hostname||'Import'),width:pageW,height:pageH,background:clean(getComputedStyle(document.body).backgroundColor)||'#ffffff',blocks:blocks};
  var doc={projectName:(document.title||location.hostname||'Import scanné'),screens:[screen]};
  var blob=new Blob([JSON.stringify(doc,null,2)],{type:'application/json'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='hub-scan.json'; document.body.appendChild(a); a.click(); a.remove();
  console.log('%chub-inspector','color:#7c6af7;font-weight:bold','→ '+blocks.length+' sections, '+blocks.reduce(function(n,b){return n+b.children.length;},0)+' blocs exportés dans hub-scan.json');
})();`
