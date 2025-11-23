import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();
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

  // expose
  global.FarmApp = {
    loadJobs,
    saveJobs,
    addJob,
    updateJob,
    deleteJobById,
    getJobsForDate
  };

})(window);
// Function to add a new job to Firestore
async function addJobToFirestore(job) {
  try {
    const docRef = await addDoc(collection(db, "jobs"), {
      date: job.date,
      field: job.field,
      blend: job.blend,
      rate: job.rate,
      size: job.size,
      total: job.total,
      rateType: job.rateType
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Function to update a job in Firestore
async function updateJobInFirestore(id, updatedJob) {
  const docRef = doc(db, "jobs", id);
  try {
    await updateDoc(docRef, updatedJob);
    console.log("Document updated");
  } catch (e) {
    console.error("Error updating document: ", e);
  }
}

// Function to fetch all jobs from Firestore
async function getJobsFromFirestore() {
  const querySnapshot = await getDocs(collection(db, "jobs"));
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
    // Display jobs in your table
    const jobData = doc.data();
    // Use the jobData to render the job rows
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${jobData.date}</td>
      <td>${jobData.field}</td>
      <td>${jobData.blend}</td>
      <td>${jobData.rate}</td>
      <td>${jobData.size}</td>
      <td>${jobData.total}</td>
      <td>
        <button class="btn-edit" data-id="${doc.id}">Edit</button>
        <button class="btn-del" data-id="${doc.id}" style="margin-left:6px">Delete</button>
      </td>
    `;
    document.getElementById("screenBody").appendChild(tr);
  });
}
