
import * as pdfjs from 'pdfjs-dist';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ExtractedDocumentInfo {
  insuranceType: string | null;
  policyNumber: string | null;
  provider: string | null;
  premium: string | null;
  dueDate: string | null;
}

export async function extractPdfInfo(file: File): Promise<ExtractedDocumentInfo> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    // Initialize result
    const result: ExtractedDocumentInfo = {
      insuranceType: null,
      policyNumber: null,
      provider: null,
      premium: null,
      dueDate: null,
    };
    
    // Process each page
    const textContent = [];
    for (let i = 1; i <= Math.min(numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      textContent.push(pageText);
    }
    
    const fullText = textContent.join(' ');
    
    // Extract insurance type
    const insuranceTypes = ['health', 'auto', 'car', 'life', 'home', 'property', 'general', 'liability'];
    for (const type of insuranceTypes) {
      if (fullText.toLowerCase().includes(type)) {
        result.insuranceType = type.charAt(0).toUpperCase() + type.slice(1);
        break;
      }
    }
    
    // Extract policy number (common formats)
    const policyNumberRegex = /policy\s*(?:#|number|no|num)?[:.\s]*([a-zA-Z0-9-]{5,20})/i;
    const policyNumberMatch = fullText.match(policyNumberRegex);
    if (policyNumberMatch && policyNumberMatch[1]) {
      result.policyNumber = policyNumberMatch[1].trim();
    }
    
    // Extract provider
    const providerRegex = /(?:provided by|issued by|insurer|carrier|provider|company)[:.\s]*([A-Za-z\s&]+?)(?:[\.,]|\s(?:Inc|LLC|Ltd|Co|Corporation|Company)|\s{2}|$)/i;
    const providerMatch = fullText.match(providerRegex);
    if (providerMatch && providerMatch[1]) {
      result.provider = providerMatch[1].trim();
    }
    
    // Extract premium
    const premiumRegex = /(?:premium|payment|cost)[:.\s]*[$€£]?\s*([0-9,.]+)/i;
    const premiumMatch = fullText.match(premiumRegex);
    if (premiumMatch && premiumMatch[1]) {
      result.premium = premiumMatch[1].trim();
    }
    
    // Extract due date
    const dueDateRegex = /(?:due date|payment due|expiration date|expiry date|renewal date)[:.\s]*([A-Za-z0-9\s,]+?\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i;
    const dueDateMatch = fullText.match(dueDateRegex);
    if (dueDateMatch && dueDateMatch[1]) {
      result.dueDate = dueDateMatch[1].trim();
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return {
      insuranceType: null,
      policyNumber: null,
      provider: null,
      premium: null,
      dueDate: null,
    };
  }
}
