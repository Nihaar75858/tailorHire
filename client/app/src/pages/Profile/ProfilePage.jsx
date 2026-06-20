// ============================================
// src/pages/ProfilePage.jsx
// ============================================
import React, { useState } from "react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import ProfileForm from "../../components/profile/ProfileForm";
import { useUser } from "../../components/hooks/useAuth";

const ProfilePage = () => {
  const { user, updateUser } = useUser();
  const [editing, setEditing] = useState(false);

  console.log(user)

  const handleSubmit = (formData) => {
    // In production: call API to update profile
    updateUser({ ...user, ...formData });
    setEditing(false);
    alert("Profile updated successfully!");
  };

  const handleUpload = () => {
    alert("Upload profile picture functionality");
    // In production: implement file upload
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div className="max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Profile
          </h2>
          <p className="text-gray-600">Manage your professional information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 my-4">
          <ProfileAvatar
            imageUrl={user?.profile_picture}
            onUpload={handleUpload}
          />
        </div>

        <ProfileForm
          initialData={user}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
