const task = await taskSpace("cpanel upload");
const page = task.page("p1");
// set lokasi dengan leading slash lalu klik Go via JS
await page.evaluate(() => {
  const loc = document.getElementById("location");
  loc.value = "/home/aryafatthur1/public_html";
  document.getElementById("btnSearch").click();
});
await page.waitForTimeout(4000);
const loc = await page.evaluate(() => document.getElementById("location")?.value);
console.log("location now:", loc);
// lihat file list di pane kanan
const files = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("#file_list tr, .yui-dt tr, table.yui-dt tr")];
  return rows.slice(0, 40).map(r => r.innerText.replace(/\n/g, " | ").slice(0, 120));
});
console.log(JSON.stringify(files, null, 1));
