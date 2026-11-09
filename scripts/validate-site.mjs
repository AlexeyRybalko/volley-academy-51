import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const siteFiles=fs.readdirSync(root).filter(name=>/\.(?:html|css|js)$/i.test(name));
const failures=[];
function checkReference(raw,relativeFile){
 const value=raw.trim();
 if(!value||/^(?:[a-z]+:|#|\/\/)/i.test(value))return;
 const clean=decodeURIComponent(value.split(/[?#]/)[0]);
 const resolved=path.resolve(path.dirname(relativeFile),clean);
 if(!fs.existsSync(resolved))failures.push(`Missing local asset: ${value} (in ${path.relative(root,relativeFile)})`);
}
for(const name of siteFiles){
 const file=path.join(root,name),text=fs.readFileSync(file,'utf8');
 if(name.endsWith('.js'))try{new vm.Script(text,{filename:name});}catch(error){failures.push(error.message);}
 if(name.endsWith('.html'))for(const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/g))checkReference(match[1],file);
 if(name.endsWith('.css'))for(const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))checkReference(match[1],file);
}
for(const photo of ['serve','receive','set','attack','cover','block','dig','point']){
 if(!fs.existsSync(path.join(root,'photos',photo+'.jpg')))failures.push('Missing phase photo: '+photo);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Validated ${siteFiles.length} HTML/CSS/JS files, their local assets, and 8 phase photos.`);
