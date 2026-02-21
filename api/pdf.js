export default async function handler(req, res) {
  // Autoriser seulement POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { html, filename } = req.body || {};
console.log("PDF request received", {
  hasHtml: !!html,
  filename,
  method: req.method
});
    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Missing html content" });
    }

    const apiKey = process.env.PDFSHIFT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing PDFSHIFT_API_KEY on server" });
    }

    const pdfShiftResp = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
     body: JSON.stringify({
  source: html,
  format: "A4",
  margin: "0",
  sandbox: false
})
    });

    // Si erreur PDFShift, renvoyer le détail pour debug
    if (!pdfShiftResp.ok) {
      const errorText = await pdfShiftResp.text();
      return res.status(pdfShiftResp.status).json({
        error: "PDFShift error",
        details: errorText
      });
    }

    const pdfBuffer = Buffer.from(await pdfShiftResp.arrayBuffer());

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "rapport.pdf"}"`
    );
    return res.status(200).send(pdfBuffer);

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}