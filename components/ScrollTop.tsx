"use client"

import { useEffect,useState } from "react"

type Props = {
lang: string
classicMode: boolean
}

export default function ScrollTop({ lang, classicMode }: Props){

const [show,setShow]=useState(false)

useEffect(()=>{

const handleScroll=()=>{

if(window.scrollY>400){
setShow(true)
}else{
setShow(false)
}

}

window.addEventListener("scroll",handleScroll)

return()=>window.removeEventListener("scroll",handleScroll)

},[])

function scrollTop(){

window.scrollTo({
top:0,
behavior:"smooth"
})

}

const tooltip = lang === "RO" ? "Înapoi sus" : "Back to top"

return(

<button
onClick={scrollTop}
title={tooltip}
aria-label={tooltip}
className={`group fixed bottom-8 right-8 w-14 h-14 rounded-full
shadow-xl flex items-center justify-center text-white z-50
transition-all duration-500
${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
${classicMode
? "bg-gray-800 hover:bg-gray-700"
: "bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"}
hover:scale-110 active:scale-95
`}
>

<svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
</svg>

<span className={`absolute -left-[110px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
${classicMode ? "bg-gray-800 text-white" : "bg-white/10 backdrop-blur-md text-white border border-white/20"}
`}>
{tooltip}
</span>

</button>

)

}