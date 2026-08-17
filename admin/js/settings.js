const token = localStorage.getItem("adminToken");

async function loadSettings(){

const res = await fetch(API_URL+"/admin/settings",{

headers:{
Authorization:"Bearer "+token
}

});

const data = await res.json();

Object.keys(data).forEach(key=>{

const el=document.getElementById(key);

if(el){

el.value=data[key];

}

});

}

document.getElementById("saveBtn").addEventListener("click",async()=>{

const body={

companyName:companyName.value,
heroTitle:heroTitle.value,
heroSubtitle:heroSubtitle.value,
supportEmail:supportEmail.value,
supportPhone:supportPhone.value,
whatsapp:whatsapp.value,
btcWallet:btcWallet.value,
usdtTrc20:usdtTrc20.value,
usdtBep20:usdtBep20.value,
usdtErc20:usdtErc20.value,
solWallet:solWallet.value,
tonWallet:tonWallet.value,
bankName:bankName.value,
bankAccountName:bankAccountName.value,
bankAccountNumber:bankAccountNumber.value

};

const res=await fetch(API_URL+"/admin/settings",{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:"Bearer "+token

},

body:JSON.stringify(body)

});

const data=await res.json();

alert(data.message);

});

loadSettings();