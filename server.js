import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Contenu du site pour le chatbot
const siteContent = fs.readFileSync("site-content.txt", "utf8");

dotenv.config();

const app = express();
app.use(express.json());

// Déterminer __dirname en module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir le site statique
app.use(express.static(__dirname));

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message manquant" });
  }

  try {
    // Appel API Mistral
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: siteContent },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (process.env.NODE_ENV !== "production") {
      console.log("Status API Mistral:", response.status, response.statusText);
      console.log("Data reçue:", JSON.stringify(data, null, 2));
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "Réponse vide du serveur Mistral" });
    }

    res.json({ reply });

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Erreur fetch Mistral:", err);
    }
    res.status(500).json({ error: "l'information n'est pas renseignez sur le site, vous pouvez contacter TimeTravel Agency pour plus d'information Email : contact@timetravelagency.fr\nTéléphone : +33 3 XX XX XX XX" });
  }
});

// Port dynamique pour Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
  }
});