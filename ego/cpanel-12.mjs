const task = await taskSpace("cpanel upload");
const page = task.page("p1");
await page.goto("https://wise.jagoanhosting.id:2083/", { timeout: 30000 });
await page.waitForTimeout(3000);
console.log("URL:", await page.url());
console.log("TITLE:", await page.title());
