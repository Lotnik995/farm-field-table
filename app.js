// app.js — localStorage per date app (key: farm_jobs_YYYY-MM-DD)
// Keeps field/blend/rate persistent; clears ha & total after save.
// Daily report supports edit (inline via prompt), delete, print, export.

const qs = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0,10);
const keyFor = d => 'farm_jobs_' + d;

// ---- Shared helpers ----
function formatDateInput(el, d) { el.value = d || today(); }
function parseFloatSafe(v){ return Math.round((Number(v)||0)*100)/100; }

// ---- Main page logic ----
function initMain() {
  const field = qs('#field'), ha = qs('#ha'), blend = qs('#blend'), rate = qs('#rate'), totalKg = qs('#totalKg');
  const saveBtn = qs('#saveBtn'), recordDate = qs('#recordDate');
  const prev = qs('#prevDay'), next = qs('#nextDay'), openReport = qs('#openReport'), exportDay = qs('#exportDay');

  // init date
  formatDateInput(recordDate, today());

  // live calc
  function recalc(){
    const k = parseFloatSafe(ha.value) * parseFloatSafe(rate.value);
    totalKg.value = k ? k.toFixed(2) : '';
  }
  ha.addEventListener('input', recalc);
  rate.addEventListener('input', recalc);

  // save job (silent save)
  saveBtn.addEventListener('click', ()=>{
    const d = recordDate.value || today();
    const rows = JSON.parse(localStorage.getItem(keyFor(d)) || '[]');
    const job = {
      field: (field.value||'').trim(),
      blend: (blend.value||'').trim(),
      rate: parseFloatSafe(rate.value),
      ha: parseFloatSafe(ha.value),
      kg: parseFloatSafe(totalKg.value)
    };
    rows.push(job);
    localStorage.setItem(keyFor(d), JSON.stringify(rows));
    // clear only ha & total; keep field, blend, rate
    ha.value = ''; totalKg.value = '';
    // small visual feedback
    const old = saveBtn.textContent;
    saveBtn.textContent = 'Saved ✓';
    setTimeout(()=> saveBtn.textContent = old, 900);
  });

  prev.addEventListener('click', ()=> shiftDate(recordDate, -1));
  next.addEventListener('click', ()=> shiftDate(recordDate, 1));

  openReport.addEventListener('click', ()=> {
    const d = recordDate.value || today();
    location.href = 'daily.html?date=' + d;
  });

  exportDay.addEventListener('click', ()=> {
    const d = recordDate.value || today();
    exportCSVForDate(d);
  });
}

// ---- Daily report logic ----
function initReport() {
  const tbody = qs('#reportTable tbody');
  const reportDate = qs('#reportDate'), rPrev = qs('#rPrev'), rNext = qs('#rNext');
  const printBtn = qs('#printBtn'), exportBtn = qs('#exportBtn');
  const totalHaEl = qs('#totalHa'), totalKgEl = qs('#totalKg');

  // find date param or default to today
  const params = new URLSearchParams(location.search);
  let date = params.get('date') || today();
  const rDateInput = qs('#reportDate');
  function loadDate(d){
    date = d;
    if (rDateInput) rDateInput.value = d;
    if (reportDate) reportDate.textContent = d.split('-').reverse().join('/');
    render();
  }
  if (rDateInput) rDateInput.addEventListener('change', ()=> loadDate(rDateInput.value));
  if (rPrev) rPrev.addEventListener('click', ()=> shiftDate(rDateInput, -1));
  if (rNext) rNext.addEventListener('click', ()=> shiftDate(rDateInput, 1));

  function render(){
    tbody.innerHTML = '';
    const rows = JSON.parse(localStorage.getItem(keyFor(date)) || '[]');
    let totalHa = 0, totalKg = 0;
    rows.forEach((r,i) => {
      totalHa += parseFloatSafe(r.ha); totalKg += parseFloatSafe(r.kg);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.field)}</td>
                      <td>${escapeHtml(r.blend)}</td>
                      <td>${Number(r.rate||0).toLocaleString()}</td>
                      <td>${Number(r.ha||0).toLocaleString()}</td>
                      <td>${Number(r.kg||0).toLocaleString()}</td>
                      <td class="actions"><button class="edit" data-i="${i}">Edit</button>
                        <button class="del" data-i="${i}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    totalHaEl.textContent = (Math.round(totalHa*100)/100).toFixed(2) + ' ha';
    totalKgEl.textContent = (Math.round(totalKg*100)/100).toFixed(2) + ' kg';
    attachRowEvents();
  }

  function attachRowEvents(){
    document.querySelectorAll('.del').forEach(btn=>{
      btn.onclick = (e)=>{
        const i = Number(btn.dataset.i);
        const rows = JSON.parse(localStorage.getItem(keyFor(date)) || '[]');
        rows.splice(i,1);
        localStorage.setItem(keyFor(date), JSON.stringify(rows));
        render();
      };
    });
    document.querySelectorAll('.edit').forEach(btn=>{
      btn.onclick = (e)=>{
        const i = Number(btn.dataset.i);
        const rows = JSON.parse(localStorage.getItem(keyFor(date)) || '[]');
        const r = rows[i];
        // inline edit via prompt for quick use on phone
        const field = prompt('Field ID', r.field);
        if (field === null) return;
        const blend = prompt('Blend/Product', r.blend);
        if (blend === null) return;
        const rate = prompt('Rate (kg/ha)', r.rate);
        if (rate === null) return;
        const ha = prompt('Size (ha)', r.ha);
        if (ha === null) return;
        const kg = Math.round((Number(rate)||0) * (Number(ha)||0) * 100)/100;
        rows[i] = { field: (field||'').trim(), blend: (blend||'').trim(), rate: parseFloatSafe(rate), ha: parseFloatSafe(ha), kg: kg };
        localStorage.setItem(keyFor(date), JSON.stringify(rows));
        render();
      };
    });
  }

  printBtn.addEventListener('click', ()=> window.print());
  exportBtn.addEventListener('click', ()=> exportCSVForDate(date));

  loadDate(date);
}

// ---- Utilities ----
function shiftDate(inputEl, delta){
  const el = inputEl;
  const d = new Date(el.value || today());
  d.setDate(d.getDate() + delta);
  el.value = d.toISOString().slice(0,10);
  // if on report page, also reload
  if (location.pathname.endsWith('daily.html')) {
    const params = new URLSearchParams(location.search);
    params.set('date', el.value);
    history.replaceState(null, '', location.pathname + '?' + params.toString());
    initReport(); // re-init may be heavy but safe
    location.reload();
  } else {
    // nothing else
  }
}

function exportCSVForDate(d){
  const rows = JSON.parse(localStorage.getItem(keyFor(d)) || '[]');
  if(!rows.length){ alert('No rows for ' + d); return; }
  let csv = 'Field,Blend,Rate (kg/ha),Ha,Kg\\n';
  rows.forEach(r => csv += `"${r.field}","${r.blend}",${r.rate},${r.ha},${r.kg}\\n`);
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'daily_'+d+'.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ---- Boot ----
document.addEventListener('DOMContentLoaded', ()=>{
  if (document.body.innerHTML.includes('Save Job')) initMain();
  if (document.body.innerHTML.includes('Daily Report')) initReport();
});
