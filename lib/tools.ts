import { tool } from "ai";
import { z } from "zod";
import { Resend } from "resend";
import { calculerDevis } from "@/lib/calculer-devis";
import { supabase } from "@/lib/supabase";
import type { ParamsDevis } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const calculerDevisTool = tool({
  description: "Calcule le prix d'un devis autocar via les matrices NeoTravel. Le prix vient toujours de ce calcul, jamais du modèle.",
  inputSchema: z.object({
    nb_passagers: z.number().int().positive(),
    distance_km: z.number().positive(),
    date_demande: z.string(),
    date_depart: z.string(),
    options: z.array(z.enum(["guide", "nuit_chauffeur", "peages"])).default([]),
  }),
  execute: async (input) => calculerDevis(input as ParamsDevis),
});

export const enregistrerLeadTool = tool({
  description: "Enregistre une nouvelle demande prospect et renvoie son id.",
  inputSchema: z.object({
    nom_prospect: z.string(),
    email: z.string().email().optional(),
    telephone: z.string().optional(),
    nb_passagers: z.number().int().optional(),
    depart: z.string().optional(),
    destination: z.string().optional(),
    date_depart: z.string().optional(),
    date_retour: z.string().optional(),
    commentaire_client: z.string().optional(),
  }),
  execute: async (input) => {
    const { data, error } = await supabase
      .from("demandes")
      .insert({ ...input, statut: "nouveau_lead" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { demande_id: data.id };
  },
});

export const envoyerEmailTool = tool({
  description: "Envoie un email au prospect (devis, relance, courtoisie).",
  inputSchema: z.object({
    destinataire: z.string().email(),
    sujet: z.string(),
    message: z.string(),
  }),
  execute: async ({ destinataire, sujet, message }) => {
    const { data, error } = await resend.emails.send({
      from: "NeoTravel <onboarding@resend.dev>",
      to: destinataire,
      subject: sujet,
      text: message,
    });
    if (error) throw new Error(JSON.stringify(error));
    return { envoye: true, id: data?.id };
  },
});

export const escaladerHumainTool = tool({
  description: "Transmet la demande à un commercial humain (montant élevé, cas atypique, doute).",
  inputSchema: z.object({
    demande_id: z.string(),
    raison: z.string(),
  }),
  execute: async ({ demande_id, raison }) => {
    const { error } = await supabase
      .from("demandes")
      .update({ statut: "cas_complexe" })
      .eq("id", demande_id);
    if (error) throw new Error(error.message);
    await supabase.from("logs").insert({
      demande_id,
      action: "escalade_humain",
      outil_utilise: "escalader_humain",
      erreur: raison,
    });
    return { escalade: true };
  },
});
