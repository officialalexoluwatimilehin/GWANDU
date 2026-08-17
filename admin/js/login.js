alert("ADMIN LOGIN JS LOADED");

document.getElementById("loginBtn").addEventListener("click", async () => {

    const email =
    document.getElementById("email").value.trim();

    const password =
    document.getElementById("password").value.trim();

    const message =
    document.getElementById("message");

    try{

        const res = await fetch(API_URL + "/admin/login",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({

                email,
                password

            })

        });

        const data = await res.json();

        if(!res.ok){

            message.innerText=data.error;

            return;

        }

        localStorage.setItem("adminToken",data.token);

        window.location.href="dashboard.html";

    }

    catch{

        message.innerText="Server error.";

    }

});