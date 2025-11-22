// app.js - simple job storage for Farm Field Table (stores to localStorage 'jobs')
// load/save helpers
(function(){
const STORAGE_KEY = 'jobs';
function saveJobs(j){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(j)); }catch(e){ console.error(e);} }
function loadJobs(){ try{ let arr = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); if(!Array.isArray(arr)) arr = []; // auto-fix missing ids
  let changed=false; arr = arr.map(j=>{ if(!j.id){ j.id = 'id_'+Math.random().toString(36).slice(2,9); changed=true; } return j; }); if(changed) saveJobs(arr); return arr;}catch(e){ console.error('loadJobs',e); return []; } }

// expose for other pages
window.loadJobs = loadJobs;
window.saveJobs = saveJobs;

// create job from form
window.createJobFromForm = function(){
  const date = document.getElementById('date') && document.getElementById('date').value;
  const field = document.getElementById('field') && document.getElementById('field').value.trim();
  const blend = document.getElementById('blend') && document.getElementById('blend').value.trim();
  const rate = Number(document.getElementById('rate') && document.getElementById('rate').value) || 0;
  const size = Number(document.getElementById('size') && document.getElementById('size').value) || 0;
  if(!date || !field || !blend || rate<=0 || size<=0){ alert('Please fill all fields (date, field, blend, rate, size)'); return null; }
  const total = Math.round(rate * size * 100)/100;
  const job = { id: 'id_'+Math.random().toString(36).slice(2,9), date, field, blend, rate, size, total };
  // remember last used
  try{ localStorage.setItem('lastField', field); localStorage.setItem('lastBlend', blend); localStorage.setItem('lastRate', String(rate)); }catch(e){}
  return job;
};

// add job
window.addJob = function(job){
  if(!job || !job.id){ console.error('invalid job', job); return; }
  const jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
  // notify
  try{ window.dispatchEvent(new Event('storage')); }catch(e){}
};

// delete by id
window.deleteJobById = function(id){
  let jobs = loadJobs();
  jobs = jobs.filter(j=> j.id !== id);
  saveJobs(jobs);
  try{ window.dispatchEvent(new Event('storage')); }catch(e){};
};

// update job
window.updateJob = function(updated){
  let jobs = loadJobs();
  const idx = jobs.findIndex(j=> j.id === updated.id);
  if(idx===-1) return false;
  jobs[idx] = updated;
  saveJobs(jobs);
  try{ window.dispatchEvent(new Event('storage')); }catch(e){};
  return true;
};

// helper to get jobs for date
window.getJobsForDate = function(dateIso){
  return loadJobs().filter(j=> j.date === dateIso);
};

// export CSV
window.exportToCSV = function(jobs){
  if(!jobs || !jobs.length){ alert('No rows to export'); return; }
  const rows = [['Date','Field','Blend','Rate (kg/ha)','Size (ha)','Total (kg)']];
  jobs.forEach(j=> rows.push([j.date,j.field,j.blend,String(j.rate),String(j.size),String(j.total)]));
  const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'daily-report.csv'; a.click();
};

// expose utilities
window._farm = { loadJobs, saveJobs };
})();