const task = await taskSpace("cpanel upload");
const page = task.page("p1");
await page.goto("https://wise.jagoanhosting.id:2083/cpsess9915694184/frontend/jupiter/filemanager/index.html", { timeout: 30000 });
await page.waitForTimeout(4000);
console.log("URL:", await page.url());
console.log("TITLE:", await page.title());
const snap = await page.snapshot();
console.log(snap.slice(0, 4000));
