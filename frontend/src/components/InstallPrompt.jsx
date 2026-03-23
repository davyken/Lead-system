import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#0a0f1e',
      border: '1px solid #00e5c3',
      borderRadius: '12px',
      padding: '16px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0, 229, 195, 0.3)',
      maxWidth: '300px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <img 
          src="/genie.jpeg" 
          alt="Genie" 
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            objectFit: 'cover'
          }}
        />
        <div>
          <h3 style={{
            margin: 0,
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'Syne, sans-serif'
          }}>
            Installer l'application
          </h3>
          <p style={{
            margin: '4px 0 0',
            color: '#888',
            fontSize: '12px'
          }}>
            Ajouter à votre écran d'accueil
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            background: '#00e5c3',
            color: '#0a0f1e',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'Syne, sans-serif'
          }}
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            color: '#888',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}