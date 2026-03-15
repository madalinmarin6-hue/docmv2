"use client"

import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const txt = {
  EN: {
    badge: "About Us",
    title: "The Story Behind DocM",
    desc: "DocM started from a simple frustration: why should anyone pay $15-30 per month just to edit a document? We believe document editing should be accessible to everyone — students, freelancers, small businesses, and anyone who needs to get work done without expensive software.",
    founderTitle: "The Developers",
    founderName: "Madalin",
    founderRole: "Founder & Developer",
    founderBio: "Hi, I'm Madalin — a developer from Romania who built DocM from scratch. I started this project because I saw how many people struggled with expensive document tools. As a student myself, I know what it feels like to need a simple PDF edit and be blocked by a paywall. DocM is my answer to that problem. I'm building this platform with honesty, transparency, and a genuine desire to help people.",
    whyTitle: "Why DocM?",
    whyItems: [
      { icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", title: "Truly Affordable", desc: "While other platforms charge $15-30/month, DocM gives you 10 free edits every single day. Need more? Watch a short ad or upgrade to Premium at a fraction of the cost. No hidden fees, no tricks." },
      { icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", title: "Built for Real People", desc: "Whether you're a student converting a thesis to PDF, a freelancer editing an invoice, or a teacher preparing materials — DocM is designed for you. Real tools, for real needs, without the bloat." },
      { icon: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25", title: "No Installation Required", desc: "Everything runs in your browser. No downloads, no heavy Office suites. Just open DocM and start working. It works on Windows, Mac, Linux, tablets, and even phones." },
      { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", title: "Constantly Improving", desc: "DocM is a young platform and we're adding new features every week. Your feedback directly shapes what we build next. Every suggestion matters to us." },
    ],
    mission: "Our Mission",
    missionDesc: "To make professional document editing accessible to everyone. We believe you shouldn't need to spend a fortune to convert a PDF, edit a Word file, or create a presentation. DocM exists so that everyone — regardless of their budget — can get their work done efficiently and professionally.",
    vision: "Growing Together",
    visionDesc: "We're not going to pretend DocM is perfect — it's not. We're a young, growing platform, and we're learning alongside our users. Some features are still being refined, and we appreciate every bit of patience and feedback from our community. Together, we're building something meaningful.",
    honesty: "A Note of Honesty",
    honestyDesc: "DocM is still evolving, and like any growing platform, it may have a few bugs here and there. We're working hard to fix them as fast as possible. If you encounter any issue, please use our Bug Report feature — it helps us improve faster. As a token of gratitude, users who report valid bugs will be rewarded with bonus edits and premium time.",
    reportBtn: "Report a Bug",
    stats: [{ value: "10+", label: "File Formats" }, { value: "10/day", label: "Free Edits" }, { value: "99.9%", label: "Uptime" }, { value: "0", label: "Software to Install" }],
    journey: "Our Journey",
    timeline: [
      { year: "Jan 2026", icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18", t: "The Spark", d: "Realized how overpriced document editing tools were. Decided to build an affordable alternative that anyone could use." },
      { year: "Feb 2026", icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z", t: "Launch", d: "Released the first version with PDF conversion and basic editing tools. A simple but functional start." },
      { year: "Mar 2026", icon: "M11.42 15.17l-5.648-3.258a2.25 2.25 0 01-.773-.773l-3.258-5.648a.75.75 0 011.004-1.004l5.648 3.258a2.25 2.25 0 01.773.773l3.258 5.648a.75.75 0 01-1.004 1.004z", t: "Full Suite", d: "Added Word, Excel, PowerPoint, CSV, TXT editors, OCR, background removal, PDF creator, and many more tools." },
      { year: "2026", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z", t: "Community", d: "Growing our user base, adding referral rewards, premium features, and building based on real feedback every single day." },
    ],
  },
  RO: {
    badge: "Despre Noi",
    title: "Povestea din Spatele DocM",
    desc: "DocM a inceput dintr-o frustrare simpla: de ce ar trebui sa platesti 15-30$ pe luna doar ca sa editezi un document? Credem ca editarea documentelor ar trebui sa fie accesibila tuturor — studenti, freelanceri, afaceri mici si oricine are nevoie sa lucreze fara software scump.",
    founderTitle: "Developerii",
    founderName: "Madalin",
    founderRole: "Fondator & Dezvoltator",
    founderBio: "Salut, sunt Madalin — un dezvoltator din Romania care a construit DocM de la zero. Am inceput acest proiect pentru ca am vazut cati oameni se lupta cu instrumente de documente scumpe. Ca student, stiu cum e sa ai nevoie de o simpla editare PDF si sa fii blocat de un paywall. DocM este raspunsul meu la aceasta problema. Construiesc aceasta platforma cu onestitate, transparenta si o dorinta reala de a ajuta oamenii.",
    whyTitle: "De Ce DocM?",
    whyItems: [
      { icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", title: "Cu Adevarat Accesibil", desc: "In timp ce alte platforme cer 15-30$/luna, DocM iti ofera 10 editari gratuite in fiecare zi. Ai nevoie de mai multe? Urmareste o reclama scurta sau fa upgrade la Premium la o fractiune din cost. Fara taxe ascunse, fara trucuri." },
      { icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", title: "Construit pentru Oameni Reali", desc: "Fie ca esti student care converteste o lucrare in PDF, freelancer care editeaza o factura, sau profesor care pregateste materiale — DocM este facut pentru tine. Instrumente reale, pentru nevoi reale." },
      { icon: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25", title: "Fara Instalare", desc: "Totul ruleaza in browser. Fara descarcare, fara suite Office grele. Deschide DocM si incepe sa lucrezi. Functioneaza pe Windows, Mac, Linux, tablete si chiar telefoane." },
      { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", title: "In Continua Imbunatatire", desc: "DocM este o platforma tanara si adaugam functii noi in fiecare saptamana. Feedback-ul tau modeleaza direct ce construim. Fiecare sugestie conteaza pentru noi." },
    ],
    mission: "Misiunea Noastra",
    missionDesc: "Sa facem editarea profesionala a documentelor accesibila tuturor. Credem ca nu ar trebui sa cheltuiesti o avere ca sa convertesti un PDF, sa editezi un fisier Word sau sa creezi o prezentare. DocM exista pentru ca toata lumea — indiferent de buget — sa isi poata face treaba eficient si profesional.",
    vision: "Crestem Impreuna",
    visionDesc: "Nu pretindem ca DocM este perfect — nu este. Suntem o platforma tanara, in crestere, si invatam alaturi de utilizatorii nostri. Unele functii sunt inca in curs de rafinare, si apreciem fiecare pic de rabdare si feedback din partea comunitatii. Impreuna, construim ceva cu adevarat valoros.",
    honesty: "O Nota de Sinceritate",
    honestyDesc: "DocM inca evolueaza, si ca orice platforma in crestere, poate avea cateva buguri pe ici pe colo. Lucram din greu sa le rezolvam cat mai repede. Daca intalnesti vreo problema, te rugam sa folosesti functia de Raport Bug — ne ajuta sa ne imbunatatim mai rapid. Ca semn de recunostinta, utilizatorii care raporteaza buguri valide vor fi recompensati cu editari bonus si timp premium.",
    reportBtn: "Raporteaza un Bug",
    stats: [{ value: "10+", label: "Formate Fisiere" }, { value: "10/zi", label: "Editari Gratuite" }, { value: "99.9%", label: "Disponibilitate" }, { value: "0", label: "Software de Instalat" }],
    journey: "Parcursul Nostru",
    timeline: [
      { year: "Ian 2026", icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18", t: "Scanteia", d: "Am realizat cat de scumpe sunt instrumentele de editare documente. Am decis sa construiesc o alternativa accesibila pe care oricine o poate folosi." },
      { year: "Feb 2026", icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z", t: "Lansare", d: "Am lansat prima versiune cu conversie PDF si instrumente de editare de baza. Un inceput simplu dar functional." },
      { year: "Mar 2026", icon: "M11.42 15.17l-5.648-3.258a2.25 2.25 0 01-.773-.773l-3.258-5.648a.75.75 0 011.004-1.004l5.648 3.258a2.25 2.25 0 01.773.773l3.258 5.648a.75.75 0 01-1.004 1.004z", t: "Suita Completa", d: "Am adaugat editoare Word, Excel, PowerPoint, CSV, TXT, OCR, stergere fundal, creator PDF si multe alte instrumente." },
      { year: "2026", icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z", t: "Comunitate", d: "Crestem baza de utilizatori, adaugam recompense pentru referral, functii premium si construim bazat pe feedback-ul real in fiecare zi." },
    ],
  }
}

export default function AboutPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const c = txt[lang as "EN" | "RO"] || txt.EN
  const cm = classicMode

  return (
    <div className={`min-h-screen ${cm ? "bg-[#f0f2f5] text-gray-900" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">

        {/* TEAM - TOP */}
        <div className="mb-20">
          <p className="text-sm font-semibold tracking-widest uppercase text-orange-400 mb-10 text-center">{c.founderTitle}</p>
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Madalin */}
            <div className={`text-center p-8 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-5 text-white font-bold text-3xl shadow-xl shadow-blue-500/25">M</div>
              <h3 className={`text-2xl font-bold mb-1 ${cm ? "text-gray-900" : ""}`}>{c.founderName}</h3>
              <p className={`text-sm mb-4 ${cm ? "text-gray-500" : "text-white/40"}`}>{c.founderRole}</p>
              <p className={`text-sm leading-relaxed mb-5 ${cm ? "text-gray-600" : "text-white/60"}`}>{c.founderBio}</p>
              <a href="https://instagram.com/mmadalin5" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                Instagram
              </a>
            </div>
            {/* Steezy */}
            <div className={`text-center p-8 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-5 text-white font-bold text-3xl shadow-xl shadow-emerald-500/25">S</div>
              <h3 className={`text-2xl font-bold mb-1 ${cm ? "text-gray-900" : ""}`}>Steezy</h3>
              <p className={`text-sm mb-4 ${cm ? "text-gray-500" : "text-white/40"}`}>{lang === "RO" ? "Scripter & Co-Dezvoltator" : "Scripter & Co-Developer"}</p>
              <p className={`text-sm leading-relaxed mb-5 ${cm ? "text-gray-600" : "text-white/60"}`}>
                {lang === "RO"
                  ? "Automatizează interacțiunea cu clienții tăi prin Chatboți AI și site-uri performante. Lasă tehnologia să lucreze pentru tine."
                  : "Automates customer interaction through AI Chatbots and high-performance websites. Let technology work for you."}
              </p>
              {/* Services from SteeZyTech */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className={`p-3 rounded-xl ${cm ? "bg-gray-50 border border-gray-100" : "bg-white/[0.03] border border-white/5"}`}>
                  <svg className={`w-6 h-6 mx-auto mb-1.5 ${cm ? "text-blue-600" : "text-blue-400"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                  <p className={`text-[10px] font-bold ${cm ? "text-gray-800" : "text-white/80"}`}>{lang === "RO" ? "Chatboți AI" : "AI Chatbots"}</p>
                  <p className={`text-[9px] mt-0.5 leading-tight ${cm ? "text-gray-500" : "text-white/40"}`}>{lang === "RO" ? "Suport 24/7 instant pentru clienți" : "24/7 instant customer support"}</p>
                </div>
                <div className={`p-3 rounded-xl ${cm ? "bg-gray-50 border border-gray-100" : "bg-white/[0.03] border border-white/5"}`}>
                  <svg className={`w-6 h-6 mx-auto mb-1.5 ${cm ? "text-blue-600" : "text-blue-400"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                  <p className={`text-[10px] font-bold ${cm ? "text-gray-800" : "text-white/80"}`}>Web Design</p>
                  <p className={`text-[9px] mt-0.5 leading-tight ${cm ? "text-gray-500" : "text-white/40"}`}>{lang === "RO" ? "Site-uri rapide, optimizate SEO" : "Fast sites, SEO optimized"}</p>
                </div>
                <div className={`p-3 rounded-xl ${cm ? "bg-gray-50 border border-gray-100" : "bg-white/[0.03] border border-white/5"}`}>
                  <svg className={`w-6 h-6 mx-auto mb-1.5 ${cm ? "text-blue-600" : "text-blue-400"}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  <p className={`text-[10px] font-bold ${cm ? "text-gray-800" : "text-white/80"}`}>{lang === "RO" ? "Automatizări" : "Automations"}</p>
                  <p className={`text-[9px] mt-0.5 leading-tight ${cm ? "text-gray-500" : "text-white/40"}`}>{lang === "RO" ? "CRM, Email și SMS automat" : "CRM, Email & SMS automated"}</p>
                </div>
              </div>
              <a href="https://steezytech.ro/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                steezytech.ro
              </a>
            </div>
          </div>
        </div>

        {/* ABOUT HEADING */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-orange-400 mb-3">{c.badge}</p>
          <h1 className={`text-5xl md:text-6xl font-bold ${cm ? "text-gray-900" : "bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent"}`}>{c.title}</h1>
          <p className={`mt-6 max-w-2xl mx-auto text-base leading-relaxed ${cm ? "text-gray-600" : "text-white/60"}`}>{c.desc}</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {c.stats.map((stat, i) => (
            <div key={i} className={`text-center p-6 rounded-2xl transition ${cm ? "bg-white border border-gray-200 hover:border-gray-300 shadow-sm" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{stat.value}</p>
              <p className={`text-xs mt-2 ${cm ? "text-gray-500" : "text-white/40"}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* WHY DOCM */}
        <div className="mb-20">
          <h2 className={`text-3xl font-bold text-center mb-10 ${cm ? "text-gray-900" : ""}`}>{c.whyTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {c.whyItems.map((item, i) => (
              <div key={i} className={`p-7 rounded-2xl transition-all hover:-translate-y-1 ${cm ? "bg-white border border-gray-200 hover:border-gray-300 shadow-sm" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${["from-blue-500 to-cyan-400", "from-emerald-500 to-teal-400", "from-purple-500 to-pink-400", "from-orange-500 to-amber-400"][i]} flex items-center justify-center mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${cm ? "text-gray-900" : ""}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${cm ? "text-gray-600" : "text-white/60"}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MISSION & VISION */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <div className={`p-8 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className={`text-xl font-bold mb-3 ${cm ? "text-gray-900" : ""}`}>{c.mission}</h3>
            <p className={`text-sm leading-relaxed ${cm ? "text-gray-600" : "text-white/60"}`}>{c.missionDesc}</p>
          </div>
          <div className={`p-8 rounded-2xl ${cm ? "bg-white border border-gray-200 shadow-sm" : "bg-white/5 border border-white/10"}`}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            </div>
            <h3 className={`text-xl font-bold mb-3 ${cm ? "text-gray-900" : ""}`}>{c.vision}</h3>
            <p className={`text-sm leading-relaxed ${cm ? "text-gray-600" : "text-white/60"}`}>{c.visionDesc}</p>
          </div>
        </div>

        {/* HONESTY / BUG REPORT */}
        <div className={`p-8 rounded-2xl mb-20 ${cm ? "bg-amber-50 border border-amber-200" : "bg-amber-500/5 border border-amber-400/20"}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${cm ? "text-amber-800" : "text-amber-300"}`}>{c.honesty}</h3>
              <p className={`text-sm leading-relaxed mb-4 ${cm ? "text-amber-700" : "text-amber-200/70"}`}>{c.honestyDesc}</p>
              <Link href="/report-bug" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135c-.22-2.058-1.907-3.555-3.97-3.555H8.916c-2.064 0-3.75 1.497-3.97 3.555a23.867 23.867 0 01-1.153 6.135A24.054 24.054 0 0112 12.75z" /></svg>
                {c.reportBtn}
              </Link>
            </div>
          </div>
        </div>

        {/* JOURNEY - HORIZONTAL CARDS */}
        <div className="mb-10">
          <h2 className={`text-3xl font-bold text-center mb-12 ${cm ? "text-gray-900" : ""}`}>{c.journey}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.timeline.map((item, i) => (
              <div key={i} className={`p-6 rounded-2xl text-center transition-all hover:-translate-y-1 ${cm ? "bg-white border border-gray-200 hover:border-gray-300 shadow-sm" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${["from-blue-500 to-cyan-400", "from-emerald-500 to-teal-400", "from-purple-500 to-pink-400", "from-orange-500 to-amber-400"][i]} flex items-center justify-center mx-auto mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                </div>
                <p className="text-xs font-bold text-blue-400 mb-2">{item.year}</p>
                <h4 className={`font-bold mb-2 ${cm ? "text-gray-900" : ""}`}>{item.t}</h4>
                <p className={`text-xs leading-relaxed ${cm ? "text-gray-500" : "text-white/50"}`}>{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer lang={lang} classicMode={classicMode} />
    </div>
  )
}
