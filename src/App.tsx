

import React, { useState, useEffect } from 'react';
import { MessageTemplate, Recipient, Property, Agent } from './types';
import TemplateManager from './components/TemplateManager';
import Previewer from './components/Previewer';
import RecipientManager from './components/RecipientManager';
import PropertyManager from './components/PropertyManager';
import AppointmentScheduler from './components/AppointmentScheduler';
import AgentManager from './components/AgentManager';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import ProfileEditor from './components/ProfileEditor';
import { generateMessage } from './services/geminiService';
import { fetchAllAgents, fetchAgentById, updateAgentProfile } from './services/agentService';
import { LogoIcon } from './components/ui/Icons';
import { db, auth } from './services/firebase';
import { Button } from './components/ui/Button';


// NOTE: Firebase is now loaded globally via script tags in index.html
// This avoids module resolution issues. The 'firebase' object is available on the window scope.
declare var firebase: any;

type Language = 'es' | 'en' | 'fr' | 'it' | 'pt' | 'de' | 'ro' | 'pl' | 'nl' | 'uk' | 'ru';

const ADMIN_EMAIL = 'jc@vidahome.es';

const defaultTemplates: { [key in Language]: Omit<MessageTemplate, 'id' | 'createdAt' | 'language'>[] } = {
    es: [
        {
            title: "Primer contacto sin respuesta telefónica",
            category: "Prospección",
            content: "👋 Buenos días / Buenas tardes [nombre]\nSoy [agente_creador], de la asesoría inmobiliaria VidaHome 🏡.\n\nHemos recibido su solicitud sobre la propiedad [ref]. He intentado comunicarme con usted por teléfono sin éxito, así que le envío el enlace con todos los detalles:\n👉 [demanda]\n\nPuede conocer más sobre nosotros aquí:\n🌐 Web: www.vidahome.es\n📍 Ubicación de la agencia y reseñas: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Si no logra abrir el enlace, agréguenos como contacto (VidaHome) o simplemente responda a este mensaje y podrá acceder sin problema.\n\nQuedo a su disposición para cualquier consulta o para coordinar una visita.\n\nUn cordial saludo,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmación de visita (cuando no hemos hablado antes)",
            category: "Seguimiento",
            content: "👋 Hola [nombre]\nLe confirmamos la visita de la propiedad para el día [dia] a las [hora], con nuestro agente [agente_nombre].\n\n📍 Dirección: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\n👉 Puede confirmar, modificar o cancelar la cita desde el siguiente enlace:\n[demanda]\n\n⚠️ Si no logra abrir el enlace, agréguenos como contacto (VidaHome) o simplemente responda a este mensaje y podrá acceder sin problema.\n\nUn cordial saludo,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Confirmación de visita (después de haber hablado por teléfono)",
            category: "Seguimiento",
            content: "👋 Hola [nombre]\nSoy [agente_creador], de la asesoría inmobiliaria VidaHome 🏡.\n\nTal como hablamos por teléfono, le confirmo la visita de la propiedad para el [dia] a las [hora].\n\n📍 Dirección: [zona], [ciudad]\n🔗 Google Maps: [demanda]\n\nAquí tiene el enlace con los detalles de la propiedad:\n👉 [ref]\n\nTambién puede confirmar la visita desde el siguiente enlace:\n👉 [demanda]\n\n⚠️ Si no logra abrir los enlaces, agréguenos como contacto (VidaHome) o simplemente responda a este mensaje y podrá acceder sin problema.\n\nUn cordial saludo,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Mensaje post-venta – agradecimiento y reseñas",
            category: "Fidelización",
            content: "🎉 Hola [nombre],\nMuchas gracias por confiar en VidaHome en la gestión de su compra-venta 🏡.\n\nHa sido un placer acompañarle durante todo el proceso y nos alegra que todo haya salido bien. Esperamos que esté satisfecho con nuestro servicio y recuerde que estamos a su disposición para lo que necesite en el futuro 🙌.\n\nSi desea compartir su experiencia y ayudarnos a mejorar, puede dejar su reseña aquí:\n⭐ Dejar reseña en Google\n\nUn cordial saludo,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmación de visita (cuando la propiedad aún no está publicada en el CRM)",
            category: "Seguimiento",
            content: "👋 Hola [nombre],\nComo acordamos por teléfono hoy por la [mañana/tarde], le confirmo la visita de la propiedad para el día [dia] a las [hora].\n\n📍 Dirección: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\nQuedo a su disposición para cualquier consulta antes de la visita.\n\nUn cordial saludo,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    en: [
        {
            title: "First contact – no phone answer",
            category: "Prospecting",
            content: "👋 Good morning/afternoon [name]\nThis is [agente_creador] from VidaHome Real Estate 🏡.\n\nWe have received your request regarding property [ref]. I tried to reach you by phone without success, so I'm sending you the link with all the details:\n👉 [demanda]\n\nYou can find out more about us here:\n🌐 Website: www.vidahome.es\n📍 Agency location and client reviews: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ If you cannot open the link, please save us as a contact (VidaHome) or simply reply to this message and it will work.\n\nI remain at your disposal for any questions or to arrange a viewing.\n\nBest regards,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Viewing confirmation (before phone contact)",
            category: "Follow-up",
            content: "👋 Hello [name]\nWe confirm the viewing of the property on [dia] at [hora], with our agent [agente_nombre].\n\n📍 Address: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nYou can confirm, reschedule or cancel the appointment via the following link:\n👉 [demanda]\n\n⚠️ If you cannot open the link, please save us as a contact (VidaHome) or simply reply to this message and it will work.\n\nBest regards,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Viewing confirmation (after phone call)",
            category: "Follow-up",
            content: "👋 Hello [name]\nThis is [agente_creador] from VidaHome Real Estate 🏡.\n\nAs agreed during our phone call, I confirm the viewing of the property on [dia] at [hora].\n\n📍 Address: [zona], [ciudad]\n🔗 Google Maps location: [demanda]\n\nHere is the link with the property details:\n👉 [ref]\n\nYou can also confirm the appointment via the following link:\n👉 [demanda]\n\n⚠️ If you cannot open the links, please save us as a contact (VidaHome) or simply reply to this message and they will work.\n\nBest regards,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Post-sale message – thanks & reviews",
            category: "Loyalty",
            content: "🎉 Hello [name],\nThank you very much for trusting VidaHome with your property transaction 🏡.\n\nIt was a pleasure to accompany you throughout the process, and we are glad everything went well. We hope you are satisfied with our service and please remember we are here for anything you may need in the future 🙌.\n\nIf you'd like to share your experience and help us improve, you can leave your review here:\n⭐ Leave a Google review\n\nBest regards,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Viewing confirmation (property not yet published in CRM)",
            category: "Follow-up",
            content: "👋 Hello [name],\nAs discussed over the phone this [morning/afternoon], I confirm the viewing of the property on [dia] at [hora].\n\n📍 Address: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nI remain at your disposal for any questions before the appointment.\n\nBest regards,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    fr: [
        {
            title: "Premier contact sans réponse téléphonique",
            category: "Prospection",
            content: "👋 Bonjour [nombre]\nJe suis [agente_creador], de l'agence immobilière VidaHome 🏡.\n\nNous avons bien reçu votre demande concernant le bien [ref]. J'ai tenté de vous joindre par téléphone sans succès, je vous envoie donc le lien avec tous les détails de la propriété :\n👉 [demanda]\n\nVous pouvez en savoir plus sur nous ici :\n🌐 Site web: www.vidahome.es\n📍 Localisation de l'agence et avis clients: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Si vous ne parvenez pas à ouvrir le lien, enregistrez-nous comme contact (VidaHome) ou répondez simplement à ce message et vous pourrez y accéder sans problème.\n\nJe reste à votre disposition pour toute question ou pour convenir d'une visite.\n\nCordialement,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmation de visite (sans contact préalable)",
            category: "Suivi",
            content: "👋 Bonjour [nombre]\nNous vous confirmons la visite de la propriété pour le [dia] à [hora], avec notre agent [agente_nombre].\n\n📍 Adresse: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nVous pouvez confirmer, modifier ou annuler le rendez-vous via le lien suivant :\n👉 [demanda]\n\n⚠️ Si vous ne parvenez pas à ouvrir le lien, enregistrez-nous comme contact (VidaHome) ou répondez simplement à ce message et vous pourrez y accéder sans problème.\n\nCordialement,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Confirmation de visite (après appel téléphonique)",
            category: "Suivi",
            content: "👋 Bonjour [nombre]\nJe suis [agente_creador], de l'agence immobilière VidaHome 🏡.\n\nComme convenu lors de notre appel téléphonique, je vous confirme la visite de la propriété pour le [dia] à [hora].\n\n📍 Adresse: [zona], [ciudad]\n🔗 Localisation Google Maps: [demanda]\n\nVoici le lien avec les détails de la propriété :\n👉 [ref]\n\nVous pouvez confirmer le rendez-vous depuis le lien suivant :\n👉 [demanda]\n\n⚠️ Si vous ne parvenez pas à ouvrir les liens, enregistrez-nous comme contact (VidaHome) ou répondez simplement à ce message et vous pourrez y accéder sans problème.\n\nCordialement,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Message post-vente : remerciement et avis",
            category: "Fidélisation",
            content: "🎉 Bonjour [nombre],\nMerci beaucoup d'avoir fait confiance à VidaHome pour la gestion de votre achat-vente 🏡.\n\nCe fut un plaisir de vous accompagner tout au long du processus et nous sommes ravis que tout se soit bien passé. Nous espérons que vous êtes satisfait de notre service ; nous restons à votre disposition pour tout besoin futur 🙌.\n\nSi vous souhaitez partager votre expérience et nous aider à nous améliorer, vous pouvez laisser votre avis ici :\n⭐ Laisser un avis sur Google\n\nCordialement,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmation de visite (bien non encore publié dans le CRM)",
            category: "Suivi",
            content: "👋 Bonjour [nombre],\nComme convenu par téléphone, je vous confirme la visite de la propriété le [dia] à [hora].\n\n📍 Adresse: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nJe reste à votre disposition pour toute question avant la visite.\n\nCordialement,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    it: [
        {
            title: "Primo contatto senza risposta telefonica",
            category: "Prospezione",
            content: "👋 Buongiorno [nome]\nSono [agente_creador], dell'agenzia immobiliare VidaHome 🏡.\n\nAbbiamo ricevuto la sua richiesta riguardo all'immobile [ref]. Ho provato a contattarla telefonicamente senza successo, quindi le invio il link con tutti i dettagli della proprietà:\n👉 [demanda]\n\nPuò scoprire di più su di noi qui:\n🌐 Sito web: www.vidahome.es\n📍 Posizione dell'agenzia e recensioni: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Se non riesce ad aprire il link, ci salvi come contatto (VidaHome) oppure risponda a questo messaggio e potrà accedervi senza problemi.\n\nResto a sua disposizione per qualsiasi domanda o per fissare una visita.\n\nCordiali saluti,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Conferma della visita (senza contatto telefonico)",
            category: "Seguito",
            content: "👋 Buongiorno [nome]\nConfermiamo la visita della proprietà per il [dia] alle [hora], con il nostro agente [agente_nombre].\n\n📍 Indirizzo: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\nPuò confermare, modificare o annullare l'appuntamento tramite il seguente link:\n👉 [demanda]\n\n⚠️ Se non riesce ad aprire il link, ci salvi come contatto (VidaHome) oppure risponda a questo messaggio e potrà accedervi senza problemi.\n\nCordiali saluti,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Conferma della visita (dopo la telefonata)",
            category: "Seguito",
            content: "👋 Buongiorno [nome]\nSono [agente_creador], dell'agenzia immobiliare VidaHome 🏡.\n\nCome concordato durante la nostra telefonata, le confermo la visita della proprietà per il [dia] alle [hora].\n\n📍 Indirizzo: [zona], [ciudad]\n🔗 Posizione su Google Maps: [demanda]\n\nEcco il link con i dettagli della proprietà:\n👉 [ref]\n\nPuò anche confermare l'appuntamento tramite il seguente link:\n👉 [demanda]\n\n⚠️ Se non riesce ad aprire i link, ci salvi come contatto (VidaHome) oppure risponda a questo messaggio e potrà accedervi senza problemi.\n\nCordiali saluti,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Messaggio post-vendita – ringraziamento e recensioni",
            category: "Fidelizzazione",
            content: "🎉 Buongiorno [nome],\nLa ringraziamo molto per aver scelto VidaHome per la gestione della sua compravendita 🏡.\n\nÈ stato un piacere accompagnarla durante tutto il processo e siamo felici che tutto sia andato bene. Speriamo che sia soddisfatto/a del nostro servizio e le ricordiamo che siamo sempre a disposizione per qualsiasi necessità futura 🙌.\n\nSe desidera condividere la sua esperienza e aiutarci a migliorare, può lasciare la sua recensione qui:\n⭐ Lascia una recensione su Google\n\nCordiali saluti,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Conferma della visita (immobile non ancora pubblicato nel CRM)",
            category: "Seguito",
            content: "👋 Buongiorno [nome],\nCome concordato telefonicamente questo [mattina/pomeriggio], le confermo la visita della proprietà il [dia] alle [hora].\n\n📍 Indirizzo: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\nResto a sua disposizione per qualsiasi domanda prima della visita.\n\nCordiali saluti,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    pt: [
        {
            title: "Primeiro contacto sem resposta telefónica",
            category: "Prospecção",
            content: "👋 Bom dia [nome]\nSou [agente_creador], da agência imobiliária VidaHome 🏡.\n\nRecebemos o seu pedido sobre o imóvel [ref]. Tentei ligar-lhe sem sucesso, por isso envio-lhe o link com todos os detalhes da propriedade:\n👉 [demanda]\n\nPode saber mais sobre nós aqui:\n🌐 Website: www.vidahome.es\n📍 Localização da agência e opiniões: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Se não conseguir abrir o link, guarde-nos como contacto (VidaHome) ou responda a esta mensagem e poderá aceder sem problema.\n\nEstou à sua disposição para qualquer dúvida ou para marcar uma visita.\n\nCom os melhores cumprimentos,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmação de visita (sem contacto prévio)",
            category: "Acompanhamento",
            content: "👋 Olá [nome]\nConfirmamos a visita da propriedade para o dia [dia] às [hora], com o nosso agente [agente_nombre].\n\n📍 Morada: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\nPode confirmar, alterar ou cancelar a marcação através do seguinte link:\n👉 [demanda]\n\n⚠️ Se não conseguir abrir o link, guarde-nos como contacto (VidaHome) ou responda a esta mensagem e poderá aceder sem problema.\n\nCom os melhores cumprimentos,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Confirmação de visita (após chamada telefónica)",
            category: "Acompanhamento",
            content: "👋 Olá [nome]\nSou [agente_creador], da agência imobiliária VidaHome 🏡.\n\nConforme combinado na nossa chamada telefónica, confirmo a visita da propriedade para o dia [dia] às [hora].\n\n📍 Morada: [zona], [ciudad]\n🔗 Localização Google Maps: [demanda]\n\nAqui está o link com os detalhes da propriedade:\n👉 [ref]\n\nTambém pode confirmar a visita através do seguinte link:\n👉 [demanda]\n\n⚠️ Se não conseguir abrir os links, guarde-nos como contacto (VidaHome) ou responda a esta mensagem e poderá aceder sem problema.\n\nCom os melhores cumprimentos,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Mensagem pós-venda – agradecimento e opiniões",
            category: "Fidelização",
            content: "🎉 Olá [nome],\nMuito obrigado por confiar na VidaHome na gestão da sua compra e venda 🏡.\n\nFoi um prazer acompanhá-lo/a durante todo o processo e ficamos felizes que tudo tenha corrido bem. Esperamos que esteja satisfeito/a com o nosso serviço e lembramos que estamos sempre disponíveis para o que precisar no futuro 🙌.\n\nSe quiser partilhar a sua experiência e ajudar-nos a melhorar, pode deixar a sua opinião aqui:\n⭐ Deixar opinião no Google\n\nCom os melhores cumprimentos,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmação de visita (imóvel ainda não publicado no CRM)",
            category: "Acompanhamento",
            content: "👋 Olá [nome],\nConforme combinado por telefone hoje de [manhã/tarde], confirmo a visita da propriedade no dia [dia] às [hora].\n\n📍 Morada: [zona], [ciudad]\n📞 Agente: [agente_nombre] – [agente_tlf]\n\nEstou à sua disposição para qualquer questão antes da visita.\n\nCom os melhores cumprimentos,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    de: [
        {
            title: "Erster Kontakt ohne telefonische Antwort",
            category: "Akquise",
            content: "👋 Guten Tag [name]\nIch bin [agente_creador] von der Immobilienagentur VidaHome 🏡.\n\nWir haben Ihre Anfrage zu der Immobilie [ref] erhalten. Ich habe versucht, Sie telefonisch zu erreichen, leider ohne Erfolg. Deshalb sende ich Ihnen hier den Link mit allen Details zur Immobilie:\n👉 [demanda]\n\nWeitere Informationen über uns finden Sie hier:\n🌐 Webseite: www.vidahome.es\n📍 Standort der Agentur und Bewertungen: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Falls der Link nicht geöffnet werden kann, speichern Sie uns bitte als Kontakt (VidaHome) oder antworten Sie einfach auf diese Nachricht, dann funktioniert es problemlos.\n\nFür Fragen oder zur Vereinbarung eines Besichtigungstermins stehe ich Ihnen jederzeit zur Verfügung.\n\nMit freundlichen Grüßen,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Bestätigung des Besichtigungstermins (ohne vorherigen Kontakt)",
            category: "Follow-up",
            content: "👋 Hallo [name]\nWir bestätigen den Besichtigungstermin der Immobilie für den [dia] um [hora], mit unserem Makler [agente_nombre].\n\n📍 Adresse: [zona], [ciudad]\n📞 Ansprechpartner: [agente_nombre] – [agente_tlf]\n\nSie können den Termin über den folgenden Link bestätigen, ändern oder absagen:\n👉 [demanda]\n\n⚠️ Falls der Link nicht geöffnet werden kann, speichern Sie uns bitte als Kontakt (VidaHome) oder antworten Sie einfach auf diese Nachricht, dann funktioniert es problemlos.\n\nMit freundlichen Grüßen,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Bestätigung des Besichtigungstermins (nach Telefongespräch)",
            category: "Follow-up",
            content: "👋 Hallo [name]\nIch bin [agente_creador] von der Immobilienagentur VidaHome 🏡.\n\nWie telefonisch besprochen, bestätige ich Ihnen den Besichtigungstermin der Immobilie für den [dia] um [hora].\n\n📍 Adresse: [zona], [ciudad]\n🔗 Google Maps Standort: [demanda]\n\nHier finden Sie den Link mit allen Details zur Immobilie:\n👉 [ref]\n\nSie können den Termin auch über den folgenden Link bestätigen:\n👉 [demanda]\n\n⚠️ Falls die Links nicht geöffnet werden können, speichern Sie uns bitte als Kontakt (VidaHome) oder antworten Sie einfach auf diese Nachricht, dann funktioniert es problemlos.\n\nMit freundlichen Grüßen,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Nachricht nach Abschluss – Dank und Bewertungen",
            category: "Kundenbindung",
            content: "🎉 Hallo [name],\nvielen Dank, dass Sie VidaHome beim Kauf/Verkauf Ihrer Immobilie Ihr Vertrauen geschenkt haben 🏡.\n\nEs war uns eine Freude, Sie während des gesamten Prozesses zu begleiten, und wir freuen uns, dass alles gut verlaufen ist. Wir hoffen, dass Sie mit unserem Service zufrieden sind. Selbstverständlich stehen wir Ihnen auch künftig jederzeit zur Verfügung 🙌.\n\nWenn Sie Ihre Erfahrung teilen und uns helfen möchten, uns weiter zu verbessern, können Sie hier Ihre Bewertung abgeben:\n⭐ Google-Bewertung abgeben\n\nMit freundlichen Grüßen,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Bestätigung des Besichtigungstermins (Immobilie noch nicht im CRM veröffentlicht)",
            category: "Follow-up",
            content: "👋 Hallo [name],\nwie heute [Vormittag/Nachmittag] telefonisch besprochen, bestätige ich Ihnen den Besichtigungstermin für die Immobilie am [dia] um [hora].\n\n📍 Adresse: [zona], [ciudad]\n📞 Ansprechpartner: [agente_nombre] – [agente_tlf]\n\nFür Rückfragen vor dem Termin stehe ich Ihnen selbstverständlich gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    ro: [
        {
            title: "Primul contact fără răspuns telefonic",
            category: "Prospectare",
            content: "👋 Bună ziua [nume]\nSunt [agente_creador], de la agenția imobiliară VidaHome 🏡.\n\nAm primit cererea dvs. pentru proprietatea [ref]. Am încercat să vă contactez telefonic fără succes, așa că vă trimit linkul cu toate detaliile:\n👉 [demanda]\n\nPuteți afla mai multe despre noi aici:\n🌐 Site: www.vidahome.es\n📍 Locația agenției și recenzii: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Dacă nu puteți deschide linkul, salvați-ne ca și contact (VidaHome) sau răspundeți la acest mesaj și veți putea accesa fără probleme.\n\nRămân la dispoziția dvs. pentru orice întrebare sau pentru a stabili o vizită.\n\nCu respect,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmarea vizitei (fără contact telefonic anterior)",
            category: "Urmărire",
            content: "👋 Bună [nume]\nVă confirmăm vizita la proprietate pentru data de [dia] la ora [hora], împreună cu agentul nostru [agente_nombre].\n\n📍 Adresă: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nPuteți confirma, modifica sau anula programarea accesând linkul următor:\n👉 [demanda]\n\n⚠️ Dacă nu puteți deschide linkul, salvați-ne ca și contact (VidaHome) o simplemente responda a este mensaje y podrá acceder sin problema.\n\nCu respect,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Confirmarea vizitei (după apel telefonic)",
            category: "Urmărire",
            content: "👋 Bună [nume]\nSunt [agente_creador], de la agenția imobiliară VidaHome 🏡.\n\nAșa cum am convenit în timpul apelului telefonic, vă confirm vizita la proprietate pentru data de [dia] la ora [hora].\n\n📍 Adresă: [zona], [ciudad]\n🔗 Localizare Google Maps: [demanda]\n\nAici este linkul cu detaliile proprietății:\n👉 [ref]\n\nPuteți confirma vizita și prin următorul link:\n👉 [demanda]\n\n⚠️ Dacă nu puteți deschide linkurile, salvați-ne ca și contact (VidaHome) sau răspundeți la acest mesaj și veți putea accesa fără probleme.\n\nCu respect,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Mesaj post-vânzare – mulțumiri și recenzii",
            category: "Loialitate",
            content: "🎉 Bună [nume],\nVă mulțumim foarte mult pentru încrederea acordată VidaHome în gestionarea tranzacției dvs. imobiliare 🏡.\n\nA fost o plăcere să vă fim alături pe tot parcursul procesului și ne bucurăm că totul a decurs bine. Sperăm că sunteți mulțumit/ă de serviciile noastre și vă reamintim că suntem aici pentru orice nevoie viitoare 🙌.\n\nDacă doriți să împărtășiți experința dvs. și să ne ajutați să ne îmbunătățim, puteți lăsa o recenzie aici:\n⭐ Lăsați o recenzie pe Google\n\nCu respect,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Confirmarea vizitei (proprietate încă nepublicată în CRM)",
            category: "Urmărire",
            content: "👋 Bună [nume],\nAșa cum am discutat telefonic [dimineață/după-amiază], vă confirm vizita la proprietate pentru data de [dia] la ora [hora].\n\n📍 Adresă: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nRămân la dispoziția dvs. pentru orice întrebare înainte de vizită.\n\nCu respect,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    pl: [
        {
            title: "Pierwszy kontakt bez odpowiedzi telefonicznej",
            category: "Pozyskiwanie",
            content: "👋 Dzień dobry [imię]\nJestem [agente_creador] z agencji nieruchomości VidaHome 🏡.\n\nOtrzymaliśmy Państwa zapytanie dotyczące nieruchomości [ref]. Próbowałem skontaktować się z Państwem telefonicznie, lecz bez skutku, dlatego przesyłam link ze wszystkimi szczegółami:\n👉 [demanda]\n\nWięcej informacji o nas znajdą Państwo tutaj:\n🌐 Strona internetowa: www.vidahome.es\n📍 Lokalizacja biura i opinie klientów: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Jeśli link się nie otwiera, proszę dodać nas do kontaktów (VidaHome) lub po prostu odpowiedzieć na tę wiadomość, a wtedy będzie działać.\n\nPozostaję do Państwa dyspozycji w razie pytań lub umówienia wizyty.\n\nZ poważaniem,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Potwierdzenie wizyty (bez wcześniejszego kontaktu)",
            category: "Kontynuacja",
            content: "👋 Witam [imię]\nPotwierdzamy wizytę w nieruchomości dnia [dia] o godzinie [hora], z naszym agentem [agente_nombre].\n\n📍 Adres: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nMogą Państwo potwierdzić, zmienić lub odwołać wizytę, korzystając z poniższego linku:\n👉 [demanda]\n\n⚠️ Jeśli link się nie otwiera, proszę dodać nas do kontaktów (VidaHome) lub po prostu odpowiedzieć na tę wiadomość, a wtedy będzie działać.\n\nZ poważaniem,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Potwierdzenie wizyty (po rozmowie telefonicznej)",
            category: "Kontynuacja",
            content: "👋 Witam [imię]\nJestem [agente_creador] z agencji nieruchomości VidaHome 🏡.\n\nZgodnie z ustaleniami podczas naszej rozmowy telefonicznej potwierdzam wizytę w nieruchomości dnia [dia] o godzinie [hora].\n\n📍 Adres: [zona], [ciudad]\n🔗 Lokalizacja w Google Maps: [demanda]\n\nTutaj znajdą Państwo link ze szczegółami nieruchomości:\n👉 [ref]\n\nWizytę można również potwierdzić za pomocą poniższego linku:\n👉 [demanda]\n\n⚠️ Jeśli linki się nie otwierają, proszę dodać nas do kontaktów (VidaHome) lub po prostu odpowiedzieć na tę wiadomość, a wtedy będą działać.\n\nZ poważaniem,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Wiadomość po sprzedaży – podziękowanie i opinie",
            category: "Lojalność",
            content: "🎉 Witam [imię],\nSerdecznie dziękujemy za zaufanie, jakim obdarzyli Państwo VidaHome przy obsłudze transakcji kupna-sprzedaży 🏡.\n\nByło nam miło towarzyszyć Państwu przez cały proces i cieszymy się, że wszystko przebiegło pomyślnie. Mamy nadzieję, że są Państwo zadowoleni z naszych usług i przypominamy, że jesteśmy do dyspozycji także w przyszłości 🙌.\n\nJeśli chcą Państwo podzielić się swoją opinią i pomóc nam się rozwijać, mogą Państwo zostawić recenzję tutaj:\n⭐ Dodaj opinię w Google\n\nZ poważaniem,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Potwierdzenie wizyty (nieruchomość nieopublikowana jeszcze w CRM)",
            category: "Kontynuacja",
            content: "👋 Witam [imię],\nZgodnie z naszą rozmową telefoniczną dziś [rano/po południu], potwierdzam wizytę w nieruchomości dnia [dia] o godzinie [hora].\n\n📍 Adres: [zona], [ciudad]\n📞 Agent: [agente_nombre] – [agente_tlf]\n\nPozostaję do Państwa dyspozycji w razie pytań przed wizytą.\n\nZ poważaniem,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    nl: [
        {
            title: "Eerste contact zonder telefonisch antwoord",
            category: "Prospectie",
            content: "👋 Goedemiddag [naam]\nIk ben [agente_creador] van makelaarskantoor VidaHome 🏡.\n\nWij hebben uw aanvraag ontvangen over de woning [ref]. Ik heb geprobeerd u telefonisch te bereiken, maar dat is helaas niet gelukt. Daarom stuur ik u hierbij de link met alle details van de woning:\n👉 [demanda]\n\nMeer informatie over ons vindt u hier:\n🌐 Website: www.vidahome.es\n📍 Locatie van ons kantoor en beoordelingen: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Als de link niet opent, sla ons dan op als contact (VidaHome) of antwoord gewoon op dit bericht en het zal werken.\n\nIk sta tot uw beschikking voor vragen of om een bezichtiging af te spreken.\n\nMet vriendelijke groet,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Bevestiging van de bezichtiging (zonder voorafgaand contact)",
            category: "Opvolging",
            content: "👋 Hallo [naam]\nWij bevestigen de bezichtiging van de woning op [dia] om [hora], met onze makelaar [agente_nombre].\n\n📍 Adres: [zona], [ciudad]\n📞 Makelaar: [agente_nombre] – [agente_tlf]\n\nU kunt de afspraak bevestigen, wijzigen of annuleren via de volgende link:\n👉 [demanda]\n\n⚠️ Als de link niet opent, sla ons dan op als contact (VidaHome) of antwoord gewoon op dit bericht en het zal werken.\n\nMet vriendelijke groet,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Bevestiging van de bezichtiging (na telefonisch contact)",
            category: "Opvolging",
            content: "👋 Hallo [naam]\nIk ben [agente_creador] van makelaarskantoor VidaHome 🏡.\n\nZoals telefonisch afgesproken bevestig ik de bezichtiging van de woning op [dia] om [hora].\n\n📍 Adres: [zona], [ciudad]\n🔗 Google Maps locatie: [demanda]\n\nHier vindt u de link met de details van de woning:\n👉 [ref]\n\nU kunt de afspraak ook bevestigen via de volgende link:\n👉 [demanda]\n\n⚠️ Als de links niet openen, sla ons dan op als contact (VidaHome) of antwoord gewoon op dit bericht en het zal werken.\n\nMet vriendelijke groet,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Bericht na verkoop – dank en beoordelingen",
            category: "Loyaliteit",
            content: "🎉 Hallo [naam],\nHartelijk dank dat u VidaHome het vertrouwen hebt gegeven bij de verkoop/aankoop van uw woning 🏡.\n\nHet was een genoegen u gedurende het hele proces te begeleiden en we zijn blij dat alles goed is verlopen. We hopen dat u tevreden bent met onze service en we staan uiteraard in de toekomst altijd voor u klaar 🙌.\n\nAls u uw ervaring wilt delen en ons wilt helpen verder te verbeteren, kunt u hier een beoordeling achterlaten:\n⭐ Beoordeling achterlaten op Google\n\nMet vriendelijke groet,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Bevestiging van de bezichtiging (woning nog niet gepubliceerd in CRM)",
            category: "Opvolging",
            content: "👋 Hallo [naam],\nZoals vanochtend/vanmiddag telefonisch besproken bevestig ik de bezichtiging van de woning op [dia] om [hora].\n\n📍 Adres: [zona], [ciudad]\n📞 Makelaar: [agente_nombre] – [agente_tlf]\n\nIk sta tot uw beschikking voor eventuele vragen voorafgaand aan de afspraak.\n\nMet vriendelijke groet,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    uk: [
        {
            title: "Перший контакт без відповіді по телефону",
            category: "Пошук",
            content: "👋 Добрий день [ім'я]\nЯ [agente_creador] з агентства нерухомості VidaHome 🏡.\n\nМи отримали ваш запит щодо об'єкта [ref]. Я намагався зв'язатися з вами телефоном без успіху, тому надсилаю вам посилання з усіма деталями:\n👉 [demanda]\n\nБільше інформації про нас тут:\n🌐 Вебсайт: www.vidahome.es\n📍 Локація агентства та відгуки: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Якщо посилання не відкривається, збережіть нас як контакт (VidaHome) або просто відповідайте на це повідомлення, і воно запрацює.\n\nЯ у вашому розпорядженні для будь-яких питань або щоб домовитися про перегляд.\n\nЗ повагою,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Підтвердження візиту (без попереднього контакту)",
            category: "Супровід",
            content: "👋 Вітаю [ім'я]\nПідтверджуємо перегляд нерухомості на [dia] o [hora], з нашим агентом [agente_nombre].\n\n📍 Адреса: [zona], [ciudad]\n📞 Агент: [agente_nombre] – [agente_tlf]\n\nВи можете підтвердити, змінити або скасувати зустріч за цим посиланням:\n👉 [demanda]\n\n⚠️ Якщо посилання не відкривається, збережіть нас як контакт (VidaHome) або просто відповідайте на це повідомлення, і воно запрацює.\n\nЗ повагою,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Підтвердження візиту (після телефонної розмови)",
            category: "Супровід",
            content: "👋 Вітаю [ім'я]\nЯ [agente_creador] з агентства нерухомості VidaHome 🏡.\n\nЯк ми домовилися під час телефонної розмови, підтверджую перегляд нерухомості на [dia] o [hora].\n\n📍 Адреса: [zona], [ciudad]\n🔗 Локація Google Maps: [demanda]\n\nОсь посилання з деталями про об'єкт:\n👉 [ref]\n\nВи також можете підтвердити зустріч за цим посиланням:\n👉 [demanda]\n\n⚠️ Якщо посилання не відкривається, збережіть нас як контакт (VidaHome) або просто відповідайте на це повідомлення, і воно запрацює.\n\nЗ повагою,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Повідомлення після угоди – подяка та відгуки",
            category: "Лояльність",
            content: "🎉 Вітаю [ім'я],\nЩиро дякуємо за довіру до VidaHome у супроводі вашої угоди 🏡.\n\nНам було приємно супроводжувати вас протягом усього процесу, і ми раді, що все пройшло успішно. Сподіваємось, що ви задоволені нашим сервісом, і нагадуємо, що ми завжди поруч, якщо знадобиться допомога у майбутньому 🙌.\n\nЯкщо ви хочете поділитися своїм досвідом і допомогти нам стати кращими, залиште відгук тут:\n⭐ Залишити відгук у Google\n\nЗ повагою,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Підтвердження візиту (об'єкт ще не опублікований у CRM)",
            category: "Супровід",
            content: "👋 Вітаю [ім'я],\nЯк ми домовилися сьогодні [вранці/після обіду] телефоном, підтверджую перегляд нерухомості на [dia] o [hora].\n\n📍 Адреса: [zona], [ciudad]\n📞 Агент: [agente_nombre] – [agente_tlf]\n\nЯ у вашому розпорядженні для будь-яких питань перед зустріччю.\n\nЗ повагою,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ],
    ru: [
        {
            title: "Первый контакт без ответа по телефону",
            category: "Поиск",
            content: "👋 Добрый день [имя]\nЯ [agente_creador] из агентства недвижимости VidaHome 🏡.\n\nМы получили ваш запрос по объекту [ref]. Я пытался связаться с вами по телефону, но безуспешно, поэтому отправляю ссылку со всеми подробностями:\n👉 [demanda]\n\nБольше информации о нас:\n🌐 Сайт: www.vidahome.es\n📍 Адрес агентства и отзывы клиентов: https://maps.app.goo.gl/hajziWSePahmJ4Sf9\n\n⚠️ Если ссылка не открывается, добавьте нас в контакты (VidaHome) или просто ответьте на это сообщение, и она заработает.\n\nЯ в вашем распоряжении для любых вопросов или чтобы договориться о просмотре.\n\nС уважением,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Подтверждение визита (без предварительного звонка)",
            category: "Сопровождение",
            content: "👋 Здравствуйте [имя]\nМы подтверждаем просмотр недвижимости на [dia] в [hora], с нашим агентом [agente_nombre].\n\n📍 Адрес: [zona], [ciudad]\n📞 Агент: [agente_nombre] – [agente_tlf]\n\nВы можете подтвердить, изменить или отменить встречу по следующей ссылке:\n👉 [demanda]\n\n⚠️ Если ссылка не открывается, добавьте нас в контакты (VidaHome) или просто ответьте на это сообщение, и она заработаet.\n\nС уважением,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        },
        {
            title: "Подтверждение визита (после телефонного разговора)",
            category: "Сопровождение",
            content: "👋 Здравствуйте [имя]\nЯ [agente_creador] из агентства недвижимости VidaHome 🏡.\n\nКак мы договорились по телефону, подтверждаю просмотр недвижимости на [dia] в [hora].\n\n📍 Адрес: [zona], [ciudad]\n🔗 Google Maps: [demanda]\n\nВот ссылка с подробностями об объекте:\n👉 [ref]\n\nВы также можете подтвердить встречу по следующей ссылке:\n👉 [demanda]\n\n⚠️ Если ссылки не открываются, добавьте нас в контакты (VidaHome) или просто ответьte на это сообщение, и они заработают.\n\nС уважением,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Сообщение после сделки – благодарность и отзывы",
            category: "Лояльность",
            content: "🎉 Здравствуйте [имя],\nБольшое спасибо за то, что доверили VidaHome сопровождение вашей сделки 🏡.\n\nНам было приятно сопровождать вас на протяжении всего процесса, и мы рады, что всё прошло успешно. Надеемся, что вы довольны нашим сервисом, и напоминаем, что мы всегда рядом, если понадобится помощь в будущем 🙌.\n\nЕсли вы хотите поделиться своим опытом и помочь нам стать лучше, оставьте отзыв здесь:\n⭐ Оставить отзыв в Google\n\nС уважением,\n[agente_creador] – VidaHome",
            imageUrl: null,
        },
        {
            title: "Подтверждение визита (объект ещё не опубликован в CRM)",
            category: "Сопровождение",
            content: "👋 Здравствуйте [имя],\nКак мы обсудили сегодня [утром/днём] по телефону, подтверждаю просмотр недвижимости на [dia] в [hora].\n\n📍 Адрес: [zona], [ciudad]\n📞 Агент: [agente_nombre] – [agente_tlf]\n\nЯ в вашем распоряжении для любых вопросов до встречи.\n\nС уважением,\n[agente_creador] – VidaHome 🏡",
            imageUrl: null,
        }
    ]
};


const fetchTemplatesFromDB = async (language: string): Promise<MessageTemplate[]> => {
    try {
        const templatesCollection = db.collection('plantillas').where('language', '==', language);
        const templatesSnapshot = await templatesCollection.get();
        const templatesList = templatesSnapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: String(doc.id),
                title: String(data.title ?? doc.id),
                category: String(data.category ?? data['tipo de mensaje'] ?? ''),
                content: String(data.content ?? data['mensaje'] ?? ''),
                imageUrl: data.imageUrl ? String(data.imageUrl) : null,
                createdAt: data.createdAt instanceof firebase.firestore.Timestamp ? data.createdAt.toDate() : new Date(),
                language: String(data.language ?? 'es'),
            };
        });
        templatesList.sort((a: MessageTemplate, b: MessageTemplate) => b.createdAt.getTime() - a.createdAt.getTime());
        return templatesList;
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
};

const fetchRecipientsFromDB = async (): Promise<Recipient[]> => {
    try {
        const recipientsCollection = db.collection('destinatarios');
        const recipientsSnapshot = await recipientsCollection.get();
        const recipientsList = recipientsSnapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: String(doc.id),
                name: String(data.name ?? data['nombre'] ?? ''),
                phone: String(data.phone ?? data['telefono'] ?? ''),
                createdAt: data.createdAt instanceof firebase.firestore.Timestamp ? data.createdAt.toDate() : new Date(),
            };
        });
        recipientsList.sort((a: Recipient, b: Recipient) => b.createdAt.getTime() - a.createdAt.getTime());
        return recipientsList;
    } catch (error) {
        console.error("Error fetching recipients:", error);
        return [];
    }
};

const App: React.FC = () => {
  // FIX: Replaced firebase.User with any to resolve typing issue with global Firebase script.
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin state for editing other agents
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: Replaced firebase.User with any to resolve typing issue with global Firebase script.
    const unsubscribe = auth.onAuthStateChanged(async (user: any | null) => {
        setCurrentUser(user);
        if (user) {
            const agentProfile = await fetchAgentById(user.uid);
            setCurrentAgent(agentProfile);
            setIsAdmin(user.email === ADMIN_EMAIL);
        } else {
            setCurrentAgent(null);
            setIsAdmin(false);
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const ensureDefaultTemplates = async () => {
    try {
        console.log("Checking for default templates...");
        const batch = db.batch();
        let writesPending = false;

        for (const lang in defaultTemplates) {
            const templatesInLang = defaultTemplates[lang as Language];
            for (let i = 0; i < templatesInLang.length; i++) {
                const template = templatesInLang[i];
                const docId = `vidahome_default_${lang}_${i + 1}`;
                const docRef = db.collection('plantillas').doc(docId);
                const docSnap = await docRef.get();
                if (!docSnap.exists) {
                    batch.set(docRef, { 
                        ...template, 
                        language: lang,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                    });
                    writesPending = true;
                    console.log(`Default template "${template.title}" for lang "${lang}" not found, queueing for creation.`);
                }
            }
        }

        if (writesPending) {
            await batch.commit();
            console.log("Default templates created successfully.");
        } else {
            console.log("All default templates are already present.");
        }
    } catch (error) {
        console.error("Error ensuring default templates exist:", error);
    }
  };


  useEffect(() => {
    if (!currentUser) return;

    const initializeAppData = async () => {
        setIsLoading(true);
        if (isAdmin) {
          await ensureDefaultTemplates();
        }
        
        const [recipientsList, templatesList, agentsList] = await Promise.all([
            fetchRecipientsFromDB(),
            fetchTemplatesFromDB(currentLanguage),
            fetchAllAgents()
        ]);
        
        setRecipients(recipientsList);
        if (recipientsList.length > 0) setSelectedRecipient(recipientsList[0]);

        setTemplates(templatesList);
        if (templatesList.length > 0) setSelectedTemplate(templatesList[0]);
        else setSelectedTemplate(null);
        
        setAgents(agentsList);
        if(currentAgent) {
          const defaultAgent = agentsList.find(a => a.id === currentAgent.id) || agentsList[0] || null;
          setSelectedAgent(defaultAgent);
        } else if (agentsList.length > 0) {
          setSelectedAgent(agentsList[0]);
        }
        
        setIsLoading(false);
    };
    initializeAppData();
  }, [currentUser, currentLanguage, isAdmin]);

  const handleAddTemplate = async (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'language'>) => {
    try {
      await db.collection('plantillas').add({
          title: template.title,
          category: template.category,
          content: template.content,
          imageUrl: template.imageUrl,
          language: currentLanguage,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const newTemplates = await fetchTemplatesFromDB(currentLanguage);
      setTemplates(newTemplates);
      if (newTemplates.length > 0) {
        setSelectedTemplate(newTemplates[0]);
      }
    } catch (error) {
      console.error("Error adding template: ", error);
    }
  };

  const handleUpdateTemplate = async (id: string, templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'language'>) => {
    try {
      const dataToUpdate = {
        title: templateData.title,
        category: templateData.category,
        content: templateData.content,
        imageUrl: templateData.imageUrl,
      };
      await db.collection('plantillas').doc(id).update(dataToUpdate);
      const newTemplates = await fetchTemplatesFromDB(currentLanguage);
      setTemplates(newTemplates);
      if (selectedTemplate?.id === id) {
        const updatedSelected = newTemplates.find(t => t.id === id);
        setSelectedTemplate(updatedSelected || null);
      }
    } catch (error) {
      console.error("Error updating template: ", error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const wasSelected = selectedTemplate?.id === id;
      const originalIndex = templates.findIndex(t => t.id === id);
      await db.collection("plantillas").doc(id).delete();
      const newTemplates = await fetchTemplatesFromDB(currentLanguage);
      setTemplates(newTemplates);
      if (wasSelected) {
        const newIndex = Math.min(originalIndex, newTemplates.length - 1);
        setSelectedTemplate(newTemplates.length > 0 ? newTemplates[newIndex] : null);
      }
    } catch (error) {
      console.error("Error deleting template: ", error);
    }
  };

  const handleSelectTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    setSelectedTemplate(template || null);
    setAppointmentDate('');
    setAppointmentTime('');
  };
  
  const handleAddRecipient = async (recipient: Omit<Recipient, 'id' | 'createdAt'>) => {
    try {
      await db.collection('destinatarios').add({
          name: recipient.name,
          phone: recipient.phone,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const newRecipients = await fetchRecipientsFromDB();
      setRecipients(newRecipients);
      if (newRecipients.length > 0) {
        setSelectedRecipient(newRecipients[0]);
      }
    } catch (error) {
      console.error("Error adding recipient: ", error);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    try {
      const wasSelected = selectedRecipient?.id === id;
      const originalIndex = recipients.findIndex(r => r.id === id);
      await db.collection("destinatarios").doc(id).delete();
      const newRecipients = await fetchRecipientsFromDB();
      setRecipients(newRecipients);
      if (wasSelected) {
        const newIndex = Math.min(originalIndex, newRecipients.length - 1);
        setSelectedRecipient(newRecipients.length > 0 ? newRecipients[newIndex] : null);
      }
    } catch (error) {
      console.error("Error deleting recipient: ", error);
    }
  };

  const handleSelectRecipient = (id: string) => {
    const recipient = recipients.find(r => r.id === id);
    setSelectedRecipient(recipient || null);
  };

  const handleSelectProperty = (property: Property | null) => {
    setSelectedProperty(property);
  };
  
  const handleSelectAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setSelectedAgent(agent || null);
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
  };
  
  const handleSignOut = () => {
    auth.signOut();
  };

  // Admin handlers
  const handleOpenProfileEditor = (agent: Agent) => {
    setAgentToEdit(agent);
    setIsProfileModalOpen(true);
  };

  const handleProfileUpdate = async (data: { name: string, phone: string }) => {
    if (!agentToEdit) return;
    await updateAgentProfile(agentToEdit.id, data);
    const updatedAgents = await fetchAllAgents(); // Refetch all agents
    setAgents(updatedAgents);
  };
  
  const handleCreateAgent = async (data: { name: string, email: string, password: string }): Promise<string | null> => {
    const { name, email, password } = data;
    const requiredDomain = 'vidahome.es';
    if (!email.endsWith('@' + requiredDomain)) {
        return `El registro está restringido a cuentas de @${requiredDomain}.`;
    }
    if (!name.trim()) {
      return 'El nombre es obligatorio.';
    }

    // Since creating a user automatically signs them in, we need to save the current admin's session.
    const currentAdmin = auth.currentUser;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        await db.collection('usuarios').doc(user.uid).set({
          nombre: name,
          email: user.email,
          telefono: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Re-authenticate the admin
        if (currentAdmin) {
            await auth.updateCurrentUser(currentAdmin);
        }

        alert('Agente creado con éxito. La sesión ha cambiado al nuevo usuario. Por favor, cierra sesión y vuelve a entrar con tu cuenta de administrador.');
        
        const updatedAgents = await fetchAllAgents();
        setAgents(updatedAgents);
        return null; // Indica éxito
      }
      return 'No se pudo crear el usuario.';
    } catch (err: any) {
      // Re-authenticate the admin in case of an error as well
      if (currentAdmin) {
        await auth.updateCurrentUser(currentAdmin);
      }
      console.error("Error creating agent:", err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          return 'Este correo electrónico ya está registrado.';
        case 'auth/weak-password':
          return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/invalid-email':
          return 'El formato del correo electrónico no es válido.';
        default:
          return 'Ocurrió un error inesperado al crear el agente.';
      }
    }
  };


  if (authLoading) {
    return (
        <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">
            Cargando...
        </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const needsAppointmentDetails = selectedTemplate?.content.includes('[dia]') || selectedTemplate?.content.includes('[hora]');
  const needsVisitingAgent = selectedTemplate?.content.includes('[agente_nombre]') || selectedTemplate?.content.includes('[agente_tlf]');

  const recipientStep = 1;
  const propertyStep = 2;
  const templateStep = 3;
  let currentStep = 3;

  const agentStep = needsVisitingAgent ? ++currentStep : null;
  const appointmentStep = needsAppointmentDetails ? ++currentStep : null;
  const previewerStep = ++currentStep;

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <LogoIcon className="h-10 w-10 text-emerald-400"/>
            <h1 className="text-3xl font-bold text-white tracking-tight">Centro de Mensajes de WhatsApp</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{currentAgent?.name}</p>
              <p className="text-xs text-slate-400">{currentAgent?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>Cerrar Sesión</Button>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <RecipientManager 
                recipients={recipients}
                selectedRecipientId={selectedRecipient?.id || null}
                onAddRecipient={handleAddRecipient}
                onDeleteRecipient={handleDeleteRecipient}
                onSelectRecipient={handleSelectRecipient}
                stepNumber={recipientStep}
            />
            <PropertyManager
                selectedPropertyId={selectedProperty?.id || null}
                onSelectProperty={handleSelectProperty}
                stepNumber={propertyStep}
            />
            <TemplateManager
              templates={templates}
              onAddTemplate={handleAddTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onSelectTemplate={handleSelectTemplate}
              selectedTemplateId={selectedTemplate?.id || null}
              generateMessage={generateMessage}
              stepNumber={templateStep}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              isAdmin={isAdmin}
            />
             {needsVisitingAgent && (
              <AgentManager
                agents={agents}
                selectedAgentId={selectedAgent?.id || null}
                onSelectAgent={handleSelectAgent}
                stepNumber={agentStep!}
              />
            )}
            {needsAppointmentDetails && (
              <AppointmentScheduler
                date={appointmentDate}
                time={appointmentTime}
                onDateChange={setAppointmentDate}
                onTimeChange={setAppointmentTime}
                stepNumber={appointmentStep!}
              />
            )}
          </div>
          <div className="lg:col-span-3">
            <Previewer 
                template={selectedTemplate}
                property={selectedProperty}
                recipient={selectedRecipient}
                creatorAgent={currentAgent}
                visitingAgent={selectedAgent}
                appointmentDate={appointmentDate}
                appointmentTime={appointmentTime}
                isLoading={isLoading}
                stepNumber={previewerStep}
            />
          </div>
          {isAdmin && (
              <div className="lg:col-span-5">
                  <AdminPanel 
                    agents={agents} 
                    onEditAgent={handleOpenProfileEditor} 
                    onCreateAgent={handleCreateAgent}
                  />
              </div>
          )}
        </main>
      </div>
      {isProfileModalOpen && agentToEdit && (
        <ProfileEditor 
          agent={agentToEdit}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default App;