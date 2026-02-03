const ADMIN_USER = "Maseera";
const ADMIN_PASS = "2005";
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;

let notices = JSON.parse(localStorage.getItem("notices")) || [];

// ================= ADMIN LOGIN =================
function adminLogin() {
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");
    const loginBtn = document.querySelector("button");

    const u = usernameField.value.trim();
    const p = passwordField.value.trim();

    if (u === ADMIN_USER && p === ADMIN_PASS) {
        loginAttempts = 0;
        showSuccessPopup("Login Successful!");
        sessionStorage.setItem("adminLoggedIn", "true");
        setTimeout(() => window.location.href = "admin.html", 1000);
    } else {
        loginAttempts++;
        if (loginAttempts >= MAX_ATTEMPTS) {
            showHighWarning("Account Locked! Too many failed attempts.");
            usernameField.disabled = true;
            passwordField.disabled = true;
            loginBtn.disabled = true;
        } else {
            showHighWarning(`Invalid Username or Password! Attempt ${loginAttempts} of ${MAX_ATTEMPTS}`);
        }
    }
}

// ================= ALERTS =================
function showHighWarning(message) {
    const oldAlert = document.getElementById("highAlert");
    if (oldAlert) oldAlert.remove();

    const alertDiv = document.createElement("div");
    alertDiv.id = "highAlert";
    alertDiv.textContent = message;
    alertDiv.style.backgroundColor = "#ff4d4d";
    alertDiv.style.color = "white";
    alertDiv.style.padding = "15px";
    alertDiv.style.textAlign = "center";
    alertDiv.style.fontWeight = "bold";
    alertDiv.style.marginTop = "10px";
    alertDiv.style.borderRadius = "5px";
    alertDiv.style.boxShadow = "0 0 15px red";

    document.body.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
}

