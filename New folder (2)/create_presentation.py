from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN

# Create presentation
prs = Presentation()

# Set slide size to 16:9
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Function to add title slide
def add_title_slide(prs, title, subtitle, names):
    slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)

    title_shape = slide.shapes.title
    title_shape.text = title

    subtitle_shape = slide.placeholders[1]
    subtitle_shape.text = subtitle

    # Add student names
    left = Inches(1)
    top = Inches(4)
    width = Inches(11.333)
    height = Inches(2)
    textbox = slide.shapes.add_textbox(left, top, width, height)
    text_frame = textbox.text_frame
    text_frame.word_wrap = True

    p = text_frame.paragraphs[0]
    p.text = names
    p.font.size = Pt(18)
    p.font.bold = True
    p.alignment = PP_ALIGN.CENTER

# Function to add content slide
def add_content_slide(prs, title, content_items):
    slide_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(slide_layout)

    title_shape = slide.shapes.title
    title_shape.text = title

    body_shape = slide.placeholders[1]
    text_frame = body_shape.text_frame
    text_frame.clear()

    for item in content_items:
        p = text_frame.add_paragraph()
        p.text = item
        p.level = 0
        p.font.size = Pt(20)

# Function to add two-column slide
def add_two_column_slide(prs, title, left_items, right_items):
    slide_layout = prs.slide_layouts[5]
    slide = prs.slides.add_slide(slide_layout)

    title_shape = slide.shapes.title
    title_shape.text = title

    # Left column
    left = Inches(0.5)
    top = Inches(1.5)
    width = Inches(5.8)
    height = Inches(5)
    textbox = slide.shapes.add_textbox(left, top, width, height)
    text_frame = textbox.text_frame
    text_frame.word_wrap = True

    for item in left_items:
        p = text_frame.add_paragraph()
        p.text = item
        p.font.size = Pt(16)

    # Right column
    left = Inches(7)
    top = Inches(1.5)
    width = Inches(5.8)
    height = Inches(5)
    textbox = slide.shapes.add_textbox(left, top, width, height)
    text_frame = textbox.text_frame
    text_frame.word_wrap = True

    for item in right_items:
        p = text_frame.add_paragraph()
        p.text = item
        p.font.size = Pt(16)

# Student information
student_names = """MUHAMMAD ARYA FATTHURAHMAN (2023230006)
MUHAMMAD IBNU RAMADHAN (2023230029)
SANDI YUDHA (2023230045)"""

course_info = """INTERPERSONAL SKILL
Kelas: TIFM
Kognitif
Dosen Pengajar: Dr. LINDA NUR AFIFA, ST, MT"""

# Slide 1: Cover
add_title_slide(prs, "INTERPERSONAL SKILL", course_info, student_names)

# Slide 2: Pengantar
add_content_slide(prs, "Pengantar Interpersonal Skill", [
    "Interpersonal Skill adalah kemampuan untuk berkomunikasi dan berinteraksi secara efektif dengan orang lain",
    "Mencakup kemampuan verbal dan non-verbal dalam membangun hubungan",
    "Penting dalam lingkungan akademik, profesional, dan sosial",
    "Aspek kognitif: bagaimana kita memahami dan memproses interaksi sosial"
])

# Slide 3: Aspek Kognitif
add_content_slide(prs, "Aspek Kognitif dalam Interpersonal Skill", [
    "Self Awareness (Kesadaran Diri) - Memahami emosi, kekuatan, dan kelemahan diri",
    "Social Awareness (Kesadaran Sosial) - Memahami emosi dan kebutuhan orang lain",
    "Empati - Kemampuan merasakan dan memahami perspektif orang lain",
    "Critical Thinking - Menganalisis situasi sosial secara objektif"
])

# Slide 4: Roadmap of Influence
add_content_slide(prs, "Roadmap of Influence", [
    "1. Self Awareness - Langkah awal memahami diri sendiri",
    "2. Communication - Mengembangkan kemampuan berkomunikasi",
    "3. Good Relationship - Membangun hubungan yang positif",
    "4. TRUST - Membangun kepercayaan dalam hubungan",
    "5. Influence - Mampu mempengaruhi orang lain secara positif"
])

# Slide 5: Self Awareness
add_content_slide(prs, "Self Awareness (Kesadaran Diri)", [
    "Mengenali emosi dan reaksi sendiri dalam berbagai situasi",
    "Memahami nilai, keyakinan, dan motivasi pribadi",
    "Menyadari kekuatan dan area yang perlu ditingkatkan",
    "Mengelola emosi secara efektif"
])

# Slide 6: Komunikasi Efektif
add_two_column_slide(prs, "Komunikasi Efektif",
    ["Verbal",
     "• Kemampuan berbicara dengan jelas",
     "• Menggunakan bahasa yang tepat",
     "• Menyampaikan pesan dengan ringkas",
     "• Active listening - mendengarkan dengan penuh perhatian"],
    ["Non-Verbal",
     "• Bahasa tubuh",
     "• Kontak mata",
     "• Ekspresi wajah",
     "• Intonasi suara"]
)

# Slide 7: Membangun Hubungan Baik
add_content_slide(prs, "Membangun Hubungan Baik", [
    "Respect - Menghargai perbedaan dan perspektif orang lain",
    "Openness - Bersedia terbuka dan jujur dalam komunikasi",
    "Support - Memberikan dukungan saat dibutuhkan",
    "Collaboration - Bekerja sama mencapai tujuan bersama"
])

# Slide 8: Membangun Kepercayaan (TRUST)
add_content_slide(prs, "Membangun Kepercayaan (TRUST)", [
    "Transparency - Bersikap transparan dan jujur",
    "Reliability - Dapat diandalkan dan konsisten",
    "Understanding - Memahami kebutuhan dan harapan orang lain",
    "Sharing - Berbagi informasi dan pengalaman",
    "Time - Meluangkan waktu untuk membangun hubungan"
])

# Slide 9: Influence (Pengaruh)
add_content_slide(prs, "Influence (Pengaruh Positif)", [
    "Pengaruh positif datang dari kredibilitas dan integritas",
    "Mampu memotivasi dan menginspirasi orang lain",
    "Menggunakan persuasion yang etis dan terhormat",
    "Menjadi role model melalui tindakan dan perilaku"
])

# Slide 10: Manfaat Interpersonal Skill
add_content_slide(prs, "Manfaat Mengembangkan Interpersonal Skill", [
    "Meningkatkan kinerja akademik dan profesional",
    "Membangun jejaring yang kuat dan berharga",
    "Mengurangi konflik dan kesalahpahaman",
    "Meningkatkan kesejahteraan mental dan emosional",
    "Membuka peluang karir yang lebih baik"
])

# Slide 11: Kesimpulan
add_content_slide(prs, "Kesimpulan", [
    "Interpersonal Skill adalah kompetensi penting untuk sukses",
    "Dimulai dari self awareness dan berkembang melalui praktik",
    "Membutuhkan pembelajaran berkelanjutan dan refleksi",
    "Kunci: komunikasi, kepercayaan, dan pengaruh positif"
])

# Slide 12: Terima Kasih
add_title_slide(prs, "Terima Kasih", "Pertanyaan & Diskusi", student_names)

# Save presentation
pptx_path = r"C:\laragon\www\AWS EC2 Web Hosting Part 1\Interpersonal_Skill_Kognitif.pptx"
prs.save(pptx_path)
print(f"PowerPoint presentation saved: {pptx_path}")
