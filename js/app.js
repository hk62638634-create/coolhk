// =====================================================================
// GEO HELPERS (pure functions)
// =====================================================================
const WALK=80, DETOUR=1.3;
const LAT0=22.32, KX=111320*Math.cos(LAT0*Math.PI/180), KY=110540;
const xy=(la,ln)=>[ln*KX,la*KY];
const dist=(a,b)=>{const[x1,y1]=xy(a[0],a[1]),[x2,y2]=xy(b[0],b[1]);return Math.hypot(x2-x1,y2-y1)};
function segDist(p,a,b){const[px,py]=xy(p[0],p[1]),[ax,ay]=xy(a[0],a[1]),[bx,by]=xy(b[0],b[1]);const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let s=L?((px-ax)*dx+(py-ay)*dy)/L:0;s=Math.max(0,Math.min(1,s));return Math.hypot(px-(ax+s*dx),py-(ay+s*dy))}
const lineDist=(p,pts)=>{let m=Infinity;for(let i=0;i<pts.length-1;i++)m=Math.min(m,segDist(p,pts[i],pts[i+1]));return m};
function along(p,a,b){const[px,py]=xy(p[0],p[1]),[ax,ay]=xy(a[0],a[1]),[bx,by]=xy(b[0],b[1]);const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1;return{s:((px-ax)*dx+(py-ay)*dy)/L,d:Math.abs((px-ax)*dy-(py-ay)*dx)/Math.sqrt(L)}}
const walkMin=m=>m*DETOUR/WALK;
const nearestShelters=(p,n=1)=>SHELTERS.map(s=>({s,d:dist(p,[s.lat,s.lng])})).sort((a,b)=>a.d-b.d).slice(0,n);
const nearestStation=p=>STATIONS.map(s=>({s,d:dist(p,[s.lat,s.lng])})).sort((a,b)=>a.d-b.d)[0].s;
function shadeStats(coords){
  let tot=0,sh=0;const used=new Set();
  for(let i=0;i<coords.length-1;i++){
    const a=coords[i],b=coords[i+1],L=dist(a,b),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];tot+=L;let hit=false;
    SHADE.forEach((s,k)=>{if(coversNow(s)&&lineDist(m,s.pts)<35){hit=true;used.add(k)}});
    if(!hit&&mode!=="rain"&&SHELTERS.some(s=>dist(m,[s.lat,s.lng])<70))hit=true;
    if(hit)sh+=L;
  }
  return{tot,sh,pct:tot?sh/tot:0,used:[...used]};
}
// weather setting: "sun" (avoid the sun) or "rain" (stay dry). Trees give shade but no rain cover.
let mode="sun"; try{mode=localStorage.getItem("coolhk-mode")==="rain"?"rain":"sun"}catch(e){}
const coversNow=s=>mode!=="rain"||s.kind!=="trees";
const coveredCol=()=>css(mode==="rain"?"--rain":"--shade"), exposedCol=()=>css(mode==="rain"?"--wet":"--sunroute");
const tm=k=>mode==="rain"?k+"Rain":k;
// is this stretch of the route covered? (same test as shadeStats)
function segShaded(a,b){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];return SHADE.some(s=>coversNow(s)&&lineDist(m,s.pts)<35)||(mode!=="rain"&&SHELTERS.some(s=>dist(m,[s.lat,s.lng])<70))}
// split a route into continuous shaded / sunny runs
function shadeRuns(coords){const runs=[];for(let i=0;i<coords.length-1;i++){const sh=segShaded(coords[i],coords[i+1]),last=runs.at(-1);if(last&&last.shaded===sh)last.pts.push(coords[i+1]);else runs.push({shaded:sh,pts:[coords[i],coords[i+1]]})}return runs}
function shadeWaypoints(a,b){
  const AB=dist(a,b),corr=Math.max(250,AB*.35),c=[];
  SHADE.forEach((s,k)=>{if(!coversNow(s))return;const f=s.pts[0],l=s.pts.at(-1),pf=along(f,a,b),pl=along(l,a,b),pm=along(s.pts[Math.floor(s.pts.length/2)],a,b);
    if(pm.s>-.1&&pm.s<1.1&&Math.min(pf.d,pl.d,pm.d)<corr)c.push({k,d:Math.min(pf.d,pl.d,pm.d),s:pm.s,pts:pf.s<=pl.s?[f,l]:[l,f]})});
  return c.sort((x,y)=>x.d-y.d).slice(0,2).sort((x,y)=>x.s-y.s);
}
// Hong Kong 1980 Grid (EPSG:2326) -> WGS84, for results from the government location search
function hk80ToWgs(E,N){
  const a=6378388,f=1/297,e2=2*f-f*f,ep2=e2/(1-e2),k0=1,FE=836694.05,FN=819069.80;
  const p0=(22+18/60+43.68/3600)*Math.PI/180,l0=(114+10/60+42.80/3600)*Math.PI/180;
  const e4=e2*e2,e6=e4*e2;
  const Mf=p=>a*((1-e2/4-3*e4/64-5*e6/256)*p-(3*e2/8+3*e4/32+45*e6/1024)*Math.sin(2*p)+(15*e4/256+45*e6/1024)*Math.sin(4*p)-(35*e6/3072)*Math.sin(6*p));
  const M=Mf(p0)+(N-FN)/k0,mu=M/(a*(1-e2/4-3*e4/64-5*e6/256)),e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2));
  const p1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)+(1097*e1**4/512)*Math.sin(8*mu);
  const C1=ep2*Math.cos(p1)**2,T1=Math.tan(p1)**2,N1=a/Math.sqrt(1-e2*Math.sin(p1)**2),R1=a*(1-e2)/Math.pow(1-e2*Math.sin(p1)**2,1.5),Dd=(E-FE)/(N1*k0);
  const lat=p1-(N1*Math.tan(p1)/R1)*(Dd*Dd/2-(5+3*T1+10*C1-4*C1*C1-9*ep2)*Dd**4/24+(61+90*T1+298*C1+45*T1*T1-252*ep2-3*C1*C1)*Dd**6/720);
  const lng=l0+(Dd-(1+2*T1+C1)*Dd**3/6+(5-2*C1+28*T1-3*C1*C1+8*ep2+24*T1*T1)*Dd**5/120)/Math.cos(p1);
  return[lat*180/Math.PI-5.5/3600,lng*180/Math.PI+8.8/3600];
}

// =====================================================================
// UI HELPERS
// =====================================================================
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>el.classList.remove("on"),2600)}
function applyLang(){
  document.documentElement.lang = lang==="zh"?"zh-Hant-HK":"en";
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=t(el.dataset.i18n)});
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{el.placeholder=t(el.dataset.i18nPh)});
  $("langBtn").textContent = lang==="zh"?"EN":"中文";
  renderLayoutBtn();
}

