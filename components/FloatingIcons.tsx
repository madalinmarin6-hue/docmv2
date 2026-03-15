"use client"

import { useEffect, useRef, useState } from "react"

type Icon = {
  src: string
  size: number
  left: string
  top: string
  depth?: number
}

export default function FloatingIcons() {

  const containerRef = useRef<HTMLDivElement>(null)

  const [visible, setVisible] = useState(true)

  const [mouse, setMouse] = useState({ x: 0, y: 0 })


  /* ================================
     ICONURI APAR LA SCROLL
  ================================= */

  useEffect(() => {

    const handleScroll = () => {

      if (window.scrollY > 50) setVisible(true)

    }

    window.addEventListener("scroll", handleScroll)

    return () => window.removeEventListener("scroll", handleScroll)

  }, [])


  /* ================================
     PARALLAX MOUSE
  ================================= */

  useEffect(() => {

    const move = (e: MouseEvent) => {

      const x = (e.clientX / window.innerWidth - 0.5) * 15
      const y = (e.clientY / window.innerHeight - 0.5) * 15

      setMouse({ x, y })

    }

    window.addEventListener("mousemove", move)

    return () => window.removeEventListener("mousemove", move)

  }, [])



  /* ================================
     ICON LIST
     aici adaugi iconuri noi
  ================================= */

  const icons: Icon[] = [

    /* HERO ZONA */

    { src: "/word.png", size: 95, left: "8%", top: "38%", depth: 1 },
    { src: "/excel.png", size: 95, left: "90%", top: "38%", depth: 1 },

    { src: "/pdf.png", size: 80, left: "18%", top: "65%", depth: 1.3 },
    { src: "/powerpoint.png", size: 80, left: "82%", top: "65%", depth: 1.3 },

    /* EXTRA HERO */

    { src: "/edit.png", size: 55, left: "3%", top: "55%", depth: 0.8 },
    { src: "/download.png", size: 55, left: "96%", top: "55%", depth: 0.8 },

    /* SCROLL ZONA */

    { src: "/csv.png", size: 70, left: "10%", top: "120%", depth: 1.5 },
    { src: "/json.png", size: 70, left: "90%", top: "120%", depth: 1.5 },

    { src: "/upload.png", size: 75, left: "22%", top: "150%", depth: 1.7 },
    { src: "/download.png", size: 75, left: "78%", top: "150%", depth: 1.7 },

    /* EXTRA SCROLL */

    { src: "/word.png", size: 50, left: "5%", top: "175%", depth: 1.2 },
    { src: "/pdf.png", size: 50, left: "95%", top: "175%", depth: 1.2 },

    /* JOS */

    { src: "/zip.png", size: 65, left: "12%", top: "210%", depth: 2 },
    { src: "/signiture.png", size: 65, left: "88%", top: "210%", depth: 2 },

    /* EXTRA JOS */

    { src: "/excel.png", size: 45, left: "6%", top: "250%", depth: 1.8 },
    { src: "/powerpoint.png", size: 45, left: "94%", top: "250%", depth: 1.8 },
    { src: "/csv.png", size: 40, left: "15%", top: "290%", depth: 1.5 },
    { src: "/json.png", size: 40, left: "85%", top: "290%", depth: 1.5 },

  ]


  /* ================================
     RENDER ICONS
  ================================= */

  return (

    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-10 hidden md:block"
    >

      {icons.map((icon, i) => {

        const offsetX = mouse.x * (icon.depth || 1)

        const offsetY = mouse.y * (icon.depth || 1)

        return (

          <img
            key={i}

            src={icon.src}

            style={{
              left: icon.left,
              top: icon.top,
              width: icon.size,
              transform: `translate(${offsetX}px, ${offsetY}px)`
            }}

            className={`absolute opacity-90 transition-all duration-1000
            ${visible ? "opacity-90" : "opacity-0"}
            animate-float hover:scale-110`}

          />

        )

      })}

    </div>

  )

}