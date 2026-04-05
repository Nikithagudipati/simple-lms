import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  apiCreateCourse, 
  apiGetInstructorCourses, 
  apiGetAllCourses, 
  apiAdminCreateCourse,
  apiUploadMaterial,
  apiCreateMaterialWithUrl,
  apiDeleteMaterial 
} from '../../utils/api';

function CreateCourse() {
  const { current } = useAuth();
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'intermediate'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materialType, setMaterialType] = useState('file'); // 'file' or 'url'
  const [materialFile, setMaterialFile] = useState(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialUrlType, setMaterialUrlType] = useState('video');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      // If admin, fetch all courses; else fetch instructor courses
      let response;
      if (current?.role === 'admin') {
        response = await apiGetAllCourses();
      } else {
        response = await apiGetInstructorCourses();
      }
      setCourses(response.data || []);
    } catch (err) {
      // Only show error if it's not a network issue
      console.error('Error loading courses:', err);
      // Don't set error here - just log it
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError('Please fill all fields');
      return;
    }

    try {
      setError('');
      setSuccess('');
      // If admin, use admin endpoint; else use instructor endpoint
      if (current?.role === 'admin') {
        await apiAdminCreateCourse(formData);
      } else {
        await apiCreateCourse(formData);
      }
      setSuccess('Course created successfully!');
      setFormData({ title: '', description: '', level: 'intermediate' });
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create course');
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError('Please select a course first');
      return;
    }

    if (materialType === 'file') {
      if (!materialFile || !materialTitle) {
        setError('Please select a file and provide a title');
        return;
      }

      try {
        setUploadingMaterial(true);
        setError('');
        await apiUploadMaterial(selectedCourse, materialFile, materialTitle);
        setSuccess('Material uploaded successfully!');
        setMaterialFile(null);
        setMaterialTitle('');
        // Reset file input
        document.getElementById('material-file-input').value = '';
        loadCourses();
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to upload material');
      } finally {
        setUploadingMaterial(false);
      }
    } else {
      if (!materialUrl || !materialTitle) {
        setError('Please provide URL and title');
        return;
      }

      try {
        setUploadingMaterial(true);
        setError('');
        await apiCreateMaterialWithUrl(selectedCourse, {
          title: materialTitle,
          type: materialUrlType,
          url: materialUrl
        });
        setSuccess('Material added successfully!');
        setMaterialUrl('');
        setMaterialTitle('');
        loadCourses();
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to add material');
      } finally {
        setUploadingMaterial(false);
      }
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await apiDeleteMaterial(materialId);
        setSuccess('Material deleted successfully!');
        loadCourses();
      } catch (err) {
        setError('Failed to delete material');
      }
    }
  };

  if (loading) return <div className="card"><p>Loading courses...</p></div>;

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <>
    <section className="card">
      <h2><i className="fa-solid fa-plus"></i> Create New Course</h2>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="create-quiz" style={{ marginBottom: '16px' }}>
        <form onSubmit={handleCreateCourse}>
          <label className="label">Course Title</label>
          <input
            type="text"
            placeholder="Enter course title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <label className="label">Description</label>
          <textarea
            placeholder="Enter course description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          ></textarea>
          <label className="label">Level</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn">Create Course</button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setFormData({ title: '', description: '', level: 'intermediate' })}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </section>

    {/* Material Upload Section */}
    <section className="card" style={{ marginTop: '24px' }}>
      <h2><i className="fa-solid fa-file-upload"></i> Add Course Materials</h2>
      
      {/* Course Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label className="label">Select Course</label>
        <select
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(Number(e.target.value))}
          style={{ width: '100%' }}
        >
          <option value="">-- Select a course --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          {/* Material Type Toggle */}
          <div style={{ marginBottom: '12px' }}>
            <label className="label">Material Type</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className={`btn ${materialType === 'file' ? '' : 'secondary'}`}
                onClick={() => setMaterialType('file')}
              >
                <i className="fa-solid fa-upload"></i> Upload File
              </button>
              <button
                type="button"
                className={`btn ${materialType === 'url' ? '' : 'secondary'}`}
                onClick={() => setMaterialType('url')}
              >
                <i className="fa-solid fa-link"></i> Add URL
              </button>
            </div>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadMaterial}>
            <label className="label">Material Title</label>
            <input
              type="text"
              placeholder="Enter material title"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              required
            />

            {materialType === 'file' ? (
              <>
                <label className="label" style={{ marginTop: '16px' }}>
                  Select File (PDF, Videos, Documents, Images - Max 50MB)
                </label>
                <input
                  id="material-file-input"
                  type="file"
                  accept=".pdf,.mp4,.avi,.mov,.mkv,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => setMaterialFile(e.target.files[0])}
                  style={{ 
                    marginTop: '8px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                {materialFile && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
                    Selected: {materialFile.name} ({(materialFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </>
            ) : (
              <>
                <label className="label" style={{ marginTop: '12px' }}>Material URL</label>
                <input
                  type="url"
                  placeholder="Enter material URL"
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  required
                />
                <label className="label" style={{ marginTop: '12px' }}>Type</label>
                <select
                  value={materialUrlType}
                  onChange={(e) => setMaterialUrlType(e.target.value)}
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="document">Document</option>
                </select>
              </>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button 
                type="submit" 
                className="btn"
                disabled={uploadingMaterial}
              >
                {uploadingMaterial ? 'Uploading...' : 'Add Material'}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setMaterialFile(null);
                  setMaterialTitle('');
                  setMaterialUrl('');
                  if (document.getElementById('material-file-input')) {
                    document.getElementById('material-file-input').value = '';
                  }
                }}
              >
                Clear
              </button>
            </div>
          </form>

          {/* Display existing materials */}
          {selectedCourseData && selectedCourseData.CourseMaterials && selectedCourseData.CourseMaterials.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Course Materials</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCourseData.CourseMaterials.map(material => (
                  <div
                    key={material.id}
                    style={{
                      padding: '12px',
                      background: '#2a2a2a',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{material.title}</span>
                      <span style={{ marginLeft: '10px', color: '#888', fontSize: '14px' }}>
                        ({material.type})
                      </span>
                      {material.url.startsWith('/uploads') && (
                        <span style={{ marginLeft: '10px', color: '#4CAF50', fontSize: '12px' }}>
                          <i className="fa-solid fa-upload"></i> Uploaded
                        </span>
                      )}
                    </div>
                    <button
                      className="btn small secondary"
                      onClick={() => handleDeleteMaterial(material.id)}
                      title="Delete material"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
    </>
  );
}

export default CreateCourse;
