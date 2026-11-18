const task = await taskSpace("cpanel upload");
const page = task.page("p1");
await page.screenshot({ path: "C:/laragon/www/UTS Ujian Tengah Semester EC2 Amazon Linux/ego/fm.png" });
console.log("shot saved");
// coba navigate via evaluate: set path lalu trigger
const r = await page.evaluate(() => {
  const inp = document.querySelector('input[name="dir"], #searchdir, input[placeholder*="path" i]');
  return { inputs: [...document.querySelectorAll('input')].map(i => ({name: i.name, id: i.id, val: i.value})).slice(0,10) };
});
console.log(JSON.stringify(r, null, 1));
