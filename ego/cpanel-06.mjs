const task = await taskSpace("cpanel upload");
const page = task.page("p1");
// klik folder public_html (ref 65)
await page.click("@65");
await page.waitForTimeout(3000);
const snap = await page.snapshot();
console.log(snap.slice(-5000));
