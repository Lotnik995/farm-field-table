function getDateKey(d){return d.toISOString().split('T')[0];}

function loadJobs(dateKey){
  return JSON.parse(localStorage.getItem('jobs_'+dateKey) || '[]');
}

function saveJobs(dateKey, jobs){
  localStorage.setItem('jobs_'+dateKey, JSON.stringify(jobs));
}

function setupMain(){
  if(!document.getElementById('saveJob')) return;

  let current = new Date();
  const cd = document.getElementById('currentDate');
  const updateDate = ()=>{ cd.textContent = getDateKey(current); };
  updateDate();

  document.getElementById('prevDay').onclick=()=>{current.setDate(current.getDate()-1);updateDate();};
  document.getElementById('nextDay').onclick=()=>{current.setDate(current.getDate()+1);updateDate();};

  const size = document.getElementById('size');
  const rate = document.getElementById('rate');
  const total = document.getElementById('total');
  function calc(){ total.value = (parseFloat(size.value||0)*parseFloat(rate.value||0)).toFixed(1); }
  size.oninput=rate.oninput=calc;

  document.getElementById('saveJob').onclick=()=>{
    calc();
    const job={
      field:field.value,
      size:parseFloat(size.value||0),
      blend:blend.value,
      rate:parseFloat(rate.value||0),
      total:parseFloat(total.value||0)
    };
    let key=getDateKey(current);
    let jobs=loadJobs(key);
    jobs.push(job);
    saveJobs(key,jobs);
    field.value=''; size.value=''; blend.value=''; rate.value=''; total.value='';
    alert('Saved');
  };
}

function setupReport(){
  if(!document.getElementById('reportTable')) return;

  let current = new Date();
  const cd = document.getElementById('currentDate');
  const tbody = document.querySelector('#reportTable tbody');
  const sumHa = document.getElementById('sumHa');
  const sumKg = document.getElementById('sumKg');

  const updateDate=()=>{cd.textContent=getDateKey(current); load();};
  document.getElementById('prevDay').onclick=()=>{current.setDate(current.getDate()-1);updateDate();};
  document.getElementById('nextDay').onclick=()=>{current.setDate(current.getDate()+1);updateDate();};
  updateDate();

  function load(){
    tbody.innerHTML='';
    let key = getDateKey(current);
    let jobs = loadJobs(key);
    let tHa=0, tKg=0;

    jobs.forEach((j,i)=>{
      tHa+=j.size; tKg+=j.total;
      let tr=document.createElement('tr');
      tr.innerHTML = `<td>${j.field}</td>
      <td>${j.blend}</td>
      <td>${j.rate}</td>
      <td>${j.size}</td>
      <td>${j.total}</td>
      <td><button data-i='${i}' class='del'>Delete</button></td>`;
      tbody.appendChild(tr);
    });

    sumHa.textContent = 'Total ha: '+tHa.toFixed(2);
    sumKg.textContent = 'Total kg: '+tKg.toFixed(1);

    document.querySelectorAll('.del').forEach(btn=>{
      btn.onclick=()=>{
        let key=getDateKey(current);
        let jobs=loadJobs(key);
        jobs.splice(btn.dataset.i,1);
        saveJobs(key,jobs);
        load();
      };
    });
  }
}

setupMain();
setupReport();
