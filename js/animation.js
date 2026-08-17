const counters=document.querySelectorAll(".stat-card h2");

counters.forEach(counter=>{

const update=()=>{

const target=counter.getAttribute("data-target");

if(!target) return;

const number=+counter.innerText.replace(/\D/g,'');

const goal=+target;

const speed=goal/80;

if(number<goal){

counter.innerText=Math.ceil(number+speed);

setTimeout(update,20);

}else{

counter.innerText=goal.toLocaleString();

}

}

update();

});