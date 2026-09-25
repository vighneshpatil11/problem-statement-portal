const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let problems=[]; let activeProblemId=null;
const $=id=>document.getElementById(id);
function configured(){return SUPABASE_URL.startsWith("http")&&!SUPABASE_ANON_KEY.includes("YOUR_")}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(m){const e=$("toast");e.textContent=m;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2800)}

async function loadProblems(){
 if(!configured()){ $("problemList").innerHTML=`<div class="form-note">Supabase is not configured. Add your credentials to <b>config.js</b>.</div>`;return}
 const {data,error}=await db.from("problems").select(`statement_id,id,title,description,creator_name,creator_roll,created_at,team_members(id,name,roll_no,joined_at)`).order("created_at",{ascending:false});
 if(error){console.error(error);toast("Could not load statements.");return}
 problems=data||[];render();
}
function render(){
 const q=$("searchInput").value.trim().toLowerCase();
 const list=problems.filter(p=>`${p.statement_id} ${p.title} ${p.description} ${p.creator_name}`.toLowerCase().includes(q));
 $("problemCount").textContent=problems.length;
 $("interestCount").textContent=problems.reduce((s,p)=>s+(p.team_members?.length||0),0);
 $("problemList").innerHTML=list.map(card).join("");
 $("emptyState").classList.toggle("hidden",list.length!==0);
}
function card(p){
 const ms=p.team_members||[];
 return `<article class="problem-card">
 <div class="card-head"><span class="statement-id">${esc(p.statement_id)}</span><span class="interest-count">${ms.length} interested</span></div>
 <h3>${esc(p.title)}</h3><p class="description">${esc(p.description)}</p>
 <div class="creator">By <b>${esc(p.creator_name)}</b><span class="ideator">✦ IDEATOR</span> · Roll ${esc(p.creator_roll)}</div>
 <div class="interest-box"><div class="interest-head"><b>Interested students</b><span>${ms.length}</span></div>
 ${ms.length?`<div class="members">${ms.map(m=>`<span class="member">${esc(m.name)} · ${esc(m.roll_no)}</span>`).join("")}</div>`:`<div class="no-interest">No one has shown interest yet.</div>`}
 <div class="join-row"><button class="join-btn" data-join="${p.id}">I'm interested →</button></div></div></article>`;
}
function openAdd(){$("addSection").classList.remove("hidden");$("problemTitle").focus();$("addSection").scrollIntoView({behavior:"smooth",block:"center"})}
function closeAdd(){$("addSection").classList.add("hidden")}
function openJoin(id){const p=problems.find(x=>x.id===id);if(!p)return;activeProblemId=id;$("joinTitle").textContent=`Join ${p.statement_id}`;$("joinDescription").textContent=p.title;$("joinModal").classList.remove("hidden");$("joinName").focus()}
function closeJoin(){activeProblemId=null;$("joinModal").classList.add("hidden");$("joinForm").reset()}

$("addBtn").onclick=openAdd;$("closeAdd").onclick=closeAdd;$("browseBtn").onclick=()=>$("listSection").scrollIntoView({behavior:"smooth"});$("searchInput").oninput=render;
$("problemForm").onsubmit=async e=>{
 e.preventDefault();const payload={title:$("problemTitle").value.trim(),description:$("problemDescription").value.trim(),creator_name:$("creatorName").value.trim(),creator_roll:$("creatorRoll").value.trim()};
 const {data,error}=await db.from("problems").insert(payload).select("statement_id").single();
 if(error){console.error(error);toast("Could not publish the statement.");return}
 e.target.reset();closeAdd();toast(`${data.statement_id} published — you are the Ideator!`);await loadProblems();$("listSection").scrollIntoView({behavior:"smooth"});
};
$("problemList").onclick=e=>{const b=e.target.closest("[data-join]");if(b)openJoin(b.dataset.join)};
$("closeJoin").onclick=closeJoin;$("joinModal").onclick=e=>{if(e.target===$("joinModal"))closeJoin()};
$("joinForm").onsubmit=async e=>{
 e.preventDefault();const {error}=await db.from("team_members").insert({problem_id:activeProblemId,name:$("joinName").value.trim(),roll_no:$("joinRoll").value.trim()});
 if(error){toast(error.code==="23505"?"This roll number is already interested in this statement.":"Could not register your interest.");return}
 closeJoin();toast("Your interest has been recorded.");await loadProblems();
};

$("adminBtn").onclick=()=>$("adminModal").classList.remove("hidden");$("closeAdmin").onclick=()=>$("adminModal").classList.add("hidden");
$("adminLoginForm").onsubmit=async e=>{
 e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
 if(error){toast("Invalid admin login.");return}$("adminModal").classList.add("hidden");e.target.reset();openAdminPanel();
};
async function openAdminPanel(){const {data:{user}}=await db.auth.getUser();if(!user)return;$("adminPanel").classList.remove("hidden");renderAdmin()}
$("closeAdminPanel").onclick=()=>$("adminPanel").classList.add("hidden");
async function renderAdmin(){
 const {data,error}=await db.from("problems").select("id,statement_id,title,creator_name,creator_roll,created_at").order("created_at",{ascending:false});
 if(error){toast("Could not load admin panel.");return}
 $("adminList").innerHTML=(data||[]).map(p=>`<div class="admin-item"><div><b>${esc(p.statement_id)} — ${esc(p.title)}</b><small>${esc(p.creator_name)} · ${esc(p.creator_roll)}</small></div><button class="delete-btn" data-delete="${p.id}">Delete</button></div>`).join("")||`<div class="no-interest">No statements.</div>`;
}
$("adminList").onclick=async e=>{
 const b=e.target.closest("[data-delete]");if(!b)return;const p=problems.find(x=>x.id===b.dataset.delete);
 if(!confirm(`Delete ${p?`${p.statement_id} — ${p.title}`:"this statement"}?`))return;
 const {error}=await db.from("problems").delete().eq("id",b.dataset.delete);
 if(error){toast("Delete failed.");return}toast("Statement deleted.");await loadProblems();renderAdmin();
};
$("logoutBtn").onclick=async()=>{await db.auth.signOut();$("adminPanel").classList.add("hidden");toast("Signed out.")};

if(configured())loadProblems();else $("problemList").innerHTML=`<div class="form-note">Add your Supabase credentials to <b>config.js</b> to activate the live board.</div>`;
