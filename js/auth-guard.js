const authToken = localStorage.getItem("token");

if (!authToken) {
    window.location.href = "login.html";
} else {

    try {

        const payload = JSON.parse(
            atob(authToken.split(".")[1])
        );

        const now = Date.now() / 1000;

        if (payload.exp && payload.exp < now) {

            localStorage.removeItem("token");
            localStorage.removeItem("adminToken");

            window.location.href = "login.html";

        }

    } catch (err) {

        localStorage.removeItem("token");
        localStorage.removeItem("adminToken");

        window.location.href = "login.html";

    }

}