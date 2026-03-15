"use client"

import Link from "next/link"
import LangToggle from "@/components/LangToggle"
import { useApp } from "@/components/AppContext"

const text = {
  EN: {
    title: "Privacy Policy",
    updated: "Last updated: March 11, 2026",
    home: "Home",
    sections: [
      { h: "1. Information We Collect", p: "When you use DocM, we may collect the following types of information:", list: ["Account Information: Name, email address, and password when you create an account", "Usage Data: Pages visited, features used, time spent on the platform, and browser/device information", "Uploaded Files: Documents you upload for conversion or editing (processed temporarily)", "Cookies: Session cookies and preference cookies (language, theme)"] },
      { h: "2. How We Use Your Information", p: "We use the information we collect to:", list: ["Provide, maintain, and improve the Service", "Process your document conversions and edits", "Manage your account and provide customer support", "Send important service notifications", "Analyze usage patterns to improve user experience", "Prevent fraud and ensure security"] },
      { h: "3. File Processing & Storage", p: "Files uploaded for conversion or editing are processed on our servers and are handled as follows:", list: ["Files are processed in memory and are not permanently stored unless you explicitly save them to your account", "Temporary processing files are automatically deleted after conversion is complete", "We do not access, read, or analyze the content of your files beyond what is necessary for the requested conversion/edit", "Registered users who save files can delete them at any time from their dashboard"] },
      { h: "4. Data Sharing", p: "We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:", list: ["With your explicit consent", "To comply with legal obligations or valid legal processes", "To protect the rights, property, or safety of DocM, our users, or the public", "With service providers who assist in operating our platform (under strict confidentiality agreements)"] },
      { h: "5. Cookies & Local Storage", p: "We use cookies and local storage to:", list: ["Maintain your session when logged in", "Remember your language preference (English/Romanian)", "Remember your theme preference (dark/light mode)", "Analyze site traffic and usage patterns"] },
      { h: "6. Data Security", p: "We implement appropriate technical and organizational measures to protect your personal information, including HTTPS encryption, secure authentication, and access controls. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security." },
      { h: "7. Your Rights", p: "You have the right to:", list: ["Access the personal data we hold about you", "Request correction of inaccurate data", "Request deletion of your account and associated data", "Withdraw consent for data processing at any time", "Export your data in a portable format"] },
      { h: "8. Children's Privacy", p: "The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it promptly." },
      { h: "9. Changes to This Policy", p: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.' },
      { h: "10. Contact", p: "If you have any questions about this Privacy Policy, please contact us through our Contact page." },
    ],
  },
  RO: {
    title: "Politica de Confidențialitate",
    updated: "Ultima actualizare: 11 Martie 2026",
    home: "Acasă",
    sections: [
      { h: "1. Informații pe care le Colectăm", p: "Când utilizați DocM, putem colecta următoarele tipuri de informații:", list: ["Informații despre cont: Nume, adresă de email și parolă la crearea contului", "Date de utilizare: Pagini vizitate, funcționalități folosite, timp petrecut pe platformă și informații despre browser/dispozitiv", "Fișiere încărcate: Documente pe care le încărcați pentru conversie sau editare (procesate temporar)", "Cookie-uri: Cookie-uri de sesiune și de preferințe (limbă, temă)"] },
      { h: "2. Cum Utilizăm Informațiile", p: "Folosim informațiile colectate pentru:", list: ["Furnizarea, menținerea și îmbunătățirea Serviciului", "Procesarea conversiilor și editărilor de documente", "Gestionarea contului și oferirea de suport clienți", "Trimiterea de notificări importante despre serviciu", "Analiza modelelor de utilizare pentru îmbunătățirea experienței", "Prevenirea fraudei și asigurarea securității"] },
      { h: "3. Procesarea și Stocarea Fișierelor", p: "Fișierele încărcate pentru conversie sau editare sunt procesate pe serverele noastre astfel:", list: ["Fișierele sunt procesate în memorie și nu sunt stocate permanent decât dacă le salvați explicit în contul dumneavoastră", "Fișierele temporare de procesare sunt șterse automat după finalizarea conversiei", "Nu accesăm, citim sau analizăm conținutul fișierelor dincolo de necesarul conversiei/editării solicitate", "Utilizatorii înregistrați care salvează fișiere le pot șterge oricând din dashboard"] },
      { h: "4. Partajarea Datelor", p: "Nu vindem, nu comercializăm și nu închiriem informațiile dumneavoastră personale terților. Putem partaja informații doar în următoarele circumstanțe:", list: ["Cu consimțământul dumneavoastră explicit", "Pentru a respecta obligațiile legale sau procesele juridice valide", "Pentru a proteja drepturile, proprietatea sau siguranța DocM, a utilizatorilor noștri sau a publicului", "Cu furnizori de servicii care asistă în operarea platformei noastre (sub acorduri stricte de confidențialitate)"] },
      { h: "5. Cookie-uri și Stocare Locală", p: "Folosim cookie-uri și stocare locală pentru:", list: ["Menținerea sesiunii când sunteți autentificat", "Memorarea preferinței de limbă (Engleză/Română)", "Memorarea preferinței de temă (mod întunecat/luminos)", "Analiza traficului și a modelelor de utilizare"] },
      { h: "6. Securitatea Datelor", p: "Implementăm măsuri tehnice și organizatorice adecvate pentru a proteja informațiile dumneavoastră personale, inclusiv criptare HTTPS, autentificare securizată și controale de acces. Cu toate acestea, nicio metodă de transmisie electronică sau stocare nu este 100% sigură, și nu putem garanta securitate absolută." },
      { h: "7. Drepturile Dumneavoastră", p: "Aveți dreptul de a:", list: ["Accesa datele personale pe care le deținem despre dumneavoastră", "Solicita corectarea datelor inexacte", "Solicita ștergerea contului și a datelor asociate", "Retrage consimțământul pentru procesarea datelor în orice moment", "Exporta datele într-un format portabil"] },
      { h: "8. Confidențialitatea Copiilor", p: "Serviciul nu este destinat copiilor sub 13 ani. Nu colectăm cu bună știință informații personale de la copii sub 13 ani. Dacă descoperim că un copil sub 13 ani ne-a furnizat informații personale, le vom șterge prompt." },
      { h: "9. Modificări ale Politicii", p: "Putem actualiza această Politică de Confidențialitate periodic. Vă vom notifica cu privire la orice modificări prin publicarea noii Politici pe această pagină și actualizarea datei de ultima actualizare." },
      { h: "10. Contact", p: "Dacă aveți întrebări despre această Politică de Confidențialitate, vă rugăm să ne contactați prin pagina noastră de Contact." },
    ],
  }
}

export default function PrivacyPage() {
  const { lang, classicMode, setClassicMode } = useApp()
  const t = text[lang as "EN" | "RO"] || text.EN

  return (
    <div className={`min-h-screen ${classicMode ? "bg-white text-black" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>

      <div className={`fixed top-0 left-0 right-0 z-50 h-14 ${classicMode ? "bg-white/90 border-b border-gray-200" : "bg-[#0a0f2e]/90 backdrop-blur-xl border-b border-white/10"} flex items-center px-6`}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-28 h-auto object-contain" alt="DocM" />
        </Link>
        <div className="flex-1" />
        <div className="flex gap-2 items-center">
          <button onClick={() => setClassicMode(!classicMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${classicMode ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-white/5 text-white/50 hover:bg-white/10"}`} title={classicMode ? "Dark mode" : "Light mode"}>
            {classicMode ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>}
          </button>
          <LangToggle />
          <Link href="/" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${classicMode ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>{t.home}</Link>
        </div>
      </div>

      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${classicMode ? "text-gray-900" : "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"}`}>
          {t.title}
        </h1>
        <p className={`text-sm mb-12 ${classicMode ? "text-gray-400" : "text-white/40"}`}>{t.updated}</p>

        <div className={`space-y-10 text-sm leading-relaxed ${classicMode ? "text-gray-600" : "text-white/70"}`}>
          {t.sections.map((s, i) => (
            <section key={i}>
              <h2 className={`text-lg font-semibold mb-3 ${classicMode ? "text-gray-900" : "text-white"}`}>{s.h}</h2>
              <p>{s.p}</p>
              {s.list && (
                <ul className={`list-disc list-inside mt-2 space-y-1 ${classicMode ? "text-gray-500" : "text-white/60"}`}>
                  {s.list.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

      </div>
    </div>
  )
}
