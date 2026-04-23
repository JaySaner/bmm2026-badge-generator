import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Share2, 
  Upload, 
  User, 
  MapPin, 
  Briefcase, 
  Ticket, 
  CheckCircle2, 
  Trash2, 
  LayoutDashboard,
  ArrowLeft,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

const App = () => {
  const [step, setStep] = useState('form'); // 'form', 'preview', 'admin'
  const [formData, setFormData] = useState({
    name: '',
    photo: null,
    city: '',
    role: 'Attendee',
    ticketType: 'Attendee'
  });
  const [registrations, setRegistrations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const posterRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bmm_registrations');
    if (saved) setRegistrations(JSON.parse(saved));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!formData.name || !formData.photo) {
      alert('Please enter your name and upload a photo!');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const newReg = {
        ...formData,
        id: `BMM26-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString()
      };
      
      const updated = [newReg, ...registrations];
      setRegistrations(updated);
      localStorage.setItem('bmm_registrations', JSON.stringify(updated));
      
      setIsGenerating(false);
      setStep('preview');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#008080', '#FF9933']
      });
    }, 2000);
  };

  const downloadImage = async (ref, fileName) => {
    const element = ref.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadPDF = async () => {
    const element = badgeRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 85, 135);
    pdf.save('BMM2026_Badge.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  const shareOnWhatsApp = () => {
    const text = `I am attending BMM2026 Seattle! See you there! 📅 6-9 August 2026 📍 Seattle Convention Center`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const deleteRegistration = (id) => {
    const updated = registrations.filter(r => r.id !== id);
    setRegistrations(updated);
    localStorage.setItem('bmm_registrations', JSON.stringify(updated));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ width: '100%', textAlign: 'center', marginBottom: '40px' }}>
        <img src="/logo.png" alt="BMM 2026 Logo" style={{ height: '80px', marginBottom: '10px' }} />
        <h1 style={{ color: 'var(--gold)', fontSize: '2.5rem' }}>BMM2026 Seattle</h1>
        <p style={{ color: 'var(--white)', opacity: 0.8 }}>Event Poster & Entry Badge Generator</p>
      </header>

      <nav style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
        <button 
          className={`btn ${step === 'form' || step === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStep('form')}
        >
          Generator
        </button>
        <button 
          className={`btn ${step === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStep('admin')}
        >
          <LayoutDashboard size={20} /> Admin Panel
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card"
          >
            <h2 style={{ marginBottom: '25px', color: 'var(--gold-light)' }}>Create Your Badge</h2>
            
            <div className="form-group">
              <label><User size={18} /> Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label><Upload size={18} /> Upload Photo</label>
              <div 
                style={{ 
                  border: '2px dashed var(--glass-border)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)'
                }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ opacity: 0.6 }}>
                    <Upload size={32} style={{ marginBottom: '10px' }} />
                    <p>Click to upload your professional photo</p>
                  </div>
                )}
                <input 
                  id="photo-upload" 
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label><MapPin size={18} /> City</label>
                <input 
                  type="text" 
                  placeholder="e.g. Seattle"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><Briefcase size={18} /> Role / Designation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Delegate"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label><Ticket size={18} /> Ticket Type</label>
              <select 
                value={formData.ticketType}
                onChange={(e) => setFormData({...formData, ticketType: e.target.value})}
              >
                <option value="I am attending">I am attending</option>
                <option value="Attendee">Attendee</option>
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="spinner"></div> Creating your badge...
                </div>
              ) : (
                'Generate My Badge'
              )}
            </button>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div 
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="previews-layout"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}
          >
            <div style={{ display: 'flex', gap: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setStep('form')}>
                <ArrowLeft size={18} /> Edit Details
              </button>
              <button className="btn btn-primary" onClick={shareOnWhatsApp}>
                <Share2 size={18} /> Share on WhatsApp
              </button>
            </div>

            <div className="previews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', width: '100%' }}>
              
              {/* Poster Section */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '15px' }}>Event Poster</h3>
                <div ref={posterRef} className="poster-container">
                  <div className="poster-bg-pattern"></div>
                  <img src="/poster-bg.png" alt="BG" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.6 }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '4px' }}>BMM2026 SEATTLE</h2>
                    <h1 className="poster-title">I AM ATTENDING</h1>
                    
                    <div style={{ 
                      width: '200px', 
                      height: '200px', 
                      borderRadius: '50%', 
                      border: '6px solid var(--gold)', 
                      margin: '30px 0',
                      overflow: 'hidden',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}>
                      <img src={formData.photo} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <h2 className="text-glow" style={{ fontSize: '2.5rem', marginBottom: '5px' }}>{formData.name}</h2>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{formData.role} {formData.city ? `from ${formData.city}` : ''}</p>

                    <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '20px' }}>
                      <p style={{ fontFamily: 'Tiro Marathi', fontSize: '1.2rem', color: 'var(--gold-light)' }}>जपूया संस्कृती, विणूया नाती</p>
                      <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>6–9 August 2026 | Seattle Convention Center</p>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <button className="btn btn-secondary" onClick={() => downloadImage(posterRef, 'BMM2026_Poster')}>
                    <Download size={18} /> Download Poster (PNG)
                  </button>
                </div>
              </div>

              {/* Badge Section */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '15px' }}>Entry Badge</h3>
                <div ref={badgeRef} className="badge-container">
                  <div className="badge-header">
                    <img src="/logo.png" alt="Logo" style={{ height: '50px' }} />
                    <div style={{ marginLeft: '15px', color: 'white', textAlign: 'left' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>BMM 2026</p>
                      <p style={{ fontSize: '0.6rem' }}>Seattle Convention Center</p>
                    </div>
                  </div>
                  
                  <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '140px', height: '140px', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px', border: '3px solid var(--teal)' }}>
                      <img src={formData.photo} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--teal-dark)', textAlign: 'center' }}>{formData.name}</h2>
                    <p style={{ fontSize: '1rem', color: '#666', fontWeight: 600 }}>{formData.role}</p>
                    
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '10px 20px', 
                      background: formData.ticketType === 'I am attending' ? 'var(--gold)' : 'var(--teal)', 
                      borderRadius: '30px',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}>
                      {formData.ticketType.toUpperCase()}
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.6rem', color: '#999' }}>UNIQUE ID</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>BMM26-{Math.floor(1000 + Math.random() * 9000)}</p>
                        <p style={{ fontSize: '0.6rem', color: '#999', marginTop: '10px' }}>DATES</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Aug 6-9, 2026</p>
                      </div>
                      <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '10px' }}>
                        <QRCodeSVG value={`BMM2026:${formData.name}:${formData.ticketType}`} size={80} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '10px', background: 'var(--gradient)' }}></div>
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => downloadImage(badgeRef, 'BMM2026_Badge')}>
                    <Download size={18} /> PNG
                  </button>
                  <button className="btn btn-secondary" onClick={downloadPDF}>
                    <Download size={18} /> PDF
                  </button>
                  <button className="btn btn-secondary" onClick={handlePrint}>
                    <Printer size={18} /> Print
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {step === 'admin' && (
          <motion.div 
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card"
            style={{ maxWidth: '1000px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: 'var(--gold-light)' }}>Registration Database</h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const csv = [
                    ['ID', 'Name', 'City', 'Role', 'Ticket', 'Date'],
                    ...registrations.map(r => [r.id, r.name, r.city, r.role, r.ticketType, r.date])
                  ].map(e => e.join(",")).join("\n");
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'BMM2026_Registrations.csv';
                  a.click();
                }}
              >
                Download CSV
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                    <th style={{ padding: '15px' }}>ID</th>
                    <th style={{ padding: '15px' }}>Photo</th>
                    <th style={{ padding: '15px' }}>Name</th>
                    <th style={{ padding: '15px' }}>Details</th>
                    <th style={{ padding: '15px' }}>Ticket</th>
                    <th style={{ padding: '15px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No registrations found yet.</td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px', fontSize: '0.8rem' }}>{reg.id}</td>
                        <td style={{ padding: '15px' }}>
                          <img src={reg.photo} alt={reg.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        </td>
                        <td style={{ padding: '15px', fontWeight: 700 }}>{reg.name}</td>
                        <td style={{ padding: '15px', fontSize: '0.9rem' }}>
                          <div>{reg.role}</div>
                          <div style={{ opacity: 0.6 }}>{reg.city}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            background: reg.ticketType === 'I am attending' ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {reg.ticketType}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}
                              onClick={() => {
                                setFormData(reg);
                                setStep('preview');
                              }}
                            >
                              View
                            </button>
                            <button 
                              style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}
                              onClick={() => deleteRegistration(reg.id)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media print {
          .btn, header, nav, .glass-card { display: none !important; }
          .app-container { background: white !important; padding: 0 !important; }
          .badge-container { box-shadow: none !important; border: 1px solid #eee; }
        }
      `}</style>
    </div>
  );
};

export default App;
