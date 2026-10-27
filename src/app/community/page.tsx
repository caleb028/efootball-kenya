"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Flame,
  Heart,
  ThumbsUp,
  Trophy,
  Send,
  Image as ImageIcon,
  Plus,
  Users,
  Sparkles,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Hash,
} from "lucide-react";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"FEED" | "CHAT">("FEED");

  // Feed State
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTag, setSelectedTag] = useState("HIGHLIGHT");
  const [postMediaUrl, setPostMediaUrl] = useState<string | null>(null);
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Chat Groups State
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMediaUrl, setChatMediaUrl] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("GENERAL");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Feed
  async function fetchFeed() {
    try {
      const res = await fetch("/api/community");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      }
    } catch (err) {
      console.error("fetchFeed error:", err);
    }
  }

  // Fetch Groups
  async function fetchGroups() {
    try {
      const res = await fetch("/api/community?type=groups");
      if (res.ok) {
        const data = await res.json();
        const groupList = Array.isArray(data.groups) ? data.groups : [];
        setGroups(groupList);
        if (groupList.length > 0 && !activeGroupId) {
          setActiveGroupId(groupList[0].id);
        }
      }
    } catch (err) {
      console.error("fetchGroups error:", err);
    }
  }

  // Fetch Group Messages
  async function fetchMessages(groupId: string) {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/community?type=messages&groupId=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err) {
      console.error("fetchMessages error:", err);
    }
  }

  useEffect(() => {
    fetchFeed();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (activeGroupId && activeTab === "CHAT") {
      fetchMessages(activeGroupId);
      const timer = setInterval(() => {
        fetchMessages(activeGroupId);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [activeGroupId, activeTab]);

  useEffect(() => {
    if (activeTab === "CHAT") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Handle Photo / Media Upload for Post
  function handlePostMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPostMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle Photo / Media Upload for Chat
  function handleChatMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setChatMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  // Publish Feed Post
  async function handlePublishPost(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "POST",
          eventType: selectedTag,
          title,
          body,
          mediaUrl: postMediaUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle("");
        setBody("");
        setPostMediaUrl(null);
        setFeedback({ type: "ok", text: "Community post published successfully!" });
        await fetchFeed();
      } else {
        setFeedback({ type: "err", text: data.error || "Please log in to publish." });
      }
    } catch {
      setFeedback({ type: "err", text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  // React to Post with Emoji (Like, Heart, Fire, Trophy)
  async function handleReact(eventId: string, emoji = "LIKE") {
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REACT", eventId, emoji }),
      });
      if (res.ok) {
        await fetchFeed();
      }
    } catch (err) {
      console.error("handleReact error:", err);
    }
  }

  // Submit Comment
  async function handleComment(eventId: string) {
    const content = commentTextMap[eventId];
    if (!content?.trim()) return;
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMMENT", eventId, content }),
      });
      if (res.ok) {
        setCommentTextMap((m) => ({ ...m, [eventId]: "" }));
        await fetchFeed();
      }
    } catch (err) {
      console.error("handleComment error:", err);
    }
  }

  // Create Chat Group
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_GROUP",
          name: newGroupName,
          description: newGroupDesc,
          category: newGroupCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateGroupOpen(false);
        setNewGroupName("");
        setNewGroupDesc("");
        await fetchGroups();
        if (data.id) setActiveGroupId(data.id);
      } else {
        alert(data.error || "Failed to create group.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setChatLoading(false);
    }
  }

  // Send Chat Message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() && !chatMediaUrl) return;
    if (!activeGroupId) return;

    const messageText = chatInput;
    const media = chatMediaUrl;
    setChatInput("");
    setChatMediaUrl(null);

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_MESSAGE",
          groupId: activeGroupId,
          message: messageText,
          mediaUrl: media || undefined,
        }),
      });
      if (res.ok) {
        await fetchMessages(activeGroupId);
      }
    } catch (err) {
      console.error("handleSendMessage error:", err);
    }
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Community Header & Dual-Mode Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-royal/40 pb-5">
        <div>
          <span className="esports-badge-yellow mb-1.5">Kenyan Esports Lounge</span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl uppercase text-white">
            eFootball Arena Community
          </h1>
          <p className="text-sm text-brand-grey mt-1">
            Share match highlights, tactics, squad builds, get likes & comments, and chat live in player groups.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-brand-darkBlue border border-brand-royal/60 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("FEED")}
            className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "FEED"
                ? "bg-brand-yellow text-brand-navy shadow-esports-yellow"
                : "text-brand-grey hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Social Feed & Blog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CHAT")}
            className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "CHAT"
                ? "bg-brand-yellow text-brand-navy shadow-esports-yellow"
                : "text-brand-grey hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Chat Groups & Rooms ({groups.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-brand-success/20 border-brand-success text-white"
              : "bg-brand-error/20 border-brand-error text-white"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 text-brand-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-brand-error shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: SOCIAL FEED & BLOG (Facebook / Instagram Style)                  */}
      {/* ========================================================================= */}
      {activeTab === "FEED" && (
        <div className="space-y-6">
          {/* Post Creator Card */}
          <form onSubmit={handlePublishPost} className="esports-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-lg uppercase text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-yellow" />
                Create Community Post
              </span>
              <div className="flex items-center gap-1.5">
                {["HIGHLIGHT", "TACTICS", "BANTER", "RECRUITMENT"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase transition-colors ${
                      selectedTag === tag
                        ? "bg-brand-yellow text-brand-navy"
                        : "bg-brand-navy text-brand-grey hover:text-white"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post headline (e.g. 90th-minute knuckleball winner in the Nairobi Cup!)"
              className="esports-input text-sm font-semibold"
            />

            <textarea
              rows={3}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind? Share formation tips, manager tactics, or shout out your sparring partner..."
              className="esports-input text-xs leading-relaxed"
            />

            {/* Attached Media Thumbnail Preview */}
            {postMediaUrl && (
              <div className="relative inline-block rounded-xl overflow-hidden border-2 border-brand-yellow/80 max-h-56 bg-brand-midnight">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={postMediaUrl}
                  alt="Post preview"
                  className="max-h-56 w-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPostMediaUrl(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-brand-navy/90 text-white hover:bg-brand-error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-royal/40">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-brand-yellow hover:underline">
                  <ImageIcon className="w-4 h-4" />
                  Attach Match Photo / Clip
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePostMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button type="submit" disabled={loading} className="btn-yellow text-xs py-2 px-5">
                <Send className="w-3.5 h-3.5" />
                {loading ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </form>

          {/* Activity Feed Cards */}
          {events.length === 0 ? (
            <div className="esports-card p-12 text-center space-y-3">
              <Sparkles className="w-12 h-12 text-brand-yellow mx-auto" />
              <div className="font-display font-bold text-2xl uppercase text-white">
                Community Feed Is Ready
              </div>
              <p className="text-xs text-brand-grey max-w-sm mx-auto">
                Be the first to share a match highlight, squad tactical build, or goal screenshot!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {events.map((ev) => {
                const comments = Array.isArray(ev.comments) ? ev.comments : [];
                const counts = ev.reactionCounts || {};

                return (
                  <div key={ev.id} className="esports-card p-6 space-y-4">
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-royal border border-brand-yellow flex items-center justify-center font-display font-bold text-brand-yellow text-sm">
                          {(ev.actorUsername || "P").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {ev.actorUsername}
                            </span>
                            <span className="esports-badge-blue text-[10px]">
                              {(ev.eventType || "POST").replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="text-[11px] text-brand-grey flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brand-yellow" />
                            {ev.actorCounty} • {new Date(ev.createdAt).toLocaleString("en-KE")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div>
                      <h2 className="font-display font-bold text-2xl text-white leading-snug">
                        {ev.title}
                      </h2>
                      <p className="text-sm text-white/90 mt-1.5 whitespace-pre-line leading-relaxed">
                        {ev.body}
                      </p>
                    </div>

                    {/* Attached Photo / Screenshot / Media */}
                    {ev.mediaUrl && (
                      <div className="rounded-xl overflow-hidden border border-brand-royal/60 bg-brand-midnight max-h-96 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ev.mediaUrl}
                          alt={ev.title}
                          className="max-h-96 w-auto object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {ev.linkUrl && (
                      <Link
                        href={ev.linkUrl}
                        className="inline-block text-xs font-bold text-brand-yellow hover:underline"
                      >
                        Open Competition Details →
                      </Link>
                    )}

                    {/* Social Reactions Bar (Like, Love, Fire, Trophy) */}
                    <div className="pt-3 border-t border-brand-royal/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReact(ev.id, "LIKE")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            ev.userReaction === "LIKE"
                              ? "bg-brand-yellow text-brand-navy border-brand-yellow"
                              : "bg-brand-navy text-white border-brand-royal/50 hover:border-brand-yellow"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{counts.LIKE || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReact(ev.id, "LOVE")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            ev.userReaction === "LOVE"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-brand-navy text-white border-brand-royal/50 hover:border-red-400"
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{counts.LOVE || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReact(ev.id, "FIRE")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            ev.userReaction === "FIRE"
                              ? "bg-amber-500 text-brand-navy border-amber-500"
                              : "bg-brand-navy text-white border-brand-royal/50 hover:border-amber-400"
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>{counts.FIRE || 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReact(ev.id, "TROPHY")}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            ev.userReaction === "TROPHY"
                              ? "bg-brand-gold text-brand-navy border-brand-gold font-extrabold"
                              : "bg-brand-navy text-white border-brand-royal/50 hover:border-brand-gold"
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{counts.TROPHY || 0}</span>
                        </button>
                      </div>

                      <div className="text-brand-grey flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-brand-yellow" />
                        <span>{comments.length} Comments</span>
                      </div>
                    </div>

                    {/* Comments List */}
                    {comments.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-brand-royal/20">
                        {comments.map((c: any) => (
                          <div
                            key={c.id || Math.random()}
                            className="bg-brand-navy/60 p-2.5 rounded-xl border border-brand-royal/30 text-xs flex items-start gap-2.5"
                          >
                            <div className="w-6 h-6 rounded-md bg-brand-royal flex items-center justify-center font-bold text-brand-yellow text-[10px] shrink-0">
                              {(c.authorUsername || "P").slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-[11px]">
                                {c.authorUsername || "Player"}
                              </div>
                              <div className="text-white/90 text-xs mt-0.5">{c.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentTextMap[ev.id] || ""}
                        onChange={(e) =>
                          setCommentTextMap((m) => ({ ...m, [ev.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleComment(ev.id);
                          }
                        }}
                        placeholder="Write a comment (Press Enter to post)..."
                        className="esports-input text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={() => handleComment(ev.id)}
                        className="btn-royal text-xs py-2 px-3.5 shrink-0"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CHAT GROUPS & REAL-TIME ROOMS                                    */}
      {/* ========================================================================= */}
      {activeTab === "CHAT" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Group Directory Sidebar */}
          <div className="lg:col-span-4 esports-card p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-royal/40">
              <div>
                <h2 className="font-display font-bold text-lg uppercase text-white">
                  Chat Groups
                </h2>
                <div className="text-[11px] text-brand-grey">
                  {groups.length} Active Competitive Rooms
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateGroupOpen((v) => !v)}
                className="btn-yellow text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Group
              </button>
            </div>

            {/* Create Group Form Drawer */}
            {createGroupOpen && (
              <form
                onSubmit={handleCreateGroup}
                className="p-3.5 rounded-xl bg-brand-navy border border-brand-yellow/60 space-y-3 text-xs"
              >
                <div className="font-display font-bold uppercase text-brand-yellow">
                  Create Player Chat Group
                </div>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group Name (e.g. Coast eFootballers)"
                  className="esports-input text-xs py-1.5"
                />
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="esports-input text-xs py-1.5"
                >
                  <option value="GENERAL">General Banter & Community</option>
                  <option value="TACTICS">Tactics & Squad Building</option>
                  <option value="MATCHMAKING">Sparring & Friendlies</option>
                  <option value="COUNTY">County Pride</option>
                </select>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Short group purpose / guidelines..."
                  className="esports-input text-xs py-1.5"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="btn-yellow w-full text-xs py-2"
                >
                  {chatLoading ? "Creating..." : "Establish Chat Group"}
                </button>
              </form>
            )}

            {/* Groups List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGroupId(g.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all block ${
                    activeGroupId === g.id
                      ? "bg-brand-royal/30 border-brand-yellow shadow-sm"
                      : "bg-brand-navy/60 border-brand-royal/40 hover:border-brand-royal"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-display font-bold uppercase text-white truncate max-w-[180px]">
                      {g.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-darkBlue text-brand-yellow font-mono">
                      {g.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-grey line-clamp-1 mt-1">
                    {g.lastMessage || g.description}
                  </p>
                  <div className="text-[10px] text-white/70 mt-1.5 flex items-center justify-between">
                    <span>{g.memberCount} Members</span>
                    <span className="text-brand-grey">
                      {new Date(g.lastMessageAt).toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Chat Conversation Room */}
          <div className="lg:col-span-8 esports-card flex flex-col h-[650px] overflow-hidden">
            {/* Room Header */}
            <div className="p-4 bg-brand-navy border-b border-brand-royal/50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-bold text-xl uppercase text-white flex items-center gap-2">
                  <Hash className="w-5 h-5 text-brand-yellow" />
                  {activeGroup?.name || "Select a Chat Group"}
                </h3>
                <div className="text-xs text-brand-grey line-clamp-1">
                  {activeGroup?.description || "Connect with Kenyan eFootball competitors."}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="esports-badge-yellow">{activeGroup?.category || "Lounge"}</span>
                <div className="text-[11px] text-brand-grey mt-0.5">
                  {activeGroup?.memberCount || 1} Members
                </div>
              </div>
            </div>

            {/* Message Feed Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-brand-midnight/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MessageSquare className="w-10 h-10 text-brand-yellow mx-auto" />
                  <div className="font-display font-bold text-lg text-white uppercase">
                    Welcome to {activeGroup?.name || "the Room"}
                  </div>
                  <p className="text-xs text-brand-grey max-w-xs">
                    Start the banter, share your eFootball ID, or find a sparring partner!
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-royal border border-brand-yellow flex items-center justify-center font-bold text-xs text-brand-yellow shrink-0">
                      {(m.senderUsername || "P").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="max-w-[85%] space-y-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-white">{m.senderUsername}</span>
                        <span className="text-brand-grey text-[10px]">
                          {m.county} •{" "}
                          {new Date(m.createdAt).toLocaleTimeString("en-KE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-brand-darkBlue border border-brand-royal/50 text-xs text-white/95 whitespace-pre-line leading-relaxed shadow-sm">
                        {m.message}
                        {m.mediaUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-brand-royal/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.mediaUrl}
                              alt="Chat attachment"
                              className="max-h-48 w-auto object-contain rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Send Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-brand-navy border-t border-brand-royal/50 space-y-2 shrink-0"
            >
              {chatMediaUrl && (
                <div className="relative inline-block border border-brand-yellow rounded-lg overflow-hidden max-h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chatMediaUrl} alt="Upload preview" className="max-h-24 w-auto" />
                  <button
                    type="button"
                    onClick={() => setChatMediaUrl(null)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-brand-navy text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="cursor-pointer p-2 rounded-lg bg-brand-darkBlue text-brand-yellow hover:text-white border border-brand-royal/50">
                  <ImageIcon className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleChatMediaUpload}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Message #${activeGroup?.name || "chat"}... (Press Enter)`}
                  className="esports-input text-xs py-2 flex-1"
                />

                <button type="submit" className="btn-yellow text-xs py-2 px-4 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
