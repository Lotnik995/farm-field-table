// app.js - simple "jobs" system compatible with modern index.html
// Saves jobs to localStorage key "jobs" as an array of {id,date,field,blend,rate,size,total}

(function(){
  const STORAGE_KEY = 'jobs';

  function uid(){ return 'id_' + Math.random().toString(36).slice(2,9); }

  // load & save
  function loadJobs(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ console.error('jobs parse error', e); return []; }
  }
  function saveJobs(jobs){ localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs)); }

  // Add job (called from index.html button onclick)
  window.addJob = function addJob(){
    const dateEl = document.getElementById('date');
    const fieldEl = document.getElementById('field');
    const blendEl = document.getElementById('blend');
    const rateEl = document.getElementById('rate');
    const sizeEl = document.getElementById('size');
    const resultEl = document.getElementById('result');

    if(!dateEl || !fieldEl || !blendEl || !rateEl || !sizeEl){
      alert('Form elements not found — check page IDs.');
      return;
    }

    const date = dateEl.value || new Date().toISOString().slice(0,10);
    const field = fieldEl.value.trim();
    const blend = blendEl.value.trim();
    const rate = parseFloat(rateEl.value) || 0;
    const size = parseFloat(sizeEl.value) || 0;

    if(!field){
      alert('Please enter Field ID');
      return;
    }
    if(!blend){
      alert('Please enter Blend');
      return;
    }
    if(rate <= 0 || size <= 0){
      alert('Rate and Size must be > 0');
      return;
    }

    const total = Math.round(rate * size * 100) / 100;

    const jobs = loadJobs();
    const job = { id: uid(), date, field, blend, rate, size, total };
    jobs.push(job);
    saveJobs(jobs);

    // save recent values so main page can keep them (optional)
    try {
      localStorage.setItem('lastField', field);
      localStorage.setItem('lastBlend', blend);
      localStorage.setItem('lastRate', String(rate));
    } catch(e){}

    // show small feedback
    if(resultEl){
      resultEl.style.display = 'block';
      resultEl.textContent = `Saved: ${field} — ${blend} — ${rate} kg/ha — ${size} ha → ${total} kg`;
      setTimeout(()=>{ if(resultEl) resultEl.style.display = 'none'; }, 2500);
    }

    // clear only size (you said you want field/blend/rate to stay)
    sizeEl.value = '';

    // notify other tabs/pages
    try { window.dispatchEvent(new Event('storage')); } catch(e){}
  };

  // Edit job by id (called by daily-report)
  window.updateJobById = function(id, updates){
    const jobs = loadJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if(idx === -1) return false;
    jobs[idx] = Object.assign({}, jobs[idx], updates);
    // recompute total if rate/size changed
    jobs[idx].total = Math.round((Number(jobs[idx].rate) || 0) * (Number(jobs[idx].size) || 0) * 100) / 100;
    saveJobs(jobs);
    window.dispatchEvent(new Event('storage'));
    return true;
  };

  // Delete job by id
  window.deleteJobById = function(id){
    let jobs = loadJobs();
    jobs = jobs.filter(j => j.id !== id);
    saveJobs(jobs);
    window.dispatchEvent(new Event('storage'));
  };

  // Expose helpers for console
  window._farm = {
    loadJobs, saveJobs
  };

  // --- Auto-populate index.html fields with 'last' values if present ---
  document.addEventListener('DOMContentLoaded', ()=>{
    const df = localStorage.getItem('lastField');
    const db = localStorage.getItem('lastBlend');
    const dr = localStorage.getItem('lastRate');

    try {
      if(df && document.getElementById('field')) document.getElementById('field').value = df;
      if(db && document.getElementById('blend')) document.getElementById('blend').value = db;
      if(dr && document.getElementById('rate')) document.getElementById('rate').value = dr;
    } catch(e){}
  });

})();
