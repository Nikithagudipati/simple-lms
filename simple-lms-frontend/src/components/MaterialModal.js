import React from 'react';

function MaterialModal({ material, onClose }) {
  if (!material) return null;

  // Support both .content and .url fields from backend
  let contentUrl = material.content || material.url || '';
  
  // If URL starts with /uploads, prepend the backend API URL
  if (contentUrl.startsWith('/uploads')) {
    contentUrl = `http://localhost:5000${contentUrl}`;
  }
  
  // Convert YouTube URLs to embed format
  if (contentUrl.includes('youtu.be/') || contentUrl.includes('youtube.com/watch')) {
    let videoId = '';
    if (contentUrl.includes('youtu.be/')) {
      // Extract from youtu.be/VIDEO_ID format
      videoId = contentUrl.split('youtu.be/')[1].split('?')[0].split('&')[0];
    } else if (contentUrl.includes('youtube.com/watch')) {
      // Extract from youtube.com/watch?v=VIDEO_ID format
      const urlParams = new URLSearchParams(contentUrl.split('?')[1]);
      videoId = urlParams.get('v');
    }
    if (videoId) {
      contentUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  console.log('Material:', material);
  console.log('Content URL:', contentUrl);
  console.log('Material Type:', material.type);
  
  const isPdf = contentUrl && contentUrl.toLowerCase().includes('.pdf');
  const isVideo = material.type === 'video' || 
                  (contentUrl && (
                    contentUrl.toLowerCase().includes('.mp4') || 
                    contentUrl.toLowerCase().includes('.avi') || 
                    contentUrl.toLowerCase().includes('.mov') || 
                    contentUrl.toLowerCase().includes('.mkv') || 
                    contentUrl.toLowerCase().includes('youtube') || 
                    contentUrl.toLowerCase().includes('vimeo') || 
                    contentUrl.toLowerCase().includes('embed')
                  ));
  
  console.log('Is Video:', isVideo);

  const handleOpenNewTab = () => {
    if (contentUrl) {
      window.open(contentUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (contentUrl) {
      const link = document.createElement('a');
      link.href = contentUrl;
      link.download = material.title || 'material';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="material-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{material.title}</h2>
          <div className="modal-actions">
            <button
              className="btn small"
              onClick={handleOpenNewTab}
              title="Open in new tab"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> New Tab
            </button>
            {isPdf && (
              <button
                className="btn small"
                onClick={handleDownload}
                title="Download PDF"
              >
                <i className="fa-solid fa-download"></i> Download
              </button>
            )}
            <button
              className="modal-close"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="material-content">
          {isPdf ? (
            <iframe
              src={`${contentUrl}#toolbar=1`}
              type="application/pdf"
              width="100%"
              height="600px"
              title={material.title}
              style={{ border: 'none', borderRadius: '8px' }}
            />
          ) : isVideo ? (
            contentUrl.includes('youtube') || contentUrl.includes('vimeo') ? (
              <iframe
                width="100%"
                height="600px"
                src={contentUrl}
                title={material.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '8px' }}
              />
            ) : (
              <video
                controls
                width="100%"
                height="auto"
                preload="metadata"
                style={{ maxHeight: '600px', borderRadius: '8px', backgroundColor: '#000' }}
                key={contentUrl}
                onError={(e) => {
                  console.error('Video load error:', e);
                  console.error('Video URL:', contentUrl);
                }}
                onLoadedMetadata={() => console.log('Video metadata loaded')}
              >
                <source 
                  src={contentUrl} 
                  type={contentUrl.toLowerCase().includes('.mp4') ? 'video/mp4' : 
                        contentUrl.toLowerCase().includes('.avi') ? 'video/x-msvideo' : 
                        contentUrl.toLowerCase().includes('.mov') ? 'video/quicktime' : 
                        contentUrl.toLowerCase().includes('.mkv') ? 'video/x-matroska' : 
                        'video/mp4'} 
                  onError={(e) => console.error('Source error:', e)}
                />
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <div style={{ padding: '20px', backgroundColor: '#1a1a1b', borderRadius: '8px' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{contentUrl}</p>
              {contentUrl && (
                <p style={{ marginTop: '20px', textAlign: 'center' }}>
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                  >
                    Open Link
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaterialModal;
