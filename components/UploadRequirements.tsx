import React, { useState } from 'react';

const UploadRequirements = ({ onUploadSuccess, selectedAd, customerInfo }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brandName: '',
    documentFile: null,
    photoFile: null,
    dispensaryAddress: '',
    webAddress: '',
    phoneNumber: '',
    instagram: '',
    logoFile: null
  });

  // Function to automatically detect state from current URL
  const getStateFromRoute = (): string => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes('/montana')) return 'MT';
      if (pathname.includes('/california')) return 'CA';
      if (pathname.includes('/illinois')) return 'IL';
      if (pathname.includes('/missouri')) return 'MO';
      if (pathname.includes('/oklahoma')) return 'OK';
      if (pathname.includes('/new-york')) return 'NY';
    }
    return 'Unknown';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleSubmit = async () => {
    if (!customerInfo?.email) {
      alert('Error: No customer information found. Please contact support.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      submitData.append('customerEmail', customerInfo.email);
      submitData.append('customerName', customerInfo.fullName);
      submitData.append('customerPhone', customerInfo.phone);
      
      // Automatically detect and include state
      const detectedState = getStateFromRoute();
      submitData.append('state', detectedState);
      console.log('Auto-detected state:', detectedState); // For debugging
      
      if (selectedAd) {
        submitData.append('selectedAd', JSON.stringify(selectedAd));
      }
      
      submitData.append('brandName', formData.brandName);
      submitData.append('dispensaryAddress', formData.dispensaryAddress);
      submitData.append('webAddress', formData.webAddress);
      submitData.append('phoneNumber', formData.phoneNumber);
      submitData.append('instagram', formData.instagram);
      
      if (formData.documentFile) {
        submitData.append('documentFile', formData.documentFile);
      }
      if (formData.photoFile) {
        submitData.append('photoFile', formData.photoFile);
      }
      if (formData.logoFile) {
        submitData.append('logoFile', formData.logoFile);
      }

      const response = await fetch('/api/upload-requirements', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (result.success) {
        onUploadSuccess();
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('There was an error uploading your files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customerInfo?.email) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: 'white', backgroundColor: 'black', minHeight: '100vh' }}>
        <h1>Loading customer information...</h1>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
          JISA <span style={{ color: '#4CAF50', fontStyle: 'italic' }}>Green Pages</span>
        </div>
        <nav style={{ display: 'flex', gap: '30px' }}>
          <a href="#about" style={{ color: '#fff', textDecoration: 'none' }}>ABOUT</a>
          <a href="#digital" style={{ color: '#fff', textDecoration: 'none' }}>DIGITAL</a>
          <a href="#print" style={{ color: '#fff', textDecoration: 'none' }}>PRINT</a>
          <a href="#contact" style={{ color: '#fff', textDecoration: 'none' }}>CONTACT</a>
        </nav>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '50px' }}>
          UPLOAD REQUIREMENTS
        </h1>

        {/* Customer Info Display with State Detection */}
        <div style={{ textAlign: 'center', marginBottom: '40px', padding: '20px', backgroundColor: '#333', borderRadius: '10px' }}>
          <p style={{ color: '#4CAF50' }}>Customer: {customerInfo.fullName} ({customerInfo.email})</p>
          <p style={{ color: '#4CAF50', fontSize: '14px', marginTop: '5px' }}>
            State: {getStateFromRoute()} 
            {getStateFromRoute() === 'Unknown' && ' (Please contact support if this is incorrect)'}
          </p>
        </div>

        {/* 1/4 Page Advertorial Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>1/4 PAGE ADVERTORIAL</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              name="brandName"
              placeholder="Dispensary/Brand Name"
              value={formData.brandName}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px 15px',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Document Upload */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: '#4CAF50', 
                borderRadius: '5px', 
                padding: '12px 15px', 
                cursor: 'pointer' 
              }}
              onClick={() => document.getElementById('document-upload').click()}
            >
              <input 
                type="file" 
                id="document-upload"
                accept=".txt,.docx,.pdf"
                onChange={(e) => handleFileChange(e, 'documentFile')}
                style={{ display: 'none' }}
              />
              <span style={{ color: '#000', fontSize: '16px', flex: 1 }}>
                {formData.documentFile ? formData.documentFile.name : 'Document Upload: .TXT .DOCX .PDF'}
              </span>
            </div>
            <div style={{ color: '#ccc', fontSize: '14px', marginTop: '5px', marginLeft: '15px' }}>
              Document Requirements: 50 - 60 Words
            </div>
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: '#4CAF50', 
                borderRadius: '5px', 
                padding: '12px 15px', 
                cursor: 'pointer' 
              }}
              onClick={() => document.getElementById('photo-upload').click()}
            >
              <input 
                type="file" 
                id="photo-upload"
                accept=".jpeg,.jpg,.png,.tiff"
                onChange={(e) => handleFileChange(e, 'photoFile')}
                style={{ display: 'none' }}
              />
              <span style={{ color: '#000', fontSize: '16px', flex: 1 }}>
                {formData.photoFile ? formData.photoFile.name : 'Photo Upload: .JPEG .PNG .TIFF'}
              </span>
            </div>
            <div style={{ color: '#ccc', fontSize: '14px', marginTop: '5px', marginLeft: '15px' }}>
              Photo Requirements: Landscape - min 1600px x 900px
            </div>
          </div>
        </div>

        {/* Single Listing Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>SINGLE LISTING</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              name="dispensaryAddress"
              placeholder="Dispensary Address"
              value={formData.dispensaryAddress}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px 15px',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input 
              type="url" 
              name="webAddress"
              placeholder="Web Address"
              value={formData.webAddress}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px 15px',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <input 
              type="tel" 
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              style={{
                flex: 1,
                padding: '12px 15px',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontSize: '16px'
              }}
            />
            <input 
              type="text" 
              name="instagram"
              placeholder="Instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              style={{
                flex: 1,
                padding: '12px 15px',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '5px',
                color: '#000',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        {/* Digital Listing Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>DIGITAL LISTING</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: '#4CAF50', 
                borderRadius: '5px', 
                padding: '12px 15px', 
                cursor: 'pointer' 
              }}
              onClick={() => document.getElementById('logo-upload').click()}
            >
              <input 
                type="file" 
                id="logo-upload"
                accept=".eps,.ai"
                onChange={(e) => handleFileChange(e, 'logoFile')}
                style={{ display: 'none' }}
              />
              <span style={{ color: '#000', fontSize: '16px', flex: 1 }}>
                {formData.logoFile ? formData.logoFile.name : 'Logo Upload: .EPS .AI'}
              </span>
            </div>
            <div style={{ color: '#ccc', fontSize: '14px', marginTop: '5px', marginLeft: '15px' }}>
              Logo Requirements: Vector File ONLY
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          style={{
            display: 'block',
            width: '300px',
            margin: '60px auto 0',
            padding: '15px 0',
            backgroundColor: isSubmitting ? '#666' : '#4CAF50',
            color: '#000',
            fontSize: '32px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '50px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'UPLOADING...' : 'SUBMIT'}
        </button>
      </div>

      <div style={{ padding: '40px', color: '#666', fontSize: '14px' }}>
        PRESENTED BY CANNABIS NOW & LIONTEK MEDIA
      </div>
    </div>
  );
};

export default UploadRequirements;