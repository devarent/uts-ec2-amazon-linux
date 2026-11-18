const task = await taskSpace("cpanel upload");
const page = task.page("p1");
// klik path box (ref 25), isi path, tekan Enter
await page.click("@25");
await page.fill("@25", "/home/aryafatthur1/public_html");
await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
console.log("URL:", await page.url());
const snap = await page.snapshot();
// cetak bagian daftar file
console.log(snap.slice(0, 5000));
