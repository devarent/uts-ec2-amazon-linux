from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

# Create PDF
pdf_path = r"C:\laragon\www\AWS EC2 Web Hosting Part 1\Interpersonal_Skill_Kognitif.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=A4,
                        rightMargin=72, leftMargin=72,
                        topMargin=72, bottomMargin=18)

# Story content
story = []

# Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.darkblue,
    alignment=TA_CENTER,
    spaceAfter=30
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=18,
    textColor=colors.darkblue,
    spaceAfter=12,
    spaceBefore=20
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=12,
    spaceAfter=12,
    leading=16
)

bullet_style = ParagraphStyle(
    'CustomBullet',
    parent=styles['Normal'],
    fontSize=11,
    leftIndent=20,
    spaceAfter=8,
    leading=14
)

# Student information
student_names = """<b>MUHAMMAD ARYA FATTHURAHMAN (2023230006)</b><br/>
MUHAMMAD IBNU RAMADHAN (2023230029)<br/>
SANDI YUDHA (2023230045)"""

course_info = """<b>INTERPERSONAL SKILL</b><br/>
Kelas: TIFM<br/>
Kognitif<br/>
Dosen Pengajar: Dr. LINDA NUR AFIFA, ST, MT"""

# Title Page
story.append(Paragraph("INTERPERSONAL SKILL", title_style))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph(course_info, heading_style))
story.append(Spacer(1, 1*inch))
story.append(Paragraph(student_names, normal_style))
story.append(Spacer(1, 2*inch))

# Section 1: Pengantar
story.append(Paragraph("Pengantar Interpersonal Skill", heading_style))
story.append(Paragraph(
    "Interpersonal Skill adalah kemampuan untuk berkomunikasi dan berinteraksi secara efektif dengan orang lain.",
    normal_style))
story.append(Paragraph(
    "Mencakup kemampuan verbal dan non-verbal dalam membangun hubungan.",
    normal_style))
story.append(Paragraph(
    "Penting dalam lingkungan akademik, profesional, dan sosial.",
    normal_style))
story.append(Paragraph(
    "Aspek kognitif: bagaimana kita memahami dan memproses interaksi sosial.",
    normal_style))
story.append(Spacer(1, 0.3*inch))

# Section 2: Aspek Kognitif
story.append(Paragraph("Aspek Kognitif dalam Interpersonal Skill", heading_style))
story.append(Paragraph("• Self Awareness (Kesadaran Diri) - Memahami emosi, kekuatan, dan kelemahan diri", bullet_style))
story.append(Paragraph("• Social Awareness (Kesadaran Sosial) - Memahami emosi dan kebutuhan orang lain", bullet_style))
story.append(Paragraph("• Empati - Kemampuan merasakan dan memahami perspektif orang lain", bullet_style))
story.append(Paragraph("• Critical Thinking - Menganalisis situasi sosial secara objektif", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 3: Roadmap of Influence
story.append(Paragraph("Roadmap of Influence", heading_style))
story.append(Paragraph("1. Self Awareness - Langkah awal memahami diri sendiri", bullet_style))
story.append(Paragraph("2. Communication - Mengembangkan kemampuan berkomunikasi", bullet_style))
story.append(Paragraph("3. Good Relationship - Membangun hubungan yang positif", bullet_style))
story.append(Paragraph("4. TRUST - Membangun kepercayaan dalam hubungan", bullet_style))
story.append(Paragraph("5. Influence - Mampu mempengaruhi orang lain secara positif", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 4: Self Awareness
story.append(Paragraph("Self Awareness (Kesadaran Diri)", heading_style))
story.append(Paragraph("• Mengenali emosi dan reaksi sendiri dalam berbagai situasi", bullet_style))
story.append(Paragraph("• Memahami nilai, keyakinan, dan motivasi pribadi", bullet_style))
story.append(Paragraph("• Menyadari kekuatan dan area yang perlu ditingkatkan", bullet_style))
story.append(Paragraph("• Mengelola emosi secara efektif", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 5: Komunikasi Efektif
story.append(Paragraph("Komunikasi Efektif", heading_style))

# Create two-column table for communication
data = [
    ['<b>Komunikasi Verbal</b>', '<b>Komunikasi Non-Verbal</b>'],
    ['• Kemampuan berbicara dengan jelas', '• Bahasa tubuh'],
    ['• Menggunakan bahasa yang tepat', '• Kontak mata'],
    ['• Menyampaikan pesan dengan ringkas', '• Ekspresi wajah'],
    ['• Active listening - mendengarkan dengan penuh perhatian', '• Intonasi suara']
]

table = Table(data, colWidths=[2.5*inch, 2.5*inch])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (1, 0), colors.lightblue),
    ('TEXTCOLOR', (0, 0), (1, 0), colors.black),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 12),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black)
]))
story.append(table)
story.append(Spacer(1, 0.3*inch))

