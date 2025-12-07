const https = require('https');

// YOUR KEY
const API_KEY = "AIzaSyBemW_uy0ycRtqDTYtd-ZUyAF4LzyAlZQY";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Contacting Google API directly...");

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log("------------------------------------------------");
    console.log(`Status Code: ${res.statusCode}`);
    
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error("❌ GOOGLE ERROR:", json.error.message);
        console.error("Reason:", json.error.details ? JSON.stringify(json.error.details) : "Unknown");
      } else if (json.models) {
        console.log("✅ SUCCESS! The following models are available to you:");
        json.models.forEach(m => console.log(` - ${m.name.replace('models/', '')}`));
      } else {
        console.log("⚠️ Unexpected Response:", data);
      }
    } catch (e) {
      console.log("Raw Data:", data);
    }
    console.log("------------------------------------------------");
  });
}).on("error", (err) => {
  console.log("❌ NETWORK ERROR:", err.message);
});