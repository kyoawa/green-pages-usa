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
      console.log('Auto-detected state:', detectedState);
      
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-xl">Loading customer information...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
        <h1 className="text-3xl lg:text-5xl font-bold text-center mb-8 lg:mb-12">
          UPLOAD REQUIREMENTS
        </h1>

        {/* Customer Info Display */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 lg:mb-8">
          <p className="text-green-400 text-sm lg:text-base">
            Customer: {customerInfo.fullName} ({customerInfo.email})
          </p>
          <p className="text-green-400 text-xs lg:text-sm mt-1">
            State: {getStateFromRoute()}
            {getStateFromRoute() === 'Unknown' && ' (Please contact support if this is incorrect)'}
          </p>
        </div>

        {/* 1/4 Page Advertorial Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">1/4 PAGE ADVERTORIAL</h2>
          
          <div className="space-y-4">
            <input 
              type="text" 
              name="brandName"
              placeholder="Dispensary/Brand Name"
              value={formData.brandName}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            {/* Document Upload */}
            <div>
              <label className="block">
                <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                  <input 
                    type="file" 
                    accept=".txt,.docx,.pdf"
                    onChange={(e) => handleFileChange(e, 'documentFile')}
                    className="hidden"
                  />
                  <span className="text-black text-base block truncate">
                    {formData.documentFile ? formData.documentFile.name : 'Document Upload: .TXT .DOCX .PDF'}
                  </span>
                </div>
              </label>
              <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
                Document Requirements: 50 - 60 Words
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block">
                <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                  <input 
                    type="file" 
                    accept=".jpeg,.jpg,.png,.tiff"
                    onChange={(e) => handleFileChange(e, 'photoFile')}
                    className="hidden"
                  />
                  <span className="text-black text-base block truncate">
                    {formData.photoFile ? formData.photoFile.name : 'Photo Upload: .JPEG .PNG .TIFF'}
                  </span>
                </div>
              </label>
              <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
                Photo Requirements: Landscape - min 1600px x 900px
              </p>
            </div>
          </div>
        </div>

        {/* Single Listing Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">SINGLE LISTING</h2>
          
          <div className="space-y-4">
            <input 
              type="text" 
              name="dispensaryAddress"
              placeholder="Dispensary Address"
              value={formData.dispensaryAddress}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            <input 
              type="url" 
              name="webAddress"
              placeholder="Web Address"
              value={formData.webAddress}
              onChange={handleInputChange}
              className="w-full p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
              style={{ fontSize: '16px' }}
            />

            {/* Stack on mobile, side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="tel" 
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
              <input 
                type="text" 
                name="instagram"
                placeholder="Instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="p-3 lg:p-4 bg-green-600 text-black placeholder-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {/* Digital Listing Section */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">DIGITAL LISTING</h2>
          
          <div>
            <label className="block">
              <div className="bg-green-600 rounded-md p-3 lg:p-4 cursor-pointer hover:bg-green-700 transition-colors">
                <input 
                  type="file" 
                  accept=".eps,.ai,.svg,.pdf"
                  onChange={(e) => handleFileChange(e, 'logoFile')}
                  className="hidden"
                />
                <span className="text-black text-base block truncate">
                  {formData.logoFile ? formData.logoFile.name : 'Logo Upload: .EPS .AI .SVG .PDF'}
                </span>
              </div>
            </label>
            <p className="text-gray-400 text-xs lg:text-sm mt-1 ml-2">
              Logo Requirements: Vector File ONLY
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mt-10 lg:mt-12">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-black text-xl lg:text-2xl font-bold rounded-full transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'UPLOADING...' : 'SUBMIT'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadRequirements;