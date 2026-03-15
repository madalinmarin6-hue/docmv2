"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useApp } from "@/components/AppContext"

type Post = {
  slug: string
  color: string
  image: string
  tool: string | null
  EN: { title: string; date: string; category: string; readTime: string; sections: { h: string; p: string }[] }
  RO: { title: string; date: string; category: string; readTime: string; sections: { h: string; p: string }[] }
}

const posts: Post[] = [
  {
    slug: "pdf-to-word", color: "from-blue-500 to-cyan-400", image: "/pdf.png", tool: "/convert/pdf-to-word",
    EN: { title: "How to Convert PDF to Word in 3 Simple Steps", date: "Mar 10, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Step 1: Upload Your PDF", p: "Navigate to the PDF to Word converter on DocM. Click the upload area or drag and drop your PDF file. We support files up to 50MB for free users and unlimited for premium." },
        { h: "Step 2: Click Convert", p: "Once your file is uploaded, click the 'Convert Now' button. Our engine will process your PDF and extract the text, formatting, and layout into an editable Word document." },
        { h: "Step 3: Download Your Word File", p: "When conversion is complete, click 'Download' to save your .doc file. Open it in Microsoft Word, Google Docs, or any compatible editor to start editing immediately." },
        { h: "Tips for Best Results", p: "For best results, use PDFs with selectable text rather than scanned images. If your PDF contains complex tables or graphics, some manual adjustments may be needed after conversion." },
      ]},
    RO: { title: "Cum sa Convertesti PDF in Word in 3 Pasi Simpli", date: "10 Mar 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Pasul 1: Incarca PDF-ul", p: "Navigheaza la convertorul PDF in Word pe DocM. Apasa zona de incarcare sau trage si plaseaza fisierul PDF. Suportam fisiere de pana la 50MB pentru utilizatorii gratuiti si nelimitat pentru premium." },
        { h: "Pasul 2: Apasa Converteste", p: "Dupa ce fisierul este incarcat, apasa butonul 'Converteste Acum'. Motorul nostru va procesa PDF-ul si va extrage textul, formatarea si aspectul intr-un document Word editabil." },
        { h: "Pasul 3: Descarca Fisierul Word", p: "Cand conversia este completa, apasa 'Descarca' pentru a salva fisierul .doc. Deschide-l in Microsoft Word, Google Docs sau orice editor compatibil pentru a incepe editarea imediat." },
        { h: "Sfaturi pentru Rezultate Optime", p: "Pentru cele mai bune rezultate, foloseste PDF-uri cu text selectabil in loc de imagini scanate. Daca PDF-ul contine tabele complexe sau grafice, pot fi necesare ajustari manuale dupa conversie." },
      ]},
  },
  {
    slug: "pdf-to-excel", color: "from-emerald-500 to-teal-400", image: "/excel.png", tool: "/convert/pdf-to-excel",
    EN: { title: "PDF to Excel: Extract Tables and Data Instantly", date: "Mar 9, 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Why Convert PDF to Excel?", p: "PDFs are great for sharing but terrible for data analysis. Converting to Excel lets you sort, filter, create formulas, and manipulate your data freely." },
        { h: "How It Works", p: "Upload your PDF containing tables or data. Our converter detects tabular structures and maps them into Excel rows and columns, preserving the data layout." },
        { h: "Supported Data Types", p: "Works with financial reports, invoices, data tables, CSV-like content, and any structured data in PDF format. Numbers, dates, and text are all preserved." },
        { h: "After Conversion", p: "Download the .xlsx file and open it in Excel, Google Sheets, or LibreOffice Calc. Your data is ready for analysis, charts, and further processing." },
      ]},
    RO: { title: "PDF in Excel: Extrage Tabele si Date Instant", date: "9 Mar 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "De ce sa Convertesti PDF in Excel?", p: "PDF-urile sunt excelente pentru partajare dar teribile pentru analiza datelor. Conversia in Excel iti permite sa sortezi, filtrezi, creezi formule si sa manipulezi datele liber." },
        { h: "Cum Functioneaza", p: "Incarca PDF-ul care contine tabele sau date. Convertorul nostru detecteaza structurile tabulare si le mapeaza in randuri si coloane Excel, pastrind aspectul datelor." },
        { h: "Tipuri de Date Suportate", p: "Functioneaza cu rapoarte financiare, facturi, tabele de date, continut CSV si orice date structurate in format PDF. Numerele, datele si textul sunt toate pastrate." },
        { h: "Dupa Conversie", p: "Descarca fisierul .xlsx si deschide-l in Excel, Google Sheets sau LibreOffice Calc. Datele tale sunt gata pentru analiza, grafice si procesare ulterioara." },
      ]},
  },
  {
    slug: "pdf-to-pptx", color: "from-orange-500 to-amber-400", image: "/powerpoint.png", tool: "/convert/pdf-to-pptx",
    EN: { title: "Convert PDF to PowerPoint for Easy Presentations", date: "Mar 8, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "From PDF to Slides", p: "Transform any PDF document into an editable PowerPoint presentation. Each page becomes a slide, preserving text and layout." },
        { h: "Perfect for Meetings", p: "Repurpose reports, proposals, and documents into presentation format. Add your own branding, animations, and speaker notes after conversion." },
        { h: "How to Convert", p: "Upload your PDF, click Convert, and download your .pptx file. Open it in PowerPoint, Google Slides, or Keynote to customize." },
        { h: "Pro Tips", p: "For best results, use PDFs with clear sections and headings. The converter will attempt to identify title text and body content for each slide." },
      ]},
    RO: { title: "Converteste PDF in PowerPoint pentru Prezentari Usoare", date: "8 Mar 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "De la PDF la Slide-uri", p: "Transforma orice document PDF intr-o prezentare PowerPoint editabila. Fiecare pagina devine un slide, pastrand textul si aspectul." },
        { h: "Perfect pentru Intalniri", p: "Reutilizeaza rapoarte, propuneri si documente in format de prezentare. Adauga propriul branding, animatii si note dupa conversie." },
        { h: "Cum sa Convertesti", p: "Incarca PDF-ul, apasa Converteste si descarca fisierul .pptx. Deschide-l in PowerPoint, Google Slides sau Keynote pentru personalizare." },
        { h: "Sfaturi Pro", p: "Pentru cele mai bune rezultate, foloseste PDF-uri cu sectiuni si titluri clare. Convertorul va incerca sa identifice textul titlului si continutul corpului pentru fiecare slide." },
      ]},
  },
  {
    slug: "pdf-to-jpg", color: "from-pink-500 to-rose-400", image: "/pdf.png", tool: "/convert/pdf-to-jpg",
    EN: { title: "PDF to JPG & PNG: Export Pages as Images", date: "Mar 7, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Why Export PDF as Image?", p: "Images are universally viewable and perfect for sharing on social media, embedding in websites, or including in emails without requiring a PDF viewer." },
        { h: "JPG vs PNG", p: "Choose JPG for smaller file sizes and photos. Choose PNG for text-heavy content and when you need transparency support." },
        { h: "How to Convert", p: "Upload your PDF, select JPG or PNG format, and click Convert. Each page will be exported as a high-quality image." },
        { h: "Quality Settings", p: "Our converter uses high-quality settings (92% for JPG) to ensure your exported images look crisp and professional." },
      ]},
    RO: { title: "PDF in JPG si PNG: Exporta Pagini ca Imagini", date: "7 Mar 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "De ce sa Exporti PDF ca Imagine?", p: "Imaginile sunt vizualizabile universal si perfecte pentru partajare pe social media, incorporare in site-uri web sau includere in email-uri fara a necesita un vizualizator PDF." },
        { h: "JPG vs PNG", p: "Alege JPG pentru dimensiuni mai mici si fotografii. Alege PNG pentru continut bogat in text si cand ai nevoie de suport transparenta." },
        { h: "Cum sa Convertesti", p: "Incarca PDF-ul, selecteaza formatul JPG sau PNG si apasa Converteste. Fiecare pagina va fi exportata ca o imagine de inalta calitate." },
        { h: "Setari de Calitate", p: "Convertorul nostru foloseste setari de inalta calitate (92% pentru JPG) pentru a asigura ca imaginile exportate arata clar si profesional." },
      ]},
  },
  {
    slug: "pdf-editor", color: "from-red-500 to-orange-400", image: "/pdf.png", tool: "/tools/pdf-editor",
    EN: { title: "How to Edit PDF Files Online — No Software Needed", date: "Mar 4, 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Browser-Based PDF Editing", p: "Our PDF editor runs entirely in your browser. No downloads, no installations, no plugins required. Just upload and start editing." },
        { h: "Available Tools", p: "Add text annotations, highlight important sections, draw freehand, insert images, and add shapes. All changes are rendered directly on the PDF." },
        { h: "Export Your Edited PDF", p: "When you are done editing, click Export to download your modified PDF. All annotations and additions are embedded in the final file." },
        { h: "Privacy and Security", p: "Your files are processed locally in the browser. We do not store your documents on our servers, ensuring complete privacy." },
      ]},
    RO: { title: "Cum sa Editezi Fisiere PDF Online — Fara Software", date: "4 Mar 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Editare PDF in Browser", p: "Editorul nostru PDF ruleaza in intregime in browser. Fara descarcari, fara instalari, fara plugin-uri necesare. Doar incarca si incepe editarea." },
        { h: "Instrumente Disponibile", p: "Adauga adnotari text, evidentiaza sectiuni importante, deseneaza liber, insereaza imagini si adauga forme. Toate modificarile sunt redate direct pe PDF." },
        { h: "Exporta PDF-ul Editat", p: "Cand ai terminat editarea, apasa Export pentru a descarca PDF-ul modificat. Toate adnotarile si adaugirile sunt incorporate in fisierul final." },
        { h: "Confidentialitate si Securitate", p: "Fisierele tale sunt procesate local in browser. Nu stocam documentele pe serverele noastre, asigurand confidentialitate completa." },
      ]},
  },
  {
    slug: "powerpoint-editor", color: "from-orange-500 to-amber-400", image: "/powerpoint.png", tool: "/tools/powerpoint-editor",
    EN: { title: "New Feature: PowerPoint Editor Now Available", date: "Mar 3, 2026", category: "News", readTime: "2 min",
      sections: [
        { h: "Create Presentations Online", p: "Our new PowerPoint editor lets you create professional presentations directly in your browser. Add slides, choose layouts, and customize colors." },
        { h: "Key Features", p: "Multiple slide layouts, custom backgrounds, text formatting, shape insertion, and real-time preview. Export as .pptx when ready." },
        { h: "Getting Started", p: "Navigate to Tools > PowerPoint Editor. Start with a blank presentation or upload an existing file to edit." },
      ]},
    RO: { title: "Functie Noua: Editorul PowerPoint Disponibil", date: "3 Mar 2026", category: "Noutati", readTime: "2 min",
      sections: [
        { h: "Creaza Prezentari Online", p: "Noul nostru editor PowerPoint iti permite sa creezi prezentari profesionale direct in browser. Adauga slide-uri, alege layout-uri si personalizeaza culorile." },
        { h: "Functionalitati Cheie", p: "Layout-uri multiple pentru slide-uri, fundaluri personalizate, formatare text, inserare forme si previzualizare in timp real. Exporta ca .pptx cand esti gata." },
        { h: "Primii Pasi", p: "Navigheaza la Instrumente > Editor PowerPoint. Incepe cu o prezentare goala sau incarca un fisier existent pentru editare." },
      ]},
  },
  {
    slug: "word-editor", color: "from-blue-500 to-indigo-400", image: "/word.png", tool: "/tools/word-editor",
    EN: { title: "Word Editor: Create & Edit DOCX Files Online", date: "Mar 2, 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Full-Featured Word Editor", p: "Create new documents or upload existing .docx files. Our editor supports text formatting, paragraphs, headings, and content structuring." },
        { h: "Formatting Options", p: "Bold, italic, underline, font sizes, text colors, and alignment options. Everything you need for professional document creation." },
        { h: "Export and Share", p: "Download your document as a Word file compatible with Microsoft Word, Google Docs, and LibreOffice Writer." },
      ]},
    RO: { title: "Editor Word: Creaza si Editeaza Fisiere DOCX Online", date: "2 Mar 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Editor Word Complet", p: "Creaza documente noi sau incarca fisiere .docx existente. Editorul nostru suporta formatare text, paragrafe, titluri si structurare continut." },
        { h: "Optiuni de Formatare", p: "Bold, italic, subliniat, dimensiuni font, culori text si optiuni de aliniere. Tot ce ai nevoie pentru crearea de documente profesionale." },
        { h: "Exporta si Distribuie", p: "Descarca documentul ca fisier Word compatibil cu Microsoft Word, Google Docs si LibreOffice Writer." },
      ]},
  },
  {
    slug: "excel-editor", color: "from-green-500 to-teal-400", image: "/excel.png", tool: "/tools/excel-editor",
    EN: { title: "Excel Tips: Working with Large Spreadsheets", date: "Mar 1, 2026", category: "Tutorial", readTime: "6 min",
      sections: [
        { h: "Online Excel Editing", p: "Our Excel editor handles spreadsheets with thousands of rows. Edit cells, add formulas, and manage multiple sheets all in your browser." },
        { h: "Data Management", p: "Sort columns, filter data, and use basic formulas. Import CSV or XLSX files and export your work when done." },
        { h: "Performance Tips", p: "For large files, focus on the active sheet. Use filters to narrow down data instead of scrolling through thousands of rows." },
      ]},
    RO: { title: "Sfaturi Excel: Lucrul cu Foi de Calcul Mari", date: "1 Mar 2026", category: "Tutorial", readTime: "6 min",
      sections: [
        { h: "Editare Excel Online", p: "Editorul nostru Excel gestioneaza foi de calcul cu mii de randuri. Editeaza celule, adauga formule si gestioneaza mai multe foi direct in browser." },
        { h: "Gestionarea Datelor", p: "Sorteaza coloane, filtreaza date si foloseste formule de baza. Importa fisiere CSV sau XLSX si exporta munca cand ai terminat." },
        { h: "Sfaturi de Performanta", p: "Pentru fisiere mari, concentreaza-te pe foaia activa. Foloseste filtre pentru a restrange datele in loc sa parcurgi mii de randuri." },
      ]},
  },
  {
    slug: "compress-pdf", color: "from-cyan-500 to-blue-400", image: "/pdf.png", tool: "/tools/compress",
    EN: { title: "How to Compress PDFs Without Losing Quality", date: "Feb 28, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Why Compress PDFs?", p: "Large PDFs are hard to email and slow to upload. Compression reduces file size while maintaining readability and visual quality." },
        { h: "How It Works", p: "Upload your PDF and our tool optimizes images, removes redundant data, and streamlines the file structure to reduce size." },
        { h: "Quality vs Size", p: "Our compression balances quality and size automatically. Most users see 50-80% size reduction with no visible quality loss." },
      ]},
    RO: { title: "Cum sa Comprimi PDF-uri Fara Pierdere de Calitate", date: "28 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "De ce sa Comprimi PDF-uri?", p: "PDF-urile mari sunt greu de trimis pe email si lente de incarcat. Compresia reduce dimensiunea fisierului mentinand lizibilitatea si calitatea vizuala." },
        { h: "Cum Functioneaza", p: "Incarca PDF-ul si instrumentul nostru optimizeaza imaginile, elimina datele redundante si eficientizeaza structura fisierului pentru a reduce dimensiunea." },
        { h: "Calitate vs Dimensiune", p: "Compresia noastra echilibreaza automat calitatea si dimensiunea. Majoritatea utilizatorilor vad o reducere de 50-80% fara pierdere vizibila de calitate." },
      ]},
  },
  {
    slug: "split-pdf", color: "from-amber-500 to-yellow-400", image: "/pdf.png", tool: "/tools/split-pdf",
    EN: { title: "Split PDF: Extract Specific Pages from Large Documents", date: "Feb 22, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Extract What You Need", p: "Do not need the whole PDF? Use our splitter to extract just the pages you need. Perfect for pulling chapters, invoices, or specific sections." },
        { h: "How to Split", p: "Upload your PDF, select the page range you want to extract, and click Split. Download the extracted pages as a new PDF." },
        { h: "Use Cases", p: "Split large reports into chapters, extract single pages for signatures, or separate combined documents into individual files." },
      ]},
    RO: { title: "Separa PDF: Extrage Pagini Specifice din Documente Mari", date: "22 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Extrage Ce Ai Nevoie", p: "Nu ai nevoie de intregul PDF? Foloseste separatorul nostru pentru a extrage doar paginile necesare. Perfect pentru extragerea capitolelor, facturilor sau sectiunilor specifice." },
        { h: "Cum sa Separezi", p: "Incarca PDF-ul, selecteaza intervalul de pagini pe care vrei sa le extragi si apasa Separa. Descarca paginile extrase ca un nou PDF." },
        { h: "Cazuri de Utilizare", p: "Separa rapoarte mari in capitole, extrage pagini individuale pentru semnaturi sau separa documente combinate in fisiere individuale." },
      ]},
  },
  {
    slug: "txt-csv-editors", color: "from-gray-500 to-slate-400", image: "/edit.png", tool: "/tools/txt-editor",
    EN: { title: "TXT & CSV Editors: Lightweight File Editing Online", date: "Feb 20, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Simple and Fast", p: "Edit plain text and CSV files directly in your browser. Our lightweight editors load instantly and handle files of any size." },
        { h: "TXT Editor", p: "Perfect for quick edits to config files, notes, readme files, and any plain text content. Supports syntax highlighting." },
        { h: "CSV Editor", p: "View and edit CSV data in a spreadsheet-like interface. Add, remove, and modify rows and columns with ease." },
      ]},
    RO: { title: "Editoare TXT si CSV: Editare Usoara de Fisiere Online", date: "20 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Simplu si Rapid", p: "Editeaza fisiere text simplu si CSV direct in browser. Editoarele noastre usoare se incarca instant si gestioneaza fisiere de orice dimensiune." },
        { h: "Editor TXT", p: "Perfect pentru editari rapide la fisiere de configurare, note, fisiere readme si orice continut text simplu." },
        { h: "Editor CSV", p: "Vizualizeaza si editeaza date CSV intr-o interfata de tip foaie de calcul. Adauga, elimina si modifica randuri si coloane cu usurinta." },
      ]},
  },
  {
    slug: "document-management-tips", color: "from-emerald-500 to-green-400", image: "/edit.png", tool: null,
    EN: { title: "5 Tips for Better Document Management", date: "Mar 6, 2026", category: "Productivity", readTime: "5 min",
      sections: [
        { h: "1. Organize Files with Consistent Naming", p: "Use a clear naming convention for all your documents. Include dates, project names, and version numbers. For example: '2026-03-Report-Q1-v2.pdf'. This makes searching and sorting much easier." },
        { h: "2. Convert to the Right Format", p: "Not every format is ideal for every situation. Use PDF for sharing final documents, DOCX for collaborative editing, and XLSX for data analysis. DocM makes switching between formats instant." },
        { h: "3. Compress Before Sending", p: "Large files clog inboxes and slow down uploads. Use compression tools to reduce PDF and image sizes by 50-80% without visible quality loss before sharing via email or cloud." },
        { h: "4. Back Up Important Documents", p: "Always keep backups of critical documents in multiple locations — cloud storage, external drives, and local copies. Version your files so you can roll back changes if needed." },
        { h: "5. Use Browser-Based Tools", p: "Avoid installing heavy software for simple tasks. Browser-based tools like DocM let you edit, convert, and manage documents from any device without installation." },
      ]},
    RO: { title: "5 Sfaturi pentru o Mai Buna Gestionare a Documentelor", date: "6 Mar 2026", category: "Productivitate", readTime: "5 min",
      sections: [
        { h: "1. Organizeaza Fisierele cu Denumiri Consistente", p: "Foloseste o conventie clara de denumire pentru toate documentele. Include date, nume de proiecte si numere de versiune. De exemplu: '2026-03-Raport-T1-v2.pdf'." },
        { h: "2. Converteste in Formatul Potrivit", p: "Nu orice format e ideal pentru orice situatie. Foloseste PDF pentru documente finale, DOCX pentru editare colaborativa si XLSX pentru analiza datelor. DocM face trecerea intre formate instantanee." },
        { h: "3. Comprima Inainte de Trimitere", p: "Fisierele mari blocheaza inbox-urile si incetinesc incarcarea. Foloseste instrumente de compresie pentru a reduce dimensiunea PDF-urilor si imaginilor cu 50-80% fara pierdere vizibila de calitate." },
        { h: "4. Fa Backup la Documente Importante", p: "Pastreaza intotdeauna copii de siguranta ale documentelor critice in locatii multiple — stocare cloud, unitati externe si copii locale. Versioneaza fisierele pentru a putea reveni la modificari." },
        { h: "5. Foloseste Instrumente din Browser", p: "Evita instalarea de software greu pentru sarcini simple. Instrumentele din browser precum DocM iti permit sa editezi, convertesti si gestionezi documente de pe orice dispozitiv." },
      ]},
  },
  {
    slug: "file-formats-guide", color: "from-purple-500 to-pink-400", image: "/word.png", tool: null,
    EN: { title: "Understanding File Formats: PDF vs DOCX vs XLSX", date: "Mar 5, 2026", category: "Guide", readTime: "7 min",
      sections: [
        { h: "PDF — The Universal Reader", p: "PDF (Portable Document Format) is the gold standard for sharing documents. It preserves formatting across all devices and operating systems, making it ideal for contracts, reports, and final publications." },
        { h: "DOCX — For Editing and Collaboration", p: "DOCX is Microsoft Word's format, perfect for creating and editing text documents. It supports rich formatting, comments, track changes, and is the go-to format for drafts and collaborative work." },
        { h: "XLSX — For Data and Calculations", p: "XLSX is the Excel spreadsheet format, designed for numerical data, formulas, charts, and data analysis. Use it when you need to sort, filter, or calculate data." },
        { h: "PPTX — For Presentations", p: "PPTX is the PowerPoint format for creating slide-based presentations. It supports animations, transitions, embedded media, and speaker notes." },
        { h: "When to Convert", p: "Convert DOCX to PDF when sharing final documents. Convert PDF to DOCX when you need to edit content. Convert PDF to XLSX when you need to work with tabular data. DocM handles all these conversions seamlessly." },
      ]},
    RO: { title: "Intelegerea Formatelor: PDF vs DOCX vs XLSX", date: "5 Mar 2026", category: "Ghid", readTime: "7 min",
      sections: [
        { h: "PDF — Cititorul Universal", p: "PDF (Portable Document Format) este standardul de aur pentru partajarea documentelor. Pastreaza formatarea pe toate dispozitivele si sistemele de operare." },
        { h: "DOCX — Pentru Editare si Colaborare", p: "DOCX este formatul Microsoft Word, perfect pentru crearea si editarea documentelor text. Suporta formatare bogata, comentarii si urmarirea modificarilor." },
        { h: "XLSX — Pentru Date si Calcule", p: "XLSX este formatul de foi de calcul Excel, proiectat pentru date numerice, formule, grafice si analiza datelor." },
        { h: "PPTX — Pentru Prezentari", p: "PPTX este formatul PowerPoint pentru crearea prezentarilor bazate pe slide-uri. Suporta animatii, tranzitii si note." },
        { h: "Cand sa Convertesti", p: "Converteste DOCX in PDF cand partajezi documente finale. Converteste PDF in DOCX cand trebuie sa editezi. DocM gestioneaza toate aceste conversii fara probleme." },
      ]},
  },
  {
    slug: "merge-pdf-online", color: "from-indigo-500 to-blue-400", image: "/pdf.png", tool: "/tools/merge-pdf",
    EN: { title: "How to Merge PDF Files Online for Free", date: "Feb 18, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Why Merge PDFs?", p: "Combining multiple PDFs into one makes it easier to share, archive, and organize documents. Instead of sending 5 separate files, send one consolidated document." },
        { h: "How to Merge with DocM", p: "Open the PDF Editor, upload your first PDF, then use the Merge function to add additional PDFs. Pages from the second file are appended to the first." },
        { h: "Tips for Merging", p: "Ensure your PDFs are in the correct order before merging. You can use the page reorder feature to rearrange pages after combining files." },
      ]},
    RO: { title: "Cum sa Unifici Fisiere PDF Online Gratuit", date: "18 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "De ce sa Unifici PDF-uri?", p: "Combinarea mai multor PDF-uri intr-unul singur faciliteaza partajarea, arhivarea si organizarea documentelor. In loc sa trimiti 5 fisiere separate, trimite un singur document consolidat." },
        { h: "Cum sa Unifici cu DocM", p: "Deschide Editorul PDF, incarca primul PDF, apoi foloseste functia Merge pentru a adauga PDF-uri suplimentare. Paginile din al doilea fisier sunt adaugate la primul." },
        { h: "Sfaturi pentru Unificare", p: "Asigura-te ca PDF-urile sunt in ordinea corecta inainte de unificare. Poti folosi functia de reordonare a paginilor pentru a rearanja paginile dupa combinare." },
      ]},
  },
  {
    slug: "ocr-extract-text", color: "from-teal-500 to-emerald-400", image: "/img.png", tool: "/tools/ocr",
    EN: { title: "OCR: Extract Text from Images and Scanned Documents", date: "Feb 16, 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "What is OCR?", p: "Optical Character Recognition (OCR) is a technology that converts images of text into actual editable text. It works on photos, screenshots, scanned documents, and more." },
        { h: "Supported Languages", p: "DocM's OCR supports multiple languages including English, Romanian, French, German, Spanish, Italian, and more. Select your language for best accuracy." },
        { h: "How to Use OCR", p: "Upload an image containing text, select the language, and click Extract. The recognized text appears instantly and can be copied or downloaded." },
        { h: "Tips for Best Results", p: "Use clear, high-resolution images. Ensure text is not rotated or heavily stylized. Black text on white background gives the best recognition accuracy." },
      ]},
    RO: { title: "OCR: Extrage Text din Imagini si Documente Scanate", date: "16 Feb 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Ce este OCR?", p: "Recunoasterea Optica a Caracterelor (OCR) este o tehnologie care converteste imaginile de text in text editabil real. Functioneaza pe fotografii, capturi de ecran, documente scanate si altele." },
        { h: "Limbi Suportate", p: "OCR-ul DocM suporta mai multe limbi inclusiv engleza, romana, franceza, germana, spaniola, italiana si altele. Selecteaza limba pentru cea mai buna acuratete." },
        { h: "Cum sa Folosesti OCR", p: "Incarca o imagine care contine text, selecteaza limba si apasa Extrage. Textul recunoscut apare instant si poate fi copiat sau descarcat." },
        { h: "Sfaturi pentru Rezultate Optime", p: "Foloseste imagini clare, de inalta rezolutie. Asigura-te ca textul nu este rotit sau foarte stilizat. Textul negru pe fundal alb ofera cea mai buna acuratete." },
      ]},
  },
  {
    slug: "remove-background-images", color: "from-rose-500 to-pink-400", image: "/img.png", tool: "/tools/remove-bg",
    EN: { title: "Remove Background from Images Online — Free Tool", date: "Feb 14, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Instant Background Removal", p: "Upload any image and our smart detection algorithm automatically identifies and removes the background. Perfect for product photos, profile pictures, and social media content." },
        { h: "Manual Refinement Tools", p: "After automatic removal, use the Eraser to remove remaining areas, Restore to bring back accidentally removed parts, or the Magic Wand to click-remove specific color regions." },
        { h: "Download as PNG", p: "The result is saved as a transparent PNG file, ready to use in designs, presentations, websites, or any project that needs a clean cutout." },
        { h: "Best Practices", p: "For best results, use images with good contrast between subject and background. Simple, solid-color backgrounds are removed most cleanly." },
      ]},
    RO: { title: "Sterge Fundalul din Imagini Online — Instrument Gratuit", date: "14 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Eliminare Fundal Instantanee", p: "Incarca orice imagine si algoritmul nostru de detectie inteligenta identifica si elimina automat fundalul. Perfect pentru poze de produse, poze de profil si continut social media." },
        { h: "Instrumente de Rafinare Manuala", p: "Dupa eliminarea automata, foloseste Eraser pentru a elimina zonele ramase, Restore pentru a readuce partile eliminate accidental, sau Magic Wand pentru a elimina regiuni de culoare specifice." },
        { h: "Descarca ca PNG", p: "Rezultatul este salvat ca fisier PNG transparent, gata de utilizare in design-uri, prezentari, site-uri web sau orice proiect care necesita un decupaj curat." },
        { h: "Cele Mai Bune Practici", p: "Pentru cele mai bune rezultate, foloseste imagini cu contrast bun intre subiect si fundal. Fundalurile simple, de culoare solida sunt eliminate cel mai curat." },
      ]},
  },
  {
    slug: "best-free-document-editor", color: "from-sky-500 to-cyan-400", image: "/edit.png", tool: null,
    EN: { title: "Best Free Online Document Editor in 2026", date: "Feb 12, 2026", category: "Guide", readTime: "6 min",
      sections: [
        { h: "Why Choose an Online Editor?", p: "Online document editors eliminate the need for expensive software licenses and heavy installations. Work from any device with just a browser — perfect for students, freelancers, and small businesses." },
        { h: "What Makes DocM Different", p: "DocM combines PDF editing, Word processing, Excel spreadsheets, PowerPoint presentations, and file conversion all in one platform. No other free tool offers this range." },
        { h: "Free Tier Benefits", p: "Every user gets 10 free edits per day without creating an account. Need more? Watch a short video for bonus edits or upgrade to an affordable premium plan." },
        { h: "Built for Students", p: "DocM was built with students in mind. Convert lecture PDFs to Word for note-taking, compress files for email submissions, and edit documents without paying for Microsoft Office." },
      ]},
    RO: { title: "Cel Mai Bun Editor de Documente Online Gratuit in 2026", date: "12 Feb 2026", category: "Ghid", readTime: "6 min",
      sections: [
        { h: "De ce sa Alegi un Editor Online?", p: "Editoarele de documente online elimina nevoia de licente software scumpe si instalari grele. Lucreaza de pe orice dispozitiv cu doar un browser — perfect pentru studenti, freelanceri si afaceri mici." },
        { h: "Ce Face DocM Diferit", p: "DocM combina editarea PDF, procesarea Word, foile de calcul Excel, prezentarile PowerPoint si conversia fisierelor intr-o singura platforma. Niciun alt instrument gratuit nu ofera aceasta gama." },
        { h: "Beneficii Gratuite", p: "Fiecare utilizator primeste 10 editari gratuite pe zi fara a crea un cont. Ai nevoie de mai multe? Urmareste un videoclip scurt pentru editari bonus sau upgradeza la un plan premium accesibil." },
        { h: "Construit pentru Studenti", p: "DocM a fost construit avand in vedere studentii. Converteste PDF-uri de curs in Word pentru notite, comprima fisiere pentru trimiteri pe email si editeaza documente fara a plati pentru Microsoft Office." },
      ]},
  },
  {
    slug: "view-pdf-without-adobe", color: "from-fuchsia-500 to-purple-400", image: "/pdf.png", tool: "/tools/pdf-viewer",
    EN: { title: "How to Open and View PDF Files Without Adobe Reader", date: "Feb 10, 2026", category: "Guide", readTime: "3 min",
      sections: [
        { h: "No More Adobe Required", p: "Adobe Reader is bloated and slow. Modern browsers and online tools like DocM can open and display PDF files instantly without any software installation." },
        { h: "Using DocM's PDF Viewer", p: "Navigate to PDF Viewer on DocM, upload your file, and view it instantly. Each page is rendered clearly with zoom controls and page navigation." },
        { h: "Additional Features", p: "Beyond viewing, you can switch to the PDF Editor to add annotations, text, images, and highlights. Then export the modified PDF when done." },
      ]},
    RO: { title: "Cum sa Deschizi si Vizualizezi PDF-uri Fara Adobe Reader", date: "10 Feb 2026", category: "Ghid", readTime: "3 min",
      sections: [
        { h: "Nu Mai Ai Nevoie de Adobe", p: "Adobe Reader este incet si greoi. Browserele moderne si instrumentele online precum DocM pot deschide si afisa fisiere PDF instant fara nicio instalare de software." },
        { h: "Folosind Vizualizatorul PDF DocM", p: "Navigheaza la PDF Viewer pe DocM, incarca fisierul si vizualizeaza-l instant. Fiecare pagina este redata clar cu controale de zoom si navigare." },
        { h: "Functionalitati Suplimentare", p: "Pe langa vizualizare, poti trece la Editorul PDF pentru a adauga adnotari, text, imagini si evidentierea. Apoi exporta PDF-ul modificat cand ai terminat." },
      ]},
  },
  {
    slug: "excel-to-pdf", color: "from-lime-500 to-green-400", image: "/excel.png", tool: null,
    EN: { title: "How to Convert Excel to PDF and Keep Formatting", date: "Feb 8, 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "Why Convert Excel to PDF?", p: "PDFs preserve your spreadsheet layout exactly as intended. When sharing financial reports, invoices, or data tables, PDF ensures recipients see the same formatting regardless of their device." },
        { h: "Preserving Cell Formatting", p: "Our converter maintains cell borders, background colors, font styles, and column widths. Charts and merged cells are also preserved in the output." },
        { h: "How to Convert", p: "Open the Excel Editor, import your spreadsheet, review the data, and use the export function. The file is converted to a professional-looking PDF ready for sharing." },
      ]},
    RO: { title: "Cum sa Convertesti Excel in PDF si sa Pastrezi Formatarea", date: "8 Feb 2026", category: "Tutorial", readTime: "4 min",
      sections: [
        { h: "De ce sa Convertesti Excel in PDF?", p: "PDF-urile pastreaza aspectul foii de calcul exact asa cum a fost intentionat. Cand partajezi rapoarte financiare, facturi sau tabele de date, PDF asigura ca destinatarii vad aceeasi formatare." },
        { h: "Pastrarea Formatarii Celulelor", p: "Convertorul nostru mentine bordurile celulelor, culorile de fundal, stilurile de font si latimile coloanelor. Graficele si celulele unificate sunt de asemenea pastrate." },
        { h: "Cum sa Convertesti", p: "Deschide Editorul Excel, importa foaia de calcul, revizuieste datele si foloseste functia de export. Fisierul este convertit intr-un PDF profesional gata de partajare." },
      ]},
  },
  {
    slug: "add-signature-to-pdf", color: "from-yellow-500 to-orange-400", image: "/signiture.png", tool: "/tools/pdf-editor",
    EN: { title: "How to Add a Signature to a PDF Online", date: "Feb 6, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Digital Signatures Made Easy", p: "No need to print, sign, and scan. DocM's PDF Editor includes a built-in signature pad where you can draw your signature directly with your mouse or touchscreen." },
        { h: "How to Sign a PDF", p: "Upload your PDF in the PDF Editor. Switch to the Signature tool, draw your signature on the pad, then click to place it anywhere on the document. Resize and position as needed." },
        { h: "Professional and Secure", p: "Your signature is rendered as an image embedded directly in the PDF. The signed document can be exported and shared immediately — perfect for contracts, forms, and agreements." },
      ]},
    RO: { title: "Cum sa Adaugi o Semnatura pe un PDF Online", date: "6 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Semnaturi Digitale Simplificate", p: "Nu trebuie sa printezi, semnezi si scanezi. Editorul PDF DocM include un pad de semnatura integrat unde poti desena semnatura direct cu mouse-ul sau ecranul tactil." },
        { h: "Cum sa Semnezi un PDF", p: "Incarca PDF-ul in Editorul PDF. Treci la instrumentul Semnatura, deseneaza semnatura pe pad, apoi apasa pentru a o plasa oriunde pe document. Redimensioneaza si pozitioneaza dupa necesitate." },
        { h: "Profesional si Sigur", p: "Semnatura este redata ca o imagine incorporata direct in PDF. Documentul semnat poate fi exportat si partajat imediat — perfect pentru contracte, formulare si acorduri." },
      ]},
  },
  {
    slug: "word-to-pdf", color: "from-red-500 to-amber-400", image: "/word.png", tool: "/convert/word-to-pdf",
    EN: { title: "Word to PDF: Convert DOCX Files Instantly Online", date: "Feb 4, 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "Why Convert Word to PDF?", p: "PDFs are the universal format for sharing documents. Converting your Word file to PDF ensures formatting stays consistent across all devices, operating systems, and email clients." },
        { h: "How to Convert with DocM", p: "Navigate to the Word to PDF converter. Upload your .docx or .doc file, click Convert, and download the resulting PDF. The process takes just seconds." },
        { h: "Formatting Preservation", p: "Our converter preserves fonts, images, tables, headers, footers, and page layouts. Your PDF will look exactly like the original Word document." },
      ]},
    RO: { title: "Word in PDF: Converteste Fisiere DOCX Instant Online", date: "4 Feb 2026", category: "Tutorial", readTime: "3 min",
      sections: [
        { h: "De ce sa Convertesti Word in PDF?", p: "PDF-urile sunt formatul universal pentru partajarea documentelor. Conversia fisierului Word in PDF asigura ca formatarea ramane consistenta pe toate dispozitivele." },
        { h: "Cum sa Convertesti cu DocM", p: "Navigheaza la convertorul Word in PDF. Incarca fisierul .docx sau .doc, apasa Converteste si descarca PDF-ul rezultat. Procesul dureaza doar cateva secunde." },
        { h: "Pastrarea Formatarii", p: "Convertorul nostru pastreaza fonturile, imaginile, tabelele, anteturile, subsolurile si aspectele paginilor. PDF-ul va arata exact ca documentul Word original." },
      ]},
  },
  {
    slug: "secure-documents-online", color: "from-red-500 to-rose-400", image: "/upload.png", tool: null,
    EN: { title: "How to Secure Your Documents Online", date: "Feb 26, 2026", category: "Security", readTime: "4 min",
      sections: [
        { h: "Browser-Based Processing", p: "DocM processes all files directly in your browser. Your documents never leave your device and are not uploaded to remote servers, ensuring maximum privacy and security." },
        { h: "Encryption in Transit", p: "All connections to DocM use HTTPS encryption. Any data exchanged between your browser and our servers is encrypted and cannot be intercepted by third parties." },
        { h: "No File Storage", p: "We do not store your documents after processing. Once you close the browser tab or navigate away, your files are gone from memory. No traces are left behind." },
        { h: "Best Practices", p: "Always use trusted platforms for document editing. Avoid uploading sensitive documents to unknown websites. Check for HTTPS in the URL bar and read privacy policies before using any online tool." },
      ]},
    RO: { title: "Cum sa iti Securizezi Documentele Online", date: "26 Feb 2026", category: "Securitate", readTime: "4 min",
      sections: [
        { h: "Procesare in Browser", p: "DocM proceseaza toate fisierele direct in browser. Documentele tale nu parasesc niciodata dispozitivul si nu sunt incarcate pe servere remote, asigurand confidentialitate maxima." },
        { h: "Criptare in Tranzit", p: "Toate conexiunile la DocM folosesc criptare HTTPS. Orice date schimbate intre browser si serverele noastre sunt criptate si nu pot fi interceptate." },
        { h: "Fara Stocare de Fisiere", p: "Nu stocam documentele dupa procesare. Odata ce inchizi tab-ul sau navighezi in alta parte, fisierele sunt sterse din memorie. Nu raman urme." },
        { h: "Cele Mai Bune Practici", p: "Foloseste intotdeauna platforme de incredere pentru editarea documentelor. Evita incarcarea documentelor sensibile pe site-uri necunoscute. Verifica HTTPS in bara URL." },
      ]},
  },
  {
    slug: "convert-to-pdf", color: "from-violet-500 to-purple-400", image: "/pdf.png", tool: "/convert/word-to-pdf",
    EN: { title: "Convert Word, Excel & Images to PDF Easily", date: "Feb 24, 2026", category: "Guide", readTime: "5 min",
      sections: [
        { h: "One Platform, All Conversions", p: "DocM supports converting Word, Excel, PowerPoint, JPG, and PNG files to PDF. No need for multiple tools — everything is available in one place." },
        { h: "Word to PDF", p: "Upload your .docx file and get a perfectly formatted PDF in seconds. Fonts, images, tables, and layouts are all preserved during conversion." },
        { h: "Images to PDF", p: "Convert JPG and PNG images to PDF documents. Great for creating portfolios, combining photos into a document, or preparing image-based reports." },
        { h: "Maintain Quality", p: "All conversions maintain the original quality of your files. No compression or quality loss occurs during the conversion process." },
      ]},
    RO: { title: "Converteste Word, Excel si Imagini in PDF Usor", date: "24 Feb 2026", category: "Ghid", readTime: "5 min",
      sections: [
        { h: "O Platforma, Toate Conversiile", p: "DocM suporta conversia fisierelor Word, Excel, PowerPoint, JPG si PNG in PDF. Nu ai nevoie de instrumente multiple — totul e disponibil intr-un singur loc." },
        { h: "Word in PDF", p: "Incarca fisierul .docx si obtine un PDF perfect formatat in cateva secunde. Fonturile, imaginile, tabelele si aspectele sunt pastrate in timpul conversiei." },
        { h: "Imagini in PDF", p: "Converteste imagini JPG si PNG in documente PDF. Excelent pentru crearea portofoliilor, combinarea fotografiilor intr-un document sau pregatirea rapoartelor bazate pe imagini." },
        { h: "Mentine Calitatea", p: "Toate conversiile mentin calitatea originala a fisierelor. Nicio compresie sau pierdere de calitate nu are loc in timpul procesului de conversie." },
      ]},
  },
]

export default function BlogPostPage() {
  const params = useParams()
  const { lang, classicMode, setClassicMode } = useApp()
  const cm = classicMode
  const post = posts.find(p => p.slug === params.slug)

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Post not found</h1>
          <Link href="/blog" className="text-purple-400 hover:text-purple-300">Back to Blog</Link>
        </div>
      </div>
    )
  }

  const c = post[lang as "EN" | "RO"] || post.EN

  return (
    <div className={`min-h-screen ${cm ? "bg-white text-black" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 h-14 ${cm ? "bg-white/90 border-b border-gray-200" : "bg-[#0a0f2e]/90 backdrop-blur-xl border-b border-white/10"} flex items-center px-6`}>
        <Link href="/" className="flex items-center gap-2"><img src="/logo.png" className="w-28 h-auto object-contain" alt="DocM" /></Link>
        <div className="flex-1" />
        <div className="flex gap-2 items-center">
          <button onClick={() => setClassicMode(!cm)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${cm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
            {cm ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
          </button>
          <Link href="/blog" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${cm ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>{lang === "RO" ? "Inapoi la Blog" : "Back to Blog"}</Link>
        </div>
      </div>

      <div className="pt-20 pb-20 px-6 max-w-3xl mx-auto">
        <div className={`h-48 rounded-2xl bg-gradient-to-br ${post.color} flex items-center justify-center mb-8`}>
          <img src={post.image} className="w-20 h-20 object-contain opacity-80" alt="" />
        </div>

        <div className={`flex items-center gap-3 text-xs mb-4 ${cm ? "text-gray-400" : "text-white/40"}`}>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-medium">{c.category}</span>
          <span>{c.date}</span>
          <span className={`w-1 h-1 rounded-full ${cm ? "bg-gray-300" : "bg-white/20"}`} />
          <span>{c.readTime} {lang === "RO" ? "citire" : "read"}</span>
        </div>

        <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${cm ? "text-gray-900" : ""}`}>{c.title}</h1>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <section key={i}>
              <h2 className={`text-xl font-semibold mb-3 ${cm ? "text-gray-800" : "text-white/90"}`}>{s.h}</h2>
              <p className={`text-sm leading-relaxed ${cm ? "text-gray-600" : "text-white/60"}`}>{s.p}</p>
            </section>
          ))}
        </div>

        {post.tool && (
          <div className={`mt-12 p-6 rounded-2xl text-center ${cm ? "bg-gray-50 border border-gray-200" : "bg-white/5 border border-white/10"}`}>
            <p className={`text-sm mb-4 ${cm ? "text-gray-600" : "text-white/60"}`}>{lang === "RO" ? "Incearca acest instrument acum:" : "Try this tool now:"}</p>
            <Link href={post.tool} className="inline-block px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg">
              {lang === "RO" ? "Deschide Instrumentul" : "Open Tool"}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