# Section 6: Membangun Hubungan Baik
story.append(Paragraph("Membangun Hubungan Baik", heading_style))
story.append(Paragraph("• Respect - Menghargai perbedaan dan perspektif orang lain", bullet_style))
story.append(Paragraph("• Openness - Bersedia terbuka dan jujur dalam komunikasi", bullet_style))
story.append(Paragraph("• Support - Memberikan dukungan saat dibutuhkan", bullet_style))
story.append(Paragraph("• Collaboration - Bekerja sama mencapai tujuan bersama", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 7: Membangun Kepercayaan
story.append(Paragraph("Membangun Kepercayaan (TRUST)", heading_style))
story.append(Paragraph("• Transparency - Bersikap transparan dan jujur", bullet_style))
story.append(Paragraph("• Reliability - Dapat diandalkan dan konsisten", bullet_style))
story.append(Paragraph("• Understanding - Memahami kebutuhan dan harapan orang lain", bullet_style))
story.append(Paragraph("• Sharing - Berbagi informasi dan pengalaman", bullet_style))
story.append(Paragraph("• Time - Meluangkan waktu untuk membangun hubungan", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 8: Influence
story.append(Paragraph("Influence (Pengaruh Positif)", heading_style))
story.append(Paragraph("• Pengaruh positif datang dari kredibilitas dan integritas", bullet_style))
story.append(Paragraph("• Mampu memotivasi dan menginspirasi orang lain", bullet_style))
story.append(Paragraph("• Menggunakan persuasion yang etis dan terhormat", bullet_style))
story.append(Paragraph("• Menjadi role model melalui tindakan dan perilaku", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 9: Manfaat
story.append(Paragraph("Manfaat Mengembangkan Interpersonal Skill", heading_style))
story.append(Paragraph("• Meningkatkan kinerja akademik dan profesional", bullet_style))
story.append(Paragraph("• Membangun jejaring yang kuat dan berharga", bullet_style))
story.append(Paragraph("• Mengurangi konflik dan kesalahpahaman", bullet_style))
story.append(Paragraph("• Meningkatkan kesejahteraan mental dan emosional", bullet_style))
story.append(Paragraph("• Membuka peluang karir yang lebih baik", bullet_style))
story.append(Spacer(1, 0.3*inch))

# Section 10: Kesimpulan
story.append(Paragraph("Kesimpulan", heading_style))
story.append(Paragraph("• Interpersonal Skill adalah kompetensi penting untuk sukses", bullet_style))
story.append(Paragraph("• Dimulai dari self awareness dan berkembang melalui praktik", bullet_style))
story.append(Paragraph("• Membutuhkan pembelajaran berkelanjutan dan refleksi", bullet_style))
story.append(Paragraph("• Kunci: komunikasi, kepercayaan, dan pengaruh positif", bullet_style))
story.append(Spacer(1, 0.5*inch))

# Closing
story.append(Paragraph("Terima Kasih", title_style))
story.append(Spacer(1, 0.3*inch))
story.append(Paragraph("Pertanyaan & Diskusi", normal_style))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph(student_names, normal_style))

# Build PDF
doc.build(story)
print(f"PDF document saved: {pdf_path}")