// layout: auto / phone / desktop
let layoutPref="auto"; try{layoutPref=localStorage.getItem("coolhk-layout")||"auto"}catch(e){}
function applyLayout(){
  const app=$("app"), wide=window.innerWidth>760;
  const L = (layoutPref==="auto"||!wide) ? (wide?"desktop":"phone") : layoutPref;
  $("layoutBtn").hidden = !wide; // the layout switch only makes sense on a big screen
  app.dataset.layout=L;
  const framed = L==="phone" && wide;
  app.classList.toggle("framed",framed); document.body.classList.toggle("framed-bg",framed);
  renderLayoutBtn();
}
function renderLayoutBtn(){ $("layoutBtn").textContent = layoutPref==="phone"?t("layoutPhone"):layoutPref==="desktop"?t("layoutDesk"):t("layoutAuto"); }
$("layoutBtn").onclick=()=>{layoutPref={auto:"phone",phone:"desktop",desktop:"auto"}[layoutPref];try{localStorage.setItem("coolhk-layout",layoutPref)}catch(e){};applyLayout()};
window.addEventListener("resize",applyLayout);
$("langBtn").onclick=()=>{lang=lang==="zh"?"en":"zh";try{localStorage.setItem("coolhk-lang",lang)}catch(e){};applyLang();onLangChange()};
// bottom sheet: drag the handle up or down (no tap needed); it snaps to small / half / full height.
// A quick flick moves one step in that direction. Keyboard users can still press Enter or Space on the handle.
(function(){
  const sheet=$("sheet"), handle=$("handle"), order=["mini","peek","full"];
  let drag=null;
  const snapHeights=()=>{ const H=sheet.parentElement.clientHeight; return {mini:118, peek:H*.52, full:H*.88}; };
  handle.addEventListener("pointerdown",e=>{
    if($("app").dataset.layout!=="phone") return;
    drag={y:e.clientY, h:sheet.offsetHeight, lastY:e.clientY, lastT:e.timeStamp, v:0};
    sheet.classList.add("dragging"); handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener("pointermove",e=>{
    if(!drag) return; const S=snapHeights();
    sheet.style.height=Math.max(S.mini,Math.min(S.full,drag.h+(drag.y-e.clientY)))+"px";
    const dt=e.timeStamp-drag.lastT; if(dt>0){ drag.v=(drag.lastY-e.clientY)/dt; drag.lastY=e.clientY; drag.lastT=e.timeStamp; }
  });
  const end=()=>{
    if(!drag) return; const S=snapHeights(), cur=sheet.offsetHeight, v=drag.v; drag=null;
    let st=order.reduce((best,k)=>Math.abs(S[k]-cur)<Math.abs(S[best]-cur)?k:best,"peek"); // nearest size
    if(v>0.6) st=order.find(k=>S[k]>cur+8)||"full";                  // flicked up: next size up
    else if(v<-0.6) st=[...order].reverse().find(k=>S[k]<cur-8)||"mini"; // flicked down: next size down
    sheet.classList.remove("dragging"); sheet.style.height=""; sheet.dataset.state=st;
  };
  handle.addEventListener("pointerup",end); handle.addEventListener("pointercancel",end);
  handle.addEventListener("click",e=>{ if(e.detail===0) sheet.dataset.state={peek:"full",full:"mini",mini:"peek"}[sheet.dataset.state]; }); // keyboard only
})();
const sheetTo=st=>{ if($("app").dataset.layout==="phone") $("sheet").dataset.state=st; };
// tell the map how much of it the bottom sheet covers, so goTo / centring / popups use the visible part
function syncPadding(){
  if(!view) return; const phone=$("app").dataset.layout==="phone", st=$("sheet").dataset.state;
  view.padding={top:0,left:0,right:0,bottom: phone&&st!=="full" ? $("sheet").offsetHeight : 0};
}

// =====================================================================
// WEATHER — district temperature & RH from the Hong Kong Observatory
// =====================================================================
let WX=null; // {temps:{station:value}, rh:{station:value}, rhHQ, warn, live}
async function loadWeather(){
  try{
    const [now,warn]=await Promise.all([
      fetch("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en").then(r=>r.json()),
      fetch("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en").then(r=>r.json())]);
    const temps={}; now.temperature.data.forEach(d=>temps[d.place]=d.value);
    const rhHQ = now.humidity.data[0].value; let rh={};
    try{ // regional relative humidity (1-minute readings per station)
      const csv=await fetch("https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_humidity.csv").then(r=>r.text());
      csv.trim().split(/\r?\n/).slice(1).forEach(l=>{const c=l.split(",");const v=parseFloat(c[2]);if(c[1]&&!isNaN(v))rh[c[1].trim()]=v});
    }catch(e){}
    const code=warn.WHOT&&warn.WHOT.code;
    WX={temps,rh,rhHQ,warn:code==="VHOT"?"vhot":code==="HOT"?"hot":"",live:true};
  }catch(e){
    const temps={},rh={}; STATIONS.forEach((s,i)=>{temps[s.en]=+(32+((i*37)%30)/10).toFixed(1);rh[s.en]=70+((i*13)%16)});
    WX={temps,rh,rhHQ:76,warn:"",live:false};
  }
}
let wxPoint=[SAMPLE_START.lat,SAMPLE_START.lng];
function renderWeather(p){
  if(p) wxPoint=p; if(!WX) return;
  // nearest station that reported a temperature
  const st=STATIONS.filter(s=>WX.temps[s.en]!=null).map(s=>({s,d:dist(wxPoint,[s.lat,s.lng])})).sort((a,b)=>a.d-b.d)[0].s;
  const temp=WX.temps[st.en]; const rhSt=STATIONS.filter(s=>WX.rh[s.en]!=null).map(s=>({s,d:dist(wxPoint,[s.lat,s.lng])})).sort((a,b)=>a.d-b.d)[0];
  const useLocalRh = rhSt && rhSt.d<6000; const rh = useLocalRh?WX.rh[rhSt.s.en]:WX.rhHQ;
  $("wx").innerHTML=`<span class="where">📍 ${nm(st)} · ${t("wxNear")}</span>
    <span class="vals"><span class="t">${temp}°C</span><span class="rh">RH ${rh}%</span></span>
    ${WX.warn?`<span class="warn">⚠ ${t(WX.warn)}</span>`:""}
    <span class="src">${WX.live?t("wxLive"):t("wxSample")}${useLocalRh?"":" · "+t("wxRhHQ")}</span>`;
  $("heatAlert").innerHTML = WX.warn?`<div class="alert">${t("heatAdvice",t(WX.warn),temp)}</div>`:"";
}

// =====================================================================
// ARCGIS MAP
// =====================================================================
let view, Graphic, Circle, Basemap, WebTileLayer, layers={}, currentBasemap="hk";
let version="public", tier=0;
try{tier=+(localStorage.getItem("coolhk-tier")||0)}catch(e){}

require(["esri/config","esri/Map","esri/WebMap","esri/views/MapView","esri/Basemap","esri/layers/WebTileLayer","esri/layers/GraphicsLayer","esri/Graphic","esri/geometry/Circle","esri/core/reactiveUtils","esri/widgets/Locate"],
(esriConfig,EsriMap,WebMap,MapView,_Basemap,_WebTileLayer,GraphicsLayer,_Graphic,_Circle,reactiveUtils,Locate)=>{
  Graphic=_Graphic; Circle=_Circle; Basemap=_Basemap; WebTileLayer=_WebTileLayer;
  esriConfig.portalUrl = CONFIG.PORTAL_URL;
  if(CONFIG.ARCGIS_API_KEY) esriConfig.apiKey = CONFIG.ARCGIS_API_KEY;

  const map = CONFIG.WEBMAP_ID ? new WebMap({portalItem:{id:CONFIG.WEBMAP_ID}}) : new EsriMap({basemap:makeBasemap("hk")});
  ["lst","catch","walk","demand","areas","shade","shelters","mtr","mtrlab","route","exits","deploy"].forEach(k=>{layers[k]=new GraphicsLayer({id:k});});
  layers.mtrlab.minScale=20000; // station names only at street level
  map.addMany([layers.lst,layers.catch,layers.walk,layers.demand,layers.mtr,layers.shade,layers.mtrlab,layers.areas,layers.shelters,layers.route,layers.exits,layers.deploy]);

  view = new MapView({container:"map",map,center:[114.18,22.30],zoom:13,
    constraints:{minZoom:10,maxZoom:19,snapToZoom:false},
    popup:{dockEnabled:false,dockOptions:{buttonEnabled:false}}});
  view.ui.move("zoom","bottom-right");
  // "locate me" button: only asks for the location when the user taps it
  view.ui.add(new Locate({view,scale:4000,popupEnabled:false}),{position:"bottom-right",index:0});
  // keep routes, popups and buttons in the part of the map the bottom sheet does not cover
  new ResizeObserver(syncPadding).observe($("sheet"));
  syncPadding();
  // keep the map attribution visible (required by the Esri / Lands Department terms)

  view.on("click",e=>{
    if(picking){ e.stopPropagation(); picking=false; $("pickBtn").setAttribute("aria-pressed","false");
      startPoint={lat:e.mapPoint.latitude,lng:e.mapPoint.longitude,en:t("start"),zh:t("start")};
      $("startIn").value = `${e.mapPoint.latitude.toFixed(4)}, ${e.mapPoint.longitude.toFixed(4)}`; $("startIn")._sel={...startPoint,label:$("startIn").value}; renderExitRow("start",null); findRoute(); }
  });
  reactiveUtils.when(()=>view.stationary,()=>{ if(version==="premium"&&view.center) renderWeather([view.center.latitude,view.center.longitude]); });

  drawShade(); drawShelters(); drawCatch(); drawWalk(); drawMTR();
  view.when(()=>{ $("mapLoading").classList.add("done"); show("public"); checkHKTiles(); });
});

function makeBasemap(id){
  if(id==="hk"){
    const lab = lang==="zh"?"tc":"en";
    return new Basemap({title:"LandsD",id:"hk-landsd",
      baseLayers:[new WebTileLayer({urlTemplate:"https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/{level}/{col}/{row}.png",copyright:"© Lands Department, HKSAR"})],
      referenceLayers:[new WebTileLayer({urlTemplate:`https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/${lab}/WGS84/{level}/{col}/{row}.png`})]});
  }
  return Basemap.fromId(id==="topo"?"topo-vector":"hybrid");
}
function checkHKTiles(){
  if(CONFIG.WEBMAP_ID) return;
  const img=new Image(); let done=false;
  const fail=()=>{ if(done) return; done=true; if(currentBasemap==="hk"){ setBasemap("topo"); toast(lang==="zh"?"未能載入地政總署地圖，已改用 ArcGIS 地形圖。":"Couldn't load the Lands Department map, so we switched to ArcGIS Topographic."); } };
  img.onload=()=>{done=true}; img.onerror=fail; setTimeout(fail,8000);
  img.src="https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/13/6694/3575.png";
}
function setBasemap(id){ currentBasemap=id; if(view) view.map.basemap=makeBasemap(id);
  document.querySelectorAll("#bmaps button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.b===id)); }
document.querySelectorAll("#bmaps button").forEach(b=>b.onclick=()=>setBasemap(b.dataset.b));

// graphic builders
const pt=(lat,lng)=>({type:"point",latitude:lat,longitude:lng});
const pline=(coords)=>({type:"polyline",paths:[coords.map(c=>[c[1],c[0]])],spatialReference:{wkid:4326}});
const rgba=(hex,a)=>{const c=hex.replace("#","");const n=parseInt(c.length===3?c.split("").map(x=>x+x).join(""):c,16);return[(n>>16)&255,(n>>8)&255,n&255,a]};
function dot(lat,lng,color,size,popup,outline="#ffffff"){return new Graphic({geometry:pt(lat,lng),symbol:{type:"simple-marker",color,size,outline:{color:outline,width:2}},popupTemplate:popup})}
function ring(lat,lng,r,fill,line,dash){return new Graphic({geometry:new Circle({center:pt(lat,lng),radius:r,radiusUnit:"meters",geodesic:true}),symbol:{type:"simple-fill",color:fill,outline:{color:line||[0,0,0,0],width:line?1:0,style:dash?"dash":"solid"}}})}

function shadeCol(k){return k==="trees"?css("--tree"):css("--covered")}
function shadeLabel(k){return k==="trees"?t("shadeTrees"):k==="indoor"?t("shadeIndoor"):t("shadeCovered")}
function drawShade(){
  layers.shade.removeAll();
  SHADE.forEach(s=>{
    layers.shade.add(new Graphic({attributes:{kind:s.kind},geometry:pline(s.pts),symbol:{type:"simple-line",color:[255,255,255,.9],width:8}}));
    layers.shade.add(new Graphic({attributes:{kind:s.kind},geometry:pline(s.pts),symbol:{type:"simple-line",color:shadeCol(s.kind),width:5,style:s.kind==="indoor"?"short-dot":"solid"},
      popupTemplate:{title:nm(s),content:shadeLabel(s.kind)}}));
  });
}
function drawShelters(){
  layers.shelters.removeAll();
  SHELTERS.forEach(s=>layers.shelters.add(dot(s.lat,s.lng,css("--cool"),12,{title:nm(s),content:`${lang==="zh"?TYPE[s.type]:s.type} · ${lang==="zh"?D[s.dist]:s.dist}<br>${t("freeAccess")}`})));
}
function drawCatch(){
  layers.catch.removeAll(); const c=css("--cool");
  SHELTERS.forEach(s=>{ layers.catch.add(ring(s.lat,s.lng,10*WALK/DETOUR,rgba(c,.06),rgba(c,.6),true)); layers.catch.add(ring(s.lat,s.lng,5*WALK/DETOUR,rgba(c,.10))); });
}
// public layer: 5 / 10-minute walk areas around cool shelters (polygons)
function drawWalk(){
  layers.walk.removeAll(); const c=css("--cool");
  SHELTERS.forEach(s=>{ layers.walk.add(ring(s.lat,s.lng,10*WALK/DETOUR,rgba(c,.06),rgba(c,.6),true)); layers.walk.add(ring(s.lat,s.lng,5*WALK/DETOUR,rgba(c,.12))); });
}
function onLangChange(){
  if(!view) return; if(currentBasemap==="hk" && !CONFIG.WEBMAP_ID) setBasemap("hk");
  drawShade(); drawShelters(); drawMTR(); syncPub(); renderWeather(); refreshExitRows();
  ["start","dest"].forEach(f=>{const i=$(f+"In");if(i._sel&&i._sel.en){i.value=i._sel.kind==="exit"?t("exitLabel",nm(i._sel.obj),i._sel.ref):i._sel.kind==="mtr"?stLabel(i._sel.obj):(lang==="zh"?i._sel.zh:i._sel.en);i._sel.label=i.value}});
  if(version==="public"){ if(routes.fast) renderRoutes(); } else renderPremium();
}

// =====================================================================
// MTR EXITS — loaded live from OpenStreetMap (Overpass API), cached for a week
// =====================================================================
let exitsState="loading";
async function loadExits(){
  const KEY="coolhk-mtr-exits-v1";
  try{const c=JSON.parse(localStorage.getItem(KEY)||"null");if(c&&Date.now()-c.t<7*864e5){applyExits(c.d);return}}catch(e){}
  const bb="22.13,113.82,22.57,114.45";
  const q=`[out:json][timeout:40];(nwr["railway"="subway_entrance"](${bb});nwr["railway"="train_station_entrance"](${bb});nwr["railway"="station"](${bb}););out center tags;`;
  try{
    const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"}});
    const j=await r.json();
    const d=j.elements.map(e=>({lat:e.lat??e.center?.lat,lng:e.lon??e.center?.lon,tg:e.tags||{}})).filter(e=>e.lat)
      .map(e=>({lat:+e.lat.toFixed(6),lng:+e.lng.toFixed(6),ent:/entrance/.test(e.tg.railway||""),light:e.tg.station==="light_rail"||e.tg.light_rail==="yes",
        en:e.tg["name:en"]||"",zh:e.tg["name:zh"]||e.tg.name||"",ref:e.tg.ref||e.tg["ref:exit"]||e.tg.name||""}));
    try{localStorage.setItem(KEY,JSON.stringify({t:Date.now(),d}))}catch(e){}
    applyExits(d);
  }catch(e){ exitsState="none"; refreshExitRows(); }
}
function applyExits(d){
  // 1) refine station centres with OSM stations of the same name
  d.filter(e=>!e.ent&&!e.light).forEach(o=>{
    const st=MTR.find(s=>(o.en&&s.en.toLowerCase()===o.en.replace(/ station$/i,"").toLowerCase())||(o.zh&&o.zh.replace(/站$/,"")===s.zh));
    if(st&&dist([st.lat,st.lng],[o.lat,o.lng])<1200){st.lat=o.lat;st.lng=o.lng}
  });
  // 2) attach each entrance to the nearest station within 450 m
  MTR.forEach(s=>s.exits=[]);
  d.filter(e=>e.ent).forEach(o=>{
    const m=(o.ref||"").match(/\b([A-Z]\d{0,2}[a-z]?)\b/); if(!m) return;
    let best=null,bd=450; MTR.forEach(s=>{const dd=dist([s.lat,s.lng],[o.lat,o.lng]);if(dd<bd){bd=dd;best=s}});
    if(best&&!best.exits.some(x=>x.ref===m[1])) best.exits.push({ref:m[1],lat:o.lat,lng:o.lng});
  });
  MTR.forEach(s=>s.exits.sort((a,b)=>a.ref.localeCompare(b.ref,undefined,{numeric:true})));
  exitsState="ready"; refreshExitRows(); if(view) drawMTR();
}

// =====================================================================
// ADDRESS SEARCH — every Hong Kong address (ALS), government POIs (GeoInfo Map), optional Google Places
// =====================================================================
const pick=(o,...keys)=>keys.reduce((v,k)=>v&&v[k],o);
function alsLabel(pa,zh){
  if(!pa) return "";
  if(zh){const c=pa.ChiPremisesAddress||{};const st=c.ChiStreet||{};const es=c.ChiEstate||{};
    return [pick(c,"ChiDistrict","DcDistrict"),st.StreetName&&(st.StreetName+(st.BuildingNoFrom?st.BuildingNoFrom+(st.BuildingNoTo?"-"+st.BuildingNoTo:"")+"號":"")),es.EstateName,c.BuildingName].filter(Boolean).join(" ");}
  const e=pa.EngPremisesAddress||{};const st=e.EngStreet||{};const es=e.EngEstate||{};
  return [e.BuildingName,es.EstateName,st.StreetName&&((st.BuildingNoFrom?st.BuildingNoFrom+(st.BuildingNoTo?"-"+st.BuildingNoTo:"")+" ":"")+st.StreetName),pick(e,"EngDistrict","DcDistrict")].filter(Boolean).join(", ");
}
async function searchALS(q,n=5){
  const r=await fetch(`https://www.als.gov.hk/lookup?q=${encodeURIComponent(q)}&n=${n}`,{headers:{Accept:"application/json"}}).then(r=>r.json());
  return (r.SuggestedAddress||[]).map(x=>{
    const pa=pick(x,"Address","PremisesAddress"); let g=pa&&pa.GeospatialInformation; if(Array.isArray(g)) g=g[0];
    if(!g) return null;
    let la=parseFloat(g.Latitude), ln=parseFloat(g.Longitude);
    if(isNaN(la)||isNaN(ln)){ if(!g.Easting) return null; [la,ln]=hk80ToWgs(+g.Easting,+g.Northing); }
    const en=alsLabel(pa,false)||q, zh=alsLabel(pa,true)||en;
    return {kind:"place",lat:la,lng:ln,en,zh,label:lang==="zh"?zh:en,sub:t("srcALS"),icon:`<span class="ic">🏢</span>`};
  }).filter(Boolean);
}
async function searchGeoInfo(q,n=5){
  const r=await fetch(`https://geodata.gov.hk/gs/api/v1.0.0/locationSearch?q=${encodeURIComponent(q)}`).then(r=>r.json());
  if(!Array.isArray(r)) return [];
  return r.slice(0,n).map(x=>{const[la,ln]=hk80ToWgs(+x.x,+x.y);const en=x.nameEN||x.addressEN||q,zh=x.nameZH||x.addressZH||en;
    return{kind:"place",lat:la,lng:ln,en,zh,label:lang==="zh"?zh:en,sub:(lang==="zh"?x.addressZH:x.addressEN)||t("srcGeo"),icon:`<span class="ic">📍</span>`}});
}
let gPlaces=null;
async function googleReady(){
  if(!CONFIG.GOOGLE_MAPS_API_KEY) return null; if(gPlaces) return gPlaces;
  if(!window.google||!google.maps){ await new Promise((res,rej)=>{const sc=document.createElement("script");
    sc.src=`https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&loading=async&libraries=places&v=weekly`;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)});
    await new Promise(r=>{const w=()=>google.maps.importLibrary?r():setTimeout(w,50);w()}); }
  gPlaces=await google.maps.importLibrary("places"); return gPlaces;
}
async function searchGoogle(q){
  const P=await googleReady(); if(!P) return [];
  const {suggestions}=await P.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:q,includedRegionCodes:["hk"],language:lang==="zh"?"zh-HK":"en",
    locationBias:{lat:refPoint()[0],lng:refPoint()[1]}});
  return suggestions.filter(x=>x.placePrediction).slice(0,5).map(x=>{const p=x.placePrediction;
    return{kind:"gplace",pred:p,label:p.mainText?p.mainText.text:p.text.text,sub:(p.secondaryText?p.secondaryText.text+" · ":"")+"Google",icon:`<span class="ic" style="font-weight:800;color:#4285F4">G</span>`}});
}
async function googlePoint(it){
  const place=it.pred.toPlace(); await place.fetchFields({fields:["location","displayName","formattedAddress"]});
  const name=(place.displayName||it.label);
  return{kind:"place",lat:place.location.lat(),lng:place.location.lng(),en:name,zh:name,label:it.label,sub:place.formattedAddress||""};
}

// =====================================================================
// SUGGESTIONS for the start / destination boxes
// =====================================================================
const stLabel=s=>lang==="zh"?s.zh+"站":s.en+" Station";
const lineBadge=s=>`<span class="ic mtr">${s.lines.slice(0,3).map(l=>`<i style="background:${LINES[l][2]}"></i>`).join("")}</span>`;
const lineNames=s=>s.lines.map(l=>lang==="zh"?LINES[l][1]:LINES[l][0]).join(" · ");
function refPoint(){ return startPoint?[startPoint.lat,startPoint.lng]:wxPoint; }
function itemFor(o,kind){
  if(kind==="mtr") return {kind,obj:o,lat:o.lat,lng:o.lng,en:o.en+" Station",zh:o.zh+"站",label:stLabel(o),sub:lineNames(o),icon:lineBadge(o)};
  if(kind==="shelter") return {kind,obj:o,lat:o.lat,lng:o.lng,en:o.en,zh:o.zh,label:nm(o),sub:`${t("typeShelter")} · ${lang==="zh"?TYPE[o.type]:o.type}`,icon:`<span class="ic" style="background:var(--cool-soft);color:var(--cool)">❄</span>`};
  if(kind==="area") return {kind,obj:o,lat:o.lat,lng:o.lng,en:o.en,zh:o.zh,label:nm(o),sub:`${t("typeArea")} · ${lang==="zh"?D[o.dist]:o.dist}`,icon:`<span class="ic">⌂</span>`};
}
function exitItem(s,x){return{kind:"exit",obj:s,ref:x.ref,lat:x.lat,lng:x.lng,en:`${s.en} Station Exit ${x.ref}`,zh:`${s.zh}站 ${x.ref} 出口`,label:t("exitLabel",nm(s),x.ref),sub:lineNames(s),icon:`<span class="ic" style="background:var(--ink);color:var(--panel);font:600 11px var(--f-mono)">${x.ref}</span>`}}
const norm=v=>v.toLowerCase().replace(/\s+/g," ").replace(/ station$| stn$|站$/,"").trim();
function matchScore(o,q){const e=o.en.toLowerCase(),z=o.zh;if(e===q||z===q)return 0;if(e.startsWith(q)||z.startsWith(q))return 1;if(e.includes(q)||z.includes(q))return 2;return 9}
function localSuggest(raw,field){
  const q=norm(raw), groups=[];
  if(!q){
    const p=refPoint(), byD=(arr)=>arr.map(o=>({o,d:dist(p,[o.lat,o.lng])})).sort((a,b)=>a.d-b.d);
    groups.push({hdr:null,items:[field==="start"?{kind:"here",label:t("useMyLoc"),sub:"",icon:`<span class="ic" style="background:var(--heat-soft);color:var(--heat)">◎</span>`}
                                               :{kind:"nearest",label:t("nearestOpt"),sub:"",icon:`<span class="ic" style="background:var(--cool-soft);color:var(--cool)">❄</span>`}]});
    const ms=byD(MTR).slice(0,4).map(x=>({...itemFor(x.o,"mtr"),sub:`${lineNames(x.o)} · ~${walkMin(x.d).toFixed(0)} ${t("min")}`}));
    const ss=byD(SHELTERS).slice(0,field==="dest"?4:2).map(x=>({...itemFor(x.o,"shelter"),sub:`${t("typeShelter")} · ~${walkMin(x.d).toFixed(0)} ${t("min")}`}));
    if(field==="dest"){groups.push({hdr:t("hdrNearShel"),items:ss});groups.push({hdr:t("hdrNearMtr"),items:ms})}
    else {groups.push({hdr:t("hdrNearMtr"),items:ms});groups.push({hdr:t("hdrNearShel"),items:ss})}
    return groups;
  }
  // "<station> <exit>" e.g. "mong kok a2", "旺角 A2", "旺角站A2出口"
  const em=raw.trim().match(/^(.+?)\s*(?:站)?\s*(?:exit\s*)?([A-Za-z]\d{0,2}[a-z]?)\s*(?:出口)?$/i);
  if(em){const sq=norm(em[1]),ref=em[2].toUpperCase();
    const st=MTR.map(s=>({s,k:matchScore(s,sq)})).filter(x=>x.k<9).sort((a,b)=>a.k-b.k)[0];
    if(st&&st.s.exits&&st.s.exits.length){const xs=st.s.exits.filter(x=>x.ref.startsWith(ref));if(xs.length)groups.push({hdr:t("hdrExits"),items:xs.slice(0,8).map(x=>exitItem(st.s,x))})}}
  const pick=(arr,kind,n)=>arr.map(o=>({o,k:matchScore(o,q)})).filter(x=>x.k<9).sort((a,b)=>a.k-b.k).slice(0,n).map(x=>itemFor(x.o,kind));
  const m=pick(MTR,"mtr",6), sh=pick(SHELTERS,"shelter",4), ar=pick(AREAS,"area",3);
  if(m.length) groups.push({hdr:t("hdrMtr"),items:m});
  if(sh.length||ar.length) groups.push({hdr:t("hdrPlaces"),items:[...sh,...ar]});
  return groups;
}
const SUG={start:{items:[],remote:[],timer:0,idx:-1},dest:{items:[],remote:[],timer:0,idx:-1}};
function renderSugg(field){
  const inp=$(field+"In"), box=$(field+"Sugg"), st=SUG[field];
  const groups=localSuggest(inp.value,field); if(st.remote.length) groups.push({hdr:t("hdrSearch"),items:st.remote});
  st.items=groups.flatMap(g=>g.items); let i=0;
  box.innerHTML = st.items.length ? groups.filter(g=>g.items.length).map(g=>(g.hdr?`<div class="hdr">${g.hdr}</div>`:"")+g.items.map(it=>
    `<button type="button" class="si${i===st.idx?" on":""}" role="option" data-k="${i++}">${it.icon}<span><span class="l1">${esc(it.label)}</span>${it.sub?`<br><span class="l2">${esc(it.sub)}</span>`:""}</span></button>`).join("")).join("")
    : `<div class="hdr" style="text-transform:none;letter-spacing:0">${t("noSugg")}</div>`;
  box.hidden=false;
}
function remoteSearch(field){
  const st=SUG[field], q=$(field+"In").value.trim(); st.remote=[]; clearTimeout(st.timer);
  if(q.length<2) return;
  st.timer=setTimeout(async()=>{
    const safe=p=>p.catch(()=>[]);
    const [g,a,geo]=await Promise.all([safe(searchGoogle(q)),safe(searchALS(q,4)),safe(searchGeoInfo(q,4))]);
    if($(field+"In").value.trim()!==q) return;
    const seen=new Set(), out=[];
    [...g,...geo,...a].forEach(it=>{const k=it.label.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(it)}});
    st.remote=out.slice(0,9);
    if(!$(field+"Sugg").hidden) renderSugg(field);
  },350);
}
function choose(field,it){
  const inp=$(field+"In"); $(field+"Sugg").hidden=true; SUG[field].idx=-1;
  if(it.kind==="here"){inp.value="";inp._sel=null;if(field==="start")startPoint=null;renderExitRow(field,null);return}
  if(it.kind==="nearest"){inp.value="";inp._sel=null;renderExitRow(field,null);return}
  if(it.kind==="gplace"){inp.value=it.label;inp._sel=null;googlePoint(it).then(p=>{if(inp.value===it.label){inp._sel={...p,label:it.label};drawSelExits()}}).catch(()=>{});renderExitRow(field,null);return}
  inp.value=it.label; inp._sel={...it};
  renderExitRow(field, it.kind==="mtr"||it.kind==="exit"?it.obj:null, it.kind==="exit"?it.ref:null);
  drawSelExits();
}
function renderExitRow(field,st,ref){
  const row=$(field+"Exits"); row._st=st;
  if(!st){row.innerHTML="";return}
  if(exitsState==="loading"){row.innerHTML=`<span class="xl">${t("exitsLoading")}</span>`;return}
  if(!st.exits||!st.exits.length){row.innerHTML=`<span class="xl">${t("exitsNone")}</span>`;return}
  row.innerHTML=`<span class="xl">${t("chooseExit")}</span><button type="button" class="chip wide" data-x="" aria-pressed="${!ref}">${t("stCentre")}</button>`+
    st.exits.map(x=>`<button type="button" class="chip" data-x="${x.ref}" aria-pressed="${ref===x.ref}">${x.ref}</button>`).join("");
}
function refreshExitRows(){["start","dest"].forEach(f=>{const row=$(f+"Exits");if(row._st){const s=$(f+"In")._sel;renderExitRow(f,row._st,s&&s.kind==="exit"?s.ref:null)}})}
["start","dest"].forEach(field=>{
  const inp=$(field+"In"), box=$(field+"Sugg"), st=SUG[field];
  inp.addEventListener("focus",()=>{st.idx=-1;sheetTo("full");renderSugg(field)});
  inp.addEventListener("input",()=>{inp._sel=null;if(field==="start")startPoint=null;renderExitRow(field,null);st.idx=-1;st.remote=[];renderSugg(field);remoteSearch(field)});
  inp.addEventListener("keydown",e=>{
    if(box.hidden) return;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();st.idx=Math.max(-1,Math.min(st.items.length-1,st.idx+(e.key==="ArrowDown"?1:-1)));renderSugg(field)}
    else if(e.key==="Enter"&&st.idx>=0){e.preventDefault();choose(field,st.items[st.idx])}
    else if(e.key==="Escape"){box.hidden=true}
  });
  inp.addEventListener("blur",()=>setTimeout(()=>{box.hidden=true},180));
  box.addEventListener("mousedown",e=>e.preventDefault());
  box.addEventListener("click",e=>{const b=e.target.closest(".si");if(b)choose(field,st.items[+b.dataset.k])});
  $(field+"Exits").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;const s=$(field+"Exits")._st;
    const x=s.exits.find(x=>x.ref===b.dataset.x); choose(field, x?exitItem(s,x):itemFor(s,"mtr"));});
});

