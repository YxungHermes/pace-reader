import JSZip from 'jszip';

export interface BookMetadata {
  title: string;
  author: string;
  chapters: { title: string; index: number }[];
}

export interface ParsedBook {
  metadata: BookMetadata;
  content: string;
  chapterBreaks: number[]; // Word indices where chapters start
}

/**
 * Parse an EPUB file and extract text content
 */
export async function parseEpub(file: File): Promise<ParsedBook> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  
  // Find the container.xml to locate the OPF file
  const containerXml = await contents.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Invalid EPUB: Missing container.xml');
  }
  
  // Parse container to find OPF path
  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) {
    throw new Error('Invalid EPUB: Cannot find OPF path');
  }
  
  const opfPath = opfPathMatch[1];
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
  
  // Load OPF file
  const opfContent = await contents.file(opfPath)?.async('text');
  if (!opfContent) {
    throw new Error('Invalid EPUB: Cannot read OPF file');
  }
  
  // Extract metadata
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  
  const metadata: BookMetadata = {
    title: titleMatch ? titleMatch[1].trim() : file.name.replace('.epub', ''),
    author: authorMatch ? authorMatch[1].trim() : 'Unknown Author',
    chapters: [],
  };
  
  // Parse manifest to get item IDs and hrefs
  const manifestItems: Record<string, string> = {};
  const manifestRegex = /<item[^>]+id="([^"]+)"[^>]+href="([^"]+)"[^>]*>/gi;
  let manifestMatch;
  while ((manifestMatch = manifestRegex.exec(opfContent)) !== null) {
    manifestItems[manifestMatch[1]] = manifestMatch[2];
  }
  
  // Parse spine to get reading order
  const spineItems: string[] = [];
  const spineRegex = /<itemref[^>]+idref="([^"]+)"[^>]*>/gi;
  let spineMatch;
  while ((spineMatch = spineRegex.exec(opfContent)) !== null) {
    spineItems.push(spineMatch[1]);
  }
  
  // Extract text from each chapter in spine order
  let fullContent = '';
  const chapterBreaks: number[] = [0];
  let wordCount = 0;
  
  for (let i = 0; i < spineItems.length; i++) {
    const itemId = spineItems[i];
    const href = manifestItems[itemId];
    
    if (!href) continue;
    
    // Skip non-HTML files
    if (!href.endsWith('.html') && !href.endsWith('.xhtml') && !href.endsWith('.htm')) {
      continue;
    }
    
    const filePath = opfDir + href;
    const chapterContent = await contents.file(filePath)?.async('text');
    
    if (chapterContent) {
      // Extract chapter title from content if possible
      const h1Match = chapterContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const h2Match = chapterContent.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const titleTag = chapterContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      
      const chapterTitle = h1Match?.[1] || h2Match?.[1] || titleTag?.[1] || `Chapter ${i + 1}`;
      
      metadata.chapters.push({
        title: chapterTitle.trim(),
        index: wordCount,
      });
      
      // Strip HTML and extract text
      const text = stripHtml(chapterContent);
      const words = text.split(/\s+/).filter(w => w.length > 0);
      
      if (words.length > 0) {
        fullContent += text + ' ';
        wordCount += words.length;
        chapterBreaks.push(wordCount);
      }
    }
  }
  
  return {
    metadata,
    content: fullContent.trim(),
    chapterBreaks,
  };
}

/**
 * Parse a PDF file and extract text content
 */
export async function parsePdf(file: File): Promise<ParsedBook> {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker path
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const metadata: BookMetadata = {
    title: file.name.replace('.pdf', ''),
    author: 'Unknown Author',
    chapters: [],
  };
  
  // Try to get PDF metadata
  try {
    const info = await pdf.getMetadata();
    if (info.info) {
      const pdfInfo = info.info as Record<string, string>;
      if (pdfInfo.Title) metadata.title = pdfInfo.Title;
      if (pdfInfo.Author) metadata.author = pdfInfo.Author;
    }
  } catch (e) {
    // Metadata extraction failed, use defaults
  }
  
  let fullContent = '';
  const chapterBreaks: number[] = [0];
  let wordCount = 0;
  
  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Add page as a "chapter" for navigation
    if (pageNum === 1 || pageNum % 20 === 0) {
      metadata.chapters.push({
        title: `Page ${pageNum}`,
        index: wordCount,
      });
    }
    
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (pageText.length > 0) {
      const words = pageText.split(/\s+/).filter(w => w.length > 0);
      fullContent += pageText + ' ';
      wordCount += words.length;
      
      // Mark chapter breaks at page boundaries
      if (pageNum % 20 === 0) {
        chapterBreaks.push(wordCount);
      }
    }
  }
  
  if (fullContent.trim().length === 0) {
    throw new Error('No text found in PDF. This might be a scanned/image-only PDF.');
  }
  
  return {
    metadata,
    content: fullContent.trim(),
    chapterBreaks,
  };
}

/**
 * Parse a plain text file
 */
export async function parseTxt(file: File): Promise<ParsedBook> {
  const content = await file.text();
  
  const metadata: BookMetadata = {
    title: file.name.replace('.txt', ''),
    author: 'Unknown Author',
    chapters: [],
  };
  
  // Simple chapter detection for txt files
  const lines = content.split('\n');
  let wordCount = 0;
  const chapterBreaks: number[] = [0];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect chapter headings
    if (
      trimmed.toLowerCase().startsWith('chapter ') ||
      trimmed.match(/^(part|book|section)\s+\d+/i) ||
      (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && trimmed.length > 3)
    ) {
      metadata.chapters.push({
        title: trimmed,
        index: wordCount,
      });
      chapterBreaks.push(wordCount);
    }
    
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    wordCount += words.length;
  }
  
  // If no chapters found, create artificial ones every ~2000 words
  if (metadata.chapters.length === 0) {
    const totalWords = content.split(/\s+/).filter(w => w.length > 0).length;
    for (let i = 0; i < totalWords; i += 2000) {
      metadata.chapters.push({
        title: `Section ${Math.floor(i / 2000) + 1}`,
        index: i,
      });
    }
  }
  
  return {
    metadata,
    content: content.trim(),
    chapterBreaks,
  };
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Replace block elements with spaces
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, ' ');
  text = text.replace(/<(p|div|h[1-6]|li|tr|br)[^>]*>/gi, ' ');
  
  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  text = text.replace(/&[a-z]+;/gi, ' ');
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseBookFile(file: File): Promise<ParsedBook> {
  const extension = file.name.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'epub':
      return parseEpub(file);
    case 'pdf':
      return parsePdf(file);
    case 'txt':
      return parseTxt(file);
    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}
