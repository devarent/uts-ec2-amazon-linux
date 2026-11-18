const task = await taskSpace("cpanel upload");
const tabs = await task.tabs();
console.log(JSON.stringify(tabs.map(t => ({label: t.label, url: t.url, title: t.title, active: t.active})), null, 1));
