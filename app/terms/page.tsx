export default function TermsPage() {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: December 08, 2025</p>
        </div>
  
        <div className="prose dark:prose-invert max-w-none space-y-8 text-justify leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to <strong>Foodie</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;). These Terms and Conditions (&ldquo;Terms&rdquo;, &ldquo;Terms and Conditions&rdquo;) govern your use of our website and mobile application (collectively, the &ldquo;Service&rdquo;) operated by Foodie. By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Service:</strong> Refers to the Foodie website and mobile application.</li>
              <li><strong>User:</strong> The individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
              <li><strong>Restaurant Partner:</strong> Third-party restaurants that list their menu items on the Service.</li>
              <li><strong>Delivery Partner:</strong> Independent contractors who pick up and deliver orders.</li>
              <li><strong>Content:</strong> Text, images, or other information that can be posted, uploaded, linked to, or otherwise made available by You, regardless of the form of that content.</li>
            </ul>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground">
              To use certain features of the Service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Orders and Deliveries</h2>
            <div className="space-y-4 text-muted-foreground">
              <p><strong>4.1 Order Placement:</strong> When you place an order through the Service, you are entering into a contract with the Restaurant Partner. We act as an intermediary to facilitate this transaction.</p>
              <p><strong>4.2 Order Acceptance:</strong> Your order is subject to acceptance by the Restaurant Partner. We will notify you if your order has been accepted.</p>
              <p><strong>4.3 Delivery:</strong> Estimated delivery times are provided by the Service for convenience only and are not guaranteed. Factors such as traffic, weather, and restaurant preparation times may affect actual delivery times.</p>
              <p><strong>4.4 Cancellations:</strong> You may cancel an order only within a limited time frame after placement, as determined by the order status (e.g., before the restaurant begins preparation). Cancellation fees may apply.</p>
            </div>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Payments and Refunds</h2>
            <p className="text-muted-foreground">
              All prices listed on the Service are determined by the Restaurant Partners. We reserve the right to charge a delivery fee, service fee, and other applicable charges. Payments must be made via the payment methods available on the Service. Refunds will be processed in accordance with our Refund Policy and are subject to verification of the issue (e.g., missing items, wrong order).
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">6. User Conduct</h2>
            <p className="text-muted-foreground">
              You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You are prohibited from:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Using the Service for fraudulent purposes.</li>
              <li>Harassing, abusing, or harming another person, including Restaurant Partners and Delivery Partners.</li>
              <li>Attempting to gain unauthorized access to our systems or user accounts.</li>
            </ul>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content (excluding Content provided by users and restaurants), features, and functionality are and will remain the exclusive property of Foodie and its licensors. The Service is protected by copyright, trademark, and other laws of India and foreign countries.
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              In no event shall Foodie, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, We will make reasonable efforts to provide at least 30 days&rsquo; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none mt-2 space-y-1 text-muted-foreground">
              <li>By email: <strong>legal@foodie.com</strong></li>
              <li>By phone: +91 1234567890</li>
              <li>By mail: 123 Food Street, Bangalore, India</li>
            </ul>
          </section>
        </div>
      </div>
    );
  }