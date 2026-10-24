import {cp,mkdir,rm,access} from 'node:fs/promises';
await rm('build',{recursive:true,force:true});
await mkdir('build/fugle-private',{recursive:true});
await cp('dist','build/public',{recursive:true});
await cp('backend/src','build/fugle-private/src',{recursive:true});
// Local config is never packaged. serve:php loads it only in the development router.
await access('build/public/api/index.php');
console.log('Packaged public site and private PHP source in build/.');
