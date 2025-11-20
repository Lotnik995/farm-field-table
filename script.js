// Format date
function format(d) {
    return d.toISOString().split("T")[0];
}

let current = new Date();
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("currentDate").textContent = format(current);

    if (document.getElementById("size")) {
        document.getElementById("size").addEventListener("input", updateTotal);
        document.getElementById("rate").addEventListener("input", updateTotal);
    }

    if (document.getElementById("reportBody")) {
        loadReport();
    }
});

function updateTotal() {
    let ha = parseFloat(document.getElementById("size").value) || 0;
    let rate = parseFloat(document.getElementById("rate").value) || 0;
    document.getElementById("totalkg").textContent = "Total kg: " + (ha * rate).toFixed(1);
}

function changeDate(delta) {
    current.setDate(current.getDate() + delta);
    document.getElementById("currentDate").textContent = format(current);

    if (document.getElementById("reportBody")) loadReport();
}

function saveJob() {
    let date = format(current);
    let jobs = JSON.parse(localStorage.getItem(date) || "[]");

    let f = document.getElementById("field").value;
    let ha = parseFloat(document.getElementById("size").value);
    let b = document.getElementById("blend").value;
    let r = parseFloat(document.getElementById("rate").value);
    let total = ha * r;

    jobs.push({ f, ha, b, r, total });

    localStorage.setItem(date, JSON.stringify(jobs));

    document.getElementById("size").value = "";
    document.getElementById("totalkg").textContent = "Total kg: 0";
}

function loadReport() {
    let date = format(current);
    let jobs = JSON.parse(localStorage.getItem(date) || "[]");

    let body = document.getElementById("reportBody");
    body.innerHTML = "";

    let totalHa = 0;
    let totalKg = 0;

    jobs.forEach((j, i) => {
        totalHa += j.ha;
        totalKg += j.total;

        body.innerHTML += `
            <tr>
                <td>${j.f}</td>
                <td>${j.b}</td>
                <td>${j.r}</td>
                <td>${j.ha}</td>
                <td>${j.total.toFixed(1)}</td>
                <td><button onclick="deleteRow(${i})">Delete</button></td>
            </tr>
        `;
    });

    document.getElementById("totals").textContent =
        `Total ha: ${totalHa.toFixed(2)}   Total kg: ${totalKg.toFixed(1)}`;
}

function deleteRow(i) {
    let date =