// MTR layer: station markers (line-coloured ring) + exits of the chosen stations
// MTR lines drawn as straight links between stations, in line order (branches listed separately)
const LINE_SEQ={
 ISL:[["Kennedy Town","HKU","Sai Ying Pun","Sheung Wan","Central","Admiralty","Wan Chai","Causeway Bay","Tin Hau","Fortress Hill","North Point","Quarry Bay","Tai Koo","Sai Wan Ho","Shau Kei Wan","Heng Fa Chuen","Chai Wan"]],
 TWL:[["Central","Admiralty","Tsim Sha Tsui","Jordan","Yau Ma Tei","Mong Kok","Prince Edward","Sham Shui Po","Cheung Sha Wan","Lai Chi Kok","Mei Foo","Lai King","Kwai Fong","Kwai Hing","Tai Wo Hau","Tsuen Wan"]],
 KTL:[["Whampoa","Ho Man Tin","Yau Ma Tei","Mong Kok","Prince Edward","Shek Kip Mei","Kowloon Tong","Lok Fu","Wong Tai Sin","Diamond Hill","Choi Hung","Kowloon Bay","Ngau Tau Kok","Kwun Tong","Lam Tin","Yau Tong","Tiu Keng Leng"]],
 TKL:[["North Point","Quarry Bay","Yau Tong","Tiu Keng Leng","Tseung Kwan O","Hang Hau","Po Lam"],["Tseung Kwan O","LOHAS Park"]],
 SIL:[["Admiralty","Ocean Park","Wong Chuk Hang","Lei Tung","South Horizons"]],
 TCL:[["Hong Kong","Kowloon","Olympic","Nam Cheong","Lai King","Tsing Yi","Sunny Bay","Tung Chung"]],
 AEL:[["Hong Kong","Kowloon","Tsing Yi","Airport","AsiaWorld-Expo"]],
 DRL:[["Sunny Bay","Disneyland Resort"]],
 EAL:[["Admiralty","Exhibition Centre","Hung Hom","Mong Kok East","Kowloon Tong","Tai Wai","Sha Tin","Fo Tan","University","Tai Po Market","Tai Wo","Fanling","Sheung Shui","Lo Wu"],["Sheung Shui","Lok Ma Chau"],["Fo Tan","Racecourse","University"]],
 TML:[["Wu Kai Sha","Ma On Shan","Heng On","Tai Shui Hang","Shek Mun","City One","Sha Tin Wai","Che Kung Temple","Tai Wai","Hin Keng","Diamond Hill","Kai Tak","Sung Wong Toi","To Kwa Wan","Ho Man Tin","Hung Hom","East Tsim Sha Tsui","Austin","Nam Cheong","Mei Foo","Tsuen Wan West","Kam Sheung Road","Yuen Long","Long Ping","Tin Shui Wai","Siu Hong","Tuen Mun"]]
};
// real MTR track shapes, prepared ahead of time by scripts/build_data.py (GitHub Actions, weekly)
let MTR_GEO=null;
async function loadMtrGeo(){ try{ const r=await fetch("data/mtr_lines.geojson",{cache:"no-cache"}); if(r.ok){ MTR_GEO=await r.json(); if(view) drawMTR(); } }catch(e){} }
function drawMTR(){
  if(!layers.mtr) return; layers.mtr.removeAll();
  const byEn=Object.fromEntries(MTR.map(s=>[s.en,s]));
  const lineSym={type:"simple-line",color:[110,122,130,.55],width:2};
  const linePopup=code=>({title:lang==="zh"?LINES[code][1]:LINES[code][0],content:`<span style="display:inline-block;width:28px;height:5px;border-radius:3px;background:${LINES[code][2]};vertical-align:middle"></span> `+[...new Set(LINE_SEQ[code].flat())].filter(n=>byEn[n]).map(n=>nm(byEn[n])).join(" · ")});
  // real track shapes from data/mtr_lines.geojson (built by scripts/build_data.py); straight links if it is not available
  if(MTR_GEO) MTR_GEO.features.forEach(f=>{ const code=f.properties.ref; if(!LINES[code]) return;
    layers.mtr.add(new Graphic({geometry:{type:"polyline",paths:f.geometry.coordinates,spatialReference:{wkid:4326}},symbol:lineSym,popupTemplate:linePopup(code)})); });
  else Object.entries(LINE_SEQ).forEach(([code,paths])=>paths.forEach(names=>{
    const pts=names.map(n=>byEn[n]).filter(Boolean).map(s=>[s.lat,s.lng]); if(pts.length<2) return;
    // thin, quiet grey so the shade network stays the main thing on the map; tap a line to see its name and colour
    layers.mtr.add(new Graphic({geometry:pline(pts),symbol:{type:"simple-line",color:[110,122,130,.55],width:2},
      popupTemplate:{title:lang==="zh"?LINES[code][1]:LINES[code][0],content:`<span style="display:inline-block;width:28px;height:5px;border-radius:3px;background:${LINES[code][2]};vertical-align:middle"></span> `+names.filter(n=>byEn[n]).map(n=>nm(byEn[n])).join(" · ")}}));
  }));
  // station names (text only, no dots) when zoomed in to street level
  if(layers.mtrlab){ layers.mtrlab.removeAll();
    MTR.forEach(s=>layers.mtrlab.add(new Graphic({geometry:pt(s.lat,s.lng),symbol:{type:"text",text:stLabel(s),color:"#4a5b63",haloColor:"#ffffff",haloSize:1.5,font:{size:11,weight:"bold"}}}))); }
  drawSelExits();
}
function drawSelExits(){
  if(!layers.exits) return; layers.exits.removeAll();
  ["start","dest"].forEach(f=>{const sel=$(f+"In")._sel; if(!sel||(sel.kind!=="mtr"&&sel.kind!=="exit")||!sel.obj.exits) return;
    sel.obj.exits.forEach(x=>{const on=sel.kind==="exit"&&sel.ref===x.ref;
      layers.exits.add(new Graphic({geometry:pt(x.lat,x.lng),symbol:{type:"simple-marker",color:on?css("--heat"):"#132a33",size:on?12:8,outline:{color:"#fff",width:1.5}}}));
      layers.exits.add(new Graphic({geometry:pt(x.lat,x.lng),symbol:{type:"text",text:x.ref,color:"#132a33",haloColor:"#ffffff",haloSize:1.5,yoffset:9,font:{size:10,weight:"bold"}}}));});
  });
}

