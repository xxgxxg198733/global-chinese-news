'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review { id: number; user: string; software: string; rating: number; date: string; text: string; helpful: number; not_helpful: number; }

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('latest');
  const [total, setTotal] = useState(0);

  // New comment form
  const [newUser, setNewUser] = useState('');
  const [newSoft, setNewSoft] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const fetchReviews = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/reviews?page=${p}&per_page=20&sort=${s}`);
      const d = await r.json();
      setReviews(d.reviews);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReviews(page, sort); }, [page, sort, fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.trim() || !newText.trim() || newText.trim().length < 10) {
      setSubmitMsg('Please enter your name and a review of at least 10 characters.');
      return;
    }
    try {
      const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: newUser.trim(), software: newSoft.trim() || 'Unknown', rating: newRating, text: newText.trim() }) });
      const d = await r.json();
      if (d.ok) {
        setSubmitted(true);
        setSubmitMsg('Review submitted! It appears at the top of the list.');
        setNewUser(''); setNewSoft(''); setNewRating(5); setNewText('');
        setTimeout(() => { setSubmitted(false); setSubmitMsg(''); fetchReviews(1, sort); setPage(1); }, 2000);
      } else {
        setSubmitMsg(d.error || 'Failed to submit review.');
      }
    } catch (e) { setSubmitMsg('Submission failed. Please try again.'); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Reviews</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString()} reviews from real users</p>
        </div>
        <div className="flex gap-2">
          {[{k:'latest',l:'Latest'},{k:'helpful',l:'Most Helpful'},{k:'rating_high',l:'Highest Rated'}].map(s => (
            <button key={s.k} onClick={()=>{setSort(s.k);setPage(1);}}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${sort===s.k?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s.l}</button>
          ))}
        </div>
      </div>

      {/* Write a Review */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Write a Review <span className="text-xs text-gray-400 font-normal">(no registration required)</span></h2>
        {submitMsg && <div className={`text-sm mb-3 ${submitted?'text-green-600':'text-red-500'}`}>{submitMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input value={newUser} onChange={e=>setNewUser(e.target.value)} placeholder="Your name" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <input value={newSoft} onChange={e=>setNewSoft(e.target.value)} placeholder="Software name (optional)" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={newRating} onChange={e=>setNewRating(Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {[5,4,3,2,1].map(n=><option key={n} value={n}>★{n}</option>)}
            </select>
          </div>
          <textarea value={newText} onChange={e=>setNewText(e.target.value)} placeholder="Share your experience... (at least 10 characters)" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Submit Review</button>
        </form>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400"><RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2" />Loading reviews...</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><User className="h-4 w-4" /></div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{r.user}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s<=r.rating?'text-amber-400 fill-amber-400':'text-gray-200'}`} />)}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {r.helpful}</span>
                <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> {r.not_helpful}</span>
                {r.software !== 'Unknown' && <Link href={`/software/${r.software?.toLowerCase().replace(/\s+/g,'-')}`} className="text-blue-500 hover:underline">{r.software}</Link>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="p-2 rounded-lg border disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-2 rounded-lg border disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
