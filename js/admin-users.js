const token = localStorage.getItem("adminToken");

if (!token) {
    window.location.href = "login.html";
}

let users = [];

async function loadUsers(){

const res = await fetch(

API_URL+"/admin/users",

{

headers:{

Authorization:"Bearer "+token

}

}

);

const data = await res.json();

if (!res.ok) {
    alert(data.error);
    return;
}

users = data;

display(users);

}
function display(data){

const table=document.getElementById("usersTable");

table.innerHTML="";

data.forEach(user=>{

table.innerHTML+=`

<tr>

<td>${user.name}</td>

<td>${user.email}</td>

<td>$${user.balance}</td>

<td>$${user.referralBalance}</td>

<td>$${Array.isArray(user.investments)
    ? user.investments.reduce(
        (sum, investment) =>
            sum + (
                investment.status === "Active"
                    ? Number(investment.amount) || 0
                    : 0
            ),
        0
      )
    : 0}</td>
<td>

<button onclick="credit('${user._id}')">

Credit

</button>

<button onclick="deduct('${user._id}')">

Deduct

</button>

<button onclick="block('${user._id}')">
${user.isBlocked ? "Unblock" : "Block"}
</button>

<button onclick="removeUser('${user._id}')">

Delete

</button>

</td>
</tr>

`;

});

}

function searchUser(){

const keyword=document

.getElementById("search")

.value

.toLowerCase();

const filtered = users.filter(u=>

u.name.toLowerCase().includes(keyword)

||

u.email.toLowerCase().includes(keyword)

);

display(filtered);

}

loadUsers();
async function credit(id) {

    const amount = prompt("Enter amount to credit");

    if (!amount) return;

    console.log("ID:", id);
    console.log("Amount:", amount);

    try {

        const res = await fetch(API_URL + "/admin/credit/" + id, {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                Authorization: "Bearer " + token

            },

            body: JSON.stringify({
                amount: Number(amount)
            })

        });

        console.log("Status:", res.status);

        const data = await res.json();

        console.log(data);

        loadUsers();

    } catch (err) {

        console.error(err);

    }

}
async function deduct(id){

const amount=prompt("Enter amount to deduct");

if(!amount)return;

await fetch(API_URL+"/admin/deduct/"+id,{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:"Bearer "+token

},

body:JSON.stringify({

amount:Number(amount)

})

});

loadUsers();

}
async function block(id){

await fetch(

API_URL+"/admin/block/"+id,

{

method:"POST",

headers:{

Authorization:"Bearer "+token

}

}

);

loadUsers();

}

async function removeUser(id){

if(!confirm("Delete this user?")) return;

await fetch(

API_URL+"/admin/delete/"+id,

{

method:"DELETE",

headers:{

Authorization:"Bearer "+token

}

}

);

loadUsers();

}
