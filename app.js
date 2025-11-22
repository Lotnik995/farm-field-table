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
// FIX OLD JOBS WITHOUT ID
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

    if (changed) saveJobs(jobs);
})();



// --------------------------------------------------
// ADD JOB
// --------------------------------------------------
function addJob() {
    const date = document.getElementById("date").value;
    const field = document.getElementById("field").value;
    const blend = document.getElementById("blend").value;
    const rate = document.getElementById("rate").value;
    const size = document.getElementById("size").value;
    const jobType = document.getElementById("jobType").value;
    const manualTotal = document.getElementById("manualTotal").value;

    if (!date || !field || !blend || !size) {
        alert("Missing required fields");
        return;
    }

    let total = 0;

    // --- Mode A Logic ---
    if (jobType === "kg") {
        total = Number(rate) * Number(size);
    } else {
        total = Number(manualTotal);
    }

    const jobs = loadJobs();
    jobs.push({
        id: "id_" + Math.random().toString(36).slice(2, 10),
        date,
        field,
        blend,
        rate: jobType === "kg" ? Number(rate) : "N-Sensor",
        size: Number(size),
        total: Number(total),
        mode: jobType
    });

    saveJobs(jobs);

    document.getElementById("result").innerText = "Saved!";
    document.getElementById("result").style.display = "block";

    setTimeout(() => {
        document.getElementById("result").style.display = "none";
    }, 1200);
}



// --------------------------------------------------
// DELETE
// --------------------------------------------------
function deleteJobById(id) {
    let jobs = loadJobs();
    jobs = jobs.filter(j => j.id !== id);
    saveJobs(jobs);
}



// --------------------------------------------------
// UPDATE JOB
// --------------------------------------------------
function updateJob(updatedJob) {
    let jobs = loadJobs();
    let idx = jobs.findIndex(j => j.id === updatedJob.id);

    if (idx !== -1) {
        jobs[idx] = updatedJob;
        saveJobs(jobs);
    }
}



// --------------------------------------------------
// GET JOBS FOR A DATE
// --------------------------------------------------
function getJobsForDate(date) {
    const jobs = loadJobs();
    return jobs.filter(j => j.date === date);
}



// --------------------------------------------------
// CSV EXPORT
// --------------------------------------------------
function exportToCSV(jobs) {
    if (!jobs.length) {
        alert("No data to export");
        return;
    }

    const rows = [
        ["Date", "Field", "Blend", "Rate", "Size (ha)", "Total (kg)"]
    ];

    jobs.forEach(j => {
        rows.push([
            j.date,
            j.field,
            j.blend,
            j.rate,
            j.size,
            j.total
        ]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daily-report.csv";
    a.click();
}



// --------------------------------------------------
// JOB TYPE HANDLING (KG <-> N-SENSOR)
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const jobType = document.getElementById("jobType");
    const rateBox = document.getElementById("rateBox");
    const manualBox = document.getElementById("manualBox");

    jobType.addEventListener("change", () => {
        if (jobType.value === "kg") {
            rateBox.style.display = "block";
            manualBox.style.display = "none";
        } else {
            rateBox.style.display = "none";
            manualBox.style.display = "block";
        }
    });
});
