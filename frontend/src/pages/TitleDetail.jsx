import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, timeAgo } from "../api";
import { useAuth } from "../AuthContext";
import { CATEGORY_ICONS } from "../genres";

function Comment({ comment, replies, auth, isAdmin, onReply, onLike, onDelete }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const isReply = Boolean(comment.parent);
  const userId = auth?.user.id;
  const liked = userId && comment.likes?.includes(userId);
  const isMine = userId && comment.user === userId;

  async function sendReply(e) {
    e.preventDefault();
    setReplyError("");
    try {
      await onReply(comment._id, replyText);
      setReplyText("");
      setReplying(false);
    } catch (err) {
      setReplyError(err.message);
    }
  }

  return (
    <div className={isReply ? "comment reply" : "comment"}>
      <div className="comment-head">
        <span>
          <strong>@{comment.nickname}</strong>
          <span className="muted small"> · {timeAgo(comment.createdAt)}</span>
        </span>
        {comment.score !== null && <span className="rating">⭐ {comment.score}/10</span>}
      </div>
      <div className="comment-text">{comment.text}</div>

      <div className="comment-actions">
        <button
          className={liked ? "link-btn liked" : "link-btn"}
          disabled={!auth || isMine}
          title={!auth ? "Log in to like" : isMine ? "You can't like your own comment" : ""}
          onClick={() => onLike(comment._id)}
        >
          👍 {comment.likes?.length || 0}
        </button>
        {auth && !isReply && (
          <button className="link-btn" onClick={() => setReplying(!replying)}>
            {replying ? "Cancel" : "Reply"}
          </button>
        )}
        {auth && (isMine || isAdmin) && (
          <button className="link-btn danger" onClick={() => onDelete(comment._id)}>
            Delete
          </button>
        )}
      </div>

      {replying && (
        <form onSubmit={sendReply} className="reply-form">
          {replyError && <p className="error">{replyError}</p>}
          <textarea rows="2" maxLength="500" placeholder={`Reply to @${comment.nickname}`}
            value={replyText} onChange={(e) => setReplyText(e.target.value)} required autoFocus />
          <button className="btn btn-small" type="submit">Post reply</button>
        </form>
      )}

      {replies?.length > 0 && (
        <div className="replies">
          {replies.map((r) => (
            <Comment key={r._id} comment={r} auth={auth} isAdmin={isAdmin}
              onReply={onReply} onLike={onLike} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TitleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const token = auth?.token;
  const isAdmin = auth?.user.role === "admin";
  const [title, setTitle] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await api(`/titles/${id}`, { token });
      setTitle(t);
      setComments(t.locked ? [] : await api(`/comments/${id}`, { token }));
      setLoadError("");
    } catch (e) {
      setLoadError(e.message);
    }
  }, [id, token]);

  useEffect(() => {
    // load() only sets state after the request finishes, so this is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function postComment(e) {
    e.preventDefault();
    setError("");
    try {
      await api(`/comments/${id}`, {
        method: "POST",
        token,
        body: { text, score: score === "" ? undefined : Number(score) },
      });
      setText("");
      setScore("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reply(parentId, replyText) {
    await api(`/comments/${id}`, { method: "POST", token, body: { text: replyText, parentId } });
    load();
  }

  async function like(commentId) {
    setActionError("");
    try {
      await api(`/comments/${commentId}/like`, { method: "POST", token });
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function removeComment(commentId) {
    if (!window.confirm("Delete this comment? Its replies will be deleted too.")) return;
    setActionError("");
    try {
      await api(`/comments/${commentId}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function deleteTitle() {
    try {
      await api(`/titles/${id}`, { method: "DELETE", token });
      navigate("/");
    } catch (err) {
      setActionError(err.message);
      setConfirmDelete(false);
    }
  }

  if (loadError) return <p className="error">{loadError}</p>;
  if (!title) return <p className="muted">Loading...</p>;

  const topLevel = comments.filter((c) => !c.parent);
  const repliesFor = (commentId) =>
    comments.filter((c) => c.parent === commentId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const myRating = auth && comments.find((c) => c.user === auth.user.id && c.score !== null);

  return (
    <>
      <div className="title-layout">
        {title.poster ? (
          <img className={title.locked ? "poster blurred" : "poster"} src={title.poster} alt={title.name} />
        ) : (
          <div className="poster poster-empty">{CATEGORY_ICONS[title.category] || "🎬"}</div>
        )}
        <div className="title-info">
          <h1>
            {title.name}
            {title.isMature && <span className="badge">18+</span>}
          </h1>
          <p className="card-meta">
            {title.category} {title.year ? `• ${title.year}` : ""}
          </p>
          {title.genres?.length > 0 && (
            <div className="genre-tags">
              {title.genres.map((g) => <span className="genre-tag" key={g}>{g}</span>)}
            </div>
          )}
          <div className="big-rating">⭐ {title.rating.toFixed(1)} <span className="out-of">/ 10</span></div>
          <p className="muted small">
            Owner score {title.ownerScore} • {title.voteCount} user rating{title.voteCount === 1 ? "" : "s"}
          </p>

          {isAdmin && (
            <div className="admin-actions">
              <Link to={`/edit/${title._id}`} className="btn-ghost">✏️ Edit review</Link>
              {confirmDelete ? (
                <>
                  <span className="small">Delete this review and all its comments?</span>
                  <button className="btn btn-danger btn-small" onClick={deleteTitle}>Yes, delete</button>
                  <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn-ghost danger" onClick={() => setConfirmDelete(true)}>🗑 Delete review</button>
              )}
            </div>
          )}

          {title.locked ? (
            <div className="locked-box">
              <strong>🔞 This review is for 18+ only.</strong>
              <p className="muted small">
                {auth
                  ? "Your account's date of birth shows you are under 18, so this review and its discussion are hidden."
                  : "Log in with an account aged 18 or above to read this review and join the discussion."}
              </p>
              {!auth && <Link to="/login" className="btn btn-small">Log in</Link>}
            </div>
          ) : (
            <>
              <h3 className="review-heading">Owner's review</h3>
              <div className="review-box">{title.reviewText}</div>
            </>
          )}
        </div>
      </div>

      {actionError && <p className="error">{actionError}</p>}

      {!title.locked && (
        <>
          <h2>Discussion ({comments.length})</h2>

          {auth ? (
            <form onSubmit={postComment} className="comment-form">
              {error && <p className="error">{error}</p>}
              <textarea
                rows="3"
                maxLength="500"
                placeholder="Share your thoughts (keep it respectful)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
              <div className="comment-form-row">
                {myRating ? (
                  <span className="muted small">You rated this {myRating.score}/10</span>
                ) : (
                  <select value={score} onChange={(e) => setScore(e.target.value)}>
                    <option value="">Add a rating (optional)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n} / 10</option>
                    ))}
                  </select>
                )}
                <button className="btn" type="submit">Post comment</button>
              </div>
            </form>
          ) : (
            <p className="muted">
              <Link to="/login" className="accent-link">Log in</Link> or{" "}
              <Link to="/register" className="accent-link">sign up</Link> to join the discussion.
              Guests can read but not comment.
            </p>
          )}

          <div style={{ marginTop: 20 }}>
            {topLevel.length === 0 && <p className="muted">No comments yet. Be the first!</p>}
            {topLevel.map((c) => (
              <Comment key={c._id} comment={c} replies={repliesFor(c._id)} auth={auth} isAdmin={isAdmin}
                onReply={reply} onLike={like} onDelete={removeComment} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
