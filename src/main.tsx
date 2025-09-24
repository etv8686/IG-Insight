console.log("Script loading...");

const root = document.getElementById("root");
if (root) {
  root.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Unfollow Checker</h1>
      <p>App is working!</p>
      <button onclick="alert('Button clicked!')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
        Test Button
      </button>
    </div>
  `;
  console.log("Content added to root!");
} else {
  console.error("Root element not found");
}