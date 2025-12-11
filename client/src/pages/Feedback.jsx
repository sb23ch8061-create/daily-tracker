import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Upload, Send } from 'lucide-react';

const Feedback = () => {
  const [type, setType] = useState('Suggestion');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real app, you would upload the file to S3 here.
    // Since we don't have S3 configured, we will just send the text for now
    // or mock the file upload.
    try {
      await api.post('/feedback', { type, message, imageUrl: file ? file.name : '' });
      alert('Feedback Sent! Thank you.');
      setMessage('');
      setFile(null);
    } catch (err) {
      alert('Error sending feedback');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Send Feedback</h2>
        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px' }}>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Feedback Type</label>
              <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option>Suggestion</option>
                <option>Issue</option>
                <option>Bug Report</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Details</label>
              <textarea 
                className="form-input" 
                rows="5" 
                placeholder="Describe the issue or idea..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Attachment (Optional)</label>
              <div style={{ border: '2px dashed #444', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" id="file" hidden onChange={(e) => setFile(e.target.files[0])} />
                <label htmlFor="file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Upload size={24} color="var(--accent-purple)" />
                  <span style={{ color: '#888' }}>{file ? file.name : "Click to Upload Screenshot"}</span>
                </label>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Send size={18} /> {loading ? 'Sending...' : 'Submit Feedback'}
            </button>
          </form>

        </div>
      </div>
    </Layout>
  );
};

export default Feedback;