// =====================================================================
// PUBLIC — typed start & destination, shaded routing
// =====================================================================
let startPoint=null, destPoint=null, routes={}, chosen="shade", reqId=0, picking=false;

async function resolvePlace(q){
  const s=q.trim(); if(!s) return null;
  const m=s.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/); if(m) return {lat:+m[1],lng:+m[2],en:s,zh:s};
  const low=s.toLowerCase();
  const local=[...MTR,...SHELTERS,...AREAS,...SHADE.map(x=>({...x,lat:x.pts[0][0],lng:x.pts[0][1]}))]
    .find(o=>o.en.toLowerCase()===low||o.zh===s) || [...MTR,...SHELTERS,...AREAS].find(o=>o.en.toLowerCase().includes(low)||o.zh.includes(s));
  if(local) return local;
  try{ const a=await searchALS(s,1); if(a.length) return a[0]; }catch(e){}
  try{ const g=await searchGoogle(s); if(g.length) return await googlePoint(g[0]); }catch(e){}
  try{ // Hong Kong government location search (results in HK1980 Grid)
    const r=await fetch(`https://geodata.gov.hk/gs/api/v1.0.0/locationSearch?q=${encodeURIComponent(s)}`).then(r=>r.json());
    if(Array.isArray(r)&&r.length){const[la,ln]=hk80ToWgs(+r[0].x,+r[0].y);return{lat:la,lng:ln,en:r[0].nameEN||s,zh:r[0].nameZH||s}}
  }catch(e){}
  try{ // fallback: ArcGIS World Geocoding Service
    const r=await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(s)}&countryCode=HKG&maxLocations=1&outFields=PlaceName&f=json`).then(r=>r.json());
    const c=r.candidates&&r.candidates[0]; if(c) return{lat:c.location.y,lng:c.location.x,en:c.address,zh:c.address};
  }catch(e){}
  return null;
}
function currentLocation(){
  return new Promise(res=>{
    if(!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lng:p.coords.longitude,en:"My location",zh:"我的位置"}),()=>res(null),{timeout:8000,maximumAge:60000});
  });
}
async function pointFrom(field){
  const inp=$(field+"In"), v=inp.value.trim();
  if(inp._sel && inp.value===inp._sel.label) return inp._sel;
  if(!v) return null;
  const m=v.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/); if(m) return {lat:+m[1],lng:+m[2],en:v,zh:v};
  const groups=localSuggest(v,field), first=groups.flatMap(g=>g.items)[0];   // best local match (station, exit, shelter…)
  if(first && first.lat) return first;
  return await resolvePlace(v);
}
async function findRoute(){
  const st=$("status"); const id=++reqId;
  st.textContent=t("searching");
  // start: typed / chosen place, otherwise current location
  if($("startIn").value.trim()){ const p=await pointFrom("start"); if(!p){st.textContent=t("notFound",$("startIn").value);return} startPoint=p; }
  else { st.textContent=t("locating"); const p=await currentLocation(); if(p) startPoint=p; else { startPoint=SAMPLE_START; toast(t("noGeo")); } }
  // destination: typed / chosen place, otherwise nearest cool shelter
  if($("destIn").value.trim()){ const p=await pointFrom("dest"); if(!p){st.textContent=t("notFound",$("destIn").value);return} destPoint=p; }
  else destPoint=nearestShelters([startPoint.lat,startPoint.lng])[0].s;
  if(id!==reqId) return;
  renderWeather([startPoint.lat,startPoint.lng]);
  drawSelExits();
  await plan(id);
}
async function osrm(points){
  const q=points.map(p=>`${p[1]},${p[0]}`).join(";");
  const j=await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${q}?overview=full&geometries=geojson`).then(r=>r.json());
  if(!j.routes||!j.routes.length) throw new Error("no route");
  return{coords:j.routes[0].geometry.coordinates.map(([x,y])=>[y,x]),meters:j.routes[0].distance,live:true};
}
function straight(points){
  let m=0;const coords=[];
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],L=dist(a,b);m+=L;const n=Math.max(2,Math.ceil(L/20));for(let j=0;j<n;j++)coords.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}
  coords.push(points.at(-1));return{coords,meters:m*DETOUR,live:false};
}
const getRoute=async pts=>{try{return await osrm(pts)}catch(e){return straight(pts)}};
async function plan(id){
  $("status").textContent=t("routing");
  const a=[startPoint.lat,startPoint.lng], b=[destPoint.lat,destPoint.lng], wps=shadeWaypoints(a,b);
  const [fast,shadeR]=await Promise.all([getRoute([a,b]), wps.length?getRoute([a,...wps.flatMap(w=>w.pts),b]):null]);
  if(id!==reqId) return;
  fast.stats=shadeStats(fast.coords); let sh=shadeR; if(sh) sh.stats=shadeStats(sh.coords);
  const sun=r=>r.meters*(1-r.stats.pct);
  if(!sh||sun(fast)-sun(sh)<WALK||sh.meters>fast.meters*1.5) sh=fast;
  routes={fast,shade:sh}; chosen="shade"; renderRoutes(true); sheetTo("peek");
}
function fmtCard(r,p){
  const min=r.meters/WALK, sunMin=r.meters*(1-r.stats.pct)/WALK;
  $(p+"Min").textContent=`${min.toFixed(0)} ${t("min")}`;
  $(p+"Bar").style.width=`${Math.round(r.stats.pct*100)}%`;
  $(p+"Sub").textContent=`${Math.round(r.stats.pct*100)}% ${t(mode==="rain"?"covered":"shaded")} · ${sunMin.toFixed(0)} ${t(mode==="rain"?"inRain":"inSun")}`;
}
function renderRoutes(zoom){
  if(!view) return; layers.route.removeAll();
  const {fast,shade}=routes, main=routes[chosen], other=chosen==="shade"?fast:shade;
  if(other!==main) layers.route.add(new Graphic({geometry:pline(other.coords),symbol:{type:"simple-line",color:css("--sun"),width:4,style:"dash"}}));
  layers.route.add(new Graphic({geometry:pline(main.coords),symbol:{type:"simple-line",color:[255,255,255,.9],width:9}}));
  // whole route in the sunny colour, then the shaded stretches drawn green on top
  const g=new Graphic({geometry:pline(main.coords),symbol:{type:"simple-line",color:exposedCol(),width:6}});
  layers.route.add(g);
  shadeRuns(main.coords).forEach(run=>{ if(run.shaded) layers.route.add(new Graphic({geometry:pline(run.pts),symbol:{type:"simple-line",color:coveredCol(),width:6}})); });
  layers.route.add(dot(startPoint.lat,startPoint.lng,css("--heat"),16,{title:t("start"),content:nm(startPoint)}));
  layers.route.add(dot(destPoint.lat,destPoint.lng,css("--cool"),18,{title:nm(destPoint),content:destPoint.type?t("freeAccess"):""},"#132a33"));
  if(zoom) view.goTo({target:g.geometry.extent.clone().expand(1.6)}).catch(()=>{});
  $("routes").hidden=false; fmtCard(shade,"sh"); fmtCard(fast,"fa");
  const gl=$("gmapsLink"); gl.hidden=false;
  gl.href=`https://www.google.com/maps/dir/?api=1&origin=${startPoint.lat},${startPoint.lng}&destination=${destPoint.lat},${destPoint.lng}&travelmode=walking`;
  $("rcShade").setAttribute("aria-pressed",chosen==="shade"); $("rcFast").setAttribute("aria-pressed",chosen==="fast");
  const same=shade===fast, extra=(shade.meters-fast.meters)/WALK, saved=(fast.meters*(1-fast.stats.pct)-shade.meters*(1-shade.stats.pct))/WALK;
  $("status").textContent=(same?(fast.stats.used.length?t(tm("sameRoute")):t(tm("noShade"))):t(tm("shadeBetter"),Math.max(0,extra).toFixed(0),Math.max(0,saved).toFixed(0)))+(main.live?"":t("offline"));
  const used=main.stats.used; $("shadeBox").hidden=false;
  $("shadeList").innerHTML=used.length?used.map(k=>`<li><button class="row" data-s="${k}"><span class="stripe" style="background:${shadeCol(SHADE[k].kind)}"></span><span><span class="name">${nm(SHADE[k])}</span><br><span class="sub">${shadeLabel(SHADE[k].kind)}</span></span><span class="num"></span></button></li>`).join(""):`<li class="hint">${t("noShadeList")}</li>`;
  const near=nearestShelters([startPoint.lat,startPoint.lng],4).filter(x=>x.s!==destPoint).slice(0,3);
  $("nearBox").hidden=false;
  $("nearList").innerHTML=near.map(({s,d})=>`<li><button class="row" data-n="${SHELTERS.indexOf(s)}"><span class="stripe" style="background:var(--cool)"></span><span><span class="name">${nm(s)}</span><br><span class="sub">${lang==="zh"?TYPE[s.type]:s.type} · ${lang==="zh"?D[s.dist]:s.dist}</span></span><span class="num">~${walkMin(d).toFixed(0)} ${t("min")}</span></button></li>`).join("");
}
$("tripForm").onsubmit=e=>{e.preventDefault();document.activeElement.blur();findRoute()};
$("rcShade").onclick=()=>{if(routes.shade){chosen="shade";renderRoutes()}};
$("rcFast").onclick=()=>{if(routes.fast){chosen="fast";renderRoutes()}};
$("pickBtn").onclick=()=>{picking=!picking;$("pickBtn").setAttribute("aria-pressed",picking);if(picking){toast(t("pickNow"));sheetTo("mini")}};
$("swapBtn").onclick=()=>{const A=$("startIn"),B=$("destIn");[A.value,B.value]=[B.value,A.value];[A._sel,B._sel]=[B._sel,A._sel];startPoint=null;
  [["start",A],["dest",B]].forEach(([f,i])=>renderExitRow(f,i._sel&&(i._sel.kind==="mtr"||i._sel.kind==="exit")?i._sel.obj:null,i._sel&&i._sel.kind==="exit"?i._sel.ref:null))};
