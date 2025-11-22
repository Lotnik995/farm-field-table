// -----------------------------
// LOAD & SAVE
// -----------------------------
function loadJobs() {
    try {
        return JSON.parse(localStorage.getItem("jobs") || "[]");
    } catch (e) {
        console.error("Error loading jobs", e);
        return [];
    }
}

function saveJobs(jobs) {
    localStorage.setItem("jobs", JSON.stringify(jobs));
}



// --------------------------------------------------
// FIX OLD JOBS WITHOUT ID (important!)
// --------------------------------------------------
(function fixOldJobs() {
    let jobs = loadJobs();
    let changed = false;

    jobs = jobs.map(j => {
        if (!j.id) {
            j.id = "id_" + Math.random().toString(36).slice(2, 10);
            changed = true;
        }
        return j;
    });

    if (changed) {
        saveJobs(jobs);
        console.log("✔ Old jobs updated with ID fields.");
    }
})();



// -----------------------------
// ADD NEW JOB
// -----------------------------
function addJob(job) {
    const jobs = loadJobs();
    job.id = "id_" + Math.random().toString(36).slice(2, 10);
    jobs.push(job);
    saveJobs(jobs);
}



// -----------------------------
// DELETE JOB BY ID
// -----------------------------
function deleteJobById(id) {
    let jobs = loadJobs();
    jobs = jobs.filter(j => j.id !== id);
    saveJobs(jobs);
}



// -----------------------------
// UPDATE JOB
// -----------------------------
function updateJob(updatedJob) {
    let jobs = loadJobs();
    let idx = jobs.findIndex(j => j.id === updatedJob.id);
    if (idx !== -1) {
        jobs[idx] = updatedJob;
        saveJobs(jobs);
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
// EXPORT CSV
// -----------------------------
function exportToCSV(jobs) {
    if (!jobs.length) {
        alert("No data to export");
        return;
    }

    const rows = [
        ["Date", "Field", "Blend", "Rate (kg/ha)", "Size (ha)", "Total (kg)"]
    ];

    jobs.forEach(j => {
        rows.push([j.date, j.field, j.blend, j.rate, j.size, j.total]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daily-report.csv";
    a.click();
}
// -----------------------------
// CREATE JOB FROM FORM (FIX FOR iPHONE)
// -----------------------------
function createJobFromForm() {
    const date = document.getElementById("date").value;
    const field = document.getElementById("field").value.trim();
    const blend = document.getElementById("blend").value.trim();
    const rate = Number(document.getElementById("rate").value);
    const size = Number(document.getElementById("size").value);

    if (!date || !field || !blend || !rate || !size) {
        alert("Fill all fields");
        return null;
    }

    return {
        id: "id_" + Math.random().toString(36).slice(2, 10),
        date: date,
        field: field,
        blend: blend,
        rate: rate,
        size: size,
        total: Math.round(rate * size * 100) / 100
    };
}
