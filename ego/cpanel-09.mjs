const task = await taskSpace("cpanel upload");
const page = task.page("p1");
await page.evaluate(() => {
  document.getElementById("location").value = "/home/aryafatthur1/aryafatthurahman1.my.id";
  document.getElementById("btnSearch").click();
});
await page.waitForTimeout(4000);
const loc = await page.evaluate(() => document.getElementById("location")?.value);
console.log("location:", loc);
const files = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("table tr")];
  return rows.map(r => r.innerText.replace(/\n/g, " | ").replace(/\t/g, " ").trim()).filter(t => t && !t.startsWith("Name")).slice(0, 50);
});
console.log(JSON.stringify(files, null, 1));
