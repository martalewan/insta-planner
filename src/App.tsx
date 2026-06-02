function App() {
  return (
    <main className="min-h-screen bg-background p-8 text-text-primary">
      <section className="mx-auto max-w-5xl rounded-card border border-border bg-surface p-8 shadow-soft">
        <p className="text-sm text-text-secondary">Instagram planner</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Plan your content with clarity.
        </h1>
        <p className="mt-4 max-w-xl text-text-secondary">
          Create drafts, schedule posts, and organize your Instagram feed in one
          calm workspace.
        </p>

        <button className="mt-6 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-hover">
          Create new post
        </button>
      </section>
    </main>
  );
}

export default App;