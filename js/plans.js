function activatePlan(amount) {

    // Save the selected investment amount
    localStorage.setItem("selectedPlanAmount", amount);

    // Go to the deposit page
    window.location.href = "deposit.html";

}