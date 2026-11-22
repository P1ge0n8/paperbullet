import { publishStoredContent } from '../server/content.mjs';
await publishStoredContent(process.cwd());
console.log('Published content generated; drafts excluded.');
