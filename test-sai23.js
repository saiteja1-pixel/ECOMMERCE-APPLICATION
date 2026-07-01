const url = "https://puxwyhzdfocswcoummsc.supabase.co/auth/v1/signup";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1eHd5aHpkZm9jc3djb3VtbXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTQxODksImV4cCI6MjA5ODIzMDE4OX0.5nPCTPbJk0napfWU0n9HW252qWgAV5aH-7JeLSPAWhs";

async function testSignup() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "sai23@gmail.com",
        password: "Password123",
        data: {
          full_name: "sai",
          role: "customer"
        }
      })
    });
    console.log("Status:", res.status);
    console.log("StatusText:", res.statusText);
    const json = await res.json();
    console.log("JSON response:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testSignup();
