export const emailjs_user = "3B_hn1nnz15LtDfl4";
export const emailjs_service = "service_hacwrwf";
export const emailjs_template = "template_kxdf4ll";

// Fonction pour valider une adresse e-mail avec une expression régulière
export function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}