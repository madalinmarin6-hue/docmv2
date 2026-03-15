"use client"

import Link from "next/link"
import { useApp } from "@/components/AppContext"
import LangToggle from "@/components/LangToggle"

const text = {
  EN: {
    title: "Cookie Policy",
    updated: "Last updated: March 15, 2026",
    sections: [
      { h: "1. What Are Cookies?", p: "Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners." },
      { h: "2. How We Use Cookies", p: "DocM uses cookies and similar technologies for the following purposes:", list: ["Authentication: To keep you logged in and maintain your session securely.", "Preferences: To remember your language preference, theme (dark/light mode), and other settings.", "Analytics: To understand how visitors interact with our platform so we can improve the user experience.", "Security: To detect and prevent fraudulent activity and ensure the safety of our services.", "Functionality: To enable core features like document editing, file processing, and tool access."] },
      { h: "3. Types of Cookies We Use", p: "We use the following categories of cookies:", list: ["Essential Cookies: Required for basic site functionality such as authentication, session management, and security. These cannot be disabled.", "Preference Cookies: Store your choices like language, theme, and display settings to personalize your experience.", "Analytics Cookies: Help us understand usage patterns, popular tools, and areas for improvement. This data is anonymized.", "Visitor Tracking: We use a locally stored visitor ID to track active users on the platform for real-time online counts. This does not contain personal information."] },
      { h: "4. Third-Party Cookies", p: "DocM may use limited third-party services that set their own cookies. These may include analytics providers. We do not use third-party advertising cookies. Any third-party cookies are subject to the respective privacy policies of those providers." },
      { h: "5. Local Storage", p: "In addition to cookies, DocM uses browser local storage to save:", list: ["Your visitor ID for online presence tracking (anonymous)", "Theme and language preferences", "Session tokens for authentication", "Temporary data for document editing tools"] },
      { h: "6. Managing Cookies", p: "You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or delete existing ones. Please note that disabling essential cookies may affect the functionality of DocM, including the ability to log in and use editing tools." },
      { h: "7. Cookie Retention", p: "Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. Authentication cookies typically expire after 30 days of inactivity." },
      { h: "8. Updates to This Policy", p: "We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. Your continued use of DocM after changes are posted constitutes acceptance of the updated policy." },
      { h: "9. Contact", p: "If you have any questions about our use of cookies, please visit our Help & Contact page or email us at support@docm.app." },
    ],
    home: "Home",
  },
  RO: {
    title: "Politica de Cookie-uri",
    updated: "Ultima actualizare: 15 Martie 2026",
    sections: [
      { h: "1. Ce Sunt Cookie-urile?", p: "Cookie-urile sunt fisiere text mici care sunt plasate pe dispozitivul tau atunci cand vizitezi un site web. Sunt utilizate pe scara larga pentru a face site-urile sa functioneze mai eficient si pentru a furniza informatii proprietarilor site-urilor." },
      { h: "2. Cum Folosim Cookie-urile", p: "DocM foloseste cookie-uri si tehnologii similare in urmatoarele scopuri:", list: ["Autentificare: Pentru a te mentine autentificat si a pastra sesiunea in siguranta.", "Preferinte: Pentru a retine preferinta de limba, tema (mod inchis/deschis) si alte setari.", "Analiza: Pentru a intelege cum interactioneaza vizitatorii cu platforma noastra, astfel incat sa putem imbunatati experienta.", "Securitate: Pentru a detecta si preveni activitatile frauduloase si a asigura siguranta serviciilor noastre.", "Functionalitate: Pentru a activa functiile de baza precum editarea documentelor, procesarea fisierelor si accesul la instrumente."] },
      { h: "3. Tipuri de Cookie-uri Utilizate", p: "Folosim urmatoarele categorii de cookie-uri:", list: ["Cookie-uri Esentiale: Necesare pentru functionalitatile de baza ale site-ului, cum ar fi autentificarea, gestionarea sesiunii si securitatea. Acestea nu pot fi dezactivate.", "Cookie-uri de Preferinta: Stocheaza alegerile tale precum limba, tema si setarile de afisare pentru a personaliza experienta.", "Cookie-uri de Analiza: Ne ajuta sa intelegem modelele de utilizare, instrumentele populare si zonele de imbunatatire. Aceste date sunt anonimizate.", "Urmarire Vizitatori: Folosim un ID de vizitator stocat local pentru a urmari utilizatorii activi pe platforma pentru numaratori in timp real. Acesta nu contine informatii personale."] },
      { h: "4. Cookie-uri Terte", p: "DocM poate folosi servicii terte limitate care seteaza propriile cookie-uri. Acestea pot include furnizori de analiza. Nu folosim cookie-uri de publicitate terte. Orice cookie-uri terte sunt supuse politicilor de confidentialitate respective ale acelor furnizori." },
      { h: "5. Stocare Locala", p: "Pe langa cookie-uri, DocM foloseste stocarea locala a browserului pentru a salva:", list: ["ID-ul tau de vizitator pentru urmarirea prezentei online (anonim)", "Preferintele de tema si limba", "Token-uri de sesiune pentru autentificare", "Date temporare pentru instrumentele de editare documente"] },
      { h: "6. Gestionarea Cookie-urilor", p: "Poti controla si gestiona cookie-urile prin setarile browserului tau. Majoritatea browserelor iti permit sa refuzi cookie-urile sau sa le stergi pe cele existente. Te rugam sa retii ca dezactivarea cookie-urilor esentiale poate afecta functionalitatea DocM, inclusiv capacitatea de a te autentifica si de a folosi instrumentele de editare." },
      { h: "7. Retinerea Cookie-urilor", p: "Cookie-urile de sesiune sunt sterse cand inchizi browserul. Cookie-urile persistente raman pe dispozitivul tau pentru o perioada stabilita sau pana cand le stergi. Cookie-urile de autentificare expira de obicei dupa 30 de zile de inactivitate." },
      { h: "8. Actualizari ale Acestei Politici", p: "Putem actualiza aceasta Politica de Cookie-uri din cand in cand. Orice modificari vor fi publicate pe aceasta pagina cu o data de revizie actualizata. Continuarea utilizarii DocM dupa publicarea modificarilor constituie acceptarea politicii actualizate." },
      { h: "9. Contact", p: "Daca ai intrebari despre utilizarea cookie-urilor, te rugam sa vizitezi pagina noastra de Ajutor & Contact sau sa ne trimiti un email la support@docm.app." },
    ],
    home: "Acasa",
  }
}

export default function CookiesPage() {
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

        <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${classicMode ? "text-gray-900" : "bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent"}`}>
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
