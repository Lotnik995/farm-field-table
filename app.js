// app.js - main page logic
(function(){
  const qs = s => document.querySelector(s);
  const today = ()=> new Date().toISOString().slice(0,10);
  const dateInput = qs('#recordDate');
  const prevBtn = qs('#prevDay'), nextBtn = qs('#nextDay');
  const addRowBtn = qs('#addRow');
  const fieldsTable = qs('#fieldsTable tbody');
  const jobsCountEl = qs('#jobsCount'), totalAreaEl = qs('#totalArea'), totalKgEl = qs('#totalKg');
  const fieldIdInput = qs('#fieldId'), blendInput = qs('#blend'), rateInput = qs('#rate'), fieldHaInput = qs('#fieldHa'), autoKgInput = qs('#autoKg');
  const exportDayBtn = qs('#exportDay'), openFullBtn = qs('#openFull');

  function keyFor(d){ return 'farm_jobs_' + d; }

  function loadDate(d){
    dateInput.value = d || today();
    renderForDate(dateInput.value);
  }

  function renderForDate(d){
    const raw = localStorage.getItem(keyFor(d));
    const rows = raw ? JSON.parse(raw) : [];
    renderRows(rows);
  }

  function renderRows(rows){
    fieldsTable.innerHTML = '';
    rows.forEach((r, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.field)}</td><td>${escapeHtml(r.blend)}</td><td>${Number(r.rate)||0}</td><td>${Number(r.ha)||0}</td><td>${Number(r.kg)||0}</td><td><button class="btn small edit" data-i="${idx}">Edit</button> <button class="btn small danger del" data-i="${idx}">Delete</button></td>`;
      fieldsTable.appendChild(tr);
    });
    updateSummary(rows);
    attachRowButtons(rows);
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function attachRowButtons(rows){
    document.querySelectorAll('.edit').forEach(btn=> btn.onclick = ()=>{
      const i = Number(btn.dataset.i);
      const r = rows[i];
      fieldIdInput.value = r.field || '';
      blendInput.value = r.blend || '';
      rateInput.value = r.rate || '';
      fieldHaInput.value = r.ha || '';
      autoKgInput.value = r.kg || '';
      // remove from list until saved (so edit replaces)
      rows.splice(i,1);
      saveRows(rows);
      renderRows(rows);
    });
    document.querySelectorAll('.del').forEach(btn=> btn.onclick = ()=>{
      const i = Number(btn.dataset.i);
      rows.splice(i,1);
      saveRows(rows);
      renderRows(rows);
    });
  }

  function updateSummary(rows){
    const count = rows.length;
    let totalHa=0, totalKg=0;
    rows.forEach(r=>{ totalHa += Number(r.ha)||0; totalKg += Number(r.kg)||0; });
    jobsCountEl.textContent = count;
    totalAreaEl.textContent = (Math.round(totalHa*100)/100).toFixed(2);
    totalKgEl.textContent = (Math.round(totalKg*100)/100).toFixed(2);
  }

  function getRows(){
    const raw = localStorage.getItem(keyFor(dateInput.value || today()));
    return raw ? JSON.parse(raw) : [];
  }

  function saveRows(rows){
    localStorage.setItem(keyFor(dateInput.value || today()), JSON.stringify(rows));
  }

  function recalcAuto(){
    const ha = Number(fieldHaInput.value) || 0;
    const rate = Number(rateInput.value) || 0;
    const kg = Math.round((ha*rate)*100)/100;
    autoKgInput.value = kg.toFixed(2);
    return kg;
  }

  rateInput.addEventListener('input', recalcAuto);
  fieldHaInput.addEventListener('input', recalcAuto);

  addRowBtn.addEventListener('click', ()=>{
    const rows = getRows();
    const kg = recalcAuto();
    const newRow = {
      field: fieldIdInput.value || '',
      blend: blendInput.value || '',
      rate: Number(rateInput.value) || 0,
      ha: Number(fieldHaInput.value) || 0,
      kg: kg
    };
    rows.push(newRow);
    saveRows(rows);
    renderRows(rows);
    fieldIdInput.value=''; blendInput.value=''; fieldHaInput.value=''; autoKgInput.value='';
  });

  function shiftDate(days){
    const d = new Date(dateInput.value || today());
    d.setDate(d.getDate() + days);
    loadDate(d.toISOString().slice(0,10));
  }
  prevBtn.addEventListener('click', ()=>shiftDate(-1));
  nextBtn.addEventListener('click', ()=>shiftDate(1));

  exportDayBtn.addEventListener('click', ()=>{
    const rows = getRows();
    if(!rows.length){ alert('No rows for this date'); return; }
    let csv = 'Field,Blend,Rate,Ha,Kg\\n';
    rows.forEach(r=> csv += `"${r.field}", "${r.blend}", ${r.rate}, ${r.ha}, ${r.kg}\\n`);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'daily_'+(dateInput.value||today())+'.csv'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  openFullBtn.addEventListener('click', ()=>{
    const d = dateInput.value || today();
    window.open('daily-report.html?date='+d, '_blank');
  });

  (function init(){ loadDate(today()); })();

  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 's'){
      e.preventDefault();
      const rows = getRows();
      saveRows(rows);
      alert('Saved');
    }
  });
})();
