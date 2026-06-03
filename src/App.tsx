import { InstagramAccountPanel } from "./components/InstagramAccountPanel";
import { InstagramLibrary } from "./components/InstagramLibrary";
import { PlannerSection } from "./components/PlannerSection";
import { PageContainer } from "./components/ui/PageContainer";
import { useInstagramMedia } from "./hooks/useInstagramMedia";
import { usePlannedPosts } from "./hooks/usePlannedPosts";

function App() {
  const {
    account,
    connectAccount,
    connectWithToken,
    disconnectAccount,
    error,
    isLive,
    isLoading,
    isOAuthConfigured,
    isSavingAccount,
    posts,
    reloadMedia,
    username,
  } = useInstagramMedia();
  const {
    addPlannedPost,
    deletePlannedPost,
    plannedPosts,
    storageError,
  } = usePlannedPosts();
  const isConnected = Boolean(account);

  return (
    <main className="min-h-screen bg-background">
      <PageContainer>
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">Instagram planner</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-text-primary">
                {isConnected ? "Real Instagram" : "Existing Instagram"}
              </h1>
            </div>

            <button
              type="button"
              className="w-fit rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              onClick={() => void reloadMedia()}
            >
              Refresh
            </button>
          </header>

          <InstagramAccountPanel
            account={account}
            error={error}
            isLive={isLive}
            isOAuthConfigured={isOAuthConfigured}
            isSaving={isSavingAccount}
            onConnect={connectAccount}
            onConnectWithToken={connectWithToken}
            onDisconnect={disconnectAccount}
          />

          <PlannerSection
            onAddPost={addPlannedPost}
            onDeletePost={deletePlannedPost}
            plannedPosts={plannedPosts}
            storageError={storageError}
          />

          <InstagramLibrary
            accountType={account?.account_type}
            error={isOAuthConfigured ? error : null}
            isConnected={isConnected}
            isLoading={isLoading}
            mediaCount={account?.media_count}
            plannedPosts={plannedPosts}
            posts={posts}
            profileImageUrl={account?.profilePictureUrl}
            username={username}
          />
        </div>
      </PageContainer>
    </main>
  );
}
export default App;
