function showNotification(title,message){

const box=document.createElement("div");

box.className="notification";

box.innerHTML=`
<h3>${title}</h3>
<p>${message}</p>
`;

document.body.appendChild(box);

setTimeout(()=>{

box.classList.add("show");

},100);

setTimeout(()=>{

box.classList.remove("show");

setTimeout(()=>{

box.remove();

},500);

},4000);

}