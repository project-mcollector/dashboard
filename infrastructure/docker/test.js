fetch("http://localhost:5003/api/auth/register", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "vladqwe11@yandex.ru", password: "Password123!", organizationName: "ooo" })
}).then(async res => {
    try {
        await res.json();
    } catch (e) {
        console.log("JSON failed, trying text");
        try {
            await res.text();
            console.log("Text success");
        } catch (e2) {
            console.log("Text failed too:", e2.message);
        }
    }
});
