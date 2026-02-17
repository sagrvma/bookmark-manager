import AuthButton from "@/components/AuthButton";
import BookmarkManager from "@/components/BookmarkManager";
import { createClient } from "@/lib/supabase/server";

const Home = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Smart Bookmarks</h1>
          <AuthButton />
        </header>

        {user ? (
          <BookmarkManager user={user} />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">
              Sign in to manage your bookmarks
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
