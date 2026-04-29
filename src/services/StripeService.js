import { loadStripe } from '@stripe/stripe-js';

/**
 * StripeService
 * Centralized logic for handling payments and subscriptions.
 */
class StripeService {
  constructor() {
    this.stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }

  /**
   * Redirects user to a secure Stripe Checkout page.
   * @param {string} tier - 'starter' | 'pro' | 'elite'
   * @param {string} interval - 'monthly' | 'yearly'
   * @param {string} teamId - The ID of the team to upgrade
   */
  async redirectToCheckout(tier, interval, teamId) {
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('Stripe konnte nicht geladen werden.');

    console.log(`[Stripe] Initializing checkout for ${tier} (${interval}) - Team: ${teamId}`);

    // In einer echten Produktion würden wir hier eine Cloud Function aufrufen,
    // um eine SessionId zu generieren. 
    // Hier ist das Beispiel, wie der Call aussehen würde:
    /*
    const response = await fetch('YOUR_CLOUD_FUNCTION_URL/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, interval, teamId, userId: auth.currentUser.uid })
    });
    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
    */

    // MOCK / FALLBACK: Für die Entwicklung zeigen wir eine Meldung
    // oder nutzen einen direkten Payment Link (falls vorhanden).
    alert(`Stripe Checkout Simulation:\nTier: ${tier}\nIntervall: ${interval}\nTeamID: ${teamId}\n\nIn der Produktion wirst du jetzt sicher zu Stripe weitergeleitet.`);
    
    // Tipp für Hendrik: Erstelle "Payment Links" im Stripe Dashboard 
    // und trage sie hier als Fallback ein.
    const paymentLinks = {
      'starter_monthly': 'https://buy.stripe.com/test_...',
      'pro_monthly': 'https://buy.stripe.com/test_...',
    };

    const link = paymentLinks[`${tier}_${interval}`];
    if (link) {
      window.location.href = `${link}?client_reference_id=${teamId}`;
    }
  }

  /**
   * Generates a Customer Portal link for managing subscriptions.
   */
  async openCustomerPortal(customerId) {
    // Dieser Teil benötigt zwingend ein Backend, um die Portal-Session zu erstellen.
    console.log('[Stripe] Opening Customer Portal for:', customerId);
  }
}

const stripeService = new StripeService();
export default stripeService;
