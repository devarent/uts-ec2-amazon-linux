const task = await taskSpace("cpanel upload");
const page = task.page("p1");
console.log("URL:", await page.url());
const snap = await page.snapshot();
console.log(snap.slice(-4000));
