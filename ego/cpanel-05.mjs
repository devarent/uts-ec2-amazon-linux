const task = await taskSpace("cpanel upload");
const page = task.page("p1");
await page.click("@26"); // tombol Go
await page.waitForTimeout(4000);
const snap = await page.snapshot();
// cari daftar file di public_html
const idx = snap.indexOf("public_html");
console.log(snap.slice(Math.max(0, idx - 200), idx + 4000));
