"use client";

import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/types/database";
import { User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";

const BookmarkManager = ({ user }: { user: User }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setBookmarks(data);
      }
    };
    fetchBookmarks();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("bookmark-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter((bookmark) => bookmark.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) {
      return;
    }
    setLoading(true);

    await supabase.from("bookmarks").insert({ url, title, user_id: user.id });

    setUrl("");
    setTitle("");
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  return (
    <div className="space-y-6">
      {/* Add Bookmark Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Add Bookmark</h2>
        <div className="space-y-4">
          <input
            type="url"
            placeholder="URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
          >
            {loading ? "Adding..." : "Add Bookmark"}
          </button>
        </div>
      </form>

      {/* Bookmarks List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">
          My Bookmarks ({bookmarks.length})
        </h2>
        {bookmarks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No bookmarks yet. Add your first one above!
          </p>
        ) : (
          <ul className="space-y-3">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium block truncate"
                  >
                    {bookmark.title}
                  </a>
                  <p className="text-sm text-gray-500 truncate">
                    {bookmark.url}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BookmarkManager;
