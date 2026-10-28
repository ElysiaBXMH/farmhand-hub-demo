(() => {
  const RECORDS_KEY = 'farmhand-hub-harvest-records-v1';
  const DRAFT_KEY = 'farmhand-hub-mosa-draft-v1';
  const $ = (id) => document.getElementById(id);
  const fields = $('mosa-field');
  const from = $('mosa-from');
  const through = $('mosa-through');
  const tableWrap = $('mosa-table-wrap');
  const status = $('mosa-status');
  const state = { records: [], rows: [], filters: null, excluded: 0 };
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readRecords = () => { try { const v = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
  const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };
  const saveDraft = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ filters: state.filters, rows: state.rows })); } catch {} };
  const recordLink = (id) => `${location.origin}${location.pathname}#harvest-${encodeURIComponent(id || '')}`;
  const norm = (v) => String(v ?? '').trim();
  const isMissingField = (v) => !norm(v) || /^(needs? (?:follow[- ]?up|location)|unknown|n\/?a|not recorded)$/i.test(norm(v));
  const isISODate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(norm(v)) && !Number.isNaN(Date.parse(`${norm(v)}T00:00:00Z`)) && new Date(`${norm(v)}T00:00:00Z`).toISOString().slice(0,10) === norm(v);
  const harvest = (r) => String(r.activity || '').toLowerCase() === 'harvest';
  const activityText = (r) => `${r.activity || ''} ${r.notes || ''} ${r.sourceExcerpt || ''}`.toLowerCase();
  const isInputUse = (r) => /\b(fertilizer|fertiliser|manure|compost|foliar|pesticide|herbicide|fungicide|spray(?:ed|ing)?|input application|soil amendment)\b/i.test(activityText(r));
  const isPlanting = (r) => /\b(planting|planted|seed(?:ed|ing)?|sow(?:ed|ing)?|transplant(?:ed|ing)?)\b/i.test(activityText(r));
  const isHandling = (r) => /storage|cooler|cold room|buffer|transport|shipment|sales record|\bsold\b|\bsanitiz(?:ed|ing|ation)\b/i.test(activityText(r)) || /\b(cleaning|cleaned)\b/i.test(r.activity || '') || /\bcleaned?\s+(?:equipment|tools|bins|containers|vehicles|transport)/i.test(activityText(r));
  const gaps = (row) => [!norm(row.date) ? 'Date missing' : !isISODate(row.date) ? 'Date must use YYYY-MM-DD' : '', isMissingField(row.field) ? 'Field/location missing' : '', !norm(row.crop) ? 'Crop/subject missing' : '', !norm(row.activity) ? 'Activity missing' : '', harvest(row) && !norm(row.quantity) ? 'Harvest yield/amount missing' : '', harvest(row) && !norm(row.lotReference) ? 'Harvest lot/reference missing' : '', isInputUse(row) && !norm(row.inputDetails) ? 'Input product/material missing' : '', isInputUse(row) && !norm(row.rate) ? 'Input rate/amount missing' : '', !norm(row.notes) ? 'Notes missing' : '', isPlanting(row) && !norm(row.inputDetails) ? 'Seed/planting details missing' : '', isHandling(row) && !norm(row.handling) ? 'Storage/buffer/cleaning/transport details missing' : ''].filter(Boolean);

  function refreshSource() {
    state.records = readRecords();
    const allFields = [...new Set(state.records.map(r => norm(r.field)).filter(f => !isMissingField(f)))].sort((a,b)=>a.localeCompare(b));
    const previous = fields.value;
    fields.innerHTML = '<option value="*">All fields</option>' + allFields.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('') + '<option value="__missing__">Missing field</option>';
    if ([...fields.options].some(o => o.value === previous)) fields.value = previous;
    $('mosa-source-count').textContent = `${state.records.filter(r => r.activity !== 'Correction review').length} confirmed record${state.records.filter(r => r.activity !== 'Correction review').length === 1 ? '' : 's'} available`;
    if (state.rows.length) updateStatus();
  }

  function buildLog(restore = false) {
    refreshSource();
    const f = fields.value, start = from.value, end = through.value;
    if ((start && !isISODate(start)) || (end && !isISODate(end))) { status.textContent = 'Enter dates using YYYY-MM-DD (for example, 2026-10-28).'; status.classList.add('has-gaps'); return; }
    if (start && end && start > end) { status.textContent = 'The start date must be on or before the end date.'; status.classList.add('has-gaps'); return; }
    const previousDraft = restore ? readDraft() : null;
    const saved = previousDraft?.filters && previousDraft.filters.field === f && previousDraft.filters.start === start && previousDraft.filters.end === end ? new Map((previousDraft.rows || []).map(r => [String(r.id), r])) : new Map();
    let excludedCorrections = 0, excludedUndated = 0;
    const candidates = state.records.filter(r => {
      if (String(r.activity || '').toLowerCase() === 'correction review') { excludedCorrections++; return false; }
      if (!r.date) { excludedUndated++; return false; }
      if (f === '__missing__' && !isMissingField(r.field)) return false;
      if (f !== '*' && f !== '__missing__' && norm(r.field) !== f) return false;
      if (start && r.date < start) return false;
      if (end && r.date > end) return false;
      return true;
    }).sort((a,b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));
    state.filters = { field:f, start, end };
    state.excluded = excludedCorrections + excludedUndated;
    state.rows = candidates.map(r => {
      const old = saved.get(String(r.id));
      return { id:r.id, date:r.date || '', field:isMissingField(r.field) ? '' : (r.field || ''), crop:r.crop || '', activity:r.activity || '', quantity:r.quantity || '', unit:r.unit || '', notes:r.notes || '', sourceExcerpt:r.sourceExcerpt || r.notes || '', crew:r.crew || '', inputDetails:r.inputDetails || '', rate:r.rate || '', handling:r.handling || '', lotReference:r.lotId || r.relatedLotId || r.plantingId || '', reviewed:!!old?.reviewed, ...(old ? { date:old.date,field:old.field,crop:old.crop,activity:old.activity,quantity:old.quantity,unit:old.unit,notes:old.notes,inputDetails:old.inputDetails || '',rate:old.rate || '',handling:old.handling || '',lotReference:old.lotReference || r.lotId || r.relatedLotId || r.plantingId || '' } : {}) };
    });
    render();
    if (!state.rows.length) {
      status.textContent = `No confirmed entries match the selected field/date range. ${excludedCorrections} unresolved correction proposal(s) and ${excludedUndated} undated record(s) are excluded.`;
      status.classList.add('has-gaps');
    }
    saveDraft();
  }

  function render() {
    if (!state.rows.length) { tableWrap.innerHTML = '<div class="mosa-generated-empty">No matching work log entries.</div>'; updateCoverage(); updateStatus(); return; }
    tableWrap.innerHTML = `<table class="mosa-table"><thead><tr><th>DATE</th><th>FIELD / LOCATION</th><th>CROP / SUBJECT</th><th>ACTIVITY</th><th>YIELD / QUANTITY</th><th>SEED / INPUT PRODUCT</th><th>RATE / AMOUNT</th><th>LOT / RELATED TRACE</th><th>STORAGE / BUFFER / CLEANING / DESTINATION</th><th>NOTES / MISSING DETAILS</th><th>SOURCE</th><th>REVIEWED</th></tr></thead><tbody>${state.rows.map((r,i) => `<tr class="mosa-row" data-row="${i}"><td><input aria-label="Date (YYYY-MM-DD)" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" title="Enter date as YYYY-MM-DD" data-key="date" value="${escapeHtml(r.date)}" class="${!r.date||!isISODate(r.date)?'mosa-missing-cell':''}"></td><td><input aria-label="Field or location" data-key="field" value="${escapeHtml(r.field)}" class="${!r.field?'mosa-missing-cell':''}"></td><td><input aria-label="Crop or subject" data-key="crop" value="${escapeHtml(r.crop)}" class="${!r.crop?'mosa-missing-cell':''}"></td><td><input aria-label="Activity" data-key="activity" value="${escapeHtml(r.activity)}" class="${!r.activity?'mosa-missing-cell':''}"></td><td><input aria-label="Yield or quantity" data-key="quantity" value="${escapeHtml([r.quantity,r.unit].filter(Boolean).join(' '))}" placeholder="Not recorded" /></td><td><input aria-label="Seed or input product" data-key="inputDetails" value="${escapeHtml(r.inputDetails)}" placeholder="Product, seed, material" /></td><td><input aria-label="Rate or amount applied" data-key="rate" value="${escapeHtml(r.rate)}" placeholder="Rate / amount" /></td><td><input aria-label="Lot or related trace" data-key="lotReference" value="${escapeHtml(r.lotReference)}" placeholder="Lot / planting ID" /></td><td><input aria-label="Storage, buffer, cleaning, or destination detail" data-key="handling" value="${escapeHtml(r.handling)}" placeholder="Location / disposition / action" /></td><td><input class="mosa-notes" aria-label="Notes" data-key="notes" value="${escapeHtml(r.notes)}"><div class="mosa-missing">${gaps(r).map(escapeHtml).join(' · ')}</div></td><td>${r.id ? `<a class="mosa-source" href="#harvest-${encodeURIComponent(r.id)}" title="Open original Farm Work Log entry">Open source ↗</a>` : '<span class="mosa-source-empty">Source link missing</span>'}</td><td><input class="mosa-review-check" type="checkbox" aria-label="Mark row reviewed" ${r.reviewed?'checked':''}></td></tr>`).join('')}</tbody></table>`;
    updateCoverage();
    updateStatus();
  }

  function updateCoverage() {
    const categories = [
      ['Field prep / cultivation', /\b(plow(?:ed|ing)?|soil preparation|till(?:ed|ing)?|cultivat(?:e|ed|ing|ion)|bed preparation)\b/i],
      ['Planting / seed', /\b(planting|planted|seeded|seeding|sowed|sowing|transplant(?:ed|ing)?)\b/i],
      ['Fertility / crop inputs', /\b(fertilizer|fertiliser|manure|compost|foliar|pesticide|herbicide|fungicide|spray(?:ed|ing)?|input application|soil amendment)\b/i],
      ['Harvest / yield', /harvest/],
      ['Crop observations', /\b(observations?|aphids?|pests?|disease|mildew|wilt|quality note|crop health)\b/i],
      ['Buffer harvest / disposition', /\bbuffer\b/i],
      ['Storage / inventory', /\b(storage|cooler|cold room|inventory)\b/i],
      ['Cleaning / transport / sales', /\b(cleaning|cleaned|sanitizing|sanitized|transport|shipment|sales records?|sold)\b/i]
    ];
    const html = categories.map(([label, pattern]) => {
      const count = state.rows.filter(row => pattern.test(activityText(row))).length;
      return `<div class="mosa-coverage-item ${count ? 'has-record' : 'no-record'}"><span>${escapeHtml(label)}</span><strong>${count ? `${count} source record${count === 1 ? '' : 's'}` : 'No source record found'}</strong></div>`;
    }).join('');
    $('mosa-coverage').innerHTML = `<div class="mosa-coverage-heading"><strong>Activity coverage scan</strong><span>Based on selected records · check applicability and source notes</span></div><div class="mosa-coverage-grid">${html}</div>`;
  }

  function updateStatus() {
    const missing = state.rows.reduce((n,r)=>n+gaps(r).length,0);
    const unreviewed = state.rows.filter(r=>!r.reviewed).length;
    const missingQty = state.rows.filter(r=>harvest(r)&&!norm(r.quantity)).length;
    const msg = `${state.rows.length} confirmed record${state.rows.length===1?'':'s'} · ${missing} required detail(s) missing · ${missingQty} harvest quantity(ies) not recorded · ${unreviewed} row(s) not reviewed. ${state.excluded} correction/undated item(s) excluded.`;
    status.textContent = msg;
    status.classList.toggle('has-gaps', missing > 0 || missingQty > 0 || state.excluded > 0);
    $('mosa-review-state').textContent = state.rows.length ? (unreviewed ? `${unreviewed} row(s) still need review.` : 'All rows reviewed; ready to export.') : 'Generate a log to begin review.';
    $('mosa-review-all').disabled = !state.rows.length || !unreviewed;
    $('mosa-csv').disabled = !state.rows.length || !!unreviewed;
    $('mosa-pdf').disabled = !state.rows.length || !!unreviewed;
  }

  tableWrap.addEventListener('input', e => {
    const tr=e.target.closest('[data-row]'); if(!tr) return;
    const row=state.rows[Number(tr.dataset.row)]; const key=e.target.dataset.key; if(!key) return;
    if(key==='quantity') { const m=e.target.value.trim().match(/^([\d.]+)\s*(.*)$/); row.quantity=m?m[1]:e.target.value.trim(); row.unit=m?m[2]:''; }
    else row[key]=e.target.value;
    for(const k of ['date','field','crop','activity']) { const input=tr.querySelector(`[data-key="${k}"]`); if(input) input.classList.toggle('mosa-missing-cell',!norm(row[k])); }
    tr.querySelector('.mosa-missing').textContent = gaps(row).join(' · ') || (harvest(row)&&!row.quantity?'Quantity not recorded':'');
    updateCoverage(); updateStatus(); saveDraft();
  });
  tableWrap.addEventListener('change', e => {
    const tr=e.target.closest('[data-row]'); if(!tr || !e.target.classList.contains('mosa-review-check')) return;
    state.rows[Number(tr.dataset.row)].reviewed=e.target.checked; updateStatus(); saveDraft();
  });
  $('mosa-generate').addEventListener('click',()=>buildLog());
  $('mosa-review-all').addEventListener('click',()=>{state.rows.forEach(r=>r.reviewed=true);render();saveDraft();});

  function csvCell(v) { let s=String(v??''); if(/^[\s]*[=+\-@]/.test(s)) s="'"+s; return `"${s.replace(/"/g,'""')}"`; }
  function download(name, blob) { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.style.display='none'; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1500); }
  $('mosa-csv').addEventListener('click',()=>{
    if(!state.rows.length||state.rows.some(r=>!r.reviewed)) return;
    const headers=['Date','Crop / subject','Activity','Yield / quantity','Unit','Field / location','Seed / input product','Rate / amount applied','Lot / related trace','Storage / buffer / cleaning / destination','Reported by','Notes','Missing information','Source record ID','Source record link','Source excerpt'];
    const rows=state.rows.map(r=>[r.date,r.crop,r.activity,r.quantity,r.unit,r.field,r.inputDetails,r.rate,r.lotReference,r.handling,r.crew,r.notes,gaps(r).join('; '),r.id,recordLink(r.id),r.sourceExcerpt]);
    const text='\ufeff'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    download('mosa-field-activity-log.csv',new Blob([text],{type:'text/csv;charset=utf-8'}));
  });

  function ascii(s) { return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'?'); }
  function pdfEscape(s) { return ascii(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  function wrap(s,width=92) { const words=ascii(s).split(/\s+/); const lines=[]; let line=''; for(const word of words){if((line+' '+word).trim().length>width){lines.push(line);line=word;}else line=(line+' '+word).trim();} lines.push(line); return lines; }
  function makePdf(lines) {
    const perPage=48, pages=[], wrapped=lines.flatMap(line=>wrap(line)); for(let i=0;i<wrapped.length;i+=perPage) pages.push(wrapped.slice(i,i+perPage)); if(!pages.length)pages.push(['No records']);
    const objects=[]; const pageIds=pages.map((_,i)=>3+i*2); const fontId=3+pages.length*2;
    objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
    objects[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
    pages.forEach((linesOnPage,i)=>{const pageId=3+i*2,contentId=pageId+1; let stream='BT\n/F1 10 Tf\n46 750 Td\n14 TL\n'; linesOnPage.forEach((line,j)=>{if(j)stream+='T*\n';stream+=`(${pdfEscape(line)}) Tj\n`;}); stream+='ET'; objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`; objects[contentId]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;});
    objects[fontId]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    let pdf='%PDF-1.4\n%FarmhandHub\n'; const offsets=[0]; for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;} const xref=pdf.length; pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`; for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`; pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`; return new Blob([pdf],{type:'application/pdf'});
  }
  $('mosa-pdf').addEventListener('click',()=>{
    if(!state.rows.length||state.rows.some(r=>!r.reviewed)) return;
    const lines=['MOSA-ALIGNED FIELD ACTIVITY LOG','Farmhand Hub - Willow Creek Farm','Working log for review; not an official MOSA form or certification decision','',`Field filter: ${state.filters?.field==='*'?'All fields':state.filters?.field==='__missing__'?'Missing field':state.filters?.field||'All fields'}`,`Date range: ${state.filters?.start||'Any'} through ${state.filters?.end||'Any'}`,`Generated: ${new Date().toLocaleDateString()}`,''];
    state.rows.forEach((r,i)=>{lines.push(`${i+1}. ${r.date||'DATE MISSING'} | ${r.field||'FIELD MISSING'} | ${r.crop||'SUBJECT MISSING'}`);lines.push(`   Activity: ${r.activity||'MISSING'} | Yield/quantity: ${[r.quantity,r.unit].filter(Boolean).join(' ')||'Not recorded'} | Reported by: ${r.crew||'Not recorded'}`);lines.push(`   Seed/input: ${r.inputDetails||'Not recorded'} | Rate/amount: ${r.rate||'Not recorded'} | Lot/related trace: ${r.lotReference||'Not recorded'}`);lines.push(`   Storage/buffer/cleaning/destination: ${r.handling||'Not recorded'}`);lines.push(`   Notes: ${r.notes||'None recorded'}${gaps(r).length?` | Missing: ${gaps(r).join(', ')}`:''}`);lines.push(`   Source record: ${r.id||'ID missing'} | ${recordLink(r.id)}`);lines.push('');});
    lines.push('Source traceability is preserved by the original Farm Work Log record ID and link.');
    download('mosa-field-activity-log.pdf',makePdf(lines));
  });
  function sourceRecordsChanged() {
    const filters = state.filters;
    refreshSource();
    if (filters) { fields.value = filters.field; from.value = filters.start; through.value = filters.end; buildLog(true); }
  }
  window.addEventListener('farmhand:records-updated',sourceRecordsChanged);
  window.addEventListener('storage',e=>{if(e.key===RECORDS_KEY)sourceRecordsChanged();});
  document.querySelectorAll('.nav-item').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));a.classList.add('active');}));
  refreshSource();
  const saved=readDraft();
  if(saved?.filters){ fields.value=saved.filters.field || '*'; from.value=saved.filters.start||''; through.value=saved.filters.end||''; buildLog(true); }
  else if (state.records.length) buildLog();
})();
