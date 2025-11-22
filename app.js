/* app.js - enhanced with N-Sensor mode */

(function(global){
  'use strict';

  // -----------------------
  // Storage Helpers
  // -----------------------
  function loadJobs(){
    try{ return JSON.parse(localStorage.getItem('jobs')||'[]'); }
    catch(e){ console.error('jobs parse',e); return []; }
  }

  function saveJobs(jobs){
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }

  function genId(){ return 'id_'+Math.random().toString(36).slice(2,10); }

  // Add missing IDs for old jobs
  (function ensureIds(){
    let jobs = loadJobs();
    let changed = false;
    jobs = jobs.map(j=>{
      if(!j.id){ j.id = genId(); changed = true; }
      return j;
    });
    if(changed) saveJobs(jobs);
  })();


  // -----------------------
  // Add Job
  // -----------------------
  function addJob(job){
    const jobs = loadJobs();
    job.id = genId();

    const rateInput = String(job.rate).trim().toLowerCase();

    // ----- N SENSOR MODE -----
    const isNSensor =
      rateInput === "n" ||
      rateInput === "ns" ||
      rateInput === "n-sensor" ||
      rateInput === "sensor";

    if(isNSensor){
      job.rate = "N-SENSOR";
      job.size = Number(job.size || 0);

      let manualTotal = prompt("Enter TOTAL KG (manual):", "");
      if(manualTotal === null || manualTotal.trim()===""){
        manualTotal = 0;
      }

      job.total = Number(manualTotal);

    } else {
      // normal mode
      job.rate = Number(job.rate)||0;
      job.size = Number(job.size)||0;
      job.total = job.rate * job.size;
    }

    jobs.push(job);
    saveJobs(jobs);
    return job;
  }


  // -----------------------
  // Update Job
  // -----------------------
  function updateJob(updated){
    let jobs = loadJobs();

    const rateInput = String(updated.rate).trim().toLowerCase();
    const isNSensor =
      rateInput === "n" ||
      rateInput === "ns" ||
      rateInput === "n-sensor" ||
      rateInput === "sensor";

    if(isNSensor){
      updated.rate = "N-SENSOR";

      let manualTotal = prompt("Enter TOTAL KG (manual):", updated.total || "");
      if(manualTotal === null || manualTotal.trim()===""){
        manualTotal = 0;
      }
      updated.total = Number(manualTotal);

    } else {
      updated.rate = Number(updated.rate)||0;
      updated.size = Number(updated.size)||0;
      updated.total = updated.rate * updated.size;
    }

    const idx = jobs.findIndex(j=> j.id === updated.id);
    if(idx !== -1){
      jobs[idx] = updated;
      saveJobs(jobs);
      return true;
    }
    return false;
  }


  // -----------------------
  // Delete
  // -----------------------
  function deleteJobById(id){
    let jobs = loadJobs();
    jobs = jobs.filter(j => j.id !== id);
    saveJobs(jobs);
  }


  // -----------------------
  // Get Jobs For Date
  // -----------------------
  function getJobsForDate(date){
    return loadJobs().filter(j => j.date === date);
  }


  // -----------------------
  // Export CSV
  // -----------------------
  function exportCsvForDate(date){
    const jobs = getJobsForDate(date);
    const rows = [["Date","Field","Blend","Rate","Size","Total KG"]];

    jobs.forEach(j=>{
      rows.push([j.date, j.field, j.blend, j.rate, j.size, j.total]);
    });

    const csv = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});

    const a=document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daily-report-"+date+".csv";
    a.click();
  }


  // expose globally
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
