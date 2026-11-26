// Body documents are language-owned. Never align translated paragraphs by index.
export function replaceArticleSection(record, locale, field, blocks) {
 const target = locale === 'zh-CN' ? record : record.translations?.[locale];
 if (!target) throw new Error('请先建立当前语言的译文。');
 const previous = target.blocks ?? record.blocks;
 const boundary = Math.min(target.prefaceOffset ?? record.prefaceOffset ?? 0, previous.length);
 if (field === 'preface') { target.preface = blocks; return; }
 if (target === record) {
  for (const translation of Object.values(record.translations || {})) {
   // Preserve the old inherited position before changing the source structure.
   translation.prefaceOffset ??= Math.min(record.prefaceOffset || 0, (translation.blocks ?? record.blocks).length);
  }
 }
 if (field === 'leading') {
  target.blocks = [...blocks, ...previous.slice(boundary)];
  target.prefaceOffset = blocks.length;
 } else {
  target.blocks = [...previous.slice(0, boundary), ...blocks];
  target.prefaceOffset = boundary;
 }
}
