const STORAGE_KEY = 'farmhand-hub-harvest-records-v1';
const LOT_EVENTS_KEY = 'farmhand-hub-lot-events-v1';
const byId = (id) => document.getElementById(id);
const input = byId('update-text');
const form = byId('record-form');
const plantingMemory = [{ id: 'P-104', crop: 'Spring mix', field: 'Bed 8', planted: '2026-09-10', seedRef: 'SM-28', source: 'Fictional planting log · P-104' }];
let records = loadRecords();
let lotEvents = loadLotEvents();
let drafts = [];
let selectedBlock = 'Bed 8';

function loadRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.map((record) => {
      const { sourceText, ...savedRecord } = record;
      return { activity: 'Harvest', crew: '', ...savedRecord };
    }) : [];
  } catch { return []; }
}

function sourceKey(record) {
  const source = String(record.sourceExcerpt || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!source) return '';
  return [record.date, record.activity, record.crop, record.quantity, record.unit, record.field, source]
    .map((value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')).join('|');
}

function uniqueSourceRecords(items) {
  const seen = new Set();
  return items.filter((record) => {
    const key = sourceKey(record);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function loadLotEvents() {
  try { const value = JSON.parse(localStorage.getItem(LOT_EVENTS_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  localStorage.setItem(LOT_EVENTS_KEY, JSON.stringify(lotEvents));
  window.dispatchEvent(new CustomEvent('farmhand:records-updated'));
  renderRecords();
  renderTwin();
}

function setTodayLabel() {
  byId('today-label').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  byId('twin-date').textContent = `UPDATED ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date()).toUpperCase()}`;
}

function explicitDate(note) {
  const matches = [...note.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((match) => match[1]);
  const uniqueDates = [...new Set(matches)];
  return uniqueDates.length === 1 ? uniqueDates[0] : '';
}

function localIsoDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function matchPlanting(crop, field) {
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return plantingMemory.find((planting) => normalize(planting.crop) === normalize(crop) && (!field || normalize(planting.field) === normalize(field)));
}

function extractNote(note) {
  const explicitDates = [...new Set([...note.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((match) => match[1]))];
  const relativeToday = explicitDates.length === 0 && /\btoday\b/i.test(note);
  const sharedDate = explicitDates.length === 1 ? explicitDates[0] : relativeToday ? localIsoDate() : '';
  const lines = note.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const extracted = [];
  const units = 'crates?|bins?|boxes|bushels?|pounds?|lbs?\.?|kilograms?|kgs?|tons?|buckets?|bunches?|bags?|cases?|pieces?|units?';

  for (const line of lines) {
    const measures = [...line.matchAll(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*(${units})\\b`, 'gi'))];
    const cleanLine = line.replace(/^[^:—]{1,32}(?:\s+·[^:]*)?:\s*/, '').trim();
    const speakerMatch = line.match(/^([^:—·]{1,28})(?:\s*·\s*[^:]*)?:\s*/);
    const speaker = speakerMatch ? speakerMatch[1].trim() : '';
    const fieldMatch = cleanLine.match(/\b(?:from|in|at|near|around|beside|by|for)\s+(?:the\s+)?((?:bed|plot|row|block)\s+\d+|[a-z0-9][a-z0-9' -]{1,34}?\s+(?:field|block|plot|orchard|greenhouse|tunnel|house|bed|paddock)\b)/i);
    const field = fieldMatch ? titleCase(fieldMatch[1].trim()) : '';
    const activity = classifyActivity(cleanLine, measures.length > 0);
    if (!measures.length && !activity) continue;
    if (!measures.length && activity === 'Harvest') continue;
    if (activity === 'Correction review') {
      const knownCrop = plantingMemory.find((item) => cleanLine.toLowerCase().includes(item.crop.toLowerCase()));
      const cropMention = cleanLine.match(/\b(tomatoes|cucumbers|apples|basil|spring mix)\b/i);
      const suggested = measures[measures.length - 1];
      extracted.push({ date: explicitDates.length > 1 ? explicitDate(cleanLine) : sharedDate, dateRelative: relativeToday && !explicitDate(cleanLine), dateConfirmed: false, crop: knownCrop?.crop || (cropMention ? titleCase(cropMention[1]) : 'Record correction'), quantity: suggested?.[1] || '', unit: suggested?.[2] || '', field, activity, crew: speaker, notes: cleanLine, source: line, plantingId: knownCrop?.id || '', sourceText: note });
      continue;
    }
    const cropFromVerb = cleanLine.match(new RegExp(`\\b(?:harvested|picked|gathered|collected)\\s+(?:\\d+(?:\\.\\d+)?\\s+(?:${units})\\s+of\\s+)?([a-z][a-z -]{1,24}?)(?=\\s+(?:from|in|at|on|with|because|but|this|today|yesterday|to|after|near|where|and\\s+the|the\\s+crew|\\d)|[,.;]|$)`, 'i'));
    let crop = cropFromVerb ? titleCase(cropFromVerb[1].trim()) : '';
    if (!crop && activity === 'Planting') {
      const plantingCrop = cleanLine.match(/\b(?:planted|transplanted|seeded|sowed)\s+([a-z][a-z -]{1,24}?)(?=\s+(?:in|at|from|on|this|today|yesterday)|[,.;]|$)/i);
      crop = plantingCrop ? titleCase(plantingCrop[1].trim()) : '';
    }
    if (!crop && measures.length) {
      const afterOf = cleanLine.match(new RegExp(`\\b${escapeRegExp(measures[0][0])}\\s+of\\s+([a-z][a-z -]{1,24}?)(?=\\s+(?:from|in|at|on|with|because|but|this|today|yesterday|after|near|where|and|the\\s+crew|\\d)|[,.;]|$)`, 'i'));
      if (afterOf) crop = titleCase(afterOf[1].trim());
    }
    if (!crop) {
      const cropMention = cleanLine.match(/\b(tomatoes|cucumbers|apples|basil|spring mix)\b/i);
      crop = cropMention ? titleCase(cropMention[1]) : '';
    }
    const date = explicitDates.length > 1 ? explicitDate(cleanLine) : sharedDate;
    const notes = cleanLine.replace(/^confirmed:\s*/i, '').trim();

    if (!measures.length) {
      const planting = matchPlanting(crop, field);
      extracted.push({ date, dateRelative: relativeToday && !explicitDate(cleanLine), dateConfirmed: false, crop: crop || eventSubject(cleanLine, activity), quantity: '', unit: '', field, activity, crew: speaker, notes, source: line, plantingId: planting?.id || '', sourceText: note });
      continue;
    }

    for (const measure of measures) {
      let entryCrop = crop;
      const matchAfterMeasure = cleanLine.match(new RegExp(`\\b${escapeRegExp(measure[0])}\\s+of\\s+([a-z][a-z -]{1,24}?)(?=\\s+(?:from|in|at|on|with|because|but|this|today|yesterday|after|near|where|and|the\\s+crew|\\d)|[,.;]|$)`, 'i'));
      if (matchAfterMeasure) entryCrop = titleCase(matchAfterMeasure[1].trim());
      const planting = matchPlanting(entryCrop, field);
      extracted.push({ date, dateRelative: relativeToday && !explicitDate(cleanLine), dateConfirmed: false, crop: entryCrop, quantity: measure[1], unit: measure[2], field, activity, crew: speaker, notes, source: line, plantingId: planting?.id || '', sourceText: note });
    }
  }
  return extracted;
}

function classifyActivity(line, hasMeasure) {
  if (/\b(correct|correction|reweigh(?:ed)?|recount(?:ed)?|revised total)\b/i.test(line)) return 'Correction review';
  if (/\b(harvested|picked|gathered|collected)\b/i.test(line)) return 'Harvest';
  if (/\b(irrigat|water(?:ed|ing)?|drip line|pump|valve|pressure)\b/i.test(line)) return 'Irrigation check';
  if (/\b(pest|insect|aphids?|blight|mildew|rot|leaf spot|disease|spray|yellowing|wilt)\b/i.test(line)) return 'Crop health';
  if (/\b(soft fruit|soft|windfall|bruised|quality|grade|spoiled|damaged)\b/i.test(line)) return 'Quality note';
  if (/\b(cooler|refrigerat|temperature|cold room|cold storage)\b/i.test(line)) return 'Storage check';
  if (/\b(repair|fixed|tightened|broken|cracked|equipment|tractor|cart|tool)\b/i.test(line)) return 'Equipment';
  if (/\b(planted|transplanted|seeded|sowed)\b/i.test(line)) return 'Planting';
  return hasMeasure ? 'Harvest' : '';
}

function eventSubject(line, activity) {
  if (activity === 'Irrigation check') return 'Irrigation';
  if (activity === 'Crop health') return 'Crop health';
  if (activity === 'Quality note') return 'Product quality';
  if (activity === 'Storage check') return 'Storage';
  if (activity === 'Equipment') return 'Equipment';
  if (activity === 'Planting') return 'Planting';
  return 'Farm update';
}

function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function titleCase(value) { return value.replace(/\b[a-z]/g, (char) => char.toUpperCase()); }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }

function updateDraftStatus() {
  const isIncomplete = (draft) => !draft.date || (draft.activity === 'Harvest' && ['crop', 'quantity', 'unit'].some((key) => !String(draft[key] || '').trim())) || (draft.dateRelative && !draft.dateConfirmed) || (draft.activity === 'Harvest' && !draft.field) || draft.activity === 'Correction review';
  const incomplete = drafts.some(isIncomplete);
  byId('review-alert').classList.toggle('hidden', !incomplete);
  const readyCount = drafts.length - drafts.filter(isIncomplete).length;
  byId('draft-summary').textContent = `${drafts.length} ${drafts.length === 1 ? 'entry' : 'entries'} found · ${readyCount} ready for review`;
}

function renderDrafts() {
  byId('draft-records').innerHTML = drafts.map((draft, index) => `<article class="draft-card" data-draft="${index}">
    <div class="draft-card-heading"><span class="draft-index">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(draft.crop || (draft.activity === 'Harvest' ? 'Harvest entry needs review' : draft.activity))}</strong><button class="remove-draft" type="button" data-remove-draft="${index}" aria-label="Remove draft ${index + 1}">×</button></div>
    <div class="draft-grid">
      ${draftField(index, 'date', 'DATE *', 'date', draft.date)}
      ${draftField(index, 'crop', draft.activity === 'Harvest' ? 'CROP *' : 'CROP / SUBJECT', 'text', draft.crop, 'e.g. Tomatoes')}
      ${draft.activity === 'Harvest' ? draftField(index, 'quantity', 'AMOUNT *', 'number', draft.quantity, 'e.g. 42') : '<div class="event-amount-placeholder"><span>EVENT TYPE</span><strong>'+escapeHtml(draft.activity)+'</strong></div>'}
      ${draft.activity === 'Harvest' ? draftField(index, 'unit', 'UNIT *', 'text', draft.unit, 'e.g. crates') : ''}
      ${draftField(index, 'field', draft.activity === 'Harvest' ? 'FIELD / BLOCK *' : 'FIELD / BLOCK', 'text', draft.field, 'e.g. North Field')}
      ${draftField(index, 'activity', 'ACTIVITY', 'text', draft.activity, 'e.g. Harvest')}
      ${draftField(index, 'crew', 'REPORTED BY', 'text', draft.crew, 'Crew member')}
      <label class="draft-field draft-notes"><span>FIELD NOTE</span><textarea data-draft-index="${index}" data-draft-key="notes" rows="2">${escapeHtml(draft.notes)}</textarea></label>
    </div>
    ${draft.dateRelative ? `<label class="relative-date-confirm"><input type="checkbox" data-draft-index="${index}" data-draft-key="dateConfirmed" required ${draft.dateConfirmed ? 'checked' : ''}><span>Confirm “today” as ${escapeHtml(formatDate(draft.date))}. This date is based on when the note is reviewed.</span></label>` : ''}
    ${draft.activity !== 'Harvest' ? `<div class="event-source-note">${draft.activity === 'Correction review' && draft.quantity ? `Suggested correction: ${escapeHtml(draft.quantity)} ${escapeHtml(draft.unit)}. Not applied automatically; use “Correct” on the saved harvest row.` : 'Farm event · captured as an operational note; it will not change inventory or certification records.'}</div>` : ''}
    ${draft.plantingId ? `<div class="planting-match"><span>↳</span><span>Possible planting match: <a href="#planting-p104">${escapeHtml(draft.plantingId)} · ${escapeHtml(plantingMemory.find((item) => item.id === draft.plantingId)?.crop)} · ${escapeHtml(plantingMemory.find((item) => item.id === draft.plantingId)?.field)}</a></span></div>` : ''}
  </article>`).join('');
  updateDraftStatus();
}

function draftField(index, key, label, type, value, placeholder = '') {
  const required = key === 'date' || (drafts[index]?.activity === 'Harvest' && ['crop', 'quantity', 'unit'].includes(key)) ? 'required' : '';
  const min = type === 'number' ? 'min="0" step="any"' : '';
  return `<label class="draft-field"><span>${label}</span><input type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" data-draft-index="${index}" data-draft-key="${key}" ${required} ${min}></label>`;
}

function prepareReview(entries) {
  drafts = entries.map((entry) => ({ ...entry }));
  byId('review-state').classList.add('hidden');
  form.classList.remove('hidden');
  byId('extract-notice').classList.add('hidden');
  renderDrafts();
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 2600);
}

function formatDate(value) {
  if (!value) return 'Date missing';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

function renderRecords() {
  const query = byId('search-input').value.trim().toLowerCase();
  const found = records.filter((record) => [record.crop, record.field, record.date, record.notes, record.crew, record.activity].join(' ').toLowerCase().includes(query));
  byId('record-count').textContent = records.length;
  byId('nav-count').textContent = records.length;
  if (!found.length) {
    byId('records-wrap').innerHTML = `<div class="records-empty">${records.length ? 'No work log entries match your search.' : 'No work log entries yet. Confirm a reviewed batch above to start your farm history.'}</div>`;
    return;
  }
  byId('records-wrap').innerHTML = `<div class="log-table-scroll"><table class="log-table"><thead><tr><th>DATE</th><th>EVENT</th><th>CROP / SUBJECT</th><th>AMOUNT</th><th>FIELD / BLOCK</th><th>TRACE</th><th>REPORTED BY</th><th>SOURCE</th><th>ACTIONS</th><th></th></tr></thead><tbody>${found.map((record) => { const planting = plantingMemory.find((item) => item.id === record.plantingId); return `<tr id="harvest-${escapeHtml(record.id)}"><td class="date-cell">${escapeHtml(formatDate(record.date))}${record.dateWasRelative ? '<small class="date-basis">Confirmed from “today”</small>' : ''}</td><td><span class="activity-chip">${escapeHtml(record.activity || 'Harvest')}</span>${record.status ? `<small class="followup-badge">${escapeHtml(record.status)}</small>` : ''}</td><td><span class="crop-chip"><span>✿</span>${escapeHtml(record.crop || '—')}</span></td><td class="amount-cell">${record.quantity ? `${escapeHtml(record.quantity)} ${escapeHtml(record.unit)}` : '—'}</td><td>${escapeHtml(record.field || 'Needs location')}</td><td>${planting ? `<a class="source-link" href="#planting-p104">${escapeHtml(planting.id)} · ${escapeHtml(planting.seedRef)}</a>` : record.lotId ? `<span class="lot-id-chip">${escapeHtml(record.lotId)}</span>` : '—'}</td><td>${escapeHtml(record.crew || '—')}</td><td class="note-cell"><details class="source-details"><summary>${escapeHtml(record.notes || 'View source')}</summary><div class="source-quote">${escapeHtml(record.sourceExcerpt || record.notes)}</div>${record.history?.length ? `<details><summary>Revision history (${record.history.length})</summary>${record.history.map((item) => `<div class="history-item">${escapeHtml(item.at)} · ${escapeHtml(item.before)} → ${escapeHtml(item.after)}<br>${escapeHtml(item.reason)}</div>`).join('')}</details>` : ''}</details></td><td><button class="form-button" type="button" data-lot="${escapeHtml(record.id)}">${record.activity === 'Harvest' ? 'Trace lot' : 'Details'}</button>${record.activity === 'Harvest' ? `<button class="form-button correction-button" type="button" data-correct="${escapeHtml(record.id)}">Correct</button>` : ''}</td><td><button class="delete-button" type="button" aria-label="Delete ${escapeHtml(record.crop)} record" data-delete="${escapeHtml(record.id)}">×</button></td></tr>`; }).join('')}</tbody></table></div>`;
}

function renderTwin() {
  const blockRecords = records.filter((record) => String(record.field || '').toLowerCase() === selectedBlock.toLowerCase()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const planting = plantingMemory.find((item) => item.field.toLowerCase() === selectedBlock.toLowerCase());
  const tile = document.querySelector(`.map-block[data-block="${CSS.escape(selectedBlock)}"]`);
  document.querySelectorAll('.map-block').forEach((item) => item.classList.toggle('selected', item === tile));
  document.querySelectorAll('.map-block').forEach((item) => {
    const field = item.dataset.block;
    const entries = records.filter((record) => String(record.field || '').toLowerCase() === field.toLowerCase());
    if (!entries.length) return;
    const hasIssue = entries.some((record) => !['Harvest', 'Planting'].includes(record.activity));
    const status = item.querySelector('.block-status');
    status.className = `block-status ${hasIssue ? 'status-watch' : 'status-harvest'}`;
    status.textContent = hasIssue ? '● REVIEW' : '● ACTIVE';
    item.querySelector('small').textContent = `${entries.length} saved event${entries.length === 1 ? '' : 's'} · ${entries[0].crop || entries[0].activity}`;
  });
  byId('inspector-title').textContent = selectedBlock;
  byId('inspector-subtitle').textContent = planting ? `${planting.crop} · active planting` : blockRecords[0]?.crop ? `${blockRecords[0].crop} · latest activity` : 'No crop linked yet';
  byId('inspector-planted').textContent = planting ? formatDate(planting.planted) : 'No planting record';
  byId('inspector-seed').textContent = planting?.seedRef || 'Not recorded';
  const linkedId = planting?.id || blockRecords.find((record) => record.plantingId)?.plantingId;
  document.querySelector('.inspector-badge').textContent = planting ? planting.id : linkedId || `${blockRecords.length} EVENTS`;
  const timeline = [];
  if (planting) timeline.push({ date: planting.planted, title: `${planting.crop} direct-sown`, detail: `${planting.id} · seed ${planting.seedRef}`, href: '#planting-p104' });
  blockRecords.forEach((record) => timeline.push({ date: record.date, title: `${record.activity}: ${record.crop || 'farm event'}${record.quantity ? ` · ${record.quantity} ${record.unit}` : ''}`, detail: record.sourceExcerpt || record.notes || 'Confirmed farm update', href: `#harvest-${record.id}` }));
  timeline.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  byId('block-timeline').innerHTML = timeline.length ? timeline.slice(0, 5).map((item) => `<a class="timeline-event" href="${escapeHtml(item.href)}"><i></i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(formatDate(item.date))} · ${escapeHtml(item.detail)}</small></span></a>`).join('') : '<p class="timeline-empty">No confirmed events yet. Add a field update to start this block’s operational history.</p>';
  byId('inspect-log').onclick = () => { byId('search-input').value = selectedBlock; renderRecords(); byId('records').scrollIntoView({ behavior: 'smooth' }); };
}

function answerOperationsQuestion(rawQuestion) {
  const question = rawQuestion.trim().toLowerCase();
  const answer = byId('ops-answer');
  if (!question) { answer.innerHTML = '<span class="memory-spark">?</span><div><strong>Type a question first.</strong><p>Or choose one of the example questions above.</p></div>'; return; }
  const location = [...plantingMemory.map((item) => item.field), ...records.map((record) => record.field).filter(Boolean)].find((field) => question.includes(field.toLowerCase()));
  const crop = [...plantingMemory.map((item) => item.crop), ...records.map((record) => record.crop).filter(Boolean)].find((name) => question.includes(name.toLowerCase()));
  if (/attention|issue|problem|follow.?up|open|fix|repair/.test(question)) {
    const issues = uniqueSourceRecords(records.filter((record) => record.status === 'Needs follow-up' || (record.activity !== 'Harvest' && record.activity !== 'Planting')));
    if (!issues.length) { answer.innerHTML = '<span class="memory-spark">✓</span><div><strong>No operational issues are recorded in the saved updates.</strong><p>This means none were reported here; it does not confirm conditions in the field. Source: local farm work log.</p><a href="#records">Open farm work log ↗</a></div>'; return; }
    answer.innerHTML = `<span class="memory-spark">!</span><div><strong>${issues.length} operational update${issues.length === 1 ? '' : 's'} to review</strong><p>${issues.map((record) => `${escapeHtml(record.activity)}${record.field ? ` at ${escapeHtml(record.field)}` : ' · location not specified'}: “${escapeHtml(record.sourceExcerpt || record.notes)}”`).join('<br>')}</p>${issues.map((record) => `<a href="#harvest-${escapeHtml(record.id)}">Open ${escapeHtml(record.activity)} source ↗</a>`).join(' · ')}</div>`;
    return;
  }
  if (/weather|forecast|rain tomorrow|predict|recommend|should we|what should|when should|will it/.test(question)) {
    answer.innerHTML = '<span class="memory-spark">?</span><div><strong>I don’t have live weather, sensor readings, or enough verified information to recommend a next action.</strong><p>I can summarize recorded events and show their sources; planning and forecasts are not connected in this demo.</p></div>';
    return;
  }
  if (!location && !crop && !/harvest|yield|planted|planting|work log|activity|happened|updates|farm/.test(question)) {
    answer.innerHTML = '<span class="memory-spark">?</span><div><strong>I couldn’t match that question to the farm records.</strong><p>Try asking about a known crop or block, such as “What happened in Bed 8?” I won’t guess beyond saved sources.</p></div>';
    return;
  }
  const selectedRecords = uniqueSourceRecords(records.filter((record) => (!location || String(record.field).toLowerCase() === location.toLowerCase()) && (!crop || String(record.crop).toLowerCase() === crop.toLowerCase())));
  const planted = plantingMemory.filter((item) => (!location || item.field.toLowerCase() === location.toLowerCase()) && (!crop || item.crop.toLowerCase() === crop.toLowerCase()));
  if (!selectedRecords.length && !planted.length) {
    answer.innerHTML = '<span class="memory-spark">?</span><div><strong>I couldn’t find a matching farm record.</strong><p>I won’t guess. Try a known crop or block, or add a source update first.</p></div>';
    return;
  }
  const harvested = selectedRecords.filter((record) => record.activity === 'Harvest');
  const totalsByUnit = Object.groupBy ? Object.groupBy(harvested, (record) => record.unit || 'units') : harvested.reduce((groups, record) => { const unit = record.unit || 'units'; (groups[unit] ||= []).push(record); return groups; }, {});
  const harvestSummary = Object.entries(totalsByUnit).map(([unit, entries]) => `${entries.reduce((sum, record) => sum + (Number(record.quantity) || 0), 0)} ${unit} recorded across ${entries.length} harvest update${entries.length === 1 ? '' : 's'}`);
  const correctionSummary = selectedRecords.filter((record) => record.activity === 'Correction review' && record.quantity).map((record) => `Pending correction proposal: ${record.quantity} ${record.unit} for ${record.crop}${record.field ? ` at ${record.field}` : ''}; it has not been applied to the recorded harvest. Confirm which saved harvest entry it refers to before using a revised total`);
  const summary = [planted.map((item) => `${item.crop} planted ${formatDate(item.planted)} in ${item.field} (${item.id}, seed ${item.seedRef})`), harvestSummary, correctionSummary, selectedRecords.filter((record) => record.activity !== 'Harvest' && record.activity !== 'Correction review').map((record) => `${record.activity}${record.field ? ` at ${record.field}` : ''}: ${record.notes}`)].flat().filter(Boolean).join('. ');
  const source = selectedRecords.length ? selectedRecords.slice(0, 4).map((record) => `<a href="#harvest-${escapeHtml(record.id)}">${escapeHtml(record.activity)} source ↗</a>`).join(' · ') : '<a href="#planting-p104">Open planting source ↗</a>';
  answer.innerHTML = `<span class="memory-spark">✦</span><div><strong>${escapeHtml(summary)}.</strong><p>Based on saved farm records. No current sensor, weather, or live iMessage data is connected.</p>${source}</div>`;
}

document.querySelectorAll('.map-block').forEach((button) => button.addEventListener('click', () => { selectedBlock = button.dataset.block; renderTwin(); }));
document.querySelectorAll('[data-question]').forEach((button) => button.addEventListener('click', () => { byId('ops-question').value = button.dataset.question; answerOperationsQuestion(button.dataset.question); }));
byId('ask-ops').addEventListener('click', () => answerOperationsQuestion(byId('ops-question').value));
byId('ops-question').addEventListener('keydown', (event) => { if (event.key === 'Enter') byId('ask-ops').click(); });

byId('sample-button').addEventListener('click', () => {
  input.value = `iMessage · Willow Creek harvest crew · Daily field report for 2026-10-27

Maya: The west irrigation line in North Field is still dripping near the valve. Please keep the muddy corner clear.
Luis: I checked the pump at North Field and tightened the west line. Pressure is back to normal; the cracked valve tag still needs repair after harvest.
Rosa: I saw aphids on cucumber leaves in South Tunnel; please check the crop before the next pick.
Maya: We harvested 42 crates of tomatoes from North Field. Some fruit was soft, so we kept those crates separate for the kitchen.
Rosa: We harvested 18 boxes of cucumbers from South Tunnel. The fruit is clean, but the last row was smaller after the irrigation hiccup.
Luis: We gathered 9 bins of apples from East Orchard. One bin is windfall fruit and must stay separate from fresh-market apples.
Maya: We picked 6 buckets of basil, but I forgot which bed. Please leave the location blank and flag it for me instead of guessing.
Rosa: We set aside 2 crates of tomatoes from North Field for the kitchen because that fruit was soft.
Maya: We harvested 24 pounds of spring mix from Bed 8 today.
Luis: I packed the Bed 8 spring mix in a labeled bin and moved the harvest lot from Bed 8 to the cooler. Please add the cooler move to its lot trace.
Luis: The cart wheel at the North Field shed is cracked and needs repair before packing.
Maya: Correction for Bed 8: we had logged 24 pounds, but after reweighing the spring mix total should be 22 pounds. Please flag the harvest row for correction; the scale was re-zeroed.`;
  input.focus();
});

byId('target-demo-button').addEventListener('click', () => {
  input.value = 'Harvested 24 pounds of spring mix from Bed 8 today.';
  input.focus();
});

byId('extract-button').addEventListener('click', () => {
  const note = input.value.trim();
  if (!note) {
    byId('extract-notice').textContent = 'Add a field update first.';
    byId('extract-notice').classList.remove('hidden');
    input.focus();
    return;
  }
  let entries;
  try { entries = extractNote(note); }
  catch (error) {
    console.error('Could not organize field update', error);
    byId('extract-notice').textContent = 'I hit a problem while organizing that update. Your original text is still here; please try again.';
    byId('extract-notice').classList.remove('hidden');
    return;
  }
  if (!entries.length) {
    byId('extract-notice').textContent = 'No harvest or operational event could be confidently identified. Add a clear field update and review the draft before saving.';
    byId('extract-notice').classList.remove('hidden');
    return;
  }
  prepareReview(entries);
});

form.addEventListener('input', (event) => {
  const target = event.target.closest('[data-draft-index][data-draft-key]');
  if (!target) return;
  const index = Number(target.dataset.draftIndex);
  const key = target.dataset.draftKey;
  drafts[index][key] = target.type === 'checkbox' ? target.checked : target.value;
  if (key === 'crop') {
    const title = target.closest('.draft-card').querySelector('.draft-card-heading strong');
    title.textContent = target.value || 'Harvest entry needs review';
  }
  updateDraftStatus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const newRecords = drafts.map((draft) => ({
    id: crypto.randomUUID(), date: draft.date, dateWasRelative: draft.dateRelative, crop: draft.crop.trim(), quantity: draft.quantity,
    unit: draft.unit.trim(), field: draft.field.trim(), activity: draft.activity || 'Harvest',
    crew: draft.crew.trim(), notes: draft.notes.trim(), sourceExcerpt: draft.source,
    plantingId: draft.plantingId, lotId: draft.activity === 'Harvest' ? `WH-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` : '', history: [], status: draft.activity === 'Correction review' || (draft.activity === 'Harvest' && !draft.field) ? 'Needs follow-up' : '', savedAt: new Date().toISOString(),
  }));
  const existingSources = new Set(records.map(sourceKey).filter(Boolean));
  const uniqueRecords = newRecords.filter((record) => {
    const key = sourceKey(record);
    if (!key || !existingSources.has(key)) {
      if (key) existingSources.add(key);
      return true;
    }
    return false;
  });
  const duplicateCount = newRecords.length - uniqueRecords.length;
  if (!uniqueRecords.length) {
    showToast('These source messages are already in the work log; no duplicate records were added.');
    return;
  }
  uniqueRecords.filter((record) => ['Quality note', 'Storage check'].includes(record.activity)).forEach((event) => {
    const harvest = [...uniqueRecords, ...records].find((record) => record.activity === 'Harvest' && record.field.toLowerCase() === event.field.toLowerCase() && record.crop.toLowerCase() === event.crop.toLowerCase());
    if (!harvest) return;
    event.relatedLotId = harvest.lotId;
    lotEvents.push({ id: crypto.randomUUID(), recordId: harvest.id, kind: event.activity, note: event.notes, at: event.savedAt, sourceRecordId: event.id });
  });
  records = [...uniqueRecords, ...records];
  persist();
  drafts = [];
  form.reset();
  form.classList.add('hidden');
  byId('draft-records').replaceChildren();
  byId('review-state').classList.remove('hidden');
  byId('review-state').querySelector('strong').textContent = `${uniqueRecords.length} work log ${uniqueRecords.length === 1 ? 'entry' : 'entries'} saved`;
  byId('review-state').querySelector('p').textContent = duplicateCount ? `${duplicateCount} repeated source message${duplicateCount === 1 ? '' : 's'} skipped. Your confirmed entries are in the farm work log below.` : 'Your confirmed entries are in the farm work log below.';
  showToast(`${newRecords.length} work log ${newRecords.length === 1 ? 'entry' : 'entries'} saved on this device`);
  document.querySelector('#records').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

byId('draft-records').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-draft]');
  if (!button) return;
  drafts.splice(Number(button.dataset.removeDraft), 1);
  if (!drafts.length) {
    form.classList.add('hidden');
    byId('review-state').classList.remove('hidden');
  } else renderDrafts();
});

byId('search-input').addEventListener('input', renderRecords);
byId('records-wrap').addEventListener('click', (event) => {
  const lotButton = event.target.closest('[data-lot]');
  if (lotButton) {
    const record = records.find((item) => item.id === lotButton.dataset.lot);
    if (record) showLotPreview(record);
    return;
  }
  const correctButton = event.target.closest('[data-correct]');
  if (correctButton) {
    const record = records.find((item) => item.id === correctButton.dataset.correct);
    if (!record) return;
    const next = window.prompt(`Correct amount for ${record.crop} (${record.unit})`, record.quantity);
    if (next === null || !next.trim() || !Number.isFinite(Number(next)) || Number(next) < 0 || next.trim() === String(record.quantity)) { if (next !== null) showToast('Enter a valid non-negative amount to correct this record.'); return; }
    const reason = window.prompt('Why is this record being corrected? (required)');
    if (!reason?.trim()) { showToast('Correction not saved; add a reason to preserve the audit trail.'); return; }
    record.history = [...(record.history || []), { at: new Date().toLocaleString(), before: `${record.quantity} ${record.unit}`, after: `${next.trim()} ${record.unit}`, reason: reason.trim() }];
    record.quantity = next.trim();
    record.correctedAt = new Date().toISOString();
    persist();
    showToast('Correction saved with its previous value and reason');
    return;
  }
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  records = records.filter((record) => record.id !== button.dataset.delete);
  persist();
  showToast('Work log entry removed');
});

byId('ask-memory').addEventListener('click', () => {
  const question = byId('memory-question').value.trim().toLowerCase();
  const answer = byId('memory-answer');
  const searchRecord = records.find((record) => {
    const location = String(record.field || '').toLowerCase();
    const crop = String(record.crop || '').toLowerCase();
    const locationMatch = location && question.includes(location);
    const cropMatch = crop && question.includes(crop);
    return locationMatch || cropMatch;
  });
  const asksHarvest = /harvest|picked|pick|yield|how much|amount|crop/.test(question);
  const record = asksHarvest ? searchRecord : null;
  if (record) {
    const source = record.sourceExcerpt || record.notes || 'Source message not available.';
    const planting = plantingMemory.find((item) => item.id === record.plantingId);
    answer.innerHTML = `<span class="memory-spark">✦</span><div><strong>${escapeHtml(record.quantity)} ${escapeHtml(record.unit)} of ${escapeHtml(record.crop)} recorded for ${escapeHtml(record.field)} on ${escapeHtml(formatDate(record.date))}.</strong><p>${planting ? `Linked planting: ${escapeHtml(planting.id)} · seed ${escapeHtml(planting.seedRef)}. ` : ''}Source message: “${escapeHtml(source)}”</p><a href="#harvest-${escapeHtml(record.id)}">Open work-log entry ↗</a></div>`;
    return;
  }
  const planting = plantingMemory.find((item) => question.includes('bed 8') || question.includes('spring mix'));
  if (!planting) {
    answer.innerHTML = '<span class="memory-spark">?</span><p>No matching sample source found. Check the crop or bed name, or add a source to farm memory.</p>';
    return;
  }
  answer.innerHTML = `<span class="memory-spark">✦</span><div><strong>${escapeHtml(planting.crop)} was planted in ${escapeHtml(planting.field)}.</strong><p>Planting date: ${escapeHtml(formatDate(planting.planted))}. Seed reference: ${escapeHtml(planting.seedRef)}.</p><a href="#planting-p104">Source: ${escapeHtml(planting.source)} ↗</a></div>`;
});

byId('memory-question').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') byId('ask-memory').click();
});

function showLotPreview(record) {
  const planting = plantingMemory.find((item) => item.id === record.plantingId);
  const events = lotEvents.filter((item) => item.recordId === record.id);
  const isHarvest = record.activity === 'Harvest';
  byId('lot-dialog-title').textContent = isHarvest ? 'Harvest lot trace' : 'Farm event details';
  const values = [
    ['Harvest lot', record.lotId || record.id.slice(0, 8).toUpperCase()], ['Harvest date', formatDate(record.date)],
    ['Crop', record.crop], ['Quantity', `${record.quantity} ${record.unit}`], ['Field / bed', record.field],
    ['Activity', record.activity || 'Harvest'], ['Reported by', record.crew || 'Not recorded'],
    ['Planting reference', planting ? `${planting.id} · planted ${formatDate(planting.planted)} · seed ${planting.seedRef}` : 'No linked planting source'],
    ['Source update', record.sourceExcerpt || record.notes || 'Source note unavailable'],
  ];
  byId('lot-preview').innerHTML = `${isHarvest ? `<div class="trace-heading"><span>TRACEABILITY PATH</span><strong>${planting ? `${escapeHtml(planting.id)} → ${escapeHtml(record.lotId || 'Harvest lot')}` : `Harvest lot ${escapeHtml(record.lotId || '')}`}</strong></div>` : ''}<dl class="lot-grid">${values.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${isHarvest ? `<section class="lot-events"><div class="lot-events-heading"><h3>After harvest</h3><span>${events.length} handling events</span></div>${events.length ? events.map((item) => `<div class="lot-event-row"><i></i><span><strong>${escapeHtml(item.kind)}</strong><small>${escapeHtml(item.note)} · ${escapeHtml(new Date(item.at).toLocaleString())}</small></span></div>`).join('') : '<p class="timeline-empty">No post-harvest handling has been recorded for this lot.</p>'}<form class="lot-event-form" id="lot-event-form" data-record-id="${escapeHtml(record.id)}"><label><span>ADD A TRACE EVENT</span><select name="kind"><option>Quality check</option><option>Packed</option><option>Moved to cooler</option><option>Sold / delivered</option><option>Other handling</option></select></label><input name="note" placeholder="e.g. 2 crates set aside for kitchen" required><button class="form-button" type="submit">Add to lot</button></form></section>` : ''}<p class="template-caution">This is a local demo worksheet, not an official certification record or compliance determination.</p>`;
  if (!byId('lot-dialog').open) byId('lot-dialog').showModal();
}

byId('lot-preview').addEventListener('submit', (event) => {
  if (event.target.id !== 'lot-event-form') return;
  event.preventDefault();
  const data = new FormData(event.target);
  const note = String(data.get('note') || '').trim();
  if (!note) return;
  lotEvents.push({ id: crypto.randomUUID(), recordId: event.target.dataset.recordId, kind: String(data.get('kind')), note, at: new Date().toISOString() });
  localStorage.setItem(LOT_EVENTS_KEY, JSON.stringify(lotEvents));
  const record = records.find((item) => item.id === event.target.dataset.recordId);
  if (record) showLotPreview(record);
  showToast('Trace event added to this harvest lot');
});

byId('close-lot').addEventListener('click', () => byId('lot-dialog').close());
byId('close-lot-secondary').addEventListener('click', () => byId('lot-dialog').close());
byId('print-lot').addEventListener('click', () => window.print());

setTodayLabel();
renderRecords();
renderTwin();
