// app.js - Farm Field Table (replacement safe version)
// Keeps all public functions and adds robust notifications + logs.

/* ===========================
   Storage helpers
   =========================== */
(function(){
  const STORAGE_KEY = 'jobs';

  function safeSet(key, value){
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('localStorage.setItem failed', e);
      return false;
    }
  }

  function safeGet(key){
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('localStorage.getItem failed', e);
      return null;
    }
  }

  function saveJobs(jobs){
    try {
      const json = JSON.stringify(jobs||[]);
      const ok = safeSet(STORAGE_KEY, json);
      if(!ok) throw new Error('saveJobs: localStorage write failed');
      // also update a debug timestamp so other tabs might notice changes
      safeSet(STORAGE_KEY + '_lastupdate', String(Date.now()));
      console.log('saveJobs: saved', jobs.length, 'rows');
      return true;
    } catch (err) {
      console.error('saveJobs error', err);
      return false;
    }
  }

  function loadJobs(){
    try {
      const raw = safeGet(STORAGE_KEY) || '[]';
      let arr = JSON.parse(raw);
      if(!Array.isArray(arr)) arr = [];
      // ensure every job has id (fix old data)
      let changed = false;
      arr = arr.map(j => {
        if(!j || typeof j !== 'object') return null;
        if(!j.id){
          j.id = 'id_' + Math.random().toString(36).slice(2,9);
          changed = true;
        }
        // ensure numeric fields
        j.rate = Number(j.rate) || 0;
        j.size = Number(j.size) || 0;
        j.total = Number(j.total) || Math.round(j.rate * j.size * 100)/100;
        return j;
      }).filter(Boolean);
      if(changed) {
        try { safeSet(STORAGE_KEY, JSON.stringify(arr)); } catch(e){console.warn('loadJobs: unable to rewrite fixed ids', e);}
      }
      return arr;
    } catch (e){
      console.error('loadJobs parse error', e);
      return [];
    }
  }

  // expose internal helpers (only used below)
  window._farm_internal = { saveJobs, loadJobs };

  /* ===========================
     Public API - preserve names
     =========================== */

  // create job object from form values (used by index)
  window.createJobFromForm = function(){
    const dateEl = document.getElementById && document.getElementById('date');
    const fieldEl = document.getElementById && document.getElementById('field');
    const blendEl = document.getElementById && document.getElementById('blend');
    const rateEl = document.getElementById && document.getElementById('rate');
    const sizeEl = document.getElementById && document.getElementById('size');

    const date = dateEl ? String(dateEl.value || '').trim() : '';
    const field = fieldEl ? String(fieldEl.value || '').trim() : '';
    const blend = blendEl ? String(blendEl.value || '').trim() : '';
    const rate = Number(rateEl ? rateEl.value : 0) || 0;
    const size = Number(sizeEl ? sizeEl.value : 0) || 0;

    if(!date || !field || !blend || rate <= 0 || size <= 0){
      // user sees message, but also fail quietly if the UI isn't present
      if(typeof alert === 'function') alert('Please fill all fields: date, field, blend, rate and size.');
      return null;
    }

    const total = Math.round(rate * size * 100) / 100;
    const job = {
      id: 'id_' + Math.random().toString(36).slice(2,9),
      date: date,
      field: field,
      blend: blend,
      rate: rate,
      size: size,
      total: total
    };

    // remember last-used prefs (not required)
    try {
      safeSet('lastField', field);
      safeSet('lastBlend', blend);
      safeSet('lastRate', String(rate));
    } catch(e){ /* ignore */ }

    return job;
  };

  // add job (push and save)
  window.addJob = function(job){
    if(!job || !job.id){
      console.error('addJob: invalid job', job);
      return false;
    }
    const jobs = loadJobs();
    jobs.push(job);
    const ok = saveJobs(jobs);

    // Dispatch two notifications for robustness:
    // 1) Custom event 'jobs-updated' (works in same window/tab)
    // 2) Synthetic 'storage' event for pages listening to storage
    try {
      window.dispatchEvent(new CustomEvent('jobs-updated', { detail: { count: jobs.length }}));
    } catch(e){ console.warn('dispatch jobs-updated failed', e); }

    try {
      // browsers don't allow creating native StorageEvent easily cross-origin,
      // but many pages listen to custom 'storage' or to STORAGE_KEY changes.
      // We try to mimic by dispatching a plain Event named 'storage'
      window.dispatchEvent(new Event('storage'));
    } catch(e){ /* ignore */ }

    console.log('addJob: added job', job.id, 'saved:', ok);
    return ok;
  };

  window.deleteJobById = function(id){
    if(!id) return false;
    let jobs = loadJobs();
    const before = jobs.length;
    jobs = jobs.filter(j => j.id !== id);
    const ok = saveJobs(jobs);
    try { window.dispatchEvent(new CustomEvent('jobs-updated', { detail:{count: jobs.length} })); } catch(e){}
    try { window.dispatchEvent(new Event('storage')); } catch(e){}
    console.log('deleteJobById', id, 'before', before, 'after', jobs.length);
    return ok;
  };

  window.updateJob = function(updated){
    if(!updated || !updated.id) return false;
    const jobs = loadJobs();
    const idx = jobs.findIndex(j => j.id === updated.id);
    if(idx === -1) return false;
    jobs[idx] = updated;
    const ok = saveJobs(jobs);
    try { window.dispatchEvent(new CustomEvent('jobs-updated', { detail:{count: jobs.length} })); } catch(e){}
    try { window.dispatchEvent(new Event('storage')); } catch(e){}
    console.log('updateJob', updated.id, 'ok', ok);
    return ok;
  };

  window.getJobsForDate = function(dateIso){
    if(!dateIso) return [];
    const jobs = loadJobs();
    return jobs.filter(j => j.date === dateIso);
  };

  window.exportToCSV = function(jobs){
    if(!jobs || !jobs.length){ if(typeof alert === 'function') alert('No rows to export'); return; }
    const rows = [['Date','Field','Blend','Rate (kg/ha)','Size (ha)','Total (kg)']];
    jobs.forEach(j => rows.push([j.date,j.field,j.blend,String(j.rate),String(j.size),String(j.total)]));
    const csv = rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'daily-report.csv'; a.click();
    try { setTimeout(()=>URL.revokeObjectURL(a.href), 2000); } catch(e){}
  };

  // expose convenience functions for debugging
  window._farm = {
    loadJobs: loadJobs,
    saveJobs: saveJobs,
    STORAGE_KEY: STORAGE_KEY
  };

  // small helper: when script loads, emit 'jobs-updated' so other pages render initial state
  try { window.dispatchEvent(new CustomEvent('jobs-updated', { detail: { count: loadJobs().length } })); } catch(e){}
})();
