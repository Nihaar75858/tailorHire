// ============================================
// src/pages/profile/ProfilePage.jsx
// ============================================
import React, { useState } from "react";
import ProfileAvatar from "../../components/profile/ProfileAvatar";
import ProfileForm from "../../components/profile/ProfileForm";
import { useUser } from "../../components/hooks/useAuth";
import ApiService from "../../services/api";

const ProfilePage = () => {
  const { user, updateUser, loading } = useUser();
  const [editing, setEditing] = useState(false);

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       setLoading(true);
  //       const data = await ApiService.getProfile();
  //       updateUser(data);
  //     } catch (err) {
  //       console.error("Failed to update profile:", err);
  //       setError("Failed to load profile");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchProfile();
  // }, [updateUser]);

  const handleSubmit = async (formData) => {
    try {
      const updated = await ApiService.updateProfile(formData);
      updateUser({ ...user, ...updated });
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    }
  };

  const handleUpload = () => {
    alert("Upload profile picture functionality");
  };

  if (loading) {
    return <p className="text-center text-gray-600 p-6">Loading profile...</p>;
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600">
      <div className="max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Your Profile
          </h2>
          <p className="text-white">Manage your professional information</p>
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
