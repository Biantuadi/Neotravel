# NeoTravel — Procédure équipes commerciales

**Version :** 1.1  
**Date :** 29 juin 2026  
**Public :** Équipes commerciales et opérationnelles NeoTravel

---

## À quoi sert NeoTravel ?

NeoTravel permet à vos clients d'obtenir un devis transport de groupe en moins d'une heure, via un assistant conversationnel (chat IA) disponible 24 h/24. Vous, en tant que commercial, intervenez uniquement dans deux situations : pour valider un devis qualifié, ou pour reprendre un dossier complexe que l'assistant n'a pas pu traiter seul.

---

## 1. Comment un client soumet une demande

### Ce que vit le client

1. Le client arrive sur la page d'accueil de NeoTravel (l'URL de votre déploiement).
2. Un widget de chat s'ouvre automatiquement avec le message : **"Bonjour ! Quel trajet souhaitez-vous organiser ?"**
3. Le client peut cliquer sur un raccourci rapide (**Aller simple**, **Aller-retour**, **Circuit multi-étapes**) ou taper directement sa demande.
4. L'assistant pose les questions une par une :
   - Ville de départ
   - Destination
   - Date de départ
   - Nombre de passagers
   - Distance en km (l'assistant la demande explicitement — il ne l'estime jamais)
   - Options éventuelles : guide/accompagnateur, nuit chauffeur, péages
5. Une fois toutes les informations collectées, l'assistant calcule et affiche le montant TTC.
6. L'assistant propose ensuite d'envoyer le devis détaillé **par email en PDF**. Si le client accepte et fournit son adresse email, il reçoit le document avec une référence unique (ex : NEO-1234567890).

### Ce que vous voyez de votre côté (tableau de bord)

Le tableau de bord direction affiche une vue agrégée en temps réel :
- **KPIs** : nombre de leads du jour, taux de conversion, délai moyen de réponse, relances en attente
- **Pipeline** : devis envoyés / acceptés / refusés
- **Automatisation** : part des dossiers traités par l'IA vs repris par un humain
- **Relances** : indicateurs d'envoi et taux de réponse

La section **Demandes** (menu latéral) liste les dossiers individuels avec leur statut.

**Vous n'avez rien à faire à ce stade** — l'assistant gère tout jusqu'au devis.

---

## 2. Lire le tableau de bord commercial

### Les statuts de dossier

| Statut | Ce que ça signifie | Action attendue de votre part |
|---|---|---|
| **Nouveau lead** | Le client vient de démarrer une conversation | Aucune — l'assistant continue |
| **Incomplet** | Le client n'a pas fourni toutes les infos | Aucune — une relance automatique est programmée |
| **Qualifié** | Toutes les infos sont là, devis calculé | Vous pouvez relire et valider le devis |
| **Devis envoyé** | Le devis a été transmis au client | Suivre la réponse |
| **Relance 1** | Première relance automatique (J+2 urgent / J+3 standard) | Aucune — surveiller le tableau |
| **Relance 2** | Deuxième relance automatique (J+7) | Aucune — surveiller le tableau |
| **Accepté** | Le client a dit oui | Traiter la commande |
| **Refusé** | Le client a décliné | Clôturer le dossier |
| **Cas complexe** | L'assistant a escaladé — intervention humaine requise | **Vous devez reprendre ce dossier** (voir section 3) |
| **Clôturé** | Dossier terminé | Archivé |

### Le score de complétude

Chaque dossier affiche un score de 0 à 100 %. Ce score indique combien d'informations clés ont été collectées sur les 7 informations attendues (nom, email, téléphone, passagers, départ, destination, date de départ).

- **Sous 50 %** → dossier très incomplet, attendre la relance automatique
- **Entre 50 et 80 %** → dossier en cours, l'assistant est probablement encore en conversation
- **À 100 %** → dossier complet, devis disponible

### Le niveau d'urgence

Chaque dossier est marqué **faible**, **normale** ou **urgente** selon le délai entre la date de la demande et la date de départ :
- **Urgente** : moins de 7 jours → à traiter en priorité
- **Normale** : entre 7 et 90 jours
- **Faible** : plus de 90 jours

---

## 3. Reprendre un cas complexe escaladé par l'assistant

### Quand l'assistant escalade-t-il ?

L'assistant transfère automatiquement le dossier à un commercial humain dans deux situations :
1. **Plus de 80 passagers** — dépasse la capacité du barème automatique
2. **Trajet international** — sort de la zone de service standard

Le statut du dossier passe alors à **"Cas complexe"**, et vous recevez une notification.

### Étapes pour reprendre un cas complexe

**Étape 1 — Ouvrir le dossier dans le tableau de bord**  
Cliquez sur le dossier marqué "Cas complexe". Vous voyez le résumé de la conversation : ce que le client a demandé, pourquoi l'assistant a escaladé (la raison est toujours indiquée).

**Étape 2 — Contacter le client**  
Utilisez l'email ou le téléphone renseigné dans le dossier. Si le client n'a pas laissé de coordonnées, c'est noté dans le dossier — dans ce cas, attendez qu'il revienne.

