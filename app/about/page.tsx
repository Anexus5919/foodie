export default function AboutPage() {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">About Us</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4">
          <p className="text-lg text-muted-foreground">
            Welcome to Foodie, your number one source for all things food. We&rsquo;re dedicated to providing you the very best of local cuisines, with an emphasis on speed, hygiene, and reliability.
          </p>
          <p>
            Founded in 2024, Foodie has come a long way from its beginnings in Bangalore. When we first started out, our passion for &ldquo;Food for Everyone&rdquo; drove us to start our own business.
          </p>
          <p>
            We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments, please don&rsquo;t hesitate to contact us.
          </p>
        </div>
      </div>
    );
  }