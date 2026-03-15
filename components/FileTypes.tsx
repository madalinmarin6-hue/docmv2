"use client"

type Props = {
lang: string
classicMode: boolean
}

const fileFormats = [
{ name: "PDF", label: "PDF", color: "from-red-500 to-rose-400", icon: "/pdf.png" },
{ name: "DOCX", label: "DOCX (Word)", color: "from-blue-500 to-blue-400", icon: "/word.png" },
{ name: "XLSX", label: "XLSX (Excel)", color: "from-green-500 to-emerald-400", icon: "/excel.png" },
{ name: "PPTX", label: "PPTX (PowerPoint)", color: "from-orange-500 to-amber-400", icon: "/powerpoint.png" },
{ name: "TXT", label: "TXT", color: "from-gray-500 to-slate-400", icon: "/notepad.png" },
{ name: "CSV", label: "CSV", color: "from-teal-500 to-cyan-400", icon: "/csv.png" },
{ name: "JSON", label: "JSON", color: "from-yellow-500 to-amber-400", icon: "/json.png" },
{ name: "JPG", label: "JPG", color: "from-purple-500 to-violet-400", icon: "/img.png" },
{ name: "PNG", label: "PNG", color: "from-pink-500 to-rose-400", icon: "/img.png" },
{ name: "ZIP", label: "ZIP", color: "from-indigo-500 to-blue-400", icon: "/zip.png" }
]

export default function FileTypes({ lang, classicMode }: Props){

const text = {
EN: {
title: "Supported file types",
desc: "Our platform supports the most common document formats used in offices and businesses worldwide.",
extra: "You can convert between these formats, edit them directly online, or combine multiple documents into a single file."
},
RO: {
title: "Tipuri de fișiere suportate",
desc: "Platforma noastră suportă cele mai utilizate formate de documente din mediul office și business.",
extra: "Poți converti între aceste formate, le poți edita online sau combina mai multe documente într-un singur fișier."
}
}

const t = text[lang as "EN" | "RO"]

return(

<section id="filetypes" className="max-w-6xl mx-auto mt-40 px-6">

<div className="text-center mb-14">

<p className={`text-sm font-semibold tracking-widest uppercase mb-3 ${classicMode ? "text-purple-600" : "text-purple-400"}`}>
{lang === "RO" ? "Formate" : "Formats"}
</p>

<h2 className={`text-4xl md:text-5xl font-bold ${classicMode ? "text-gray-800" : "text-white"}`}>
{t.title}
</h2>

<div className="w-20 h-1 mx-auto mt-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-400" />

<p className={`mt-6 text-lg max-w-2xl mx-auto leading-relaxed ${classicMode ? "text-gray-600" : "text-white/60"}`}>
{t.desc}
</p>

</div>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

{fileFormats.map((file, i) => (

<div
key={i}
className={`group relative flex flex-col items-center gap-3 p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-default
${classicMode
? "bg-white/80 border-gray-200 shadow-sm hover:shadow-lg"
: "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}
`}
>

<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${file.color} p-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
<img src={file.icon} className="w-7 h-7 object-contain" alt={file.name} />
</div>

<span className={`text-sm font-semibold ${classicMode ? "text-gray-700" : "text-white/90"}`}>
{file.label}
</span>

</div>

))}

</div>

<p className={`mt-10 text-center text-base max-w-2xl mx-auto leading-relaxed ${classicMode ? "text-gray-500" : "text-white/50"}`}>
{t.extra}
</p>

</section>

)

}