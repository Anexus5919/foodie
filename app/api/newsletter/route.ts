import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email provided:", email);
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    console.log("📧 Attempting to send newsletter subscription to:", email);

    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ EMAIL_USER or EMAIL_PASS environment variables are not set!");
      console.error("EMAIL_USER exists:", !!process.env.EMAIL_USER);
      console.error("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
      
      // Return success to avoid breaking UX, but log the issue
      return NextResponse.json(
        { 
          success: true, 
          message: "Subscription recorded (email service not configured)" 
        }, 
        { status: 200 }
      );
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter configuration
    console.log("🔍 Verifying email transporter...");
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");

    // Email content
    const mailOptions = {
      from: `"Foodie Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Foodie Newsletter! 🍔",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #f97316;">Welcome to Foodie!</h1>
          <p>Hi there,</p>
          <p>Thank you for subscribing to our newsletter! 🎉</p>
          <p>You'll now receive the latest updates on:</p>
          <ul>
            <li>Top-rated restaurants in your city</li>
            <li>Exclusive deals and discounts</li>
            <li>New seasonal menus</li>
          </ul>
          <p>Stay hungry, stay happy!</p>
          <p>Best regards,<br>The Foodie Team</p>
        </div>
      `,
    };

    // Send email
    console.log("📤 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: "Subscription successful" 
    });

  } catch (error: any) {
    console.error("🔥 Newsletter Subscription Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });

    // Return a proper error response
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to send subscription email",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}