Exemple de message d'accroche :
> *"Bonjour [Prénom], votre demande de transport de groupe depuis NeoTravel a bien été reçue. En raison de la spécificité de votre trajet, notre équipe souhaite vous accompagner directement. Seriez-vous disponible pour un appel ?"*

**Étape 3 — Construire le devis manuellement**  
Pour les cas hors barème (>80 passagers, trajet international), utilisez votre outil de devis habituel ou consultez votre responsable. NeoTravel ne calcule pas automatiquement ces cas.

**Étape 4 — Mettre à jour le statut**  
Une fois le devis envoyé au client, changez le statut dans le tableau de bord :
- Si le devis est parti → **"Devis envoyé"**
- Si le client accepte → **"Accepté"**
- Si le client refuse → **"Refusé"**
- Si le dossier ne peut pas aboutir → **"Clôturé"**

---

## 4. Les relances automatiques — ce que vous devez savoir

NeoTravel envoie des relances automatiques par email pour les dossiers incomplets :

- **J+2** après la demande initiale : relance courte et amicale
- **J+3** : deuxième relance si pas de réponse
- **J+7** : relance finale

Ces relances sont envoyées **sans action de votre part**. Si un client répond à une relance et revient sur le chat, le dossier se met à jour automatiquement.

**Vous n'avez à intervenir que si :**
- Le client répond directement à vous (par email ou téléphone) sans repasser par le chat
- Le dossier est en "Cas complexe"
- Une relance a échoué (statut "Relance — Échec")

---

## 5. Questions fréquentes

**Le client dit qu'il n'a pas reçu son devis par email.**  
Vérifiez que l'email est bien renseigné dans le dossier (colonne Email). Si l'email est vide, le client n'a pas fourni ses coordonnées pendant le chat — le devis lui a été affiché dans la conversation uniquement. Contactez-le par téléphone si disponible pour lui renvoyer le document.

**Le devis affiché semble incorrect.**  
Les prix sont calculés automatiquement selon le barème NeoTravel (distance, saison, urgence, nombre de passagers). Si vous pensez qu'il y a une erreur, signalez-le à votre responsable technique — ne modifiez pas le dossier directement.

**Le client veut modifier sa demande après le devis.**  
Invitez-le à relancer une nouvelle conversation depuis la page d'accueil, ou créez un nouveau dossier manuellement si vous avez les droits administrateur.

**Un dossier est bloqué depuis longtemps sans mise à jour.**  
Si un dossier reste en "Incomplet" ou "Nouveau lead" depuis plus de 10 jours sans relance visible, signalez-le à votre responsable — il peut s'agir d'un problème technique.

---

## Contacts en cas de problème technique

| Problème | À qui s'adresser |
|---|---|
| Le tableau de bord ne charge pas | Béni (référent technique Supabase) |
| L'assistant ne répond plus | Paul (référent interface) |
| Un devis est manifestement faux | Giovanni (référent calcul des devis) |
| La maquette ou un PDF ne s'affiche pas | Sarah (référente design & PDF) |

---

## 6. Ce qui n'est pas encore fait — et la suite

### Ce qui fonctionne à la soutenance

Le parcours complet est opérationnel :
- Un prospect envoie une demande via le chat → elle est enregistrée dans la base
- L'IA qualifie la demande, calcule le devis et l'envoie par email en PDF
- Le tableau de bord affiche les KPIs en temps réel
- Le tarifd est lu depuis la base de données (table `matrices`) — modifiable sans toucher au code

### Ce qui reste à finaliser (P1 — urgent)

| Point | Description |
|-------|-------------|
| **Déploiement des relances automatiques** | La fonction est écrite et prête. Il reste à l'activer sur Supabase (opération technique de 5 minutes). En attendant, les relances doivent être faites manuellement. |
| **Protection du dashboard** | Le tableau de bord est accessible à quiconque a l'URL. Avant la mise en production réelle, il faudra ajouter une authentification (identifiant / mot de passe). |

### Ce qu'on ferait si le projet continuait (P2)

| Amélioration | Impact |
|--------------|--------|
| **Bouton "J'accepte"** dans l'email du devis | Supprime une étape : le statut passe automatiquement à "Accepté" sans appel téléphonique |
| **Calcul automatique de la distance** | Plus besoin de demander les kilomètres au prospect — l'IA les calcule depuis les villes |
| **Notification email à l'équipe** | Alerte immédiate quand un dossier complexe arrive ou qu'un devis est accepté |
| **Relances WhatsApp / SMS** | Toucher les prospects qui ne lisent pas leurs emails |

### Ce qu'on ferait à plus long terme (P3)

- Génération automatique de la facture PDF une fois la commande confirmée
- Version multilingue (anglais, espagnol) pour les groupes touristiques étrangers
- Connexion à HubSpot ou Salesforce si l'équipe commerciale grandit

---

*Document rédigé dans le cadre du projet EPITECH NeoTravel — MBA1, promotion 2026.*
