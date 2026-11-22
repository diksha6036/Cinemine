import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createMetadata,renderHead,scriptJson,cleanOrigin} from '../shared/seo.mjs'
import {renderDocument,requestLocation} from '../server/html.mjs'
import {movieSitemapXml,pageSitemapXml} from '../server/sitemaps.mjs'

const movie={id:'27205',title:'Inception',releaseYear:2010,shortDescription:'A thief enters dreams.',genres:['Science Fiction'],runtimeMinutes:148,directors:['Christopher Nolan'],posterUrl:'https://image.tmdb.org/t/p/w500/poster.jpg'}
const template='<!doctype html><html><head><!--seo:start--><title>Default</title><!--seo:end--></head><body><div id="root"></div></body></html>'
const options={template,render:async page=>`<main><h1>${page.movie?.title ?? 'Cinemine'}</h1></main>`}
function isolated(callback){
 const names=['TMDB_READ_ACCESS_TOKEN','TMDB_ACCESS_TOKEN','TMDB_API_KEY','SITE_URL','VERCEL_ENV','CONTEXT'];const saved=Object.fromEntries(names.map(name=>[name,process.env[name]]));const cwd=process.cwd();const dir=mkdtempSync(join(tmpdir(),'cinemine-seo-'));for(const name of names)delete process.env[name];process.chdir(dir)
 return Promise.resolve().then(callback).finally(()=>{process.chdir(cwd);for(const name of names){if(saved[name]===undefined)delete process.env[name];else process.env[name]=saved[name]}rmSync(dir,{recursive:true})})
}
test('movie metadata describes real visible facts and uses a single canonical URL',()=>{
 const meta=createMetadata({pathname:'/movie/27205/',origin:'https://cinemine.example',movie})
 assert.equal(meta.title,'Inception (2010) | Cinemine');assert.equal(meta.canonical,'https://cinemine.example/movie/27205');assert.equal(meta.type,'video.movie')
 const film=meta.jsonLd['@graph'].find(item=>item['@type']==='Movie');assert.equal(film.duration,'PT148M');assert.equal(film.director[0].name,'Christopher Nolan');assert.equal('aggregateRating' in film,false)
 const head=renderHead(meta);assert.equal((head.match(/rel="canonical"/g)??[]).length,1);assert.match(head,/og:image/);assert.match(head,/twitter:card/)
})
test('metadata and embedded data escape untrusted source text',()=>{
 const hostile={...movie,title:'</title><script>alert(1)</script>',shortDescription:'</script><script>alert(2)</script>'}
 const head=renderHead(createMetadata({pathname:'/movie/27205',origin:'https://cinemine.example',movie:hostile}));assert.equal(head.includes('<script>alert'),false);assert.equal(scriptJson({hostile:'</script>'}).includes('</script>'),false);assert.equal(cleanOrigin('https://user:secret@cinemine.example'),'');assert.equal(cleanOrigin('javascript:alert(1)'),'')
})
test('404, temporary errors, previews, and unresolved movies are not indexed',()=>{
 for(const input of [{pathname:'/missing'},{pathname:'/',status:503},{pathname:'/',noIndex:true},{pathname:'/movie/27205'}])assert.match(createMetadata({origin:'https://cinemine.example',...input}).robots,/noindex/)
 assert.equal(createMetadata({pathname:'/calendar',origin:'https://cinemine.example'}).title,'Movie Release Calendar | Cinemine')
})
test('canonical origin can be shared between Vercel and Netlify and omits query fragments',async()=>{
 await isolated(()=>{
  process.env.SITE_URL='https://cinemine.example/';const location=requestLocation({url:'/api/pages?_path=/movie/27205&tracking=abc',headers:{host:'preview.vercel.app'}});assert.equal(location.origin,'https://cinemine.example');assert.equal(location.pathname,'/movie/27205');process.env.VERCEL_ENV='preview';assert.equal(requestLocation({url:'/',headers:{host:'preview.vercel.app'}}).noIndex,true)
 })
})
test('sitemap deduplicates real movie URLs and escapes XML',()=>{
 const xml=movieSitemapXml('https://cinemine.example',[movie,movie])+pageSitemapXml('https://cinemine.example');assert.equal((xml.match(/\/movie\/27205/g)??[]).length,1);assert.match(xml,/<loc>https:\/\/cinemine.example\/calendar<\/loc>/)
})
test('robots and true missing pages work without a data credential or source request',async()=>{
 await isolated(async()=>{
  let calls=0;const original=globalThis.fetch;globalThis.fetch=async()=>{calls++;throw Error('Unexpected upstream request')}
  try{const req=path=>({url:path,method:'GET',headers:{host:'cinemine.example'}});const missing=await renderDocument(req('/missing'),options);assert.equal(missing.status,404);assert.match(missing.body,/noindex/);const robots=await renderDocument(req('/robots.txt'),options);assert.match(robots.body,/Sitemap: https:\/\/cinemine.example\/sitemap.xml/);assert.equal(calls,0);assert.equal((await renderDocument(req('/index.html'),options)).status,308)}finally{globalThis.fetch=original}
 })
})
test('rendered film HTML includes social metadata and safe bootstrap data, never the credential',async()=>{
 await isolated(async()=>{
  const token='unit-seo-private-credential';process.env.TMDB_READ_ACCESS_TOKEN=token;const original=globalThis.fetch
  globalThis.fetch=async input=>new URL(input).pathname.endsWith('/configuration')?Response.json({images:{secure_base_url:'https://image.tmdb.org/t/p/'}}):Response.json({id:27205,title:'Inception',release_date:'2010-07-16',poster_path:'/poster.jpg',runtime:148,overview:'A thief enters dreams.',genres:[{id:878,name:'Science Fiction'}]})
  try{const result=await renderDocument({url:'/movie/27205?tracking=abc',method:'GET',headers:{host:'cinemine.example'}},options);assert.equal(result.status,200);assert.match(result.body,/<h1>Inception<\/h1>/);assert.match(result.body,/window.__CINEMINE_PAGE__/);assert.equal(result.body.includes(token),false);assert.match(result.body,/<meta property="og:title" content="Inception/);assert.equal(result.body.includes('tracking=abc'),false)}finally{globalThis.fetch=original}
 })
})
test('source outages return retryable 503 pages with noindex instead of soft-success pages',async()=>{
 await isolated(async()=>{
  const result=await renderDocument({url:'/',method:'GET',headers:{host:'cinemine.example'}},options);assert.equal(result.status,503);assert.equal(result.headers['Retry-After'],'60');assert.equal(result.headers['Cache-Control'],'no-store');assert.match(result.body,/noindex/)
 })
})
