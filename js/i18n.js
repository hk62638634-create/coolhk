// =====================================================================
// SETTINGS — point the app at your ArcGIS Online organisation
// =====================================================================
const CONFIG = {
  PORTAL_URL: "https://hkugeog.maps.arcgis.com", // your HKU ArcGIS Online org
  WEBMAP_ID: "",        // optional: item ID of a web map you saved in ArcGIS Online. If set, the app opens that map (its basemap + layers)
  ARCGIS_API_KEY: "",   // optional: only needed for paid ArcGIS services (routing, geocoding at scale)
  GOOGLE_MAPS_API_KEY: "" // optional: paste a Google Maps Platform key (Places API New enabled) to add Google place search
};

// =====================================================================
// LANGUAGE
// =====================================================================
const T = {
 en:{tabPublic:"Public · Free",tabPremium:"Premium",pubTitle:"Which way is coolest?",pubHint:"Tell us where you're going and we'll find a way with more shade. Leave “From” blank to start where you are.",pubHintRain:"Tell us where you're going and we'll find a way with more cover. Leave “From” blank to start where you are.",
  startPh:"From: where you are now",destPh:"To: a place, building or MTR exit",pick:"Pick on map",go:"Find a shady way",mostShaded:"Most shaded",fastest:"Fastest",
  shadeOnRoute:"Shade on this route",shadeOnRouteRain:"Cover on this route",otherShelters:"Other cool shelters nearby",lgCovered:"Covered walkway / footbridge",lgTrees:"Tree-lined street",lgShelter:"Cool shelter (air-con)",lgRouteShade:"Route: in shade",lgRouteSun:"Route: in the sun",
  premFor:"For government departments & NGOs",plansTitle:"Choose a Premium plan",plansHint:"The public app stays free. Premium plans pay for heat-vulnerability analytics and services. Prices are proposals for the demo.",
  p1Name:"Community",perYear:"/ year",p1a:"Heat Vulnerability Dashboard",p1b:"Census layers: aged 65+ and under 15",p1c:"Surface heat hotspots and walk catchments",p1d:"District filter and priority ranking",
  subscribe:"Subscribe (demo)",popular:"Most chosen by departments",p2Name:"Government Pro",p2a:"Everything in Community",p2b:"Anonymised demand from public app users",p2c:"Where to deploy cooling units and water stations",p2d:"Heat-warning alerts for your districts",p2e:"Export reports (CSV)",
  addonsTitle:"Paid add-on services",ad1:"Custom district heat report",ad2:"Staff training workshop (half day)",ad3:"Data API for your own systems",
  managePlan:"Change plan",dashTitle:"Cool Island Deserts",dashHint:"Neighbourhoods more than a 10-minute walk from any cool shelter.",district:"District",group:"At-risk group",g65:"Aged 65+",g15:"Under 15",gBoth:"Both",
  stShel:"cool shelters",stOut:"at-risk people outside 10 min",stDes:"desert areas",layers:"Map layers",lyCatch:"5 / 10-min walk catchments",lyLst:"Surface heat hotspots (Landsat)",lyShade:"Covered walkways",lyDemand:"Public app demand (anonymised)",
  lgDesert:"> 10 min (desert)",deployTitle:"Where to deploy this week",rankTitle:"All neighbourhoods by priority",rankHint:"Score = at-risk people × walking minutes × surface heat. Tap to zoom.",
  note:"Test build with sample data. Shelter and walkway locations are approximate; population, surface temperature and demand figures are made up. Basemap: Lands Department via ArcGIS Maps SDK. Weather: Hong Kong Observatory open data.",
  bmHK:"HK Map (LandsD)",bmTopo:"Topographic",bmImg:"Imagery",navRoute:"Shaded route",navPrem:"Premium",
  layoutAuto:"🖥 Layout: auto",layoutPhone:"📱 Layout: phone",layoutDesk:"💻 Layout: computer",
  allDistricts:"All districts",planCommunity:"Community plan",planPro:"Government Pro plan",
  proOnly:"Government Pro feature",upgradeMsg:"Upgrade to Government Pro to see where to deploy cooling units, view public demand and export reports.",upgrade:"Upgrade to Pro (demo)",
  exportBtn:"Export priority list (CSV)",unitCool:"Mobile cooling unit",unitWater:"Hydration station",at:"at",
  deployLine:(n,m,s,t)=>`${n} at-risk people · ${m} min from ${s} · surface ${t}°C`,noDesert:"No desert areas in this district.",
  atRisk:"at risk",score:"score",min:"min",shaded:"shaded",inSun:"min in sun",covered:"covered",inRain:"min in the rain",modeSun:"☀️ Sunny",modeRain:"🌧 Rainy",setBtn:"⚙️ Settings",setTitle:"Walking weather",setHint:"Choose what your route should protect you from.",sunDesc:"Avoid the sun. Covered walkways, footbridges, tree-lined streets and air-conditioned shelters all count as shade. On the map: green = shaded, orange = in the sun.",rainDesc:"Stay dry. Only covered walkways, footbridges and indoor links count, because trees don't keep the rain off. On the map: blue = covered, grey = in the rain.",setDone:"Done",setMap:"Map style",setLayers:"Map layers",setLang:"Language",modeChipSun:"☀️ Sunny mode",modeChipRain:"🌧 Rainy mode",modeChange:"Change",pubTitleRain:"Which way keeps you dry?",goRain:"Find a drier way",mostCovered:"Most covered",lgRouteDry:"Route: covered",lgRouteWet:"Route: in the rain",sameRouteRain:"The fastest route already uses the covered walkways nearby, so it is also the driest.",noShadeRain:"No covered walkway lies along this trip, so you will be in the rain for most of it.",shadeBetterRain:(x,s)=>`The covered route takes ${x} min longer but saves ${s} min in the rain.`,
  locating:"Finding your location…",searching:"Searching…",routing:"Finding the shadiest way…",routingRain:"Finding the driest way…",
  noGeo:"Couldn't get your location, so we used a sample start at Victoria Park. Type a start point to change it.",
  notFound:q=>`Couldn't find "${q}". Try a building, MTR station or street name.`,
  sameRoute:"The fastest route already uses the shade nearby, so it is also the shadiest.",
  noShade:"No covered walkway lies along this trip, so the fastest route is also the shadiest.",
  shadeBetter:(x,s)=>`The shaded route takes ${x} min longer but saves ${s} min in direct sun.`,
  offline:" (Walking router offline: showing estimated straight-line paths.)",
  pickNow:"Tap the map to set your start point.",start:"Start",myLoc:"My location",
  shadeTrees:"Tree shade",shadeIndoor:"Indoor, air-conditioned",shadeCovered:"Covered from sun and rain",noShadeList:"No shaded sections on this route.",noShadeListRain:"No covered sections on this route.",
  heatAdvice:(l,t)=>`<b>${l}</b> · ${t}°C. Walk in the shade, carry water, and rest in a cool shelter if you feel dizzy.`,
  vhot:"Very Hot Weather Warning",hot:"Hot Weather Warning",
  wxNear:"Nearest station",wxLive:"Live · HKO",wxSample:"Sample data (HKO unreachable)",wxRhHQ:"RH from HKO HQ",
  freeAccess:"Air-conditioned, free to enter",walk:"Walk",desert:"Cool Island Desert",nearest:"Nearest shelter",surf:"Surface temp",
  subscribed:p=>`Subscribed to ${p} (demo)`,catchNote:"Shaded rings: 5 / 10-min walk",
  deployTag:i=>i===0?"Mobile cooling unit":"Hydration station",
  lgMtr:"MTR lines & stations",lyrBtn:"🗂 Layers",lyCovered:"Covered walkways & footbridges",lyTrees:"Tree-lined streets",lyShelters:"Cool shelters",lyWalk:"5 / 10-min walk to a shelter",lyMtr:"MTR lines & stations",useMyLoc:"Use my current location",nearestOpt:"Nearest cool shelter",hdrNearMtr:"Nearby MTR stations",hdrNearShel:"Nearby cool shelters",
  hdrMtr:"MTR stations",hdrExits:"Station exits",hdrPlaces:"Places",hdrSearch:"Addresses & places",exit:"Exit",stCentre:"Station centre",chooseExit:"Exit:",
  exitsLoading:"Loading exits…",exitsNone:"Exit locations need an internet connection.",stSuf:" Station",exitLabel:(st,r)=>`${st} Station · Exit ${r}`,
  linesLbl:"Lines",exitsLbl:"Exits",typeShelter:"Cool shelter",typeArea:"Neighbourhood",noSugg:"No matches yet. Keep typing or press Find.",hdrAddr:"Addresses",hdrGoogle:"Google Maps places",srcALS:"HK address lookup",srcGeo:"HK GeoInfo Map",openGmaps:"Open walking directions in Google Maps"},
 zh:{tabPublic:"公眾版 · 免費",tabPremium:"進階版",pubTitle:"行邊條路最涼？",pubHint:"話我知你去邊，幫你搵條多啲遮蔭嘅路。「由」唔填，就由你而家嘅位置出發。",pubHintRain:"話我知你去邊，幫你搵條少啲淋雨嘅路。「由」唔填，就由你而家嘅位置出發。",
  startPh:"由：你而家嘅位置",destPh:"去：地方、大廈或港鐵出口",pick:"在地圖上揀",go:"搵陰涼路線",mostShaded:"最陰涼",fastest:"最快",
  shadeOnRoute:"路線上的遮蔭",shadeOnRouteRain:"路線上的上蓋",otherShelters:"附近其他避暑點",lgCovered:"有蓋行人通道／天橋",lgTrees:"林蔭街道",lgShelter:"避暑點（有冷氣）",lgRouteShade:"路線：有遮蔭",lgRouteSun:"路線：日曬",
  premFor:"適用於政府部門及非政府機構",plansTitle:"選擇進階版計劃",plansHint:"公眾版永遠免費。進階版計劃收費提供熱風險分析及服務。價錢為示範用建議。",
  p1Name:"社區版",perYear:"／年",p1a:"地區熱風險儀表板",p1b:"人口普查圖層：65歲或以上及15歲以下",p1c:"地表熱點及步行範圍",p1d:"地區篩選及優先排序",
  subscribe:"訂閱（示範）",popular:"最多部門選用",p2Name:"政府專業版",p2a:"包括社區版所有功能",p2b:"公眾版用戶的匿名需求數據",p2c:"建議流動降溫站及補水站位置",p2d:"按地區發出酷熱警告提示",p2e:"匯出報告（CSV）",
  addonsTitle:"額外付費服務",ad1:"度身訂造地區熱風險報告",ad2:"員工培訓工作坊（半日）",ad3:"數據 API 接駁你的系統",
  managePlan:"更改計劃",dashTitle:"「避暑沙漠」",dashHint:"步行往最近避暑點需時超過 10 分鐘的社區。",district:"地區",group:"高風險群組",g65:"65歲或以上",g15:"15歲以下",gBoth:"兩者",
  stShel:"避暑點",stOut:"10 分鐘範圍外的高風險人口",stDes:"避暑沙漠",layers:"地圖圖層",lyCatch:"5／10 分鐘步行範圍",lyLst:"地表熱點（Landsat）",lyShade:"有蓋行人通道",lyDemand:"公眾版需求（匿名）",
  lgDesert:"> 10 分鐘（沙漠）",deployTitle:"本週建議部署位置",rankTitle:"所有社區優先次序",rankHint:"分數 = 高風險人口 × 步行分鐘 × 地表溫度。按一下放大。",
  note:"測試版，使用示範數據。避暑點及行人通道位置為約數；人口、地表溫度及需求數字為虛構。底圖：地政總署（ArcGIS Maps SDK）。天氣：香港天文台開放數據。",
  bmHK:"香港地圖（地政總署）",bmTopo:"地形圖",bmImg:"衛星影像",navRoute:"陰涼路線",navPrem:"進階版",
  layoutAuto:"🖥 版面：自動",layoutPhone:"📱 版面：手機",layoutDesk:"💻 版面：電腦",
  allDistricts:"全部地區",planCommunity:"社區版計劃",planPro:"政府專業版計劃",
  proOnly:"政府專業版功能",upgradeMsg:"升級至政府專業版，即可查看降溫站部署建議、公眾需求數據及匯出報告。",upgrade:"升級至專業版（示範）",
  exportBtn:"匯出優先名單（CSV）",unitCool:"流動降溫站",unitWater:"補水站",at:"於",
  deployLine:(n,m,s,t)=>`${n} 名高風險人士 · 距${s} ${m} 分鐘 · 地表 ${t}°C`,noDesert:"此地區沒有避暑沙漠。",
  atRisk:"高風險",score:"分數",min:"分鐘",shaded:"有遮蔭",inSun:"分鐘曬太陽",covered:"有上蓋",inRain:"分鐘淋雨",modeSun:"☀️ 晴天",modeRain:"🌧 落雨",setBtn:"⚙️ 設定",setTitle:"步行天氣",setHint:"選擇路線要幫你避開甚麼。",sunDesc:"避開太陽。有蓋行人道、天橋、樹蔭街道和冷氣避暑點都算有遮蔭。地圖上：綠色＝有遮蔭，橙色＝日曬。",rainDesc:"避免淋雨。只計算有蓋行人道、天橋和室內通道，因為樹蔭擋不到雨。地圖上：藍色＝有上蓋，灰色＝會淋雨。",setDone:"完成",setMap:"地圖款式",setLayers:"地圖圖層",setLang:"語言",modeChipSun:"☀️ 晴天模式",modeChipRain:"🌧 落雨模式",modeChange:"更改",pubTitleRain:"行邊條路最少淋雨？",goRain:"搵少淋雨路線",mostCovered:"最多上蓋",lgRouteDry:"路線：有上蓋",lgRouteWet:"路線：會淋雨",sameRouteRain:"最快路線已經用到附近的有蓋通道，所以亦是最少淋雨的路線。",noShadeRain:"此行程沿途沒有有蓋通道，大部分路段都會淋雨。",shadeBetterRain:(x,s)=>`有蓋路線多行 ${x} 分鐘，但少淋 ${s} 分鐘雨。`,
  locating:"正在取得你的位置…",searching:"搜尋中…",routing:"正在搵最陰涼的路…",routingRain:"正在搵最少淋雨的路…",
  noGeo:"未能取得你的位置，已用維多利亞公園作示範起點。輸入起點即可更改。",
  notFound:q=>`搵唔到「${q}」。試吓輸入大廈、港鐵站或街道名稱。`,
  sameRoute:"最快路線已經用到附近的遮蔭，所以亦是最陰涼的路線。",
  noShade:"此行程沿途沒有有蓋通道，所以最快路線亦是最陰涼路線。",
  shadeBetter:(x,s)=>`陰涼路線多行 ${x} 分鐘，但少曬 ${s} 分鐘太陽。`,
  offline:"（步行路線服務離線：顯示估算直線路徑。）",
  pickNow:"在地圖上按一下設定起點。",start:"起點",myLoc:"我的位置",
  shadeTrees:"樹蔭",shadeIndoor:"室內，有冷氣",shadeCovered:"可遮太陽擋雨",noShadeList:"此路線沒有遮蔭路段。",noShadeListRain:"此路線沒有有蓋路段。",
  heatAdvice:(l,t)=>`<b>${l}</b> · ${t}°C。請行陰涼路線、帶水，如感到暈眩請到避暑點休息。`,
  vhot:"酷熱天氣警告",hot:"炎熱天氣警告",
  wxNear:"最近氣象站",wxLive:"即時 · 天文台",wxSample:"示範數據（未能連接天文台）",wxRhHQ:"濕度取自天文台總部",
  freeAccess:"有冷氣，免費進入",walk:"步行",desert:"避暑沙漠",nearest:"最近避暑點",surf:"地表溫度",
  subscribed:p=>`已訂閱${p}（示範）`,catchNote:"陰影圈：5／10 分鐘步行範圍",
  deployTag:i=>i===0?"流動降溫站":"補水站",
  lgMtr:"港鐵綫及車站",lyrBtn:"🗂 圖層",lyCovered:"有蓋行人道及天橋",lyTrees:"樹蔭街道",lyShelters:"避暑點",lyWalk:"避暑點 5 / 10 分鐘步行範圍",lyMtr:"港鐵綫及車站",useMyLoc:"使用我目前的位置",nearestOpt:"最近的避暑點",hdrNearMtr:"附近港鐵站",hdrNearShel:"附近避暑點",
  hdrMtr:"港鐵站",hdrExits:"車站出口",hdrPlaces:"地點",hdrSearch:"地址及地點",exit:"出口",stCentre:"車站中心",chooseExit:"出口：",
  exitsLoading:"正在載入出口…",exitsNone:"需要上網才能顯示出口位置。",stSuf:"站",exitLabel:(st,r)=>`${st}站 ${r} 出口`,
  linesLbl:"路綫",exitsLbl:"出口",typeShelter:"避暑點",typeArea:"社區",noSugg:"暫時未有結果，繼續輸入或按「搵最陰涼路線」。",hdrAddr:"地址",hdrGoogle:"Google 地圖地點",srcALS:"香港地址查詢",srcGeo:"地理資訊地圖",openGmaps:"在 Google 地圖開啟步行路線"}
};
let lang = "en"; try{ lang = localStorage.getItem("coolhk-lang") || "en"; }catch(e){}
const t = (k,...a) => { const v = T[lang][k] ?? T.en[k]; return typeof v==="function" ? v(...a) : v; };
const nm = o => lang==="zh" ? (o.zh||o.en) : o.en;

