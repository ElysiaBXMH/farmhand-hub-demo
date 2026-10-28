(() => {
  if (new URLSearchParams(location.search).get('demo') !== '1') return;
  const recordsKey = 'farmhand-hub-harvest-records-v1';
  const lotsKey = 'farmhand-hub-lot-events-v1';
  if (localStorage.getItem(recordsKey)) return;
  const now = new Date().toISOString();
  const records = [
    {id:'demo-harvest-springmix',date:'2026-10-27',crop:'Spring Mix',quantity:'24',unit:'pounds',field:'Bed 8',activity:'Harvest',crew:'Maya',notes:'Harvested from Bed 8; linked to planting P-104.',sourceExcerpt:'We harvested 24 pounds of spring mix from Bed 8 today.',plantingId:'P-104',lotId:'WH-2026-DEMO01',history:[],status:'',savedAt:now},
    {id:'demo-storage-springmix',date:'2026-10-27',crop:'Spring Mix',quantity:'',unit:'',field:'Bed 8',activity:'Storage check',crew:'Luis',notes:'Packed in a labeled bin and moved to the cooler.',sourceExcerpt:'I packed the Bed 8 spring mix in a labeled bin and moved the harvest lot from Bed 8 to the cooler.',plantingId:'P-104',lotId:'',relatedLotId:'WH-2026-DEMO01',history:[],status:'',savedAt:now},
    {id:'demo-harvest-tomatoes',date:'2026-10-27',crop:'Tomatoes',quantity:'42',unit:'crates',field:'North Field',activity:'Harvest',crew:'Maya',notes:'Soft fruit kept separate for the kitchen.',sourceExcerpt:'We harvested 42 crates of tomatoes from North Field. Some fruit was soft, so we kept those crates separate for the kitchen.',plantingId:'',lotId:'WH-2026-DEMO02',history:[],status:'',savedAt:now},
    {id:'demo-crop-health',date:'2026-10-27',crop:'Cucumbers',quantity:'',unit:'',field:'South Tunnel',activity:'Crop health',crew:'Rosa',notes:'Aphids observed; check before next harvest.',sourceExcerpt:'I saw aphids on cucumber leaves in South Tunnel; please check the crop before the next pick.',plantingId:'',lotId:'',history:[],status:'',savedAt:now},
    {id:'demo-harvest-basil',date:'2026-10-27',crop:'Basil',quantity:'6',unit:'buckets',field:'',activity:'Harvest',crew:'Maya',notes:'The bed location was not recorded.',sourceExcerpt:'We picked 6 buckets of basil, but I forgot which bed. Please leave the location blank and flag it for me instead of guessing.',plantingId:'',lotId:'WH-2026-DEMO03',history:[],status:'Needs follow-up',savedAt:now},
    {id:'demo-correction-pending',date:'2026-10-27',crop:'Spring Mix',quantity:'22',unit:'pounds',field:'Bed 8',activity:'Correction review',crew:'Maya',notes:'Pending reweigh correction; not applied to the harvest record.',sourceExcerpt:'Correction proposal: reweighed total may be 22 pounds. Review before applying.',plantingId:'P-104',lotId:'',history:[],status:'Needs follow-up',savedAt:now}
  ];
  localStorage.setItem(recordsKey, JSON.stringify(records));
  localStorage.setItem(lotsKey, JSON.stringify([{id:'demo-handling-1',recordId:'demo-harvest-springmix',kind:'Moved to cooler',note:'Labeled bin placed in cooler.',at:now,sourceRecordId:'demo-storage-springmix'}]));
})();
