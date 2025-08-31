import React from 'react';

const ProfileEditSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto mt-16 relative">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse"></div>
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 bg-slate-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>

      <div className="mb-6 p-6 overflow-visible rounded-xl bg-gradient-to-r from-kibako-tertiary via-kibako-tertiary to-kibako-white shadow-lg border border-kibako-tertiary/30">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="border-b border-kibako-secondary/30 pb-2 mb-4"></div>

        <div className="space-y-6">
          <div>
            <div className="h-5 bg-slate-200 rounded w-1/5 mb-2 animate-pulse"></div>
            <div className="h-10 bg-slate-200 rounded w-full animate-pulse"></div>
          </div>
          <div className="flex justify-end">
            <div className="h-10 bg-slate-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditSkeleton;
