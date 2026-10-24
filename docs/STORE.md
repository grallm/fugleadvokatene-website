# Simplest store integration

The initial store is a static catalogue plus hosted checkout links. Stripe Payment Links is the suggested provider; the catalogue accepts trusted HTTPS links if the organisation already uses another suitable provider.

1. Activate the organisation's merchant account and configure customer-facing business/support details.
2. Create each real product and price in NOK. For physical goods, set shipping/address collection, allowed countries and shipping rates. Configure taxes according to the organisation's requirements.
3. Create a payment link. Configure the provider's receipt and post-payment redirect; `/takk/` is optional and is not treated as proof of payment.
4. In `/admin/`, choose **Produkter**, add title, image, description, display price and the complete HTTPS checkout URL.
5. Enable availability only after testing the checkout. Clear draft when the product is ready to publish.
6. Use the payment dashboard for successful-payment verification, packing, shipping, refunds and support. Never fulfil based on a screenshot or a visit to the thank-you page.

No API key, payment webhook, card handling or custom checkout is required. No payment-provider call has been made from this environment.

## Limits

There is no shared multi-product cart, stock sync, dynamic shipping calculation on the Astro page, order-management admin or automated fulfilment. A link may offer quantity selection if configured with the provider. Changing a price in the website does not change the provider's price; update both. Payment methods, including any local wallet, depend on the account and provider configuration—this implementation does not claim Vipps checkout support.

Before opening the store, finish `src/content/pages/vilkar.md`, review privacy disclosures, add real products and images, and perform a test-mode order including shipping, receipt and refund. The shipped sample product remains a draft and cannot be purchased.
