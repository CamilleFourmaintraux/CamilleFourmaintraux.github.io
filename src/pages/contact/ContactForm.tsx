import { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { emailjs_service, emailjs_template, emailjs_user, validateEmail } from './MailUtils';

export default function ContactForm() {
    // Références pour les champs du formulaire
    const lastnameRef = useRef<HTMLInputElement>(null);
    const firstnameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const subjectRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    // États pour le message de statut et son affichage
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

    // Initialisation d'EmailJS une seule fois
    useEffect(() => {
        emailjs.init(emailjs_user);
    }, []);

    // Fonction pour envoyer l'email via EmailJS
    const sendMail = (lastname: string, firstname: string, email: string, subject: string, message: string) => {
        emailjs.send(emailjs_service, emailjs_template, {
            from_name: `${firstname} ${lastname}`,
            from_email: email,
            subject: subject,
            message: message
        })
        .then(() => {
            setStatusMessage('Message envoyé avec succès.');
            setIsSuccess(true);
            resetForm();
        })
        .catch(() => {
            setStatusMessage('Désolé, une erreur est survenue durant l\'envoi de votre message.');
            setIsSuccess(false);
        });

        // Masquer le message après quelques secondes
        setTimeout(() => {
            setStatusMessage(null);
        }, 10000);
    };

    // Fonction pour vider les champs du formulaire
    const resetForm = () => {
        if (lastnameRef.current) lastnameRef.current.value = '';
        if (firstnameRef.current) firstnameRef.current.value = '';
        if (emailRef.current) emailRef.current.value = '';
        if (subjectRef.current) subjectRef.current.value = '';
        if (messageRef.current) messageRef.current.value = '';
    };

    // Gestionnaire de soumission du formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lastname = lastnameRef.current?.value || '';
        const firstname = firstnameRef.current?.value || '';
        const email = emailRef.current?.value || '';
        const subject = subjectRef.current?.value || '';
        const message = messageRef.current?.value || '';

        if (validateEmail(email)) {
            sendMail(lastname, firstname, email, subject, message);
        } else {
            setStatusMessage("Veuillez entrer une adresse e-mail valide.");
            setIsSuccess(false);
        }
    };

    return (
        <div className="container">
            <h2><i className="fas fa-pen"></i> M'envoyer un message</h2>
            
            <section id="section_form">
                <form id="contact-form" onSubmit={handleSubmit}>
                    <label htmlFor="name">Nom</label>
                    <input id="name" name="name" type="text" placeholder="Votre nom..." required ref={lastnameRef} />

                    <label htmlFor="forename">Prénom</label>
                    <input id="forename" name="forename" type="text" placeholder="Votre prénom..." required ref={firstnameRef} />

                    <label htmlFor="mail">E-Mail</label>
                    <input id="mail" name="mail" type="email" placeholder="Votre mail..." required ref={emailRef} />

                    <label htmlFor="subject">Intitulé</label>
                    <input id="subject" name="subject" type="text" placeholder="Intitulé du message..." required ref={subjectRef} />

                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" placeholder="Votre message..." required ref={messageRef} />

                    <button type="submit"><i className="fas fa-paper-plane"></i> Envoyer</button>
                </form>
            </section>

            {/* Affichage du message de statut */}
            {statusMessage && (
                <section>
                    <div id="message-status" style={{ color: isSuccess ? 'green' : 'red', display: 'block' }}>
                        {statusMessage}
                    </div>
                </section>
            )}
        </div>
    );
}
