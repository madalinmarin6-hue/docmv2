"use client"

import { useState } from "react"
import Link from "next/link"
import { useApp } from "@/components/AppContext"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const catIcons = [
  "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
]
const catColors = ["from-blue-500 to-cyan-400", "from-red-500 to-rose-400", "from-purple-500 to-pink-400", "from-emerald-500 to-green-400"]

const t = {
  EN: {
    badge: "Help & Contact", title: "How can we help?", placeholder: "Ask a question...",
    send: "Send", sending: "Sending...", sent: "Message sent! We will get back to you soon.",
    emailPh: "Your email", home: "Home",
    contactTitle: "Contact Us",
    contactDesc: "Have a question, feedback or need support? Reach out to us directly.",
    nameLabel: "Name", namePh: "Your name",
    emailLabel: "Email", emailFormPh: "your@email.com",
    subjectLabel: "Subject", subjectPh: "How can we help?",
    messageLabel: "Message", messagePh: "Tell us more...",
    sendMsg: "Send Message",
    emailInfo: "Email", hoursInfo: "Working Hours", hoursVal: "Mon - Fri: 9:00 - 18:00 CET",
    locationInfo: "Location", locationVal: "Bucharest, Romania",
    chatInfo: "Live Chat", chatVal: "Available 24/7",
    cats: [
      { name: "Getting Started", items: ["Create a free account to access all tools", "Upload your file using drag & drop or file picker", "Choose the right tool from the sidebar", "Download or export your edited document"] },
      { name: "PDF Tools", items: ["View, annotate and sign PDF files", "Add text, images and shapes to PDFs", "Create new PDFs from scratch", "Split, merge and compress PDFs"] },
      { name: "Conversions", items: ["PDF to Word, Excel, PowerPoint, JPG, PNG", "Word, Excel, PowerPoint to PDF", "Image to PDF conversion", "Batch conversion coming soon"] },
      { name: "Document Editors", items: ["Full Word editor with formatting", "Excel editor with formulas support", "PowerPoint slide editor", "TXT, CSV and code editors"] },
    ],
  },
  RO: {
    badge: "Ajutor & Contact", title: "Cu ce te putem ajuta?", placeholder: "Pune o intrebare...",
    send: "Trimite", sending: "Se trimite...", sent: "Mesajul a fost trimis! Revenim curand.",
    emailPh: "Email-ul tau", home: "Acasa",
    contactTitle: "Contacteaza-ne",
    contactDesc: "Ai o intrebare, feedback sau ai nevoie de suport? Contacteaza-ne direct.",
    nameLabel: "Nume", namePh: "Numele tau",
    emailLabel: "Email", emailFormPh: "email@exemplu.com",
    subjectLabel: "Subiect", subjectPh: "Cu ce te putem ajuta?",
    messageLabel: "Mesaj", messagePh: "Spune-ne mai multe...",
    sendMsg: "Trimite Mesajul",
    emailInfo: "Email", hoursInfo: "Program de Lucru", hoursVal: "Lun - Vin: 9:00 - 18:00 CET",
    locationInfo: "Locatie", locationVal: "Bucuresti, Romania",
    chatInfo: "Chat Live", chatVal: "Disponibil 24/7",
    cats: [
      { name: "Primii Pasi", items: ["Creaza un cont gratuit pentru acces la toate instrumentele", "Incarca fisierul prin drag & drop sau selectie", "Alege instrumentul potrivit din bara laterala", "Descarca sau exporta documentul editat"] },
      { name: "Instrumente PDF", items: ["Vizualizeaza, adnoteaza si semneaza PDF-uri", "Adauga text, imagini si forme in PDF-uri", "Creaza PDF-uri noi de la zero", "Separa, unifica si comprima PDF-uri"] },
      { name: "Conversii", items: ["PDF in Word, Excel, PowerPoint, JPG, PNG", "Word, Excel, PowerPoint in PDF", "Imagine in PDF", "Conversie in lot - in curand"] },
      { name: "Editoare", items: ["Editor Word complet cu formatare", "Editor Excel cu suport formule", "Editor prezentari PowerPoint", "Editoare TXT, CSV si cod"] },
    ],
  }
}

