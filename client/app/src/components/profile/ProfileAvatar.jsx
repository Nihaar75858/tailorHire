// ============================================
// src/components/profile/ProfileAvatar.jsx
// ============================================
import React from 'react';
import { User, Plus } from 'lucide-react';

const ProfileAvatar = ({ imageUrl, onUpload }) => {
  return (
    <div className="flex justify-center">
      <div className="relative">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-orange-600" />
          )}
        </div>
        <button
          onClick={onUpload}
          className="absolute bottom-0 right-0 p-2 bg-orange-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default ProfileAvatar;