$("shadeList").addEventListener("click",e=>{const b=e.target.closest(".row");if(!b||!view)return;const s=SHADE[b.dataset.s];view.goTo({target:new Graphic({geometry:pline(s.pts)}).geometry.extent.clone().expand(3)}).catch(()=>{});sheetTo("peek")});
$("nearList").addEventListener("click",e=>{const b=e.target.closest(".row");if(!b)return;const s=SHELTERS[b.dataset.n];choose("dest",itemFor(s,"shelter"));findRoute()});

// =====================================================================
// PREMIUM — paid plans + dashboard
// =====================================================================
let group="elderly";
const scored=AREAS.map(c=>{const[{s,d}]=nearestShelters([c.lat,c.lng]);return{...c,near:s,m:walkMin(d)}});
const atRisk=c=>group==="elderly"?c.old:group==="kids"?c.kids:c.old+c.kids;
const mins=m=>m>30?"30+":m.toFixed(0);
const score=c=>Math.round(atRisk(c)*Math.min(Math.max(c.m,1),30)*(c.lst-35)/1000);
const bandCol=m=>css(m<=5?"--ok":m<=10?"--warn":"--heat");
const lstCol=v=>v>=43?"#b30000":v>=41.5?"#e34a33":v>=40?"#fc8d59":"#fdbb84";
const fmtN=n=>n.toLocaleString(lang==="zh"?"zh-HK":"en-HK");
function rng(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}

