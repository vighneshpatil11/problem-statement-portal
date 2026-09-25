const STORAGE_KEY = "problem_statement_portal_v1";
let problems = loadProblems();
let activeProblemId = null;

const $ = (id) => document.getElementById(id);

function loadProblems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProblems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function render() {
  const query = $("searchInput").value.trim().toLowerCase();
  const filtered = problems.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.creator.name.toLowerCase().includes(query)
  );

  $("problemCount").textContent = problems.length;
  $("teamCount").textContent = problems.length;
  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("problemList").innerHTML = filtered.map(cardHTML).join("");
}

function cardHTML(p) {
  const count = p.members.length;
  const full = count >= 5;
  const percent = Math.min(count / 5 * 100, 100);

  return `
    <article class="problem-card">
      <div class="card-top">
        <div>
          <h4>${escapeHTML(p.title)}</h4>
          <p class="description">${escapeHTML(p.description)}</p>
          <div class="creator">Added by <b>${escapeHTML(p.creator.name)}</b> · Roll No. ${escapeHTML(p.creator.roll)}</div>
        </div>
      </div>

      <div class="team">
        <div class="team-head">
          <span>Team members</span>
          <span class="badge ${full ? "full" : ""}">${count}/5</span>
        </div>
        <div class="progress"><span style="width:${percent}%"></span></div>
        <div class="members">
          ${p.members.map((m, i) =>
            `<span class="member">${i + 1}. ${escapeHTML(m.name)} · ${escapeHTML(m.roll)}</span>`
          ).join("")}
        </div>
        <div class="join-row">
          <button class="join-btn" data-join="${p.id}" ${full ? "disabled" : ""}>
            ${full ? "Team Full" : "I'm Interested / Join"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function openAdd() {
  $("addSection").classList.remove("hidden");
  $("problemTitle").focus();
  window.scrollTo({ top: $("addSection").offsetTop - 20, behavior: "smooth" });
}

function closeAdd() {
  $("addSection").classList.add("hidden");
}

function openJoin(id) {
  const p = problems.find(x => x.id === id);
  if (!p || p.members.length >= 5) return;

  activeProblemId = id;
  $("joinTitle").textContent = `Join: ${p.title}`;
  $("joinDescription").textContent = `${p.members.length}/5 members currently. Enter your details if you are interested.`;
  $("joinModal").classList.remove("hidden");
  $("joinName").focus();
}

function closeJoin() {
  activeProblemId = null;
  $("joinModal").classList.add("hidden");
  $("joinForm").reset();
}

$("addBtn").addEventListener("click", openAdd);
$("emptyAdd").addEventListener("click", openAdd);
$("closeAdd").addEventListener("click", closeAdd);
$("browseBtn").addEventListener("click", () => {
  $("listSection").scrollIntoView({ behavior: "smooth" });
});
$("searchInput").addEventListener("input", render);

$("problemForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = $("creatorName").value.trim();
  const roll = $("creatorRoll").value.trim();

  const problem = {
    id: uid(),
    title: $("problemTitle").value.trim(),
    description: $("problemDescription").value.trim(),
    creator: { name, roll },
    members: [{ name, roll }],
    createdAt: new Date().toISOString()
  };

  problems.unshift(problem);
  saveProblems();
  render();
  e.target.reset();
  closeAdd();
  showToast("Problem statement added. You are Member 1!");
  $("listSection").scrollIntoView({ behavior: "smooth" });
});

$("problemList").addEventListener("click", e => {
  const button = e.target.closest("[data-join]");
  if (button) openJoin(button.dataset.join);
});

$("closeJoin").addEventListener("click", closeJoin);

$("joinModal").addEventListener("click", e => {
  if (e.target === $("joinModal")) closeJoin();
});

$("joinForm").addEventListener("submit", e => {
  e.preventDefault();

  const p = problems.find(x => x.id === activeProblemId);
  if (!p) return;

  if (p.members.length >= 5) {
    showToast("This team is already full.");
    closeJoin();
    return;
  }

  const name = $("joinName").value.trim();
  const roll = $("joinRoll").value.trim();
  const normalizedRoll = roll.toLowerCase();

  const alreadyJoined = p.members.some(m => m.roll.toLowerCase() === normalizedRoll);
  if (alreadyJoined) {
    showToast("This roll number is already in the team.");
    return;
  }

  p.members.push({ name, roll });
  saveProblems();
  render();
  closeJoin();
  showToast("You have joined the team!");
});

render();
