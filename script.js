function loadJobs() {
    let jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    return jobs;
}

function saveJobs(jobs) {
    localStorage.setItem("jobs", JSON.stringify(jobs));
}

document.addEventListener("DOMContentLoaded", () => {

    const fieldSize = document.getElementById("fieldSize");
    const rate = document.getElementById("rate");
    const total = document.getElementById("total");
    const saveBtn = document.getElementById("saveJob");

    if (fieldSize && rate && total) {
        function autoCalculate() {
            total.value = Number(fieldSize.value || 0) * Number(rate.value || 0);
        }
        fieldSize.oninput = autoCalculate;
        rate.oninput = autoCalculate;

        saveBtn.onclick = () => {
            let job = {
                id: document.getElementById("fieldId").value,
                ha: fieldSize.value,
                blend: document.getElementById("blend").value,
                rate: rate.value,
                total: total.value,
                date: new Date().toLocaleDateString()
            };

            let jobs = loadJobs();
            jobs.push(job);
            saveJobs(jobs);

            fieldSize.value = "";
            total.value = "";
            alert("Saved!");
        };
    }

    const jobsDiv = document.getElementById("jobs");
    if (jobsDiv) {
        let jobs = loadJobs();
        jobsDiv.innerHTML = jobs.map(j =>
            `<p>${j.date} — ${j.id} — ${j.ha} ha — ${j.blend} — ${j.rate} kg/ha — Total: ${j.total} kg</p>`
        ).join("");
    }
});

function exportCSV() {
    let jobs = loadJobs();
    let csv = "Date,Field,Ha,Blend,Rate,Total\n" +
        jobs.map(j => `${j.date},${j.id},${j.ha},${j.blend},${j.rate},${j.total}`).join("\n");

    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "daily_report.csv";
    a.click();
}
