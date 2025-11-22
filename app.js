
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
        rows.push([j.date, j.field, j.blend, j.rate === "N-Sensor" ? "N-Sensor" : j.rate, j.size, j.total]);
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('
');
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daily-report.csv";
    a.click();
}

// -----------------------------
// RENDER FUNCTION
// -----------------------------
function render() {
    const jobs = loadJobs();
    const sBody = document.getElementById("screenBody");
    const pBody = document.getElementById("printBody");
    const dateDisp = document.getElementById("printDateDisplay");
    const totalsLine = document.getElementById("totalsLine");

    sBody.innerHTML = "";
    pBody.innerHTML = "";

    if (!jobs.length) {
        totalsLine.textContent = "Totals: 0 ha — 0 kg";
        return;
    }

    dateDisp.textContent = jobs[0].date;

    let totalHa = 0, totalKg = 0;

    jobs.forEach((job, idx) => {
        const rate = job.rate === "N-Sensor" ? "N-Sensor" : job.rate; // Modify to display N-Sensor
        const size = Number(job.size) || 0;
        const total = Number(job.total) || (job.rate !== "N-Sensor" ? rate * size : size * 0); // Adjust total calculation for N-Sensor

        totalHa += size;
        totalKg += total;

        // SCREEN row
        sBody.innerHTML += `
            <tr>
                <td>${escapeHtml(job.field)}</td>
                <td>${escapeHtml(job.blend)}</td>
                <td>${rate} <span class="unit">kg/ha</span></td>
                <td>${fmt(size)} <span class="unit">ha</span></td>
                <td>${fmt(total)} <span class="unit">kg</span></td>
                <td>
                    <button class="btn btn-edit" onclick="editJob(${idx})">Edit</button>
                    <button class="btn btn-del" onclick="deleteJob(${idx})">Delete</button>
                </td>
            </tr>`;

        // PRINT row
        pBody.innerHTML += `
            <tr>
                <td>${escapeHtml(job.field)}</td>
                <td>${escapeHtml(job.blend)}</td>
                <td>${rate} <span class="unit">kg/ha</span></td>
                <td>${fmt(size)} <span class="unit">ha</span></td>
                <td>${fmt(total)} <span class="unit">kg</span></td>
            </tr>`;
    });

    totalsLine.textContent =
        "Totals: " + fmt(totalHa, 2) + " ha → " + fmt(totalKg, 2) + " kg";
}

render();
