"use client"

type Props = {
lang: string
classicMode: boolean
}

const icons = [
<svg key="speed" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
<svg key="shield" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
<svg key="globe" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
<svg key="docs" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
]

const gradients = [
"from-blue-500 to-cyan-400",
"from-emerald-500 to-green-400",
"from-purple-500 to-pink-400",
"from-orange-500 to-amber-400"
]

export default function WhyPlatform({ lang, classicMode }: Props){

const text = {

EN:{
title:"Why choose our platform?",
items:[
{
title:"Fast document processing",
desc:"Upload your file and get results in seconds.",
extra:"Our optimized cloud system processes documents instantly without slowing down your device."
},
{
title:"Secure file handling",
desc:"All documents are encrypted during processing and automatically removed from our servers after completion.",
extra:""
},
{
title:"Works directly in your browser",
desc:"No software installation required.",
extra:"Access the editor from any device with internet access."
},
{
title:"Supports multiple document formats",
desc:"Convert, edit and manage many file types in one place.",
extra:""
}
]
},

RO:{
title:"De ce să folosești platforma noastră?",
items:[
{
title:"Procesare rapidă a documentelor",
desc:"Încarcă fișierul și obține rezultatul în câteva secunde.",
extra:"Sistemul nostru cloud procesează documentele rapid fără să încetinească dispozitivul tău."
},
{
title:"Fișiere securizate",
desc:"Toate documentele sunt criptate în timpul procesării și sunt șterse automat după finalizare.",
extra:""
},
{
title:"Funcționează direct în browser",
desc:"Nu este nevoie să instalezi programe.",
extra:"Poți folosi editorul de pe orice dispozitiv conectat la internet."
},
{
title:"Suportă multiple formate de fișiere",
desc:"Convertește, editează și gestionează mai multe tipuri de fișiere într-un singur loc.",
extra:""
}
]
}

}

const t = text[lang as "EN" | "RO"]

return(

<section id="why" className="max-w-6xl mx-auto mt-40 px-6">

<div className="text-center mb-16">

<p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${classicMode ? "text-blue-600" : "text-blue-400"}`}>
{lang === "RO" ? "Avantaje" : "Benefits"}
</p>

<h2 className={`text-4xl md:text-5xl font-bold ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.title}
</h2>

<div className={`w-20 h-1 mx-auto mt-5 rounded-full bg-gradient-to-r ${gradients[0]}`} />

</div>

<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

{t.items.map((item,i)=>(

<div
key={i}
className={`group relative p-7 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1
${classicMode
? "bg-white/80 border-gray-200 shadow-md hover:shadow-xl"
: "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}
`}
>

<div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br ${gradients[i]} text-white shadow-lg`}>
{icons[i]}
</div>

<h3 className={`font-bold text-lg mb-3 ${classicMode ? "text-gray-800" : "text-white"}`}>
{item.title}
</h3>

<p className={`text-sm leading-relaxed ${classicMode ? "text-gray-600" : "text-white/70"}`}>
{item.desc}
</p>

{item.extra && (
<p className={`text-sm leading-relaxed mt-2 ${classicMode ? "text-gray-500" : "text-white/50"}`}>
{item.extra}
</p>
)}

<div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-gradient-to-r ${gradients[i]} group-hover:w-3/4 transition-all duration-300`} />

</div>

))}

</div>

</section>

)

}