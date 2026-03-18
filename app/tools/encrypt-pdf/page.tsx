"use client"

import { useState, useCallback } from "react"
import ToolLayout from "@/components/ToolLayout"
import FileUploader from "@/components/FileUploader"
import { trackEdit } from "@/lib/trackEdit"
import { saveToCloud } from "@/lib/saveToCloud"
import { usePing } from "@/lib/usePing"

export default function EncryptDecryptPage() {
  usePing()
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt")
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState("")
  const [processing, setProcessing] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotMsg, setForgotMsg] = useState("")
  const [sendingRecovery, setSendingRecovery] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const encrypt = useCallback(async () => {
    if (!file || !password) return
    if (password !== confirmPassword) { setStatus("Passwords do not match!"); return }
    setProcessing(true); setStatus("Encrypting PDF...")
    try {
      const { PDFDocument } = await import("pdf-lib")
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer)
      pdfDoc.setProducer("DocFlow - Encrypted")
      const bytes = await pdfDoc.save()

      const enc = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"])
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, (bytes as unknown as ArrayBuffer))

      const header = new TextEncoder().encode("ENCPDF01")
      const result = new Uint8Array(header.length + salt.length + iv.length + encrypted.byteLength)
      result.set(header, 0)
      result.set(salt, header.length)
      result.set(iv, header.length + salt.length)
      result.set(new Uint8Array(encrypted), header.length + salt.length + iv.length)

      const blob = new Blob([result], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const outName = file.name.replace(".pdf", "_encrypted.pdf")
      a.href = url; a.download = outName; a.click()
      URL.revokeObjectURL(url)
      setStatus("Encrypted and downloaded! The file cannot be opened with any PDF viewer. Use the Decrypt tab on this page to unlock it.")
      // Store encryption record for owner recovery
      try {
        await fetch("/api/encrypt-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: outName, originalName: file.name, fileSize: blob.size, timestamp: new Date().toISOString(), encryptPassword: password })
        })
      } catch { /* non-critical */ }
      const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "encrypt-pdf" })
      if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); setProcessing(false); return }
      saveToCloud(blob, outName, "encrypt-pdf")
    } catch (err) { console.error(err); setStatus("Error encrypting") }
    setProcessing(false)
  }, [file, password, confirmPassword])

  const decrypt = useCallback(async () => {
    if (!file || !password) return
    setProcessing(true); setStatus("Decrypting PDF...")
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const header = new TextDecoder().decode(bytes.slice(0, 8))

      if (header !== "ENCPDF01") {
        setStatus("This file was not encrypted with this tool. Only files encrypted here can be decrypted.")
        setProcessing(false)
        return
      }

      const salt = bytes.slice(8, 24)
      const iv = bytes.slice(24, 36)
      const encrypted = bytes.slice(36)
      const enc = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits", "deriveKey"])
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"])

      try {
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted)
        const blob = new Blob([decrypted], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const outName = file.name.replace("_encrypted", "").replace(".pdf", "_decrypted.pdf")
        const a = document.createElement("a"); a.href = url; a.download = outName; a.click()
        URL.revokeObjectURL(url)
        setStatus("Decrypted successfully! The PDF has been downloaded.")
        setShowForgot(false)
        const editResult = await trackEdit({ fileName: outName, fileSize: blob.size, fileType: "pdf", toolUsed: "decrypt-pdf" })
        if (!editResult.allowed) { setStatus(editResult.error || "Edit limit reached"); setProcessing(false); return }
        saveToCloud(blob, outName, "decrypt-pdf")
      } catch {
        setStatus("Wrong password! Please try again.")
        setShowForgot(true)
      }
    } catch { setStatus("Error decrypting — file may be corrupted") }
    setProcessing(false)
  }, [file, password])

  const reset = () => { setFile(null); setPassword(""); setConfirmPassword(""); setStatus(""); setShowForgot(false); setForgotMsg("") }

  const sendRecoveryRequest = async () => {
    if (!file) return
    setSendingRecovery(true)
    setForgotMsg("")
    try {
      const res = await fetch("/api/encrypt-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, timestamp: new Date().toISOString() })
      })
      if (res.ok) {
        setForgotMsg("Recovery request sent! The site owner will review your request and may contact you. Please check your dashboard or email.")
      } else {
        setForgotMsg("Could not send recovery request. Please try again later or contact the owner directly through the Help page.")
      }
    } catch {
      setForgotMsg("Network error. Please try again later or use the Help & Contact page to reach the owner.")
    }
    setSendingRecovery(false)
  }

  return (
    <ToolLayout title="Encrypt / Decrypt PDF" subtitle="Password-protect or unlock your PDF files">
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
            <button onClick={() => { setMode("encrypt"); reset() }} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${mode === "encrypt" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow" : "text-white/40 hover:text-white/60"}`}>
              Encrypt
            </button>
            <button onClick={() => { setMode("decrypt"); reset() }} className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${mode === "decrypt" ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow" : "text-white/40 hover:text-white/60"}`}>
              Decrypt
            </button>
          </div>
        </div>

        {/* Warning banner */}
        <div className={`rounded-xl border p-4 ${mode === "encrypt" ? "bg-orange-500/5 border-orange-500/20" : "bg-green-500/5 border-green-500/20"}`}>
          <p className={`text-xs font-medium ${mode === "encrypt" ? "text-orange-300" : "text-green-300"}`}>
            {mode === "encrypt"
              ? "The encrypted PDF file CANNOT be opened by any PDF viewer (Adobe, Chrome, etc). The only way to view it again is to come back to this page and use the Decrypt tab with the correct password."
              : "Only files encrypted with this tool can be decrypted here. Enter the same password used during encryption."}
          </p>
        </div>

        {!file ? (
          <FileUploader
            accept=".pdf"
            onFile={f => setFile(f)}
            label={mode === "encrypt" ? "Upload a PDF to encrypt" : "Upload an encrypted PDF to decrypt"}
            sublabel={mode === "encrypt" ? "The file will be password-protected and unreadable without decryption" : "Enter your password to restore the original PDF"}
            cloudFilterTypes={["pdf"]}
          />
        ) : (
          <div className="max-w-lg mx-auto space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
              <p className="text-sm text-white/60">{file.name} — {(file.size / 1024).toFixed(0)} KB</p>

              <div>
                <label className="text-xs text-white/40 block mb-1">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none ${mode === "encrypt" ? "focus:border-orange-400/50" : "focus:border-green-400/50"}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition" title={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === "encrypt" && (
                <div>
                  <label className="text-xs text-white/40 block mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password"
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-400/50 ${confirmPassword && password !== confirmPassword ? "border-red-500/50" : ""}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition" title={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button onClick={reset} className="px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/50">New File</button>
              <button
                onClick={mode === "encrypt" ? encrypt : decrypt}
                disabled={processing || !password || (mode === "encrypt" && password !== confirmPassword)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40 ${mode === "encrypt" ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-green-500 to-emerald-500"}`}>
                {processing ? (mode === "encrypt" ? "Encrypting..." : "Decrypting...") : (mode === "encrypt" ? "Encrypt & Download" : "Decrypt & Download")}
              </button>
            </div>

            {status && (
              <div className={`rounded-xl border p-3 text-xs text-center ${status.includes("Error") || status.includes("Wrong") || status.includes("not match") || status.includes("not encrypted") ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>
                {status}
              </div>
            )}

            {showForgot && mode === "decrypt" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <p className="text-xs text-amber-300 font-medium">Forgot your password?</p>
                <p className="text-[11px] text-amber-200/60">You can send a recovery request to the site owner. They may be able to help you recover your file.</p>
                {forgotMsg ? (
                  <p className={`text-xs ${forgotMsg.includes("sent") ? "text-emerald-300" : "text-red-300"}`}>{forgotMsg}</p>
                ) : (
                  <button onClick={sendRecoveryRequest} disabled={sendingRecovery}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40">
                    {sendingRecovery ? "Sending..." : "Send Recovery Request to Owner"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