export default function HelpPage() {
  const { lang, setLang, classicMode, setClassicMode } = useApp()
  const c = t[lang as "EN" | "RO"] || t.EN
  const [question, setQuestion] = useState("")
  const [email, setEmail] = useState("")
  const [askStatus, setAskStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [contactSent, setContactSent] = useState(false)

  const handleAsk = async () => {
    if (!question.trim() || question.trim().length < 3) return
    setAskStatus("sending")
    try {
      await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email || "anonymous", question: question.trim() }) })
      setAskStatus("sent")
      setQuestion(""); setEmail("")
      setTimeout(() => setAskStatus("idle"), 4000)
    } catch { setAskStatus("idle") }
  }

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
    setTimeout(() => setContactSent(false), 4000)
    setContactForm({ name: "", email: "", subject: "", message: "" })
  }

  const cm = classicMode
  const cardCls = cm ? "bg-gray-50 border border-gray-200 hover:border-gray-300" : "bg-white/5 border border-white/10 hover:border-white/20"
  const inputCls = cm ? "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400" : "bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-400/50"
  const labelCls = cm ? "text-gray-400" : "text-white/40"

  return (
    <div className={`min-h-screen ${cm ? "bg-white text-black" : "bg-gradient-to-br from-[#0b1333] via-[#070b22] to-[#1a0b2e] text-white"}`}>
      <Navbar lang={lang} setLang={setLang} classicMode={classicMode} setClassicMode={setClassicMode} />

      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        {/* HEADER + QUICK ASK */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-emerald-400 mb-3">{c.badge}</p>
          <h1 className={`text-5xl md:text-6xl font-bold ${cm ? "text-gray-900" : "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"}`}>{c.title}</h1>
          <div className="mt-8 max-w-lg mx-auto space-y-3">
            <div className="relative">
              <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${cm ? "text-gray-300" : "text-white/30"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAsk()}
                className={`w-full pl-12 pr-6 py-4 rounded-2xl text-sm outline-none transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400" : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50"}`}
                placeholder={c.placeholder} />
            </div>
            <div className="flex gap-2">
              <input value={email} onChange={e => setEmail(e.target.value)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs outline-none transition ${cm ? "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400" : "bg-white/5 border border-white/10 text-white placeholder:text-white/30"}`}
                placeholder={c.emailPh} />
              <button onClick={handleAsk} disabled={askStatus === "sending" || question.trim().length < 3}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                {askStatus === "sending" ? c.sending : c.send}
              </button>
            </div>
            {askStatus === "sent" && (
              <div className={`p-3 rounded-xl text-xs font-medium text-center ${cm ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-emerald-500/10 border border-emerald-400/20 text-emerald-400"}`}>{c.sent}</div>
            )}
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="grid md:grid-cols-4 gap-4 mb-20">
          {c.cats.map((cat, i) => (
            <div key={i} className={`p-6 rounded-2xl transition group ${cardCls}`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${catColors[i]} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={catIcons[i]} /></svg>
              </div>
              <h3 className={`font-semibold mb-3 ${cm ? "text-gray-900" : ""}`}>{cat.name}</h3>
              <ul className="space-y-1.5">
                {cat.items.map((item, j) => (
                  <li key={j} className={`text-xs transition flex items-center gap-2 ${cm ? "text-gray-400" : "text-white/40"}`}>
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${cm ? "bg-gray-300" : "bg-white/20"}`} />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CONTACT SECTION */}
        <div className="mb-10">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase text-blue-400 mb-3">{c.contactTitle}</p>
            <p className={`max-w-xl mx-auto ${cm ? "text-gray-500" : "text-white/50"}`}>{c.contactDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className={`p-6 rounded-2xl transition ${cardCls}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                </div>
                <h3 className={`font-semibold mb-1 ${cm ? "text-gray-900" : ""}`}>{c.emailInfo}</h3>
                <p className={`text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>support@docm.app</p>
              </div>
              <div className={`p-6 rounded-2xl transition ${cardCls}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className={`font-semibold mb-1 ${cm ? "text-gray-900" : ""}`}>{c.hoursInfo}</h3>
                <p className={`text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>{c.hoursVal}</p>
              </div>
              <div className={`p-6 rounded-2xl transition ${cardCls}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <h3 className={`font-semibold mb-1 ${cm ? "text-gray-900" : ""}`}>{c.locationInfo}</h3>
                <p className={`text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>{c.locationVal}</p>
              </div>
              <div className={`p-6 rounded-2xl transition ${cardCls}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                </div>
                <h3 className={`font-semibold mb-1 ${cm ? "text-gray-900" : ""}`}>{c.chatInfo}</h3>
                <p className={`text-sm ${cm ? "text-gray-500" : "text-white/50"}`}>{c.chatVal}</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <form onSubmit={handleContact} className={`p-8 rounded-2xl space-y-5 ${cm ? "bg-gray-50 border border-gray-200" : "bg-white/5 border border-white/10"}`}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs mb-1.5 block ${labelCls}`}>{c.nameLabel}</label>
                    <input value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} required className={`w-full px-4 py-3 rounded-xl outline-none transition ${inputCls}`} placeholder={c.namePh} />
                  </div>
                  <div>
                    <label className={`text-xs mb-1.5 block ${labelCls}`}>{c.emailLabel}</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} required className={`w-full px-4 py-3 rounded-xl outline-none transition ${inputCls}`} placeholder={c.emailFormPh} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs mb-1.5 block ${labelCls}`}>{c.subjectLabel}</label>
                  <input value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })} required className={`w-full px-4 py-3 rounded-xl outline-none transition ${inputCls}`} placeholder={c.subjectPh} />
                </div>
                <div>
                  <label className={`text-xs mb-1.5 block ${labelCls}`}>{c.messageLabel}</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} required rows={6} className={`w-full px-4 py-3 rounded-xl outline-none transition resize-none ${inputCls}`} placeholder={c.messagePh} />
                </div>
                <div className="flex items-center gap-4">
                  <button type="submit" className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20">{c.sendMsg}</button>
                  {contactSent && <span className="text-sm text-emerald-400 font-medium">{c.sent}</span>}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer lang={lang} classicMode={classicMode} />
    </div>
  )
}
