import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const script = await readFile('public/scripts/site-language.js', 'utf8');
function visit({pathname='/', languages=['nb-NO'], language, saved=null, blocked=false}={}) {
  const storage = new Map(saved ? [['fugle-site-language', saved]] : []);
  const links = ['nb', 'en'].map(lang => ({dataset:{siteLanguage:lang},href:`https://www.fugleadvokatene.no${lang==='nb'?'/':'/en/'}`,addEventListener(event,callback){this[event]=callback;}}));
  let ready;
  const redirects=[];
  vm.runInNewContext(script, {
    URL,
    navigator:{languages,language:language??languages[0]},
    location:{href:`https://www.fugleadvokatene.no${pathname}`,replace(url){redirects.push(url);}},
    localStorage:{getItem(key){if(blocked)throw Error('Blocked');return storage.get(key)??null;},setItem(key,value){if(blocked)throw Error('Blocked');storage.set(key,value);}},
    document:{addEventListener(event,callback){assert.equal(event,'DOMContentLoaded');ready=callback;},querySelectorAll(){return links;}},
  });
  ready();
  return {redirects,storage,links};
}
test('Homepage selects the browser’s preferred supported language and defaults to Norwegian',()=>{
  for (const languages of [['en-US'],['EN-gb','nb-NO'],['fr-FR','en-GB']]) assert.deepEqual(visit({languages}).redirects,['https://www.fugleadvokatene.no/en/']);
  for (const languages of [['nb-NO','en-GB'],['nn-NO','en'],['no','en'],['fr-FR'],[]]) assert.deepEqual(visit({languages}).redirects,[]);
  assert.deepEqual(visit({languages:[],language:'en-GB'}).redirects,['https://www.fugleadvokatene.no/en/']);
});
test('Manual preference takes priority over browser settings and survives later visits',()=>{
  assert.deepEqual(visit({languages:['en'],saved:'nb'}).redirects,[]);
  assert.deepEqual(visit({languages:['nb'],saved:'en'}).redirects,['https://www.fugleadvokatene.no/en/']);
  assert.deepEqual(visit({languages:['nb'],saved:'unexpected'}).redirects,[]);
  const manual=visit({pathname:'/en/',languages:['en']});
  manual.links[0].click();
  assert.equal(manual.storage.get('fugle-site-language'),'nb');
  assert.deepEqual(visit({languages:['en'],saved:manual.storage.get('fugle-site-language')}).redirects,[]);
  manual.links[1].click();
  assert.equal(manual.storage.get('fugle-site-language'),'en');
});
test('Specific page URLs retain their language without redirect loops',()=>{
  for(const pathname of ['/en/','/en/contact/','/kontakt/','/nyheter/velkommen/','/404.html']) {
    for(const saved of ['nb','en']) assert.deepEqual(visit({pathname,languages:['en'],saved}).redirects,[]);
  }
});
test('Redirect preserves query parameters and fragments and handles index.html',()=>{
  assert.deepEqual(visit({languages:['en'],pathname:'/?campaign=birds#main'}).redirects,['https://www.fugleadvokatene.no/en/?campaign=birds#main']);
  assert.deepEqual(visit({languages:['en'],pathname:'/index.html'}).redirects,['https://www.fugleadvokatene.no/en/']);
});
test('Storage failure leaves automatic detection and manual selection usable',()=>{
  const english=visit({languages:['en'],pathname:'/en/',blocked:true});
  english.links[0].click();
  assert.equal(english.links[0].href,'https://www.fugleadvokatene.no/?lang=nb');
  assert.deepEqual(visit({languages:['en'],pathname:'/?lang=nb',blocked:true}).redirects,[]);
  assert.deepEqual(visit({languages:['en'],blocked:true}).redirects,['https://www.fugleadvokatene.no/en/']);
  const explicit=visit({languages:['nb'],pathname:'/?lang=en',saved:'nb'});
  assert.equal(explicit.storage.get('fugle-site-language'),'en');
  assert.deepEqual(explicit.redirects,['https://www.fugleadvokatene.no/en/?lang=en']);
  assert.deepEqual(visit({languages:['nb'],pathname:'/?lang=unexpected'}).redirects,[]);
});
