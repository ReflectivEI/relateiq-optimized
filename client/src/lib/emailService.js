/**
 * emailService.js — Handle PDF email sending
 */

import { api } from "@/api/client";

/**
 * Open native email client with PDF attachment
 * Note: This opens the user's email client; attachments are still handled outside the browser.
 */
export function openEmailWithPDF({ 
  pdfBlob, 
  filename = "response.pdf",
  recipientEmail = "",
  subject = "Relationship Insights",
  body = "Please find attached my reflection."
}) {
  // Create download link for PDF
  const link = document.createElement("a");
  link.href = URL.createObjectURL(pdfBlob);
  link.download = filename;
  
  // Open mailto (note: attachments via mailto are not supported natively)
  const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // User needs to attach PDF manually, but we can download it first
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  
  // Then open email client
  setTimeout(() => {
    window.location.href = mailtoLink;
  }, 500);
}

/**
 * Send PDF through the configured app integrations.
 * Requires file upload support to be enabled in the backend.
 */
export async function sendPDFViaEmail({
  pdfBlob,
  filename,
  toEmail,
  subject,
  body,
}) {
  try {
    // Upload the PDF first so the email flow can include a file URL.
    const uploadedFile = await api.integrations.Core.UploadFile({
      file: pdfBlob,
    });

    // Send email with link to file
    await api.integrations.Core.SendEmail({
      to: toEmail,
      subject,
      body: `${body}\n\nFile: ${uploadedFile.file_url}`,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err.message };
  }
}
