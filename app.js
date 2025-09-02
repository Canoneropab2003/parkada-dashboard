/* ---------- Mock Data ---------- */
const state = {
  userName: "Student",
  slots: generateSlots(48), // 6 rows x 8 cols
  activities: [
    { type:"enter", text:"Vehicle ABC-1234 entered at Gate 2", time:"08:15 AM" },
    { type:"reserve", text:"Slot A-12 reserved for XYZ-7788", time:"08:22 AM" },
    { type:"exit", text:"Vehicle TUV-9001 exited", time:"08:40 AM" },
    { type:"enter", text:"Vehicle KLM-5678 entered at Gate 1", time:"09:05 AM" },
  ],
  paymentsBySemester: {
    "1st Semester, AY 2025-2026": [
      { vehicle:"Car", plate:"ABC-1234", status:"Paid",   date:"2025-08-15", amount:2500 },
      { vehicle:"Motorcycle", plate:"MTR-001", status:"Pending", date:"2025-08-20", amount:1200 },
    ],
    "2nd Semester, AY 2024-2025": [
      { vehicle:"Car", plate:"XYZ-7788", status:"Paid",   date:"2025-02-01", amount:2500 },
      { vehicle:"Car", plate:"TUV-9001", status:"Paid",   date:"2025-02-10", amount:2500 },
    ]
  },
  notifications: [
    { id:1, title:"Payment reminder", body:"Semester fee due in 5 days.", time:"Yesterday", unread:true, icon:"bell" },
    { id:2, title:"Parking alert", body:"Your vehicle ABC-1234 is parked at A-05.", time:"1h ago", unread:true, icon:"car" },
    { id:3, title:"Reservation confirmed", body:"Slot A-12 reserved 10:00 AM - 12:00 PM.", time:"Today", unread:false, icon:"calendar" },
  ],
};

/* ---------- Utilities ---------- */
function generateSlots(n){
  // Create a mix of available/occupied/reserved with some plates
  const statuses = ["available","occupied","reserved"];
  const plates = ["ABC-1234","XYZ-7788","TUV-9001","KLM-5678","JPN-2468","PHL-4321","MTR-001","CAR-8888"];
  const arr = [];
  for(let i=1;i<=n;i++){
    const status = statuses[Math.floor(Math.random()*statuses.length)];
    const plate = status === "available" ? "" : plates[Math.floor(Math.random()*plates.length)];
    const section = "A";
    arr.push({ id:i, section, slot:`A-${String(i).padStart(2,"0")}`, status, plate, since:"09:00" });
  }
  return arr;
}

function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function pct(part,total){ return total ? Math.round((part/total)*100) : 0; }

/* ---------- Routing ---------- */
const pages = $all(".page");
const navItems = $all(".nav-item, .icon-btn[data-route], .profile-btn");
function setRoute(route){
  pages.forEach(p => p.classList.toggle("page--active", p.dataset.route===route));
  $all(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.route===route));
  // update badges when opening notifications
  if(route==="notifications"){ markAllSeen(); }
}
navItems.forEach(btn => btn.addEventListener("click", () => setRoute(btn.dataset.route)));

/* ---------- Sidebar toggle (mobile) ---------- */
const sidebar = document.querySelector("#sidebar");
const sidebarToggle = document.querySelector("#sidebarToggle");

if (sidebar && sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}


/* ---------- Topbar / User ---------- */
$("#username").textContent = state.userName;

/* ---------- Dashboard Stats ---------- */
function renderStats(){
  const total = state.slots.length;
  const available = state.slots.filter(s=>s.status==="available").length;
  const occupied = state.slots.filter(s=>s.status==="occupied").length;
  const reserved = state.slots.filter(s=>s.status==="reserved").length;
  const utilization = pct(occupied+reserved, total);

  $("#totalSlots").textContent = total;
  $("#availableSlots").textContent = available;
  $("#occupiedSlots").textContent = occupied;
  $("#reservedSlots").textContent = reserved;

  $("#capacityUtil").textContent = utilization+"%";
  $("#availablePct").textContent = pct(available,total)+"%";
  $("#occupiedPct").textContent = pct(occupied,total)+"%";
  $("#reservedPct").textContent = pct(reserved,total)+"%";

  $("#totalProgress").style.width = utilization+"%";
  $("#availableProgress").style.width = pct(available,total)+"%";
  $("#occupiedProgress").style.width = pct(occupied,total)+"%";
  $("#reservedProgress").style.width = pct(reserved,total)+"%";
}

