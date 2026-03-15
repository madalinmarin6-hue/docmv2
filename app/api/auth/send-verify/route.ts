import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { id: string; email?: string } | undefined
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("email_verified, verify_token, name")
      .eq("id", sessionUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json({ message: "Email is already verified" })
    }

    // Generate new token if needed
    let token = user.verify_token
    if (!token) {
      token = uuidv4()
      await supabaseAdmin
        .from("users")
        .update({ verify_token: token })
        .eq("id", sessionUser.id)
    }

    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify?token=${token}`

    // Send verification email via nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"DocM" <${process.env.EMAIL_USER}>`,
      to: sessionUser.email,
      subject: "Verify your DocM account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#0b1333;border-radius:16px;color:#fff;">
          <h1 style="font-size:24px;margin-bottom:10px;">Welcome to DocM!</h1>
          <p style="color:#ffffffb0;font-size:14px;line-height:1.6;">
            Hi ${user.name || "there"},<br><br>
            Please verify your email address by clicking the button below:
          </p>
          <a href="${verifyUrl}" style="display:inline-block;margin:20px 0;padding:12px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
            Verify Email
          </a>
          <p style="color:#ffffff60;font-size:12px;margin-top:20px;">
            Or copy this link: <br>
            <a href="${verifyUrl}" style="color:#60a5fa;word-break:break-all;">${verifyUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #ffffff15;margin:20px 0;" />
          <p style="color:#ffffff40;font-size:11px;">If you didn't create an account on DocM, you can ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({
      message: "Verification email sent! Check your inbox.",
    })
  } catch (error) {
    console.error("Send verify error:", error)
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }
}