function renderPremium(){
  $("plansView").style.display = tier? "none":"flex";
  $("dashView").style.display = tier? "flex":"none";
  ["lst","catch","demand","areas","deploy"].forEach(k=>layers[k]&&layers[k].removeAll());
  if(!tier){ layers.shelters.visible=true; layers.shade.visible=false; return; }
  $("planPill").textContent = tier===2?t("planPro"):t("planCommunity");
  document.querySelectorAll(".pro-lock").forEach(e=>e.style.display=tier===2?"none":"");
  $("lyDemand").disabled = tier<2; if(tier<2) $("lyDemand").checked=false;
  const sel=$("district"), cur=sel.value||"all";
  sel.innerHTML=`<option value="all">${t("allDistricts")}</option>`+[...new Set(AREAS.map(a=>a.dist))].sort().map(d=>`<option value="${d}">${lang==="zh"?D[d]:d}</option>`).join("");
  sel.value=cur;
  const f=sel.value, all=f==="all", cl=scored.filter(c=>all||c.dist===f), sh=SHELTERS.filter(s=>all||s.dist===f);
  drawCatch();
  cl.forEach(c=>{
    layers.lst.add(ring(c.lat,c.lng,650,rgba(lstCol(c.lst),.38)));
    layers.areas.add(dot(c.lat,c.lng,rgba(bandCol(c.m),.75),10+Math.sqrt(atRisk(c))/5,{title:nm(c),
      content:`${lang==="zh"?D[c.dist]:c.dist}<br>${t("g65")}: ${fmtN(c.old)}<br>${t("g15")}: ${fmtN(c.kids)}<br>${t("surf")}: ${c.lst.toFixed(1)}°C<br>${t("nearest")}: ${nm(c.near)}<br>${t("walk")} ≈ <b>${mins(c.m)} ${t("min")}</b>${c.m>10?`<br><b style="color:${css("--heat")}">${t("desert")}</b>`:""}`},bandCol(c.m)));
  });
  if(tier===2){ const r=rng(42); cl.forEach(c=>{const n=Math.round(c.old/500*Math.max(c.m,2)/4);for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=r()*500;
    layers.demand.add(ring(c.lat+Math.sin(a)*d/KY,c.lng+Math.cos(a)*d/KX,90,rgba(css("--prem"),.2)))}}); }
  const deserts=cl.filter(c=>c.m>10);
  $("sShel").textContent=sh.length; $("sOut").textContent=fmtN(deserts.reduce((s,c)=>s+atRisk(c),0)); $("sDes").textContent=deserts.length;
  const ranked=[...cl].sort((a,b)=>score(b)-score(a));
  $("rank").innerHTML=ranked.map(c=>`<li><button class="row" data-i="${scored.indexOf(c)}"><span class="stripe" style="background:${bandCol(c.m)}"></span><span><span class="name">${nm(c)}</span><br><span class="sub">${lang==="zh"?D[c.dist]:c.dist} · ${fmtN(atRisk(c))} ${t("atRisk")} · ${c.lst.toFixed(1)}°C</span></span><span class="num">${mins(c.m)} ${t("min")}<br><span class="sub">${t("score")} ${score(c)}</span></span></button></li>`).join("");
  // Pro-only: deployment + export
  if(tier===2){
    const top=[...deserts].sort((a,b)=>score(b)-score(a)).slice(0,3);
    $("deployBox").innerHTML=top.length?top.map((c,i)=>{
      layers.deploy.add(new Graphic({geometry:pt(c.lat,c.lng),symbol:{type:"simple-marker",style:"diamond",color:css("--prem"),size:20,outline:{color:"#fff",width:2}},popupTemplate:{title:t("deployTag",i),content:nm(c)}}));
      return`<div class="deploy"><b>${i+1}. ${t("deployTag",i)}</b> · ${nm(c)}<br><span class="hint">${t("deployLine",fmtN(atRisk(c)),mins(c.m),nm(c.near),c.lst.toFixed(1))}</span></div>`}).join(""):`<p class="hint">${t("noDesert")}</p>`;
    $("exportBox").innerHTML=`<button class="btn ghost small" id="exportBtn">${t("exportBtn")}</button>`;
    $("exportBtn").onclick=()=>{const rows=[["area","district","aged_65_plus","under_15","walk_min","surface_temp_c","score"],...ranked.map(c=>[c.en,c.dist,c.old,c.kids,c.m.toFixed(1),c.lst,score(c)])];
      const blob=new Blob(["﻿"+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="coolhk_priority.csv";a.click()};
  } else {
    $("deployBox").innerHTML=`<div class="locked"><b style="color:var(--prem)">🔒 ${t("proOnly")}</b><span>${t("upgradeMsg")}</span><button class="btn prem small" id="upBtn" style="align-self:flex-start">${t("upgrade")}</button></div>`;
    $("exportBox").innerHTML=""; $("upBtn").onclick=()=>subscribe(2);
  }
  syncLayers();
  if(cl.length) view.goTo(cl.map(c=>new Graphic({geometry:pt(c.lat,c.lng)})).concat(sh.map(s=>new Graphic({geometry:pt(s.lat,s.lng)})))).catch(()=>{});
}
function syncLayers(){
  layers.catch.visible=$("lyCatch").checked; layers.lst.visible=$("lyLst").checked;
  layers.shade.visible=$("lyShade").checked; layers.demand.visible=$("lyDemand").checked&&tier===2;
}
function subscribe(n){ tier=n; try{localStorage.setItem("coolhk-tier",n)}catch(e){}; toast(t("subscribed",n===2?t("p2Name"):t("p1Name"))); renderPremium(); }
document.querySelectorAll("[data-tier]").forEach(b=>b.onclick=()=>subscribe(+b.dataset.tier));
$("managePlan").onclick=()=>{if(!confirm(lang==="zh"?"要取消目前方案，返回方案選擇嗎？":"Cancel your current plan and go back to the plan list?"))return;tier=0;try{localStorage.setItem("coolhk-tier",0)}catch(e){};renderPremium()};
$("district").onchange=renderPremium;
["lyCatch","lyLst","lyShade","lyDemand"].forEach(id=>$(id).onchange=syncLayers);
$("grp").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;group=b.dataset.g;document.querySelectorAll("#grp button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderPremium()});
$("rank").addEventListener("click",e=>{const b=e.target.closest(".row");if(!b)return;const c=scored[b.dataset.i];
  view.goTo({center:[c.lng,c.lat],zoom:15}).then(()=>{const g=layers.areas.graphics.find(x=>x.geometry.latitude===c.lat&&x.geometry.longitude===c.lng);if(g)view.openPopup({features:[g],location:g.geometry})}).catch(()=>{});sheetTo("peek")});

// =====================================================================
// VERSION SWITCH (Public / Premium)
// =====================================================================
function show(v){
  version=v;
  document.querySelectorAll("[data-v]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===v));
  $("panel-public").style.display=v==="public"?"flex":"none";
  $("panel-premium").style.display=v==="premium"?"flex":"none";
  if(!view) return;
  view.closePopup&&view.closePopup();
  const pub=v==="public";
  layers.route.visible=pub; layers.shade.visible=pub; layers.shelters.visible=true; layers.walk.visible=false; layers.mtr.visible=true; layers.mtrlab.visible=true;
  ["lst","catch","demand","areas","deploy"].forEach(k=>layers[k].visible=!pub);
  if(pub){ layers.catch.removeAll(); if(routes.fast) renderRoutes(true); syncPub(); }
  else { renderPremium(); }
  sheetTo("peek");
}
document.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>show(b.dataset.v));

// =====================================================================
// START
// =====================================================================
applyLayout(); applyLang();
$("mapLoading").firstChild.textContent = lang==="zh"?"地圖載入中…":"Loading map…";
// map layers the user can switch on and off (lines, points, polygons, MTR lines); remembered in this browser
let LY={covered:true,trees:true,shelters:true,walk:false,mtr:true};
try{Object.assign(LY,JSON.parse(localStorage.getItem("coolhk-layers")||"{}"))}catch(e){}
function syncPub(){
  document.querySelectorAll("[data-ly]").forEach(c=>c.checked=!!LY[c.dataset.ly]);
  $("lyTreesRow").classList.toggle("dim",mode==="rain"); // trees give no rain cover
  if(!view||version!=="public") return;
  layers.shade.graphics.forEach(g=>{const k=g.attributes&&g.attributes.kind; g.visible = k==="trees"?LY.trees:LY.covered;});
  layers.shelters.visible=LY.shelters; layers.walk.visible=LY.walk; layers.mtr.visible=LY.mtr; layers.mtrlab.visible=LY.mtr;
}
document.querySelectorAll("[data-ly]").forEach(c=>c.onchange=()=>{LY[c.dataset.ly]=c.checked; try{localStorage.setItem("coolhk-layers",JSON.stringify(LY))}catch(e){}; syncPub();});
$("lyrBtn").onclick=()=>{const p=$("lyrPanel"),open=p.hidden; p.hidden=!open; $("lyrBtn").setAttribute("aria-expanded",open);};
syncPub();
// weather setting: switch wording, colours and recalculate the current route
function applyMode(m,init){
  mode=m; try{localStorage.setItem("coolhk-mode",m)}catch(e){}
  const rain=m==="rain"; $("app").classList.toggle("rain",rain);
  document.querySelectorAll("#modeSeg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.m===m));
  $("pubTitleEl").dataset.i18n=rain?"pubTitleRain":"pubTitle"; $("goBtn").dataset.i18n=rain?"goRain":"go";
  $("mostLbl").dataset.i18n=rain?"mostCovered":"mostShaded"; $("mostLbl").style.color=rain?"var(--rain)":"var(--shade)";
  $("lgRSt").dataset.i18n=rain?"lgRouteDry":"lgRouteShade"; $("lgRXt").dataset.i18n=rain?"lgRouteWet":"lgRouteSun";
  $("lgRSi").style.background=rain?"var(--rain)":"var(--shade)"; $("lgRXi").style.background=rain?"var(--wet)":"var(--sunroute)";
  $("modeChipT").dataset.i18n=rain?"modeChipRain":"modeChipSun";
  syncPub(); applyLang();
  if(!init && startPoint && destPoint && routes.fast) plan(++reqId);
}
document.querySelectorAll("#modeSeg button").forEach(b=>b.onclick=()=>applyMode(b.dataset.m));
// settings panel (the walking-weather choice lives here)
function openSettings(open){ $("setPanel").hidden=!open; $("setBtn").setAttribute("aria-expanded",open); }
$("setBtn").onclick=()=>openSettings($("setPanel").hidden);
$("modeChip").onclick=()=>openSettings(true);
$("setDone").onclick=()=>openSettings(false);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") openSettings(false); });
document.addEventListener("click",e=>{ if(!$("setPanel").hidden && !e.target.closest("#setPanel,#setBtn,#modeChip")) openSettings(false); });
applyMode(mode,true);
loadWeather().then(()=>renderWeather());
loadExits();
loadMtrGeo();
