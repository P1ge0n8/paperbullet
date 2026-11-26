import {build} from 'vite';
// Validate the private editor without including it in the public distribution.
await build({build:{write:false,copyPublicDir:false,rollupOptions:{input:'admin/index.html'}},logLevel:'warn'});
console.log('本地编辑器编译通过。');
