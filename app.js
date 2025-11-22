/* app.js - shared logic for Daily Work (index.html) and Daily Report (daily-report.html)
   - Stores jobs in localStorage under "jobs" (array of job objects)
   - Each job: { id, date (YYYY-MM-DD), field, blend, rate, size, total }
*/

(function(global){
  'use strict';

  // ---------- storage helpers ----------
  function loadJobs(){
    try{ return JSON.parse(localStorage.getItem('jobs')||'[]'); }
    catch(e){ console.error('jobs parse',e); return []; }
  }
  function saveJobs(jobs){
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }

  function genId(){ return 'id_'+Math.random().toString(36).slice(2,10); }

  // ensure old jobs have ids (safe upgrade)
  (function ensureIds(){
    let jobs = loadJobs();
    let changed = false;
    jobs = jobs.map(j=>{
      if(!j.id){ j.id = genId(); changed = true; }
      return j;
    });
    if(changed) saveJobs(jobs);
  })();

  // ---------- CRUD ----------
  function addJob(job){
    const jobs = loadJobs();
    job.id = genId();
    job.total = Number(job.total || (Number(job.rate)||0) * (Number(job.size)||0));
    jobs.push(job);
    saveJobs(jobs);
    return job;
  }

  function updateJob(updated){
    let jobs = loadJobs();
    const idx = jobs.findIndex(j=>j.id === updated.id);
    if(idx!==-1){
      updated.total = Number(updated.rate || 0) * Number(updated.size || 0);
      jobs[idx] = updated;
      saveJobs(jobs);
      return true;
    }
    return false;
  }

  function deleteJobById(id){
    let jobs = loadJobs();
    jobs = jobs.filter(j=>j.id !== id);
    saveJobs(jobs);
  }

  function getJobsForDate(isoDate){
    const jobs = loadJobs();
    return jobs.filter(j => j.date === isoDate);
  }

  // export CSV utility
  function exportCsvForDate(isoDate){
    const rows = [['Date','Field','Blend','Rate (kg/ha)','Size (ha)','Total (kg)']];
    const jobs = getJobsForDate(isoDate);
    jobs.forEach(j=> rows.push([j.date, j.field, j.blend, j.rate, j.size, j.total]));
    const csv = rows.map(r=> r.map(c=> `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-report-${isoDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // expose
  global.FarmApp = {
    loadJobs,
    saveJobs,
    addJob,
    updateJob,
    deleteJobById,
    getJobsForDate,
    exportCsvForDate
  };

})(window);