/* ---------- Parking Map ---------- */
function slotEl(slot){
  const el = document.createElement("div");
  el.className = "slot";
  el.dataset.status = slot.status;
  el.title = `${slot.slot} • ${slot.status.toUpperCase()}${slot.plate ? ` • ${slot.plate}`:""}`;
  el.innerHTML = `
    <div class="label">${slot.plate || "—"}</div>
    <div class="meta">${slot.slot}</div>
  `;
  return el;
}
function renderParking(){
  const grid = $("#parkingGrid");
  const gridFull = $("#parkingGridFull");
  grid.innerHTML = "";
  gridFull.innerHTML = "";
  state.slots.forEach((s, i) => {
    if(i<24) grid.appendChild(slotEl(s));      // Section A preview on Dashboard
    gridFull.appendChild(slotEl(s));           // Full map
  });
}

/* ---------- Recent Activity ---------- */
function iconFor(type){
  const p = document.createElement("span");
  p.className = "icon";
  p.innerHTML = ({
    enter:'<svg viewBox="0 0 24 24"><path d="M10 17l1.41-1.41L8.83 13H21v-2H8.83l2.58-2.59L10 7l-5 5 5 5z"/></svg>',
    exit:'<svg viewBox="0 0 24 24"><path d="M14 7l-1.41 1.41L15.17 11H3v2h12.17l-2.58 2.59L14 17l5-5-5-5z"/></svg>',
    reserve:'<svg viewBox="0 0 24 24"><path d="M6 2h12a2 2 0 012 2v16l-8-3-8 3V4a2 2 0 012-2z"/></svg>'
  })[type] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
  return p;
}
function renderActivity(){
  const list = $("#activityList");
  list.innerHTML = "";
  state.activities.forEach(a=>{
    const row = document.createElement("div");
    row.className = "activity-item";
    const txt = document.createElement("div");
    txt.textContent = a.text;
    const when = document.createElement("div");
    when.className = "when";
    when.textContent = a.time;
    row.appendChild(iconFor(a.type));
    row.appendChild(txt);
    row.appendChild(when);
    list.appendChild(row);
  });
}

