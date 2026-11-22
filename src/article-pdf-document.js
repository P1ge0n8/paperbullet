import { PDFDocument } from 'pdf-lib';

// Keep the whole sheet within PDF viewers' 200-inch page limit.
// Scaling the page geometry leaves every captured image pixel intact.
const maxPagePoints = 14400;
const pointsPerCssPixel = 72 / 96;

export async function createPageImagePdf({ width, height, title, author, locale }) {
 if (![width, height].every(value => Number.isFinite(value) && value > 0)) {
  throw new Error('Cannot export an empty page.');
 }
 const pdf = await PDFDocument.create();
 pdf.setTitle(title);
 if (author) pdf.setAuthor(author);
 pdf.setCreator('PAPERBULLET · 锵稿');
 if (locale) pdf.setLanguage(locale);

 const scale = Math.min(pointsPerCssPixel, maxPagePoints / Math.max(width, height));
 const pageWidth = width * scale;
 const page = pdf.addPage([pageWidth, height * scale]);

 return {
  async addTile(jpeg, top, tileHeight) {
   const image = await pdf.embedJpg(jpeg);
   const upperEdge = (height - top) * scale;
   const lowerEdge = (height - top - tileHeight) * scale;
   page.drawImage(image, { x: 0, y: lowerEdge, width: pageWidth, height: upperEdge - lowerEdge });
  },
  async finish() {
   return new Blob([await pdf.save()], { type: 'application/pdf' });
  },
 };
}