function showSuccessPopup(message) {
    const popup = document.createElement("div");
    popup.textContent = message;
    popup.style.position = "fixed";
    popup.style.top = "20px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%)";
    popup.style.backgroundColor = "#4CAF50";
    popup.style.color = "white";
    popup.style.padding = "20px 40px";
    popup.style.borderRadius = "10px";
    popup.style.boxShadow = "0 0 15px green";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "9999";

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

// ================= NOTICE FUNCTIONS =================
function addNotice() {
    let title = document.getElementById("title").value;
    let msg = document.getElementById("message").value;
    let cat = document.getElementById("category").value;
    let expiry = document.getElementById("expiry").value;
    let year = document.getElementById("year").value;

    if (!title || !msg || !expiry) {
        alert("Please fill all fields");
        return;
    }

    notices.push({
        title,
        msg,
        cat,
        expiry,
        year,
        read: false,
        timestamp: new Date().getTime()
    });

    localStorage.setItem("notices", JSON.stringify(notices));
    displayNotices();
    updateAnalytics();
    showSuccessPopup("Notice Added Successfully!");
}

function resetNotices() {
    if (confirm("Are you sure you want to delete all notices?")) {
        localStorage.removeItem("notices");
        notices = [];
        displayNotices();
    }
}

function deleteNotice(timestamp) {
    if (!confirm("Are you sure you want to delete this notice?")) return;

    notices = JSON.parse(localStorage.getItem("notices")) || [];
    notices = notices.filter(n => n.timestamp !== timestamp);

    localStorage.setItem("notices", JSON.stringify(notices));
    displayNotices();
    updateAnalytics();
}

// ================= EXPIRED NOTICES =================
function showExpiredNotices() {
    let list = document.getElementById("noticeList");
    if (!list) return;

    let allNotices = JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    let expired = allNotices.filter(n => n.expiry < today);

    list.innerHTML = "";

    if (expired.length === 0) {
        list.innerHTML = "<p>No expired notices.</p>";
        return;
    }

    expired.forEach(n => {
        let div = document.createElement("div");
        div.className = "notice";
        div.style.border = "2px dashed orange";

        div.innerHTML = `
            <b>${n.title}</b> (${n.cat})
            <span style="color:orange;"> [EXPIRED]</span><br>
            <b>Year:</b> ${n.year}<br>
            ${n.msg}<br>
            <small>Expired on: ${n.expiry}</small><br><br>
            <button onclick="deleteExpiredNotice(${n.timestamp})">
                Delete
            </button>
        `;

        list.appendChild(div);
    });
}

function deleteExpiredNotice(timestamp) {
    notices = JSON.parse(localStorage.getItem("notices")) || [];
    notices = notices.filter(n => n.timestamp !== timestamp);

    localStorage.setItem("notices", JSON.stringify(notices));
    showExpiredNotices();
    updateAnalytics();
}

// ================= DISPLAY NOTICES =================
function displayNotices(noticesToShow = null) {
    let list = document.getElementById("noticeList");
    if (!list) return;

    let allNotices = noticesToShow || JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    allNotices = allNotices.filter(n => n.expiry >= today);
    allNotices.sort((a, b) => b.timestamp - a.timestamp);
    list.innerHTML = "";

    let isAdminPage = window.location.pathname.endsWith("admin.html");

    allNotices.forEach(n => {
        let div = document.createElement("div");
        div.className = "notice";

        if (!isAdminPage && !n.read) {
            div.classList.add("unread");
        }

        let unreadText = (!isAdminPage && !n.read) ? "<span class='unread-text'> [UNREAD]</span>" : "";

        div.innerHTML = `
    <b>${n.title}</b> (${n.cat}) [${n.year}]<br>
    ${n.msg}<br>
    <small>Valid till: ${n.expiry}</small>

    ${!isAdminPage ? `
        <br><br>
        <button onclick="saveStudentNotice(${n.timestamp}); event.stopPropagation();">
            📌 Save
        </button>
    ` : ""}

    ${isAdminPage ? `
        <br>
        <button onclick="deleteNotice(${n.timestamp}); event.stopPropagation();">
             Delete
         </button>
    ` : ""}
`;
        div.onclick = function () {
            let stored = JSON.parse(localStorage.getItem("notices")) || [];
            let index = stored.findIndex(notice => notice.timestamp === n.timestamp);

            if (index !== -1 && !stored[index].read) {
                stored[index].read = true;
                localStorage.setItem("notices", JSON.stringify(stored));
                notices = stored;

                if (!isAdminPage) {
                    let note = document.getElementById("notification");
                    if (note) {
                        let hasUnread = allNotices.some(notice => !notice.read);
                        note.style.display = hasUnread ? "block" : "none";
                        note.textContent = hasUnread ? "🔔 New Notice Added!" : "";
                    }
                }
            }

            displayNotices();
        };

        list.appendChild(div);
    });

    if (!isAdminPage) {
        let note = document.getElementById("notification");
        if (note) {
            let hasUnread = allNotices.some(notice => !notice.read);
            note.style.display = hasUnread ? "block" : "none";
            note.textContent = hasUnread ? "🔔 New Notice Added!" : "";
        }
    }
}

// ================= FILTER =================
function filterByYear() {
    let selectedYear = document.getElementById("yearFilter").value;
    let allNotices = JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    // active notices only
    allNotices = allNotices.filter(n => n.expiry >= today);

    // Year filter
    let filtered = selectedYear === "All"
        ? allNotices
        : allNotices.filter(n => n.year === selectedYear);

    // Apply category filter if selected
    let category = document.getElementById("categoryFilter")?.value || "All";
    if (category !== "All") {
        filtered = filtered.filter(n => n.cat === category);
    }

    displayNotices(filtered);
}

function filterByCategory() {
    let selectedCat = document.getElementById("categoryFilter").value;
    let allNotices = JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    allNotices = allNotices.filter(n => n.expiry >= today);

    let filtered = selectedCat === "All" ? allNotices : allNotices.filter(n => n.cat === selectedCat);

    displayNotices(filtered);
}

// ================= DARK MODE =================
function toggleDarkMode() {
    document.body.classList.toggle("dark");
     // Determine which page we are on
    let page = "other"; // default
    const path = window.location.pathname;
    if (path.endsWith("admin.html")) page = "admin";
    else if (path.endsWith("student.html")) page = "student";
    else if (path.endsWith("adminlogin.html")) page = "login";
    const key = "darkMode_" + page;
    if (document.body.classList.contains("dark")) {
        localStorage.setItem(key, "on");
    } else {
        localStorage.setItem(key, "off");
    }
}

// ================= WINDOW ONLOAD =================
window.onload = function () {
    displayNotices();
    updateAnalytics();
     const path = window.location.pathname;
    let page = "other";
    if (path.endsWith("admin.html")) page = "admin";
    else if (path.endsWith("student.html")) page = "student";
    else if (path.endsWith("adminlogin.html")) page = "login";

    const key = "darkMode_" + page;
    if (localStorage.getItem(key) === "on") {
        document.body.classList.add("dark");
    }
};

// ================= ADMIN ANALYTICS =================
function updateAnalytics() {
    let notices = JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    let total = notices.length;
    let active = notices.filter(n => n.expiry >= today).length;
    let unread = notices.filter(n => n.read === false && n.expiry >= today).length;

    if (document.getElementById("totalCount")) {
        document.getElementById("totalCount").textContent = total;
        document.getElementById("activeCount").textContent = active;
        document.getElementById("unreadCount").textContent = unread;
    }
}
// ===== COMBINED FILTER FUNCTION FOR STUDENT PAGE =====
function applyFilters() {
    let selectedYear = document.getElementById("yearFilter").value;
    let selectedCat = document.getElementById("categoryFilter").value;

    let allNotices = JSON.parse(localStorage.getItem("notices")) || [];
    let today = new Date().toISOString().split("T")[0];

    // Only active notices
    allNotices = allNotices.filter(n => n.expiry >= today);

    // Year filter
    if (selectedYear !== "All") {
        allNotices = allNotices.filter(n => n.year === selectedYear);
    }

    // Category filter
    if (selectedCat !== "All") {
        allNotices = allNotices.filter(n => n.cat === selectedCat);
    }

    // Display filtered notices (existing displayNotices function)
    displayNotices(allNotices);
}
// ================= STUDENT SAVED NOTICES =================

// Save notice (student only)
function saveStudentNotice(timestamp) {
    let allNotices = JSON.parse(localStorage.getItem("notices")) || [];
    let saved = JSON.parse(localStorage.getItem("savedNotices_student")) || [];

    let notice = allNotices.find(n => n.timestamp === timestamp);
    if (!notice) return;

    let alreadySaved = saved.some(n => n.timestamp === timestamp);
    if (alreadySaved) {
        alert("Already saved 👍");
        return;
    }

    saved.push(notice);
    localStorage.setItem("savedNotices_student", JSON.stringify(saved));
    alert("Notice saved successfully ");
}

// View saved notices
function showSavedStudentNotices() {
    let list = document.getElementById("noticeList");
    let saved = JSON.parse(localStorage.getItem("savedNotices_student")) || [];

    list.innerHTML = "";

    if (saved.length === 0) {
        list.innerHTML = "<p>No saved notices.</p>";
        return;
    }

    saved.forEach(n => {
        let div = document.createElement("div");
        div.className = "notice";

        div.innerHTML = `
            <b>${n.title}</b> (${n.cat}) [${n.year}]<br>
            ${n.msg}<br>
            <small>Valid till: ${n.expiry}</small><br><br>
            <button onclick="removeSavedNotice(${n.timestamp})">
                Remove
            </button>
        `;

        list.appendChild(div);
    });
}

// Remove saved notice
function removeSavedNotice(timestamp) {
    let saved = JSON.parse(localStorage.getItem("savedNotices_student")) || [];
    saved = saved.filter(n => n.timestamp !== timestamp);
    localStorage.setItem("savedNotices_student", JSON.stringify(saved));
    showSavedStudentNotices();
}