/* ---------- Payments ---------- */
function statusBadge(status){
  const s = status.toLowerCase();
  const cls = s==="paid" ? "badge--green" : s==="pending" ? "badge--yellow" : "badge--red";
  return `<span class="badge-inline ${cls}">${status}</span>`;
}
function renderPayments(){
  const container = $("#paymentsContainer");
  container.innerHTML = "";
  Object.entries(state.paymentsBySemester).forEach(([sem, rows])=>{
    const details = document.createElement("details");
    details.className = "semester";
    details.open = true;

    const summary = document.createElement("summary");
    const money = rows.reduce((acc,r)=>acc+r.amount,0);
    summary.innerHTML = `<span>${sem}</span><span>₱ ${money.toLocaleString()}</span>`;
    details.appendChild(summary);

    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Vehicle Type</th><th>Plate Number</th><th>Status</th><th>Date</th><th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r=>`
          <tr>
            <td>${r.vehicle}</td>
            <td>${r.plate}</td>
            <td>${statusBadge(r.status)}</td>
            <td>${r.date}</td>
            <td>₱ ${r.amount.toLocaleString()}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    details.appendChild(table);
    container.appendChild(details);
  });
}

/* ---------- Notifications ---------- */
function noticeIcon(kind){
  const map = {
    bell:'<svg viewBox="0 0 24 24"><path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm8-6V11a8 8 0 10-16 0v5l-2 2v1h20v-1l-2-2z"/></svg>',
    car:'<svg viewBox="0 0 24 24"><path d="M5 11l1-3a3 3 0 012.83-2h6.34A3 3 0 0118 8l1 3h1a1 1 0 010 2h-1v3a1 1 0 11-2 0v-3H7v3a1 1 0 11-2 0v-3H4a1 1 0 110-2h1z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><path d="M7 2h2v2h6V2h2v2h3a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h3V2zM4 10h16v10H4V10z"/></svg>'
  };
  return map[kind] || map.bell;
}
function renderNotifications(){
  const list = $("#notificationsList");
  list.innerHTML = "";
  state.notifications.forEach(n=>{
    const row = document.createElement("div");
    row.className = "notice" + (n.unread ? " unread" : "");
    row.innerHTML = `
      <div class="icon">${noticeIcon(n.icon)}</div>
      <div>
        <div class="title">${n.title}</div>
        <div class="body">${n.body}</div>
      </div>
      <div class="time">${n.time}</div>
    `;
    row.addEventListener("click", ()=>{
      n.unread = false;
      renderNotifications();
      updateBadges();
    });
    list.appendChild(row);
  });
}
function updateBadges(){
  const unread = state.notifications.filter(n=>n.unread).length;
  $("#sidebarBadge").textContent = unread;
  $("#topbarBadge").textContent = unread;
  $("#sidebarBadge").style.display = unread ? "inline-block":"none";
  $("#topbarBadge").style.display = unread ? "inline-block":"none";
}
function markAllSeen(){
  state.notifications.forEach(n=>n.unread=false);
  renderNotifications();
  updateBadges();
}

/* ---------- Search ---------- */
$("#searchInput").addEventListener("input", (e)=>{
  const q = e.target.value.trim().toLowerCase();
  // Simple filter: highlight matching slots and notices
  $all(".slot").forEach(el=>{
    const text = el.textContent.toLowerCase();
    el.style.outline = q && text.includes(q) ? "3px solid #c7d2fe" : "none";
  });
  $all(".notice").forEach(el=>{
    const text = el.textContent.toLowerCase();
    el.style.boxShadow = q && text.includes(q) ? "0 0 0 3px #e0e7ff inset" : "";
  });
});

/* ---------- Actions ---------- */
$("#paySemesterBtn").addEventListener("click", ()=>{
  alert("Redirecting to payment gateway (demo).");
});
$("#downloadReceiptsBtn").addEventListener("click", ()=>{
  alert("Generating receipts (demo).");
});
$("#markAllReadBtn").addEventListener("click", markAllSeen);


/* ---------- Init ---------- */
function init(){
  renderStats();
  renderParking();
  renderActivity();
  renderPayments();
  renderNotifications();
  updateBadges();
}
init();

const avatarInput = document.getElementById("avatar-input");
const avatarImg = document.getElementById("profile-avatar");
const avatarSmall = document.getElementById("profile-avatar-small");
const changeAvatarBtn = document.getElementById("change-avatar-btn");

// Open file picker
changeAvatarBtn.addEventListener("click", () => {
  avatarInput.click();
});

// Preview + Sync uploaded photo
avatarInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarImg.src = e.target.result;       // Big avatar
      avatarSmall.src = e.target.result;     // Small avatar (button)
    };
    reader.readAsDataURL(file);
  }
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  Swal.fire({
    title: "Logged Out",
    text: "You have successfully logged out.",
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#3085d6",
    background: "#f9f9f9",
    color: "#333",
    customClass: {
      popup: "rounded-2xl shadow-lg"
    }
  }).then(() => {
    window.location.href = "https://canoneropab2003.github.io/parkada/";
  });
});


auth.onAuthStateChanged((user) => {
  if (user) {
    db.collection("users").doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const userData = doc.data();

          // Update Email & Role
          document.getElementById("userEmail").textContent = "Email: " + userData.email;
          document.getElementById("userRole").textContent = "Role: " + userData.role;

          // Toggle Year Level visibility
          const yearEl = document.getElementById("userYear");
          if (userData.role === "Student") {
            yearEl.classList.remove("hidden");
            yearEl.textContent = "Year Level: " + (userData.yearLevel || "Not Provided");
          } else {
            yearEl.classList.add("hidden");
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  } else {
    document.getElementById("userEmail").textContent = "Email: Guest";
    document.getElementById("userRole").textContent = "Role: N/A";
    document.getElementById("userYear").classList.add("hidden");
  }
});

