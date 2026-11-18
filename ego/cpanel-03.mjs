/*
 *   Copyright (c) 2026 
 *   All rights reserved.
 */
const task = await taskSpace("cpanel upload");
const page = task.page("p1");
// isi path box lalu Go
await page.fill('css:input[name="dir"]', "/home/aryafatthur1/public_html").catch(async () => {
  // fallback: cari textbox di toolbar path
});
// coba snapshot singkat untuk lihat input yang ada
const snap = await page.snapshot();
const m = snap.match(/textbox \[ref=(\d+)[^\]]*\]/g);
console.log("textboxes:", m);
console.log("URL:", await page.url());
