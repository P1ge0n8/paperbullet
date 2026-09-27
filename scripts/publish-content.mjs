import { readContent,validateContent,publishContent } from '../server/content.mjs';
await publishContent(process.cwd(),validateContent(await readContent(process.cwd())));
console.log('Published content generated; drafts excluded.');
