import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a full PDF report by taking a screenshot of a DOM element.
 * @param {HTMLElement} element - The DOM element to capture.
 * @param {string} filename - The output filename.
 */
export const generateFullReport = async (element, filename = 'Candidate_Intelligence_Report.pdf') => {
  if (!element) throw new Error('DOM element not provided for report generation.');

  // Create canvas from DOM element
  // We use scale to improve the resolution of the captured image
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#050505', // Matches DevScope dark theme
  });

  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  // A4 size: 210 x 297 mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = pdfHeight;
  let position = 0;
  const pageHeight = pdf.internal.pageSize.getHeight();

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  // Add subsequent pages if content overflows
  while (heightLeft >= 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};

/**
 * Programmatically generates a 1-page Executive Summary PDF.
 * @param {Object} data - The aggregated analysis data.
 * @param {string} filename - The output filename.
 */
export const generateExecutiveSummary = (data, filename = 'Executive_Summary.pdf') => {
  const { scores, candidateReport } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const width = pdf.internal.pageSize.getWidth();

  // --- BRANDING HEADER ---
  pdf.setFillColor(17, 17, 17); // Dark surface
  pdf.rect(0, 0, width, 40, 'F');
  
  pdf.setTextColor(255, 122, 26); // Primary orange (#FF7A1A)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text('DEVSCOPE AI', 15, 20);

  pdf.setTextColor(208, 208, 208); // On-surface
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('EXECUTIVE INTELLIGENCE SUMMARY', 15, 28);
  
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.text(`GENERATED: ${new Date().toISOString().split('T')[0]}`, width - 50, 28);

  // --- OVERALL SCORES ---
  let y = 55;
  pdf.setTextColor(0, 0, 0); // Reset to dark text for main content, wait we can use dark mode or light mode PDF. Let's do a light/clean PDF for printing.
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('CANDIDATE INTELLIGENCE SCORES', 15, y);
  y += 10;

  // Score Boxes
  const drawScoreBox = (title, score, xPos, yPos) => {
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(xPos, yPos, 40, 25, 2, 2, 'FD');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(title, xPos + 20, yPos + 8, { align: 'center' });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    const scoreText = score ? `${score}/100` : 'N/A';
    pdf.text(scoreText, xPos + 20, yPos + 18, { align: 'center' });
  };

  drawScoreBox('OVERALL', scores?.overall || 0, 15, y);
  drawScoreBox('RESUME', scores?.resume || 0, 60, y);
  drawScoreBox('GITHUB', scores?.github || 0, 105, y);
  drawScoreBox('LINKEDIN', scores?.linkedin || 0, 150, y);

  y += 40;

  // --- HIRE PROBABILITY & RECRUITER OPINION ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('RECRUITER SYNTHESIS', 15, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const hireProb = candidateReport?.recruiterOpinion?.hireProbability || 'N/A';
  const confidence = candidateReport?.recruiterOpinion?.confidence || 'N/A';
  pdf.text(`Hire Probability: ${hireProb}`, 15, y);
  pdf.text(`Confidence Level: ${confidence}`, 100, y);
  
  y += 10;
  const summaryText = candidateReport?.recruiterOpinion?.summary || 'No summary available.';
  const splitSummary = pdf.splitTextToSize(summaryText, 180);
  pdf.text(splitSummary, 15, y);
  
  y += splitSummary.length * 5 + 10;

  // --- STRENGTHS & RISKS ---
  const strengths = candidateReport?.recruiterOpinion?.pros || [];
  const risks = candidateReport?.recruiterOpinion?.cons || [];

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text('VERIFIED STRENGTHS', 15, y);
  pdf.text('HIRING RISKS', 105, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  let currentY = y;
  strengths.slice(0, 5).forEach((pro) => {
    const text = pdf.splitTextToSize(`+ ${pro}`, 80);
    pdf.setTextColor(34, 197, 94); // Green
    pdf.text(text, 15, currentY);
    currentY += text.length * 5;
  });

  let riskY = y;
  risks.slice(0, 5).forEach((con) => {
    const text = pdf.splitTextToSize(`- ${con}`, 80);
    pdf.setTextColor(239, 68, 68); // Red
    pdf.text(text, 105, riskY);
    riskY += text.length * 5;
  });

  y = Math.max(currentY, riskY) + 15;

  // --- ROADMAP ---
  if (candidateReport?.growthPlan?.roadmap && candidateReport.growthPlan.roadmap.length > 0) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('30/60/90 DAY ROADMAP', 15, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    candidateReport.growthPlan.roadmap.slice(0, 3).forEach((step) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(step.milestone, 15, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      const actionText = pdf.splitTextToSize(step.action, 180);
      pdf.text(actionText, 15, y);
      y += actionText.length * 5 + 5;
    });
  }

  // --- FOOTER ---
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(8);
  pdf.text('DevScope AI Proprietary Recruitment Intelligence Layer', 15, 285);

  pdf.save(filename);
};
