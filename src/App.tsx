import { Button } from "./components/ui/Button";

function App() {
  return (
    <main className="min-h-screen bg-background p-8">
      <section className="mx-auto max-w-5xl rounded-card border border-border bg-surface p-8 shadow-soft">
        <p className="text-sm text-text-secondary">Instagram planner</p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Plan your content with clarity.
        </h1>

        <p className="mt-4 max-w-xl text-text-secondary">
          Create drafts, schedule posts, and organize your Instagram feed.
        </p>

        <div className="mt-6">
          <Button>Create new post</Button>
        </div>
      </section>
    </main>
  );
}

export default App;