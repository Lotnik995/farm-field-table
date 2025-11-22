// app.js - Core storage & UI bridge
// Put this file at project root and ensure both pages include <script src="app.js"></script>

// localStorage key
const STORAGE_KEY = 'jobs';

// -----------------------------
// LOAD & SAVE
// -----------------------------
function loadJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('Error loading jobs', e);
    return [];
  }
}

function saveJobs(jobs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    // dispatch a storage-like event for same-window listeners
    window.dispatchEvent(new Event('jobsUpdated'));
  } catch (e) {
    console.error('Error saving jobs', e);
  }
}

// --------------------------------------------------
// FIX OLD JOBS WITHOUT ID (important!)
// --------------------------------------------------
(function fixOldJobs() {
  let jobs = loadJobs();
  let changed = false;
  jobs = jobs.map(j => {
    if (!j.id) {
      j.id = 'id_' + Math.random().toString(36).slice(2, 10);
      changed = true;
    }
    // ensure numeric fields are numbers
    j.rate = Number(j.rate) || 0;
    j.size = Number(j.size) || 0;
    j.total = Number(j.total) || Math.round((j.rate * j.size) * 100) / 100;
    return j;
  });
  if (changed) {
    saveJobs(jobs);
    console.log('✔ Old jobs updated with ID fields.');
  }
})();

// -----------------------------
// ADD NEW JOB
// -----------------------------
function addJob(job) {
  const jobs = loadJobs();
  job.id = 'id_' + Math.random().toString(36).slice(2, 10);
  job.rate = Number(job.rate) || 0;
  job.size = Number(job.size) || 0;
  job.total = Number(job.total) || Math.round((job.rate * job.size) * 100) / 100;
  jobs.push(job);
  saveJobs(jobs);
  // if on report page, re-render for current date
  if (typeof renderReportForDate === 'function') {
    const currentDateEl = document.getElementById && document.getElementById('reportDate');
    if (currentDateEl) renderReportForDate(currentDateEl.value);
  }
}

// -----------------------------
// DELETE JOB BY ID
// -----------------------------
function deleteJobById(id) {
  let jobs = loadJobs();
  jobs = jobs.filter(j => j.id !== id);
  saveJobs(jobs);
  // re-render if possible
  if (typeof renderReportForDate === 'function') {
    const currentDateEl = document.getElementById && document.getElementById('reportDate');
    if (currentDateEl) renderReportForDate(currentDateEl.value);
  }
}

// -----------------------------
// UPDATE JOB
// -----------------------------
function updateJob(updatedJob) {
  let jobs = loadJobs();
  const idx = jobs.findIndex(j => j.id === updatedJob.id);
  if (idx !== -1) {
    updatedJob.rate = Number(updatedJob.rate) || 0;
    updatedJob.size = Number(updatedJob.size) || 0;
    updatedJob.total = Number(updatedJob.total) || Math.round((updatedJob.rate * updatedJob.size) * 100) / 100;
    jobs[idx] = updatedJob;
    saveJobs(jobs);
    if (typeof renderReportForDate === 'function') {
      const currentDateEl = document.getElementById && document.getElementById('reportDate');
      if (currentDateEl) renderReportForDate(currentDateEl.value);
    }
  }
}

// -----------------------------
// GET JOBS FOR SPECIFIC DATE
// -----------------------------
function getJobsForDate(date) {
  const jobs = loadJobs();
  return jobs.filter(j => j.date === date);
}

