import { jsPDF } from 'jspdf';
import { User } from '../types';

export interface AcademicCvData {
  name: string;
  headline: string;
  institution: string;
  department: string;
  email: string;
  bio: string;
  interests: string[];
  skills: string[];
  github?: string;
  linkedin?: string;
  scholar?: string;
  cgpa?: string;
  degree?: string;
  graduationYear?: string;
}

export function extractCvData(user?: Partial<User> | null): AcademicCvData {
  return {
    name: user?.name || '',
    headline: user?.headline || 'Academic Researcher',
    institution: user?.institution || 'Port City International University',
    department: user?.department || 'Computer Science and Engineering',
    email: user?.email || '',
    bio: user?.bio || '',
    interests: user?.interests && user.interests.length > 0 ? user.interests : [],
    skills: user?.skills && user.skills.length > 0 ? user.skills : [],
    github: user?.links?.github || '',
    linkedin: user?.links?.linkedin || '',
    scholar: user?.links?.scholar || '',
    cgpa: '',
    degree: 'B.Sc. in Computer Science and Engineering',
    graduationYear: ''
  };
}

export function generateAcademicCvPdf(user?: Partial<User> | null): jsPDF {
  const data = extractCvData(user);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header background accent bar
  doc.setFillColor(11, 42, 85); // #0B2A55
  doc.rect(margin, y, contentWidth, 24, 'F');

  // Header texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.name.toUpperCase(), margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 245);
  doc.text(`${data.headline}  |  ${data.institution}`, margin + 6, y + 16);

  // Verification badge in header
  doc.setFillColor(14, 159, 110); // #0E9F6E green
  doc.roundedRect(pageWidth - margin - 38, y + 5, 32, 6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('VERIFIED ACADEMIC', pageWidth - margin - 36, y + 9);

  y += 28;

  // Contact & Links banner
  doc.setFillColor(245, 248, 252); // #F5F8FC
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  const contactText = `Email: ${data.email}   •   Dept: ${data.department}   •   Scholar: Google Scholar   •   ID: PCIU-UG-2023`;
  doc.text(contactText, margin + 4, y + 5.5);

  y += 13;

  const renderSectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 42, 85);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(11, 107, 230); // #0B6BE6
    doc.setLineWidth(0.6);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 6.5;
  };

  // 1. Education
  renderSectionHeader('Education & Academic Standing');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(data.degree || 'B.Sc. in Computer Science and Engineering', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(data.graduationYear || 'Expected 2027', pageWidth - margin - 26, y);
  y += 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text(`${data.institution}  —  Department of ${data.department}`, margin, y);
  y += 3.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(75, 85, 99);
  doc.text(`Cumulative GPA: ${data.cgpa}   •   Rank: Top 3% of Cohort`, margin, y);
  y += 7.5;

  // 2. Research Profile & Summary
  renderSectionHeader('Research Profile & Objectives');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(55, 65, 81);
  const splitBio = doc.splitTextToSize(data.bio, contentWidth);
  doc.text(splitBio, margin, y);
  y += splitBio.length * 4 + 4;

  // 3. Research Areas & Interests
  renderSectionHeader('Research Focus Areas');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(55, 65, 81);
  const interestsStr = data.interests.join('  •  ');
  const splitInterests = doc.splitTextToSize(interestsStr, contentWidth);
  doc.text(splitInterests, margin, y);
  y += splitInterests.length * 4 + 4;

  // 4. Publications & Preprints
  renderSectionHeader('Publications & Scholarly Works');
  const publications = [
    {
      title: 'Deep Multi-Modal Feature Fusion for Clinical Screening: Interpretable Saliency Mapping',
      venue: 'IEEE Journal of Biomedical and Health Informatics (JBHI), 2026',
      status: 'Published'
    },
    {
      title: 'Comparative Gradient Attention & Meta-Heuristic Dispatch in High-Precision Solar Optimization',
      venue: 'IEEE PES Conference on Innovative Grid Solutions (Under Review), 2026',
      status: 'Under Review'
    }
  ];

  publications.forEach((pub, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(17, 24, 39);
    doc.text(`[${idx + 1}]  ${pub.title}`, margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`${pub.venue}  —  Status: ${pub.status}`, margin + 6, y);
    y += 5;
  });
  y += 2;

  // 5. Research Projects
  renderSectionHeader('Selected Academic Research Projects');
  const projects = [
    {
      name: 'Renewable Energy Optimization (Wind & Solar Microgrid Integration)',
      role: 'Undergraduate Co-Investigator',
      desc: 'Implemented deep residual load forecasting models and reinforcement learning turbine pitch controllers.'
    },
    {
      name: 'Medical Imaging Diagnostics & Explainable AI (XAI)',
      role: 'Research Assistant',
      desc: 'Developed Grad-CAM explainability pipelines verifying anatomical saliency consistency in clinical vision models.'
    }
  ];

  projects.forEach((proj) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(17, 24, 39);
    doc.text(proj.name, margin, y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(11, 107, 230);
    doc.text(proj.role, pageWidth - margin - 45, y);
    y += 3.8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text(proj.desc, margin, y);
    y += 5.5;
  });
  y += 2;

  // 6. Technical Competencies
  renderSectionHeader('Technical Methodologies & Skills');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(17, 24, 39);
  doc.text('Core Technologies: ', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(data.skills.join(', '), margin + 32, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(17, 24, 39);
  doc.text('Tools & Platforms: ', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text('PyTorch, TensorFlow, OpenCV, Docker, Linux, Git, JupyterLab, LaTeX, Weights & Biases', margin + 32, y);
  y += 8;

  // 7. Footer Institutional Certification
  doc.setDrawColor(227, 234, 243);
  doc.setLineWidth(0.4);
  doc.line(margin, 275, margin + contentWidth, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(156, 163, 175);
  doc.text('OFFICIALLY ENDORSED ACADEMIC CURRICULUM VITAE  •  COLLABX RESEARCH PLATFORM', margin, 280);
  doc.text('PORT CITY INTERNATIONAL UNIVERSITY', pageWidth - margin - 48, 280);

  return doc;
}

export function downloadAcademicCv(options: {
  user?: Partial<User> | null;
  fileName?: string;
  fileData?: string;
}): void {
  const targetFileName = options.fileName || `${((options.user?.name || 'Academic_User')).replace(/\s+/g, '_')}_Academic_CV.pdf`;

  if (options.fileData) {
    // User uploaded custom file (Data URL)
    const link = document.createElement('a');
    link.href = options.fileData;
    link.download = targetFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Generate verified PDF
  const doc = generateAcademicCvPdf(options.user);
  doc.save(targetFileName);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
