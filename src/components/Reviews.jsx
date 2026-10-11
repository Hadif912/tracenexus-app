import { useState, useEffect } from 'react';
import { Star, ImagePlus, X, Send, User } from 'lucide-react';

export default function Reviews({ usersDB, currentUser, userRole, supabase, t }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase.from('customer_reviews').select('*').order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => setPhoto(event.target.result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return alert('Please write a review.');
    setIsSubmitting(true);
    
    const newReview = { username: currentUser, rating, comment, photo };
    await supabase.from('customer_reviews').insert([newReview]);
    
    setComment(''); setPhoto(null); setRating(5); setShowForm(false);
    fetchReviews();
    setIsSubmitting(false);
  };

  const getClientName = (username) => {
    const user = usersDB.find(u => u.username === username);
    return user?.client_name || username;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 p-6 rounded-2xl border ${t.border}`}>
        <div>
          <h2 className={`text-2xl font-extrabold ${t.text}`}>Customer Reviews</h2>
          <p className="text-slate-500 font-medium text-sm">See what our clients are saying about our repair services.</p>
        </div>
        {userRole === 'customer' && !showForm && (
          <button onClick={() => setShowForm(true)} className={`${t.btn} ${t.hover} text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm`}>
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`p-6 rounded-2xl border ${t.border} bg-white shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-4`}>
          <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Rate Your Experience</h3>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-slate-600 text-sm">Overall Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                  <Star size={28} fill={star <= rating ? "#fbbf24" : "none"} className={star <= rating ? "text-amber-400" : "text-slate-300"} />
                </button>
              ))}
            </div>
          </div>
          
          <textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            placeholder="Share details of your experience with KRC Electronic..." 
            className={`w-full p-4 rounded-xl border ${t.border} bg-slate-50 focus:ring-2 focus:ring-slate-500/20 outline-none resize-none h-32 text-sm`} 
            required 
          />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className={`flex items-center gap-2 bg-slate-100 border ${t.border} text-slate-700 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors text-sm font-semibold shadow-sm`}>
                <ImagePlus size={16} /> {photo ? 'Change Photo' : 'Attach Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {photo && (
                <div className={`relative border ${t.border} rounded-lg p-1 bg-slate-100`}>
                  <img src={photo} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                  <button type="button" onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12}/></button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button type="button" onClick={() => setShowForm(false)} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors`}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white ${t.btn} ${t.hover} transition-colors flex items-center justify-center gap-2`}>
                <Send size={16} /> {isSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length > 0 ? reviews.map(review => (
          <div key={review.id} className={`p-6 rounded-2xl border ${t.border} bg-white shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold border border-slate-300`}>
                  <User size={18}/>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{getClientName(review.username)}</h4>
                  <div className="flex mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < review.rating ? "#fbbf24" : "none"} className={i < review.rating ? "text-amber-400" : "text-slate-300"} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mt-1">{review.comment}</p>
            {review.photo && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                <img src={review.photo} alt="Review attachment" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white/30 rounded-2xl border border-dashed border-slate-300">
            No reviews yet. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}