// -----------------------------
// CSV EXPORT
// -----------------------------
function exportToCSV(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    alert('No data to export for this date.');
    return;
  }
  const rows = [
    ['Date', 'Field', 'Blend', 'Rate (kg/ha)', 'Size (ha)', 'Total (kg)']
  ];
  jobs.forEach(j => rows.push([j.date, j.field, j.blend, j.rate, j.size, j.total]));
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -----------------------------
// Render helpers for daily-report.html
// -----------------------------
function renderReportForDate(date) {
  if (!date) return;
  const screenBody = document.getElementById('screenBody');
  const printBody = document.getElementById('printBody');
  const totalsLine = document.getElementById('totalsLine');

  if (!screenBody || !printBody || !totalsLine) return;

  const jobs = getJobsForDate(date);
  screenBody.innerHTML = '';
  printBody.innerHTML = '';

  let totalHa = 0;
  let totalKg = 0;

  jobs.forEach((job, idx) => {
    totalHa += Number(job.size) || 0;
    totalKg += Number(job.total) || 0;

    // screen row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(job.field)}</td>
      <td>${escapeHtml(job.blend)}</td>
      <td>${formatNum(job.rate)} <span class="unit">kg/ha</span></td>
      <td>${formatNum(job.size)} <span class="unit">ha</span></td>
      <td>${formatNum(job.total)} <span class="unit">kg</span></td>
      <td class="actions">
        <button class="btn-edit" data-id="${job.id}">Edit</button>
        <button class="btn-del" data-id="${job.id}">Delete</button>
      </td>`;
    screenBody.appendChild(tr);

    // print row (no actions)
    const pr = document.createElement('tr');
    pr.innerHTML = `
      <td>${escapeHtml(job.field)}</td>
      <td>${escapeHtml(job.blend)}</td>
      <td style="text-align:right">${formatNum(job.rate)} kg/ha</td>
      <td style="text-align:right">${formatNum(job.size)} ha</td>
      <td style="text-align:right">${formatNum(job.total)} kg</td>`;
    printBody.appendChild(pr);
  });

  totalsLine.textContent = 'Totals: ' + formatNum(totalHa,2) + ' ha — ' + formatNum(totalKg,2) + ' kg';

  // wire edit/delete
  Array.from(document.querySelectorAll('.btn-del')).forEach(b => b.onclick = function(){
    const id = this.dataset.id;
    if(!confirm('Delete this job?')) return;
    deleteJobById(id);
  });

  Array.from(document.querySelectorAll('.btn-edit')).forEach(b => b.onclick = function(){
    const id = this.dataset.id;
    const jobs = loadJobs();
    const job = jobs.find(x=>x.id===id);
    if(!job) return alert('Job not found.');
    // simple prompt-based edit (quick)
    const newField = prompt('Field ID', job.field);
    if(newField === null) return;
    const newBlend = prompt('Blend', job.blend);
    if(newBlend === null) return;
    const newRate = prompt('Rate (kg/ha)', job.rate);
    if(newRate === null) return;
    const newSize = prompt('Size (ha)', job.size);
    if(newSize === null) return;
    job.field = newField;
    job.blend = newBlend;
    job.rate = Number(newRate) || 0;
    job.size = Number(newSize) || 0;
    job.total = Math.round((job.rate * job.size) * 100) / 100;
    updateJob(job);
  });
}

// -----------------------------
// Small helpers
// -----------------------------
function formatNum(n,decimals){
  if (n === null || n === undefined || n === '') return '';
  if (typeof decimals === 'number') return Number(n).toLocaleString(undefined,{minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return Number(n).toLocaleString();
}
function escapeHtml(s){
  if(s===undefined || s===null) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// -----------------------------
// Listen for storage changes (sync across tabs / PWA)
window.addEventListener('storage', function(e){
  if(e.key === STORAGE_KEY){
    const currentDateEl = document.getElementById && document.getElementById('reportDate');
    if(currentDateEl && typeof renderReportForDate === 'function'){
      renderReportForDate(currentDateEl.value);
    }
  }
});

// Also listen for the synthetic event (same-origin writes)
window.addEventListener('jobsUpdated', function(){
  const currentDateEl = document.getElementById && document.getElementById('reportDate');
  if(currentDateEl && typeof renderReportForDate === 'function'){
    renderReportForDate(currentDateEl.value);
  }
});
