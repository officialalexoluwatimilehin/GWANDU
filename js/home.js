async function loadStats(){

try{

const response = await fetch("http://localhost:5000/stats");

const data = await response.json();

document.getElementById("usersCount").textContent =
data.totalUsers;

document.getElementById("depositCount").textContent =
"$" + Number(data.totalDeposits).toLocaleString();

document.getElementById("investmentCount").textContent =
"$" + Number(data.totalInvestments).toLocaleString();

}catch(error){

console.log(error);

}

}

loadStats();
const notifications = [
"🇺🇸 Michael Johnson invested $25,000",
"🇬🇧 Sarah Williams invested $5,000",
"🇳🇬 David Ade invested $100,000",
"🇨🇦 Emma Brown invested $50,000",
"🇦🇪 Ibrahim Hassan invested $500,000",
"🇸🇬 Richard Lee invested $2,000,000",

"🇺🇸 Michael Johnson withdrew $150,000",
"🇬🇧 Sarah Williams withdrew $30,000",
"🇳🇬 David Ade withdrew $600,000",
"🇨🇦 Emma Brown withdrew $300,000",
"🇦🇪 Ibrahim Hassan withdrew $3,000,000",
"🇸🇬 Richard Lee withdrew $12,000,000"
];

function showNotification(){

const box = document.getElementById("liveNotification");

const text = notifications[Math.floor(Math.random() * notifications.length)];

box.textContent = text;

box.style.display = "block";

setTimeout(() => {

    box.style.display = "none";

},5000);

}

setInterval(showNotification,12000);

showNotification();
/* ===========================
LOADING SCREEN
=========================== */

window.addEventListener("load", () => {

setTimeout(() => {

document.getElementById("loader").classList.add("hide");

},1800);

});
/* ===========================
ANIMATED STATISTICS
=========================== */

function animateCounter(element, target, prefix = "", suffix = "") {

let current = 0;

const increment = target / 120;

const timer = setInterval(() => {

current += increment;

if(current >= target){

current = target;

clearInterval(timer);

}

element.innerHTML = prefix + Math.floor(current).toLocaleString() + suffix;

},15);

}

window.addEventListener("load", () => {

setTimeout(()=>{

animateCounter(document.querySelectorAll(".stat-card h2")[0],250,"$","M+");

animateCounter(document.querySelectorAll(".stat-card h2")[1],98500,"","+");

animateCounter(document.querySelectorAll(".stat-card h2")[2],147);

},500);

});
/* ===========================
BACK TO TOP
=========================== */

const topBtn = document.getElementById("topBtn");

if (topBtn) {

window.addEventListener("scroll", () => {

topBtn.style.display = window.scrollY > 500 ? "block" : "none";

});

topBtn.onclick = () => {

window.scrollTo({

top: 0,

behavior: "smooth"

});

};

}
/* ===========================
FAQ
=========================== */

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

const answer = item.querySelector("p");

if (answer) {

answer.style.display = "none";

}

item.addEventListener("click", () => {

const isOpen = answer.style.display === "block";

faqItems.forEach(f => {

const p = f.querySelector("p");

if (p) p.style.display = "none";

});

if (!isOpen && answer) {

answer.style.display = "block";

}

});

});
/* FAQ */
/* FAQ */

document.querySelectorAll(".faq-question").forEach(question => {

    question.addEventListener("click", () => {

        const item = question.parentElement;

        item.classList.toggle("active");

    });

});
/* ===========================
LIVE INVESTMENT NOTIFICATION
=========================== */

const investors = [

{flag:"🇺🇸",name:"Michael J.",text:"Invested $25,000"},

{flag:"🇬🇧",name:"Sarah W.",text:"Withdrew $42,000"},

{flag:"🇨🇦",name:"David P.",text:"Invested $50,000"},

{flag:"🇳🇬",name:"Samuel A.",text:"Invested $10,000"},

{flag:"🇦🇪",name:"Ahmed R.",text:"Withdrew $120,000"},

{flag:"🇩🇪",name:"Lucas M.",text:"Invested $100,000"}

];

const notification = document.getElementById("liveNotification");
const flag = notification ? notification.querySelector(".notify-flag") : null;
const name = document.getElementById("notifyName");
const text = document.getElementById("notifyText");
const time = document.getElementById("notifyTime");

function randomNotification(){

if(!notification || !flag || !name || !text || !time){
    return;
}

const item = investors[Math.floor(Math.random() * investors.length)];

flag.textContent = item.flag;
name.textContent = item.name;
text.textContent = item.text;
time.textContent = Math.floor(Math.random()*8+1) + " minutes ago";

notification.classList.add("show");

setTimeout(() => {
    notification.classList.remove("show");
},5000);

}
setInterval(randomNotification,9000);

setTimeout(randomNotification,3000);
const deposits = [
"🇺🇸 Michael J. - Deposited $25,000",
"🇬🇧 Sarah W. - Deposited $5,000",
"🇳🇬 David A. - Deposited $100,000",
"🇨🇦 Emma B. - Deposited $50,000",
"🇦🇪 Ahmed R. - Deposited $500,000",
"🇸🇬 Richard L. - Deposited $2,000,000"
];

const withdrawals = [
"🇺🇸 Michael J. - Withdrew $150,000",
"🇬🇧 Sarah W. - Withdrew $30,000",
"🇳🇬 David A. - Withdrew $600,000",
"🇨🇦 Emma B. - Withdrew $300,000",
"🇦🇪 Ahmed R. - Withdrew $3,000,000",
"🇸🇬 Richard L. - Withdrew $12,000,000"
];

function updateTicker(id, list){

const box = document.getElementById(id);

if(!box) return;

let html = "";

list.forEach(item=>{
    html += `<div class="ticker-item">${item}</div>`;
});

box.innerHTML = html;

}

updateTicker("depositTicker", deposits);
updateTicker("withdrawTicker", withdrawals);
const observer = new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

});

document.querySelectorAll("section").forEach(section=>{

section.classList.add("hidden");

observer.observe(section);

});