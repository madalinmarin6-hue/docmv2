"use client"

import Link from "next/link"
import LangToggle from "@/components/LangToggle"
import { useApp } from "@/components/AppContext"

const text = {
  EN: {
    title: "Terms & Conditions",
    updated: "Last updated: March 11, 2026",
    sections: [
      { h: "1. Acceptance of Terms", p: 'By accessing and using DocM ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access or use the Service.' },
      { h: "2. Description of Service", p: "DocM provides online document editing, conversion, and management tools including but not limited to:", list: ["PDF editing, creation, splitting, and compression", "Document conversion between formats (PDF, Word, Excel, PowerPoint, JPG, PNG, TXT, HTML, CSV)", "Online editors for Word, Excel, PowerPoint, TXT, and CSV files", "Background removal from images", "File management and storage for registered users"] },
      { h: "3. User Accounts", p: "To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information when creating your account and to keep this information up to date." },
      { h: "4. Acceptable Use", p: "You agree not to:", list: ["Upload, convert, or process any content that is illegal, harmful, threatening, abusive, or otherwise objectionable", "Use the Service to infringe on the intellectual property rights of others", "Attempt to gain unauthorized access to any part of the Service", "Use automated tools or bots to access the Service excessively", "Distribute malware or harmful code through the Service"] },
      { h: "5. File Processing & Data Handling", p: "Files uploaded for conversion or editing are processed on our servers. We do not permanently store your files beyond the processing duration unless you are a registered user who explicitly saves files to their account. Temporary files are automatically deleted after processing is complete." },
      { h: "6. Intellectual Property", p: "The Service and its original content, features, and functionality are owned by DocM and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of any content you upload or create using the Service." },
      { h: "7. Free and Premium Plans", p: "DocM offers both free and premium plans. Free users may have limitations on file sizes, number of conversions, or available features. Premium plan pricing and features are described on our website and may be updated from time to time." },
      { h: "8. Limitation of Liability", p: 'DocM is provided "as is" without any warranties, expressed or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that converted files will be 100% identical to the originals. In no event shall DocM be liable for any indirect, incidental, special, or consequential damages.' },
      { h: "9. Termination", p: "We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties." },
      { h: "10. Changes to Terms", p: 'We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes acceptance of the modified terms.' },
      { h: "11. Cloud Storage", p: "DocM provides a cloud storage feature that allows registered users to save files for the sole purpose of easier re-editing at a later time. Cloud-stored files are not shared publicly and are automatically deleted after 30 days of inactivity. Users can enable or disable cloud storage from their Profile settings at any time. By using cloud storage, you acknowledge that:", list: ["Files are stored solely to facilitate future editing and are not used for any other purpose.", "Free accounts have a storage limit of 500 MB; Premium accounts have a limit of 2 GB.", "DocM reserves the right to remove stored files that violate these Terms or applicable laws.", "You are responsible for maintaining your own backups of important files."] },
      { h: "12. Contact", p: "If you have any questions about these Terms, please contact us through our Contact page." },
    ],
    home: "Home",
  },
  RO: {
    title: "Termeni și Condiții",
    updated: "Ultima actualizare: 11 Martie 2026",
    sections: [
      { h: "1. Acceptarea Termenilor", p: 'Prin accesarea și utilizarea DocM („Serviciul"), sunteți de acord să respectați acești Termeni și Condiții. Dacă nu sunteți de acord cu acești termeni, vă rugăm să nu utilizați Serviciul. Acești termeni se aplică tuturor vizitatorilor, utilizatorilor și celorlalte persoane care accesează sau utilizează Serviciul.' },
      { h: "2. Descrierea Serviciului", p: "DocM oferă instrumente online de editare, conversie și gestionare a documentelor, incluzând, dar fără a se limita la:", list: ["Editare, creare, separare și comprimare PDF", "Conversie documente între formate (PDF, Word, Excel, PowerPoint, JPG, PNG, TXT, HTML, CSV)", "Editoare online pentru fișiere Word, Excel, PowerPoint, TXT și CSV", "Eliminarea fundalului din imagini", "Gestionare și stocare fișiere pentru utilizatorii înregistrați"] },
      { h: "3. Conturi de Utilizator", p: "Pentru a accesa anumite funcționalități ale Serviciului, este posibil să fie necesar să vă creați un cont. Sunteți responsabil pentru menținerea confidențialității credențialelor contului. Sunteți de acord să furnizați informații corecte și complete la crearea contului și să mențineți aceste informații actualizate." },
      { h: "4. Utilizare Acceptabilă", p: "Sunteți de acord să nu:", list: ["Încărcați, convertiți sau procesați conținut ilegal, dăunător, amenințător, abuziv sau inacceptabil", "Utilizați Serviciul pentru a încălca drepturile de proprietate intelectuală ale altora", "Încercați să obțineți acces neautorizat la orice parte a Serviciului", "Utilizați instrumente automate sau roboți pentru a accesa Serviciul excesiv", "Distribuiți malware sau cod dăunător prin intermediul Serviciului"] },
      { h: "5. Procesarea Fișierelor și Gestionarea Datelor", p: "Fișierele încărcate pentru conversie sau editare sunt procesate pe serverele noastre. Nu stocăm permanent fișierele dumneavoastră dincolo de durata procesării, cu excepția cazului în care sunteți un utilizator înregistrat care salvează explicit fișierele în contul său. Fișierele temporare sunt șterse automat după finalizarea procesării." },
      { h: "6. Proprietate Intelectuală", p: "Serviciul și conținutul său original, funcționalitățile și funcționalitatea sunt deținute de DocM și sunt protejate de legile internaționale privind drepturile de autor, marca comercială și alte legi privind proprietatea intelectuală. Păstrați dreptul de proprietate asupra oricărui conținut pe care îl încărcați sau creați folosind Serviciul." },
      { h: "7. Planuri Gratuite și Premium", p: "DocM oferă atât planuri gratuite, cât și premium. Utilizatorii gratuiți pot avea limitări privind dimensiunea fișierelor, numărul de conversii sau funcționalitățile disponibile. Prețurile și funcționalitățile planului premium sunt descrise pe site-ul nostru și pot fi actualizate periodic." },
      { h: "8. Limitarea Răspunderii", p: 'DocM este furnizat „așa cum este" fără nicio garanție, expresă sau implicită. Nu garantăm că Serviciul va fi neîntrerupt, fără erori sau că fișierele convertite vor fi 100% identice cu originalele. În niciun caz DocM nu va fi răspunzător pentru daune indirecte, incidentale, speciale sau consecvente.' },
      { h: "9. Reziliere", p: "Ne rezervăm dreptul de a rezilia sau suspenda contul și accesul dumneavoastră la Serviciu la discreția noastră exclusivă, fără notificare prealabilă, pentru un comportament care, în opinia noastră, încalcă acești Termeni sau este dăunător altor utilizatori ai Serviciului, nouă sau terților." },
      { h: "10. Modificări ale Termenilor", p: 'Ne rezervăm dreptul de a modifica acești termeni în orice moment. Vom notifica utilizatorii cu privire la orice modificări substanțiale prin publicarea noilor Termeni pe această pagină și actualizarea datei „Ultima actualizare". Continuarea utilizării Serviciului după publicarea modificărilor constituie acceptarea termenilor modificați.' },
      { h: "11. Stocare Cloud", p: "DocM oferă o funcționalitate de stocare cloud care permite utilizatorilor înregistrați să salveze fișiere exclusiv în scopul re-editării ulterioare mai ușoare. Fișierele stocate în cloud nu sunt partajate public și sunt șterse automat după 30 de zile de inactivitate. Utilizatorii pot activa sau dezactiva stocarea cloud din setările Profilului în orice moment. Prin utilizarea stocării cloud, recunoașteți că:", list: ["Fișierele sunt stocate exclusiv pentru a facilita editarea ulterioară și nu sunt utilizate în niciun alt scop.", "Conturile gratuite au o limită de stocare de 500 MB; conturile Premium au o limită de 2 GB.", "DocM își rezervă dreptul de a elimina fișierele stocate care încalcă acești Termeni sau legile aplicabile.", "Sunteți responsabil pentru menținerea propriilor copii de siguranță ale fișierelor importante."] },
      { h: "12. Contact", p: "Dacă aveți întrebări despre acești Termeni, vă rugăm să ne contactați prin pagina noastră de Contact." },
    ],
    home: "Acasă",
  }
}

export default function TermsPage() {
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
