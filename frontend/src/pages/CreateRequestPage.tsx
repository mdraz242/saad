import React from 'react';
import { InquiryForm } from '../components/InquiryForm';

export const CreateRequestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafafc] py-8 sm:py-14 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <InquiryForm />
      </div>
    </div>
  );
};
