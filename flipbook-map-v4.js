(() => {
  const root = document.getElementById('flipbook-art');
  if (!root) return;
  const trail = document.getElementById('flipbook-crumbs');
  const caption = document.getElementById('page-caption');
  const back = document.getElementById('flipbook-back');
  const history = [];
  let page = { kind: 'home' };
  const places = {
    north: { name: 'North Field', crop: 'Tomatoes', badge: 'IRRIGATION · FOLLOW-UP', state: 'Valve tag still needs repair', harvest: '42 crates', crew: 'Maya · Luis · Rosa', seed: 'No planting reference in this demo', body: 'West irrigation line was dripping near the valve. The pump was checked and pressure returned to normal. Keep the muddy corner clear until the valve tag is repaired.', events: [['Irrigation report', 'Maya · west line dripping near the valve', 'north-report'], ['Pump check', 'Luis · pressure back to normal; valve tag remains', 'north-pump'], ['Tomato harvest', 'Maya · 42 crates; soft fruit set aside', 'north-harvest'], ['Kitchen crates', 'Rosa · 2 crates kept separate for the kitchen', 'north-quality'], ['Cart repair', 'North Field shed · cracked wheel before packing', 'north-cart']] },
    bed8: { name: 'Bed 8', crop: 'Spring mix', badge: 'PLANTING · P-104', state: 'Correction proposal needs review', harvest: '24 pounds', crew: 'Maya · Luis', seed: 'SM-28 · sown Sep 10, 2026', body: 'The planting log links spring mix in Bed 8 to seed reference SM-28. A 24-pound harvest is recorded. A later reweigh proposes 22 pounds; the saved harvest has not been changed.', events: [['Harvest · 24 pounds', 'Maya · Oct 27 · linked to planting P-104', 'bed8-harvest'], ['Moved labeled bin to cooler', 'Luis · lot handling note', 'bed8-cooler'], ['Correction proposal · 22 pounds', 'Maya · scale re-zeroed · not applied', 'bed8-correction']] },
    south: { name: 'South Tunnel', crop: 'Cucumbers', badge: 'CROP HEALTH · CHECK', state: 'Aphids reported before next pick', harvest: '18 boxes', crew: 'Rosa', seed: 'No planting reference in this demo', body: 'Aphids were reported on cucumber leaves. The harvest note says the fruit was clean and the last row was smaller after an irrigation hiccup. Check the crop before the next pick.', events: [['Aphids observed', 'Rosa · check before the next pick', 'south-aphids'], ['Cucumber harvest · 18 boxes', 'Rosa · fruit clean; last row smaller', 'south-harvest']] },
    orchard: { name: 'East Orchard', crop: 'Apples', badge: 'HARVEST · SEPARATE LOTS', state: 'Windfall bin kept separate', harvest: '9 bins', crew: 'Luis', seed: 'No planting reference in this demo', body: 'Nine bins of apples were gathered. One windfall bin must remain separate from fresh-market apples.', events: [['Apple harvest · 9 bins', 'Luis · East Orchard', 'orchard-harvest'], ['Windfall kept separate', 'One bin · do not mix with fresh-market apples', 'orchard-windfall']] }
  };
  const events = {
    'north-report': { title: 'Irrigation report', place: 'North Field', meta: 'Maya · Oct 27, 2026 · field update', quote: '“The west irrigation line in North Field is still dripping near the valve. Please keep the muddy corner clear.”', note: 'This is an issue report. The source does not say the valve tag has been repaired.' },
    'north-pump': { title: 'Pump check', place: 'North Field', meta: 'Luis · Oct 27, 2026 · field update', quote: '“I checked the pump at North Field and tightened the west line. Pressure is back to normal; the cracked valve tag still needs repair after harvest.”', note: 'Pressure returned to normal; the valve tag repair remains an open follow-up.' },
    'north-harvest': { title: 'Tomato harvest · 42 crates', place: 'North Field', meta: 'Maya · Oct 27, 2026 · harvest', quote: '“We harvested 42 crates of tomatoes from North Field. Some fruit was soft, so we kept those crates separate for the kitchen.”', note: 'The sample also has a separate note specifying 2 crates for the kitchen.' },
    'north-quality': { title: 'Soft tomatoes · 2 crates', place: 'North Field', meta: 'Rosa · Oct 27, 2026 · quality note', quote: '“We set aside 2 crates of tomatoes from North Field for the kitchen because that fruit was soft.”', note: 'Quality note linked to North Field. The quantity remains as reported.' },
    'north-cart': { title: 'Cart wheel · repair', place: 'North Field', meta: 'Oct 27, 2026 · equipment note', quote: '“The cart wheel at the North Field shed is cracked and needs repair before packing.”', note: 'Repair is reported as needed; no repair completion is recorded.' },
    'bed8-harvest': { title: 'Harvest · 24 pounds', place: 'Bed 8', meta: 'Maya · Oct 27, 2026 · planting P-104', quote: '“We harvested 24 pounds of spring mix from Bed 8 today.”', note: 'Saved harvest entry. Linked planting: P-104 · seed reference SM-28.' },
    'bed8-cooler': { title: 'Moved labeled bin to cooler', place: 'Bed 8', meta: 'Luis · Oct 27, 2026 · lot handling', quote: '“I packed the Bed 8 spring mix in a labeled bin and moved the harvest lot from Bed 8 to the cooler. Please add the cooler move to its lot trace.”', note: 'Handling update. It does not change the recorded harvest amount.' },
    'bed8-correction': { title: 'Correction proposal · 22 pounds', place: 'Bed 8', meta: 'Maya · Oct 27, 2026 · pending review', quote: '“Correction for Bed 8: we had logged 24 pounds, but after reweighing the spring mix total should be 22 pounds. Please flag the harvest row for correction; the scale was re-zeroed.”', note: 'Proposal only. The original 24-pound record remains until a person applies a correction.' },
    'south-aphids': { title: 'Aphids observed', place: 'South Tunnel', meta: 'Rosa · Oct 27, 2026 · crop-health note', quote: '“I saw aphids on cucumber leaves in South Tunnel; please check the crop before the next pick.”', note: 'The message asks for a crop check. No treatment is recorded.' },
    'south-harvest': { title: 'Cucumber harvest · 18 boxes', place: 'South Tunnel', meta: 'Rosa · Oct 27, 2026 · harvest', quote: '“We harvested 18 boxes of cucumbers from South Tunnel. The fruit is clean, but the last row was smaller after the irrigation hiccup.”', note: 'Harvest amount and crop condition are preserved as reported.' },
    'orchard-harvest': { title: 'Apple harvest · 9 bins', place: 'East Orchard', meta: 'Luis · Oct 27, 2026 · harvest', quote: '“We gathered 9 bins of apples from East Orchard. One bin is windfall fruit and must stay separate from fresh-market apples.”', note: 'The source calls for separating the windfall bin from fresh-market apples.' },
    'orchard-windfall': { title: 'Windfall apples · keep separate', place: 'East Orchard', meta: 'Luis · Oct 27, 2026 · handling instruction', quote: '“One bin is windfall fruit and must stay separate from fresh-market apples.”', note: 'Handling instruction from the harvest source. No sale or destination is inferred.' },
    'basil-unknown': { title: 'Basil harvest · location missing', place: 'Needs location', meta: 'Maya · Oct 27, 2026 · follow-up needed', quote: '“We picked 6 buckets of basil, but I forgot which bed. Please leave the location blank and flag it for me instead of guessing.”', note: 'Six buckets are reported. The bed is unknown and should remain blank until someone confirms it.' }
  };
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (content, tone = 'paper') => `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive visual farm page"><defs>
      <pattern id="grain" width="42" height="42" patternUnits="userSpaceOnUse"><circle cx="5" cy="8" r="1.2" fill="#516348" opacity=".11"/><circle cx="31" cy="26" r="1" fill="#53664a" opacity=".09"/><path d="M0 40L40 0" stroke="#fff" stroke-width="1" opacity=".23"/></pattern>
      <pattern id="rows" width="24" height="24" patternTransform="rotate(18)" patternUnits="userSpaceOnUse"><path d="M0 0V24" stroke="#7b9869" stroke-width="3" opacity=".45"/></pattern>
      <pattern id="orchardRows" width="62" height="62" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="13" fill="#779269"/><circle cx="30" cy="30" r="20" fill="none" stroke="#fff6dd" stroke-width="2"/></pattern>
      <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#c9ded3"/><stop offset="1" stop-color="#e8ead4"/></linearGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
    </defs><rect width="1600" height="900" fill="${tone === 'dark' ? '#17352a' : '#e9e5d3'}"/><rect width="1600" height="900" fill="url(#grain)"/>${content}</svg>`;
  const hotspot = (route, x, y, w, h, content, label) => `<g class="hotspot">${content}<rect class="hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="transparent" pointer-events="all" role="button" tabindex="0" aria-label="${esc(label)}" data-route="${esc(route)}"/></g>`;
  const icon = (x, y, color = '#bf6650') => `<g transform="translate(${x} ${y})"><path d="M0 10C-24 -22 -50 1 -36 20C-20 39 10 32 0 10Z" fill="#789b69"/><path d="M0 10C25 -24 47 0 34 20C20 40 -10 31 0 10Z" fill="#94a96d"/><circle cx="0" cy="17" r="28" fill="${color}" stroke="#f9f2dd" stroke-width="5"/><path d="M-4 -10q7 -22 24 -17q-6 13 -24 17Z" fill="#557749"/></g>`;
  const wrapSvg = (text, x, y, maxChars, lineHeight, size, fill) => {
    const words = String(text).split(/\s+/); const lines = []; let current = '';
    for (const word of words) { const next = current ? `${current} ${word}` : word; if (next.length > maxChars && current) { lines.push(current); current = word; } else current = next; }
    if (current) lines.push(current);
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${esc(line)}</tspan>`).join('')}</text>`;
  };
  const crumbs = () => {
    const list = [{ label: 'Willow Creek', page: { kind: 'home' } }];
    if (page.kind === 'place') list.push({ label: places[page.id].name, page });
    if (page.kind === 'event') { const ev = events[page.id]; const parent = Object.keys(places).find((key) => places[key].name === ev.place); if (parent) list.push({ label: ev.place, page: { kind: 'place', id: parent } }); list.push({ label: ev.title, page }); }
    if (page.kind === 'answer' || page.kind === 'ask' || page.kind === 'log' || page.kind === 'logMore' || page.kind === 'memory') list.push({ label: page.kind === 'answer' ? 'Farmhand answer' : ({ ask: 'Ask Farmhand', log: 'Field journal', logMore: 'Field journal · more', memory: 'Farm memory' }[page.kind]), page });
    trail.innerHTML = list.map((item, i) => `${i ? '<span>／</span>' : ''}<button type="button" data-crumb="${i}">${esc(item.label)}</button>`).join('');
    trail.querySelectorAll('[data-crumb]').forEach((button) => button.addEventListener('click', () => { const crumb = list[Number(button.dataset.crumb)]; history.push(page); page = crumb.page; render('backward'); }));
  };
  function farmMap() {
    const label = (x,y,w,kicker,title,sub,flag=false) => `<g><path d="M${x+8} ${y+5}h${w}v65h-${w}Z" fill="#e5ddc9" opacity=".65"/><path d="M${x} ${y}h${w}v65h-${w}Z" fill="#f8f4e8" stroke="#837968" stroke-width="1.8"/><path d="M${x} ${y}h7v65h-7Z" fill="${flag?'#a87548':'#6b8063'}"/><text x="${x+18}" y="${y+19}" font-size="8" font-weight="700" letter-spacing="1.3" fill="#756e60">${esc(kicker)}</text><text x="${x+18}" y="${y+42}" font-size="17" font-weight="700" fill="#30382d">${esc(title)}</text><text x="${x+18}" y="${y+57}" font-size="10" fill="#6f7164">${esc(sub)}</text>${flag?`<circle cx="${x+w-14}" cy="${y+14}" r="4" fill="#b37b45"/>`:''}</g>`;
    // Use one restrained crop marker across all four plots. Crop identity and
    // operational issues are stated in the labels, not approximated with odd mini-illustrations.
    const cropMarkers = (count, cols, x0, y0, dx, dy, skew, tone = '#718367') => Array.from({length:count},(_,i)=>{const col=i%cols,row=Math.floor(i/cols),x=x0+col*dx+row*skew,y=y0+row*dy-col*4;return `<circle cx="${x}" cy="${y}" r="5.5" fill="${tone}" stroke="#e1dfcd" stroke-width="1.2"/>`}).join('');
    const vinePlants = cropMarkers(30,6,244,357,49,23,17,'#738665');
    const leafCrop = cropMarkers(48,8,876,347,36,25,10,'#738665');
    const orchardCanopies = cropMarkers(24,6,930,564,67,47,12,'#738665');
    const tomatoes = hotspot('place:north',125,190,650,340,
      `<path d="M151 354L432 230 744 350 441 512Z" fill="#7d8b6c" stroke="#625f50" stroke-width="3"/><path d="M168 353L432 246 724 353 440 493Z" fill="#879273" stroke="#d8d0b9" stroke-width="2"/>${vinePlants}<path d="M151 354L441 512 441 539 151 380Z" fill="#727d60" stroke="#625f50" stroke-width="2"/>${label(175,258,260,'NORTH FIELD · REVIEW','North Field','Tomatoes · line leak',true)}<path d="M455 347l87 -38" stroke="#f1ead9" stroke-width="2"/>`,'Explore North Field');
    const springMix = hotspot('place:bed8',805,183,665,350,
      `<path d="M824 353L1123 228 1442 355 1135 516Z" fill="#7b8968" stroke="#625f50" stroke-width="3"/><path d="M844 353L1124 244 1422 355 1135 496Z" fill="#879274" stroke="#d8d0b9" stroke-width="2"/>${leafCrop}<path d="M824 353L1135 516 1135 542 824 379Z" fill="#707c60" stroke="#625f50" stroke-width="2"/>${label(1124,265,276,'BED 8 · P-104','Spring mix','24 lb · correction proposed: 22',true)}<path d="M1124 337L1080 365" stroke="#6f6a5c" stroke-width="1.4"/>`,'Explore Bed 8 and planting P-104');
    const tunnels = Array.from({length:4},(_,i)=>{const x=228+i*115,y=615-i*39;return `<g><path d="M${x} ${y+45}l81 -35v91l-81 35Z" fill="#d9e3d3" fill-opacity=".64" stroke="#637762" stroke-width="3"/><path d="M${x} ${y+45}q40 -67 81 -35m-81 60q40 -66 81 -34m-81 60q40 -66 81 -34" fill="none" stroke="#82957c" stroke-width="2"/><path d="M${x+13} ${y+70}l14 -23m13 29l15 -25m10 29l14 -26" stroke="#547a5b" stroke-width="3"/></g>`}).join('');
    const south = hotspot('place:south',125,490,650,330,
      `<path d="M151 592L443 465 744 591 443 752Z" fill="#77856b" stroke="#625f50" stroke-width="3"/><path d="M171 592L443 480 724 592 443 730Z" fill="#899376" stroke="#d8d0b9" stroke-width="2"/>${tunnels}<path d="M151 592L443 752 443 781 151 620Z" fill="#6d795d" stroke="#625f50" stroke-width="2"/>${label(170,663,255,'SOUTH TUNNEL · REVIEW','South Tunnel','Cucumbers · aphids',true)}`,'Explore South Tunnel crop health');
    const orchard = hotspot('place:orchard',805,500,665,320,
      `<path d="M824 592L1128 464 1442 591 1135 752Z" fill="#78856b" stroke="#625f50" stroke-width="3"/><path d="M844 592L1128 481 1421 591 1135 730Z" fill="#929779" stroke="#d8d0b9" stroke-width="2"/>${orchardCanopies}<path d="M824 592L1135 752 1135 781 824 621Z" fill="#6e795f" stroke="#625f50" stroke-width="2"/>${label(1158,665,250,'EAST ORCHARD · ACTIVE','East Orchard','9 bins · windfall kept separate')}`,'Explore East Orchard harvest');
    return `<rect width="1600" height="900" fill="#f3efe3"/><path d="M48 45H1552V854H48Z" fill="#f7f4eb" stroke="#4c4b43" stroke-width="2.5"/><path d="M69 66H1531V832H69Z" fill="none" stroke="#b8b1a0" stroke-width="1.2"/>
      <text x="91" y="100" font-size="10" font-weight="700" letter-spacing="2" fill="#817969">WILLOW CREEK FARM　·　FIELD ATLAS</text><text x="92" y="139" font-family="Manrope" font-size="30" font-weight="700" fill="#343a31">A season in the making</text><text x="1505" y="104" text-anchor="end" font-size="10" letter-spacing="1.4" fill="#777365">OCT 27　/　FIELD NOTES</text>
      <path d="M84 171H1516" stroke="#c8c1b0" stroke-width="1"/>
      <path d="M112 424L800 153 1490 424 800 810Z" fill="#8a785f" opacity=".22" transform="translate(0 11)"/><path d="M112 410L800 148 1490 410 800 795Z" fill="#d4d1be" stroke="#6e6a5a" stroke-width="3"/><path d="M135 409L800 164 1467 409 800 778Z" fill="#aab096" stroke="#e9e3d2" stroke-width="2"/>
      <path d="M730 388Q791 362 855 389L888 414Q829 446 770 431Z" fill="#e9dfc9" stroke="#847963" stroke-width="2"/><path d="M442 512L730 388M443 752L770 431M1135 516L855 389M1135 752L888 414" stroke="#ece5d5" stroke-width="15" fill="none"/><path d="M442 512L730 388M443 752L770 431M1135 516L855 389M1135 752L888 414" stroke="#a79a7c" stroke-width="1.5" stroke-dasharray="5 7" fill="none"/>
      <g><path d="M726 359l63 -27 71 29 -64 31Z" fill="#a77b59" stroke="#514d42" stroke-width="2"/><path d="M726 359v45l70 34v-46Z" fill="#e4d8c2" stroke="#514d42" stroke-width="2"/><path d="M796 392v46l64 -34v-43Z" fill="#c8b99d" stroke="#514d42" stroke-width="2"/><path d="M738 356l53 -31 58 27 -54 29Z" fill="#687c70" stroke="#514d42" stroke-width="2"/><path d="M761 369v29m24 -38v44m24 -43v33" stroke="#756a57" stroke-width="3"/><path d="M786 336v-26l13 -6v31" fill="#c8b99d" stroke="#514d42" stroke-width="1.5"/></g>
      ${tomatoes}${springMix}${south}${orchard}
      ${hotspot('page:ask',1190,62,318,64,`<path d="M1221 73h273v44h-273Z" fill="#3a4238"/><text x="1238" y="91" font-size="8" font-weight="700" letter-spacing="1.2" fill="#d8d6c9">FARMHAND　·　ASK A QUESTION</text><text x="1238" y="108" font-size="13" font-weight="700" fill="#f5f1e6">Open farm intelligence　↗</text>`,'Ask Farmhand a question')}
      ${hotspot('page:log',81,811,220,32,`<text x="91" y="832" font-size="10" font-weight="700" letter-spacing=".8" fill="#68695e">FIELD JOURNAL　↗　SOURCE NOTES</text>`,'Open the field journal')}
      ${hotspot('page:memory',1290,811,220,32,`<text x="1300" y="832" font-size="10" font-weight="700" letter-spacing=".8" fill="#68695e">PLANTING MEMORY　↗　P-104</text>`,'Open planting memory')}
      <text x="800" y="833" text-anchor="middle" font-size="9" letter-spacing=".6" fill="#817969">Choose a scene to unfold its field history</text>
      <rect width="1600" height="900" fill="url(#grain)" opacity=".13" pointer-events="none"/>`;
  }
  function fieldArt(id) {
    const d = places[id];
    const cropRows = id === 'south'
      ? Array.from({length:4},(_,i)=>{const x=146+i*158,y=575-i*43;return `<g><path d="M${x} ${y+56}l112 -48v132l-112 51Z" fill="#d9e2d3" fill-opacity=".65" stroke="#657765" stroke-width="3"/><path d="M${x} ${y+56}q56 -92 112 -48m-112 83q56 -91 112 -48m-112 83q56 -91 112 -48" fill="none" stroke="#889880" stroke-width="2"/><path d="M${x+20} ${y+90}l20 -28m22 35 20 -30m18 36 18 -30" stroke="#58765a" stroke-width="4"/></g>`}).join('')
      : Array.from({length:id==='bed8'?42:24},(_,i)=>{const cols=id==='bed8'?7:6,col=i%cols,row=Math.floor(i/cols),x=161+col*(id==='bed8'?63:86)+row*(id==='bed8'?27:28),y=590+row*(id==='bed8'?24:37)-col*(id==='bed8'?10:13);return `<circle cx="${x}" cy="${y}" r="6.5" fill="#718367" stroke="#e1dfcd" stroke-width="1.2"/>`}).join('');
    const sceneExtra = id === 'bed8' ? `<g><path d="M653 577l83 -35 89 38 -82 39Z" fill="#b99968" stroke="#64563f" stroke-width="2"/><path d="M653 577v83l90 46v-87Z" fill="#c8ab78" stroke="#64563f" stroke-width="2"/><path d="M743 619v87l82 -43v-83Z" fill="#a98759" stroke="#64563f" stroke-width="2"/><path d="M667 595l74 37m-73 -13 74 38m-74 -12 74 38" stroke="#896e4b" stroke-width="2"/><path d="M668 570l73 -31 74 32 -73 32Z" fill="#d4bf93" stroke="#64563f" stroke-width="2"/><text x="719" y="581" text-anchor="middle" font-size="9" font-weight="700" fill="#5d503b">SM-28</text></g><g><path d="M692 448l76 -33 78 34 -77 36Z" fill="#5e6a5b" stroke="#56584c" stroke-width="2"/><path d="M692 448v73l77 38v-74Z" fill="#aeb5a4" stroke="#56584c" stroke-width="2"/><path d="M769 485v74l77 -40v-70Z" fill="#8f9c8e" stroke="#56584c" stroke-width="2"/><path d="M712 464v43m31 -27v43m29 -42v44" stroke="#d9dfd2" stroke-width="2"/><path d="M718 460l52 -22 47 22" stroke="#d8ddd0" stroke-width="2" fill="none"/></g>` : id === 'north' ? `<g><path d="M650 610l69 -30 72 32 -69 32Z" fill="#b99866" stroke="#635640" stroke-width="2"/><path d="M650 610v68l72 37v-71Z" fill="#c5a875" stroke="#635640" stroke-width="2"/><path d="M722 644v71l69 -36v-67Z" fill="#a78655" stroke="#635640" stroke-width="2"/><path d="M666 630l55 29m-55 -4 55 29m-54 -3 54 28" stroke="#8b704e" stroke-width="2"/></g>` : '';
    const notes = d.events.map((e,i)=>{const y=438+i*68;return hotspot(`event:${e[2]}`,920,y,585,59,`<path d="M947 ${y+8}V${y+58}" stroke="#aaa28e" stroke-width="1.3"/><circle cx="947" cy="${y+17}" r="6" fill="${i===0&&d.badge.includes('FOLLOW')?'#aa7548':'#6d8265'}" stroke="#f7f3e8" stroke-width="2"/><text x="969" y="${y+19}" font-size="15" font-weight="700" fill="#383b31">${esc(e[0])}</text><text x="969" y="${y+41}" font-size="11" fill="#777466">${esc(e[1])}</text><text x="1480" y="${y+28}" text-anchor="end" font-size="17" fill="#7e806f">↗</text>`,`Open source: ${e[0]}`)}).join('');
    return `<rect width="1600" height="900" fill="#f3efe3"/><path d="M48 45H1552V854H48Z" fill="#f7f4eb" stroke="#4c4b43" stroke-width="2.5"/><path d="M69 66H1531V832H69Z" fill="none" stroke="#b8b1a0" stroke-width="1.2"/><text x="92" y="100" font-size="9" font-weight="700" letter-spacing="1.8" fill="#817969">WILLOW CREEK FARM　/　FIELD ATLAS　/　${esc(d.name.toUpperCase())}</text><text x="92" y="153" font-size="38" font-weight="700" fill="#343a31">${esc(d.name)}</text><text x="96" y="184" font-size="16" fill="#6b6b5f">${esc(d.crop)}　·　${esc(d.badge)}</text>
      <path d="M75 219H1525" stroke="#c8c1b0" stroke-width="1"/><path d="M92 615L475 423 880 612 474 818Z" fill="#91816a" opacity=".2" transform="translate(0 10)"/><path d="M92 604L475 412 880 601 474 807Z" fill="#a9ae93" stroke="#686657" stroke-width="2.5"/><path d="M115 602L475 431 853 601 474 783Z" fill="#8f997a" stroke="#e7e0ce" stroke-width="2"/>
      ${cropRows}${sceneExtra}<path d="M128 629L475 793 475 807 92 618Z" fill="#757f64" opacity=".72"/><path d="M871 601L474 807V793L853 601Z" fill="#79836a" opacity=".72"/>
      <path d="M946 270h285v83H946Z" fill="#f8f4e8" stroke="#837968" stroke-width="1.6"/><text x="967" y="294" font-size="9" font-weight="700" letter-spacing="1.2" fill="#797364">FIELD STORY　·　SAVED FARM NOTES</text>${wrapSvg(d.body,967,324,49,20,14,'#41473b')}<path d="M946 376H1502" stroke="#c8c1b0" stroke-width="1"/><text x="946" y="409" font-size="9" font-weight="700" letter-spacing="1.4" fill="#797364">TAP A NOTE TO OPEN ITS SOURCE</text>${notes}
      <path d="M117 291L200 291 233 350" fill="none" stroke="#857e6d" stroke-width="1.2"/><path d="M116 279h249v67H116Z" fill="#f8f4e8" stroke="#837968" stroke-width="1.5"/><text x="133" y="300" font-size="8" font-weight="700" letter-spacing="1.1" fill="#7d7665">${esc(d.badge)}</text><text x="133" y="322" font-size="16" font-weight="700" fill="#343a31">${esc(d.crop)}</text><text x="133" y="337" font-size="10" fill="#6f7164">${esc(d.harvest)}　·　${esc(d.seed)}</text>
      <text x="92" y="830" font-size="9" letter-spacing="1" fill="#7d776a">FIELD JOURNAL　·　SOURCE-LINKED HISTORY</text><text x="1505" y="830" text-anchor="end" font-size="9" letter-spacing="1" fill="#7d776a">SELECT ANNOTATION TO CONTINUE</text>`;
  }
  function eventPage(id) {
    const e = events[id];
    const parent = Object.keys(places).find((key) => places[key].name === e.place);
    const p = parent ? places[parent] : { seed: 'Location not provided', crop: 'Basil', crew: 'Maya' };
    const returnLink = parent ? hotspot(`place:${parent}`,96,690,420,104,`<rect x="112" y="704" width="386" height="72" rx="16" fill="#274934"/><text x="139" y="734" class="micro" fill="#d9ec9c">RETURN TO PLACE</text><text x="139" y="759" font-size="21" font-weight="700" fill="#f4f0df">${esc(e.place)}　←</text>`,'Return to ' + e.place) : hotspot('page:logMore',96,690,420,104,`<rect x="112" y="704" width="386" height="72" rx="16" fill="#274934"/><text x="139" y="734" class="micro" fill="#d9ec9c">RETURN TO JOURNAL</text><text x="139" y="759" font-size="21" font-weight="700" fill="#f4f0df">Field journal　←</text>`,'Return to the field journal');
    return `<rect width="1600" height="900" fill="#e8e5d4"/><path d="M0 600Q220 468 480 590T930 562T1600 610V900H0Z" fill="#d0d9ba"/><path d="M0 700Q250 590 540 690T1090 670T1600 720" fill="none" stroke="#92b8ae" stroke-width="18"/><text x="78" y="74" class="micro" fill="#58715a">WILLOW CREEK　／　${esc(e.place.toUpperCase())}　／　SOURCE</text><text x="78" y="150" class="display" font-size="54" fill="#203b2b">${esc(e.title)}</text><text x="82" y="194" font-size="19" fill="#61765f">${esc(e.meta)}</text><rect x="93" y="260" width="1412" height="422" rx="27" fill="#fbf8eb" stroke="#d9decc" stroke-width="2"/><text x="144" y="322" class="micro" fill="#73846f">ORIGINAL FIELD MESSAGE　·　SOURCE TEXT</text>${wrapSvg(e.quote,145,390,83,43,29,'#2c4631')}<path d="M146 510H1420" stroke="#dde2d1" stroke-width="2"/><text x="145" y="555" class="micro" fill="#9a7b47">WHAT THE RECORD SAYS</text>${wrapSvg(e.note,145,594,103,27,19,'#4d654e')}<text x="145" y="665" font-size="15" fill="#7d8978">Farm reference: ${esc(p.seed)}　·　related crop: ${esc(p.crop)}</text>${returnLink}${hotspot('page:ask',1030,690,436,104,`<rect x="1044" y="704" width="400" height="72" rx="16" fill="#d9ec9c"/><text x="1074" y="734" class="micro" fill="#59764f">EXPLORE THE RECORD</text><text x="1074" y="759" font-size="21" font-weight="700" fill="#263f2b">Ask Farmhand about it　↗</text>`,'Ask Farmhand about this source')}`;
  }
  const questions = [
    ['attention', 'What needs attention?', 'Open issues and follow-ups'],
    ['bed8', 'What happened in Bed 8?', 'Harvest · cooler · correction'],
    ['harvest', 'How much spring mix was harvested?', 'Find amounts and their sources']
  ];
  function askPage() {
    const picks = questions.map(([id, q, sub], i) => { const x = 190 + (i % 2) * 624, y = 310 + Math.floor(i / 2) * 168; return hotspot(`answer:${id}`,x,y,574,132,`<rect x="${x+15}" y="${y+15}" width="542" height="102" rx="20" fill="${i === 0 ? '#d9ec9c' : '#fffaf0'}" stroke="#d4dbc9" stroke-width="2"/><text x="${x+47}" y="${y+57}" class="micro" fill="#72836c">FARMHAND　·　QUESTION ${i + 1}</text><text x="${x+47}" y="${y+93}" font-size="25" font-weight="700" fill="#2b4531">${esc(q)}</text><text x="${x+47}" y="${y+116}" font-size="14" fill="#798772">${esc(sub)}　↗</text>`,q); }).join('');
    return `<rect width="1600" height="900" fill="#e7e8d7"/><circle cx="1310" cy="190" r="190" fill="#d7e2c4"/><path d="M0 650Q230 526 502 642T1040 605T1600 648V900H0Z" fill="#ccd8b5"/><text x="92" y="88" class="micro" fill="#627a60">FARMHAND　·　SOURCE-LINKED ANSWERS</text><text x="88" y="172" class="display" font-size="58" fill="#203b2b">Ask the farm a question.</text><text x="94" y="218" font-size="19" fill="#667b63">Choose one to explore an answer page with its saved sources.</text>${picks}<text x="95" y="837" class="micro" fill="#75846f">NO LIVE SENSORS OR EXTERNAL SEARCH　·　ANSWERS USE THIS FICTIONAL DEMO'S NOTES</text>`;
  }
  function answerPage(id) {
    let title, text, sources;
    if (id === 'attention') { title = 'What needs attention?'; text = 'The sample notes flag a dripping west irrigation line and cracked valve tag at North Field, aphids in South Tunnel, a cracked cart wheel before packing, a basil bed to identify, and a proposed Bed 8 correction. The messages do not confirm these items are resolved.'; sources = ['north-report', 'north-pump', 'south-aphids', 'north-cart', 'basil-unknown', 'bed8-correction']; }
    else if (id === 'bed8') { title = 'What happened in Bed 8?'; text = 'Spring mix is linked to planting P-104 and seed reference SM-28. A 24-pound harvest and a move to the cooler were reported. A later message proposes 22 pounds; the correction has not been applied.'; sources = ['bed8-harvest', 'bed8-cooler', 'bed8-correction']; }
    else { title = 'How much spring mix was harvested?'; text = 'One saved harvest note records 24 pounds from Bed 8 on Oct 27. A separate message proposes a corrected total of 22 pounds after reweighing. The 22-pound proposal is pending and does not change the saved harvest.'; sources = ['bed8-harvest', 'bed8-correction']; }
    const nodes = sources.map((source, i) => { const col = i % 3, row = Math.floor(i / 3), x = 80 + col * 490, y = 610 + row * 112; return hotspot(`event:${source}`,x,y,460,94,`<rect x="${x+12}" y="${y+8}" width="436" height="78" rx="15" fill="#fffaf0" stroke="#dce2d1" stroke-width="2"/><text x="${x+30}" y="${y+34}" class="micro" fill="#7b8e73">SOURCE ${i + 1}</text><text x="${x+30}" y="${y+61}" font-size="17" font-weight="700" fill="#2c4732">${esc(events[source].title)}</text><text x="${x+397}" y="${y+56}" font-size="20" fill="#81907c">↗</text>`,`Open source: ${events[source].title}`); }).join('');
    return `<rect width="1600" height="900" fill="#e9e7d7"/><path d="M0 0H1600V900H0Z" fill="url(#sky)"/><path d="M0 692Q300 575 640 685T1280 662T1600 704V900H0Z" fill="#c9d6b2"/><text x="92" y="83" class="micro" fill="#61795f">FARMHAND　／　ANSWER　·　${id.toUpperCase()}</text><text x="88" y="167" class="display" font-size="55" fill="#203b2b">${esc(title)}</text><rect x="91" y="218" width="1418" height="316" rx="28" fill="#f9f6e9" stroke="#d9decd" stroke-width="2"/><circle cx="145" cy="278" r="23" fill="#d9ec9c"/><path d="M145 264v28m-14 -14h28m-23 -9l18 18m0 -18l-18 18" stroke="#3d6042" stroke-width="3"/><text x="191" y="282" class="micro" fill="#77906f">GROUNDED IN SAVED FARM NOTES</text>${wrapSvg(text,143,351,105,34,22,'#344e37')}<text x="143" y="478" font-size="16" fill="#8b7952">This answer reflects the fictional demo records only. Unknowns remain open.</text><text x="94" y="585" class="micro" fill="#71836d">OPEN THE SOURCES BEHIND THIS ANSWER</text>${nodes}`;
  }
  function logPage(more = false) {
    const all = Object.entries(events).map(([id,e]) => ({id,e}));
    const items = more ? all.slice(8) : all.slice(0,8);
    const cards = items.map(({id,e},i) => { const x = 74+(i%2)*744, y=250+Math.floor(i/2)*132; return hotspot(`event:${id}`,x,y,710,115,`<rect x="${x+14}" y="${y+14}" width="676" height="86" rx="16" fill="#faf7e9" stroke="#d9dfcf" stroke-width="2"/><circle cx="${x+45}" cy="${y+30}" r="8" fill="${e.title.toLowerCase().includes('correction')||e.title.toLowerCase().includes('aphid')||e.title.toLowerCase().includes('irrigation')||e.title.toLowerCase().includes('missing')?'#d69d50':'#709164'}"/><text x="${x+71}" y="${y+36}" font-size="18" font-weight="700" fill="#2a4530">${esc(e.title)}</text><text x="${x+71}" y="${y+67}" font-size="14" fill="#7b8977">${esc(e.place)}　·　${esc(e.meta)}</text><text x="${x+630}" y="${y+50}" font-size="21" fill="#81977a">↗</text>`,`Open journal entry ${e.title}`); }).join('');
    const pageTurn = more ? hotspot('page:log',1070,758,420,72,`<rect x="1084" y="767" width="392" height="54" rx="14" fill="#d9ec9c"/><text x="1110" y="801" font-size="18" font-weight="700" fill="#2c4732">← Previous field notes</text>`,'Return to earlier field notes') : hotspot('page:logMore',1070,758,420,72,`<rect x="1084" y="767" width="392" height="54" rx="14" fill="#d9ec9c"/><text x="1110" y="801" font-size="18" font-weight="700" fill="#2c4732">More field notes　→</text>`,'Open more field notes');
    return `<rect width="1600" height="900" fill="#e8e5d4"/><path d="M0 0H1600V900H0Z" fill="#e5e9d7"/><text x="86" y="85" class="micro" fill="#667d63">WILLOW CREEK　／　FIELD JOURNAL ${more?'· MORE NOTES':''}</text><text x="82" y="161" class="display" font-size="58" fill="#203b2b">${more?'More stories from the field.':'A day told through field notes.'}</text><text x="88" y="205" font-size="18" fill="#6b8069">Tap any note to unfold its source, context, and connected place.</text>${cards}${pageTurn}`;
  }
  function memoryPage() {
    return `<rect width="1600" height="900" fill="#e8e5d4"/><path d="M0 0H1600V900H0Z" fill="url(#sky)"/><path d="M0 670Q270 540 555 670T1115 640T1600 680V900H0Z" fill="#cbd8b7"/><path d="M80 586Q420 482 820 582" fill="none" stroke="#83a16f" stroke-width="9"/><path d="M80 620Q430 516 820 616" fill="none" stroke="#83a16f" stroke-width="9"/><g fill="#709466">${Array.from({length:26},(_,i)=>`<path d="M${105+i*27} ${580-(i%4)*15}q-22 -33 -37 -10q18 28 37 10q18 -36 41 -14q-19 33 -41 14Z"/>`).join('')}</g><text x="91" y="86" class="micro" fill="#61795f">FARM MEMORY　／　PLANTING LOG</text><text x="86" y="170" class="display" font-size="58" fill="#203b2b">A planting remembers its season.</text><text x="91" y="215" font-size="19" fill="#657b62">P-104 connects a crop, a bed, its seed reference, and later work.</text><rect x="929" y="276" width="563" height="414" rx="27" fill="#faf7e9" stroke="#d9dfcf" stroke-width="2"/><text x="986" y="333" class="micro" fill="#788b71">PLANTING　·　P-104</text><text x="981" y="395" font-size="34" font-weight="800" fill="#263f2c">Spring mix</text><text x="985" y="435" font-size="20" fill="#637962">Bed 8 · direct-sown Sep 10, 2026</text><path d="M984 472H1422" stroke="#dce1d1" stroke-width="2"/><text x="984" y="516" class="micro" fill="#84927b">SEED REFERENCE</text><text x="984" y="552" font-size="26" font-weight="700" fill="#2f4b35">SM-28</text>${hotspot('place:bed8',954,576,500,88,`<rect x="974" y="588" width="454" height="60" rx="14" fill="#d9ec9c"/><text x="1000" y="625" font-size="19" font-weight="700" fill="#2a4630">Open Bed 8's harvest and source trail　↗</text>`,'Open Bed 8 and its connected farm history')}`;
  }
  function render(direction = '') {
    const current = root.querySelector('.atlas-page-incoming') || root.querySelector('svg');
    const previous = direction ? current?.cloneNode(true) : null;
    root.scrollLeft = 0;
    crumbs();
    let markup;
    if (page.kind === 'home') markup = farmMap();
    else if (page.kind === 'place') markup = fieldArt(page.id);
    else if (page.kind === 'event') markup = eventPage(page.id);
    else if (page.kind === 'ask') markup = askPage();
    else if (page.kind === 'answer') markup = answerPage(page.id);
    else if (page.kind === 'log') markup = logPage(false);
    else if (page.kind === 'logMore') markup = logPage(true);
    else markup = memoryPage();
    root.innerHTML = svg(markup, 'paper');
    const incoming = root.querySelector('svg');
    if (previous && incoming) {
      previous.setAttribute('aria-hidden', 'true');
      previous.classList.add('atlas-page-outgoing');
      incoming.classList.add('atlas-page-incoming');
      root.insertBefore(previous, incoming);
      const to = direction === 'backward' ? 'translateX(12%)' : 'translateX(-12%)';
      const from = direction === 'backward' ? 'translateX(-15%)' : 'translateX(15%)';
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 620;
      previous.animate([{ transform:'translateX(0)', opacity:1 }, { transform:to, opacity:.9 }], { duration:duration * .92, easing:'cubic-bezier(.22,.72,.24,1)' });
      const transition = incoming.animate([{ transform:from, opacity:.93 }, { transform:'translateX(0)', opacity:1 }], { duration, easing:'cubic-bezier(.22,.72,.24,1)' });
      transition.finished.then(() => {
        previous.remove();
        incoming.classList.remove('atlas-page-incoming');
        incoming.style.transform = '';
        incoming.style.opacity = '';
        incoming.style.filter = '';
      }).catch(() => {});
    }
    const state = page.kind === 'home' ? 'Farm at a glance · choose a place to look closer' : page.kind === 'place' ? `${places[page.id].name} · choose an event to open its original note` : page.kind === 'event' ? 'Source note · the record and its evidence' : page.kind === 'answer' ? 'Farmhand answer · choose a source to inspect' : page.kind === 'ask' ? 'Choose a question · each answer opens its sources' : page.kind === 'log' ? 'Field journal · select an entry to unfold its source' : 'Farm memory · open the planting and its connected history';
    caption.textContent = page.kind === 'home' ? (window.matchMedia('(max-width:650px)').matches ? 'Swipe the image · tap a place or note' : 'Click a place or note to explore') : state;
    back.disabled = history.length === 0;
  }
  function go(route) {
    const [kind, id] = route.split(':');
    if (kind === 'page') { history.push(page); page = { kind: id }; }
    else { history.push(page); page = { kind, id }; }
    render('forward');
  }
  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-route]');
    if (target) go(target.dataset.route);
  });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target.closest?.('[data-route]');
    if (target) { event.preventDefault(); go(target.dataset.route); }
  });
  back.addEventListener('click', () => { if (history.length) { page = history.pop(); render('backward'); } });
  document.getElementById('flipbook-home').addEventListener('click', () => { history.length = 0; page = { kind: 'home' }; render('backward'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && history.length) { page = history.pop(); render('backward'); } });
  render();
})();
